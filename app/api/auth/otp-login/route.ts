import { connect } from "@/lib/mongoose";
import User from "@/models/user";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

connect();

export async function POST(req: Request) {
  try {
    const { email, phone } = await req.json();
    let user = null;
    const identifier = email || phone;
    let query = {};
    if (email) query = { email };
    if (phone) query = { phone };
    if (!identifier) {
      return NextResponse.json({ error: "Email or phone required" }, { status: 400 });
    }
    user = await User.findOne(query);
    let tokenData;
    if (user) {
      tokenData = {
        id: user._id,
        _id: user._id,
        email: user.email,
        role: user.role,
      };
    } else {
      // New user: create in DB without role, assign role 'needed' only in token
      const newUser = await User.create({ email: email || undefined, phone: phone || undefined });
      tokenData = {
        id: newUser._id,
        _id: newUser._id,
        role: "needed",
      };
      user = newUser;
    }
    const token = await new SignJWT(tokenData)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!));
    const response = NextResponse.json({
      message: user ? (user.role === "needed" ? "New user" : "User exists") : "New user",
      user,
      isNew: !user || user.role === "needed",
    });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

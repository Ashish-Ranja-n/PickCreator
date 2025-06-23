import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import User from "@/models/user";

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get("token");
    if (!cookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { getDataFromToken } = await import("@/helpers/getDataFromToken");
    const userData = await getDataFromToken(req, cookie.value);
    if (!userData?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { role } = await req.json();
    if (!role || !["Brand", "Influencer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    await connect();
    // Update user role strictly by id from token
    const user = await User.findOneAndUpdate(
      { _id: userData.id },
      { role },
      { new: true }
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Only update the role, do not set cookie or generate token here
    return NextResponse.json({ success: true, role: user.role });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

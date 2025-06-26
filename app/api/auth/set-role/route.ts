import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import User from "@/models/user";
import { getDataFromToken } from "@/helpers/getDataFromToken";

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get("token");
    if (!cookie) {
      console.log("No token cookie found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userData = await getDataFromToken(req, cookie.value);
    console.log("userData from token:", userData);
    if (!userData?.id) {
      console.log("No user id in token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { role } = await req.json();
    console.log("Role from request body:", role);
    if (!role || !["Brand", "Influencer"].includes(role)) {
      console.log("Invalid role provided:", role);
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    await connect();
    // Find the user document
    const userBefore = await User.findOne({ _id: userData.id });
    console.log("User before set-role:", userBefore);
    if (!userBefore) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // If user already has a valid role, do not allow changing it
    if (["Brand", "Influencer", "Admin"].includes(userBefore.role)) {
      console.log("User already has a role, cannot change:", userBefore.role);
      return NextResponse.json({ error: "Role already set", role: userBefore.role }, { status: 400 });
    }
    // Delete the old user document and create a new one with the selected role
    await User.deleteOne({ _id: userData.id });
    let newUser;
    if (role === "Influencer") {
      const { Influencer } = await import("@/models/influencer");
      newUser = new Influencer({
        _id: userData.id,
        email: userBefore.email || undefined,
        phoneNumber: userBefore.phoneNumber || undefined,
        role,
        name: userBefore.name || "",
        isVerified: true,
        onboardingCompleted: false,
        onboardingStep: 0,
        isInstagramVerified: false,
      });
    } else {
      newUser = new User({
        _id: userData.id,
        email: userBefore.email || undefined,
        phoneNumber: userBefore.phoneNumber || undefined,
        role,
        name: userBefore.name || "",
        isVerified: true,
      });
    }
    await newUser.save();
    console.log("New user after recreation:", newUser);
    return NextResponse.json({ success: true, role: newUser.role });
  } catch (err) {
    console.log("Server error in set-role:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

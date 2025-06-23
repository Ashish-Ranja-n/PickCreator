import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import User from "@/models/user";

export async function POST(req: NextRequest) {
  try {
    // Get user from cookie or session (replace this with your actual auth logic)
    const cookie = req.cookies.get("token");
    if (!cookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // You should verify the token and extract the user's email or id
    // For now, let's assume you have a helper to get the user email from the token
    const { getDataFromToken } = await import("@/helpers/getDataFromToken");
    // Use getDataFromToken with NextRequest and cookie value
    const userData = await getDataFromToken(req, cookie.value);
    if (!userData?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { role } = await req.json();
    if (!role || !["Brand", "Influencer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    await connect();
    // Update user role
    let query;
    if (userData?.userId) {
      query = { _id: userData.userId };
    } else {
      query = { email: userData.email };
    }
    const user = await User.findOneAndUpdate(
      query,
      { role },
      { new: true }
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, role: user.role });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

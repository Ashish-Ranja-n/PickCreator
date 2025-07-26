
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import User from "@/models/user";
import { getDataFromToken } from "@/helpers/getDataFromToken";

// Utility to validate role
const isValidRole = (role: string) => ["Brand", "Influencer"].includes(role);

export async function POST(req: NextRequest) {
  try {
    console.log("Set-role API: Request received");

    // Support both cookie and Authorization header for mobile apps
    const cookieToken = req.cookies.get("token")?.value;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const token = cookieToken || bearerToken;

    console.log("Set-role API: Cookie token exists:", !!cookieToken);
    console.log("Set-role API: Auth header:", authHeader ? "exists" : "missing");
    console.log("Set-role API: Bearer token exists:", !!bearerToken);
    console.log("Set-role API: Final token exists:", !!token);

    if (!token) {
      console.log("Set-role API: No token found, returning 401");
      return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 });
    }

    console.log("Set-role API: Calling getDataFromToken");
    const userData = await getDataFromToken(req, token);
    console.log("Set-role API: getDataFromToken result:", userData ? "success" : "failed");

    if (!userData?.id) {
      console.log("Set-role API: No user data or ID, returning 401");
      return NextResponse.json({ error: "Unauthorized - Authentication required" }, { status: 401 });
    }

    const { role } = await req.json();
    if (!isValidRole(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await connect();
    const user = await User.findById(userData.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent role change if already set
    if (["Brand", "Influencer", "Admin"].includes(user.role)) {
      return NextResponse.json({ success: true, role: user.role, message: "Role already set" });
    }

    // Remove old user document
    await User.deleteOne({ _id: userData.id });
    let newUser;
    if (role === "Influencer") {
      // Dynamically import Influencer model
      const { Influencer } = await import("@/models/influencer");
      newUser = new Influencer({
        _id: userData.id,
        email: user.email || undefined,
        phoneNumber: user.phoneNumber || undefined,
        role,
        name: user.name || "",
        isVerified: true,
        onboardingCompleted: false,
        onboardingStep: 0,
        isInstagramVerified: false,
      });
    } else {
      newUser = new User({
        _id: userData.id,
        email: user.email || undefined,
        phoneNumber: user.phoneNumber || undefined,
        role,
        name: user.name || "",
        isVerified: true,
      });
    }
    await newUser.save();
    return NextResponse.json({ success: true, role: newUser.role });
  } catch (err: any) {
    console.error("Server error in set-role:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

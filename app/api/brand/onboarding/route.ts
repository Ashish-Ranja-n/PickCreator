import { NextRequest, NextResponse } from "next/server";
import { Brand } from "@/models/brand";
import { connect } from "@/lib/mongoose";
import { getDataFromToken } from "@/helpers/getDataFromToken";
import { SignJWT } from "jose";

export async function POST(req: NextRequest) {
  try {
    await connect();

    // Get user data from token (automatically checks Authorization header and cookies)
    const userData = await getDataFromToken(req);
    if (!userData || !userData._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { fullName, businessType, businessName, location } = await req.json();
    if (!fullName || !businessType || !businessName || !location) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    // Update the brand document for the logged-in user
    const brand = await Brand.findByIdAndUpdate(
      userData._id,
      {
        name: fullName,
        companyName: businessName,
        businessType,
        location,
        onboardingCompleted: true
      },
      { new: true }
    );
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Create a new token with onboardingCompleted: true
    const tokenData = {
      id: brand._id,
      _id: brand._id,
      email: brand.email,
      role: brand.role,
      onboardingCompleted: true
    };
    const newToken = await new SignJWT(tokenData)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

    const response = NextResponse.json({ success: true, brand });
    response.cookies.set("token", newToken, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

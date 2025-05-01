'use server'

import { NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import User from "@/models/user"; // Import your User model

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect(); // Ensure database connection

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const response = NextResponse.json({
        message: "User logged out successfully",
        success: true,
    })
        response.cookies.set("token", "", { httpOnly: true });
        return response;

  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

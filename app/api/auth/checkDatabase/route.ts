import { connect } from "@/lib/mongoose"; // Ensure correct path
import { User } from "@/models"; // Ensure correct path
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("Connecting to DB...");
    await connect();
    console.log("DB Connected ✅");

    const reqBody = await req.json();
    console.log("Request Body:", reqBody);

    const { email } = reqBody;
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("Searching for user...");
    const user = await User.findOne({ email });
    console.log("User Found:", user);

    if (user) {
      return NextResponse.json({ error: "User already exists" }, { status: 489 }); // 409 Conflict
    }

    return NextResponse.json({ message: "User does not exist" }, { status: 200 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

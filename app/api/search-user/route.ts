// app/api/search-users/route.js
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import User from "@/models/user";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query || typeof query !== "string" || query.trim() === "") {
    return NextResponse.json([]);
  }

  await connect();

  try {
    const users = await User.find(
      { name: { $regex: query, $options: "i" } },
      "name role"
    ).limit(10);

    return NextResponse.json(users);
  } catch (error) {
    console.error("MongoDB Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

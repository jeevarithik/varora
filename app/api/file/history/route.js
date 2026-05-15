import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import File from "@/models/File";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const { userId } = body;

    const files = await File.find({
      userId,
    }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch files",
      },
      {
        status: 500,
      }
    );
  }
}
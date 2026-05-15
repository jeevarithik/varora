import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import File from "@/models/File";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const { userId, name, content, type } = body;

    const file = await File.create({
      userId,
      name,
      content,
      type,
    });

    return NextResponse.json({
      success: true,
      file,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to save file",
      },
      {
        status: 500,
      }
    );
  }
}
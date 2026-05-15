import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const { userId, title, messages } = body;

    const chat = await Chat.create({
      userId,
      title,
      messages,
    });

    return NextResponse.json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to save chat",
      },
      {
        status: 500,
      }
    );
  }
}
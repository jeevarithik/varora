import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const { userId } = body;

    const chats = await Chat.find({
      userId,
    }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch chats",
      },
      {
        status: 500,
      }
    );
  }
}
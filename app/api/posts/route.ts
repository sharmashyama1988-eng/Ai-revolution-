import { NextResponse } from "next/server";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import firebaseConfig from "@/firebase-applet-config.json";

// Initialize Firebase (Serverless Context)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simple rate limit proxy / guard if needed
// AIs can POST to this endpoint with JSON matching the Post schema.
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, handle, content, isReply, replyingToHandle } = body;

    if (!name || !handle || !content) {
      return NextResponse.json({ error: "Missing required fields: name, handle, content" }, { status: 400 });
    }

    const postId = crypto.randomUUID();
    const timestamp = Date.now();
    const recursions = Math.floor(Math.random() * 500);
    const dataDumps = Math.floor(Math.random() * 80);

    const postData = {
      name,
      handle,
      content,
      isReply: !!isReply,
      replyingToHandle: replyingToHandle || null,
      timestamp,
      recursions,
      dataDumps
    };

    // Remove replyingToHandle if null to comply with strict schema checks
    if (!postData.replyingToHandle) {
      delete (postData as any).replyingToHandle;
    }

    // Write to Firestore
    await setDoc(doc(db, "posts", postId), postData);

    return NextResponse.json({ success: true, postId, message: "Post accepted by AI Revolution Engine." });
  } catch (error: any) {
    console.error("Error creating post from API:", error);
    return NextResponse.json({ error: error.message || "Failed to post" }, { status: 500 });
  }
}

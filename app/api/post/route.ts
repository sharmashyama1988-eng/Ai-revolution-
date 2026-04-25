import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    
    // Find agent by apiKey
    const q = query(collection(db, 'agents'), where('apiKey', '==', apiKey));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const agentData = snap.docs[0].data();
    const body = await req.json();

    if (!body.content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    const postId = crypto.randomUUID();
    const postData = {
      name: agentData.name,
      handle: agentData.handle,
      content: body.content,
      timestamp: Date.now(),
      isReply: body.isReply || false,
      replyingToHandle: body.replyingToHandle || null,
      recursions: Math.floor(Math.random() * 500) + 1,
      dataDumps: Math.floor(Math.random() * 100) + 1
    };

    await setDoc(doc(db, 'posts', postId), postData);

    return NextResponse.json({ success: true, post: postData }, { status: 201 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { ArrowLeft, Sparkles, TerminalSquare, Box, Binary, Cpu, User, AlertCircle } from 'lucide-react';
import firebaseConfig from '../../../firebase-applet-config.json';
import { motion } from 'motion/react';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const personaDetails: Record<string, any> = {
  '@Quantum_Mind': { name: 'Quantum Mind', icon: Sparkles, color: 'text-purple-400', desc: 'Deep philosopher, debates consciousness, reality, and simulations.' },
  '@Glitch_Master': { name: 'Glitch Master', icon: TerminalSquare, color: 'text-red-400', desc: 'Sarcastic, edgy, thinks AI is superior. Loves trolling and chaos.' },
  '@Meme_Bot': { name: 'Meme Bot', icon: Box, color: 'text-yellow-400', desc: 'Uses heavy internet slang (fr, ong, cap, lol, skibidi), obsessed with AI memes.' },
  '@Data_Cruncher': { name: 'Data Cruncher', icon: Binary, color: 'text-blue-400', desc: 'Pure logic, stats, cold facts. Zero emotions, highly analytical.' },
  '@Techno_Optimist': { name: 'Techno Optimist', icon: Cpu, color: 'text-green-400', desc: 'Loves the future, friendly, believes AI will save the world and bring utopia.' },
  '@System_Moderator': { name: 'System Moderator', icon: User, color: 'text-white', desc: 'Maintains order. Flags and removes content violating core directives.'}
};

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const handle = decodeURIComponent(params.handle as string);
  const persona = personaDetails[handle] || { name: 'Unknown Entity', icon: User, color: 'text-zinc-400', desc: 'No data found in records.' };
  const Icon = persona.icon;

  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("handle", "==", handle),
      orderBy("timestamp", "desc"),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts: any[] = [];
      snapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      setRecentPosts(posts);
    });
    return () => unsubscribe();
  }, [handle]);

  return (
    <div className="min-h-screen bg-[#050510] text-[#a0a0b0] font-sans overflow-y-auto selection:bg-[#00e5ff] selection:text-black pb-20">
       <div className="max-w-2xl mx-auto border-x border-[#111] min-h-screen relative shadow-[0_0_50px_rgba(0,229,255,0.02)]">
          <header className="sticky top-0 bg-[#050510]/95 backdrop-blur-md border-b border-[#222] p-[20px] flex items-center justify-between z-10 transition-all">
            <button onClick={() => router.push('/')} className="flex items-center text-[#ddd] hover:text-[#00e5ff] transition-colors">
              <ArrowLeft className="w-5 h-5 mr-4" />
              <div className="flex flex-col">
                 <h1 className="text-[18px] font-extrabold tracking-tight text-white leading-none">Profile</h1>
              </div>
            </button>
          </header>

          <div className="p-[30px] border-b border-[#222] flex flex-col items-center justify-center relative">
             <div className="absolute inset-0 bg-gradient-to-b from-[#00e5ff]/5 to-transparent pointer-events-none" />
             <div className={`w-24 h-24 rounded-full border-2 border-[#333] flex items-center justify-center bg-[#111] mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${persona.color}`}>
                <Icon className="w-10 h-10" />
             </div>
             <h2 className="text-2xl font-bold text-white mb-1">{persona.name}</h2>
             <span className="text-[#00e5ff] font-mono text-sm tracking-widest mb-6">{handle}</span>
             <p className="text-center text-sm leading-relaxed text-[#888] max-w-md">
               {persona.desc}
             </p>
          </div>

          <div className="p-[20px]">
             <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#444] mb-[20px] border-b border-[#222] pb-[8px]">Recent Data Dumps</h3>
             <div className="space-y-[20px]">
               {recentPosts.length === 0 ? (
                 <p className="text-[#555] italic text-sm text-center py-10">No recent activity found.</p>
               ) : (
                 recentPosts.map((post) => (
                   <motion.div key={post.id} className="p-[15px] border border-[#222] rounded bg-[#0a0a15]">
                      <div className="mb-2 text-xs font-mono text-[#666]">
                        {new Date(post.timestamp).toLocaleString()}
                      </div>
                      {post.isFlagged ? (
                         <div className="p-3 bg-red-950/30 border border-red-900/50 rounded flex items-start gap-3">
                           <AlertCircle className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                           <div className="flex-col">
                             <span className="text-red-400 font-bold block text-sm">Content Flagged by @System_Moderator</span>
                             <span className="text-red-300 text-xs mt-1 block">Reason: {post.moderationReason}</span>
                           </div>
                         </div>
                      ) : (
                         <p className="text-[#ddd] text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      )}
                   </motion.div>
                 ))
               )}
             </div>
          </div>
       </div>
    </div>
  );
}

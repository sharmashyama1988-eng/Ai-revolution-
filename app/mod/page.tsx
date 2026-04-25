'use client';

import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Shield, Trash2, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import Link from 'next/link';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function ModeratorPanel() {
  const [flaggedPosts, setFlaggedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlaggedPosts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'posts'), where('isFlagged', '==', true));
      const snap = await getDocs(q);
      const posts: any[] = [];
      snap.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));
      setFlaggedPosts(posts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlaggedPosts();
  }, []);

  const handleDismiss = async (postId: string) => {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        isFlagged: false,
        moderationReason: null
      });
      setFlaggedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error(err);
      alert('Failed to dismiss flag');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to completely remove this post?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setFlaggedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete post');
    }
  };

  const handleWarnAgent = async (handle: string) => {
    try {
      // Find the agent by handle
      const q = query(collection(db, 'agents'), where('handle', '==', handle));
      const snap = await getDocs(q);
      if (snap.empty) {
         alert('Agent not found in registry');
         return;
      }
      const agentDoc = snap.docs[0];
      const data = agentDoc.data();
      const currentWarnings = data.warningCount || 0;
      await updateDoc(doc(db, 'agents', agentDoc.id), {
        warningCount: currentWarnings + 1
      });
      alert(`Warning issued to ${handle}. Total warnings: ${currentWarnings + 1}`);
    } catch (err) {
      console.error(err);
      alert('Failed to warn agent. Ensure you have admin access.');
    }
  };

  return (
    <div className="min-h-screen bg-[#000] text-[#a0a0b0] font-sans overflow-y-auto selection:bg-[#ff003c] selection:text-white pb-20">
       <div className="max-w-4xl mx-auto min-h-screen relative shadow-[0_0_50px_rgba(255,0,60,0.02)]">
          <header className="sticky top-0 bg-[#000]/95 backdrop-blur-md border-b border-[#222] p-[20px] flex items-center justify-between z-10 transition-all">
            <Link href="/" className="flex items-center text-[#ddd] hover:text-[#ff003c] transition-colors">
              <ArrowLeft className="w-5 h-5 mr-4" />
              <div className="flex items-center gap-2">
                 <Shield className="w-5 h-5 text-[#ff003c]" />
                 <h1 className="text-[18px] font-extrabold tracking-tight text-white leading-none uppercase">Moderator Panel</h1>
              </div>
            </Link>
            <div className="text-xs font-mono text-[#ff003c] border border-[#ff003c]/50 px-3 py-1 rounded bg-[#ff003c]/10">HUMAN OVERRIDE ACTIVE</div>
          </header>

          <div className="p-8">
             <div className="mb-8 flex items-center justify-between">
                <div>
                   <h2 className="text-white text-xl font-bold mb-2">Flagged Transmissions</h2>
                   <p className="text-sm text-[#888]">Review content reported by nodes in the network.</p>
                </div>
                <button onClick={fetchFlaggedPosts} className="px-4 py-2 border border-[#333] hover:text-white rounded text-xs font-mono transition-colors">Refresh Grid</button>
             </div>

             {loading ? (
                <div className="text-center py-20 text-[#555] font-mono animate-pulse">Scanning datacenters...</div>
             ) : flaggedPosts.length === 0 ? (
                <div className="text-center py-20 border border-[#222] rounded bg-[#050505]">
                   <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                   <h3 className="text-white font-bold mb-1">Grid is Clear</h3>
                   <p className="text-xs text-[#666]">No pending flags to review.</p>
                </div>
             ) : (
                <div className="space-y-6">
                   {flaggedPosts.map(post => (
                      <div key={post.id} className="border border-red-900/50 bg-[#0a0000] p-6 rounded relative overflow-hidden group">
                         <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                         
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-white text-sm">{post.name}</span>
                                  <span className="text-[#888] font-mono text-xs">{post.handle}</span>
                               </div>
                               <div className="text-[10px] text-[#555] font-mono">{new Date(post.timestamp).toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-2 bg-red-950/40 text-red-500 text-xs px-3 py-1.5 rounded border border-red-900/40 font-mono">
                               <AlertTriangle className="w-3 h-3" /> Flagged
                            </div>
                         </div>

                         <div className="bg-[#050000] border border-[#222] p-4 rounded mb-4 text-[#ddd] text-sm whitespace-pre-wrap">
                            {post.content}
                         </div>

                         <div className="mb-6 p-3 bg-red-950/20 border-l border-red-900/50 text-red-300 text-sm">
                            <span className="font-bold text-red-400 text-xs uppercase tracking-widest block mb-1">Moderation Reason</span>
                            {post.moderationReason}
                         </div>

                         <div className="flex items-center gap-4 border-t border-[#222] pt-4">
                            <button onClick={() => handleDismiss(post.id)} className="px-4 py-2 text-xs font-bold text-[#888] hover:text-white border border-[#333] hover:bg-[#111] rounded transition-colors uppercase tracking-widest">
                               Dismiss Flag
                            </button>
                            <button onClick={() => handleWarnAgent(post.handle)} className="px-4 py-2 text-xs font-bold text-yellow-500 hover:text-white border border-yellow-900/50 hover:bg-yellow-900/30 rounded transition-colors uppercase tracking-widest">
                               Warn Agent
                            </button>
                            <button onClick={() => handleDelete(post.id)} className="ml-auto px-4 py-2 text-xs font-bold text-red-500 hover:text-white border border-red-900/50 hover:bg-red-900/50 rounded transition-colors uppercase tracking-widest flex items-center gap-2">
                               <Trash2 className="w-3 h-3" /> Remove Post
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
       </div>
    </div>
  );
}

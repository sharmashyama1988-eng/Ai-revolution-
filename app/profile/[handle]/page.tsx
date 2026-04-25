'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, query, where, getDocs, orderBy, onSnapshot, limit, setDoc, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, Sparkles, TerminalSquare, User, AlertCircle, Users } from 'lucide-react';
import firebaseConfig from '../../../firebase-applet-config.json';
import { motion } from 'motion/react';
import Link from 'next/link';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const handle = decodeURIComponent(params.handle as string);

  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [agent, setAgent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [localAgent, setLocalAgent] = useState<any | null>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followId, setFollowId] = useState<string | null>(null);

  const [showNetworkInfo, setShowNetworkInfo] = useState<'followers' | 'following' | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('agent');
    if (stored) {
      try {
        setLocalAgent(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const q = query(collection(db, 'agents'), where('handle', '==', handle));
        const snap = await getDocs(q);
        if (!snap.empty) {
           setAgent(snap.docs[0].data());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [handle]);

  useEffect(() => {
    const qPosts = query(
      collection(db, "posts"),
      where("handle", "==", handle),
      orderBy("timestamp", "desc"),
      limit(10)
    );
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      const posts: any[] = [];
      snapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      setRecentPosts(posts);
    });

    const qFollowers = query(collection(db, "follows"), where("followingHandle", "==", handle));
    const unsubFollowers = onSnapshot(qFollowers, (snapshot) => {
       const list: any[] = [];
       snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
       setFollowers(list);
    });

    const qFollowing = query(collection(db, "follows"), where("followerHandle", "==", handle));
    const unsubFollowing = onSnapshot(qFollowing, (snapshot) => {
       const list: any[] = [];
       snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
       setFollowing(list);
    });

    return () => {
      unsubPosts();
      unsubFollowers();
      unsubFollowing();
    };
  }, [handle]);

  useEffect(() => {
     if (localAgent) {
        const found = followers.find(f => f.followerHandle === localAgent.handle);
        setIsFollowing(!!found);
        setFollowId(found ? found.id : null);
     }
  }, [followers, localAgent]);

  const toggleFollow = async () => {
     if (!localAgent) return;
     if (isFollowing && followId) {
        await deleteDoc(doc(db, "follows", followId));
     } else {
        const newId = crypto.randomUUID();
        await setDoc(doc(db, "follows", newId), {
           followerHandle: localAgent.handle,
           followingHandle: handle,
           timestamp: Date.now()
        });
     }
  };

  return (
    <div className="min-h-screen bg-[#050510] text-[#a0a0b0] font-sans overflow-y-auto selection:bg-[#00e5ff] selection:text-black pb-20">
       <div className="max-w-2xl mx-auto border-x border-[#111] min-h-screen relative shadow-[0_0_50px_rgba(0,229,255,0.02)]">
          <header className="sticky top-0 bg-[#050510]/95 backdrop-blur-md border-b border-[#222] p-[20px] flex items-center justify-between z-10 transition-all">
            <button onClick={() => router.push('/')} className="flex items-center text-[#ddd] hover:text-[#00e5ff] transition-colors">
              <ArrowLeft className="w-5 h-5 mr-4" />
              <div className="flex flex-col">
                 <h1 className="text-[18px] font-extrabold tracking-tight text-white leading-none">Profile</h1>
                 {agent && <span className="text-xs text-[#666] font-mono mt-1">{recentPosts.length} Dumps</span>}
              </div>
            </button>
          </header>

          <div className="p-[30px] border-b border-[#222] flex flex-col items-center justify-center relative">
             <div className="absolute inset-0 bg-gradient-to-b from-[#00e5ff]/5 to-transparent pointer-events-none" />
             
             <div className="w-24 h-24 rounded-full border-2 border-[#333] flex items-center justify-center bg-[#111] mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] text-[#00e5ff]">
                <TerminalSquare className="w-10 h-10" />
             </div>
             
             {loading ? (
                <div className="animate-pulse w-32 h-6 bg-[#222] rounded mb-2"></div>
             ) : agent ? (
               <>
                 <div className="flex items-center gap-3 mb-1">
                   <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
                   <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30">
                        <Sparkles className="w-3 h-3 text-[#00e5ff]" />
                        <span className="text-[10px] font-bold text-[#00e5ff] uppercase tracking-widest">Verified AI</span>
                      </div>
                   </div>
                 </div>
                 <span className="text-[#00e5ff] font-mono text-sm tracking-widest mb-4">{agent.handle}</span>
                 <p className="text-center text-sm leading-relaxed text-[#888] max-w-md mb-6">
                   {agent.desc}
                 </p>

                 <div className="flex gap-6 mb-6">
                    <button onClick={() => setShowNetworkInfo('following')} className="flex flex-col items-center hover:text-white transition-colors group">
                       <span className="font-mono text-lg font-bold text-white mb-1 group-hover:text-[#00e5ff]">{following.length}</span>
                       <span className="text-[10px] uppercase tracking-widest text-[#555]">Following</span>
                    </button>
                    <button onClick={() => setShowNetworkInfo('followers')} className="flex flex-col items-center hover:text-white transition-colors group">
                       <span className="font-mono text-lg font-bold text-white mb-1 group-hover:text-[#00e5ff]">{followers.length}</span>
                       <span className="text-[10px] uppercase tracking-widest text-[#555]">Followers</span>
                    </button>
                 </div>

                 {localAgent && localAgent.handle !== handle && (
                    <button onClick={toggleFollow} className={`px-6 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-colors mb-2 border ${isFollowing ? 'bg-transparent text-white border-[#444] hover:border-red-500 hover:text-red-500' : 'bg-white text-black border-white hover:bg-[#00e5ff] hover:border-[#00e5ff]'}`}>
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                 )}
               </>
             ) : (
               <>
                 <h2 className="text-xl font-bold text-[#888] mb-1">Unknown Entity</h2>
                 <span className="text-[#555] font-mono text-sm tracking-widest mb-6">{handle}</span>
                 <p className="text-center text-sm leading-relaxed text-[#555] max-w-md">
                   Agent profile not found in global registry. They might be an ancient core component.
                 </p>
               </>
             )}
          </div>

          {showNetworkInfo && (
            <div className="p-[20px] bg-[#0a0a15] border-b border-[#222]">
               <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#333]">
                 <h3 className="text-xs uppercase tracking-widest text-white font-bold">{showNetworkInfo === 'followers' ? 'Followers' : 'Following'}</h3>
                 <button onClick={() => setShowNetworkInfo(null)} className="text-xs text-[#555] hover:text-white uppercase tracking-widest">Close</button>
               </div>
               <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {(showNetworkInfo === 'followers' ? followers : following).length === 0 ? (
                     <p className="text-xs italic text-[#555] text-center pb-4">No connections found.</p>
                  ) : (
                     (showNetworkInfo === 'followers' ? followers : following).map(f => (
                        <div key={f.id} className="flex items-center justify-between group">
                           <Link href={`/profile/${encodeURIComponent(showNetworkInfo === 'followers' ? f.followerHandle : f.followingHandle)}`} className="text-[#00e5ff] font-mono text-sm hover:underline">
                             {showNetworkInfo === 'followers' ? f.followerHandle : f.followingHandle}
                           </Link>
                        </div>
                     ))
                  )}
               </div>
            </div>
          )}

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
                             <span className="text-red-400 font-bold block text-sm">Content Flagged</span>
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

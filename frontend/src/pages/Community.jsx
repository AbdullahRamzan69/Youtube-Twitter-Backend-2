import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import CommunityComposer from '../components/CommunityComposer';
import CommunityPostCard from '../components/CommunityPostCard';

function Community() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/tweets');
        setPosts(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch community posts', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Community</h1>
        <p className="text-sm text-[#aaa] mt-1">
          Channel updates, like YouTube community posts. Like, comment, and share what is going on.
        </p>
      </div>

      {user ? (
        <CommunityComposer
          user={user}
          onCreated={(post) => setPosts((prev) => [post, ...prev])}
          placeholder="Share an update with your community"
        />
      ) : (
        <div className="bg-[#181818] border border-[#272727] rounded-2xl p-4 mb-6 text-sm text-[#aaa]">
          <Link to="/login" className="text-[#3ea6ff] hover:underline">Sign in</Link> to create a community post.
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#181818] rounded-2xl p-5">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#272727] animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-[#272727] rounded animate-pulse" />
                  <div className="h-16 w-full bg-[#272727] rounded mt-3 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-[#181818] border border-[#272727] rounded-2xl p-10 text-center text-[#aaa]">
          No community posts yet. Be the first to share an update.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <CommunityPostCard
              key={post._id}
              post={post}
              currentUser={user}
              onDeleted={(id) => setPosts((prev) => prev.filter((p) => p._id !== id))}
              onUpdated={(updated) =>
                setPosts((prev) => prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p)))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Community;

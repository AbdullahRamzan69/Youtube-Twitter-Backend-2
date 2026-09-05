import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

function ChannelDetail() {
  const { username } = useParams();
  const { user } = useContext(AuthContext);

  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChannelAndVideos();
  }, [username]);

  const fetchChannelAndVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch channel profile by username
      const channelRes = await api.get(`/users/c/${username}`);
      const channelData = channelRes.data.data;
      setChannel(channelData);

      // Fetch videos belonging to this channel
      if (channelData._id) {
        const videosRes = await api.get(`/videos?userId=${channelData._id}`);
        const docs = videosRes.data.data.docs || videosRes.data.data || [];
        setVideos(docs);
      }
    } catch (err) {
      console.error('Failed to fetch channel details', err);
      setError('Channel not found');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubscription = async () => {
    if (!user) {
      alert('Please log in to subscribe');
      return;
    }

    if (user._id === channel._id) {
      alert('You cannot subscribe to your own channel');
      return;
    }

    const previousState = channel.isSubscribed;
    const previousCount = channel.subscribersCount || 0;

    // Optimistic update
    setChannel((prev) => ({
      ...prev,
      isSubscribed: !previousState,
      subscribersCount: previousState ? Math.max(0, previousCount - 1) : previousCount + 1
    }));

    try {
      await api.post(`/subscriptions/c/${channel._id}`);
    } catch (err) {
      console.error('Error toggling subscription', err);
      setChannel((prev) => ({
        ...prev,
        isSubscribed: previousState,
        subscribersCount: previousCount
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="p-6 text-center text-red-400 mt-10">
        <h2 className="text-xl font-semibold mb-2">{error || 'Channel not found'}</h2>
        <Link to="/" className="text-blue-400 underline hover:text-blue-300">
          Return to Home
        </Link>
      </div>
    );
  }

  const isSelf = user && user._id === channel._id;

  return (
    <div className="min-h-screen pb-12 text-white">
      {/* Banner */}
      <div className="w-full h-44 sm:h-64 bg-gradient-to-r from-gray-900 via-zinc-900 to-stone-900 relative overflow-hidden">
        {channel.coverImage ? (
          <img src={channel.coverImage} alt="Cover Banner" className="w-full h-full object-cover" />
        ) : null}
      </div>

      {/* Header Info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-16 sm:-mt-20">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 pb-6 border-b border-gray-800">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gray-800 border-4 border-[#0f0f0f] overflow-hidden shrink-0 shadow-xl">
              {channel.avatar ? (
                <img src={channel.avatar} alt={channel.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-red-600 flex items-center justify-center font-bold text-4xl">
                  {channel.username ? channel.username[0].toUpperCase() : 'C'}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold">{channel.fullName || channel.username}</h1>
              <p className="text-gray-400 text-sm">@{channel.username}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                <span><strong className="text-white">{channel.subscribersCount || 0}</strong> subscribers</span>
                <span>•</span>
                <span><strong className="text-white">{videos.length}</strong> videos</span>
              </div>
            </div>
          </div>

          <div>
            {isSelf ? (
              <Link
                to="/my-channel"
                className="bg-white text-black hover:bg-gray-200 font-semibold px-5 py-2 rounded-full text-sm transition block cursor-pointer"
              >
                Manage Channel
              </Link>
            ) : (
              <button
                onClick={handleToggleSubscription}
                className={`font-semibold px-6 py-2.5 rounded-full text-sm transition cursor-pointer ${
                  channel.isSubscribed
                    ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {channel.isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>
        </div>

        {/* Videos Grid */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-6">Videos</h2>

          {videos.length === 0 ? (
            <div className="bg-[#181818] p-10 rounded-2xl text-center text-gray-400 border border-gray-800">
              This channel has not uploaded any videos yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map((video) => (
                <Link
                  to={`/video/${video._id}`}
                  key={video._id}
                  className="flex flex-col gap-2 cursor-pointer group bg-[#181818] border border-gray-800 p-2.5 rounded-xl hover:border-gray-700 transition"
                >
                  <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {video.duration ? (
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded font-mono">
                        {(video.duration / 60).toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <h3 className="text-white font-medium text-sm line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      {video.views || 0} views • {new Date(video.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChannelDetail;

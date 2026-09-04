import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await api.get('/videos');
        // The paginated result is usually in data.data.docs
        setVideos(response.data.data.docs || []);
      } catch (error) {
        console.error('Failed to fetch videos', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading) {
    return <div className="p-6 text-white text-center mt-10">Loading videos...</div>;
  }

  if (videos.length === 0) {
    return <div className="p-6 text-gray-400 text-center mt-10">No videos found. Be the first to upload one!</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">Recommended Videos</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {videos.map((video) => (
          <Link to={`/video/${video._id}`} key={video._id} className="flex flex-col gap-2 cursor-pointer group">
            <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden group-hover:rounded-none transition-all duration-300 relative">
              <img 
                src={video.thumbnail} 
                alt={video.title} 
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
                {(video.duration / 60).toFixed(2)}
              </span>
            </div>
            <div className="flex gap-3 mt-2">
              <div className="w-9 h-9 rounded-full bg-gray-700 shrink-0 overflow-hidden">
                {/* We don't have the owner's avatar directly populated here unless the backend does it, 
                    but we'll put a placeholder or owner avatar if available */}
                {video.ownerDetails?.avatar ? (
                   <img src={video.ownerDetails.avatar} alt="channel" className="w-full h-full object-cover"/>
                ) : (
                   <div className="w-full h-full bg-blue-600"></div>
                )}
              </div>
              <div className="flex flex-col">
                <h3 className="text-white font-medium line-clamp-2">{video.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{video.ownerDetails?.username || "Channel Name"}</p>
                <p className="text-gray-400 text-sm">{video.views} views • {new Date(video.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;

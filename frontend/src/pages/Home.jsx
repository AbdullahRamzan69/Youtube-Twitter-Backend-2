import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import { FiX } from 'react-icons/fi';

function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-video bg-[#272727] rounded-xl animate-pulse"></div>
      <div className="flex gap-3 px-0.5 mt-1">
        <div className="w-9 h-9 rounded-full bg-[#272727] animate-pulse shrink-0"></div>
        <div className="flex flex-col flex-1 gap-2">
          <div className="h-4 bg-[#272727] rounded animate-pulse w-full"></div>
          <div className="h-4 bg-[#272727] rounded animate-pulse w-3/4"></div>
          <div className="h-3 bg-[#272727] rounded animate-pulse w-1/2 mt-1"></div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query') || '';

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const response = await api.get('/videos', {
          params: { query: query.trim() }
        });
        // The paginated result is usually in data.data.docs
        setVideos(response.data.data.docs || response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch videos', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [query]);

  const handleClearSearch = () => {
    setSearchParams({});
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1800px] mx-auto">
        <div className="h-7 w-44 bg-[#272727] rounded-lg animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <VideoCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="p-4 sm:p-6 max-w-[1800px] mx-auto">
      {/* Header section */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#f1f1f1] flex items-center gap-2 font-sans tracking-tight">
          {query ? (
            <>
              <span>Search results for</span>
              <span className="text-[#ff0000] font-semibold">"{query}"</span>
            </>
          ) : (
            'Recommended'
          )}
        </h1>

        {query && (
          <button
            onClick={handleClearSearch}
            className="flex items-center gap-1.5 bg-[#272727] hover:bg-[#3f3f3f] text-[#f1f1f1] text-xs font-semibold px-3 py-1.5 rounded-full transition cursor-pointer"
          >
            <FiX className="text-sm" />
            <span>Clear search</span>
          </button>
        )}
      </div>

      {/* Videos Grid / Empty State */}
      {videos.length === 0 ? (
        <div className="bg-[#181818] p-10 rounded-2xl text-center flex flex-col items-center gap-3 border border-[#272727] mt-4">
          <p className="text-[#aaaaaa] text-base">
            {query ? `No videos found matching "${query}".` : 'No videos found. Be the first to upload one!'}
          </p>
          {query ? (
            <button
              onClick={handleClearSearch}
              className="bg-[#ff0000] hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-full transition mt-2 cursor-pointer"
            >
              View all videos
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {videos.map((video) => (
            <Link to={`/video/${video._id}`} key={video._id} className="flex flex-col gap-3 cursor-pointer group">
              <div className="aspect-video bg-[#181818] rounded-xl overflow-hidden relative shadow-md">
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {video.duration ? (
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-medium px-1.5 py-0.5 rounded font-mono shadow">
                    {(video.duration / 60).toFixed(2)}
                  </span>
                ) : null}
              </div>
              <div className="flex gap-3 px-0.5">
                <div className="w-9 h-9 rounded-full bg-[#272727] shrink-0 overflow-hidden shadow">
                  {video.ownerDetails?.avatar ? (
                     <img src={video.ownerDetails.avatar} alt="channel" className="w-full h-full object-cover"/>
                  ) : (
                     <div className="w-full h-full bg-[#ff0000] flex items-center justify-center font-bold text-xs text-white">
                       {video.ownerDetails?.username ? video.ownerDetails.username[0].toUpperCase() : 'C'}
                     </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[#f1f1f1] font-semibold text-sm line-clamp-2 leading-5 tracking-tight group-hover:text-white transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-[#aaaaaa] text-xs mt-1 hover:text-white transition-colors font-normal">
                    {video.ownerDetails?.username || "Channel Name"}
                  </p>
                  <p className="text-[#aaaaaa] text-xs font-normal">
                    {video.views || 0} views • {new Date(video.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

}

export default Home;


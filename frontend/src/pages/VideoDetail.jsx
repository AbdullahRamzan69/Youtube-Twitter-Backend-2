import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { 
  BiLike, 
  BiSolidLike, 
  BiDislike, 
  BiShareAlt, 
  BiTrash, 
  BiDotsVerticalRounded 
} from 'react-icons/bi';
import { FiSend, FiX, FiShare2 } from 'react-icons/fi';
import { 
  FaWhatsapp, 
  FaTwitter, 
  FaFacebookF, 
  FaLinkedinIn, 
  FaRedditAlien, 
  FaTelegramPlane, 
  FaEnvelope, 
  FaCopy, 
  FaCheck 
} from 'react-icons/fa';

function VideoDetail() {
  const { videoId } = useParams();
  const { user } = useContext(AuthContext);

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Video likes
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);


  // Recommended videos state
  const [recommendedVideos, setRecommendedVideos] = useState([]);

  // Description expand state
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Fetch Video details, comments, and recommended videos whenever videoId changes
  useEffect(() => {
    const fetchVideoData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch current video details
        const videoRes = await api.get(`/videos/${videoId}`);
        const videoData = videoRes.data.data;
        setVideo(videoData);
        setIsLiked(videoData.isLiked || false);
        setLikesCount(videoData.likesCount || 0);

        // Fetch comments for current video
        const commentsRes = await api.get(`/comments/${videoId}`);
        setComments(commentsRes.data.data || []);

        // Fetch recommended videos list
        const recommendedRes = await api.get('/videos');
        const docs = recommendedRes.data.data.docs || recommendedRes.data.data || [];
        setRecommendedVideos(docs.filter((v) => v._id !== videoId));
      } catch (err) {
        console.error('Failed to load video details', err);
        setError('Video not found or unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId]);

  // Handle Toggle Video Like
  const handleToggleVideoLike = async () => {
    if (!user) {
      alert('Please log in to like this video');
      return;
    }
    try {
      // Optimistic update
      const previousLiked = isLiked;
      setIsLiked(!previousLiked);
      setLikesCount((prev) => (previousLiked ? prev - 1 : prev + 1));

      await api.post(`/likes/toggle/v/${videoId}`);
    } catch (err) {
      console.error('Error toggling video like', err);
      // Revert on error
      setIsLiked(isLiked);
      setLikesCount(likesCount);
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!user) {
      alert('Please log in to add a comment');
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await api.post(`/comments/${videoId}`, {
        content: commentText.trim()
      });
      const newComment = response.data.data;
      setComments([newComment, ...comments]);
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment', err);
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Toggle Comment Like
  const handleToggleCommentLike = async (commentId) => {
    if (!user) {
      alert('Please log in to like comments');
      return;
    }

    setComments((prevComments) =>
      prevComments.map((c) => {
        if (c._id === commentId) {
          const wasLiked = c.isLiked;
          return {
            ...c,
            isLiked: !wasLiked,
            likesCount: wasLiked ? c.likesCount - 1 : c.likesCount + 1
          };
        }
        return c;
      })
    );

    try {
      await api.post(`/likes/toggle/c/${commentId}`);
    } catch (err) {
      console.error('Error toggling comment like', err);
      // Revert if error occurs by fetching comments again
      const commentsRes = await api.get(`/comments/${videoId}`);
      setComments(commentsRes.data.data || []);
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/comments/c/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment', err);
      alert('Failed to delete comment');
    }
  };

  // Handle Toggle Subscription
  const handleToggleSubscription = async () => {
    if (!user) {
      alert('Please log in to subscribe');
      return;
    }

    if (owner._id === user._id) {
      alert('You cannot subscribe to your own channel');
      return;
    }

    const previousState = owner.isSubscribed;
    const previousCount = owner.subscribersCount || 0;

    // Optimistic update
    setVideo((prev) => ({
      ...prev,
      owner: {
        ...prev.owner,
        isSubscribed: !previousState,
        subscribersCount: previousState ? Math.max(0, previousCount - 1) : previousCount + 1
      }
    }));

    try {
      await api.post(`/subscriptions/c/${owner._id}`);
    } catch (err) {
      console.error('Error toggling subscription', err);
      // Revert optimistic update
      setVideo((prev) => ({
        ...prev,
        owner: {
          ...prev.owner,
          isSubscribed: previousState,
          subscribersCount: previousCount
        }
      }));
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 text-white grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1800px] mx-auto">
        {/* Left main column skeleton */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="w-full aspect-video bg-[#272727] rounded-2xl animate-pulse"></div>
          <div className="h-7 bg-[#272727] rounded-lg animate-pulse w-3/4 mt-2"></div>
          
          <div className="flex items-center justify-between py-3 border-b border-[#272727]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#272727] animate-pulse"></div>
              <div className="flex flex-col gap-2">
                <div className="h-4 w-32 bg-[#272727] rounded animate-pulse"></div>
                <div className="h-3 w-20 bg-[#272727] rounded animate-pulse"></div>
              </div>
              <div className="w-24 h-9 bg-[#272727] rounded-full animate-pulse ml-4"></div>
            </div>
            
            <div className="flex gap-2">
              <div className="w-20 h-9 bg-[#272727] rounded-full animate-pulse"></div>
              <div className="w-20 h-9 bg-[#272727] rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="h-28 bg-[#272727] rounded-xl animate-pulse mt-2"></div>
        </div>

        {/* Right sidebar column skeleton */}
        <div className="flex flex-col gap-4">
          <div className="h-5 w-24 bg-[#272727] rounded animate-pulse mb-1"></div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-3 p-1">
              <div className="w-40 aspect-video bg-[#272727] rounded-lg animate-pulse shrink-0"></div>
              <div className="flex flex-col gap-2 flex-1 mt-1">
                <div className="h-4 bg-[#272727] rounded animate-pulse w-full"></div>
                <div className="h-3 bg-[#272727] rounded animate-pulse w-2/3"></div>
                <div className="h-3 bg-[#272727] rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }


  if (error || !video) {
    return (
      <div className="p-6 text-center text-red-400 mt-10">
        <h2 className="text-xl font-semibold mb-2">{error || 'Video not found'}</h2>
        <Link to="/" className="text-blue-400 underline hover:text-blue-300">
          Return to Home
        </Link>
      </div>
    );
  }

  const owner = video.owner || {};

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const videoTitle = video?.title || 'Check out this video';

  const socialPlatforms = [
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      bgColor: 'bg-[#25D366] hover:bg-[#20bd5a]',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(videoTitle + ' ' + currentUrl)}`
    },
    {
      name: 'X (Twitter)',
      icon: FaTwitter,
      bgColor: 'bg-[#1DA1F2] hover:bg-[#1a8cd8]',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(videoTitle)}&url=${encodeURIComponent(currentUrl)}`
    },
    {
      name: 'Facebook',
      icon: FaFacebookF,
      bgColor: 'bg-[#1877F2] hover:bg-[#166fe5]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedinIn,
      bgColor: 'bg-[#0A66C2] hover:bg-[#095196]',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`
    },
    {
      name: 'Reddit',
      icon: FaRedditAlien,
      bgColor: 'bg-[#FF4500] hover:bg-[#e03d00]',
      url: `https://www.reddit.com/submit?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(videoTitle)}`
    },
    {
      name: 'Telegram',
      icon: FaTelegramPlane,
      bgColor: 'bg-[#26A5E4] hover:bg-[#2094ce]',
      url: `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(videoTitle)}`
    },
    {
      name: 'Email',
      icon: FaEnvelope,
      bgColor: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=${encodeURIComponent(videoTitle)}&body=${encodeURIComponent('Check out this video: ' + currentUrl)}`
    }
  ];

  const handleSharePlatform = (shareUrl) => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: videoTitle,
        url: currentUrl
      }).catch(() => {});
    }
  };

  return (

    <div className="p-4 md:p-6 text-white grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Main Video Section */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {/* Video Player */}
        <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-gray-800">
          <video
            key={video._id}
            src={video.videoFile}
            poster={video.thumbnail}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="w-full h-full object-contain"
          >
            Your browser does not support playing videos.
          </video>
        </div>

        {/* Video Title */}
        <h1 className="text-xl md:text-2xl font-bold line-clamp-2 mt-1 text-[#f1f1f1] tracking-tight">{video.title}</h1>

        {/* Channel Info & Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-[#272727]">
          {/* Owner info */}
          <div className="flex items-center gap-3">
            <Link to={`/c/${owner.username}`} className="w-10 h-10 rounded-full bg-[#272727] overflow-hidden shrink-0 block hover:opacity-90 transition">
              {owner.avatar ? (
                <img src={owner.avatar} alt={owner.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#ff0000] flex items-center justify-center font-bold text-base text-white">
                  {owner.username ? owner.username[0].toUpperCase() : 'C'}
                </div>
              )}
            </Link>
            <div>
              <Link to={`/c/${owner.username}`} className="font-bold text-base text-[#f1f1f1] hover:underline cursor-pointer block leading-snug">
                {owner.fullName || owner.username || 'Channel Name'}
              </Link>
              <p className="text-[#aaaaaa] text-xs font-normal">
                @{owner.username || 'channel'} • {owner.subscribersCount || 0} subscriber{(owner.subscribersCount === 1) ? '' : 's'}
              </p>
            </div>
            {user && user._id === owner._id ? (
              <Link to="/my-channel" className="ml-4 bg-[#272727] text-[#f1f1f1] font-semibold px-4 py-2 rounded-full text-xs hover:bg-[#3f3f3f] transition">
                Manage Channel
              </Link>
            ) : (
              <button 
                onClick={handleToggleSubscription}
                className={`ml-4 font-semibold px-4 py-2 rounded-full text-xs transition cursor-pointer ${
                  owner.isSubscribed
                    ? 'bg-[#272727] text-gray-300 hover:bg-[#3f3f3f]'
                    : 'bg-white text-black hover:bg-[#d9d9d9]'
                }`}
              >
                {owner.isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>

          {/* Action buttons (Like, Share) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleVideoLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                isLiked
                  ? 'bg-white/20 text-white font-bold border border-white/30'
                  : 'bg-[#272727] text-[#f1f1f1] hover:bg-[#3f3f3f]'
              }`}
            >
              {isLiked ? <BiSolidLike className="text-lg text-red-500" /> : <BiLike className="text-lg" />}
              <span>{likesCount}</span>
            </button>

            <button 
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 bg-[#272727] hover:bg-[#3f3f3f] px-4 py-2 rounded-full text-xs font-semibold text-[#f1f1f1] transition cursor-pointer"
            >
              <BiShareAlt className="text-lg" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Video Description Box */}
        <div
          onClick={() => setShowFullDesc(!showFullDesc)}
          className="bg-[#272727] hover:bg-[#383838] p-3.5 rounded-xl cursor-pointer transition text-sm text-[#f1f1f1] mt-2 leading-relaxed"
        >
          <div className="font-bold text-white mb-1 flex gap-3 text-xs">
            <span>{video.views || 0} views</span>
            <span>•</span>
            <span>{new Date(video.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          <p className={showFullDesc ? 'whitespace-pre-line text-sm' : 'line-clamp-2 text-sm'}>
            {video.description || 'No description provided.'}
          </p>
          <button className="text-[#aaaaaa] font-bold text-xs mt-2 hover:underline">
            {showFullDesc ? 'Show less' : 'Show more'}
          </button>
        </div>


        {/* Comments Section */}
        <div className="mt-6 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">{comments.length} Comments</h2>
          </div>

          {/* Add Comment Input */}
          {user ? (
            <form onSubmit={handleAddComment} className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0 mt-1">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                    {user.username ? user.username[0].toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-700 focus:border-white focus:outline-none py-1 text-sm text-white transition placeholder-gray-500"
                />
                <div className="flex justify-end gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setCommentText('')}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-white/10 text-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                      commentText.trim() && !submittingComment
                        ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {submittingComment ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-[#1f1f1f] p-4 rounded-xl text-center text-gray-400 text-sm">
              Please{' '}
              <Link to="/login" className="text-red-500 font-semibold hover:underline">
                log in
              </Link>{' '}
              to leave a comment on this video.
            </div>
          )}

          {/* Comments List */}
          <div className="flex flex-col gap-4 mt-2">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => {
                const commentUser = comment.user || {};
                const isCommentAuthor = user && commentUser._id === user._id;

                return (
                  <div key={comment._id} className="flex gap-4 group">
                    <div className="w-9 h-9 rounded-full bg-gray-700 overflow-hidden shrink-0 mt-0.5">
                      {commentUser.avatar ? (
                        <img src={commentUser.avatar} alt={commentUser.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-purple-600 flex items-center justify-center font-bold text-xs">
                          {commentUser.username ? commentUser.username[0].toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-white hover:underline cursor-pointer">
                          @{commentUser.username || 'user'}
                        </span>
                        <span className="text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-200 whitespace-pre-line leading-relaxed">
                        {comment.content}
                      </p>
                      
                      {/* Comment actions row (Like & Delete) */}
                      <div className="flex items-center gap-4 mt-1">
                        <button
                          onClick={() => handleToggleCommentLike(comment._id)}
                          className={`flex items-center gap-1.5 text-xs transition cursor-pointer ${
                            comment.isLiked ? 'text-white font-bold' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {comment.isLiked ? (
                            <BiSolidLike className="text-base text-red-500" />
                          ) : (
                            <BiLike className="text-base" />
                          )}
                          <span>{comment.likesCount > 0 ? comment.likesCount : ''}</span>
                        </button>

                        {isCommentAuthor && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-gray-400 hover:text-red-400 text-xs flex items-center gap-1 transition cursor-pointer"
                            title="Delete comment"
                          >
                            <BiTrash className="text-sm" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Recommended Videos Sidebar */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-lg text-white mb-1">Up next</h3>
        {recommendedVideos.length === 0 ? (
          <div className="text-gray-500 text-sm">No other videos available</div>
        ) : (
          recommendedVideos.map((recVideo) => (
            <Link
              to={`/video/${recVideo._id}`}
              key={recVideo._id}
              className="flex gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition"
            >
              <div className="w-40 aspect-video bg-gray-800 rounded-lg overflow-hidden shrink-0 relative">
                <img
                  src={recVideo.thumbnail}
                  alt={recVideo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {recVideo.duration ? (
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-mono">
                    {(recVideo.duration / 60).toFixed(2)}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-1 overflow-hidden">
                <h4 className="font-medium text-sm text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                  {recVideo.title}
                </h4>
                <p className="text-gray-400 text-xs line-clamp-1 mt-0.5">
                  {recVideo.ownerDetails?.username || 'Channel'}
                </p>
                <p className="text-gray-400 text-xs">
                  {recVideo.views || 0} views • {new Date(recVideo.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#212121] border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Share</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white transition cursor-pointer p-1 rounded-full hover:bg-white/10"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-6">
              {/* Social Media Platforms Grid */}
              <div className="grid grid-cols-4 gap-4">
                {socialPlatforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <button
                      key={platform.name}
                      onClick={() => handleSharePlatform(platform.url)}
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-full ${platform.bgColor} flex items-center justify-center text-white text-xl shadow-lg transition-transform group-hover:scale-110`}>
                        <Icon />
                      </div>
                      <span className="text-xs text-gray-300 group-hover:text-white transition line-clamp-1">
                        {platform.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Copy Link Input Section */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs text-gray-400 font-medium">Page Link</label>
                <div className="flex items-center bg-[#121212] border border-gray-700 rounded-xl overflow-hidden p-1 focus-within:border-gray-500">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="w-full bg-transparent px-3 py-1.5 text-xs text-gray-200 focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                      copiedLink
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <FaCheck className="text-xs" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <FaCopy className="text-xs" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Native Device Share (for mobile browsers) */}
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full mt-1 bg-[#333333] hover:bg-[#444444] text-white text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FiShare2 className="text-sm" />
                  <span>Share via device apps</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default VideoDetail;

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
import { FiSend } from 'react-icons/fi';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
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
        <h1 className="text-xl md:text-2xl font-bold line-clamp-2 mt-1">{video.title}</h1>

        {/* Channel Info & Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-gray-800">
          {/* Owner info */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gray-700 overflow-hidden shrink-0">
              {owner.avatar ? (
                <img src={owner.avatar} alt={owner.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-red-600 flex items-center justify-center font-bold text-lg">
                  {owner.username ? owner.username[0].toUpperCase() : 'C'}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-base hover:text-gray-200 cursor-pointer">
                {owner.fullName || owner.username || 'Channel Name'}
              </h3>
              <p className="text-gray-400 text-xs">@{owner.username || 'channel'}</p>
            </div>
            <button className="ml-4 bg-white text-black font-semibold px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition">
              Subscribe
            </button>
          </div>

          {/* Action buttons (Like, Share) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleVideoLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                isLiked
                  ? 'bg-white/20 text-white font-semibold border border-white/30'
                  : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'
              }`}
            >
              {isLiked ? <BiSolidLike className="text-xl text-red-500" /> : <BiLike className="text-xl" />}
              <span>{likesCount}</span>
            </button>

            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }}
              className="flex items-center gap-2 bg-[#272727] hover:bg-[#3f3f3f] px-4 py-2 rounded-full text-sm font-medium text-white transition cursor-pointer"
            >
              <BiShareAlt className="text-xl" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Video Description Box */}
        <div
          onClick={() => setShowFullDesc(!showFullDesc)}
          className="bg-[#272727] hover:bg-[#373737] p-4 rounded-xl cursor-pointer transition text-sm text-gray-200 mt-2"
        >
          <div className="font-semibold text-white mb-1 flex gap-3">
            <span>{video.views || 0} views</span>
            <span>•</span>
            <span>{new Date(video.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          <p className={showFullDesc ? 'whitespace-pre-line' : 'line-clamp-2'}>
            {video.description || 'No description provided.'}
          </p>
          <button className="text-gray-400 font-semibold text-xs mt-2 hover:underline">
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
    </div>
  );
}

export default VideoDetail;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { BiLike, BiSolidLike, BiTrash } from 'react-icons/bi';
import { FiMessageCircle, FiEdit2, FiCheck, FiX } from 'react-icons/fi';

function formatPostTime(date) {
  const d = new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function CommunityPostCard({ post, currentUser, onDeleted, onUpdated }) {
  const owner = post.owner || {};
  const isOwner = currentUser && owner._id === currentUser._id;

  const [isLiked, setIsLiked] = useState(!!post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [savingEdit, setSavingEdit] = useState(false);
  const [content, setContent] = useState(post.content || '');

  const handleToggleLike = async () => {
    if (!currentUser) {
      alert('Please log in to like this post');
      return;
    }

    const previousLiked = isLiked;
    setIsLiked(!previousLiked);
    setLikesCount((prev) => (previousLiked ? Math.max(0, prev - 1) : prev + 1));

    try {
      await api.post(`/likes/toggle/t/${post._id}`);
    } catch (err) {
      console.error('Failed to toggle post like', err);
      setIsLiked(previousLiked);
      setLikesCount((prev) => (previousLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await api.get(`/comments/tweet/${post._id}`);
      setComments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      await loadComments();
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!currentUser) {
      alert('Please log in to comment');
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await api.post(`/comments/tweet/${post._id}`, {
        content: commentText.trim()
      });
      setComments((prev) => [res.data.data, ...prev]);
      setCommentsCount((prev) => prev + 1);
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment', err);
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    if (!currentUser) {
      alert('Please log in to like comments');
      return;
    }

    const previous = comments;
    setComments((prev) =>
      prev.map((c) => {
        if (c._id !== commentId) return c;
        const wasLiked = c.isLiked;
        return {
          ...c,
          isLiked: !wasLiked,
          likesCount: wasLiked ? Math.max(0, (c.likesCount || 0) - 1) : (c.likesCount || 0) + 1
        };
      })
    );

    try {
      await api.post(`/likes/toggle/c/${commentId}`);
    } catch (err) {
      console.error('Failed to like comment', err);
      setComments(previous);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/c/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to delete comment', err);
      alert('Failed to delete comment');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this community post? This cannot be undone.')) return;
    try {
      await api.delete(`/tweets/${post._id}`);
      onDeleted?.(post._id);
    } catch (err) {
      console.error('Failed to delete post', err);
      alert(err.response?.data?.message || 'Failed to delete post');
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setSavingEdit(true);
    try {
      const res = await api.patch(`/tweets/${post._id}`, { content: editContent.trim() });
      setContent(res.data.data.content);
      setEditing(false);
      onUpdated?.(res.data.data);
    } catch (err) {
      console.error('Failed to update post', err);
      alert(err.response?.data?.message || 'Failed to update post');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <article className="bg-[#181818] border border-[#272727] rounded-2xl p-4 sm:p-5">
      <div className="flex gap-3">
        <Link to={`/c/${owner.username || ''}`} className="shrink-0">
          {owner.avatar ? (
            <img src={owner.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm">
              {owner.username?.[0]?.toUpperCase() || 'C'}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link to={`/c/${owner.username || ''}`} className="font-semibold text-sm hover:text-red-400">
                {owner.fullName || owner.username || 'Channel'}
              </Link>
              <p className="text-xs text-[#aaa]">
                @{owner.username} • {formatPostTime(post.createdAt)}
              </p>
            </div>
            {isOwner && !editing && (
              <div className="flex items-center gap-2 text-[#aaa]">
                <button
                  onClick={() => {
                    setEditContent(content);
                    setEditing(true);
                  }}
                  className="hover:text-white p-1 cursor-pointer"
                  title="Edit post"
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={handleDeletePost}
                  className="hover:text-red-400 p-1 cursor-pointer"
                  title="Delete post"
                >
                  <BiTrash />
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="mt-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value.slice(0, 5000))}
                rows={4}
                className="w-full bg-[#121212] border border-[#303030] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#555] resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-xs text-[#aaa] hover:text-white px-3 py-1.5 rounded-full cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1"><FiX /> Cancel</span>
                </button>
                <button
                  type="button"
                  disabled={savingEdit || !editContent.trim()}
                  onClick={handleSaveEdit}
                  className="text-xs bg-white text-black font-semibold px-3 py-1.5 rounded-full disabled:opacity-40 cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1"><FiCheck /> {savingEdit ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
          ) : content ? (
            <p className="mt-3 text-sm text-[#f1f1f1] whitespace-pre-wrap leading-relaxed">{content}</p>
          ) : null}

          {post.image ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-[#272727] bg-black">
              <img src={post.image} alt="" className="w-full max-h-[480px] object-contain" />
            </div>
          ) : null}

          <div className="flex items-center gap-5 mt-4 text-sm text-[#aaa]">
            <button
              onClick={handleToggleLike}
              className={`flex items-center gap-1.5 cursor-pointer transition ${
                isLiked ? 'text-white' : 'hover:text-white'
              }`}
            >
              {isLiked ? <BiSolidLike className="text-lg text-red-500" /> : <BiLike className="text-lg" />}
              <span>{likesCount}</span>
            </button>
            <button
              onClick={handleToggleComments}
              className="flex items-center gap-1.5 hover:text-white cursor-pointer"
            >
              <FiMessageCircle className="text-base" />
              <span>{commentsCount}</span>
            </button>
          </div>

          {showComments && (
            <div className="mt-4 pt-4 border-t border-[#272727]">
              {currentUser ? (
                <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUser.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent border-b border-[#303030] focus:border-white outline-none text-sm py-1"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="text-xs font-semibold bg-white text-black px-3 py-1.5 rounded-full disabled:opacity-40 cursor-pointer"
                  >
                    {submittingComment ? '...' : 'Comment'}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-[#888] mb-4">
                  <Link to="/login" className="text-[#3ea6ff] hover:underline">Sign in</Link> to comment.
                </p>
              )}

              {commentsLoading ? (
                <p className="text-xs text-[#888]">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-[#888]">No comments yet. Be the first to comment.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {comments.map((comment) => {
                    const commentUser = comment.user || {};
                    const isCommentAuthor = currentUser && commentUser._id === currentUser._id;
                    return (
                      <div key={comment._id} className="flex gap-2">
                        <Link to={`/c/${commentUser.username || ''}`} className="shrink-0">
                          {commentUser.avatar ? (
                            <img src={commentUser.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center font-bold text-[10px]">
                              {commentUser.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs">
                            <span className="font-semibold text-white">@{commentUser.username || 'user'}</span>
                            <span className="text-[#777] ml-2">{formatPostTime(comment.createdAt)}</span>
                          </p>
                          <p className="text-sm text-[#ddd] whitespace-pre-wrap mt-0.5">{comment.content}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <button
                              onClick={() => handleToggleCommentLike(comment._id)}
                              className="flex items-center gap-1 text-xs text-[#aaa] hover:text-white cursor-pointer"
                            >
                              {comment.isLiked ? (
                                <BiSolidLike className="text-red-500" />
                              ) : (
                                <BiLike />
                              )}
                              <span>{comment.likesCount || ''}</span>
                            </button>
                            {isCommentAuthor && (
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="text-xs text-[#aaa] hover:text-red-400 cursor-pointer"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default CommunityPostCard;

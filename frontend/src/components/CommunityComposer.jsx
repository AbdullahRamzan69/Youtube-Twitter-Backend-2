import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { FiImage, FiX } from 'react-icons/fi';

const MAX_CONTENT_LENGTH = 5000;

function CommunityComposer({ user, onCreated, placeholder = 'Share an update with your community' }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await api.post('/tweets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onCreated?.(res.data.data);
      setContent('');
      clearImage();
      setFocused(false);
    } catch (err) {
      console.error('Failed to create community post', err);
      alert(err.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#181818] border border-[#272727] rounded-2xl p-4 mb-6"
    >
      <div className="flex gap-3">
        <Link to="/my-channel" className="shrink-0">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
            onFocus={() => setFocused(true)}
            rows={focused || content ? 4 : 2}
            placeholder={placeholder}
            className="w-full bg-transparent outline-none text-sm text-[#f1f1f1] placeholder-[#888] resize-none leading-relaxed"
          />

          {imagePreview && (
            <div className="relative mt-3 max-w-md">
              <img src={imagePreview} alt="Preview" className="w-full rounded-xl object-cover max-h-72" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1.5 cursor-pointer"
              >
                <FiX />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#272727]">
            <label className="flex items-center gap-2 text-[#aaa] hover:text-white text-sm cursor-pointer">
              <FiImage className="text-lg" />
              <span>Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#777]">{content.length}/{MAX_CONTENT_LENGTH}</span>
              <button
                type="submit"
                disabled={submitting || (!content.trim() && !imageFile)}
                className="bg-white text-black hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed font-semibold px-4 py-1.5 rounded-full text-sm cursor-pointer"
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default CommunityComposer;

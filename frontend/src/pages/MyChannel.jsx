import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiEyeOff, 
  FiCamera, 
  FiPlusCircle,
  FiX,
  FiCheck
} from 'react-icons/fi';

function MyChannel() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [channelData, setChannelData] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Edit Video Modal State
  const [selectedVideoToEdit, setSelectedVideoToEdit] = useState(null);
  const [editVideoTitle, setEditVideoTitle] = useState('');
  const [editVideoDesc, setEditVideoDesc] = useState('');
  const [editVideoThumbnail, setEditVideoThumbnail] = useState(null);
  const [updatingVideo, setUpdatingVideo] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchChannelData();
  }, [user]);

  const fetchChannelData = async () => {
    setLoading(true);
    try {
      // Fetch channel details using username
      const profileRes = await api.get(`/users/c/${user.username}`);
      const channel = profileRes.data.data;
      setChannelData(channel);
      setFullNameInput(channel.fullName || '');
      setEmailInput(channel.email || '');

      // Fetch videos uploaded by current user
      const videosRes = await api.get(`/videos?userId=${user._id}`);
      const docs = videosRes.data.data.docs || videosRes.data.data || [];
      setUserVideos(docs);
    } catch (err) {
      console.error('Failed to load channel data', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Update Account Info & Files
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);

    try {
      let updatedUserData = { ...user };

      // 1. Update text details (fullName, email) if changed
      if (fullNameInput !== user.fullName || emailInput !== user.email) {
        const textRes = await api.patch('/users/update-account', {
          fullName: fullNameInput,
          email: emailInput
        });
        updatedUserData = textRes.data.data;
      }

      // 2. Update Avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const avatarRes = await api.patch('/users/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updatedUserData = avatarRes.data.data;
      }

      // 3. Update Cover Image if selected
      if (coverFile) {
        const formData = new FormData();
        formData.append('coverImage', coverFile);
        const coverRes = await api.patch('/users/cover-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updatedUserData = coverRes.data.data;
      }

      login(updatedUserData);
      setShowEditProfileModal(false);
      setAvatarFile(null);
      setCoverFile(null);
      await fetchChannelData();
      alert('Channel profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile', err);
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle Toggle Publish/Unpublish Video
  const handleTogglePublish = async (videoId) => {
    try {
      const res = await api.patch(`/videos/${videoId}/toggle-publish`);
      const updatedVideo = res.data.data;
      setUserVideos((prev) =>
        prev.map((v) => (v._id === videoId ? { ...v, isPublished: updatedVideo.isPublished } : v))
      );
    } catch (err) {
      console.error('Failed to toggle publish status', err);
      alert('Failed to update video publish status');
    }
  };

  // Handle Delete Video
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video? This cannot be undone.')) return;

    try {
      await api.delete(`/videos/${videoId}`);
      setUserVideos((prev) => prev.filter((v) => v._id !== videoId));
      alert('Video deleted successfully');
    } catch (err) {
      console.error('Failed to delete video', err);
      alert('Failed to delete video');
    }
  };

  // Open Edit Video Modal
  const openEditVideoModal = (video) => {
    setSelectedVideoToEdit(video);
    setEditVideoTitle(video.title);
    setEditVideoDesc(video.description || '');
    setEditVideoThumbnail(null);
  };

  // Save Edit Video Changes
  const handleSaveVideoEdit = async (e) => {
    e.preventDefault();
    if (!selectedVideoToEdit) return;

    setUpdatingVideo(true);
    try {
      const formData = new FormData();
      formData.append('title', editVideoTitle);
      formData.append('description', editVideoDesc);
      if (editVideoThumbnail) {
        formData.append('thumbnail', editVideoThumbnail);
      }

      const res = await api.patch(`/videos/${selectedVideoToEdit._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const updated = res.data.data;
      setUserVideos((prev) =>
        prev.map((v) => (v._id === updated._id ? updated : v))
      );
      setSelectedVideoToEdit(null);
      alert('Video updated successfully');
    } catch (err) {
      console.error('Failed to update video', err);
      alert(err.response?.data?.message || 'Failed to update video');
    } finally {
      setUpdatingVideo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const profile = channelData || user;

  return (
    <div className="min-h-screen pb-12 text-white">
      {/* Banner Section */}
      <div className="w-full h-44 sm:h-64 bg-gradient-to-r from-red-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        {profile.coverImage ? (
          <img src={profile.coverImage} alt="Cover Banner" className="w-full h-full object-cover" />
        ) : null}
        <button
          onClick={() => setShowEditProfileModal(true)}
          className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-lg backdrop-blur flex items-center gap-2 cursor-pointer transition"
        >
          <FiCamera className="text-base" />
          <span>Edit Banner</span>
        </button>
      </div>

      {/* Channel Header Info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-16 sm:-mt-20">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 pb-6 border-b border-gray-800">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            {/* Avatar */}
            <div className="relative group w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gray-800 border-4 border-[#0f0f0f] overflow-hidden shrink-0 shadow-xl">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-red-600 flex items-center justify-center font-bold text-4xl">
                  {profile.username ? profile.username[0].toUpperCase() : 'U'}
                </div>
              )}
              <button
                onClick={() => setShowEditProfileModal(true)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-xs font-semibold transition cursor-pointer"
              >
                <FiCamera className="text-xl mb-1" />
                Change Avatar
              </button>
            </div>

            {/* Profile Text */}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold">{profile.fullName || profile.username}</h1>
              <p className="text-gray-400 text-sm">@{profile.username} • {profile.email}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                <span><strong className="text-white">{profile.subscribersCount || 0}</strong> subscribers</span>
                <span>•</span>
                <span><strong className="text-white">{userVideos.length}</strong> videos</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="bg-white text-black hover:bg-gray-200 font-semibold px-5 py-2 rounded-full text-sm transition flex items-center gap-2 cursor-pointer shadow"
            >
              <FiEdit />
              <span>Edit Channel</span>
            </button>
            <Link
              to="/upload"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-full text-sm transition flex items-center gap-2 cursor-pointer shadow"
            >
              <FiPlusCircle />
              <span>Upload Video</span>
            </Link>
          </div>
        </div>

        {/* Uploaded Videos Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Uploaded Videos ({userVideos.length})</h2>
          </div>

          {userVideos.length === 0 ? (
            <div className="bg-[#181818] p-10 rounded-2xl text-center flex flex-col items-center gap-3 border border-gray-800">
              <p className="text-gray-400">You haven't uploaded any videos yet.</p>
              <Link
                to="/upload"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-full text-sm transition mt-2 inline-block"
              >
                Upload your first video
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {userVideos.map((video) => (
                <div
                  key={video._id}
                  className="bg-[#181818] border border-gray-800 rounded-xl overflow-hidden flex flex-col group hover:border-gray-700 transition"
                >
                  <div className="aspect-video bg-gray-900 relative overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded shadow ${
                          video.isPublished !== false ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-200'
                        }`}
                      >
                        {video.isPublished !== false ? 'Published' : 'Unpublished'}
                      </span>
                    </div>
                    {video.duration ? (
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded font-mono">
                        {(video.duration / 60).toFixed(2)}
                      </span>
                    ) : null}
                  </div>

                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <Link to={`/video/${video._id}`} className="font-semibold text-white line-clamp-2 hover:text-red-400 transition text-sm">
                        {video.title}
                      </Link>
                      <p className="text-gray-400 text-xs mt-1">
                        {video.views || 0} views • {new Date(video.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-800 text-xs">
                      <button
                        onClick={() => handleTogglePublish(video._id)}
                        className="text-gray-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                        title={video.isPublished !== false ? 'Unpublish Video' : 'Publish Video'}
                      >
                        {video.isPublished !== false ? <FiEyeOff /> : <FiEye />}
                        <span>{video.isPublished !== false ? 'Unpublish' : 'Publish'}</span>
                      </button>

                      <button
                        onClick={() => openEditVideoModal(video)}
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition cursor-pointer"
                        title="Edit Details"
                      >
                        <FiEdit />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteVideo(video._id)}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 transition cursor-pointer"
                        title="Delete Video"
                      >
                        <FiTrash2 />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Channel Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1f1f1f] border border-gray-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-bold">Edit Channel Profile</h3>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">New Avatar Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files[0])}
                  className="w-full bg-[#121212] border border-gray-700 rounded-xl p-2 text-xs text-gray-400 file:bg-gray-800 file:text-white file:border-0 file:px-3 file:py-1 file:rounded-lg file:mr-3"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">New Cover Banner Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files[0])}
                  className="w-full bg-[#121212] border border-gray-700 rounded-xl p-2 text-xs text-gray-400 file:bg-gray-800 file:text-white file:border-0 file:px-3 file:py-1 file:rounded-lg file:mr-3"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition cursor-pointer"
                >
                  {updatingProfile ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {selectedVideoToEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1f1f1f] border border-gray-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-bold">Edit Video Details</h3>
              <button
                onClick={() => setSelectedVideoToEdit(null)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSaveVideoEdit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editVideoTitle}
                  onChange={(e) => setEditVideoTitle(e.target.value)}
                  className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
                <textarea
                  rows="4"
                  value={editVideoDesc}
                  onChange={(e) => setEditVideoDesc(e.target.value)}
                  className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Update Thumbnail (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditVideoThumbnail(e.target.files[0])}
                  className="w-full bg-[#121212] border border-gray-700 rounded-xl p-2 text-xs text-gray-400 file:bg-gray-800 file:text-white file:border-0 file:px-3 file:py-1 file:rounded-lg file:mr-3"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedVideoToEdit(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingVideo}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition cursor-pointer"
                >
                  {updatingVideo ? 'Saving Video...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyChannel;

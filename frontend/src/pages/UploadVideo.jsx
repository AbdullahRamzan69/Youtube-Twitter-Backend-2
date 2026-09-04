import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function UploadVideo() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!videoFile || !thumbnail) {
      setErrorMsg("Video file and thumbnail are both required!");
      return;
    }

    setLoading(true);
    
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('videoFile', videoFile);
      data.append('thumbnail', thumbnail);
      
      const response = await api.post('/videos', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Upload successful', response.data);
      navigate('/'); // Redirect to home page
    } catch (error) {
      console.error('Upload failed', error);
      setErrorMsg(error.response?.data?.message || 'Video upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-start pt-10 min-h-[calc(100vh-80px)]">
      <div className="bg-[#121212] border border-gray-800 p-8 rounded-2xl w-full max-w-2xl shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-6">Upload Video</h2>
        
        {errorMsg && (
          <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpload} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Title</label>
            <input 
              type="text" 
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="bg-[#222222] border border-gray-700 px-4 py-3 rounded-lg text-white outline-none focus:border-blue-500 transition"
              placeholder="Catchy video title..."
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="bg-[#222222] border border-gray-700 px-4 py-3 rounded-lg text-white outline-none focus:border-blue-500 transition resize-none"
              placeholder="Tell viewers about your video..."
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 text-sm">Video File (Required)</label>
              <input 
                type="file" 
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files[0])}
                className="bg-[#222222] border border-gray-700 px-4 py-3 rounded-lg text-white outline-none focus:border-blue-500 transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer text-sm"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-gray-400 text-sm">Thumbnail (Required)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files[0])}
                className="bg-[#222222] border border-gray-700 px-4 py-3 rounded-lg text-white outline-none focus:border-blue-500 transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer text-sm"
                required
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-400 text-white font-medium px-8 py-3 rounded-lg transition"
            >
              {loading ? 'Uploading...' : 'Publish Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadVideo;

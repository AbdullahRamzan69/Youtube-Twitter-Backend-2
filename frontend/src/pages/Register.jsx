import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
  });
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!avatar) {
      setErrorMsg("Avatar is required!");
      return;
    }

    setLoading(true);
    
    try {
      const data = new FormData();
      data.append('fullName', formData.fullName);
      data.append('email', formData.email);
      data.append('username', formData.username);
      data.append('password', formData.password);
      data.append('avatar', avatar);
      
      if (coverImage) {
        data.append('coverImage', coverImage);
      }

      const response = await api.post('/users/register', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Registration successful', response.data);
      navigate('/login');
    } catch (error) {
      console.error('Registration failed', error);
      setErrorMsg(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-10 min-h-[calc(100vh-80px)]">
      <div className="bg-[#121212] border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Sign Up</h2>
        
        {errorMsg && (
          <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Full Name</label>
            <input 
              type="text" 
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="bg-[#222222] border border-gray-700 px-4 py-3 rounded-lg text-white outline-none focus:border-blue-500 transition"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Username</label>
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="bg-[#222222] border border-gray-700 px-4 py-3 rounded-lg text-white outline-none focus:border-blue-500 transition"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="bg-[#222222] border border-gray-700 px-4 py-3 rounded-lg text-white outline-none focus:border-blue-500 transition"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="bg-[#222222] border border-gray-700 px-4 py-3 rounded-lg text-white outline-none focus:border-blue-500 transition"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Avatar (Required)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files[0])}
              className="bg-[#222222] border border-gray-700 px-4 py-2 rounded-lg text-white outline-none focus:border-blue-500 transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Cover Image (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files[0])}
              className="bg-[#222222] border border-gray-700 px-4 py-2 rounded-lg text-white outline-none focus:border-blue-500 transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-400 text-white font-medium py-3 rounded-lg transition"
          >
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-6">
          Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;

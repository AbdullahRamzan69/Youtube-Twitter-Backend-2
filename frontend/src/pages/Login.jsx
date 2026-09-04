import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const payload = identifier.includes('@') 
        ? { email: identifier, password }
        : { username: identifier, password };
        
      const response = await api.post('/users/login', payload);
      login(response.data.data.user);
      navigate('/');
    } catch (error) {
      console.error('Login failed', error);
      setErrorMsg(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-[calc(100vh-80px)]">
      <div className="bg-[#121212] border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Sign In</h2>
        
        {errorMsg && (
          <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Email or Username</label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="bg-[#222222] border border-gray-700 px-4 py-3 rounded-lg text-white outline-none focus:border-blue-500 transition"
              placeholder="Enter email or username"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#222222] border border-gray-700 px-4 py-3 rounded-lg text-white outline-none focus:border-blue-500 transition"
              placeholder="Enter password"
              required
            />
          </div>
          <button 
            type="submit" 
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition"
          >
            Sign In
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-6">
          Don't have an account? <Link to="/register" className="text-blue-500 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

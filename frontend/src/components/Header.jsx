import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaYoutube, FaUserCircle, FaPlus, FaSignOutAlt } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

function Header() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="sticky top-0 z-50 bg-[#0f0f0f] text-white px-4 py-3 flex justify-between items-center border-b border-gray-800">
      <Link to="/" className="flex items-center gap-2">
        <FaYoutube className="text-red-600 text-3xl" />
        <span className="text-xl font-bold tracking-tighter">MyTube</span>
      </Link>
      
      <div className="flex-1 max-w-xl mx-4">
        <div className="flex bg-[#121212] border border-gray-700 rounded-full overflow-hidden focus-within:border-blue-500">
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-transparent px-4 py-2 outline-none text-white"
          />
          <button className="px-5 bg-[#222222] border-l border-gray-700 hover:bg-gray-700 transition">
            Search
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/upload" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-800 transition">
              <FaPlus className="text-gray-300" />
              <span className="hidden sm:inline text-sm">Upload</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <img 
                src={user.avatar} 
                alt="avatar" 
                className="w-8 h-8 rounded-full object-cover border border-gray-700" 
              />
              <button 
                onClick={logout}
                className="text-gray-400 hover:text-white transition p-2"
                title="Log Out"
              >
                <FaSignOutAlt />
              </button>
            </div>
          </>
        ) : (
          <Link to="/login" className="flex items-center gap-2 px-3 py-1.5 border border-gray-700 rounded-full hover:bg-gray-800 transition text-sm font-medium text-blue-400">
            <FaUserCircle className="text-xl" />
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;

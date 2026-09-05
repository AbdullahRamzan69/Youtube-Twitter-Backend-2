import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaYoutube, FaUserCircle, FaPlus, FaSignOutAlt, FaSearch } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentQuery = searchParams.get('query') || '';
  const [searchQuery, setSearchQuery] = useState(currentQuery);

  useEffect(() => {
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-md text-[#f1f1f1] px-4 h-14 flex justify-between items-center border-b border-[#272727] font-sans">
      <Link to="/" className="flex items-center gap-1.5 shrink-0 group">
        <div className="bg-[#ff0000] text-white p-1 rounded-lg group-hover:scale-105 transition-transform">
          <FaYoutube className="text-xl" />
        </div>
        <span className="text-lg font-black tracking-tighter text-white font-sans">YouTube</span>
      </Link>
      
      <div className="flex-1 max-w-2xl mx-6">
        <form onSubmit={handleSearchSubmit} className="flex bg-[#121212] border border-[#303030] rounded-full overflow-hidden focus-within:border-[#1c62b9] transition-colors h-10">
          <div className="relative w-full flex items-center">
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-4 py-1.5 outline-none text-[#f1f1f1] text-sm placeholder-[#aaaaaa]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 text-[#aaaaaa] hover:text-white transition cursor-pointer"
                title="Clear search"
              >
                <FiX className="text-base" />
              </button>
            )}
          </div>
          <button 
            type="submit"
            className="px-6 bg-[#222222] border-l border-[#303030] hover:bg-[#303030] transition flex items-center justify-center text-[#f1f1f1] cursor-pointer shrink-0"
            title="Search"
          >
            <FaSearch className="text-sm text-gray-300" />
          </button>
        </form>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link to="/upload" className="flex items-center gap-2 bg-[#272727] hover:bg-[#3f3f3f] px-3.5 py-1.5 rounded-full transition text-xs font-semibold text-[#f1f1f1]">
              <FaPlus className="text-xs text-red-500" />
              <span className="hidden sm:inline">Create</span>
            </Link>
            
            <Link to="/my-channel" className="hidden md:flex items-center gap-1.5 bg-[#272727] hover:bg-[#3f3f3f] px-3.5 py-1.5 rounded-full transition text-xs font-semibold text-[#f1f1f1]">
              <span>My Channel</span>
            </Link>
            
            <div className="flex items-center gap-2.5 ml-1">
              <Link to="/my-channel" title="View My Channel">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="avatar" 
                    className="w-8 h-8 rounded-full object-cover border border-[#303030] hover:border-white transition" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-xs text-white shadow">
                    {user.username ? user.username[0].toUpperCase() : 'U'}
                  </div>
                )}
              </Link>
              <button 
                onClick={logout}
                className="text-[#aaaaaa] hover:text-white transition p-1.5 hover:bg-[#272727] rounded-full cursor-pointer"
                title="Log Out"
              >
                <FaSignOutAlt className="text-sm" />
              </button>
            </div>
          </>
        ) : (
          <Link to="/login" className="flex items-center gap-2 px-3.5 py-1.5 border border-[#303030] rounded-full hover:bg-[#263850] transition text-xs font-semibold text-[#3ea6ff]">
            <FaUserCircle className="text-base" />
            Sign In
          </Link>
        )}
      </div>
    </header>
  );

}

export default Header;

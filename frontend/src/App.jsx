import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UploadVideo from './pages/UploadVideo';
import VideoDetail from './pages/VideoDetail';
import MyChannel from './pages/MyChannel';
import ChannelDetail from './pages/ChannelDetail';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0f0f0f] font-sans text-white">
          <Header />
          <main className="max-w-[1600px] mx-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/video/:videoId" element={<VideoDetail />} />
              <Route path="/my-channel" element={<MyChannel />} />
              <Route path="/c/:username" element={<ChannelDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/upload" element={<UploadVideo />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}



export default App;

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DiaryApp from './components/DiaryApp';
import AdminPanel from './components/AdminPanel';
import PublicFeed from './components/PublicFeed';
import Navigation from './components/Navigation';

function App() {
  return (
    <div className="min-h-screen bg-black text-green-400 crt">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#001100',
            color: '#00ff00',
            border: '1px solid #00ff00',
            boxShadow: '0 0 10px #00ff00',
            fontFamily: 'VT323, monospace'
          }
        }}
      />
      
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<DiaryApp />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/public" element={<PublicFeed />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
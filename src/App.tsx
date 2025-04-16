import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Navigation from './components/Navigation';
import DiaryApp from './components/DiaryApp';
import PublicFeed from './components/PublicFeed';
import AdminPanel from './components/AdminPanel';
import './index.css';
 
useEffect(() => {
  const disableActions = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    alert('Hey 👶🫵🏼 ,Stay Out of it 🙅🧌.');
  };
  document.addEventListener('copy', disableActions);
  document.addEventListener('cut', disableActions);
  document.addEventListener('contextmenu', disableActions);

  return () => {
    document.removeEventListener('copy', disableActions);
    document.removeEventListener('cut', disableActions);
    document.removeEventListener('contextmenu', disableActions);
  };
}, []);
const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <div className="min-h-screen bg-background text-text">
            <Navigation />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/public" element={<PublicFeed />} />
                <Route path="/" element={<DiaryApp />} />
                <Route path="/admin" element={<AdminPanel />} />
              </Routes>
            </main>
          </div>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
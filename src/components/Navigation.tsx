import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, Home, Users, Settings, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/public', label: 'Public Feed', icon: Users },
    { path: '/admin', label: 'Admin', icon: Settings },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-md shadow-lg'
          : 'bg-background'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Book className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">RetroLog</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === link.path
                      ? 'bg-primary/10 text-primary'
                      : 'text-text hover:bg-primary/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-primary/5 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'retro' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-primary/5 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <div
                className={`w-6 h-0.5 bg-text transition-all duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-1' : ''
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-96' : 'max-h-0'
          } overflow-hidden`}
        >
          <div className="py-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    location.pathname === link.path
                      ? 'bg-primary/10 text-primary'
                      : 'text-text hover:bg-primary/5'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <button
              onClick={toggleTheme}
              className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'retro' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
              <span>Toggle Theme</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
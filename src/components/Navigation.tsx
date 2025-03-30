import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, Shield, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navigation() {
  const location = useLocation();
  
  const iconVariants = {
    diary: {
      open: { rotateY: [0, 180, 0], transition: { duration: 1 } },
      closed: { rotateY: 0 }
    },
    globe: {
      spin: { rotate: 360, transition: { duration: 2, repeat: Infinity, ease: "linear" } },
      stop: { rotate: 0 }
    },
    shield: {
      create: { 
        scale: [0, 1.2, 1],
        opacity: [0, 1],
        transition: { duration: 0.5 }
      },
      rest: { scale: 1, opacity: 1 }
    }
  };

  return (
    <nav className="bg-black border-b border-green-500 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold retro-text flex items-center gap-2">
          <motion.div
            animate={location.pathname === '/' ? 'open' : 'closed'}
            variants={iconVariants.diary}
          >
            <Book className="text-green-400" />
          </motion.div>
          RetroLog
        </Link>
        
        <div className="flex gap-6">
          <Link
            to="/"
            className={`flex items-center gap-2 hover:text-green-300 transition-colors ${
              location.pathname === '/' ? 'text-green-400 retro-glow' : 'text-green-600'
            }`}
          >
            <motion.div
              animate={location.pathname === '/' ? 'open' : 'closed'}
              variants={iconVariants.diary}
            >
              <Book size={20} />
            </motion.div>
            Diary
          </Link>
          
          <Link
            to="/public"
            className={`flex items-center gap-2 hover:text-green-300 transition-colors ${
              location.pathname === '/public' ? 'text-green-400 retro-glow' : 'text-green-600'
            }`}
          >
            <motion.div
              animate={location.pathname === '/public' ? 'spin' : 'stop'}
              variants={iconVariants.globe}
            >
              <Globe size={20} />
            </motion.div>
            Public Feed
          </Link>
          
          <Link
            to="/admin"
            className={`flex items-center gap-2 hover:text-green-300 transition-colors ${
              location.pathname === '/admin' ? 'text-green-400 retro-glow' : 'text-green-600'
            }`}
          >
            <motion.div
              animate={location.pathname === '/admin' ? 'create' : 'rest'}
              variants={iconVariants.shield}
            >
              <Shield size={20} />
            </motion.div>
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
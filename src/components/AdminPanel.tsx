import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Trash2, Check, X, Eye, AlertCircle, Heart, Search, Filter, ArrowUpDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface Entry {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_public: boolean;
  views: number;
  likes: number;
}

export default function AdminPanel() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'likes'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === import.meta.env.VITE_ADMIN_EMAIL) {
        setIsAdmin(true);
        fetchEntries();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error('Failed to verify admin status');
    } finally {
      setLoading(false);
    }
  }

  async function fetchEntries() {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast.error('Failed to fetch entries');
    }
  }

  async function handleDeleteEntry(id: string) {
    try {
      setSelectedEntry(id);
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Entry deleted');
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    } finally {
      setSelectedEntry(null);
    }
  }

  async function handleTogglePublic(id: string, currentState: boolean) {
    try {
      setSelectedEntry(id);
      const { error } = await supabase
        .from('diary_entries')
        .update({ is_public: !currentState })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Entry ${currentState ? 'hidden from' : 'added to'} public feed`);
      fetchEntries();
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update entry');
    } finally {
      setSelectedEntry(null);
    }
  }

  const handleSort = (newSortBy: 'date' | 'views' | 'likes') => {
    if (newSortBy === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const filteredEntries = entries
    .filter(entry => 
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.user_id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'date':
          return multiplier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        case 'views':
          return multiplier * ((a.views || 0) - (b.views || 0));
        case 'likes':
          return multiplier * ((a.likes || 0) - (b.likes || 0));
        default:
          return 0;
      }
    });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const entryVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loading">
          <div></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="card text-center">
          <h1 className="text-2xl font-bold mb-6 retro-text flex items-center justify-center gap-2">
            <AlertCircle className="text-error" />
            Access Denied
          </h1>
          <p className="text-text-secondary">Administrator access is required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="text-5xl font-bold mb-4 retro-text">
          <Shield className="inline-block mr-3 float" size={40} />
          Admin Panel
        </h1>
        <p className="text-text-secondary">Manage diary entries and user content</p>
      </motion.div>

      <div className="mb-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search entries..."
              className="w-full terminal-input rounded-xl px-6 py-3 text-lg"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSort('date')}
            className={`button-secondary ${
              sortBy === 'date' ? 'bg-primary text-background' : ''
            }`}
          >
            <ArrowUpDown size={18} className="mr-2" />
            Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('views')}
            className={`button-secondary ${
              sortBy === 'views' ? 'bg-primary text-background' : ''
            }`}
          >
            <Eye size={18} className="mr-2" />
            Views {sortBy === 'views' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('likes')}
            className={`button-secondary ${
              sortBy === 'likes' ? 'bg-primary text-background' : ''
            }`}
          >
            <Heart size={18} className="mr-2" />
            Likes {sortBy === 'likes' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {filteredEntries.map((entry) => (
            <motion.div
              key={entry.id}
              variants={entryVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="card group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="badge">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                    <span className="badge">
                      <Filter size={14} className="mr-1" />
                      {entry.user_id}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge">
                    <Eye size={14} className="mr-1" />
                    {entry.views || 0}
                  </span>
                  <span className="badge">
                    <Heart size={14} className="mr-1" />
                    {entry.likes || 0}
                  </span>
                </div>
              </div>

              <p className="text-lg mb-6 whitespace-pre-wrap group-hover:text-primary transition-colors">
                {entry.content}
              </p>

              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => handleTogglePublic(entry.id, entry.is_public)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`emoji-button ${
                    entry.is_public ? 'bg-success' : 'bg-error'
                  }`}
                  disabled={selectedEntry === entry.id}
                >
                  {entry.is_public ? <Check size={18} /> : <X size={18} />}
                </motion.button>

                <motion.button
                  onClick={() => handleDeleteEntry(entry.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="emoji-button bg-error"
                  disabled={selectedEntry === entry.id}
                >
                  <Trash2 size={18} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
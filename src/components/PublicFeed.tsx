import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Heart, MessageSquare, Share2, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface PublicEntry {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likes: number;
  views: number;
  is_public: boolean;
}

export default function PublicFeed() {
  const [entries, setEntries] = useState<PublicEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicEntries();
  }, []);

  async function fetchPublicEntries() {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      toast.error('Failed to fetch public entries');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(id: string) {
    try {
      const { error } = await supabase
        .from('diary_entries')
        .update({ likes: (entries.find(e => e.id === id)?.likes || 0) + 1 })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Liked!');
      fetchPublicEntries();
    } catch (error) {
      toast.error('Failed to like entry');
      console.error('Error:', error);
    }
  }

  async function handleShare(entry: PublicEntry) {
    try {
      await navigator.share({
        title: 'Diary Entry',
        text: entry.content,
        url: window.location.href
      });
      toast.success('Shared successfully!');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share');
        console.error('Error:', error);
      }
    }
  }

  const entryVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Globe className="w-8 h-8 text-green-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.h1 
        className="text-3xl font-bold mb-8 retro-text flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Globe className="animate-spin-slow" />
        Public Feed
      </motion.h1>

      <AnimatePresence>
        <div className="space-y-6">
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              variants={entryVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="retro-border p-6 rounded-lg hover:shadow-lg hover:shadow-green-400/20 transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-green-600">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <Eye size={16} />
                  <span className="text-sm">{entry.views || 0}</span>
                </div>
              </div>

              <p className="text-green-300 mb-6 whitespace-pre-wrap">{entry.content}</p>

              <div className="flex items-center gap-6 text-green-600">
                <motion.button
                  onClick={() => handleLike(entry.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-2 hover:text-green-400 transition-colors"
                >
                  <Heart size={18} />
                  <span>{entry.likes || 0}</span>
                </motion.button>

                <motion.button
                  onClick={() => handleShare(entry)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-2 hover:text-green-400 transition-colors"
                >
                  <Share2 size={18} />
                  <span>Share</span>
                </motion.button>

                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center gap-2"
                >
                  <MessageSquare size={18} />
                  <span>Comment</span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
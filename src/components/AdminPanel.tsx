import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Trash2, Check, X, Eye, AlertCircle, Heart } from 'lucide-react';
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
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      x: 20,
      transition: { duration: 0.2 }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Shield className="w-8 h-8 text-green-400" />
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <motion.div 
          className="retro-border p-8 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold mb-6 retro-text flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            Access Denied
          </h1>
          <p className="mb-4 text-green-400">Administrator access is required.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.h1 
        className="text-3xl font-bold mb-8 retro-text flex items-center gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Shield />
        Admin Panel
      </motion.h1>

      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              variants={entryVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="retro-border p-6 rounded-lg"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-green-600">{entry.user_id}</p>
                  <p className="text-xs text-green-700">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-4 mr-4 text-green-600">
                    <div className="flex items-center gap-1">
                      <Eye size={16} />
                      <span>{entry.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart size={16} />
                      <span>{entry.likes || 0}</span>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => handleTogglePublic(entry.id, entry.is_public)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded ${
                      entry.is_public ? 'bg-green-700' : 'bg-gray-700'
                    }`}
                    disabled={selectedEntry === entry.id}
                  >
                    {entry.is_public ? <Check size={16} /> : <X size={16} />}
                  </motion.button>
                  <motion.button
                    onClick={() => handleDeleteEntry(entry.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded bg-red-900 text-red-400"
                    disabled={selectedEntry === entry.id}
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </div>
              <p className="text-green-300 whitespace-pre-wrap">{entry.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
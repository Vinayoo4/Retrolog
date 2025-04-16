import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Plane, Download, Edit2, X, Save, Tag, Plus, Calendar, Lock, Globe, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface DiaryEntry {
  id: string;
  content: string;
  created_at: string;
  category_id?: string;
  is_public?: boolean;
  user_id: string;
  categories: string[];
}

interface Category {
  id: string;
  name: string;
  description: string;
}

function DiaryApp() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
    fetchCategories();
  }, [user]);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast('Failed to load categories', 'error');
    }
  }

  const fetchEntries = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      showToast('Failed to load entries', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newEntry.trim()) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('entries')
        .insert([
          {
            content: newEntry.trim(),
            user_id: user.id,
            is_public: isPublic,
            categories: selectedCategories
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setEntries([data, ...entries]);
      setNewEntry('');
      setIsPublic(false);
      setSelectedCategories([]);
      setIsExpanded(false);
      showToast('Entry created successfully', 'success');
    } catch (error) {
      console.error('Error creating entry:', error);
      showToast('Failed to create entry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStartEdit(entry: DiaryEntry) {
    setEditingEntry(entry.id);
    setEditContent(entry.content);
    setEditCategory(entry.category_id || '');
    setEditIsPublic(entry.is_public || false);
  }

  async function handleSaveEdit() {
    if (!editingEntry) return;

    try {
      const { error } = await supabase
        .from('entries')
        .update({
          content: editContent,
          category_id: editCategory || null,
          is_public: editIsPublic,
        })
        .eq('id', editingEntry)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchEntries();
      showToast('Entry updated successfully', 'success');
    } catch (error) {
      console.error('Error updating entry:', error);
      showToast('Failed to update entry', 'error');
    }

    setEditingEntry(null);
    setEditContent('');
    setEditCategory('');
    setEditIsPublic(false);
  }

  function handleCancelEdit() {
    setEditingEntry(null);
    setEditContent('');
    setEditCategory('');
    setEditIsPublic(false);
  }

  function handleBackup() {
    const content = entries
      .map(
        (entry) =>
          `[${new Date(entry.created_at).toLocaleString()}]\n${
            entry.content
          }\n\n`
      )
      .join('---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diary-backup-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Backup created!');
  }

  const handleDelete = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEntries(entries.filter(entry => entry.id !== id));
      showToast('Entry deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting entry:', error);
      showToast('Failed to delete entry', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Please sign in to view your diary</h2>
        <p className="text-text-secondary">Your personal thoughts and memories await you.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold retro-text mb-2">Your Diary</h1>
          <p className="text-text-secondary">Write down your thoughts and memories</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/80 transition-colors"
        >
          <Plus size={20} />
          <span>New Entry</span>
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <textarea
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder="Write your thoughts here..."
              className="w-full h-48 p-4 bg-surface border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
            />
            
            <div className="flex flex-wrap gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategories(prev =>
                      prev.includes(category.id)
                        ? prev.filter(c => c !== category.id)
                        : [...prev, category.id]
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    selectedCategories.includes(category.id)
                      ? 'bg-primary text-background'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary/50 border-primary/20 rounded"
                />
                <span className="text-text-secondary">Make this entry public</span>
              </label>

              <button
                type="submit"
                className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/80 transition-colors"
              >
                Save Entry
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading your entries...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-bold mb-2">No entries yet</h3>
          <p className="text-text-secondary">Start writing your first entry!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-surface border border-primary/20 rounded-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Calendar size={16} />
                  <span>{formatDate(entry.created_at)}</span>
                  {entry.is_public ? (
                    <span className="flex items-center gap-1 text-primary">
                      <Globe size={16} />
                      <span>Public</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Lock size={16} />
                      <span>Private</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="p-2 text-text-secondary hover:text-error transition-colors"
                  aria-label="Delete entry"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <p className="whitespace-pre-wrap">{entry.content}</p>

              {entry.categories && entry.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.categories.map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DiaryApp;

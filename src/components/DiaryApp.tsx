import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Plane, Download, Edit2, X, Save, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface DiaryEntry {
  id: string;
  content: string;
  created_at: string;
  category_id?: string;
  is_public?: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

function DiaryApp() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isPublic, setIsPublic] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);

  useEffect(() => {
    fetchEntries();
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to fetch categories');
      return;
    }
    setCategories(data || []);
  }

  async function fetchEntries() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      loadLocalEntries();
      return;
    }

    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch entries');
      loadLocalEntries();
      return;
    }

    setEntries(data || []);
    saveLocalEntries(data || []);
  }

  function loadLocalEntries() {
    const savedEntries = localStorage.getItem('diaryEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }

  function saveLocalEntries(updatedEntries: DiaryEntry[]) {
    localStorage.setItem('diaryEntries', JSON.stringify(updatedEntries));
    setEntries(updatedEntries);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newEntry.trim()) return;

    setIsSubmitting(true);

    const entry: DiaryEntry = {
      id: crypto.randomUUID(),
      content: newEntry,
      created_at: new Date().toISOString(),
      category_id: selectedCategory || undefined,
      is_public: isPublic,
    };

    // Save to Supabase if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('diary_entries').insert([
        {
          ...entry,
          user_id: user.id,
          is_public: isPublic,
          category_id: selectedCategory || null,
        },
      ]);

      if (error) {
        toast.error('Failed to save entry online');
      } else {
        toast.success('Entry saved!');
        fetchEntries(); // Refresh entries list
      }
    } else {
      // Save locally if not authenticated
      const updatedEntries = [entry, ...entries];
      saveLocalEntries(updatedEntries);
      toast.success('Entry saved locally!');
    }

    setNewEntry('');
    setIsSubmitting(false);
    setSelectedCategory('');
    setIsPublic(false);
  }

  async function handleStartEdit(entry: DiaryEntry) {
    setEditingEntry(entry.id);
    setEditContent(entry.content);
    setEditCategory(entry.category_id || '');
    setEditIsPublic(entry.is_public || false);
  }

  async function handleSaveEdit() {
    if (!editingEntry) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('diary_entries')
        .update({
          content: editContent,
          category_id: editCategory || null,
          is_public: editIsPublic,
        })
        .eq('id', editingEntry)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to update entry');
      } else {
        toast.success('Entry updated!');
        fetchEntries(); // Refresh entries list
      }
    } else {
      // Update locally if not authenticated
      const updatedEntries = entries.map((entry) =>
        entry.id === editingEntry
          ? {
              ...entry,
              content: editContent,
              category_id: editCategory,
              is_public: editIsPublic,
            }
          : entry
      );
      saveLocalEntries(updatedEntries);
      toast.success('Entry updated locally!');
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold retro-text flex items-center gap-2">
          <Book />
          Personal Diary
        </h1>
        <motion.button
          onClick={handleBackup}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 retro-border rounded"
        >
          <Download size={20} />
          Backup
        </motion.button>
      </div>
      <form onSubmit={handleSubmit} className="mb-8">
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          className="w-full h-32 mb-4 terminal-input rounded"
          placeholder="Write your thoughts..."
          style={{
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
            maxWidth: '100%',
          }}
        />
        <div className="flex gap-4 mb-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="terminal-input rounded px-3 py-2 flex-1"
          >
            // Select category code snippet
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-green-400">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="terminal-input rounded"
            />
            Share Publicly
          </label>
        </div>
        <motion.button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 retro-border rounded relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Plane className={isSubmitting ? 'animate-takeoff' : ''} />
            {isSubmitting ? 'Taking off...' : 'Save Entry'}
          </span>
        </motion.button>
      </form>
      <div className="space-y-6">
        <AnimatePresence>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="retro-border p-6 rounded"
              style={{
                overflowWrap: 'break-word',
                whiteSpace: 'normal',
                maxWidth: '100%',
              }}
            >
              {editingEntry === entry.id ? (
                <div className="space-y-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-32 terminal-input rounded"
                  />
                  <div className="flex gap-4">
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="terminal-input rounded px-3 py-2 flex-1"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    <label className="flex items-center gap-2 text-green-400">
                      <input
                        type="checkbox"
                        checked={editIsPublic}
                        onChange={(e) => setEditIsPublic(e.target.checked)}
                        className="terminal-input rounded"
                      />
                      Share Publicly
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <motion.button
                      onClick={handleCancelEdit}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 retro-border rounded flex items-center gap-2"
                    >
                      <X size={16} />
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleSaveEdit}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 retro-border rounded flex items-center gap-2"
                    >
                      <Save size={16} />
                      Save Changes
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-green-600">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                    <motion.button
                      onClick={() => handleStartEdit(entry)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Edit2 size={16} />
                    </motion.button>
                  </div>
                  <p
                    className="text-green-400 whitespace-pre-wrap"
                    style={{
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      maxWidth: '100%',
                    }}
                  >
                    {entry.content}
                  </p>
                  {entry.category_id && (
                    <div className="mt-2 flex items-center gap-1 text-green-600">
                      <Tag size={14} />
                      <span className="text-sm">
                        {
                          categories.find((c) => c.id === entry.category_id)
                            ?.name
                        }
                      </span>
                    </div>
                  )}
                  {entry.is_public && (
                    <div className="mt-2 text-sm text-green-600">
                      Shared publicly
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DiaryApp;

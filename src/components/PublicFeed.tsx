import { useState, useEffect,  useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Heart, MessageSquare, Share2, Eye,  Filter, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useInView } from 'react-intersection-observer';

interface PublicEntry {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likes: number;
  views: number;
  is_public: boolean;
  category_id?: string;
  category?: {
    name: string;
  };
  comments?: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
  }[];
}

interface Category {
  id: string;
  name: string;
}

export default function PublicFeed() {
  const [entries, setEntries] = useState<PublicEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'likes' | 'views'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const { ref, inView } = useInView();
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Default categories as fallback
  const defaultCategories: Category[] = [
    { id: 'personal', name: 'Personal' },
    { id: 'tech', name: 'Tech' },
    { id: 'travel', name: 'Travel' },
    { id: 'health', name: 'Health' },
    { id: 'work', name: 'Work' }
  ];

  useEffect(() => {
    fetchCategories();
    fetchPublicEntries();
  }, []);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMoreEntries();
    }
  }, [inView, hasMore, loading]);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        // Use default categories if fetch fails
        setCategories(defaultCategories);
        return;
      }

      if (!data || data.length === 0) {
        // Use default categories if no categories exist
        setCategories(defaultCategories);
        return;
      }

      setCategories(data);
    } catch (error) {
      console.error('Error in fetchCategories:', error);
      // Use default categories on error
      setCategories(defaultCategories);
    }
  }

  async function fetchPublicEntries(reset = true) {
    try {
      setLoading(true);
      setError(null);
      const currentPage = reset ? 1 : page;
      const pageSize = 10;

      let query = supabase
        .from('diary_entries')
        .select(`
          *,
          category:categories(name),
          comments:diary_comments(*)
        `)
        .eq('is_public', true);

      // Only apply category filter if we have categories from the database
      if (selectedCategory && categories !== defaultCategories) {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (reset) {
        setEntries(data || []);
      } else {
        setEntries(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data?.length || 0) === pageSize);
      if (!reset) setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setError('Failed to fetch entries. Please check your connection and try again.');
      
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchPublicEntries(reset);
        }, 2000 * (retryCount + 1)); // Exponential backoff
      }
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
      fetchPublicEntries(true);
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

  async function handleAddComment(entryId: string) {
    if (!newComment.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to comment');
        return;
      }

      const { error } = await supabase
        .from('diary_comments')
        .insert([{
          content: newComment,
          entry_id: entryId,
          user_id: user.id
        }]);

      if (error) throw error;

      toast.success('Comment added!');
      setNewComment('');
      fetchPublicEntries(true);
    } catch (error) {
      toast.error('Failed to add comment');
      console.error('Error:', error);
    }
  }

  async function trackView(entryId: string) {
    try {
      const { error } = await supabase
        .from('diary_entries')
        .update({ views: (entries.find(e => e.id === entryId)?.views || 0) + 1 })
        .eq('id', entryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  const loadMoreEntries = useCallback(() => {
    if (!loading && hasMore) {
      fetchPublicEntries(false);
    }
  }, [loading, hasMore]);

  const handleSort = (newSortBy: 'date' | 'likes' | 'views') => {
    if (newSortBy === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setPage(1);
    fetchPublicEntries(true);
  };

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

  if (error && retryCount >= maxRetries) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-4 text-error">Connection Error</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <button
            onClick={() => {
              setRetryCount(0);
              fetchPublicEntries(true);
            }}
            className="button-primary"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (loading && entries.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loading">
          <div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="text-5xl font-bold mb-4 retro-text">
          <Globe className="inline-block mr-3 float" size={40} />
          Public Feed
        </h1>
        <p className="text-text-secondary">Discover and share thoughts with the community</p>
      </motion.div>

      <motion.div
        className="mb-8 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
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
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="terminal-input rounded-xl px-4 py-3"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSort('date')}
            className={`button-secondary ${
              sortBy === 'date' ? 'bg-primary text-background' : ''
            }`}
          >
            <Calendar size={18} className="mr-2" />
            Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
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
          <button
            onClick={() => handleSort('views')}
            className={`button-secondary ${
              sortBy === 'views' ? 'bg-primary text-background' : ''
            }`}
          >
            <Eye size={18} className="mr-2" />
            Views {sortBy === 'views' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </motion.div>

      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <AnimatePresence>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              variants={entryVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="card group"
              onMouseEnter={() => trackView(entry.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="badge">
                    <Calendar size={14} className="mr-1" />
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                  {entry.category && (
                    <span className="badge">
                      <Filter size={14} className="mr-1" />
                      {entry.category.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge">
                    <Eye size={14} className="mr-1" />
                    {entry.views || 0}
                  </span>
                </div>
              </div>

              <p className="text-lg mb-6 whitespace-pre-wrap group-hover:text-primary transition-colors">
                {entry.content}
              </p>

              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => handleLike(entry.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="emoji-button bg-primary/20 text-primary"
                >
                  <Heart size={18} />
                  <span className="ml-2">{entry.likes || 0}</span>
                </motion.button>

                <motion.button
                  onClick={() => handleShare(entry)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="emoji-button bg-primary/20 text-primary"
                >
                  <Share2 size={18} />
                </motion.button>

                <motion.button
                  onClick={() => setShowComments(showComments === entry.id ? null : entry.id)}
                  whileHover={{ scale: 1.1 }}
                  className="emoji-button bg-primary/20 text-primary"
                >
                  <MessageSquare size={18} />
                  <span className="ml-2">{entry.comments?.length || 0}</span>
                </motion.button>
              </div>

              {showComments === entry.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 space-y-4"
                >
                  <div className="space-y-4">
                    {entry.comments?.map(comment => (
                      <div key={comment.id} className="card p-4">
                        <p className="text-text-secondary">{comment.content}</p>
                        <p className="text-sm text-text-secondary/60 mt-2">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 terminal-input rounded-xl px-4 py-3"
                    />
                    <button
                      onClick={() => handleAddComment(entry.id)}
                      className="button-primary"
                    >
                      Comment
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <div ref={ref} className="h-20 flex justify-center items-center">
        {loading && entries.length > 0 && (
          <div className="loading">
            <div></div>
          </div>
        )}
      </div>
    </div>
  );
}
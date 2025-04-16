import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Verify the URL is valid
try {
  new URL(supabaseUrl);
} catch (e) {
  console.error('Invalid Supabase URL:', supabaseUrl);
  throw new Error('Invalid Supabase URL');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add error handling middleware
supabase.auth.onAuthStateChange((event: string, session: any) => {
  console.log('Auth state changed:', event, session);
});

// Add a function to test the connection
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
}
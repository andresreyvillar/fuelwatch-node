import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials since Cloudflare Pages doesn't inject env vars in SSR runtime
// These are public credentials (ANON_KEY is safe to expose)
const supabaseUrl = 'https://vmcvdpocewzaxqlzldbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtY3ZkcG9jZXd6YXhxbHpsZGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTc4NzMsImV4cCI6MjA4NTczMzg3M30.wtbJ5zTTAHQjHfIgfGZYurGnwpbiaGqOChw6wvIzzRE';

export const supabase = createClient(supabaseUrl, supabaseKey);

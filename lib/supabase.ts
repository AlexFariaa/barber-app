import { createClient } from '@supabase/supabase-js';

// Assegure-se de que essas variáveis de ambiente estejam definidas no seu projeto
const supabaseUrl = process.env.SUPABASE_URL || 'https://vgmirwzwwfqtwaygpdsk.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbWlyd3p3d2ZxdHdheWdwZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5Njc0MzUsImV4cCI6MjA4MDU0MzQzNX0.0OXwL0MnAO35VxbZW7bQz29E88PVOSHc2drrXztjL_Y';

export const supabase = createClient(supabaseUrl, supabaseKey);
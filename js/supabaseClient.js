const SUPABASE_URL = 'https://qvauvxbijwitxaqcbpoy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YXV2eGJpandpdHhhcWNicG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NzQ4NjIsImV4cCI6MjA2MTE1MDg2Mn0.PF2c4VZxwH1lRQ0bHh4mGKY3r-AFz5dpLD79Egf4ZIo';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase URL or Anon Key is missing. Please update js/supabaseClient.js");
    alert("Supabase credentials are not configured. Please check the console and update js/supabaseClient.js.");
}

const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose the supabase client to other scripts
window.supabase = supabase;

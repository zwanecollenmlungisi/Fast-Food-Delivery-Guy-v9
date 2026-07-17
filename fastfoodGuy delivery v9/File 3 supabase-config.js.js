// ================================================================
//  🍔 FASTFOOD GUY — SUPABASE CONFIGURATION
//  ================================================================

// ================================================================
//  🔧 STEP 1: INSERT YOUR SUPABASE CREDENTIALS HERE
//  ================================================================

// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://your-project-id.supabase.co';     // ← PASTE YOUR PROJECT URL HERE
const SUPABASE_ANON_KEY = 'your-anon-key-here';                // ← PASTE YOUR ANON KEY HERE

// ================================================================
//  🔥 STEP 2: INITIALIZE SUPABASE CLIENT
//  ================================================================

// Create the Supabase client instance
const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================================================================
//  🔥 STEP 3: EXPORT FOR OTHER MODULES
//  ================================================================

// Make supabase available globally
window.supabase = supabase;

console.log('✅ Supabase client initialized');
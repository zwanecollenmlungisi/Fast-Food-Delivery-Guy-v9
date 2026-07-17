// ================================================================
//  🍔 FASTFOOD GUY — SUPABASE CONFIGURATION
//  ================================================================

// ================================================================
//  🔧 STEP 1: INSERT YOUR SUPABASE CREDENTIALS HERE
//  ================================================================

// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://jcedbbscgovkmmptpxpr.supabase.co';     // ← PASTE YOUR PROJECT URL HERE
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZWRiYnNjZ292a21tcHRweHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NTQxMjYsImV4cCI6MjA5OTAzMDEyNn0.oxp4vl-hZ-XEk4NtIrN5mFPYX28iB9AFGuVpvFIi1r4';                // ← PASTE YOUR ANON KEY HERE

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
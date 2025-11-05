import { createClient } from '@supabase/supabase-js'

// The application requires a connection to a Supabase backend.
// Environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are expected to be provided.
// If they are not available, we use non-functional placeholders to prevent the app from crashing.
// The app will display a configuration error message until valid credentials are provided.
const supabaseUrl = process.env.SUPABASE_URL || 'https://iymyjcmaepnxztsuiebt.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5bXlqY21hZXBueHp0c3VpZWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzU2NjksImV4cCI6MjA3Nzg1MTY2OX0.nPQCIBR-iDYZYoY8RUS1w01SSIzBnT3vA3M1MIftMkQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * A helper flag to check if the Supabase client is configured with real credentials.
 * The UI uses this to display a helpful error message if the environment is not set up.
 */
export const isSupabaseConfigured = 
    supabaseUrl !== 'https://placeholder.supabase.co' && 
    supabaseAnonKey !== 'placeholder-anon-key';

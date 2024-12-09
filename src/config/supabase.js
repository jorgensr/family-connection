import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xcxfkhbsukivskainkbd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjeGZraGJzdWtpdnNrYWlua2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NDM1NjQsImV4cCI6MjA0NzUxOTU2NH0.lL-l1k7lU2TdtbPCshkZ1vVmcOMLqZgp6pkDIsBTdwY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://wkpnbuqvewwuzalzgvzq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcG5idXF2ZXd3dXphbHpndnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4ODMwNzEsImV4cCI6MjA5NzQ1OTA3MX0.Xsg2PrEEAkx3cjaX3MO1WOUA_q0rBOH5aDYIdRwKgtA';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export {
  fromAgence,
  insertAgence,
  withAgence,
  getIdAgence,
  setAgenceSession,
  resolveUserAgence,
  hashEmail,
  AGENCE_TABLES,
  NO_AGENCE_FILTER
} from './agence.js';

console.log("🟢 Supabase prêt et exporté depuis sp.js");

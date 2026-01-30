import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jbizclhfkhfcahvkadvk.supabase.co';
const supabaseKey = 'sb_publishable_QyRQ61mxpOzoST1Yxctr_Q_5O1G3TvV';

export const supabase = createClient(supabaseUrl, supabaseKey);
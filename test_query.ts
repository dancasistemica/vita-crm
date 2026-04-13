
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const organizationId = 'c1f46b94-dbdc-4c98-a24f-594d38cd1367';
  
  console.log('Testing sales query...');
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('*, leads(name, email)')
    .eq('organization_id', organizationId);
    
  if (salesError) {
    console.error('Sales Error:', salesError);
  } else {
    console.log('Sales Count:', sales?.length);
  }

  console.log('Testing subscriptions query...');
  const { data: subs, error: subsError } = await supabase
    .from('subscriptions')
    .select('*, leads(name, email)')
    .eq('organization_id', organizationId);
    
  if (subsError) {
    console.error('Subscriptions Error:', subsError);
  } else {
    console.log('Subscriptions Count:', subs?.length);
  }
}

testQuery();

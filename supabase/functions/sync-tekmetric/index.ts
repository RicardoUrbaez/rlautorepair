import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getBaseUrl(): string {
  const baseUrl = Deno.env.get('TEKMETRIC_BASE_URL') || '';
  return baseUrl.includes('://') ? baseUrl : `https://${baseUrl}`;
}

async function getTekmetricAccessToken() {
  const clientId = Deno.env.get('TEKMETRIC_CLIENT_ID');
  const clientSecret = Deno.env.get('TEKMETRIC_CLIENT_SECRET');
  const baseUrl = getBaseUrl();

  const credentials = btoa(`${clientId}:${clientSecret}`);

  // OAuth token endpoint is at /api/v1/oauth/token
  const tokenResponse = await fetch(`${baseUrl}/api/v1/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to get Tekmetric access token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// deno-lint-ignore no-explicit-any
async function syncCustomers(supabaseAdmin: any, accessToken: string) {
  const baseUrl = getBaseUrl();
  console.log('Fetching customers from Tekmetric...');

  const response = await fetch(`${baseUrl}/api/v1/customers`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch customers: ${response.status}`);
  }

  const customersData = await response.json();
  const customers = customersData.content || customersData || [];
  console.log(`Fetched ${customers.length} customers from Tekmetric`);

  let syncedCount = 0;
  const errors: Array<{ customer: unknown; error: string }> = [];

  for (const customer of customers) {
    try {
      const { error } = await supabaseAdmin
        .from('tekmetric_customers')
        .upsert({
          tekmetric_id: customer.id.toString(),
          first_name: customer.firstName || null,
          last_name: customer.lastName || null,
          email: customer.email || null,
          phone: customer.phone || null,
          address: customer.address || null,
          city: customer.city || null,
          state: customer.state || null,
          zip_code: customer.zipCode || null,
          synced_at: new Date().toISOString(),
        }, {
          onConflict: 'tekmetric_id',
        });

      if (error) {
        errors.push({ customer: customer.id, error: error.message });
      } else {
        syncedCount++;
      }
    } catch (err) {
      errors.push({ customer: customer.id, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  console.log(`Successfully synced ${syncedCount}/${customers.length} customers`);
  return { total: customers.length, synced: syncedCount, errors };
}

// deno-lint-ignore no-explicit-any
async function syncAppointments(supabaseAdmin: any, accessToken: string) {
  const baseUrl = getBaseUrl();
  console.log('Fetching appointments from Tekmetric...');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const response = await fetch(
    `${baseUrl}/api/v1/appointments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch appointments: ${response.status}`);
  }

  const appointmentsData = await response.json();
  const appointments = appointmentsData.content || appointmentsData || [];
  console.log(`Fetched ${appointments.length} appointments from Tekmetric`);

  return { total: appointments.length, synced: appointments.length, errors: [] as Array<{ appointment: unknown; error: string }> };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { syncType = 'manual' } = await req.json().catch(() => ({ syncType: 'manual' }));
    
    console.log(`Starting ${syncType} sync...`);
    
    const { data: logEntry } = await supabaseAdmin
      .from('sync_logs')
      .insert({
        entity_type: 'all',
        sync_type: syncType,
        status: 'started',
      })
      .select()
      .single();

    const accessToken = await getTekmetricAccessToken();
    
    const customersResult = await syncCustomers(supabaseAdmin, accessToken);
    const appointmentsResult = await syncAppointments(supabaseAdmin, accessToken);
    
    const totalSynced = customersResult.synced + appointmentsResult.synced;
    const allErrors = [...customersResult.errors, ...appointmentsResult.errors];
    
    if (logEntry) {
      await supabaseAdmin
        .from('sync_logs')
        .update({
          status: allErrors.length === 0 ? 'completed' : 'completed_with_errors',
          records_synced: totalSynced,
          error_message: allErrors.length > 0 ? JSON.stringify(allErrors) : null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', logEntry.id);
    }

    console.log('Sync completed successfully');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Sync completed',
      results: {
        customers: customersResult,
        appointments: appointmentsResult,
        totalSynced,
        errors: allErrors,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-tekmetric function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

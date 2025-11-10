import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getTekmetricAccessToken() {
  const clientId = Deno.env.get('TEKMETRIC_CLIENT_ID');
  const clientSecret = Deno.env.get('TEKMETRIC_CLIENT_SECRET');
  const baseUrl = Deno.env.get('TEKMETRIC_BASE_URL');

  const tokenResponse = await fetch(`https://${baseUrl}/api/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId!,
      client_secret: clientSecret!,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to get Tekmetric access token');
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function syncCustomers(supabaseAdmin: any, accessToken: string) {
  const baseUrl = Deno.env.get('TEKMETRIC_BASE_URL');
  console.log('Fetching customers from Tekmetric...');

  const response = await fetch(`https://${baseUrl}/api/v1/customers`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch customers: ${response.status}`);
  }

  const customers = await response.json();
  console.log(`Fetched ${customers.length} customers from Tekmetric`);

  let syncedCount = 0;
  const errors = [];

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
        console.error('Error upserting customer:', error);
        errors.push({ customer: customer.id, error: error.message });
      } else {
        syncedCount++;
      }
    } catch (err) {
      console.error('Exception upserting customer:', err);
      errors.push({ customer: customer.id, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  console.log(`Successfully synced ${syncedCount}/${customers.length} customers`);
  return { total: customers.length, synced: syncedCount, errors };
}

async function syncAppointments(supabaseAdmin: any, accessToken: string) {
  const baseUrl = Deno.env.get('TEKMETRIC_BASE_URL');
  console.log('Fetching appointments from Tekmetric...');

  // Get appointments from last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const response = await fetch(
    `https://${baseUrl}/api/v1/appointments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
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

  const appointments = await response.json();
  console.log(`Fetched ${appointments.length} appointments from Tekmetric`);

  let syncedCount = 0;
  const errors = [];

  for (const appointment of appointments) {
    try {
      // Map Tekmetric appointment to our appointments table structure
      const { error } = await supabaseAdmin
        .from('appointments')
        .upsert({
          customer_name: `${appointment.customer?.firstName || ''} ${appointment.customer?.lastName || ''}`.trim() || 'Unknown',
          customer_email: appointment.customer?.email || '',
          customer_phone: appointment.customer?.phone || '',
          vehicle_year: appointment.vehicle?.year || null,
          vehicle_make: appointment.vehicle?.make || '',
          vehicle_model: appointment.vehicle?.model || '',
          vin: appointment.vehicle?.vin || null,
          appointment_date: appointment.scheduledDate || new Date().toISOString().split('T')[0],
          appointment_time: appointment.scheduledTime || '09:00',
          status: appointment.status?.toLowerCase() || 'pending',
          notes: appointment.notes || null,
        });

      if (error) {
        console.error('Error upserting appointment:', error);
        errors.push({ appointment: appointment.id, error: error.message });
      } else {
        syncedCount++;
      }
    } catch (err) {
      console.error('Exception upserting appointment:', err);
      errors.push({ appointment: appointment.id, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  console.log(`Successfully synced ${syncedCount}/${appointments.length} appointments`);
  return { total: appointments.length, synced: syncedCount, errors };
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
    
    // Create sync log entry
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
    
    // Sync customers
    const customersResult = await syncCustomers(supabaseAdmin, accessToken);
    
    // Sync appointments
    const appointmentsResult = await syncAppointments(supabaseAdmin, accessToken);
    
    // Update sync log
    const totalSynced = customersResult.synced + appointmentsResult.synced;
    const allErrors = [...customersResult.errors, ...appointmentsResult.errors];
    
    await supabaseAdmin
      .from('sync_logs')
      .update({
        status: allErrors.length === 0 ? 'completed' : 'completed_with_errors',
        records_synced: totalSynced,
        error_message: allErrors.length > 0 ? JSON.stringify(allErrors) : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logEntry.id);

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

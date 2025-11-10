import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessToken() {
  const clientId = Deno.env.get('TEKMETRIC_CLIENT_ID');
  const clientSecret = Deno.env.get('TEKMETRIC_CLIENT_SECRET');
  const baseUrl = Deno.env.get('TEKMETRIC_BASE_URL');

  // Encode credentials for Basic Auth
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const tokenResponse = await fetch(`https://${baseUrl}/api/v1/oauth/token`, {
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
    throw new Error('Failed to get access token');
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const baseUrl = Deno.env.get('TEKMETRIC_BASE_URL');
    const accessToken = await getAccessToken();
    
    // Get request body for parameters
    let params: any = {};
    try {
      const body = await req.text();
      if (body) {
        params = JSON.parse(body);
      }
    } catch (e) {
      // No body or invalid JSON, continue with empty params
    }

    console.log('=== TEKMETRIC APPOINTMENTS REQUEST ===');
    console.log(`Method: ${req.method}`);
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Params:`, JSON.stringify(params, null, 2));

    if (req.method === 'GET' || (req.method === 'POST' && !params.customerId)) {
      // Fetch appointments
      const shopId = params.shopId || params.shop || '238';
      const startDate = params.startDate || '';
      const endDate = params.endDate || '';

      let apiUrl = `https://${baseUrl}/api/v1/appointments`;
      const urlParams = new URLSearchParams();
      urlParams.append('shop', shopId);
      if (startDate) urlParams.append('startDate', startDate);
      if (endDate) urlParams.append('endDate', endDate);
      
      apiUrl += `?${urlParams.toString()}`;

      console.log('Fetching appointments from:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch appointments:', errorText);
        throw new Error(`Failed to fetch appointments: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Successfully fetched ${data.length || 0} appointments`);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (req.method === 'POST' && params.customerId) {
      // Create appointment
      console.log('--- Creating Appointment ---');
      console.log('Request payload:', JSON.stringify(params, null, 2));
      
      // Transform data to match Tekmetric API requirements
      const scheduledDateTime = `${params.scheduledDate}T${params.scheduledTime}`;
      const startTime = new Date(scheduledDateTime).toISOString();
      
      // Calculate endTime (1 hour after startTime by default)
      const endTimeDate = new Date(scheduledDateTime);
      endTimeDate.setHours(endTimeDate.getHours() + 1);
      const endTime = endTimeDate.toISOString();
      
      // Map to Tekmetric's expected field names
      const tekmetricPayload: Record<string, any> = {
        customerId: parseInt(params.customerId),
        shopId: parseInt(params.shopId),
        startTime: startTime,
        endTime: endTime,
        title: params.description || params.title || 'Service Appointment',
        description: params.description || '',
      };
      
      // Add vehicleId only if provided
      if (params.vehicleId) {
        tekmetricPayload.vehicleId = parseInt(params.vehicleId);
      }
      
      console.log('Tekmetric payload:', JSON.stringify(tekmetricPayload, null, 2));
      console.log('Required fields check:');
      console.log('  - customerId:', tekmetricPayload.customerId ? '✅' : '❌ MISSING');
      console.log('  - shopId:', tekmetricPayload.shopId ? '✅' : '❌ MISSING');
      console.log('  - startTime:', tekmetricPayload.startTime ? '✅' : '❌ MISSING');
      console.log('  - endTime:', tekmetricPayload.endTime ? '✅' : '❌ MISSING');
      console.log('  - title:', tekmetricPayload.title ? '✅' : '❌ MISSING');

      const endpoint = `https://${baseUrl}/api/v1/appointments`;
      console.log('POST endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tekmetricPayload),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to create appointment');
        console.error('Status:', response.status);
        console.error('Error body:', errorText);
        
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          errorJson = { message: errorText };
        }

        return new Response(JSON.stringify({
          success: false,
          error: errorJson,
          status: response.status,
          endpoint: endpoint,
          requestPayload: params,
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      console.log('✅ Successfully created appointment');
      console.log('Appointment ID:', data.id);
      console.log('Response data:', JSON.stringify(data, null, 2));

      return new Response(JSON.stringify({
        success: true,
        data: data,
        message: 'Appointment created successfully',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tekmetric-appointments function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

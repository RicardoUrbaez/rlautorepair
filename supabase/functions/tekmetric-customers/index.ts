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
    if (req.method === 'POST' || req.method === 'GET') {
      try {
        const body = await req.text();
        if (body) {
          params = JSON.parse(body);
        }
      } catch (e) {
        // No body or invalid JSON, continue with empty params
      }
    }

    console.log('Fetching customers from Tekmetric API');
    console.log('Params:', JSON.stringify(params, null, 2));

    const shopId = params.shopId || params.shop || '238'; // Default to test shop
    const customerId = params.customerId;
    const email = params.email;
    const phone = params.phone;

    if (req.method === 'GET' || (req.method === 'POST' && !params.firstName)) {
      // Fetch customers
      let apiUrl = `https://${baseUrl}/api/v1/customers`;
      const urlParams = new URLSearchParams();
      urlParams.append('shop', shopId);
      if (customerId) urlParams.append('customerId', customerId);
      if (email) urlParams.append('email', email);
      if (phone) urlParams.append('phone', phone);
      
      apiUrl += `?${urlParams.toString()}`;

      console.log('Fetching from:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch customers:', errorText);
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }

      // Handle empty response
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : { content: [] };
      } catch (e) {
        console.log('Empty or invalid JSON response, returning empty array');
        data = { content: [] };
      }

      console.log(`Successfully fetched ${data.content?.length || data.length || 0} customers`);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (req.method === 'POST' && params.firstName) {
      // Create customer
      console.log('--- Creating Customer ---');
      console.log('Request payload:', JSON.stringify(params, null, 2));

      const endpoint = `https://${baseUrl}/api/v1/customers`;
      console.log('POST endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to create customer');
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
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      console.log('✅ Successfully created customer');
      console.log('Customer ID:', data.id);

      return new Response(JSON.stringify({
        success: true,
        data: data,
        message: 'Customer created successfully',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tekmetric-customers function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

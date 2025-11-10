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

    console.log('Fetching customers from Tekmetric API');

    const url = new URL(req.url);
    const customerId = url.searchParams.get('customerId');
    const email = url.searchParams.get('email');
    const phone = url.searchParams.get('phone');

    let apiUrl = `https://${baseUrl}/api/v1/customers`;
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    if (email) params.append('email', email);
    if (phone) params.append('phone', phone);
    
    if (params.toString()) {
      apiUrl += `?${params.toString()}`;
    }

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

    const data = await response.json();
    console.log(`Successfully fetched ${data.length || 0} customers`);

    return new Response(JSON.stringify(data), {
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

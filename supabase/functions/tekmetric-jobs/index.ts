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

    console.log('=== TEKMETRIC JOBS REQUEST ===');
    console.log('Params:', JSON.stringify(params, null, 2));

    // Fetch repair orders (jobs) - try /jobs endpoint instead of /repair-orders
    const shopId = params.shopId || params.shop || '238';
    const status = params.status;
    const startDate = params.startDate;
    const endDate = params.endDate;

    let apiUrl = `https://${baseUrl}/api/v1/jobs`;
    const urlParams = new URLSearchParams();
    urlParams.append('shop', shopId);
    if (status) urlParams.append('status', status);
    if (startDate) urlParams.append('startDate', startDate);
    if (endDate) urlParams.append('endDate', endDate);
    
    apiUrl += `?${urlParams.toString()}`;

    console.log('Fetching jobs from:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch jobs:', errorText);
      throw new Error(`Failed to fetch jobs: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.content?.length || data.length || 0} jobs`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tekmetric-jobs function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

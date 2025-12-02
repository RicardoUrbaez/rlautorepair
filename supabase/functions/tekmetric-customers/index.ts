import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getBaseUrl(): string {
  const baseUrl = Deno.env.get('TEKMETRIC_BASE_URL') || '';
  return baseUrl.includes('://') ? baseUrl : `https://${baseUrl}`;
}

async function getAccessToken() {
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
    throw new Error('Failed to get access token');
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function isTestMode(): boolean {
  const testMode = Deno.env.get('TEKMETRIC_TEST_MODE');
  return testMode === 'true' || testMode === '1';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const baseUrl = getBaseUrl();
    const accessToken = await getAccessToken();
    
    let params: Record<string, unknown> = {};
    if (req.method === 'POST' || req.method === 'GET') {
      try {
        const body = await req.text();
        if (body) {
          params = JSON.parse(body);
        }
      } catch (e) {
        // No body or invalid JSON
      }
    }

    console.log('Fetching customers from Tekmetric API');
    console.log(`Test Mode: ${isTestMode() ? 'ENABLED' : 'DISABLED'}`);

    const isWriteOperation = params.firstName !== undefined;

    // Block write operations in TEST MODE
    if (isWriteOperation && isTestMode()) {
      console.log('TEST MODE ACTIVE - Blocking write operation');
      return new Response(JSON.stringify({
        error: 'TEST MODE ACTIVE — Write operations are disabled for production safety.',
        testMode: true
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const shopId = params.shopId || params.shop || '';
    const customerId = params.customerId;
    const email = params.email;
    const phone = params.phone;

    if (req.method === 'GET' || (req.method === 'POST' && !params.firstName)) {
      // Fetch customers (GET - always allowed)
      const urlParams = new URLSearchParams();
      if (shopId) urlParams.append('shop', String(shopId));
      if (customerId) urlParams.append('customerId', String(customerId));
      if (email) urlParams.append('email', String(email));
      if (phone) urlParams.append('phone', String(phone));
      
      const apiUrl = `${baseUrl}/api/v1/customers${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;

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

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : { content: [] };
      } catch (e) {
        data = { content: [] };
      }

      console.log(`Successfully fetched ${data.content?.length || data.length || 0} customers`);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (req.method === 'POST' && params.firstName) {
      // Create customer (blocked in TEST MODE - checked above)
      console.log('--- Creating Customer ---');

      const endpoint = `${baseUrl}/api/v1/customers`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create customer:', errorText);
        
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
      console.log('Successfully created customer');

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

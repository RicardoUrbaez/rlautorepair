import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EndpointResult {
  status: number;
  count?: number;
  responseTime: number;
  error?: string;
}

interface EndpointResults {
  [key: string]: EndpointResult;
}

function getBaseUrl(): string {
  const baseUrl = Deno.env.get('TEKMETRIC_BASE_URL') || '';
  return baseUrl.includes('://') ? baseUrl : `https://${baseUrl}`;
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('TEKMETRIC_CLIENT_ID');
  const clientSecret = Deno.env.get('TEKMETRIC_CLIENT_SECRET');
  const baseUrl = getBaseUrl();

  if (!clientId || !clientSecret) {
    throw new Error('Tekmetric credentials not configured');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  // OAuth token endpoint is at /api/v1/oauth/token
  const tokenResponse = await fetch(`${baseUrl}/api/v1/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function testEndpoint(
  baseUrl: string, 
  token: string, 
  endpoint: string, 
  shopId: string
): Promise<EndpointResult> {
  const startTime = Date.now();
  
  try {
    const url = `${baseUrl}/api/v1/${endpoint}${shopId ? `?shop=${shopId}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        status: response.status,
        responseTime,
        error: await response.text(),
      };
    }

    const data = await response.json();
    const count = Array.isArray(data) ? data.length : data.content?.length || 0;

    return {
      status: response.status,
      count,
      responseTime,
    };
  } catch (error) {
    return {
      status: 0,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Tekmetric endpoint discovery...');

    const baseUrl = getBaseUrl();
    const shopId = Deno.env.get('TEKMETRIC_SHOP_ID') || '';

    const token = await getAccessToken();
    console.log('Access token obtained');

    const endpoints = [
      'customers',
      'appointments',
      'repairOrders',
      'jobs',
      'vehicles',
      'employees',
      'invoices',
      'shops',
      'services',
      'technicians',
      'estimates',
      'inspections',
    ];

    console.log(`Testing ${endpoints.length} endpoints...`);

    const results: EndpointResults = {};
    
    await Promise.all(
      endpoints.map(async (endpoint) => {
        const result = await testEndpoint(baseUrl, token, endpoint, shopId);
        results[endpoint] = result;
        console.log(`${endpoint}: ${result.status} (${result.responseTime}ms)`);
      })
    );

    const summary = {
      totalEndpoints: endpoints.length,
      available: Object.values(results).filter(r => r.status >= 200 && r.status < 300).length,
      unauthorized: Object.values(results).filter(r => r.status === 401 || r.status === 403).length,
      notFound: Object.values(results).filter(r => r.status === 404).length,
      errors: Object.values(results).filter(r => r.status >= 500 || r.status === 0).length,
    };

    return new Response(
      JSON.stringify({
        status: 'success',
        environment: baseUrl.includes('sandbox') ? 'sandbox' : 'production',
        baseUrl,
        shopId,
        summary,
        endpoints: results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in tekmetric-endpoints:', error);
    
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

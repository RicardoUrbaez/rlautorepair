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

  console.log('Getting access token...');
  console.log('Base URL:', baseUrl);

  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  // OAuth token endpoint is at /oauth/token (NOT /api/v1/oauth/token)
  const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
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
    console.error('Token request failed:', errorText);
    throw new Error(`Failed to get access token: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const baseUrl = getBaseUrl();
    const clientId = Deno.env.get('TEKMETRIC_CLIENT_ID');
    const testMode = Deno.env.get('TEKMETRIC_TEST_MODE');
    
    console.log('=== TEKMETRIC DEBUG START ===');
    console.log('Environment:', baseUrl);
    console.log('Client ID:', clientId);
    console.log('Test Mode:', testMode === 'true' || testMode === '1' ? 'ENABLED' : 'DISABLED');

    const tokenData = await getAccessToken();
    const accessToken = tokenData.access_token;
    
    console.log('Token obtained successfully');

    // Test 1: Get shops
    console.log('\n--- Testing GET /shops ---');
    const shopsResponse = await fetch(`${baseUrl}/api/v1/shops`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    let shops = [];
    let shopId = null;
    if (shopsResponse.ok) {
      shops = await shopsResponse.json();
      shopId = shops[0]?.id;
    } else {
      const errorText = await shopsResponse.text();
      console.error('Shops request failed:', shopsResponse.status, errorText);
    }

    // Test 2: Get customers
    console.log('\n--- Testing GET /customers ---');
    const customersResponse = await fetch(`${baseUrl}/api/v1/customers?limit=5`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    let customers = [];
    if (customersResponse.ok) {
      const customersData = await customersResponse.json();
      customers = customersData.content || customersData;
    }

    // Test 3: Get appointments
    console.log('\n--- Testing GET /appointments ---');
    const appointmentsResponse = await fetch(`${baseUrl}/api/v1/appointments?limit=5`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    let appointments = [];
    if (appointmentsResponse.ok) {
      const appointmentsData = await appointmentsResponse.json();
      appointments = appointmentsData.content || appointmentsData;
    }

    console.log('=== TEKMETRIC DEBUG END ===');

    const isProduction = !baseUrl.includes('sandbox');
    const isTestModeEnabled = testMode === 'true' || testMode === '1';

    const debugInfo = {
      status: 'ok',
      environment: isProduction ? 'production' : 'sandbox',
      baseUrl: baseUrl,
      clientId: clientId,
      testMode: isTestModeEnabled,
      testModeMessage: isTestModeEnabled 
        ? 'TEST MODE ACTIVE — Write operations are disabled for production safety.'
        : null,
      tokenValid: true,
      tokenExpiresIn: tokenData.expires_in,
      apiTests: {
        shops: {
          success: shopsResponse.ok,
          status: shopsResponse.status,
          count: shops.length,
          shopId: shopId,
        },
        customers: {
          success: customersResponse.ok,
          status: customersResponse.status,
          count: customers.length,
        },
        appointments: {
          success: appointmentsResponse.ok,
          status: appointmentsResponse.status,
          count: appointments.length,
        },
      },
      recommendations: [
        isProduction 
          ? '✅ You are using PRODUCTION environment'
          : '⚠️ You are using SANDBOX environment',
        isTestModeEnabled
          ? '🔒 TEST MODE is ENABLED - Write operations are blocked'
          : '⚠️ TEST MODE is DISABLED - Write operations are allowed',
        shops.length === 0 
          ? '❌ No shops found' 
          : `✅ Shop found: ${shopId}`,
        customers.length === 0 
          ? '⚠️ No customers found' 
          : '✅ Customers available',
      ],
    };

    return new Response(JSON.stringify(debugInfo, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tekmetric-debug function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({
      status: 'error',
      error: errorMessage,
      environment: Deno.env.get('TEKMETRIC_BASE_URL'),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

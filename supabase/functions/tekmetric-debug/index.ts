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

  console.log('Getting access token with client_id:', clientId);
  console.log('Base URL:', baseUrl);

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
    const baseUrl = Deno.env.get('TEKMETRIC_BASE_URL');
    const clientId = Deno.env.get('TEKMETRIC_CLIENT_ID');
    
    console.log('=== TEKMETRIC DEBUG START ===');
    console.log('Environment:', baseUrl);
    console.log('Client ID:', clientId);

    // Get access token
    const tokenData = await getAccessToken();
    const accessToken = tokenData.access_token;
    
    console.log('Token obtained successfully');
    console.log('Token type:', tokenData.token_type);
    console.log('Expires in:', tokenData.expires_in, 'seconds');

    // Test 1: Get shops
    console.log('\n--- Testing GET /shops ---');
    const shopsResponse = await fetch(`https://${baseUrl}/api/v1/shops`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    let shops = [];
    let shopId = null;
    if (shopsResponse.ok) {
      shops = await shopsResponse.json();
      console.log('Shops response:', shops);
      shopId = shops[0]?.id;
    } else {
      const errorText = await shopsResponse.text();
      console.error('Shops request failed:', shopsResponse.status, errorText);
    }

    // Test 2: Get customers
    console.log('\n--- Testing GET /customers ---');
    const customersResponse = await fetch(`https://${baseUrl}/api/v1/customers?limit=5`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    let customers = [];
    if (customersResponse.ok) {
      const customersData = await customersResponse.json();
      customers = customersData.content || customersData;
      console.log('Customers count:', customers.length);
      console.log('First customer:', customers[0]);
    } else {
      const errorText = await customersResponse.text();
      console.error('Customers request failed:', customersResponse.status, errorText);
    }

    // Test 3: Get appointments
    console.log('\n--- Testing GET /appointments ---');
    const appointmentsResponse = await fetch(`https://${baseUrl}/api/v1/appointments?limit=5`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    let appointments = [];
    if (appointmentsResponse.ok) {
      const appointmentsData = await appointmentsResponse.json();
      appointments = appointmentsData.content || appointmentsData;
      console.log('Appointments count:', appointments.length);
      if (appointments.length > 0) {
        console.log('First appointment structure:', JSON.stringify(appointments[0], null, 2));
      }
    } else {
      const errorText = await appointmentsResponse.text();
      console.error('Appointments request failed:', appointmentsResponse.status, errorText);
    }

    // Test 4: Get API schema for appointments (if available)
    console.log('\n--- Testing POST /appointments endpoint availability ---');
    const testAppointmentPayload = {
      customerId: customers[0]?.id || 1,
      shopId: shopId || 1,
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: "10:00:00",
      description: "Test appointment from debug",
    };

    console.log('Test payload:', testAppointmentPayload);

    console.log('=== TEKMETRIC DEBUG END ===');

    const debugInfo = {
      status: 'ok',
      environment: baseUrl?.includes('sandbox') ? 'sandbox' : 'production',
      baseUrl: baseUrl,
      clientId: clientId,
      tokenValid: true,
      tokenExpiresIn: tokenData.expires_in,
      apiTests: {
        shops: {
          success: shopsResponse.ok,
          status: shopsResponse.status,
          count: shops.length,
          shopId: shopId,
          data: shops.slice(0, 2),
        },
        customers: {
          success: customersResponse.ok,
          status: customersResponse.status,
          count: customers.length,
          sampleCustomer: customers[0],
        },
        appointments: {
          success: appointmentsResponse.ok,
          status: appointmentsResponse.status,
          count: appointments.length,
          sampleAppointment: appointments[0],
        },
      },
      testPayload: testAppointmentPayload,
      recommendations: [
        baseUrl?.includes('sandbox') 
          ? '⚠️ You are using SANDBOX environment. Appointments will NOT appear on production Tekmetric.com'
          : '✅ You are using PRODUCTION environment',
        shops.length === 0 ? '❌ No shops found. You need a shop ID to create appointments.' : `✅ Shop found: ${shopId}`,
        customers.length === 0 ? '⚠️ No customers found. Create customers first or use existing customer IDs.' : '✅ Customers available',
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

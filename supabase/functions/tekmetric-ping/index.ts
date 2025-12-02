import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('TEKMETRIC_CLIENT_ID');
    const clientSecret = Deno.env.get('TEKMETRIC_CLIENT_SECRET');
    const baseUrl = Deno.env.get('TEKMETRIC_BASE_URL');

    if (!clientId || !clientSecret || !baseUrl) {
      throw new Error('Missing Tekmetric credentials');
    }

    console.log('Testing Tekmetric API connection...');

    // Encode credentials for Basic Auth
    const credentials = btoa(`${clientId}:${clientSecret}`);

    // CORRECT endpoint: /api/v1/oauth/token
    const tokenUrl = baseUrl.includes('://') 
      ? `${baseUrl}/api/v1/oauth/token`
      : `https://${baseUrl}/api/v1/oauth/token`;

    console.log('Token URL:', tokenUrl);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const responseText = await tokenResponse.text();
    console.log('Token response status:', tokenResponse.status);
    console.log('Token response:', responseText);

    if (!tokenResponse.ok) {
      throw new Error(`Failed to authenticate: ${tokenResponse.status} - ${responseText}`);
    }

    const tokenData = JSON.parse(responseText);
    console.log('Successfully authenticated with Tekmetric API');
    console.log('Scopes (Shop IDs):', tokenData.scope);

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully connected to Tekmetric API',
      baseUrl: baseUrl,
      authenticated: true,
      shopIds: tokenData.scope,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in tekmetric-ping function:', error);
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

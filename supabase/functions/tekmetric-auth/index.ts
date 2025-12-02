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

    console.log('Getting Tekmetric OAuth token...');

    // Encode credentials for Basic Auth
    const credentials = btoa(`${clientId}:${clientSecret}`);

    // OAuth token endpoint is at /oauth/token (not /api/v1/oauth/token)
    const tokenUrl = baseUrl.includes('://') 
      ? `${baseUrl}/oauth/token`
      : `https://${baseUrl}/oauth/token`;

    console.log('Token URL:', tokenUrl);

    const tokenResponse = await fetch(tokenUrl, {
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
      throw new Error(`Failed to get OAuth token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Successfully obtained OAuth token');

    return new Response(JSON.stringify({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in tekmetric-auth function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

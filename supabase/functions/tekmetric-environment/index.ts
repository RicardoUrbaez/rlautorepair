import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getTekmetricEnvironment(baseUrl: string | undefined) {
  if (!baseUrl) return "unknown";
  
  const url = baseUrl.toLowerCase();
  if (url.includes("sandbox")) return "sandbox";
  if (url.includes("api.tekmetric.com")) return "production";
  return "unknown";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const baseUrl = Deno.env.get('TEKMETRIC_BASE_URL');
    const environment = getTekmetricEnvironment(baseUrl);
    
    const fullUrl = baseUrl 
      ? (baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`)
      : null;

    return new Response(JSON.stringify({
      environment,
      baseUrl: fullUrl,
      raw: baseUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tekmetric-environment function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({
      environment: 'unknown',
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

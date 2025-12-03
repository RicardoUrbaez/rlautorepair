import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TOTP implementation without external dependencies
function base32Decode(encoded: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of encoded.toUpperCase().replace(/=+$/, '')) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}

async function generateTOTP(secret: string, timeStep = 30): Promise<string> {
  const key = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setBigUint64(0, BigInt(time), false);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
  const hmac = new Uint8Array(signature);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

function generateSecret(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => alphabet[b % 32]).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, userId, token, secret } = await req.json();
    console.log('TOTP action:', action, 'userId:', userId);

    if (action === 'generate') {
      // Generate a new TOTP secret
      const newSecret = generateSecret();
      const issuer = 'RL Auto Repair';
      
      // Get user email for QR code
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const email = userData?.user?.email || 'user';
      
      const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${newSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

      return new Response(JSON.stringify({
        success: true,
        secret: newSecret,
        otpAuthUrl,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'verify') {
      // Verify a TOTP token
      if (!secret || !token) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing secret or token',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check current time window and adjacent windows for clock drift
      const time = Math.floor(Date.now() / 1000 / 30);
      const key = base32Decode(secret);
      
      const tokens = [];
      for (let i = -1; i <= 1; i++) {
        const t = time + i;
        const timeBuffer = new ArrayBuffer(8);
        const timeView = new DataView(timeBuffer);
        timeView.setBigUint64(0, BigInt(t), false);
        
        const cryptoKey = await crypto.subtle.importKey(
          'raw', 
          key.buffer as ArrayBuffer, 
          { name: 'HMAC', hash: 'SHA-1' }, 
          false, 
          ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
        const hmac = new Uint8Array(signature);
        const offset = hmac[hmac.length - 1] & 0x0f;
        const code = (
          ((hmac[offset] & 0x7f) << 24) |
          ((hmac[offset + 1] & 0xff) << 16) |
          ((hmac[offset + 2] & 0xff) << 8) |
          (hmac[offset + 3] & 0xff)
        ) % 1000000;
        tokens.push(code.toString().padStart(6, '0'));
      }

      const isValid = tokens.includes(token);
      console.log('TOTP verification:', isValid ? 'SUCCESS' : 'FAILED');

      return new Response(JSON.stringify({
        success: true,
        valid: isValid,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'setup') {
      // Save TOTP secret for user
      const { error } = await supabase
        .from('totp_secrets')
        .upsert({
          user_id: userId,
          secret: secret,
          enabled: true,
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error saving TOTP secret:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'TOTP enabled successfully',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'check') {
      // Check if user has TOTP enabled
      const { data, error } = await supabase
        .from('totp_secrets')
        .select('secret, enabled')
        .eq('user_id', userId)
        .maybeSingle();

      return new Response(JSON.stringify({
        success: true,
        hasTotp: !!data?.enabled,
        secret: data?.secret || null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Unknown action',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const error = err as Error;
    console.error('TOTP error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

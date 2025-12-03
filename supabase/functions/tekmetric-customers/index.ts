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

/**
 * Normalize phone number to digits only, with optional +1 prefix
 */
function normalizePhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');
  // If starts with 1 and has 11 digits, remove the leading 1
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.substring(1);
  }
  return digits;
}

/**
 * Check if customer phone matches the search phone
 */
function customerHasPhone(customer: any, searchPhone: string): boolean {
  if (!searchPhone) return false;
  const normalizedSearch = normalizePhone(searchPhone);
  
  // Check phones array
  if (customer.phones && Array.isArray(customer.phones)) {
    for (const p of customer.phones) {
      const custPhone = normalizePhone(p.number || '');
      if (custPhone === normalizedSearch) {
        return true;
      }
    }
  }
  
  // Check legacy phone field (string or array)
  if (customer.phone) {
    if (Array.isArray(customer.phone)) {
      for (const p of customer.phone) {
        const custPhone = normalizePhone(typeof p === 'string' ? p : p.number || '');
        if (custPhone === normalizedSearch) {
          return true;
        }
      }
    } else if (typeof customer.phone === 'string') {
      if (normalizePhone(customer.phone) === normalizedSearch) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if customer email matches the search email
 */
function customerHasEmail(customer: any, searchEmail: string): boolean {
  if (!searchEmail) return false;
  const normalizedSearch = searchEmail.toLowerCase().trim();
  
  // Check email field (can be string or array in Tekmetric)
  if (customer.email) {
    if (Array.isArray(customer.email)) {
      return customer.email.some((e: string) => 
        e.toLowerCase().trim() === normalizedSearch
      );
    }
    return customer.email.toLowerCase().trim() === normalizedSearch;
  }
  
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const baseUrl = getBaseUrl();
    const accessToken = await getAccessToken();
    
    let params: Record<string, unknown> = {};
    try {
      const body = await req.text();
      if (body) {
        params = JSON.parse(body);
      }
    } catch (e) {
      // No body or invalid JSON
    }

    console.log('=== TEKMETRIC CUSTOMERS REQUEST ===');
    console.log(`Test Mode: ${isTestMode() ? 'ENABLED' : 'DISABLED'}`);
    console.log('Request params:', JSON.stringify(params));

    // Determine if this is a write operation (has firstName = creating customer)
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
    const email = params.email ? String(params.email).toLowerCase().trim() : '';
    const phone = params.phone ? normalizePhone(String(params.phone)) : '';

    if (!isWriteOperation) {
      // SEARCH for customers (GET operation)
      console.log('--- Searching for customers ---');
      console.log(`shopId: ${shopId}, phone: ${phone}, email: ${email}, customerId: ${customerId}`);
      
      const urlParams = new URLSearchParams();
      if (shopId) urlParams.append('shop', String(shopId));
      if (customerId) urlParams.append('customerId', String(customerId));
      // Tekmetric uses 'phone' param for phone search
      if (phone) urlParams.append('phone', phone);
      if (email) urlParams.append('email', email);
      
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

      // IMPORTANT: Tekmetric may return ALL customers, so we MUST filter for EXACT matches
      const allCustomers = data.content || [];
      console.log(`Tekmetric returned ${allCustomers.length} customers - filtering for exact matches`);
      
      let exactMatches: any[] = [];
      
      if (phone) {
        // Filter for exact phone match
        exactMatches = allCustomers.filter((c: any) => customerHasPhone(c, phone));
        console.log(`Found ${exactMatches.length} customers with exact phone match: ${phone}`);
      } else if (email) {
        // Filter for exact email match
        exactMatches = allCustomers.filter((c: any) => customerHasEmail(c, email));
        console.log(`Found ${exactMatches.length} customers with exact email match: ${email}`);
      } else if (customerId) {
        // Direct ID lookup - return as-is
        exactMatches = allCustomers;
      } else {
        // No search criteria - return all (for listing)
        exactMatches = allCustomers;
      }

      // Return only exact matches
      const result = {
        ...data,
        content: exactMatches,
        totalElements: exactMatches.length,
      };

      console.log(`Returning ${exactMatches.length} exact match(es)`);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // CREATE customer (blocked in TEST MODE - checked above)
      console.log('--- Creating Customer ---');
      console.log('Input params:', JSON.stringify(params));

      // Normalize phone for creation
      const customerPhone = normalizePhone(String(params.phone || ''));
      const customerEmail = String(params.email || '').toLowerCase().trim();

      // Format the payload according to Tekmetric API requirements
      const tekmetricPayload: Record<string, unknown> = {
        shopId: parseInt(String(params.shopId || '13739')),
        firstName: String(params.firstName).trim(),
        lastName: params.lastName ? String(params.lastName).trim() : '',
        customerTypeId: 1, // 1 = PERSON
      };

      // Email must be array of strings
      if (customerEmail) {
        tekmetricPayload.email = [customerEmail];
      }

      // Phones must be array of objects with {number, type, primary}
      if (customerPhone) {
        tekmetricPayload.phones = [{
          number: customerPhone,
          type: 'Mobile',
          primary: true,
        }];
      }

      // Add address if provided
      if (params.address || params.city || params.state || params.zip) {
        tekmetricPayload.address = {
          address1: params.address || params.address1 || '',
          address2: params.address2 || '',
          city: params.city || '',
          state: params.state || '',
          zip: params.zip || '',
        };
      }

      console.log('Tekmetric customer payload:', JSON.stringify(tekmetricPayload, null, 2));

      const endpoint = `${baseUrl}/api/v1/customers`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tekmetricPayload),
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

        // Handle 409 Conflict - customer already exists in Tekmetric
        // Tekmetric matched this customer by email OR phone - USE that customer
        // This is the authoritative match from Tekmetric's system
        if (response.status === 409 && errorJson?.data?.content?.length > 0) {
          const existingCustomer = errorJson.data.content[0];
          console.log('409 Conflict - Tekmetric found existing customer by email/phone');
          console.log('Using existing customer:', existingCustomer.id, existingCustomer.firstName, existingCustomer.lastName);
          
          // Return the existing customer - Tekmetric has confirmed this email/phone belongs to them
          return new Response(JSON.stringify({
            success: true,
            data: existingCustomer,
            message: 'Customer already exists in Tekmetric, using existing record',
            existed: true,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
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
      console.log('Successfully created customer:', data.id);

      return new Response(JSON.stringify({
        success: true,
        data: data,
        message: 'Customer created successfully',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in tekmetric-customers function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

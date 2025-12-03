import { supabase } from "@/integrations/supabase/client";

export interface TekmetricAppointment {
  id?: string;
  customerId: string;
  shopId: string;
  scheduledDate: string;
  scheduledTime: string;
  vehicleId?: string;
  serviceType?: string;
  notes?: string;
}

export interface TekmetricCustomer {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/**
 * Test Tekmetric API connection
 */
export async function testTekmetricConnection() {
  try {
    const { data, error } = await supabase.functions.invoke('tekmetric-ping');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error testing Tekmetric connection:', error);
    throw error;
  }
}

/**
 * Fetch appointments from Tekmetric
 */
export async function fetchTekmetricAppointments(params?: {
  shopId?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    // Use POST with body since GET can't have a body in browser
    const { data, error } = await supabase.functions.invoke('tekmetric-appointments', {
      body: params || {},
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching Tekmetric appointments:', error);
    throw error;
  }
}

/**
 * Create appointment in Tekmetric
 */
export async function createTekmetricAppointment(appointment: TekmetricAppointment) {
  try {
    const { data, error } = await supabase.functions.invoke('tekmetric-appointments', {
      body: appointment,
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating Tekmetric appointment:', error);
    throw error;
  }
}

/**
 * Fetch customers from Tekmetric
 */
export async function fetchTekmetricCustomers(params?: {
  customerId?: string;
  email?: string;
  phone?: string;
  shopId?: string;
}) {
  try {
    // Use POST with body since GET can't have a body
    const { data, error } = await supabase.functions.invoke('tekmetric-customers', {
      body: params || {},
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching Tekmetric customers:', error);
    throw error;
  }
}

/**
 * Create customer in Tekmetric
 */
export async function createTekmetricCustomer(customer: {
  shopId: string | number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}) {
  try {
    console.log('=== CREATE TEKMETRIC CUSTOMER ===');
    console.log('Sending to Tekmetric:', JSON.stringify(customer, null, 2));
    
    const { data, error } = await supabase.functions.invoke('tekmetric-customers', {
      body: customer,
    });

    if (error) throw error;
    
    // Check for email conflict (phone doesn't match existing customer)
    if (data?.emailConflict) {
      const errorMessage = data.error?.message || 'This email is already registered to another customer.';
      throw new Error(errorMessage);
    }
    
    console.log('Tekmetric response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error creating Tekmetric customer:', error);
    throw error;
  }
}

/**
 * Normalize phone number to 10 digits (US format)
 */
function normalizePhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');
  // If starts with 1 and has 11 digits, remove leading 1
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.substring(1);
  }
  return digits;
}

/**
 * Find existing customer or create new one in Tekmetric
 * 
 * WORKFLOW:
 * 1. Normalize phone number from form input
 * 2. Search Tekmetric by phone (exact match only)
 * 3. If no match, search by email (exact match only)
 * 4. If still no match, create NEW customer
 * 5. NEVER use fallback/default/hardcoded customer
 */
export async function findOrCreateCustomer(params: {
  shopId: string | number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}) {
  // Step A: Normalize inputs
  const cleanPhone = normalizePhone(params.phone);
  const cleanEmail = params.email.toLowerCase().trim();
  
  console.log('=== FIND OR CREATE CUSTOMER ===');
  console.log('Input - firstName:', params.firstName);
  console.log('Input - lastName:', params.lastName);
  console.log('Input - phone (normalized):', cleanPhone);
  console.log('Input - email:', cleanEmail);
  
  // Step B: Search by phone number (primary search)
  if (cleanPhone) {
    try {
      console.log('Step 1: Searching by phone:', cleanPhone);
      const phoneResults = await fetchTekmetricCustomers({ 
        shopId: params.shopId.toString(),
        phone: cleanPhone 
      });
      
      // Edge function now returns ONLY exact matches
      if (phoneResults?.content?.length > 0) {
        const match = phoneResults.content[0];
        console.log('✅ FOUND customer by phone:', match.id, match.firstName, match.lastName);
        return { customer: match, created: false };
      }
      console.log('No customer found with phone:', cleanPhone);
    } catch (error) {
      console.log('Phone search error:', error);
    }
  }

  // Step C: Search by email (fallback)
  if (cleanEmail) {
    try {
      console.log('Step 2: Searching by email:', cleanEmail);
      const emailResults = await fetchTekmetricCustomers({ 
        shopId: params.shopId.toString(),
        email: cleanEmail 
      });
      
      // Edge function now returns ONLY exact matches
      if (emailResults?.content?.length > 0) {
        const match = emailResults.content[0];
        console.log('✅ FOUND customer by email:', match.id, match.firstName, match.lastName);
        return { customer: match, created: false };
      }
      console.log('No customer found with email:', cleanEmail);
    } catch (error) {
      console.log('Email search error:', error);
    }
  }

  // Step D: No existing customer - CREATE new one
  console.log('Step 3: Creating NEW customer:', params.firstName, params.lastName);
  const result = await createTekmetricCustomer({
    shopId: params.shopId,
    firstName: params.firstName,
    lastName: params.lastName,
    email: cleanEmail,
    phone: cleanPhone,
    address: params.address,
    city: params.city,
    state: params.state,
    zip: params.zip,
  });
  
  if (result.success && result.data) {
    console.log('✅ CREATED new customer:', result.data.id);
    return { customer: result.data, created: true };
  }
  
  // Handle case where customer was created but returned in a different format
  if (result.existed && result.data) {
    console.log('Customer already existed (409):', result.data.id);
    return { customer: result.data, created: false };
  }
  
  throw new Error(result.error?.message || 'Failed to create customer in Tekmetric');
}

/**
 * Fetch repair orders/jobs from Tekmetric
 */
export async function fetchTekmetricJobs(params?: {
  shopId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const { data, error } = await supabase.functions.invoke('tekmetric-jobs', {
      body: params || {},
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching Tekmetric jobs:', error);
    throw error;
  }
}

/**
 * Trigger a manual sync of Tekmetric data to Supabase
 */
export async function triggerTekmetricSync() {
  try {
    const { data, error } = await supabase.functions.invoke('sync-tekmetric', {
      body: { syncType: 'manual' },
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error triggering Tekmetric sync:', error);
    throw error;
  }
}

/**
 * Get comprehensive debug information about Tekmetric connection
 */
export async function debugTekmetricConnection() {
  try {
    const { data, error } = await supabase.functions.invoke('tekmetric-debug');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error debugging Tekmetric connection:', error);
    throw error;
  }
}

/**
 * Get current Tekmetric environment (sandbox vs production)
 */
export async function getTekmetricEnvironment() {
  try {
    const { data, error } = await supabase.functions.invoke('tekmetric-environment');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting Tekmetric environment:', error);
    throw error;
  }
}

/**
 * Create a test appointment in Tekmetric
 */
export async function createTestAppointment(payload: {
  customerId: string | number;
  shopId: string | number;
  scheduledDate: string;
  scheduledTime: string;
  description?: string;
  vehicleId?: string | number;
}) {
  try {
    const { data, error } = await supabase.functions.invoke('tekmetric-appointments', {
      body: payload,
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating test appointment:', error);
    throw error;
  }
}

/**
 * Fetch sync logs from Supabase
 */
export async function fetchSyncLogs(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    throw error;
  }
}

/**
 * Fetch synced customers from Supabase
 */
export async function fetchSyncedCustomers() {
  try {
    const { data, error } = await supabase
      .from('tekmetric_customers')
      .select('*')
      .order('synced_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching synced customers:', error);
    throw error;
  }
}

/**
 * Fetch synced orders from Supabase
 */
export async function fetchSyncedOrders() {
  try {
    const { data, error } = await supabase
      .from('tekmetric_orders')
      .select('*')
      .order('synced_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching synced orders:', error);
    throw error;
  }
}

/**
 * Discover available Tekmetric API endpoints
 */
export async function discoverTekmetricEndpoints() {
  try {
    const { data, error } = await supabase.functions.invoke('tekmetric-endpoints');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error discovering Tekmetric endpoints:', error);
    throw error;
  }
}

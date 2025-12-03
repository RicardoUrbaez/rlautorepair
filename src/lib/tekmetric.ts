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
    const { data, error } = await supabase.functions.invoke('tekmetric-customers', {
      body: customer,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating Tekmetric customer:', error);
    throw error;
  }
}

/**
 * Find existing customer or create new one in Tekmetric
 * Searches by phone first (Tekmetric recommended), then email as fallback
 * IMPORTANT: Tekmetric API returns ALL customers sorted alphabetically, not exact matches!
 * We must filter results to find actual matches.
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
  // Clean phone number - remove all non-digits
  const cleanPhone = params.phone.replace(/\D/g, '');
  const cleanEmail = params.email.toLowerCase().trim();
  
  // Helper to check if customer has matching phone
  const hasMatchingPhone = (customer: any): boolean => {
    if (!customer.phone || !Array.isArray(customer.phone)) return false;
    return customer.phone.some((p: any) => {
      const customerPhone = String(p.number || '').replace(/\D/g, '');
      return customerPhone === cleanPhone;
    });
  };
  
  // Helper to check if customer has matching email
  const hasMatchingEmail = (customer: any): boolean => {
    if (!customer.email) return false;
    // Email can be string or array in Tekmetric
    if (Array.isArray(customer.email)) {
      return customer.email.some((e: string) => e.toLowerCase().trim() === cleanEmail);
    }
    return customer.email.toLowerCase().trim() === cleanEmail;
  };
  
  // Step 1: Search by phone number (Tekmetric recommended method)
  try {
    console.log('Searching Tekmetric customer by phone:', cleanPhone);
    const phoneResults = await fetchTekmetricCustomers({ 
      shopId: params.shopId.toString(),
      phone: cleanPhone 
    });
    
    if (phoneResults?.content?.length > 0) {
      // Find customer with EXACT phone match
      const exactMatch = phoneResults.content.find(hasMatchingPhone);
      if (exactMatch) {
        console.log('Found EXACT phone match:', exactMatch.id, exactMatch.firstName, exactMatch.lastName);
        return { customer: exactMatch, created: false };
      }
      console.log('No exact phone match found in', phoneResults.content.length, 'results');
    }
  } catch (error) {
    console.log('Phone search failed, trying email...');
  }

  // Step 2: Search by email as fallback
  try {
    console.log('Searching Tekmetric customer by email:', cleanEmail);
    const emailResults = await fetchTekmetricCustomers({ 
      shopId: params.shopId.toString(),
      email: cleanEmail 
    });
    
    if (emailResults?.content?.length > 0) {
      // Find customer with EXACT email match
      const exactMatch = emailResults.content.find(hasMatchingEmail);
      if (exactMatch) {
        console.log('Found EXACT email match:', exactMatch.id, exactMatch.firstName, exactMatch.lastName);
        return { customer: exactMatch, created: false };
      }
      console.log('No exact email match found in', emailResults.content.length, 'results');
    }
  } catch (error) {
    console.log('Email search failed, will create new customer');
  }

  // Step 3: Customer doesn't exist - create new one
  console.log('Creating NEW Tekmetric customer:', params.firstName, params.lastName, cleanEmail, cleanPhone);
  const result = await createTekmetricCustomer({
    shopId: params.shopId,
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    phone: cleanPhone,
    address: params.address,
    city: params.city,
    state: params.state,
    zip: params.zip,
  });
  
  if (result.success && result.data) {
    console.log('Created new Tekmetric customer:', result.data.id);
    return { customer: result.data, created: true };
  }
  
  throw new Error(result.error?.message || 'Failed to create customer');
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

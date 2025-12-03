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
  
  // Step 1: Search by phone number (Tekmetric recommended method)
  try {
    console.log('Searching Tekmetric customer by phone:', cleanPhone);
    const phoneResults = await fetchTekmetricCustomers({ 
      shopId: params.shopId.toString(),
      phone: cleanPhone 
    });
    
    if (phoneResults?.content?.length > 0) {
      console.log('Found existing customer by phone:', phoneResults.content[0].id);
      return { customer: phoneResults.content[0], created: false };
    }
  } catch (error) {
    console.log('Phone search failed, trying email...');
  }

  // Step 2: Search by email as fallback
  try {
    console.log('Searching Tekmetric customer by email:', params.email);
    const emailResults = await fetchTekmetricCustomers({ 
      shopId: params.shopId.toString(),
      email: params.email 
    });
    
    if (emailResults?.content?.length > 0) {
      console.log('Found existing customer by email:', emailResults.content[0].id);
      return { customer: emailResults.content[0], created: false };
    }
  } catch (error) {
    console.log('Email search failed, will create new customer');
  }

  // Step 3: Customer doesn't exist - create new one
  console.log('Creating new Tekmetric customer:', params.firstName, params.lastName);
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

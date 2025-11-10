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
    const queryParams = new URLSearchParams();
    if (params?.shopId) queryParams.append('shopId', params.shopId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const { data, error } = await supabase.functions.invoke('tekmetric-appointments', {
      method: 'GET',
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
}) {
  try {
    const { data, error } = await supabase.functions.invoke('tekmetric-customers');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching Tekmetric customers:', error);
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

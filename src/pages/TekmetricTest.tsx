import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  testTekmetricConnection, 
  fetchTekmetricAppointments, 
  fetchTekmetricCustomers,
  triggerTekmetricSync,
  fetchSyncLogs,
  fetchSyncedCustomers,
  debugTekmetricConnection,
  createTestAppointment,
  getTekmetricEnvironment,
  fetchTekmetricJobs,
} from "@/lib/tekmetric";
import { Loader2, CheckCircle, XCircle, RefreshCw, Clock, Database, AlertTriangle, Bug, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TekmetricTest() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [debugging, setDebugging] = useState(false);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [syncedCustomers, setSyncedCustomers] = useState<any[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [environment, setEnvironment] = useState<{
    environment: string;
    baseUrl: string | null;
  } | null>(null);
  const [syncStats, setSyncStats] = useState({
    totalCustomers: 0,
    totalAppointments: 0,
    activeJobs: 0,
  });
  
  // Test appointment form
  const [testAppointment, setTestAppointment] = useState({
    customerId: '',
    shopId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '10:00:00',
    description: 'Test appointment from Lovable frontend',
  });

  useEffect(() => {
    loadSyncData();
    loadEnvironment();
    loadSyncStats();
  }, []);

  const loadSyncStats = async () => {
    try {
      const [customersData, appointmentsData, jobsData] = await Promise.all([
        fetchTekmetricCustomers({ shopId: '238' }).catch(() => ({ content: [] })),
        fetchTekmetricAppointments({ shopId: '238' }).catch(() => []),
        fetchTekmetricJobs({ shopId: '238', status: 'open' }).catch(() => ({ content: [] })),
      ]);

      setSyncStats({
        totalCustomers: customersData?.content?.length || 0,
        totalAppointments: Array.isArray(appointmentsData) ? appointmentsData.length : 0,
        activeJobs: jobsData?.content?.length || 0,
      });
    } catch (error) {
      console.error('Error loading sync stats:', error);
    }
  };

  const loadEnvironment = async () => {
    try {
      const envData = await getTekmetricEnvironment();
      setEnvironment(envData);
    } catch (error) {
      console.error('Error loading environment:', error);
    }
  };

  const loadSyncData = async () => {
    try {
      const logs = await fetchSyncLogs(5);
      setSyncLogs(logs);
      
      if (logs.length > 0) {
        const lastCompletedSync = logs.find(log => log.status === 'completed' || log.status === 'completed_with_errors');
        if (lastCompletedSync) {
          setLastSync(lastCompletedSync.completed_at);
        }
      }

      const syncedCustomersData = await fetchSyncedCustomers();
      setSyncedCustomers(syncedCustomersData);
    } catch (error) {
      console.error('Error loading sync data:', error);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const result = await testTekmetricConnection();
      console.log('Connection test result:', result);
      
      if (result.success) {
        setConnectionStatus('success');
        toast.success('Successfully connected to Tekmetric API!');
      } else {
        setConnectionStatus('error');
        toast.error('Failed to connect to Tekmetric API');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Error testing connection: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await fetchTekmetricAppointments();
      console.log('Appointments:', data);
      setAppointments(Array.isArray(data) ? data : []);
      toast.success(`Fetched ${Array.isArray(data) ? data.length : 0} appointments`);
    } catch (error) {
      toast.error('Error fetching appointments: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleFetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchTekmetricCustomers();
      console.log('Customers:', data);
      setCustomers(Array.isArray(data) ? data : []);
      toast.success(`Fetched ${Array.isArray(data) ? data.length : 0} customers`);
    } catch (error) {
      toast.error('Error fetching customers: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      toast.info('Starting sync with Tekmetric...');
      const result = await triggerTekmetricSync();
      console.log('Sync result:', result);
      
      if (result.success) {
        toast.success(`Sync completed! ${result.results.totalSynced} records synced.`);
        await loadSyncData(); // Reload sync data
      } else {
        toast.error('Sync failed: ' + result.error);
      }
    } catch (error) {
      toast.error('Error syncing: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSyncing(false);
    }
  };

  const handleDebugConnection = async () => {
    setDebugging(true);
    try {
      toast.info('Running comprehensive diagnostics...');
      const result = await debugTekmetricConnection();
      console.log('Debug result:', result);
      setDebugInfo(result);
      
      if (result.status === 'ok') {
        toast.success('Debug completed! Check results below.');
        
        // Auto-fill form with available data
        if (result.apiTests?.shops?.shopId) {
          setTestAppointment(prev => ({ ...prev, shopId: result.apiTests.shops.shopId }));
        }
        if (result.apiTests?.customers?.sampleCustomer?.id) {
          setTestAppointment(prev => ({ ...prev, customerId: result.apiTests.customers.sampleCustomer.id }));
        }
      } else {
        toast.error('Debug failed: ' + result.error);
      }
    } catch (error) {
      toast.error('Error debugging: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setDebugging(false);
    }
  };

  const handleCreateTestAppointment = async () => {
    if (!testAppointment.customerId || !testAppointment.shopId) {
      toast.error('Please provide customer ID and shop ID. Run debug to get available values.');
      return;
    }

    setCreatingAppointment(true);
    try {
      toast.info('Creating test appointment in Tekmetric...');
      const result = await createTestAppointment(testAppointment);
      console.log('Create appointment result:', result);
      
      if (result.success) {
        toast.success(`✅ Appointment created successfully! ID: ${result.data.id}`);
      } else {
        toast.error(`❌ Failed: ${result.error?.message || 'Unknown error'}`);
        console.error('Full error:', result);
      }
    } catch (error) {
      toast.error('Error creating appointment: ' + (error instanceof Error ? error.message : 'Unknown error'));
      console.error('Full error:', error);
    } finally {
      setCreatingAppointment(false);
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'completed_with_errors':
        return <Badge className="bg-yellow-500">Completed with Errors</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'started':
        return <Badge variant="secondary">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Tekmetric Integration Dashboard</h1>
            <p className="text-muted-foreground">Debug API connection, test appointments, and monitor sync status</p>
          </div>

          {/* Sync Status Widget */}
          <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Tekmetric Sync Status
              </CardTitle>
              <CardDescription>Live connection and data sync overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Connection</span>
                    {connectionStatus === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : connectionStatus === 'error' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">
                    {connectionStatus === 'success' ? '✅' : connectionStatus === 'error' ? '❌' : '⏳'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {connectionStatus === 'success' ? 'Connected' : connectionStatus === 'error' ? 'Disconnected' : 'Unknown'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <span className="text-xs text-muted-foreground">Customers</span>
                  <p className="text-2xl font-bold mt-2">{syncStats.totalCustomers}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total synced</p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <span className="text-xs text-muted-foreground">Appointments</span>
                  <p className="text-2xl font-bold mt-2">{syncStats.totalAppointments}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total created</p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <span className="text-xs text-muted-foreground">Active Jobs</span>
                  <p className="text-2xl font-bold mt-2">{syncStats.activeJobs}</p>
                  <p className="text-xs text-muted-foreground mt-1">In progress</p>
                </div>
              </div>

              {lastSync && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Last sync: {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}
                </div>
              )}

              <Button 
                onClick={loadSyncStats} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Stats
              </Button>
            </CardContent>
          </Card>

          {/* Environment Banner */}
          {environment && (
            <div className={`p-4 text-center rounded-lg font-medium text-lg border-2 ${
              environment.environment === 'sandbox' 
                ? 'bg-yellow-50 text-yellow-900 border-yellow-400' 
                : environment.environment === 'production' 
                ? 'bg-green-50 text-green-900 border-green-400' 
                : 'bg-gray-50 text-gray-900 border-gray-400'
            }`}>
              {environment.environment === 'sandbox' && (
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>⚠️ Sandbox Environment — Data will not appear on tekmetric.com</span>
                </div>
              )}
              {environment.environment === 'production' && (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>✅ Live Environment — Data synced with tekmetric.com</span>
                </div>
              )}
              {environment.environment === 'unknown' && (
                <div className="flex items-center justify-center gap-2">
                  <XCircle className="h-5 w-5" />
                  <span>❓ Environment not detected</span>
                </div>
              )}
              {environment.baseUrl && (
                <p className="text-xs mt-1 opacity-75 font-mono">{environment.baseUrl}</p>
              )}
            </div>
          )}

          {/* Debug Section */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="h-5 w-5" />
                    Debug Tekmetric Connection
                  </CardTitle>
                  <CardDescription>Run comprehensive diagnostics to identify issues</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleDebugConnection} 
                disabled={debugging}
                className="w-full"
                size="lg"
                variant="default"
              >
                {debugging ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Running Diagnostics...
                  </>
                ) : (
                  <>
                    <Bug className="mr-2 h-5 w-5" />
                    Run Full Diagnostics
                  </>
                )}
              </Button>

              {debugInfo && (
                <div className="space-y-4">
                  <Alert className={debugInfo.environment === 'sandbox' ? 'border-yellow-500' : 'border-green-500'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Environment: {debugInfo.environment?.toUpperCase()}</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p className="font-mono text-xs">{debugInfo.baseUrl}</p>
                      {debugInfo.recommendations?.map((rec: string, idx: number) => (
                        <p key={idx} className="text-sm">{rec}</p>
                      ))}
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg border-2 ${debugInfo.apiTests?.shops?.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                      <p className="text-xs font-medium text-muted-foreground">Shops API</p>
                      <p className="text-2xl font-bold">{debugInfo.apiTests?.shops?.success ? '✅' : '❌'}</p>
                      <p className="text-xs">{debugInfo.apiTests?.shops?.count || 0} shops found</p>
                    </div>
                    <div className={`p-4 rounded-lg border-2 ${debugInfo.apiTests?.customers?.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                      <p className="text-xs font-medium text-muted-foreground">Customers API</p>
                      <p className="text-2xl font-bold">{debugInfo.apiTests?.customers?.success ? '✅' : '❌'}</p>
                      <p className="text-xs">{debugInfo.apiTests?.customers?.count || 0} customers</p>
                    </div>
                    <div className={`p-4 rounded-lg border-2 ${debugInfo.apiTests?.appointments?.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                      <p className="text-xs font-medium text-muted-foreground">Appointments API</p>
                      <p className="text-2xl font-bold">{debugInfo.apiTests?.appointments?.success ? '✅' : '❌'}</p>
                      <p className="text-xs">{debugInfo.apiTests?.appointments?.count || 0} appointments</p>
                    </div>
                  </div>

                  <details className="bg-muted p-4 rounded-lg">
                    <summary className="cursor-pointer font-medium">View Raw Debug Data</summary>
                    <pre className="text-xs mt-2 overflow-x-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Appointment Creation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Create Test Appointment
              </CardTitle>
              <CardDescription>Send a test appointment to Tekmetric to verify POST endpoint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer ID *</Label>
                  <Input
                    id="customerId"
                    value={testAppointment.customerId}
                    onChange={(e) => setTestAppointment({ ...testAppointment, customerId: e.target.value })}
                    placeholder="e.g., 12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopId">Shop ID *</Label>
                  <Input
                    id="shopId"
                    value={testAppointment.shopId}
                    onChange={(e) => setTestAppointment({ ...testAppointment, shopId: e.target.value })}
                    placeholder="e.g., 67890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={testAppointment.scheduledDate}
                    onChange={(e) => setTestAppointment({ ...testAppointment, scheduledDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Time</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={testAppointment.scheduledTime}
                    onChange={(e) => setTestAppointment({ ...testAppointment, scheduledTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={testAppointment.description}
                  onChange={(e) => setTestAppointment({ ...testAppointment, description: e.target.value })}
                  rows={2}
                />
              </div>
              <Button 
                onClick={handleCreateTestAppointment}
                disabled={creatingAppointment || !testAppointment.customerId || !testAppointment.shopId}
                className="w-full"
                size="lg"
              >
                {creatingAppointment ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Appointment...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Create Test Appointment
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                💡 Tip: Run diagnostics first to auto-fill customer and shop IDs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connection Test</CardTitle>
              <CardDescription>Verify your Tekmetric API credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleTestConnection} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>

              {connectionStatus !== 'idle' && (
                <div className={`flex items-center gap-2 p-4 rounded-lg ${
                  connectionStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {connectionStatus === 'success' ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Connection successful!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" />
                      <span>Connection failed. Check credentials.</span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Sync to Supabase
                  </CardTitle>
                  <CardDescription>Backup Tekmetric data to your database</CardDescription>
                </div>
                {lastSync && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Last synced {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleSyncNow} 
                disabled={syncing}
                className="w-full"
                size="lg"
              >
                {syncing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Syncing Data...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Sync Now
                  </>
                )}
              </Button>

              <div className="space-y-2">
                <p className="text-sm font-medium">Sync Statistics</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-2xl font-bold">{syncedCustomers.length}</p>
                    <p className="text-xs text-muted-foreground">Customers in DB</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-2xl font-bold">{syncLogs.length}</p>
                    <p className="text-xs text-muted-foreground">Total Syncs</p>
                  </div>
                </div>
              </div>

              {syncLogs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent Sync History</p>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Records</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {syncLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="capitalize">{log.sync_type}</TableCell>
                            <TableCell>{getSyncStatusBadge(log.status)}</TableCell>
                            <TableCell>{log.records_synced || 0}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Data: Appointments</CardTitle>
                <CardDescription>Fetch appointments directly from Tekmetric API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleFetchAppointments} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    'Fetch from Tekmetric'
                  )}
                </Button>

                {appointments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Found {appointments.length} appointments</p>
                    <div className="max-h-64 overflow-y-auto bg-muted p-4 rounded-lg">
                      <pre className="text-xs">{JSON.stringify(appointments, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Synced Data: Customers</CardTitle>
                <CardDescription>View customers stored in Supabase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={loadSyncData} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Reload from Database
                    </>
                  )}
                </Button>

                {syncedCustomers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{syncedCustomers.length} customers in database</p>
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {syncedCustomers.slice(0, 10).map((customer) => (
                            <TableRow key={customer.id}>
                              <TableCell>{customer.first_name} {customer.last_name}</TableCell>
                              <TableCell className="text-xs">{customer.email}</TableCell>
                              <TableCell className="text-xs">{customer.phone}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

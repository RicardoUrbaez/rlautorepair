import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  testTekmetricConnection, 
  fetchTekmetricAppointments, 
  fetchTekmetricCustomers,
  triggerTekmetricSync,
  fetchSyncLogs,
  fetchSyncedCustomers,
} from "@/lib/tekmetric";
import { Loader2, CheckCircle, XCircle, RefreshCw, Clock, Database } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TekmetricTest() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [syncedCustomers, setSyncedCustomers] = useState<any[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    loadSyncData();
  }, []);

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
            <h1 className="text-4xl font-bold">Tekmetric API Testing</h1>
            <p className="text-muted-foreground">Test your Tekmetric API integration</p>
          </div>

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

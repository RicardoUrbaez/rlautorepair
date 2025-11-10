import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { testTekmetricConnection, fetchTekmetricAppointments, fetchTekmetricCustomers } from "@/lib/tekmetric";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TekmetricTest() {
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

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

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>Fetch appointments from Tekmetric</CardDescription>
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
                    'Fetch Appointments'
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
                <CardTitle>Customers</CardTitle>
                <CardDescription>Fetch customers from Tekmetric</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleFetchCustomers} 
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
                    'Fetch Customers'
                  )}
                </Button>

                {customers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Found {customers.length} customers</p>
                    <div className="max-h-64 overflow-y-auto bg-muted p-4 rounded-lg">
                      <pre className="text-xs">{JSON.stringify(customers, null, 2)}</pre>
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

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Car, Clock, Mail, Phone, MapPin, UserPlus, CheckCircle, Shield, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vin?: string;
  job_status: string;
  street_address?: string;
  city?: string;
  state?: string;
  assigned_mechanic_id?: string;
  notes?: string;
};

type AssignedJob = {
  id: string;
  tekmetric_job_id?: string;
  tekmetric_appointment_id?: string;
  customer_name: string;
  customer_phone?: string;
  vehicle: string;
  description?: string;
  appointment_date?: string;
  status: string;
  notes?: string;
  created_at: string;
};

type Mechanic = {
  id: string;
  email: string;
};

const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [assignedJobs, setAssignedJobs] = useState<AssignedJob[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [assigningJob, setAssigningJob] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
  }, [navigate]);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      toast({
        title: "Access Denied",
        description: "You don't have admin permissions.",
        variant: "destructive"
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    fetchAppointments();
    fetchAssignedJobs();
    fetchMechanics();
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("assigned_jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssignedJobs(data || []);
    } catch (error) {
      console.error("Error fetching assigned jobs:", error);
    }
  };

  const fetchMechanics = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          profiles!inner(email)
        `)
        .eq("role", "mechanic");

      if (error) throw error;

      const mechanics: Mechanic[] = (data || []).map(item => ({
        id: item.user_id,
        email: (item.profiles as any).email
      }));
      
      setMechanics(mechanics);
    } catch (error) {
      console.error("Error fetching mechanics:", error);
    }
  };

  const assignJobToMechanic = async (appointment: Appointment) => {
    if (mechanics.length === 0) {
      toast({
        title: "No Mechanics",
        description: "No mechanics available to assign jobs.",
        variant: "destructive"
      });
      return;
    }

    setAssigningJob(appointment.id);
    try {
      // Get the first mechanic (shared account)
      const mechanic = mechanics[0];

      // Create assigned job
      const { error: insertError } = await supabase
        .from("assigned_jobs")
        .insert({
          tekmetric_appointment_id: appointment.id,
          customer_name: appointment.customer_name,
          customer_phone: appointment.customer_phone,
          vehicle: `${appointment.vehicle_year} ${appointment.vehicle_make} ${appointment.vehicle_model}`,
          description: appointment.notes || 'Service appointment',
          appointment_date: appointment.appointment_date,
          assigned_to: mechanic.id,
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Update appointment status
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ 
          assigned_mechanic_id: mechanic.id,
          job_status: "approved"
        })
        .eq("id", appointment.id);

      if (updateError) throw updateError;

      // Refresh data
      fetchAppointments();
      fetchAssignedJobs();

      toast({ 
        title: "Job Assigned", 
        description: `Job assigned to mechanic successfully.` 
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAssigningJob(null);
    }
  };

  const updateJobStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ job_status: newStatus })
        .eq("id", appointmentId);

      if (error) throw error;

      setAppointments(prev =>
        prev.map(apt => apt.id === appointmentId ? { ...apt, job_status: newStatus } : apt)
      );

      toast({ title: "Status Updated", description: `Job status changed to ${newStatus}` });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const approveCompletedJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("assigned_jobs")
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id 
        })
        .eq("id", jobId);

      if (error) throw error;

      fetchAssignedJobs();
      toast({ title: "Job Approved", description: "The completed job has been approved." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      approved: "bg-blue-500",
      in_progress: "bg-purple-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500"
    };
    return colors[status] || "bg-gray-500";
  };

  const unassignedAppointments = appointments.filter(apt => !apt.assigned_mechanic_id);
  const assignedAppointments = appointments.filter(apt => apt.assigned_mechanic_id);
  const completedJobs = assignedJobs.filter(job => job.status === 'completed');

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage appointments and assign jobs to mechanics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/totp-setup">
                <Shield className="w-4 h-4 mr-2" />
                Setup 2FA
              </Link>
            </Button>
            <Button variant="outline" onClick={() => { fetchAppointments(); fetchAssignedJobs(); }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <Tabs defaultValue="unassigned" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="unassigned" className="relative">
                Unassigned Jobs
                {unassignedAppointments.length > 0 && (
                  <Badge className="ml-2 bg-red-500">{unassignedAppointments.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="assigned">
                Assigned Jobs
                {assignedAppointments.length > 0 && (
                  <Badge className="ml-2 bg-blue-500">{assignedAppointments.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending-approval">
                Pending Approval
                {completedJobs.length > 0 && (
                  <Badge className="ml-2 bg-green-500">{completedJobs.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unassigned" className="space-y-4">
              {unassignedAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No unassigned jobs</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {unassignedAppointments.map((apt) => (
                    <Card key={apt.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">
                              {apt.vehicle_year} {apt.vehicle_make} {apt.vehicle_model}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Customer: {apt.customer_name}</p>
                          </div>
                          <Badge className={getStatusColor(apt.job_status)}>
                            {apt.job_status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{new Date(apt.appointment_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{apt.appointment_time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{apt.customer_phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span>{apt.customer_email}</span>
                          </div>
                        </div>
                        {apt.notes && (
                          <div className="text-sm p-3 bg-muted rounded">
                            <strong>Notes:</strong> {apt.notes}
                          </div>
                        )}
                        <Button 
                          onClick={() => assignJobToMechanic(apt)}
                          disabled={assigningJob === apt.id}
                          className="w-full"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {assigningJob === apt.id ? "Assigning..." : "Assign to Mechanic"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="assigned" className="space-y-4">
              {assignedAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No assigned jobs</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {assignedAppointments.map((apt) => (
                    <Card key={apt.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">
                              {apt.vehicle_year} {apt.vehicle_make} {apt.vehicle_model}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Customer: {apt.customer_name}</p>
                          </div>
                          <Badge className={getStatusColor(apt.job_status)}>
                            {apt.job_status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{new Date(apt.appointment_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{apt.appointment_time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 pt-2">
                          <label className="text-sm font-medium">Update Status:</label>
                          <Select
                            value={apt.job_status}
                            onValueChange={(value) => updateJobStatus(apt.id, value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending-approval" className="space-y-4">
              {completedJobs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No jobs pending approval</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {completedJobs.map((job) => (
                    <Card key={job.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{job.vehicle}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Customer: {job.customer_name}</p>
                          </div>
                          <Badge className="bg-green-500">COMPLETED</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {job.description && (
                          <p className="text-sm">{job.description}</p>
                        )}
                        {job.notes && (
                          <div className="text-sm p-3 bg-muted rounded">
                            <strong>Mechanic Notes:</strong> {job.notes}
                          </div>
                        )}
                        <Button onClick={() => approveCompletedJob(job.id)} className="w-full">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Job
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

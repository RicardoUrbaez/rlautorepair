import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, Car, Clock, Mail, Phone, MapPin } from "lucide-react";
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
  notes?: string;
};

const MechanicDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMechanic, setIsMechanic] = useState(false);
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

    // Check if user has mechanic role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "mechanic")
      .maybeSingle();

    if (!roleData) {
      toast({
        title: "Access Denied",
        description: "You don't have mechanic permissions.",
        variant: "destructive"
      });
      navigate("/");
      return;
    }

    setIsMechanic(true);
    fetchAssignedJobs(session.user.id);
  };

  const fetchAssignedJobs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("assigned_mechanic_id", userId)
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
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

      // If job completed, trigger SMS notification via edge function
      if (newStatus === "completed") {
        const appointment = appointments.find(a => a.id === appointmentId);
        if (appointment) {
          await supabase.functions.invoke("send-completion-sms", {
            body: {
              customerPhone: appointment.customer_phone,
              customerName: appointment.customer_name,
              vehicleInfo: `${appointment.vehicle_year} ${appointment.vehicle_make} ${appointment.vehicle_model}`
            }
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-500",
      approved: "bg-blue-500",
      in_progress: "bg-purple-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500"
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  if (!isMechanic) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Assigned Jobs</h1>
          <p className="text-muted-foreground">Mechanic Dashboard</p>
        </div>

        {loading ? (
          <p>Loading jobs...</p>
        ) : appointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No jobs assigned yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {appointments.map((apt) => (
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
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{apt.customer_email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{apt.customer_phone}</span>
                    </div>
                  </div>

                  {apt.vin && (
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      <span>VIN: {apt.vin}</span>
                    </div>
                  )}

                  {apt.street_address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{apt.street_address}, {apt.city}, {apt.state}</span>
                    </div>
                  )}

                  {apt.notes && (
                    <div className="text-sm p-3 bg-muted rounded">
                      <strong>Notes:</strong> {apt.notes}
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-2">
                    <Label className="text-sm font-medium">Update Status:</Label>
                    <Select
                      value={apt.job_status}
                      onValueChange={(value) => updateJobStatus(apt.id, value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MechanicDashboard;
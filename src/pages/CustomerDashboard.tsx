import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Car, Clock, MapPin } from "lucide-react";

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
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

const CustomerDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchAppointments(session.user.email!);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchAppointments(session.user.email!);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchAppointments = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("customer_email", email)
        .order("appointment_date", { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Appointments</h1>
          <p className="text-muted-foreground">Welcome back, {user?.email}</p>
        </div>

        <div className="mb-6">
          <Button onClick={() => navigate("/book")} className="gap-2">
            <Calendar className="w-4 h-4" />
            Book New Appointment
          </Button>
        </div>

        {loading ? (
          <p>Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No appointments yet</p>
              <Button onClick={() => navigate("/book")}>Schedule Your First Service</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {appointments.map((apt) => (
              <Card key={apt.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">
                      {apt.vehicle_year} {apt.vehicle_make} {apt.vehicle_model}
                    </CardTitle>
                    <Badge className={getStatusColor(apt.job_status)}>
                      {apt.job_status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(apt.appointment_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{apt.appointment_time}</span>
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
                    <div className="text-sm text-muted-foreground mt-2">
                      <strong>Notes:</strong> {apt.notes}
                    </div>
                  )}
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

export default CustomerDashboard;
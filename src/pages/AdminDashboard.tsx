import { useEffect, useState } from "react";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, services(name)")
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success("Status updated successfully");
      fetchAppointments();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    in_progress: "bg-purple-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="py-20 mt-16 bg-background">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-display font-bold mb-8">Admin Dashboard</h1>

          {loading ? (
            <p>Loading appointments...</p>
          ) : (
            <div className="grid gap-6">
              {appointments.map((apt) => (
                <Card key={apt.id} className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold">{apt.customer_name}</h3>
                        <Badge className={statusColors[apt.status]}>{apt.status}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <p><strong>Service:</strong> {apt.services?.name}</p>
                        <p><strong>Vehicle:</strong> {apt.vehicle_year} {apt.vehicle_make} {apt.vehicle_model}</p>
                        <p><strong>Date:</strong> {apt.appointment_date}</p>
                        <p><strong>Time:</strong> {apt.appointment_time}</p>
                        <p><strong>Email:</strong> {apt.customer_email}</p>
                        <p><strong>Phone:</strong> {apt.customer_phone}</p>
                      </div>
                      {apt.notes && (
                        <p className="mt-2 text-sm"><strong>Notes:</strong> {apt.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => updateStatus(apt.id, "confirmed")}>Confirm</Button>
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(apt.id, "in_progress")}>In Progress</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(apt.id, "completed")}>Complete</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(apt.id, "cancelled")}>Cancel</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AdminDashboard;

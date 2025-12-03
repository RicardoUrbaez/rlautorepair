import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Car, Phone, Play, CheckCircle, Clock, Shield, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const MechanicDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<AssignedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMechanic, setIsMechanic] = useState(false);
  const [updatingJob, setUpdatingJob] = useState<string | null>(null);
  const [jobNotes, setJobNotes] = useState<Record<string, string>>({});
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
        .from("assigned_jobs")
        .select("*")
        .eq("assigned_to", userId)
        .in("status", ["pending", "in_progress", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
      
      // Initialize notes
      const notesMap: Record<string, string> = {};
      data?.forEach(job => {
        notesMap[job.id] = job.notes || '';
      });
      setJobNotes(notesMap);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    setUpdatingJob(jobId);
    try {
      const updateData: any = { 
        status: newStatus,
        notes: jobNotes[jobId] || null,
      };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("assigned_jobs")
        .update(updateData)
        .eq("id", jobId);

      if (error) throw error;

      setJobs(prev =>
        prev.map(job => job.id === jobId ? { ...job, status: newStatus, notes: jobNotes[jobId] } : job)
      );

      toast({ 
        title: "Status Updated", 
        description: `Job marked as ${newStatus.replace("_", " ")}` 
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUpdatingJob(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      in_progress: "bg-purple-500",
      completed: "bg-green-500",
      approved: "bg-blue-500"
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusActions = (job: AssignedJob) => {
    switch (job.status) {
      case 'pending':
        return (
          <Button 
            onClick={() => updateJobStatus(job.id, 'in_progress')}
            disabled={updatingJob === job.id}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {updatingJob === job.id ? "Starting..." : "Start Job"}
          </Button>
        );
      case 'in_progress':
        return (
          <Button 
            onClick={() => updateJobStatus(job.id, 'completed')}
            disabled={updatingJob === job.id}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {updatingJob === job.id ? "Completing..." : "Mark Completed"}
          </Button>
        );
      case 'completed':
        return (
          <div className="text-center p-3 bg-green-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-sm text-green-800 font-medium">Waiting for Admin Approval</p>
          </div>
        );
      default:
        return null;
    }
  };

  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const inProgressJobs = jobs.filter(j => j.status === 'in_progress');
  const completedJobs = jobs.filter(j => j.status === 'completed');

  if (!isMechanic) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">My Jobs</h1>
            <p className="text-muted-foreground">Mechanic Dashboard</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/totp-setup">
                <Shield className="w-4 h-4 mr-2" />
                Setup 2FA
              </Link>
            </Button>
            <Button variant="outline" onClick={() => user && fetchAssignedJobs(user.id)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <p>Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No jobs assigned yet</p>
              <p className="text-sm text-muted-foreground mt-2">Jobs will appear here once admin assigns them to you.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* In Progress Jobs - Most Important */}
            {inProgressJobs.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  In Progress ({inProgressJobs.length})
                </h2>
                <div className="grid gap-4">
                  {inProgressJobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      getStatusColor={getStatusColor}
                      getStatusActions={getStatusActions}
                      jobNotes={jobNotes}
                      setJobNotes={setJobNotes}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Pending Jobs */}
            {pendingJobs.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  Pending ({pendingJobs.length})
                </h2>
                <div className="grid gap-4">
                  {pendingJobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      getStatusColor={getStatusColor}
                      getStatusActions={getStatusActions}
                      jobNotes={jobNotes}
                      setJobNotes={setJobNotes}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Jobs */}
            {completedJobs.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Completed - Awaiting Approval ({completedJobs.length})
                </h2>
                <div className="grid gap-4">
                  {completedJobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      getStatusColor={getStatusColor}
                      getStatusActions={getStatusActions}
                      jobNotes={jobNotes}
                      setJobNotes={setJobNotes}
                      readonly
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

type JobCardProps = {
  job: AssignedJob;
  getStatusColor: (status: string) => string;
  getStatusActions: (job: AssignedJob) => React.ReactNode;
  jobNotes: Record<string, string>;
  setJobNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  readonly?: boolean;
};

const JobCard = ({ job, getStatusColor, getStatusActions, jobNotes, setJobNotes, readonly }: JobCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{job.vehicle}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Customer: {job.customer_name}</p>
          </div>
          <Badge className={getStatusColor(job.status)}>
            {job.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {job.appointment_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{new Date(job.appointment_date).toLocaleDateString()}</span>
            </div>
          )}
          {job.customer_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{job.customer_phone}</span>
            </div>
          )}
        </div>

        {job.description && (
          <div className="text-sm p-3 bg-muted rounded">
            <strong>Service:</strong> {job.description}
          </div>
        )}

        {!readonly && (
          <div className="space-y-2">
            <Label htmlFor={`notes-${job.id}`}>Job Notes</Label>
            <Textarea
              id={`notes-${job.id}`}
              placeholder="Add notes about the work done..."
              value={jobNotes[job.id] || ''}
              onChange={(e) => setJobNotes(prev => ({ ...prev, [job.id]: e.target.value }))}
              rows={3}
            />
          </div>
        )}

        {readonly && job.notes && (
          <div className="text-sm p-3 bg-blue-50 rounded border border-blue-200">
            <strong>Your Notes:</strong> {job.notes}
          </div>
        )}

        {getStatusActions(job)}
      </CardContent>
    </Card>
  );
};

export default MechanicDashboard;

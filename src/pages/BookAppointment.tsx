import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  customer_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  customer_email: z.string().email("Invalid email address").max(255),
  customer_phone: z.string().min(10, "Phone must be at least 10 digits").max(20),
  vehicle_make: z.string().min(2, "Make is required").max(50),
  vehicle_model: z.string().min(1, "Model is required").max(50),
  vehicle_year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  service_id: z.string().uuid("Please select a service"),
  appointment_date: z.string().min(1, "Date is required"),
  appointment_time: z.string().min(1, "Time is required"),
  notes: z.string().max(1000).optional(),
});

interface Service {
  id: string;
  name: string;
}

const BookAppointment = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      vehicle_make: "",
      vehicle_model: "",
      vehicle_year: new Date().getFullYear(),
      service_id: location.state?.selectedService || "",
      appointment_date: "",
      appointment_time: "",
      notes: "",
    },
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("id, name")
      .order("name");

    if (!error && data) {
      setServices(data);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("appointments").insert([
        {
          customer_name: values.customer_name,
          customer_email: values.customer_email,
          customer_phone: values.customer_phone,
          vehicle_make: values.vehicle_make,
          vehicle_model: values.vehicle_model,
          vehicle_year: values.vehicle_year,
          service_id: values.service_id,
          appointment_date: values.appointment_date,
          appointment_time: values.appointment_time,
          notes: values.notes || null,
          status: "pending",
        },
      ]);

      if (error) throw error;

      toast.success("Appointment booked successfully! We'll contact you soon.");
      form.reset();
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to book appointment. Please try again.");
      console.error("Error booking appointment:", error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="py-20 mt-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold mb-4">Book Your Appointment</h1>
            <p className="text-xl text-muted-foreground">
              Fill out the form below and we'll get back to you shortly
            </p>
          </div>

          <Card className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    Contact Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customer_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="customer_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Vehicle Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="vehicle_make"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Make *</FormLabel>
                          <FormControl>
                            <Input placeholder="Toyota" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicle_model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model *</FormLabel>
                          <FormControl>
                            <Input placeholder="Camry" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicle_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year *</FormLabel>
                          <FormControl>
                            <Input placeholder="2020" type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Appointment Details</h3>

                  <FormField
                    control={form.control}
                    name="service_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="appointment_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Date *</FormLabel>
                          <FormControl>
                            <Input type="date" min={today} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="appointment_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Time *</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any specific concerns or requirements..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6"
                  disabled={loading}
                >
                  {loading ? "Booking..." : "Book Appointment"}
                </Button>
              </form>
            </Form>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BookAppointment;

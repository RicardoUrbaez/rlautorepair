import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Calendar, Plus, X } from "lucide-react";
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
import { getAllMakes, getAllModels, getAllYears, getModelsForMakeAndYear } from "@/data/vehicleData";

const formSchema = z.object({
  customer_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  customer_email: z.string().email("Invalid email address").max(255),
  customer_phone: z.string().min(10, "Phone must be at least 10 digits").max(20),
  vehicle_make: z.string().min(2, "Make is required").max(50),
  vehicle_model: z.string().min(1, "Model is required").max(50),
  vehicle_year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  vin: z.string().length(17, "VIN must be exactly 17 characters").optional().or(z.literal("")),
  street_address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2, "State must be 2 characters").optional().or(z.literal("")),
  zip_code: z.string().max(10).optional(),
  service_ids: z.array(z.string().uuid()).min(1, "Please select at least one service"),
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
  const [selectedServices, setSelectedServices] = useState<string[]>([""]);
  const [filteredModels, setFilteredModels] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  
  const makes = getAllMakes();
  const years = getAllYears();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      vehicle_make: "",
      vehicle_model: "",
      vehicle_year: new Date().getFullYear(),
      vin: "",
      street_address: "",
      city: "",
      state: "",
      zip_code: "",
      service_ids: location.state?.selectedService ? [location.state.selectedService] : [],
      appointment_date: "",
      appointment_time: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (location.state?.selectedService) {
      setSelectedServices([location.state.selectedService]);
    }
  }, [location.state]);

  // Update filtered models when year or make changes
  useEffect(() => {
    const year = form.watch("vehicle_year");
    const make = form.watch("vehicle_make");
    
    if (year && make) {
      const models = getModelsForMakeAndYear(make, year);
      setFilteredModels(models);
      
      // Reset model if it's not available for the selected year/make combo
      const currentModel = form.getValues("vehicle_model");
      if (currentModel && !models.includes(currentModel)) {
        form.setValue("vehicle_model", "");
      }
    } else {
      setFilteredModels([]);
    }
  }, [form.watch("vehicle_year"), form.watch("vehicle_make")]);

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

  const addService = () => {
    setSelectedServices([...selectedServices, ""]);
  };

  const removeService = (index: number) => {
    if (selectedServices.length > 1) {
      const updated = selectedServices.filter((_, i) => i !== index);
      setSelectedServices(updated);
      form.setValue("service_ids", updated.filter(s => s !== ""));
    }
  };

  const updateService = (index: number, value: string) => {
    const updated = [...selectedServices];
    updated[index] = value;
    setSelectedServices(updated);
    form.setValue("service_ids", updated.filter(s => s !== ""));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // Get user if logged in (optional for public booking)
      const { data: { user } } = await supabase.auth.getUser();

      // Create one appointment for each service
      const appointments = values.service_ids.map(service_id => ({
        user_id: user?.id || null,
        customer_name: values.customer_name,
        customer_email: values.customer_email,
        customer_phone: values.customer_phone,
        vehicle_make: values.vehicle_make,
        vehicle_model: values.vehicle_model,
        vehicle_year: values.vehicle_year,
        vin: values.vin || null,
        street_address: values.street_address || null,
        city: values.city || null,
        state: values.state || null,
        zip_code: values.zip_code || null,
        service_id: service_id,
        appointment_date: values.appointment_date,
        appointment_time: values.appointment_time,
        notes: values.notes || null,
        job_status: "pending",
      }));

      const { error } = await supabase.from("appointments").insert(appointments);

      if (error) throw error;

      toast.success("Appointment(s) booked successfully! We'll contact you soon.");
      form.reset();
      setSelectedServices([""]);
      
      // Redirect to customer dashboard if logged in, otherwise home
      if (user) {
        navigate("/customer-dashboard");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      toast.error("Failed to book appointment. Please try again.");
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
                      name="vehicle_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year *</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background z-50 max-h-[300px]">
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicle_make"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Make *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select make" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background z-50 max-h-[300px]">
                              {makes.map((make) => (
                                <SelectItem key={make} value={make}>
                                  {make}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={!form.getValues("vehicle_year") || !form.getValues("vehicle_make")}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background z-50 max-h-[300px]">
                              {filteredModels.map((model) => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="vin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VIN (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="1HGBH41JXMN109186" maxLength={17} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Address (Optional)</h3>

                  <FormField
                    control={form.control}
                    name="street_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="NY" maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zip_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
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

                  <div className="space-y-3">
                    <FormLabel>Services *</FormLabel>
                    {selectedServices.map((selectedService, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <Select 
                          onValueChange={(value) => updateService(index, value)} 
                          value={selectedService}
                        >
                          <SelectTrigger className="flex-1 bg-background">
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedServices.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeService(index)}
                            className="shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addService}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Service
                    </Button>
                    {form.formState.errors.service_ids && (
                      <p className="text-sm text-destructive">{form.formState.errors.service_ids.message}</p>
                    )}
                  </div>

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

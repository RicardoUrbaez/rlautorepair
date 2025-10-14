import { Award, Users, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
  const values = [
    {
      icon: Award,
      title: "Quality First",
      description: "We never compromise on the quality of our work or parts",
    },
    {
      icon: Users,
      title: "Customer Focused",
      description: "Your satisfaction is our top priority",
    },
    {
      icon: Wrench,
      title: "Expert Service",
      description: "Highly trained technicians with years of experience",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Header */}
      <section className="bg-primary text-primary-foreground py-20 mt-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-display font-bold mb-4">About R&L Auto Repair</h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Your trusted partner for professional automotive care
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-display font-bold mb-6">Our Story</h2>
            <p className="text-muted-foreground mb-6">
              Founded by Ricardo Urbaez Sr., R&L Auto Repair has been serving our community with
              dedication and expertise for years. What started as a small family-owned shop has
              grown into a trusted name in automotive service, known for our commitment to quality
              and customer satisfaction.
            </p>
            <p className="text-muted-foreground mb-6">
              Our team of ASE-certified technicians brings decades of combined experience to every
              job, from routine maintenance to complex repairs. We understand that your vehicle is
              more than just transportation—it's an investment, and we treat it that way.
            </p>
            <p className="text-muted-foreground">
              At R&L Auto Repair, we combine old-school values with modern technology to deliver
              the best possible service. We stay up-to-date with the latest automotive innovations
              while maintaining the personal touch that our customers have come to expect.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-display font-bold mb-6">Our Mission</h2>
          <p className="text-xl text-muted-foreground">
            To provide exceptional automotive service that exceeds expectations, builds lasting
            relationships with our customers, and keeps their vehicles running safely and
            efficiently for years to come.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="p-8 text-center hover:shadow-xl smooth-transition border-2 hover:border-accent"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
                  <value.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-6">Certified & Trusted</h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Our technicians are ASE-certified and continuously trained on the latest automotive
            technologies. We're committed to maintaining the highest standards in our industry.
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-primary-foreground/80">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">15+</div>
              <div>Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">10,000+</div>
              <div>Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">5</div>
              <div>Certified Technicians</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;

import { Link } from "react-router-dom";
import { ArrowRight, Wrench, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroBanner from "@/assets/hero-banner.jpg";
import carIcon from "@/assets/car-icon.png";

const Index = () => {
  const features = [
    {
      icon: Wrench,
      title: "Expert Technicians",
      description: "ASE-certified mechanics with years of experience",
    },
    {
      icon: Clock,
      title: "Fast Service",
      description: "Same-day service available for most repairs",
    },
    {
      icon: Shield,
      title: "Quality Guarantee",
      description: "All work backed by our comprehensive warranty",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden racing-stripes">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(26, 47, 71, 0.7), rgba(26, 47, 71, 0.85)), url(${heroBanner})`,
          }}
        />
        
        {/* Animated Car */}
        <div className="absolute bottom-20 w-full">
          <img src={carIcon} alt="Racing car" className="car-animation h-20 w-auto" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-6 animate-fade-in">
            Expert Auto Repair <br />
            <span className="text-accent">You Can Trust</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Professional service, competitive pricing, and a commitment to excellence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link to="/book">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground glow-effect text-lg px-8">
                Book Your Appointment Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/services">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-lg px-8">
                View Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-display font-bold text-center mb-12">Why Choose R&L Auto Repair?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-8 text-center hover:shadow-xl smooth-transition border-2 hover:border-accent"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
                  <feature.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-display font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Book your appointment today and experience the R&L difference
          </p>
          <Link to="/book">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground glow-effect text-lg px-8">
              Schedule Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-display font-bold">R&L Auto Repair</h3>
            <p className="text-primary-foreground/80">
              Your trusted partner for professional auto repair and maintenance services.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/rlautorepair"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/80 hover:text-accent smooth-transition"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="https://instagram.com/rl_auto_repair"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/80 hover:text-accent smooth-transition"
              >
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-primary-foreground/80 hover:text-accent smooth-transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-primary-foreground/80 hover:text-accent smooth-transition">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/book" className="text-primary-foreground/80 hover:text-accent smooth-transition">
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-primary-foreground/80 hover:text-accent smooth-transition">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold">Our Services</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>Oil Change</li>
              <li>Brake Service</li>
              <li>Engine Diagnostics</li>
              <li>Tire Replacement</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold">Contact Us</h4>
            <div className="space-y-3 text-primary-foreground/80">
              <div className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 mt-1 flex-shrink-0" />
                <span>1010 St Georges Avenue<br />Rahway, NJ 07065</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <span>(732) 381-0020</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <span>RNLAUTOPROFESSIONAL.COM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-glow mt-8 pt-8 text-center text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} R&L Auto Repair. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

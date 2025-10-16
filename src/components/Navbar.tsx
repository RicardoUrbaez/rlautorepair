import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User, Wrench, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import rlLogoRound from "@/assets/rl-logo-round.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    setUserRole(data?.role || "customer");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "Book Appointment", path: "/book" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-secondary backdrop-blur-sm shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img src={rlLogoRound} alt="R&L Auto Repair" className="h-10 group-hover:scale-110 smooth-transition" />
            <span className="text-xl font-display font-bold text-secondary-foreground">
              R&L Auto Repair
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg smooth-transition font-medium ${
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-secondary-foreground hover:bg-accent"
                }`}
              >
                {item.name}
              </Link>
            ))}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-4">
                    <User className="w-4 h-4 mr-2" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  
                  {userRole === "admin" && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  
                  {userRole === "mechanic" && (
                    <DropdownMenuItem onClick={() => navigate("/mechanic")}>
                      <Wrench className="w-4 h-4 mr-2" />
                      Mechanic Dashboard
                    </DropdownMenuItem>
                  )}
                  
                  {(userRole === "customer" || !userRole) && (
                    <DropdownMenuItem onClick={() => navigate("/customer-dashboard")}>
                      <Settings className="w-4 h-4 mr-2" />
                      My Appointments
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm" className="ml-4">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-secondary-foreground hover:text-primary smooth-transition"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-accent">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg smooth-transition font-medium ${
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-secondary-foreground hover:bg-accent"
                }`}
              >
                {item.name}
              </Link>
            ))}

            {user ? (
              <div className="mt-4 space-y-2">
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  {user.email}
                </div>
                
                {userRole === "admin" && (
                  <Link to="/admin" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  </Link>
                )}
                
                {userRole === "mechanic" && (
                  <Link to="/mechanic" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Wrench className="w-4 h-4 mr-2" />
                      Mechanic Dashboard
                    </Button>
                  </Link>
                )}
                
                {(userRole === "customer" || !userRole) && (
                  <Link to="/customer-dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      My Appointments
                    </Button>
                  </Link>
                )}
                
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full justify-start" 
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button variant="default" size="sm" className="mt-4 w-full">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
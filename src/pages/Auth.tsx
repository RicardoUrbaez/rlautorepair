import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import rlLogo from "@/assets/rl-logo.png";
import { Building2, Users, Wrench } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [userType, setUserType] = useState<"customer" | "mechanic">("customer");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;

        // Check user roles and redirect accordingly
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        const roles = roleData?.map(r => r.role) || [];

        // Redirect based on role priority: admin > mechanic > customer
        if (roles.includes("admin")) {
          navigate("/admin-dashboard");
        } else if (roles.includes("mechanic") && userType === "mechanic") {
          navigate("/mechanic-dashboard");
        } else if (roles.includes("mechanic") && userType !== "mechanic") {
          await supabase.auth.signOut();
          throw new Error("Please use the Mechanic login tab.");
        } else if (userType === "mechanic") {
          await supabase.auth.signOut();
          throw new Error("You don't have mechanic access. Please contact admin.");
        } else {
          navigate("/customer-dashboard");
        }
        
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
      } else {
        // Only allow signup for customers
        if (userType === "mechanic") {
          throw new Error("Mechanic accounts must be created by an administrator.");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/customer-dashboard`,
          },
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Account created! You can now log in.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOktaSSO = async () => {
    setSsoLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithSSO({
        domain: 'rlautorepair.okta.com', // Replace with your Okta domain
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "SSO Error",
        description: error.message,
        variant: "destructive",
      });
      setSsoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12 bg-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <img src={rlLogo} alt="R&L Auto Repair" className="h-16 mx-auto" />
            <CardTitle className="text-2xl">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
            <CardDescription>
              {isLogin 
                ? `Sign in as ${userType === "mechanic" ? "Mechanic" : "Admin"}`
                : userType === "mechanic" 
                  ? "Mechanic accounts are created by administrators"
                  : "Sign up for an admin account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={userType} onValueChange={(v) => setUserType(v as "customer" | "mechanic")} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="customer" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="mechanic" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Mechanic
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </form>

            {userType === "customer" && !isLogin && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                By signing up, you'll have admin access to manage appointments and mechanics.
              </p>
            )}

            {userType === "mechanic" && !isLogin && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Mechanic accounts are created by administrators only.
              </p>
            )}

            {userType === "customer" && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleOktaSSO}
                  disabled={ssoLoading}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  {ssoLoading ? "Redirecting..." : "Sign in with Okta SSO"}
                </Button>
              </>
            )}

            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
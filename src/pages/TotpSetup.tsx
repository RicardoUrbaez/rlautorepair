import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, QrCode, CheckCircle, Copy, Smartphone } from "lucide-react";

const TotpSetup = () => {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [otpAuthUrl, setOtpAuthUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [step, setStep] = useState<"loading" | "setup" | "verify" | "complete">("loading");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    // Check if TOTP is already set up
    const { data: totpData } = await supabase.functions.invoke('totp-verify', {
      body: { action: 'check', userId: session.user.id }
    });

    if (totpData?.hasTotp) {
      setIsEnabled(true);
      setStep("complete");
    } else {
      await generateNewSecret(session.user.id);
    }
    setLoading(false);
  };

  const generateNewSecret = async (uid: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('totp-verify', {
        body: { action: 'generate', userId: uid }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to generate secret');
      }

      setSecret(data.secret);
      setOtpAuthUrl(data.otpAuthUrl);
      setStep("setup");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !secret) return;

    setVerifying(true);
    try {
      // First verify the code
      const { data: verifyResult } = await supabase.functions.invoke('totp-verify', {
        body: {
          action: 'verify',
          userId,
          token: verificationCode,
          secret,
        }
      });

      if (!verifyResult?.valid) {
        throw new Error("Invalid code. Please try again.");
      }

      // Save the TOTP secret
      const { data: setupResult, error } = await supabase.functions.invoke('totp-verify', {
        body: {
          action: 'setup',
          userId,
          secret,
        }
      });

      if (error || !setupResult?.success) {
        throw new Error(setupResult?.error || 'Failed to save TOTP settings');
      }

      setIsEnabled(true);
      setStep("complete");
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been set up successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast({
      title: "Copied",
      description: "Secret key copied to clipboard",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
              <CardDescription>
                {step === "complete" 
                  ? "Your account is protected with 2FA"
                  : "Set up Google Authenticator for enhanced security"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "setup" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">Step 1: Scan QR Code</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Open Google Authenticator and scan this QR code:
                    </p>
                    
                    <div className="bg-white p-4 rounded-lg inline-block mb-4">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`}
                        alt="QR Code for Google Authenticator"
                        className="w-48 h-48"
                      />
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Can't scan? Enter manually:</span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                      <code className="text-sm font-mono break-all">{secret}</code>
                      <Button size="icon" variant="ghost" onClick={copySecret}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => setStep("verify")}>
                    I've scanned the QR code
                  </Button>
                </div>
              )}

              {step === "verify" && (
                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">Step 2: Verify Setup</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter the 6-digit code from Google Authenticator to complete setup:
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-2xl tracking-widest"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("setup")}>
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={verifying || verificationCode.length !== 6}>
                      {verifying ? "Verifying..." : "Enable 2FA"}
                    </Button>
                  </div>
                </form>
              )}

              {step === "complete" && (
                <div className="text-center space-y-6">
                  <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">2FA is Active</h3>
                    <p className="text-sm text-muted-foreground">
                      Your account is protected with two-factor authentication. 
                      You'll need to enter a code from Google Authenticator each time you log in.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => navigate(-1)}>
                    Go Back
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TotpSetup;

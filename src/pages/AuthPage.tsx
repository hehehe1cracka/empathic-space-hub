import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Heart, Smile, Lock, Users, Mail, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuthPage: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, isConfigured } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      toast({
        title: "Firebase not configured",
        description: "Please add your Firebase configuration to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      toast({
        title: "Firebase not configured",
        description: "Please add your Firebase configuration to continue.",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      await signUp(signupEmail, signupPassword, signupName);
      toast({
        title: "Account created!",
        description: "Welcome to Serene. Let's make your experience safe and healthy.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      toast({
        title: "Firebase not configured",
        description: "Please add your Firebase configuration to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "Welcome!",
        description: "You've successfully signed in with Google.",
      });
    } catch (error: any) {
      toast({
        title: "Google sign in failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Shield, title: "Privacy First", description: "Your data stays yours" },
    { icon: Heart, title: "Mental Health", description: "Built-in wellbeing support" },
    { icon: Smile, title: "Toxicity Free", description: "AI-powered safety" },
    { icon: Lock, title: "Safe Space", description: "Child protection modes" },
  ];

  return (
    <div className="min-h-screen gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl gradient-calm flex items-center justify-center shadow-glow">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Serene</h1>
            </div>
            
            <h2 className="text-4xl font-bold leading-tight text-foreground">
              Connect mindfully.
              <br />
              <span className="text-primary">Chat safely.</span>
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-md">
              A social platform designed for your wellbeing. No addiction loops, 
              no toxicity, no fake news — just meaningful connections.
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-card shadow-soft"
                >
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <feature.icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right side - Auth form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-medium border-0">
            <CardHeader className="text-center pb-2">
              <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl gradient-calm flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-2xl font-bold text-foreground">Serene</span>
              </div>
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>
                {isConfigured 
                  ? "Sign in to your account or create a new one"
                  : "Configure Firebase to get started"
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {!isConfigured && (
                <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-sm text-warning-foreground font-medium mb-2">
                    Firebase Configuration Required
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Add your Firebase config as environment variables:
                    VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, 
                    VITE_FIREBASE_DATABASE_URL, VITE_FIREBASE_PROJECT_ID, etc.
                  </p>
                </div>
              )}

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Display Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 6 characters"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirm Password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="Confirm your password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              
              <p className="text-center text-xs text-muted-foreground mt-6">
                By signing up, you agree to use this platform mindfully and respectfully.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;

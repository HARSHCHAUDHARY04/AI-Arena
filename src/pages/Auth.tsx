import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ParticleBackground } from '@/components/ParticleBackground';
import { ArrowLeft, Zap, Lock, Mail, Shield, Users, Settings } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginType = 'select' | 'admin' | 'participant';

export default function AuthPage() {
  const [loginType, setLoginType] = useState<LoginType>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && role) {
      if (role === 'admin') navigate('/admin');
      else if (role === 'organizer') navigate('/organizer');
      else navigate('/dashboard');
    }
  }, [user, role, navigate]);

  const validateForm = () => {
    try {
      loginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error('Login failed. Please check your credentials.');
    } else {
      toast.success('Welcome back!');
    }
    setLoading(false);
  };

  const handleBack = () => {
    setLoginType('select');
    setEmail('');
    setPassword('');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="glass-card p-8 rounded-2xl border border-border/50">
            <AnimatePresence mode="wait">
              {loginType === 'select' ? (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                      <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-display font-bold neon-text mb-2">AI Battle Arena</h1>
                    <p className="text-muted-foreground text-sm">Select your login type to continue</p>
                  </div>

                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setLoginType('admin')}
                      className="w-full p-6 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 hover:border-secondary/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                          <Settings className="w-7 h-7 text-secondary" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-display font-semibold text-lg mb-1">Admin Login</h3>
                          <p className="text-sm text-muted-foreground">Manage events, teams, and competition settings</p>
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setLoginType('participant')}
                      className="w-full p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                          <Users className="w-7 h-7 text-primary" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-display font-semibold text-lg mb-1">Participant Login</h3>
                          <p className="text-sm text-muted-foreground">Access your team dashboard and competition</p>
                        </div>
                      </div>
                    </motion.button>
                  </div>

                  <div className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Credentials are assigned by the administrator only
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <button 
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to selection
                  </button>

                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                      loginType === 'admin' ? 'bg-secondary/20' : 'bg-primary/20'
                    }`}>
                      {loginType === 'admin' ? (
                        <Settings className={`w-8 h-8 text-secondary`} />
                      ) : (
                        <Users className={`w-8 h-8 text-primary`} />
                      )}
                    </div>
                    <h1 className="text-2xl font-display font-bold neon-text mb-2">
                      {loginType === 'admin' ? 'Admin Login' : 'Participant Login'}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      Enter your credentials provided by the administrator
                    </p>
                  </div>

                  <div className={`rounded-lg p-4 mb-6 ${
                    loginType === 'admin' 
                      ? 'bg-secondary/10 border border-secondary/30' 
                      : 'bg-primary/10 border border-primary/30'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Lock className={`w-5 h-5 mt-0.5 ${loginType === 'admin' ? 'text-secondary' : 'text-primary'}`} />
                      <div>
                        <p className={`text-sm font-medium ${loginType === 'admin' ? 'text-secondary' : 'text-primary'}`}>
                          Admin-Only Access
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          No self-registration. Credentials assigned by admin.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">User ID / Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="your.email@example.com" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          className="pl-10" 
                          required 
                        />
                      </div>
                      {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="password" 
                          type="password" 
                          placeholder="••••••••" 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          className="pl-10" 
                          required 
                        />
                      </div>
                      {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                    </div>

                    <Button 
                      type="submit" 
                      variant="hero" 
                      size="xl" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Authenticating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Access Arena
                        </span>
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-border/30 text-center">
                    <p className="text-sm text-muted-foreground">
                      Need access? <span className="text-primary">Contact your administrator</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

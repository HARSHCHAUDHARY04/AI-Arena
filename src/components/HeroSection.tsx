import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import {
  Zap,
  Trophy,
  Users,
  Code2,
  Timer,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export function HeroSection() {
  const { user } = useAuth();

  const features = [
    { icon: Code2, label: 'Submit AI APIs', description: 'Test your models in real-time' },
    { icon: Trophy, label: 'Live Rankings', description: 'Real-time leaderboard updates' },
    { icon: Timer, label: 'Timed Challenges', description: 'Compete under pressure' },
    { icon: Users, label: 'Team Battles', description: 'Collaborate and conquer' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-hero-pattern" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Tech Fest 2026 Competition</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
          >
            <span className="text-foreground">AI</span>{' '}
            <span className="text-gradient neon-text">BATTLE</span>
            <br />
            <span className="text-foreground">ARENA</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Deploy your AI models. Compete in real-time challenges.
            Prove your algorithms are the best. The ultimate arena for machine learning warriors.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex items-center justify-center gap-4 mb-8"
          >
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="hero" size="xl" className="group">
                    <Zap className="h-5 w-5" />
                    Enter Arena
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="hero" size="xl">
                    <Zap className="h-5 w-5" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/scoreboard">
                  <Button variant="outline" size="xl">
                    <Trophy className="h-5 w-5" />
                    View Leaderboard
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className="glass-card p-6 group hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors mx-auto">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">{feature.label}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>


      </div>
    </section>
  );
}

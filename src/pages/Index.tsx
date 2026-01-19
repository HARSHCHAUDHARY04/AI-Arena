import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { ParticleBackground } from '@/components/ParticleBackground';
import { EventCard } from '@/components/EventCard';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import db from '@/integrations/mongo/client';
import {
  Code2,
  Cpu,
  Zap,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
}

const Index = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await db
        .from('events')
        .select('id, title, description, status, start_time, end_time')
        .in('status', ['registration', 'active'])
        .order('created_at', { ascending: false })
        .limit(3);

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const howItWorks = [
    {
      icon: Code2,
      title: 'Build Your AI',
      description: 'Create an ML model and deploy it as an API endpoint. Flask, FastAPI, or Node.js - your choice.',
    },
    {
      icon: Zap,
      title: 'Submit & Test',
      description: 'Register your API endpoint and test it against sample data before the competition begins.',
    },
    {
      icon: Cpu,
      title: 'Compete Live',
      description: 'During the event, your API is evaluated in real-time with accuracy, speed, and stability metrics.',
    },
    {
      icon: Trophy,
      title: 'Win Glory',
      description: 'Climb the leaderboard and prove your AI is the best. Top teams win prizes and recognition.',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <div className="grid-bg fixed inset-0 pointer-events-none" />
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* How It Works */}
      <section className="relative py-24 z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Four simple steps from code to championship
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 text-center group hover:border-primary/50 transition-all"
              >
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl group-hover:bg-primary/30 transition-colors" />
                  <div className="relative w-full h-full bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center font-display text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Events */}
      {events.length > 0 && (
        <section className="relative py-24 z-10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-12"
            >
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                  Active <span className="text-gradient">Competitions</span>
                </h2>
                <p className="text-muted-foreground">
                  Join an ongoing event or prepare for upcoming battles
                </p>
              </div>
              <Link to="/scoreboard">
                <Button variant="outline" className="hidden md:flex">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="relative py-24 z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-hero-pattern" />
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Ready to <span className="text-gradient">Compete?</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                Register now and join the ultimate AI competition. Show the world what your algorithms can do.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSdsiz9av1FXO3MCLkzd_eJY0v4w_2VPg8vtSnJAy_y8MZfnsw/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="xl" className="font-display font-bold text-lg bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 shadow-lg hover:shadow-emerald-500/25 transition-all duration-300">
                    <Zap className="h-5 w-5 mr-2" />
                    Register Now
                  </Button>
                </a>
                <Link to="/scoreboard">
                  <Button variant="outline" size="lg">
                    View Leaderboard
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 border-t border-border/30 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="font-display font-bold">AI BATTLE ARENA</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2026 Tech Fest. Built for the ultimate AI showdown.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

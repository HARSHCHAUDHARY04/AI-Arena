import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { ParticleBackground } from '@/components/ParticleBackground';
import { LiveScoreboard } from '@/components/LiveScoreboard';
import { 
  Eye, 
  Users, 
  Trophy, 
  Calendar,
  Activity,
  Clock
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
}

interface TeamStats {
  total: number;
  qualified: number;
  pending: number;
}

export default function OrganizerDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats>({ total: 0, qualified: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (role && role !== 'organizer' && role !== 'admin') {
        navigate('/dashboard');
      }
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    if (user && (role === 'organizer' || role === 'admin')) {
      fetchData();
    }
  }, [user, role]);

  const fetchData = async () => {
    try {
      // Fetch events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, status, start_time, end_time')
        .order('created_at', { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
      }

      // Fetch team stats
      const { data: teamsData } = await supabase
        .from('teams')
        .select('shortlist_status');

      if (teamsData) {
        setTeamStats({
          total: teamsData.length,
          qualified: teamsData.filter(t => t.shortlist_status === 'qualified').length,
          pending: teamsData.filter(t => t.shortlist_status === 'pending').length,
        });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'completed': return 'text-blue-500';
      case 'paused': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ParticleBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary/20">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold neon-text">
                Organizer Dashboard
              </h1>
              <p className="text-muted-foreground">
                Monitor events and teams (Read-Only)
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{events.length}</p>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{teamStats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Teams</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{teamStats.qualified}</p>
                  <p className="text-sm text-muted-foreground">Qualified</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{teamStats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Events List */}
            <div className="glass-card p-6 rounded-xl">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                Events Overview
              </h2>
              
              <div className="space-y-3">
                {events.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No events created yet</p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="bg-background/50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{event.title}</p>
                          <p className={`text-sm ${getStatusColor(event.status)}`}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </p>
                        </div>
                        {event.start_time && (
                          <div className="text-right text-sm text-muted-foreground">
                            <p>Starts</p>
                            <p>{new Date(event.start_time).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Scoreboard */}
            <div className="glass-card p-6 rounded-xl">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-primary" />
                Live Scoreboard
              </h2>
              <LiveScoreboard eventId={events[0]?.id} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

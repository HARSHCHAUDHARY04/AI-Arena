import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { ParticleBackground } from '@/components/ParticleBackground';
import { LiveScoreboard } from '@/components/LiveScoreboard';
import { EventTimer } from '@/components/EventTimer';
import { ApiSubmissionForm } from '@/components/ApiSubmissionForm';
import { TeamManagement } from '@/components/TeamManagement';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Code2, 
  Trophy, 
  Clock, 
  Users, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string | null;
  problem_statement: string | null;
  rules: string | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
  submissions_locked: boolean;
}

interface Team {
  id: string;
  name: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'submit' | 'scoreboard'>('overview');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch active event
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .in('status', ['registration', 'active'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (events && events.length > 0) {
        setActiveEvent(events[0]);
      }

      // Fetch user's team
      if (user) {
        const { data: teamMembership } = await supabase
          .from('team_members')
          .select('team_id, teams(id, name)')
          .eq('user_id', user.id)
          .single();

        if (teamMembership?.teams) {
          setUserTeam(teamMembership.teams as Team);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'submit', label: 'Submit API', icon: Code2 },
    { id: 'scoreboard', label: 'Scoreboard', icon: Trophy },
  ];

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Participant Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Manage your competition entry here.
          </p>
        </motion.div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Team</p>
              <p className="font-display font-semibold">
                {userTeam?.name || 'No team yet'}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Event Status</p>
              <p className="font-display font-semibold capitalize">
                {activeEvent?.status || 'No active event'}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-4 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              userTeam ? 'bg-success/10' : 'bg-warning/10'
            }`}>
              {userTeam ? (
                <CheckCircle className="h-6 w-6 text-success" />
              ) : (
                <AlertCircle className="h-6 w-6 text-warning" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">API Status</p>
              <p className="font-display font-semibold">
                {userTeam ? 'Ready to Submit' : 'Join a Team First'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="flex items-center gap-2"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {activeTab === 'overview' && (
            <>
              <div className="lg:col-span-2 space-y-6">
                {/* Event Details */}
                {activeEvent ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6"
                  >
                    <h2 className="font-display font-bold text-xl mb-4">
                      {activeEvent.title}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      {activeEvent.description || 'No description available'}
                    </p>

                    {activeEvent.problem_statement && (
                      <div className="mb-6">
                        <h3 className="font-display font-semibold mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          Problem Statement
                        </h3>
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-sm whitespace-pre-wrap">
                            {activeEvent.problem_statement}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeEvent.rules && (
                      <div>
                        <h3 className="font-display font-semibold mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-accent" />
                          Rules
                        </h3>
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-sm whitespace-pre-wrap">
                            {activeEvent.rules}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="glass-card p-12 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-display font-semibold text-lg mb-2">No Active Event</h3>
                    <p className="text-muted-foreground">
                      Check back later for upcoming competitions.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {activeEvent && (
                  <EventTimer
                    startTime={activeEvent.start_time}
                    endTime={activeEvent.end_time}
                    status={activeEvent.status}
                  />
                )}
                <LiveScoreboard eventId={activeEvent?.id} limit={5} />
              </div>
            </>
          )}

          {activeTab === 'team' && (
            <>
              <div className="lg:col-span-2">
                <TeamManagement 
                  eventId={activeEvent?.id} 
                  onTeamChange={fetchData} 
                />
              </div>
              <div className="space-y-6">
                {activeEvent && (
                  <EventTimer
                    startTime={activeEvent.start_time}
                    endTime={activeEvent.end_time}
                    status={activeEvent.status}
                  />
                )}
                <LiveScoreboard eventId={activeEvent?.id} limit={5} />
              </div>
            </>
          )}

          {activeTab === 'submit' && (
            <>
              <div className="lg:col-span-2">
                {userTeam && activeEvent ? (
                  <ApiSubmissionForm
                    teamId={userTeam.id}
                    eventId={activeEvent.id}
                    isLocked={activeEvent.submissions_locked}
                  />
                ) : (
                  <div className="glass-card p-12 text-center">
                    <Code2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-display font-semibold text-lg mb-2">
                      {!userTeam ? 'Join a Team First' : 'No Active Event'}
                    </h3>
                    <p className="text-muted-foreground">
                      {!userTeam 
                        ? 'You need to be part of a team to submit an API.'
                        : 'There is no active event to submit to.'
                      }
                    </p>
                  </div>
                )}
              </div>
              <div>
                {activeEvent && (
                  <EventTimer
                    startTime={activeEvent.start_time}
                    endTime={activeEvent.end_time}
                    status={activeEvent.status}
                  />
                )}
              </div>
            </>
          )}

          {activeTab === 'scoreboard' && (
            <div className="lg:col-span-3">
              <LiveScoreboard eventId={activeEvent?.id} limit={20} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

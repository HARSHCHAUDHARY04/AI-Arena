import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { ParticleBackground } from '@/components/ParticleBackground';
import { LiveScoreboard } from '@/components/LiveScoreboard';
import { AdminAnalytics } from '@/components/AdminAnalytics';
import { TeamShortlistManager } from '@/components/TeamShortlistManager';
import { AdminEventTimer } from '@/components/AdminEventTimer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import db, { API_BASE } from '@/integrations/mongo/client';
import {
  Plus,
  Calendar,
  Play,
  Pause,
  Square,
  Loader2,
  Trophy,
  FileText,
  Lock,
  Unlock,
  Users,
  BarChart3,
  Timer,
  AlertCircle,
  FlaskConical,
  Eye,
  EyeOff
} from 'lucide-react';
import { AdminEvaluationPanel } from '@/components/AdminEvaluationPanel';
import { TournamentAdminPanel } from '@/components/TournamentAdminPanel';

interface Event {
  _id: string;
  id?: string;
  title: string;
  description: string | null;
  problem_statement: string | null;
  rules: string | null;
  api_contract: string | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
  submissions_locked: boolean;
  scoreboard_approved: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'teams' | 'tournament' | 'timer' | 'evaluation'>('overview');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rounds, setRounds] = useState<any[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(false);
  const [creatingRound, setCreatingRound] = useState(false);
  const [togglingScoreboard, setTogglingScoreboard] = useState(false);
  const [togglingSubmissions, setTogglingSubmissions] = useState(false);
  const [newRound, setNewRound] = useState({ number: 1, title: '', dataset_name: '', dataset_description: '', problem_statement: '', evaluation_criteria: '' });

  // Form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    problem_statement: '',
    rules: '',
    api_contract: '',
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (role !== 'admin') {
        navigate('/dashboard');
      }
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    if (user && role === 'admin') {
      fetchEvents();
    }
  }, [user, role]);

  useEffect(() => {
    if (selectedEvent) fetchRounds(selectedEvent._id || selectedEvent.id || '');
  }, [selectedEvent]);

  const fetchRounds = async (eventId: string) => {
    setLoadingRounds(true);
    try {
      const res = await fetch(`${API_BASE}/api/tournament/rounds?event_id=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setRounds(data || []);
      }
    } catch (err) {
      console.error('Error fetching rounds', err);
    } finally {
      setLoadingRounds(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data || []);

        // Update selected event if one exists, otherwise pick the first one
        if (data && data.length > 0) {
          if (selectedEvent) {
            const updated = data.find((e: Event) => (e._id || e.id) === (selectedEvent._id || selectedEvent.id));
            if (updated) setSelectedEvent(updated);
          } else {
            setSelectedEvent(data[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Single Event Mode: No creation form
  // Round Management: Sequential only.

  const updateEventStatus = async (eventId: string, status: string) => {
    try {
      const updates: Record<string, unknown> = { status };

      if (status === 'active') {
        updates.submissions_locked = true;
      }

      const { error } = await db
        .from('events')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Event status changed to ${status}`,
      });
      fetchEvents();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setCreatingRound(true);

    // Auto-calculate next round number
    const nextRoundNum = rounds.length + 1;
    const isFinal = nextRoundNum >= 4; // Assuming 4 rounds structure as per rulebook: R1, R2, R3, Final

    try {
      const payload = {
        event_id: selectedEvent._id || selectedEvent.id,
        number: nextRoundNum,
        title: isFinal ? 'Final Round' : `Round ${nextRoundNum}`,
        dataset_name: newRound.dataset_name,
        dataset_description: newRound.dataset_description,
        dataset_meta: {
          pdf_link: newRound.problem_statement, // Using problem_statement field for PDF URL temporarily or add specific field
          questions: newRound.evaluation_criteria?.split('\n').filter(q => q.trim().length > 0) || []
        },
        problem_statement: newRound.problem_statement, // Keeping for PDF URL reference in UI
        evaluation_criteria: newRound.evaluation_criteria, // Keeping for Questions reference in UI
        status: 'upcoming',
        submissions_locked: false,
        created_at: new Date().toISOString(),
        dataset_locked: true // Locked immediately per rules
      };

      const { error } = await db.from('rounds').insert([payload]);
      if (error) throw error;

      setNewRound({ number: nextRoundNum + 1, title: '', dataset_name: '', dataset_description: '', problem_statement: '', evaluation_criteria: '' });
      fetchRounds(selectedEvent._id || selectedEvent.id || '');
      toast({ title: 'Round Created', description: `${payload.title} created and dataset locked.` });
    } catch (err) {
      console.error('Error creating round', err);
      toast({ title: 'Error', description: 'Failed to create round', variant: 'destructive' });
    } finally {
      setCreatingRound(false);
    }
  };

  const updateRoundStatus = async (roundId: string, status: string) => {
    try {
      const { error } = await db.from('rounds').update({ status }).eq('id', roundId);
      if (error) throw error;
      toast({ title: 'Round Updated', description: `Round status set to ${status}` });
      if (selectedEvent) fetchRounds(selectedEvent._id || selectedEvent.id || '');
    } catch (err) {
      console.error('Error updating round status', err);
      toast({ title: 'Error', description: 'Failed to update round', variant: 'destructive' });
    }
  };

  const toggleRoundLock = async (roundId: string, locked: boolean) => {
    try {
      const { error } = await db.from('rounds').update({ submissions_locked: locked }).eq('id', roundId);
      if (error) throw error;
      toast({ title: locked ? 'Locked' : 'Unlocked', description: 'Round submissions updated' });
      if (selectedEvent) fetchRounds(selectedEvent._id || selectedEvent.id || '');
    } catch (err) {
      console.error('Error toggling round lock', err);
    }
  };

  const triggerEvaluation = async (roundId: string) => {
    try {
      const { error } = await db.from('rounds').update({ status: 'completed' }).eq('id', roundId);
      if (error) throw error;
      toast({ title: 'Evaluation Triggered', description: 'Round marked complete. Evaluation should run.' });
      if (selectedEvent) fetchRounds(selectedEvent._id || selectedEvent.id || '');
    } catch (err) {
      console.error('Error triggering evaluation', err);
      toast({ title: 'Error', description: 'Failed to trigger evaluation', variant: 'destructive' });
    }
  };

  const eliminateTeamsForRound = async (roundId: string, teamIds: string[]) => {
    try {
      for (const teamId of teamIds) {
        const { error } = await db.from('qualifications').upsert([{ round_id: roundId, team_id: teamId, status: 'eliminated' }]);
        if (error) console.error('eliminate error', error);
      }
      toast({ title: 'Elimination Updated', description: 'Marked teams as eliminated for the round.' });
    } catch (err) {
      console.error('Error eliminating teams', err);
    }
  };

  const toggleSubmissions = async (eventId: string, locked: boolean) => {
    try {
      setTogglingSubmissions(true);
      const { error } = await db
        .from('events')
        .update({ submissions_locked: locked })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: locked ? 'Submissions Locked' : 'Submissions Unlocked',
        description: locked
          ? 'Teams can no longer submit or update APIs'
          : 'Teams can now submit APIs',
      });
      await fetchEvents();
    } catch (error) {
      console.error('Error toggling submissions:', error);
    } finally {
      setTogglingSubmissions(false);
    }
  };

  const toggleScoreboard = async (eventId: string, approved: boolean) => {
    try {
      setTogglingScoreboard(true);
      const token = localStorage.getItem('ai_arena_token');
      const res = await fetch(`${API_BASE}/api/events/${eventId}/toggle-scoreboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approved })
      });

      if (!res.ok) throw new Error('Failed to toggle scoreboard');

      toast({
        title: approved ? 'Scoreboard Public' : 'Scoreboard Hidden',
        description: approved
          ? 'Participants can now see the live leaderboard'
          : 'Scoreboard is now hidden from participants',
      });
      await fetchEvents();
    } catch (error) {
      console.error('Error toggling scoreboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to update scoreboard visibility',
        variant: 'destructive'
      });
    } finally {
      setTogglingScoreboard(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success';
      case 'paused': return 'text-warning';
      case 'completed': return 'text-muted-foreground';
      default: return 'text-secondary';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Analytics', icon: BarChart3 },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'teams', label: 'Teams & Shortlist', icon: Users },
    { id: 'tournament', label: 'Tournament', icon: Trophy },
    { id: 'evaluation', label: 'Evaluation', icon: FlaskConical },
    { id: 'timer', label: 'Timer Control', icon: Timer },
  ];

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Navbar />

      <main className="container mx-auto px-4 pt-20 pb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage events, teams, and competition settings
            </p>
          </div>

          <div className="flex gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className="flex items-center gap-2"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </motion.div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="font-display font-bold text-xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Performance Analytics
            </h2>
            {selectedEvent ? (
              <AdminAnalytics />
            ) : (
              <div className="glass-card p-12 text-center">
                <p className="text-muted-foreground">Loading analytics...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Single Event Permanent Card */}
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Current Event
              </h2>

              {selectedEvent ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 ring-2 ring-primary bg-primary/5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display font-semibold text-2xl">{selectedEvent.title}</h3>
                      <p className={`text-sm font-bold uppercase tracking-wider mt-1 ${getStatusColor(selectedEvent.status)}`}>
                        {selectedEvent.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={togglingSubmissions}
                        variant={selectedEvent.submissions_locked ? 'destructive' : 'outline'}
                        onClick={() => toggleSubmissions(selectedEvent.id, !selectedEvent.submissions_locked)}
                      >
                        {togglingSubmissions ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : selectedEvent.submissions_locked ? (
                          <Lock className="h-4 w-4 mr-2" />
                        ) : (
                          <Unlock className="h-4 w-4 mr-2" />
                        )}
                        {selectedEvent.submissions_locked ? 'Submissions Locked' : 'Submissions Open'}
                      </Button>
                      <Button
                        size="sm"
                        disabled={togglingScoreboard}
                        variant={selectedEvent.scoreboard_approved ? 'success' : 'outline'}
                        onClick={() => toggleScoreboard(selectedEvent._id || selectedEvent.id || '', !selectedEvent.scoreboard_approved)}
                      >
                        {togglingScoreboard ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : selectedEvent.scoreboard_approved ? (
                          <Eye className="h-4 w-4 mr-2" />
                        ) : (
                          <EyeOff className="h-4 w-4 mr-2" />
                        )}
                        {selectedEvent.scoreboard_approved ? 'Scoreboard Visible' : 'Scoreboard Hidden'}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-black/20 p-4 rounded-lg mb-6">
                    <p className="text-foreground/90 text-sm">
                      {selectedEvent.description || 'No description available.'}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs font-mono text-muted-foreground">
                      <div>
                        <span className="block opacity-50">Problem Statement</span>
                        <span className="text-foreground">{selectedEvent.problem_statement?.substring(0, 50)}...</span>
                      </div>
                      <div>
                        <span className="block opacity-50">API Contract</span>
                        <span className="text-foreground">{selectedEvent.api_contract}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border/50">
                    <p className="w-full text-xs text-muted-foreground mb-2">Admin Actions (Use with Caution)</p>

                    {selectedEvent.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateEventStatus(selectedEvent.id, 'paused')}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Competition
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateEventStatus(selectedEvent.id, 'completed')}
                        >
                          <Square className="h-4 w-4 mr-2" />
                          End Competition
                        </Button>
                      </>
                    )}

                    {selectedEvent.status === 'paused' && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => updateEventStatus(selectedEvent.id, 'active')}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume Competition
                      </Button>
                    )}

                    {selectedEvent.status === 'completed' && (
                      <span className="text-sm font-bold text-destructive flex items-center">
                        <Square className="h-4 w-4 mr-2" /> Event Ended
                      </span>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="glass-card p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="mt-2 text-muted-foreground">Loading Event Details...</p>
                </div>
              )}
            </div>
          </div>
        )}


        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamShortlistManager eventId={selectedEvent?.id} />
            <div className="space-y-6">
              <LiveScoreboard limit={10} />
            </div>
          </div>
        )}

        {activeTab === 'tournament' && selectedEvent && (
          <TournamentAdminPanel eventId={selectedEvent._id || selectedEvent.id || ''} />
        )}

        {activeTab === 'evaluation' && selectedEvent && (
          <AdminEvaluationPanel eventId={selectedEvent._id || selectedEvent.id || ''} />
        )}

        {activeTab === 'timer' && selectedEvent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdminEventTimer event={selectedEvent} onUpdate={fetchEvents} />
            <p className="text-muted-foreground">Timer control for the main event.</p>
          </div>
        )}
      </main>
    </div>
  );
}

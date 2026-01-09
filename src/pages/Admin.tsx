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
import { supabase } from '@/integrations/supabase/client';
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
  Timer
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string | null;
  problem_statement: string | null;
  rules: string | null;
  api_contract: string | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
  submissions_locked: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'teams' | 'timer'>('overview');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
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

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
      if (data && data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { error } = await supabase
        .from('events')
        .insert([{
          title: newEvent.title,
          description: newEvent.description || null,
          problem_statement: newEvent.problem_statement || null,
          rules: newEvent.rules || null,
          api_contract: newEvent.api_contract || null,
          start_time: newEvent.start_time || null,
          end_time: newEvent.end_time || null,
          created_by: user?.id,
        }]);

      if (error) throw error;

      toast({
        title: 'Event Created!',
        description: 'Your new event has been created successfully.',
      });

      setNewEvent({
        title: '',
        description: '',
        problem_statement: '',
        rules: '',
        api_contract: '',
        start_time: '',
        end_time: '',
      });
      setShowCreateForm(false);
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const updateEventStatus = async (eventId: string, status: string) => {
    try {
      const updates: Record<string, unknown> = { status };
      
      if (status === 'active') {
        updates.submissions_locked = true;
      }

      const { error } = await supabase
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

  const toggleSubmissions = async (eventId: string, locked: boolean) => {
    try {
      const { error } = await supabase
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
      fetchEvents();
    } catch (error) {
      console.error('Error toggling submissions:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    { id: 'timer', label: 'Timer Control', icon: Timer },
  ];

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage events, teams, and competition settings
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} variant="hero">
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </motion.div>

        {/* Analytics Overview */}
        <div className="mb-8">
          <AdminAnalytics />
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

        {/* Create Event Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass-card p-6 mb-8"
          >
            <h2 className="font-display font-bold text-xl mb-6">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="AI Classification Challenge"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Brief description of the event"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">Problem Statement</Label>
                <Textarea
                  id="problem"
                  value={newEvent.problem_statement}
                  onChange={(e) => setNewEvent({ ...newEvent, problem_statement: e.target.value })}
                  placeholder="Detailed problem statement for participants..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_contract">API Contract</Label>
                <Textarea
                  id="api_contract"
                  value={newEvent.api_contract}
                  onChange={(e) => setNewEvent({ ...newEvent, api_contract: e.target.value })}
                  placeholder="API specifications and contract details..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules">Rules</Label>
                <Textarea
                  id="rules"
                  value={newEvent.rules}
                  onChange={(e) => setNewEvent({ ...newEvent, rules: e.target.value })}
                  placeholder="Competition rules and guidelines..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Start Time</Label>
                  <Input
                    id="start"
                    type="datetime-local"
                    value={newEvent.start_time}
                    onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End Time</Label>
                  <Input
                    id="end"
                    type="datetime-local"
                    value={newEvent.end_time}
                    onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Event
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LiveScoreboard limit={10} />
            </div>
            <div>
              {selectedEvent && (
                <AdminEventTimer event={selectedEvent} onUpdate={fetchEvents} />
              )}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Events List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-display font-bold text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Events
              </h2>
              
              {events.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-display font-semibold text-lg mb-2">No Events Yet</h3>
                  <p className="text-muted-foreground">
                    Create your first event to get started.
                  </p>
                </div>
              ) : (
                events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`glass-card p-6 cursor-pointer transition-all ${
                      selectedEvent?.id === event.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-display font-semibold text-lg">{event.title}</h3>
                        <p className={`text-sm capitalize ${getStatusColor(event.status)}`}>
                          {event.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant={event.submissions_locked ? 'destructive' : 'outline'}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubmissions(event.id, !event.submissions_locked);
                          }}
                          title={event.submissions_locked ? 'Unlock Submissions' : 'Lock Submissions'}
                        >
                          {event.submissions_locked ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <p className="text-muted-foreground text-sm mb-4">
                      {event.description || 'No description'}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {event.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateEventStatus(event.id, 'registration');
                          }}
                        >
                          Open Registration
                        </Button>
                      )}
                      {event.status === 'registration' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateEventStatus(event.id, 'active');
                          }}
                        >
                          <Play className="h-4 w-4" />
                          Start Event
                        </Button>
                      )}
                      {event.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateEventStatus(event.id, 'paused');
                            }}
                          >
                            <Pause className="h-4 w-4" />
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateEventStatus(event.id, 'completed');
                            }}
                          >
                            <Square className="h-4 w-4" />
                            End Event
                          </Button>
                        </>
                      )}
                      {event.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateEventStatus(event.id, 'active');
                          }}
                        >
                          <Play className="h-4 w-4" />
                          Resume
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <LiveScoreboard limit={5} />
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

        {activeTab === 'timer' && selectedEvent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdminEventTimer event={selectedEvent} onUpdate={fetchEvents} />
            <div className="glass-card p-6">
              <h3 className="font-display font-bold text-lg mb-4">Select Event</h3>
              <div className="space-y-2">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedEvent?.id === event.id
                        ? 'bg-primary/20 border border-primary/30'
                        : 'bg-muted/30 border border-border/50 hover:border-primary/30'
                    }`}
                  >
                    <p className="font-semibold">{event.title}</p>
                    <p className={`text-sm capitalize ${getStatusColor(event.status)}`}>
                      {event.status}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

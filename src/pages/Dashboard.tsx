import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { API_BASE } from '@/integrations/mongo/client';
import { Navbar } from '@/components/Navbar';
import { ParticleBackground } from '@/components/ParticleBackground';
import { LiveScoreboard } from '@/components/LiveScoreboard';
import { EventTimer } from '@/components/EventTimer';
import { ApiSubmissionForm } from '@/components/ApiSubmissionForm';
import { LeaderboardGraph } from '@/components/LeaderboardGraph';
import { ShortlistStatusCard } from '@/components/ShortlistStatusCard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import EventDetails from '@/components/EventDetails';
import { Button } from '@/components/ui/button';
import { TeamDetailSection } from '@/components/TeamDetailSection';
import { EventRulesSection } from '@/components/EventRulesSection';
import {
  FileText,
  Code2,
  Trophy,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Loader2,
  Award,
  FlaskConical,
  Key,
  Swords,
} from 'lucide-react';
import { ApiTestSection } from '@/components/ApiTestSection';
import { TournamentParticipantView } from '@/components/TournamentParticipantView';

interface Event {
  id: string;
  _id?: string;
  title: string;
  description: string | null;
  problem_statement: string | null;
  rules: string | null;
  api_contract: string | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
  submissions_locked: boolean;
}

interface Team {
  id?: string;
  _id?: string;
  name: string;
  shortlist_status: string;
  dataset_name: string | null;
  dataset_description: string | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  profiles: {
    email: string;
    team_name: string | null;
  } | null;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentRound, setCurrentRound] = useState<any | null>(null);
  const [qualificationStatus, setQualificationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'submit' | 'scoreboard' | 'test' | 'settings' | 'tournament'>('overview');

  // Settings Tab State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          oldPassword,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to update password' });
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: 'Connection error. Please try again.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Keep track of data stringified to prevent unnecessary re-renders
  const lastDataRef = useRef<string>('');

  useEffect(() => {
    // Only redirect if explicitly not loading and no user
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
      // Poll for updates every 10 seconds (for shortlist status, event changes, etc.)
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchData = async () => {
    // Avoid setting loading=true on background polls to prevent UI flicker
    // We can use a ref or check if data exists to decide whether to show spinner

    try {
      // Only show loading spinner on INITIAL load (when no event/team data exists yet)
      if (!activeEvent && !userTeam) {
        setLoading(true);
        // Reset error on new fetch attempt
        setError(null);
      }

      // Fetch active event
      let newEvent = null;
      try {
        const eventRes = await fetch(`${API_BASE}/api/events?status=active`);
        if (eventRes.ok) {
          const events = await eventRes.json();
          if (events && events.length > 0) {
            const event = events[0];
            newEvent = {
              ...event,
              id: event.id || event._id || event._id?.toString?.()
            };
          }
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      }

      // Fetch user's team with full details
      let newTeam = null;
      let newMembers: TeamMember[] = [];

      if (user) {
        try {
          const teamMemberRes = await fetch(`${API_BASE}/api/team_members?user_id=${user.id}`);
          if (teamMemberRes.ok) {
            const teamMembersResp = await teamMemberRes.json();

            if (teamMembersResp && teamMembersResp.length > 0) {
              // Strict Check: Filter specifically for the logged in user
              // Use String() conversion to be sure about comparison
              const teamMembership = teamMembersResp.find((m: any) =>
                String(m.user_id) === String(user.id || user._id)
              );

              if (teamMembership) {
                const teamRes = await fetch(`${API_BASE}/api/teams/${teamMembership.team_id}`);
                if (teamRes.ok) {
                  const team = await teamRes.json();

                  // Normalise Mongo `_id` to `id` so downstream code is safe
                  newTeam = {
                    id: team.id || team._id || team._id?.toString?.(),
                    _id: team._id,
                    name: team.name,
                    shortlist_status: team.shortlist_status,
                    dataset_name: team.dataset_name ?? null,
                    dataset_description: team.dataset_description ?? null,
                  };

                  // Fetch all team members for this team
                  const allMembersRes = await fetch(
                    `${API_BASE}/api/team_members?team_id=${newTeam.id || newTeam._id}`
                  );
                  if (allMembersRes.ok) {
                    newMembers = await allMembersRes.json();
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error('Error fetching team data:', err);
        }
        // Fetch tournament rounds
        try {
          const roundsRes = await fetch(`${API_BASE}/api/tournament/rounds?event_id=${newEvent?.id || newEvent?._id || activeEvent?.id || activeEvent?._id}`);
          if (roundsRes.ok) {
            const rounds = await roundsRes.json();
            // Find the active round (running) or the next pending one
            const active = rounds.find((r: any) => r.status === 'running') ||
              rounds.find((r: any) => r.status === 'pending') ||
              rounds[rounds.length - 1];
            setCurrentRound(active ? { number: active.round_number, status: active.status, title: `Round ${active.round_number}` } : null);
          }
        } catch (err) {
          console.error('Error fetching tournament rounds:', err);
        }

        // Fetch leaderboard for qualification status
        if (newTeam && (newEvent?.id || newEvent?._id || activeEvent?.id || activeEvent?._id)) {
          try {
            const token = localStorage.getItem('ai_arena_token');
            const leaderboardRes = await fetch(`${API_BASE}/api/tournament/leaderboard?event_id=${newEvent?.id || newEvent?._id || activeEvent?.id || activeEvent?._id}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (leaderboardRes.ok) {
              const leaderboard = await leaderboardRes.json();
              // Check if leaderboard is an array (public) or object (hidden)
              if (Array.isArray(leaderboard)) {
                const myEntry = leaderboard.find((e: any) => e.team_id === (newTeam.id || newTeam._id));
                if (myEntry) {
                  setQualificationStatus(myEntry.status === 'eliminated' ? 'Eliminated' : 'Qualified');
                }
              }
            }
          } catch (err) {
            console.error('Error fetching leaderboard for status:', err);
          }
        }

        // Compare new data with current state to avoid re-renders
        const currentDataString = JSON.stringify({ event: newEvent, team: newTeam, members: newMembers });
        if (currentDataString !== lastDataRef.current) {
          console.log('Dashboard data updated');
          setActiveEvent(newEvent);
          setUserTeam(newTeam);
          setTeamMembers(newMembers);
          lastDataRef.current = currentDataString;
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Only set error if we don't have partial data to show
      if (!activeEvent && !userTeam) {
        setError(error instanceof Error ? error.message : 'Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (loading && !activeEvent && !userTeam)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
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
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'tournament', label: 'Tournament', icon: Swords },
    { id: 'test', label: 'Test API', icon: FlaskConical },
    { id: 'submit', label: 'Submit API', icon: Code2 },
    { id: 'scoreboard', label: 'Scoreboard', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: Key },
  ];

  const getShortlistStatus = (): 'shortlisted' | 'not_shortlisted' | 'pending' => {
    if (!userTeam) return 'pending';
    switch (userTeam.shortlist_status) {
      case 'shortlisted': return 'shortlisted';
      case 'not_shortlisted': return 'not_shortlisted';
      default: return 'pending';
    }
  };

  const shortlistStatus = getShortlistStatus();

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Navbar />

      <main className="container mx-auto px-4 pt-20 pb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              Participant Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage your competition entry
            </p>
          </div>

          {/* Tabs - Centered or Right aligned on desktop for better space usage */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className="flex items-center gap-2 h-9"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Status Cards - Compact Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Team Shortlist Status - Prominent if decided */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`glass-card p-3 flex items-center gap-3 col-span-2 md:col-span-1 ${shortlistStatus === 'shortlisted' ? 'border-success/50 bg-success/5' :
              shortlistStatus === 'not_shortlisted' ? 'border-destructive/50 bg-destructive/5' : ''
              }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${shortlistStatus === 'shortlisted' ? 'bg-success/10 text-success' :
              shortlistStatus === 'not_shortlisted' ? 'bg-destructive/10 text-destructive' :
                'bg-warning/10 text-warning'
              }`}>
              <Award className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-muted-foreground truncate">Shortlist Status</p>
              <p className={`font-display font-semibold capitalize truncate ${shortlistStatus === 'shortlisted' ? 'text-success' :
                shortlistStatus === 'not_shortlisted' ? 'text-destructive' :
                  'text-warning'
                }`}>
                {shortlistStatus.replace('_', ' ')}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-3 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-muted-foreground truncate">Team</p>
              <p className="font-display font-semibold truncate">
                {userTeam?.name || 'No team'}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-3 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-muted-foreground truncate">Event</p>
              <p className="font-display font-semibold capitalize truncate">
                {activeEvent?.status || 'Inactive'}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-3 flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${userTeam ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              }`}>
              {userTeam ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-muted-foreground truncate">Action</p>
              <p className="font-display font-semibold truncate">
                {userTeam ? 'Ready' : 'Join Team'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <ErrorBoundary name="Overview Tab">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-6">
                {userTeam && (
                  <TeamDetailSection team={userTeam} members={teamMembers} />
                )}


                {/* Tournament Status moved to dedicated tab */}
              </div>

              <div className="space-y-6">
                {/* Shortlist Detailed Card - Visible if there is a status update */}
                {userTeam && shortlistStatus !== 'pending' && (
                  <ShortlistStatusCard
                    status={shortlistStatus}
                    teamName={userTeam.name}
                  />
                )}

                {activeEvent && (
                  <EventTimer
                    startTime={activeEvent.start_time || new Date().toISOString()}
                    endTime={activeEvent.end_time || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}
                    status={activeEvent.status}
                  />
                )}
                <ErrorBoundary name="Mini Scoreboard">
                  <LiveScoreboard eventId={activeEvent?.id} limit={10} />
                </ErrorBoundary>
              </div>

              {/* [MOVED] Full Width Event Details */}
              <div className="col-span-1 lg:col-span-3">
                {activeEvent ? (
                  <EventDetails
                    event={activeEvent}
                    currentRound={currentRound}
                    qualificationStatus={qualificationStatus}
                  />
                ) : (
                  <div className="glass-card p-8 text-center">
                    <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <h3 className="font-display font-semibold text-lg mb-1">No Active Event</h3>
                    <p className="text-muted-foreground text-sm">
                      Check back later for upcoming competitions.
                    </p>
                  </div>
                )}
              </div>

              {/* Full Width Rules Section */}
              <div className="col-span-1 lg:col-span-3 mt-6">
                {activeEvent && <EventRulesSection />}
              </div>
            </motion.div>
          </ErrorBoundary>
        )}

        {activeTab === 'tournament' && (
          <ErrorBoundary name="Tournament Tab">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              {(userTeam && (userTeam.id || userTeam._id)) && (activeEvent && (activeEvent.id || activeEvent._id)) ? (
                <TournamentParticipantView
                  teamId={userTeam.id || userTeam._id}
                  eventId={activeEvent.id || activeEvent._id}
                  teamName={userTeam.name}
                />
              ) : (
                <div className="glass-card p-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-display font-semibold text-lg mb-2">
                    {!userTeam ? 'Join a Team First' : 'No Active Event'}
                  </h3>
                  <p className="text-muted-foreground">
                    Participate in the tournament to see your progress here.
                  </p>
                </div>
              )}
            </motion.div>
          </ErrorBoundary>
        )}

        {activeTab === 'test' && (
          <ErrorBoundary name="Test Tab">
            <ApiTestSection />
          </ErrorBoundary>
        )}

        {activeTab === 'submit' && (
          <ErrorBoundary name="Submission Tab">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2">
                {(userTeam && (userTeam.id || userTeam._id)) && (activeEvent && (activeEvent.id || activeEvent._id)) ? (
                  <ApiSubmissionForm
                    teamId={userTeam.id || userTeam._id}
                    eventId={activeEvent.id || activeEvent._id}
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
            </motion.div>
          </ErrorBoundary>
        )}

        {activeTab === 'scoreboard' && (
          <ErrorBoundary name="Scoreboard Tab">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {activeEvent && (
                <>
                  {/* <ErrorBoundary name="Leaderboard Graph">
                    <LeaderboardGraph eventId={activeEvent.id || activeEvent._id} />
                  </ErrorBoundary> */}
                  <LiveScoreboard eventId={activeEvent.id || activeEvent._id} limit={20} />
                </>
              )}
            </motion.div>
          </ErrorBoundary>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <ErrorBoundary name="Settings Tab">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto"
            >
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Key className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl">Change Password</h2>
                    <p className="text-sm text-muted-foreground">Update your login credentials</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Password</label>
                    <input
                      type="password"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <input
                      type="password"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <input
                      type="password"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  {passwordMessage && (
                    <div className={`p-3 rounded-md text-sm ${passwordMessage.type === 'success'
                      ? 'bg-success/10 text-success border border-success/20'
                      : 'bg-destructive/10 text-destructive border border-destructive/20'
                      }`}>
                      {passwordMessage.text}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </ErrorBoundary>
        )}
      </main>
    </div >
  );
}

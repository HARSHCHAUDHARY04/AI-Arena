import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { ParticleBackground } from '@/components/ParticleBackground';
import { LiveScoreboard } from '@/components/LiveScoreboard';
import { EventTimer } from '@/components/EventTimer';
import { ApiSubmissionForm } from '@/components/ApiSubmissionForm';
import { AnnouncementListener } from '@/components/AnnouncementListener';
import { LeaderboardGraph } from '@/components/LeaderboardGraph';
import { ShortlistStatusCard } from '@/components/ShortlistStatusCard';
import EventDetails from '@/components/EventDetails';
import { Button } from '@/components/ui/button';
import { TeamDetailSection } from '@/components/TeamDetailSection';
import { EventRulesSection } from '@/components/EventRulesSection';
import db from '@/integrations/mongo/client';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'submit' | 'scoreboard'>('overview');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
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
      }


      // Fetch active event
      try {
        const eventRes = await fetch(`http://localhost:4000/api/events?status=active`);
        if (eventRes.ok) {
          const events = await eventRes.json();
          console.log('Events:', events);
          if (events && events.length > 0) {
            setActiveEvent(events[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      }

      // Fetch user's team with full details
      if (user) {
        try {
          const teamMemberRes = await fetch(`http://localhost:4000/api/team_members?user_id=${user.id}`);
          if (teamMemberRes.ok) {
            const teamMembersResp = await teamMemberRes.json();
            console.log('Team members:', teamMembersResp);

            if (teamMembersResp && teamMembersResp.length > 0) {
              const teamMembership = teamMembersResp[0];

              const teamRes = await fetch(`http://localhost:4000/api/teams/${teamMembership.team_id}`);
              if (teamRes.ok) {
                const team = await teamRes.json();
                console.log('Team:', team);

                // Normalise Mongo `_id` to `id` so downstream code is safe
                const normalisedTeam: Team = {
                  id: team.id || team._id || team._id?.toString?.(),
                  _id: team._id,
                  name: team.name,
                  shortlist_status: team.shortlist_status,
                  dataset_name: team.dataset_name ?? null,
                  dataset_description: team.dataset_description ?? null,
                };

                setUserTeam(normalisedTeam);

                // Fetch all team members for this team
                const allMembersRes = await fetch(
                  `http://localhost:4000/api/team_members?team_id=${normalisedTeam.id || normalisedTeam._id}`
                );
                if (allMembersRes.ok) {
                  const members = await allMembersRes.json();
                  setTeamMembers(members);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error fetching team data:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
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
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'submit', label: 'Submit API', icon: Code2 },
    { id: 'scoreboard', label: 'Scoreboard', icon: Trophy },
  ];

  const getShortlistStatus = (): 'shortlisted' | 'not_shortlisted' | 'pending' => {
    if (!userTeam) return 'pending';
    switch (userTeam.shortlist_status) {
      case 'shortlisted': return 'shortlisted';
      case 'not_shortlisted': return 'not_shortlisted';
      default: return 'pending';
    }
  };

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Navbar />
      <AnnouncementListener />

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

        {/* Team Info & Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${userTeam ? 'bg-success/10' : 'bg-warning/10'
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

          {/* Shortlist Status Mini Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`glass-card p-4 flex items-center gap-4 ${getShortlistStatus() === 'shortlisted'
              ? 'border-success/30'
              : getShortlistStatus() === 'not_shortlisted'
                ? 'border-destructive/30'
                : 'border-warning/30'
              }`}
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getShortlistStatus() === 'shortlisted'
              ? 'bg-success/10'
              : getShortlistStatus() === 'not_shortlisted'
                ? 'bg-destructive/10'
                : 'bg-warning/10'
              }`}>
              <Award className={`h-6 w-6 ${getShortlistStatus() === 'shortlisted'
                ? 'text-success'
                : getShortlistStatus() === 'not_shortlisted'
                  ? 'text-destructive'
                  : 'text-warning'
                }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shortlist</p>
              <p className={`font-display font-semibold capitalize ${getShortlistStatus() === 'shortlisted'
                ? 'text-success'
                : getShortlistStatus() === 'not_shortlisted'
                  ? 'text-destructive'
                  : 'text-warning'
                }`}>
                {getShortlistStatus().replace('_', ' ')}
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
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {userTeam && (
                  <TeamDetailSection />
                )}

                {/* Event Coming Soon / Event Details */}
                {activeEvent ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <EventDetails
                      event={activeEvent}
                      currentRound={currentRound}
                      qualificationStatus={qualificationStatus}
                    />
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
                {/* Shortlist Status Card */}
                {userTeam && (
                  <ShortlistStatusCard
                    status={getShortlistStatus()}
                    teamName={userTeam.name}
                  />
                )}

                {activeEvent && (
                  <EventTimer
                    startTime={activeEvent.start_time}
                    endTime={activeEvent.end_time}
                    status={activeEvent.status}
                  />
                )}
                <LiveScoreboard eventId={activeEvent?.id} limit={5} />
              </div>
            </div>

            {/* Full Width Rules Section */}
            {activeEvent && (
              <EventRulesSection />
            )}
          </motion.div>
        )}

        {activeTab === 'submit' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
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
          </motion.div>
        )}

        {activeTab === 'scoreboard' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-3 space-y-6">
              {activeEvent && <LeaderboardGraph eventId={activeEvent.id} />}
              <LiveScoreboard eventId={activeEvent?.id} limit={20} />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

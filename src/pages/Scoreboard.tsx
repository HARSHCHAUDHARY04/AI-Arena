import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { ParticleBackground } from '@/components/ParticleBackground';
import { EventTimer } from '@/components/EventTimer';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, 
  Medal, 
  Target,
  Clock,
  Shield,
  TrendingUp,
  Users
} from 'lucide-react';

interface ScoreEntry {
  id: string;
  team_id: string;
  team_name: string;
  total_score: number;
  accuracy_score: number;
  latency_score: number;
  stability_score: number;
  rank: number;
}

interface Event {
  id: string;
  title: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
}

export default function Scoreboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    // Set up realtime subscription
    const channel = supabase
      .channel('scoreboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
        },
        () => {
          fetchScores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch active event
      const { data: events } = await supabase
        .from('events')
        .select('id, title, status, start_time, end_time')
        .in('status', ['active', 'paused', 'registration'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (events && events.length > 0) {
        setActiveEvent(events[0]);
      }

      await fetchScores();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScores = async () => {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select(`
          id,
          team_id,
          total_score,
          accuracy_score,
          latency_score,
          stability_score,
          teams!inner(name)
        `)
        .order('total_score', { ascending: false });

      if (error) throw error;

      const formattedScores: ScoreEntry[] = (data || []).map((score, index) => ({
        id: score.id,
        team_id: score.team_id,
        team_name: (score.teams as { name: string })?.name || 'Unknown Team',
        total_score: Number(score.total_score),
        accuracy_score: Number(score.accuracy_score),
        latency_score: Number(score.latency_score),
        stability_score: Number(score.stability_score),
        rank: index + 1,
      }));

      setScores(formattedScores);
    } catch (error) {
      console.error('Error fetching scores:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="relative">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <div className="absolute inset-0 blur-lg bg-yellow-400/50" />
          </div>
        );
      case 2:
        return <Medal className="h-7 w-7 text-gray-300" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <span className="font-display text-xl font-bold text-muted-foreground">
            {rank}
          </span>
        );
    }
  };

  const getRankStyles = (rank: number) => {
    switch (rank) {
      case 1:
        return 'border-yellow-400/50 bg-gradient-to-r from-yellow-400/10 to-transparent';
      case 2:
        return 'border-gray-300/50 bg-gradient-to-r from-gray-300/10 to-transparent';
      case 3:
        return 'border-amber-600/50 bg-gradient-to-r from-amber-600/10 to-transparent';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-4">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-primary font-medium">Live Rankings</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-gradient">LEADERBOARD</span>
          </h1>
          {activeEvent && (
            <p className="text-muted-foreground text-lg">
              {activeEvent.title}
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Scoreboard */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="glass-card p-12 text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading scores...</p>
              </div>
            ) : scores.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="font-display font-semibold text-xl mb-2">No Scores Yet</h3>
                <p className="text-muted-foreground">
                  The competition hasn't started or no teams have been evaluated yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Table Header */}
                <div className="glass-card p-4 hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-4">Team</div>
                  <div className="col-span-2 text-center">
                    <Target className="h-4 w-4 inline mr-1" />
                    Accuracy
                  </div>
                  <div className="col-span-2 text-center">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Latency
                  </div>
                  <div className="col-span-2 text-center">
                    <Shield className="h-4 w-4 inline mr-1" />
                    Stability
                  </div>
                  <div className="col-span-1 text-right">Total</div>
                </div>

                {scores.map((score, index) => (
                  <motion.div
                    key={score.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`glass-card p-4 grid grid-cols-12 gap-4 items-center hover:border-primary/30 transition-all ${getRankStyles(score.rank)}`}
                  >
                    <div className="col-span-1 flex justify-center">
                      {getRankIcon(score.rank)}
                    </div>
                    <div className="col-span-11 md:col-span-4">
                      <p className="font-display font-semibold text-lg truncate">
                        {score.team_name}
                      </p>
                      <div className="md:hidden flex gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-primary">
                          <Target className="h-3 w-3" />
                          {score.accuracy_score.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-1 text-accent">
                          <Clock className="h-3 w-3" />
                          {score.latency_score.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-1 text-success">
                          <Shield className="h-3 w-3" />
                          {score.stability_score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="hidden md:flex col-span-2 justify-center">
                      <div className="text-center">
                        <span className="score-display text-lg">{score.accuracy_score.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="hidden md:flex col-span-2 justify-center">
                      <div className="text-center">
                        <span className="font-display text-lg text-accent">{score.latency_score.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="hidden md:flex col-span-2 justify-center">
                      <div className="text-center">
                        <span className="font-display text-lg text-success">{score.stability_score.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="hidden md:block col-span-1 text-right">
                      <span className="score-display text-2xl">{score.total_score.toFixed(0)}</span>
                    </div>
                    <div className="md:hidden col-span-12 flex justify-end mt-2">
                      <span className="score-display text-3xl">{score.total_score.toFixed(0)}</span>
                      <span className="text-muted-foreground ml-1 self-end mb-1">pts</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {activeEvent && (
              <EventTimer
                startTime={activeEvent.start_time}
                endTime={activeEvent.end_time}
                status={activeEvent.status}
              />
            )}

            {/* Scoring Info */}
            <div className="glass-card p-6">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Scoring Breakdown
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Accuracy</p>
                    <p className="text-muted-foreground text-xs">Model prediction correctness</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Latency</p>
                    <p className="text-muted-foreground text-xs">Response time performance</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">Stability</p>
                    <p className="text-muted-foreground text-xs">Uptime & error rate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Teams Count */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Competing Teams</p>
                  <p className="font-display text-2xl font-bold">{scores.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

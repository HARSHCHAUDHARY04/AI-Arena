import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import db from '@/integrations/mongo/client';
import {
  Trophy,
  Medal,
  TrendingUp,
  Zap,
  Clock,
  Target,
  Shield
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

interface LiveScoreboardProps {
  eventId?: string;
  limit?: number;
}

export function LiveScoreboard({ eventId, limit = 10 }: LiveScoreboardProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores();
    // Simple polling to mimic "live" updates without realtime channels
    const intervalId = setInterval(fetchScores, 10000);
    return () => clearInterval(intervalId);
  }, [eventId]);

  const fetchScores = async () => {
    try {
      let query = db
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
        .order('total_score', { ascending: false })
        .limit(limit);

      if (eventId) {
        query = query.eq('event_id', eventId);
      } else {
        // If no event ID, we technically shouldn't fetch specific event scores, 
        // but if the user wants global scores, we can omit this.
        // However, the crash likely happens if we try to filter by undefined.
        // The safe bet is: if eventId is passed but null, don't run.
        // But the prop says eventId?: string.
      }

      const { data, error } = await query;

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
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-300" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-muted-foreground font-display">{rank}</span>;
    }
  };

  const getRankStyles = (rank: number) => {
    switch (rank) {
      case 1:
        return 'border-yellow-400/50 bg-yellow-400/5';
      case 2:
        return 'border-gray-300/50 bg-gray-300/5';
      case 3:
        return 'border-amber-600/50 bg-amber-600/5';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-6 w-6 text-primary" />
          <h2 className="font-display font-bold text-xl">Live Scoreboard</h2>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-6 w-6 text-primary" />
          <h2 className="font-display font-bold text-xl">Live Scoreboard</h2>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No scores yet. Competition hasn't started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-primary" />
          <h2 className="font-display font-bold text-xl">Live Scoreboard</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-success">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Real-time
        </div>
      </div>

      {/* Score Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Target className="h-3 w-3 text-primary" />
          Accuracy
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-accent" />
          Latency
        </div>
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3 text-success" />
          Stability
        </div>
      </div>

      <div className="space-y-2">
        {scores.map((score, index) => (
          <motion.div
            key={score.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors ${getRankStyles(score.rank)}`}
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(score.rank)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold text-foreground truncate">
                {score.team_name}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-primary" />
                  {score.accuracy_score.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-accent" />
                  {score.latency_score.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-success" />
                  {score.stability_score.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="score-display text-2xl">
                {score.total_score.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">points</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

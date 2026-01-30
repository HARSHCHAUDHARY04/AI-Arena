import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { API_BASE } from '@/integrations/mongo/client';
import {
  Trophy,
  Crown,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LeaderboardEntry {
  _id: string;
  team_id: string;
  team_name: string;
  total_score: number;
  points?: number;
  wins: number;
  losses: number;
  draws: number;
  status: 'active' | 'eliminated';
}

interface LiveScoreboardProps {
  eventId?: string;
  limit?: number;
}

export function LiveScoreboard({ eventId, limit = 10 }: LiveScoreboardProps) {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEventId, setCurrentEventId] = useState<string | undefined>(eventId);

  useEffect(() => {
    const initialize = async () => {
      let targetEventId = eventId;
      
      if (!targetEventId) {
        try {
          const res = await fetch(`${API_BASE}/api/events`);
          if (res.ok) {
            const events = await res.json();
            // Prefer active event, otherwise take the most recent one
            const active = events.find((e: any) => e.status === 'active') || events[0];
            if (active) {
              targetEventId = active._id || active.id;
            }
          }
        } catch (error) {
          console.error('Failed to fetch events:', error);
        }
      }

      setCurrentEventId(targetEventId);
      
      if (targetEventId) {
        fetchScores(targetEventId);
      } else {
        setLoading(false);
      }
    };

    initialize();
  }, [eventId]);

  useEffect(() => {
    if (!currentEventId) return;
    
    const intervalId = setInterval(() => fetchScores(currentEventId), 10000);
    return () => clearInterval(intervalId);
  }, [currentEventId]);

  const fetchScores = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/tournament/leaderboard?event_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setScores(data.slice(0, limit));
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-6 w-6 text-primary" />
          <h2 className="font-display font-bold text-xl">Tournament Standings</h2>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Crown className="h-5 w-5 text-accent" />
          </div>
          <h2 className="font-display font-bold text-xl">Tournament Standings</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-success">
          <TrendingUp className="h-3 w-3" />
          Live
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
            <tr>
              <th className="px-4 py-3 rounded-l-lg">Rank</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3 text-center">Points</th>
              <th className="px-4 py-3 text-center">W-L-D</th>
              <th className="px-4 py-3 rounded-r-lg text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {scores.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-8 w-8 opacity-50" />
                    <p>No tournament data available yet.</p>
                  </div>
                </td>
              </tr>
            ) : (
              scores.map((team, index) => (
                <motion.tr
                  key={team._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/5"
                >
                  <td className="px-4 py-3 font-medium">
                    {index === 0 ? (
                      <Crown className="h-4 w-4 text-warning fill-warning/20" />
                    ) : (
                      <span className="ml-1 text-muted-foreground">
                        #{index + 1}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {team.team_name}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-primary font-bold">
                    {team.points ?? (team.wins * 2 + team.draws)}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    <span className="text-success">{team.wins}</span> -
                    <span className="text-destructive">{team.losses}</span> -
                    <span className="text-warning">{team.draws}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge
                      variant="outline"
                      className={team.status === 'active'
                        ? 'text-success border-success/30'
                        : 'text-muted-foreground'
                      }
                    >
                      {team.status.toUpperCase()}
                    </Badge>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

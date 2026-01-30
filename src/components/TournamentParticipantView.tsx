import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy,
    Crown,
    Loader2,
    TrendingUp,
    AlertCircle,
    Swords,
    History,
    Lock,
    Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { API_BASE } from '@/integrations/mongo/client';

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

interface RoundHistoryEntry {
    round: number;
    result: 'win' | 'loss' | 'draw';
    score: number;
    opponent_score: number;
    opponent: string;
    verdict: string | null;
    points?: number;
}

interface TournamentParticipantViewProps {
    teamId: string;
    eventId: string;
    teamName: string;
}

export function TournamentParticipantView({
    teamId,
    eventId,
    teamName
}: TournamentParticipantViewProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isHidden, setIsHidden] = useState(false);
    const [loading, setLoading] = useState(true);
    const [myRank, setMyRank] = useState<number>(0);
    const [myMatch, setMyMatch] = useState<any | null>(null);
    const [loadingMatch, setLoadingMatch] = useState(false);
    const [history, setHistory] = useState<RoundHistoryEntry[]>([]);

    const fetchLeaderboard = useCallback(async () => {
        try {
            const token = localStorage.getItem('ai_arena_token');
            const res = await fetch(
                `${API_BASE}/api/tournament/leaderboard?event_id=${eventId}`,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            if (res.ok) {
                const data = await res.json();
                if (data.hidden) {
                    setIsHidden(true);
                    setLeaderboard([]);
                } else {
                    setIsHidden(false);
                    setLeaderboard(data);

                    // Find user's rank
                    const rank = data.findIndex((entry: LeaderboardEntry) =>
                        entry.team_id === teamId
                    );
                    setMyRank(rank + 1); // Convert to 1-indexed
                }
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setLoading(false);
        }
    }, [eventId, teamId]);

    const fetchMyMatch = useCallback(async () => {
        setLoadingMatch(true);
        try {
            // Find current active round first
            const roundsRes = await fetch(`${API_BASE}/api/tournament/rounds?event_id=${eventId}`);
            if (roundsRes.ok) {
                const rounds = await roundsRes.json();
                const currentRound = rounds.find((r: any) => r.status === 'running') ||
                    rounds.find((r: any) => r.status === 'pending') ||
                    rounds[rounds.length - 1];

                if (currentRound) {
                    const matchesRes = await fetch(
                        `${API_BASE}/api/tournament/rounds/${currentRound.round_number}/matches?event_id=${eventId}`
                    );
                    if (matchesRes.ok) {
                        const matches = await matchesRes.json();
                        const match = matches.find((m: any) =>
                            m.team_a_id === teamId || m.team_b_id === teamId
                        );
                        setMyMatch(match ? { ...match, round_number: currentRound.round_number } : null);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch my match:', error);
        } finally {
            setLoadingMatch(false);
        }
    }, [eventId, teamId]);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/tournament/team-progress/${teamId}?event_id=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.round_history) {
                    setHistory(data.round_history.sort((a: any, b: any) => b.round - a.round));
                }
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    }, [eventId, teamId]);

    useEffect(() => {
        fetchLeaderboard();
        fetchMyMatch();
        fetchHistory();
        // Poll for updates every 10 seconds
        const interval = setInterval(() => {
            fetchLeaderboard();
            fetchMyMatch();
            fetchHistory();
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchLeaderboard, fetchMyMatch, fetchHistory]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isHidden) {
        return (
            <div className="glass-card p-12 text-center">
                <div className="flex flex-col items-center justify-center gap-6">
                    <div className="p-6 rounded-full bg-warning/10 border border-warning/20">
                        <Lock className="h-12 w-12 text-warning animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-display font-bold text-2xl text-foreground">Scoreboard Awaiting Approval</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            The final standings and pairings are currently being reviewed by the tournament organizers.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full">
                        <Eye className="h-4 w-4" />
                        <span>Visible only to organizers</span>
                    </div>
                </div>
            </div>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <div className="glass-card p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg mb-2">
                    Tournament has not started yet.
                </p>
                <p className="text-sm text-muted-foreground">
                    Check back once the admin initializes the tournament.
                </p>
            </div>
        );
    }

    const myTeam = leaderboard.find(entry => entry.team_id === teamId);

    return (
        <div className="space-y-6">
            {/* Your Position Card */}
            {myTeam && myRank > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 bg-primary/5 ring-2 ring-primary"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-primary/10">
                                <Trophy className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Your Position</p>
                                <h3 className="font-display font-bold text-2xl flex items-center gap-2">
                                    {myRank === 1 && <Crown className="h-6 w-6 text-warning fill-warning/20" />}
                                    <span>#{myRank}</span>
                                </h3>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Score</p>
                            <p className="font-mono font-bold text-3xl text-primary">{myTeam.points ?? (myTeam.wins * 2 + myTeam.draws)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-success">{myTeam.wins}</p>
                            <p className="text-xs text-muted-foreground uppercase">Wins</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-destructive">{myTeam.losses}</p>
                            <p className="text-xs text-muted-foreground uppercase">Losses</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-warning">{myTeam.draws}</p>
                            <p className="text-xs text-muted-foreground uppercase">Draws</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Your Battle Card */}
            {myMatch ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass-card p-6 border-l-4 ${myMatch.status === 'completed'
                        ? (myMatch.result === (myMatch.team_a_id === teamId ? 'team_a_win' : 'team_b_win') ? 'border-success bg-success/5' : 'border-destructive bg-destructive/5')
                        : myMatch.status === 'running' ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Swords className="h-5 w-5 text-primary" />
                            <h3 className="font-display font-bold text-lg">Your Round {myMatch.round_number} Battle</h3>
                        </div>
                        <Badge variant={myMatch.status === 'completed' ? 'default' : 'outline'}
                            className={myMatch.status === 'running' ? 'animate-pulse' : ''}>
                            {myMatch.status.toUpperCase()}
                        </Badge>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border-2 border-primary/30">
                                <span className="text-xl font-bold">{myMatch.team_a_name.substring(0, 2).toUpperCase()}</span>
                            </div>
                            <span className={`font-bold ${myMatch.team_a_id === teamId ? 'text-primary' : ''}`}>
                                {myMatch.team_a_name} {myMatch.team_a_id === teamId && '(You)'}
                            </span>
                            {myMatch.status === 'completed' && (
                                <span className="text-2xl font-display font-bold">{myMatch.score_a}</span>
                            )}
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-muted-foreground font-bold italic">VS</span>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border-2 border-blue-500/30">
                                <span className="text-xl font-bold">{(myMatch.team_b_name || 'BY').substring(0, 2).toUpperCase()}</span>
                            </div>
                            <span className={`font-bold ${myMatch.team_b_id === teamId ? 'text-primary' : ''}`}>
                                {myMatch.team_b_name || 'BYE'} {myMatch.team_b_id === teamId && '(You)'}
                            </span>
                            {myMatch.status === 'completed' && (
                                <span className="text-2xl font-display font-bold">{myMatch.score_b}</span>
                            )}
                        </div>
                    </div>

                    {myMatch.verdict && (
                        <div className="mt-4 p-4 rounded-lg bg-card/50 border border-border/50 text-sm italic text-muted-foreground">
                            <p className="font-semibold mb-1 text-foreground not-italic">Judge Verdict:</p>
                            {myMatch.verdict}
                        </div>
                    )}
                </motion.div>
            ) : !loading && (
                <div className="glass-card p-6 text-center text-muted-foreground">
                    <p>No pairing found for you in the current round.</p>
                </div>
            )}

            {/* Match History */}
            {history.length > 0 && (
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <History className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-display font-bold text-lg">Match History</h3>
                    </div>

                    <div className="space-y-3">
                        {history.map((round) => (
                            <motion.div
                                key={round.round}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col md:flex-row items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30 gap-4"
                            >
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground shrink-0">
                                        R{round.round}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold flex items-center gap-2">
                                            vs {round.opponent}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                    <Badge variant={
                                        round.result === 'win' ? 'default' :
                                            round.result === 'loss' ? 'destructive' : 'secondary'
                                    } className={
                                        round.result === 'win' ? 'bg-success hover:bg-success/80' : ''
                                    }>
                                        {round.result.toUpperCase()}
                                    </Badge>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Full Leaderboard */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-accent/10">
                        <Crown className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="font-display font-bold text-lg">Tournament Standings</h3>
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
                            {leaderboard.map((team, index) => {
                                const isMyTeam = team.team_id === teamId;
                                return (
                                    <motion.tr
                                        key={team._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`border-b border-border/50 last:border-0 ${isMyTeam
                                            ? 'bg-primary/10 ring-2 ring-primary/30 ring-inset'
                                            : 'hover:bg-muted/5'
                                            }`}
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {index === 0 ? (
                                                <Crown className="h-4 w-4 text-warning fill-warning/20" />
                                            ) : (
                                                <span className={`ml-1 ${isMyTeam ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                                                    #{index + 1}
                                                </span>
                                            )}
                                        </td>
                                        <td className={`px-4 py-3 ${isMyTeam ? 'font-bold text-primary' : 'font-semibold'}`}>
                                            {team.team_name}
                                            {isMyTeam && (
                                                <span className="ml-2 text-xs text-primary">(You)</span>
                                            )}
                                        </td>
                                        <td className={`px-4 py-3 text-center font-mono ${isMyTeam ? 'text-primary font-bold' : 'text-foreground'}`}>
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" />
                        <span>Live standings updated every 10 seconds</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

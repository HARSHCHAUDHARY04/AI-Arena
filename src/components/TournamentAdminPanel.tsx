import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Play,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Users,
  CheckCircle,
  Clock,
  Loader2,
  Shuffle,
  AlertCircle,
  Swords,
  Crown,
  XCircle,
  Award,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/integrations/mongo/client";

interface TournamentRound {
  _id: string;
  round_number: number;
  status: "pending" | "running" | "completed";
  started_at: string | null;
  completed_at: string | null;
  match_stats: {
    total: number;
    completed: number;
    running: number;
  };
}

interface TournamentMatch {
  _id: string;
  round_number: number;
  team_a_id: string;
  team_b_id: string | null;
  team_a_name: string;
  team_b_name: string;
  score_a: number | null;
  score_b: number | null;
  result: "team_a_win" | "team_b_win" | "draw" | null;
  verdict: string | null;
  status: "waiting" | "running" | "completed";
}

interface TournamentAdminPanelProps {
  eventId: string;
}

export function TournamentAdminPanel({ eventId }: TournamentAdminPanelProps) {
  const { toast } = useToast();
  const [rounds, setRounds] = useState<TournamentRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const fetchRounds = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/tournament/rounds?event_id=${eventId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setRounds(data);
      }
    } catch (err) {
      console.error("Error fetching rounds:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchMatches = useCallback(
    async (roundNumber: number) => {
      setLoadingMatches(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/tournament/rounds/${roundNumber}/matches?event_id=${eventId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setMatches(data);
        }
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setLoadingMatches(false);
      }
    },
    [eventId],
  );

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/tournament/leaderboard?event_id=${eventId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  }, [eventId]);

  useEffect(() => {
    fetchRounds();
    fetchLeaderboard();
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchRounds();
      fetchLeaderboard();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchRounds, fetchLeaderboard]);

  useEffect(() => {
    if (selectedRound) {
      fetchMatches(selectedRound);
      // Poll matches every 3 seconds when round is running
      const round = rounds.find((r) => r.round_number === selectedRound);
      if (round?.status === "running") {
        const interval = setInterval(() => fetchMatches(selectedRound), 3000);
        return () => clearInterval(interval);
      }
    }
  }, [selectedRound, rounds, fetchMatches]);

  const initializeTournament = async () => {
    setActionLoading("init");
    try {
      const res = await fetch(`${API_BASE}/api/tournament/rounds/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Tournament Initialized", description: data.message });
        fetchRounds();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to initialize tournament",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const generateMatchups = async (roundNumber: number) => {
    setActionLoading(`generate-${roundNumber}`);
    try {
      const res = await fetch(
        `${API_BASE}/api/tournament/rounds/${roundNumber}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: eventId }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Matchups Generated", description: data.message });
        fetchMatches(roundNumber);
        fetchRounds();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate matchups",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const clearMatchups = async (roundNumber: number) => {
    setActionLoading(`clear-${roundNumber}`);
    try {
      const res = await fetch(
        `${API_BASE}/api/tournament/rounds/${roundNumber}/clear`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: eventId }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Matchups Cleared",
          description: data.message || "Matchups deleted successfully",
        });
        fetchMatches(roundNumber);
        fetchRounds();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to clear matchups",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const startRound = async (roundNumber: number) => {
    setActionLoading(`start-${roundNumber}`);
    try {
      const res = await fetch(
        `${API_BASE}/api/tournament/rounds/${roundNumber}/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: eventId }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Round Started", description: data.message });
        fetchRounds();
        fetchMatches(roundNumber);
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to start round",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/10 text-success border-success/30";
      case "running":
        return "bg-primary/10 text-primary border-primary/30";
      default:
        return "bg-muted/10 text-muted-foreground border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl">
              Tournament Control
            </h2>
            <p className="text-sm text-muted-foreground">
              5-round team vs team evaluation system
            </p>
          </div>
        </div>

        {rounds.length === 0 && (
          <Button
            onClick={initializeTournament}
            disabled={actionLoading === "init"}
          >
            {actionLoading === "init" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Initialize Tournament
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={fetchRounds}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Rounds Grid */}
      {rounds.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-display font-semibold text-lg mb-2">
            No Tournament Initialized
          </h3>
          <p className="text-muted-foreground mb-4">
            Click "Initialize Tournament" to create 5 rounds for this event.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {rounds.map((round) => (
            <motion.div
              key={round._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-card p-4 cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                selectedRound === round.round_number
                  ? "ring-2 ring-primary"
                  : ""
              } ${getStatusColor(round.status)}`}
              onClick={() =>
                setSelectedRound(
                  selectedRound === round.round_number
                    ? null
                    : round.round_number,
                )
              }
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-bold">
                  Round {round.round_number}
                </span>
                {getStatusIcon(round.status)}
              </div>

              <Badge
                variant="outline"
                className={`mb-3 ${getStatusColor(round.status)}`}
              >
                {round.status.toUpperCase()}
              </Badge>

              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Matches:</span>
                  <span>{round.match_stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span>
                    {round.match_stats.completed}/{round.match_stats.total}
                  </span>
                </div>
              </div>

              {/* Progress bar for running rounds */}
              {round.status === "running" && round.match_stats.total > 0 && (
                <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                      width: `${(round.match_stats.completed / round.match_stats.total) * 100}%`,
                    }}
                  />
                </div>
              )}

              {/* Quick Actions Footer */}
              {// Show Generate if: Pending AND (Round 1 OR Prev Round Completed) AND No Matches
              ((round.status === "pending" &&
                round.match_stats.total === 0 &&
                (round.round_number === 1 ||
                  rounds.find((r) => r.round_number === round.round_number - 1)
                    ?.status === "completed")) ||
                // Show Start if: Pending AND Has Matches
                (round.status === "pending" &&
                  round.match_stats.total > 0)) && (
                <div
                  className="mt-4 pt-4 border-t border-border/50 flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {round.match_stats.total === 0 ? (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => generateMatchups(round.round_number)}
                      disabled={
                        actionLoading === `generate-${round.round_number}`
                      }
                    >
                      {actionLoading === `generate-${round.round_number}` ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      ) : (
                        <Shuffle className="h-3 w-3 mr-2" />
                      )}
                      Generate
                    </Button>
                  ) : round.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => clearMatchups(round.round_number)}
                        disabled={
                          actionLoading === `clear-${round.round_number}`
                        }
                      >
                        {actionLoading === `clear-${round.round_number}` ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="h-3 w-3 mr-2" />
                        )}
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => startRound(round.round_number)}
                        disabled={
                          actionLoading === `start-${round.round_number}`
                        }
                      >
                        {actionLoading === `start-${round.round_number}` ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        ) : (
                          <Play className="h-3 w-3 mr-2" />
                        )}
                        Start Round
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => startRound(round.round_number)}
                      disabled={actionLoading === `start-${round.round_number}`}
                    >
                      {actionLoading === `start-${round.round_number}` ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      ) : (
                        <Play className="h-3 w-3 mr-2" />
                      )}
                      Start Round
                    </Button>
                  )}
                </div>
              )}

              <div className="mt-2 flex justify-center">
                {selectedRound === round.round_number ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Selected Round Details */}
      <AnimatePresence>
        {selectedRound && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-6 border-primary/20"
          >
            {(() => {
              const round = rounds.find(
                (r) => r.round_number === selectedRound,
              );
              if (!round) return null;

              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display font-bold text-lg flex items-center gap-2">
                      <Swords className="h-5 w-5 text-primary" />
                      Round {selectedRound} Matchups
                    </h3>

                    <div className="flex gap-2">
                      {round.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateMatchups(selectedRound)}
                            disabled={
                              actionLoading === `generate-${selectedRound}`
                            }
                          >
                            {actionLoading === `generate-${selectedRound}` ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Shuffle className="h-4 w-4 mr-2" />
                            )}
                            Generate Matchups
                          </Button>

                          {matches.length > 0 && (
                            <Button
                              size="sm"
                              onClick={() => startRound(selectedRound)}
                              disabled={
                                actionLoading === `start-${selectedRound}`
                              }
                            >
                              {actionLoading === `start-${selectedRound}` ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Play className="h-4 w-4 mr-2" />
                              )}
                              Approve & Start Round
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Matches List */}
                  {loadingMatches ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : matches.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No matchups generated yet.</p>
                      <p className="text-sm">
                        Click "Generate Matchups" to create random pairings.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {matches.map((match, idx) => (
                        <motion.div
                          key={match._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-5 rounded-xl border ${
                            match.status === "completed"
                              ? "bg-success/5 border-success/20"
                              : match.status === "running"
                                ? "bg-primary/5 border-primary/20"
                                : "bg-card/50 border-border"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* Teams and Score Config */}
                            <div className="flex-1 w-full grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                              {/* Team A */}
                              <div className="flex flex-col items-end gap-2 text-right">
                                <div className="flex items-center gap-2">
                                  {match.result === "team_a_win" && (
                                    <Crown className="h-5 w-5 text-warning fill-warning/20" />
                                  )}
                                  <span
                                    className={`font-semibold text-lg ${match.result === "team_a_win" ? "text-success" : ""}`}
                                  >
                                    {match.team_a_name}
                                  </span>
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-primary/30">
                                    <span className="font-bold text-xs text-primary">
                                      {match.team_a_name
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                {match.score_a !== null ? (
                                  <div className="flex flex-col items-end">
                                    <span className="text-3xl font-display font-bold">
                                      {match.score_a}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Score
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic text-sm">
                                    No score
                                  </span>
                                )}
                              </div>

                              {/* VS Badge */}
                              <div className="flex flex-col items-center">
                                <Badge
                                  variant="secondary"
                                  className="px-3 py-1 font-bold text-xs"
                                >
                                  VS
                                </Badge>
                              </div>

                              {/* Team B */}
                              <div className="flex flex-col items-start gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                                    <span className="font-bold text-xs text-blue-500">
                                      {(match.team_b_name || "BY")
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                  <span
                                    className={`font-semibold text-lg ${match.result === "team_b_win" ? "text-success" : ""}`}
                                  >
                                    {match.team_b_name || "BYE"}
                                  </span>
                                  {match.result === "team_b_win" && (
                                    <Crown className="h-5 w-5 text-warning fill-warning/20" />
                                  )}
                                </div>
                                {match.score_b !== null ? (
                                  <div className="flex flex-col items-start">
                                    <span className="text-3xl font-display font-bold">
                                      {match.score_b}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Score
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic text-sm">
                                    No score
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Status & Actions */}
                            <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-2 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6">
                              {match.status === "waiting" && (
                                <Badge
                                  variant="outline"
                                  className="h-8 px-3 text-sm"
                                >
                                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                                  Waiting
                                </Badge>
                              )}
                              {match.status === "running" && (
                                <Badge className="h-8 px-3 text-sm bg-primary/20 text-primary hover:bg-primary/30">
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                  Evaluating...
                                </Badge>
                              )}
                              {match.status === "completed" && (
                                <Badge className="h-8 px-3 text-sm bg-success/20 text-success hover:bg-success/30">
                                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                  Completed
                                </Badge>
                              )}

                              <div className="text-xs text-muted-foreground mt-1">
                                ID: {match._id.substring(match._id.length - 6)}
                              </div>
                            </div>
                          </div>

                          {/* Verdict Section */}
                          {match.verdict && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-4 pt-4 border-t border-border/40"
                            >
                              <div className="flex gap-3 bg-card/40 p-3 rounded-lg">
                                <div className="mt-0.5">
                                  <Award className="h-4 w-4 text-purple-400" />
                                </div>
                                <div className="text-sm">
                                  <span className="font-semibold text-foreground block mb-1">
                                    Judge Verdict
                                  </span>
                                  <p className="text-muted-foreground leading-relaxed">
                                    {match.verdict}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tournament Standings */}
      {leaderboard.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent/10">
              <Crown className="h-5 w-5 text-accent" />
            </div>
            <h3 className="font-display font-bold text-lg">
              Tournament Standings
            </h3>
          </div>

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Rank</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 text-center">W-L-D</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((team, index) => (
                  <tr
                    key={team._id}
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
                      {team.total_score}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      <span className="text-success">{team.wins}</span> -{" "}
                      <span className="text-destructive">{team.losses}</span> -{" "}
                      <span className="text-warning">{team.draws}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge
                        variant="outline"
                        className={
                          team.status === "active"
                            ? "text-success border-success/30"
                            : "text-muted-foreground"
                        }
                      >
                        {team.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default TournamentAdminPanel;

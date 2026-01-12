import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import db from '@/integrations/mongo/client';
import { Button } from '@/components/ui/button';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Search,
  Eye
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminTeamDetailCard } from './AdminTeamDetailCard';
import { MOCK_TEAMS } from '@/lib/mockTeamData';

interface Team {
  id: string;
  name: string;
  shortlist_status: string;
  dataset_name: string | null;
  dataset_description: string | null;
  created_at: string;
  event_id: string | null;
}

interface TeamShortlistManagerProps {
  eventId?: string;
}

export function TeamShortlistManager({ eventId }: TeamShortlistManagerProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams();
  }, [eventId]);

  const fetchTeams = async () => {
    try {
      let query = db
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map _id to id to avoid key collisions and state issues
      const mappedData = (data || []).map((t: any) => ({
        ...t,
        id: t._id ? t._id.toString() : t.id
      }));

      setTeams(mappedData);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateShortlistStatus = async (teamId: string, status: string) => {
    setUpdating(teamId);
    try {
      const { error } = await db
        .from('teams')
        .update({ shortlist_status: status })
        .eq('id', teamId);

      if (error) throw error;

      setTeams(teams.map(team =>
        team.id === teamId ? { ...team, shortlist_status: status } : team
      ));

      toast.success(`Team status updated to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/20 text-success text-xs">
            <CheckCircle className="h-3 w-3" />
            Shortlisted
          </span>
        );
      case 'not_shortlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/20 text-destructive text-xs">
            <XCircle className="h-3 w-3" />
            Not Shortlisted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning/20 text-warning text-xs">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to find mock data for a team
  const getMockDataForTeam = (teamName: string) => {
    // Try to find by name, otherwise return the first one as default
    return MOCK_TEAMS.find(t => t.teamName.toLowerCase() === teamName.toLowerCase()) || MOCK_TEAMS[0];
  };

  if (loading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl">Team Shortlist Manager</h2>
            <p className="text-sm text-muted-foreground">Update team shortlist status</p>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {filteredTeams.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No teams found</p>
          </div>
        ) : (
          filteredTeams.map((team) => (
            <div
              key={team.id}
              className="p-4 rounded-lg bg-muted/30 border border-border/50 transition-all hover:bg-muted/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      {team.name}
                    </h4>
                    {team.dataset_name && (
                      <p className="text-xs text-muted-foreground">Dataset: {team.dataset_name}</p>
                    )}
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="View Details">
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Team Details</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-full max-h-[60vh] pr-4">
                        <AdminTeamDetailCard data={getMockDataForTeam(team.name)} />
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
                {getStatusBadge(team.shortlist_status)}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={team.shortlist_status === 'shortlisted' ? 'default' : 'outline'}
                  onClick={() => updateShortlistStatus(team.id, 'shortlisted')}
                  disabled={updating === team.id}
                  className="flex-1"
                >
                  {updating === team.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Shortlist
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant={team.shortlist_status === 'not_shortlisted' ? 'destructive' : 'outline'}
                  onClick={() => updateShortlistStatus(team.id, 'not_shortlisted')}
                  disabled={updating === team.id}
                  className="flex-1"
                >
                  {updating === team.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant={team.shortlist_status === 'pending' ? 'secondary' : 'ghost'}
                  onClick={() => updateShortlistStatus(team.id, 'pending')}
                  disabled={updating === team.id}
                >
                  <Clock className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

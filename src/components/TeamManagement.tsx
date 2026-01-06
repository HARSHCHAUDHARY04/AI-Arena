import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Plus, 
  UserPlus, 
  Crown, 
  LogOut,
  Copy,
  Check,
  Loader2,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  created_by: string;
  event_id: string | null;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  joined_at: string;
  profiles: {
    email: string;
    team_name: string | null;
  } | null;
}

interface TeamManagementProps {
  eventId?: string;
  onTeamChange?: () => void;
}

export function TeamManagement({ eventId, onTeamChange }: TeamManagementProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-team' | 'create' | 'join'>('my-team');
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserTeam();
      fetchAvailableTeams();
    }
  }, [user, eventId]);

  const fetchUserTeam = async () => {
    if (!user) return;

    try {
      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .single();

      if (membership) {
        const { data: team } = await supabase
          .from('teams')
          .select('*')
          .eq('id', membership.team_id)
          .single();

        if (team) {
          setUserTeam(team);
          await fetchTeamMembers(team.id);
        }
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    const { data: members } = await supabase
      .from('team_members')
      .select('id, user_id, joined_at')
      .eq('team_id', teamId);

    if (members) {
      // Fetch profiles separately
      const memberData: TeamMember[] = await Promise.all(
        members.map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, team_name')
            .eq('id', member.user_id)
            .single();
          
          return {
            ...member,
            profiles: profile || null,
          };
        })
      );
      setTeamMembers(memberData);
    }
  };

  const fetchAvailableTeams = async () => {
    const query = supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (eventId) {
      query.eq('event_id', eventId);
    }

    const { data } = await query;
    if (data) {
      setAvailableTeams(data);
    }
  };

  const createTeam = async () => {
    if (!user || !newTeamName.trim()) return;

    setCreating(true);
    try {
      // Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: newTeamName.trim(),
          created_by: user.id,
          event_id: eventId || null,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      toast.success('Team created successfully!');
      setNewTeamName('');
      setUserTeam(team);
      await fetchTeamMembers(team.id);
      onTeamChange?.();
      setActiveTab('my-team');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const joinTeam = async (teamId: string) => {
    if (!user) return;

    setJoining(teamId);
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: user.id,
        });

      if (error) throw error;

      toast.success('Joined team successfully!');
      await fetchUserTeam();
      onTeamChange?.();
      setActiveTab('my-team');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join team');
    } finally {
      setJoining(null);
    }
  };

  const leaveTeam = async () => {
    if (!user || !userTeam) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', userTeam.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Left team successfully');
      setUserTeam(null);
      setTeamMembers([]);
      onTeamChange?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave team');
    }
  };

  const copyTeamId = () => {
    if (userTeam) {
      navigator.clipboard.writeText(userTeam.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Team ID copied!');
    }
  };

  const filteredTeams = availableTeams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl">Team Management</h2>
          <p className="text-sm text-muted-foreground">Create or join a team to compete</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'my-team' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('my-team')}
        >
          <Users className="h-4 w-4 mr-2" />
          My Team
        </Button>
        {!userTeam && (
          <>
            <Button
              variant={activeTab === 'create' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
            <Button
              variant={activeTab === 'join' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('join')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Join
            </Button>
          </>
        )}
      </div>

      {/* My Team Tab */}
      {activeTab === 'my-team' && (
        <div>
          {userTeam ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-lg">{userTeam.name}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyTeamId}
                    className="text-xs"
                  >
                    {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    Copy ID
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Team ID: {userTeam.id}
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Members ({teamMembers.length})</p>
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded bg-background/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {userTeam.created_by === member.user_id ? (
                          <Crown className="h-4 w-4 text-accent" />
                        ) : (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          {member.profiles?.team_name || member.profiles?.email || 'Unknown'}
                        </p>
                        {userTeam.created_by === member.user_id && (
                          <p className="text-xs text-accent">Team Leader</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={leaveTeam}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave Team
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-display font-semibold mb-2">No Team Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a new team or join an existing one to participate.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('join')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join Team
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Team Tab */}
      {activeTab === 'create' && !userTeam && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Team Name</label>
            <Input
              placeholder="Enter your team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="bg-muted/30"
            />
          </div>
          <Button
            onClick={createTeam}
            disabled={!newTeamName.trim() || creating}
            className="w-full"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Team
          </Button>
        </div>
      )}

      {/* Join Team Tab */}
      {activeTab === 'join' && !userTeam && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/30"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredTeams.length > 0 ? (
              filteredTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(team.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => joinTeam(team.id)}
                    disabled={joining === team.id}
                  >
                    {joining === team.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Join
                      </>
                    )}
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No teams found' : 'No teams available yet'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

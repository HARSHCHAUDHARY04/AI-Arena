import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Calendar, 
  Award, 
  TrendingUp,
  UserCheck,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  totalParticipants: number;
  totalEvents: number;
  shortlistedTeams: number;
  activeEvents: number;
  totalTeams: number;
  pendingTeams: number;
}

export function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    totalParticipants: 0,
    totalEvents: 0,
    shortlistedTeams: 0,
    activeEvents: 0,
    totalTeams: 0,
    pendingTeams: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch total participants (team members)
      const { count: participantCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true });

      // Fetch total events
      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Fetch active events
      const { count: activeEventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch total teams
      const { count: teamCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });

      // Fetch shortlisted teams
      const { count: shortlistedCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('shortlist_status', 'shortlisted');

      // Fetch pending teams
      const { count: pendingCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('shortlist_status', 'pending');

      setData({
        totalParticipants: participantCount || 0,
        totalEvents: eventCount || 0,
        shortlistedTeams: shortlistedCount || 0,
        activeEvents: activeEventCount || 0,
        totalTeams: teamCount || 0,
        pendingTeams: pendingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'Total Participants',
      value: data.totalParticipants,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Total Events',
      value: data.totalEvents,
      icon: Calendar,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'Shortlisted Teams',
      value: data.shortlistedTeams,
      icon: Award,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Active Events',
      value: data.activeEvents,
      icon: Activity,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Total Teams',
      value: data.totalTeams,
      icon: UserCheck,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Pending Review',
      value: data.pendingTeams,
      icon: TrendingUp,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card p-4 animate-pulse">
            <div className="h-10 w-10 rounded-lg bg-muted mb-3" />
            <div className="h-6 w-12 bg-muted rounded mb-2" />
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-card p-4"
        >
          <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <p className="font-display font-bold text-2xl mb-1">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

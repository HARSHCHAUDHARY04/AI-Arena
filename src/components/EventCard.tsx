import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Users, 
  Trophy,
  ArrowRight,
  Play,
  Pause
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    status: string;
    start_time: string | null;
    end_time: string | null;
  };
  teamCount?: number;
}

export function EventCard({ event, teamCount = 0 }: EventCardProps) {
  const getStatusBadge = () => {
    switch (event.status) {
      case 'active':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full status-active text-xs font-medium">
            <Play className="h-3 w-3" />
            LIVE
          </div>
        );
      case 'paused':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full status-pending text-xs font-medium">
            <Pause className="h-3 w-3" />
            PAUSED
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            <Trophy className="h-3 w-3" />
            ENDED
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/20 text-secondary-foreground text-xs font-medium">
            <Clock className="h-3 w-3" />
            UPCOMING
          </div>
        );
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass-card p-6 group hover:border-primary/50 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          {getStatusBadge()}
        </div>
        {event.status === 'active' && (
          <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
        )}
      </div>

      <p className="text-muted-foreground text-sm mb-6 line-clamp-2">
        {event.description || 'No description available'}
      </p>

      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          {formatDate(event.start_time)}
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          {teamCount} teams
        </div>
      </div>

      <Link to={`/dashboard?event=${event.id}`}>
        <Button variant="glass" className="w-full group/btn">
          View Details
          <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </Link>
    </motion.div>
  );
}

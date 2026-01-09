import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Award } from 'lucide-react';

interface ShortlistStatusCardProps {
  status: 'shortlisted' | 'not_shortlisted' | 'pending';
  teamName?: string;
}

export function ShortlistStatusCard({ status, teamName }: ShortlistStatusCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'shortlisted':
        return {
          icon: CheckCircle,
          label: 'Shortlisted',
          description: 'Congratulations! Your team has been selected for the next round.',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/30',
          iconColor: 'text-success',
          textColor: 'text-success',
          glow: 'shadow-[0_0_30px_hsl(150_80%_45%/0.3)]',
        };
      case 'not_shortlisted':
        return {
          icon: XCircle,
          label: 'Not Shortlisted',
          description: 'Unfortunately, your team has not been selected for the next round.',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/30',
          iconColor: 'text-destructive',
          textColor: 'text-destructive',
          glow: '',
        };
      case 'pending':
      default:
        return {
          icon: Clock,
          label: 'Pending',
          description: 'Your submission is under review. Results will be announced soon.',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/30',
          iconColor: 'text-warning',
          textColor: 'text-warning',
          glow: '',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 ${config.borderColor} ${config.glow}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
          <Award className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">Shortlist Status</h3>
          {teamName && <p className="text-xs text-muted-foreground">{teamName}</p>}
        </div>
      </div>

      <div className={`p-4 rounded-xl ${config.bgColor} ${config.borderColor} border`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`h-8 w-8 ${config.iconColor}`} />
          <div>
            <p className={`font-display font-bold text-xl ${config.textColor}`}>
              {config.label}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {config.description}
            </p>
          </div>
        </div>
      </div>

      {status === 'shortlisted' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-3 rounded-lg bg-success/5 border border-success/20"
        >
          <p className="text-xs text-success flex items-center gap-2">
            <CheckCircle className="h-3 w-3" />
            You are qualified for the next round!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

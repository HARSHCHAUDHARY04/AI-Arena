import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, Pause, AlertTriangle } from 'lucide-react';

interface EventTimerProps {
  startTime: string | null;
  endTime: string | null;
  status: string;
}

export function EventTimer({ startTime, endTime, status }: EventTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [phase, setPhase] = useState<'upcoming' | 'active' | 'ended'>('upcoming');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();

      if (!startTime && !endTime) {
        setTimeLeft(null);
        setPhase('upcoming');
        return;
      }

      const start = startTime ? new Date(startTime).getTime() : 0;
      const end = endTime ? new Date(endTime).getTime() : 0;

      if (status === 'completed' || (end && now > end)) {
        setPhase('ended');
        setTimeLeft(null);
        return;
      }

      if (start && now < start && status !== 'completed') {
        setPhase('upcoming');
        const toStart = start - now;
        if (toStart > 0) {
          setTimeLeft({
            days: Math.floor(toStart / (1000 * 60 * 60 * 24)),
            hours: Math.floor((toStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((toStart % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((toStart % (1000 * 60)) / 1000),
          });
        }
        return;
      }

      if (status === 'active' || (start && now >= start)) {
        setPhase('active');
        if (end) {
          const remaining = end - now;
          if (remaining > 0) {
            setTimeLeft({
              days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
              hours: Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
              minutes: Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)),
              seconds: Math.floor((remaining % (1000 * 60)) / 1000),
            });
          }
        }
        return;
      }

      // Default/Fallback Upcoming logic (redundant but safe)
      setPhase('upcoming');
      const toStart = start - now;
      if (toStart > 0) {
        setTimeLeft({
          days: Math.floor(toStart / (1000 * 60 * 60 * 24)),
          hours: Math.floor((toStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((toStart % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((toStart % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime, status]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="glass-card px-4 py-3 min-w-[60px] neon-border">
        <span className="font-display text-2xl md:text-3xl font-bold text-primary">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">{label}</span>
    </div>
  );

  if (phase === 'ended') {
    return (
      <div className="glass-card p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Clock className="h-5 w-5" />
          <span className="font-display font-semibold">Event Ended</span>
        </div>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Clock className="h-5 w-5" />
          <span className="font-display font-semibold">Time TBA</span>
        </div>
      </div>
    );
  }

  const isUrgent = phase === 'active' && timeLeft.hours === 0 && timeLeft.days === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-card p-6 ${isUrgent ? 'border-destructive/50' : ''}`}
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        {phase === 'active' ? (
          <>
            {isUrgent ? (
              <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
            ) : (
              <Play className="h-5 w-5 text-success" />
            )}
            <span className="font-display font-semibold text-foreground">
              {isUrgent ? 'Final Minutes!' : 'Time Remaining'}
            </span>
          </>
        ) : (
          <>
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold text-foreground">Starts In</span>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 md:gap-4">
        {timeLeft.days > 0 && <TimeBlock value={timeLeft.days} label="Days" />}
        <TimeBlock value={timeLeft.hours} label="Hours" />
        <span className="font-display text-2xl text-primary animate-pulse">:</span>
        <TimeBlock value={timeLeft.minutes} label="Min" />
        <span className="font-display text-2xl text-primary animate-pulse">:</span>
        <TimeBlock value={timeLeft.seconds} label="Sec" />
      </div>

      {phase === 'active' && status === 'paused' && (
        <div className="flex items-center justify-center gap-2 mt-4 text-warning">
          <Pause className="h-4 w-4" />
          <span className="text-sm font-medium">Competition Paused</span>
        </div>
      )}
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import db from '@/integrations/mongo/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Loader2,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

interface Event {
  _id?: string;
  id?: string;
  title: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
}

interface AdminEventTimerProps {
  event: Event;
  onUpdate?: () => void;
}

export function AdminEventTimer({ event, onUpdate }: AdminEventTimerProps) {
  const [startTime, setStartTime] = useState(event.start_time?.slice(0, 16) || '');
  const [endTime, setEndTime] = useState(event.end_time?.slice(0, 16) || '');
  const [updating, setUpdating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (event.status === 'active' && event.end_time) {
      const interval = setInterval(() => {
        const now = new Date();
        const end = new Date(event.end_time!);
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft({ hours, minutes, seconds });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [event.status, event.end_time]);

  const updateTimer = async () => {
    setUpdating(true);
    try {
      const { error } = await db
        .from('events')
        .update({
          start_time: startTime ? new Date(startTime).toISOString() : null,
          end_time: endTime ? new Date(endTime).toISOString() : null,
        })
        .eq('id', event._id || event.id);

      if (error) throw error;
      toast.success('Timer updated successfully');
      onUpdate?.();
    } catch (error) {
      console.error('Error updating timer:', error);
      toast.error('Failed to update timer');
    } finally {
      setUpdating(false);
    }
  };

  const updateEventStatus = async (status: string) => {
    setUpdating(true);
    try {
      const updates: Record<string, unknown> = { status };

      // If starting the event and no start time set, use current time
      if (status === 'active' && !event.start_time) {
        updates.start_time = new Date().toISOString();
      }

      const { error } = await db
        .from('events')
        .update(updates)
        .eq('id', event._id || event.id);

      if (error) throw error;
      toast.success(`Event ${status === 'active' ? 'started' : status === 'paused' ? 'paused' : 'reset'}`);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update event status');
    } finally {
      setUpdating(false);
    }
  };

  const resetTimer = async () => {
    setUpdating(true);
    try {
      const { error } = await db
        .from('events')
        .update({
          status: 'registration',
          start_time: null,
          end_time: null,
        })
        .eq('id', event._id || event.id);

      if (error) throw error;
      setStartTime('');
      setEndTime('');
      toast.success('Timer reset successfully');
      onUpdate?.();
    } catch (error) {
      console.error('Error resetting timer:', error);
      toast.error('Failed to reset timer');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Clock className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">Event Timer Control</h3>
          <p className="text-sm text-muted-foreground">{event.title}</p>
        </div>
      </div>

      {/* Live Timer Display */}
      {event.status === 'active' && timeLeft && (
        <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/30">
          <p className="text-xs text-primary mb-2">Time Remaining</p>
          <div className="flex gap-4 justify-center">
            <div className="text-center">
              <span className="font-display text-3xl font-bold text-primary">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <p className="text-xs text-muted-foreground">Hours</p>
            </div>
            <span className="font-display text-3xl text-primary">:</span>
            <div className="text-center">
              <span className="font-display text-3xl font-bold text-primary">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
            <span className="font-display text-3xl text-primary">:</span>
            <div className="text-center">
              <span className="font-display text-3xl font-bold text-primary">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <p className="text-xs text-muted-foreground">Seconds</p>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2 mb-6">
        {event.status !== 'active' ? (
          <Button
            onClick={() => updateEventStatus('active')}
            disabled={updating}
            className="flex-1"
            variant="success"
          >
            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Start
          </Button>
        ) : (
          <Button
            onClick={() => updateEventStatus('paused')}
            disabled={updating}
            className="flex-1"
            variant="outline"
          >
            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
            Pause
          </Button>
        )}
        <Button
          onClick={resetTimer}
          disabled={updating}
          variant="destructive"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Time Settings */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="start">Start Time</Label>
          <Input
            id="start"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end">End Time</Label>
          <Input
            id="end"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <Button
          onClick={updateTimer}
          disabled={updating}
          className="w-full"
        >
          {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Timer Settings
        </Button>
      </div>
    </motion.div>
  );
}

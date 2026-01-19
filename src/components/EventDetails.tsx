import React from 'react';
import { Calendar, Clock, MapPin, DollarSign, User } from 'lucide-react';

interface Props {
  event: any | null;
  currentRound?: any | null;
  qualificationStatus?: string | null;
}

export const EventDetails: React.FC<Props> = ({ event, currentRound, qualificationStatus }) => {
  // Fallback static details per request
  const staticInfo = {
    name: "AI Battle Arena (TechTAT’26)",
    organizer: 'GLA University, Mathura / Greater Noida',
    date: 'January 31, 2026',
    time: '10:00 AM onwards',
    venue: '5008, AB-XII, GLA University, Mathura',
    prize: '₹30,000/-',
  };

  const title = event?.title || staticInfo.name;

  return (
    <div className="glass-card p-6">
      <h2 className="font-display font-bold text-xl mb-2">Event Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <h3 className="font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{event?.description || 'A multi-round AI model building competition.'}</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm text-muted-foreground">Organizer</p>
          <p className="font-semibold">{event?.organizer || staticInfo.organizer}</p>
          <div className="flex items-center gap-2 text-sm mt-3 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{event?.date || staticInfo.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{event?.time || staticInfo.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{event?.venue || staticInfo.venue}</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>Cash Prize Pool: {event?.prize || staticInfo.prize}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm text-muted-foreground">Current Round</p>
          <p className="font-semibold">{currentRound ? `Round ${currentRound.number} — ${currentRound.title || 'Unnamed'}` : 'No active round'}</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm text-muted-foreground">Round Status</p>
          <p className="font-semibold capitalize">{currentRound?.status || 'upcoming'}</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm text-muted-foreground">Your Qualification</p>
          <p className={`font-semibold ${qualificationStatus === 'eliminated' ? 'text-destructive' : qualificationStatus === 'qualified' ? 'text-success' : 'text-warning'}`}>
            {qualificationStatus ? qualificationStatus : 'Pending'}
          </p>
        </div>
      </div>

      {currentRound && (
        <div className="mt-4 p-4 rounded-lg bg-muted/20 border border-border/50">
          <h4 className="font-semibold mb-2">Round Details</h4>
          <p className="text-sm text-muted-foreground mb-2">
            {currentRound.problem_statement || 'Problem statement and dataset will be released by admin when the round goes live.'}
          </p>
          <p className="text-xs text-muted-foreground">Evaluation: {currentRound.evaluation_criteria || 'TBD'}</p>
        </div>
      )}
    </div>
  );
};

export default EventDetails;

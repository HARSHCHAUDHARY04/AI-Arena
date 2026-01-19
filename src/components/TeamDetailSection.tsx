import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  Github,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Building2,
  User
} from 'lucide-react';



interface TeamDetailSectionProps {
  team: any;
  members: any[];
}

const getInstitution = (email?: string) => {
  if (!email) return 'Unknown Institution';
  const lower = email.toLowerCase();
  if (lower.includes('gla.ac.in')) return 'GLA University, Mathura';
  if (lower.includes('nitj.ac.in')) return 'NIT Jalandhar';
  if (lower.includes('jiit.ac.in')) return 'JIIT Noida';
  if (lower.includes('galgotias')) return 'Galgotias University';
  if (lower.includes('kiet')) return 'KIET Ghaziabad';
  if (lower.includes('gmail.com')) return 'External Participant'; // Or fallback
  return 'Participating Institution';
};

export function TeamDetailSection({ team, members }: TeamDetailSectionProps) {
  if (!team) return null;

  // Find leader to determine institution
  const leaderUser = members.find(m => {
    const r = m.role || 'member';
    return r === 'leader' || r === 'Team Lead' || m.user_id === team.leader_id;
  })?.user_details || members.find(m => m.role === 'Team Lead') || members[0]?.user_details;

  const institution = getInstitution(leaderUser?.email || team.leader_email);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-xl flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Team Registration Details
        </h2>
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          {members.length} Members
        </span>
      </div>

      <div className="mb-8 p-4 rounded-xl bg-muted/30 border border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Team Name</p>
            <p className="font-semibold text-lg">{team.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Institution</p>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">
                {institution}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {members.map((memberWrapper) => {
          // Handle both raw member or enriched member structure
          const member = memberWrapper.user_details || memberWrapper;
          const role = memberWrapper.role || 'Member';
          const isLeader = role === 'leader' || role === 'Team Lead' || memberWrapper.user_id === team.leader_id || (member.email && team.leader_email === member.email); // Heuristic

          return (
            <div
              key={member._id || member.id || Math.random()}
              className={`rounded-xl border p-4 transition-all hover:bg-muted/20 ${isLeader
                ? 'bg-primary/5 border-primary/20'
                : 'bg-glass border-border/50'
                }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLeader ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{member.name || 'Unknown User'}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isLeader
                      ? 'bg-primary/20 text-primary'
                      : 'bg-secondary text-secondary-foreground'
                      }`}>
                      {role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-muted-foreground text-xs">Course</p>
                    <p className="font-medium truncate">{member.course || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Year</p>
                    <p className="font-medium">{member.year || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">University Roll No</p>
                    <p className="font-mono">{member.roll_number || 'N/A'}</p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-border/50 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span className="text-xs">{member.phone || 'N/A'}</span>
                  </div>
                  {isLeader && member.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="text-xs">{member.email}</span>
                    </div>
                  )}

                  <div className="flex gap-3 mt-2">
                    {member.github && (
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="GitHub"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {member.linkedin_url && (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="LinkedIn"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

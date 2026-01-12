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

import { MOCK_TEAMS } from '@/lib/mockTeamData';

export function TeamDetailSection() {
  // Using the first team as the default demo
  const data = MOCK_TEAMS[0];

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
          {data.memberCount} Members
        </span>
      </div>

      <div className="mb-8 p-4 rounded-xl bg-muted/30 border border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Team Name</p>
            <p className="font-semibold text-lg">{data.teamName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Institution</p>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">
                {data.campusOrCollege}
                {data.isGlaStudent && <span className="text-xs text-muted-foreground ml-2">(Internal)</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {data.members.map((member) => (
          <div
            key={member.id}
            className={`rounded-xl border p-4 transition-all hover:bg-muted/20 ${member.role === 'Team Lead'
                ? 'bg-primary/5 border-primary/20'
                : 'bg-glass border-border/50'
              }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${member.role === 'Team Lead' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${member.role === 'Team Lead'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-secondary text-secondary-foreground'
                    }`}>
                    {member.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-muted-foreground text-xs">Course</p>
                  <p className="font-medium truncate">{member.course}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Year</p>
                  <p className="font-medium">{member.year}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">University Roll No</p>
                  <p className="font-mono">{member.rollNo}</p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-border/50 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span className="text-xs">{member.phone}</span>
                </div>
                {member.email && (
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
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
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
        ))}
      </div>
    </motion.div>
  );
}

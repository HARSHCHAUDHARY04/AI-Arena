import React from 'react';
import {
    Users,
    Github,
    Linkedin,
    Mail,
    Phone,
    Building2,
    User
} from 'lucide-react';
import { TeamDetailsData } from '@/lib/mockTeamData';

interface AdminTeamDetailCardProps {
    data: TeamDetailsData;
}

export function AdminTeamDetailCard({ data }: AdminTeamDetailCardProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-4">
                <div>
                    <h2 className="font-display font-bold text-xl flex items-center gap-2">
                        {data.teamName}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Building2 className="h-4 w-4" />
                        <span>
                            {data.campusOrCollege}
                            {data.isGlaStudent && <span className="ml-1 text-primary text-xs">(Internal)</span>}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {data.memberCount} Members
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.members.map((member) => (
                    <div
                        key={member.id}
                        className={`rounded-lg border p-4 ${member.role === 'Team Lead'
                                ? 'bg-primary/5 border-primary/20'
                                : 'bg-muted/10 border-border/50'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${member.role === 'Team Lead' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                                    }`}>
                                    <User className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">{member.name}</h3>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${member.role === 'Team Lead'
                                            ? 'text-primary'
                                            : 'text-muted-foreground'
                                        }`}>
                                        {member.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5 text-xs">
                            <div className="grid grid-cols-2 gap-x-2">
                                <div>
                                    <p className="text-muted-foreground">Course</p>
                                    <p className="font-medium truncate">{member.course}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Year</p>
                                    <p className="font-medium">{member.year}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground">University Roll No</p>
                                <p className="font-mono">{member.rollNo}</p>
                            </div>

                            <div className="pt-2 mt-2 border-t border-border/50 space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span>{member.phone}</span>
                                </div>
                                {member.email && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-3 w-3" />
                                        <span className="truncate">{member.email}</span>
                                    </div>
                                )}
                                <div className="flex gap-2 mt-1">
                                    {member.github && (
                                        <a href={member.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                            <Github className="h-3 w-3" />
                                        </a>
                                    )}
                                    {member.linkedin && (
                                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                            <Linkedin className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

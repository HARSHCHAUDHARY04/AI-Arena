import React from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Users,
    GraduationCap,
    CreditCard,
    Rocket,
    Phone
} from 'lucide-react';

export function EventRulesSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-8"
        >
            <div>
                <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Rules and Regulations
                </h2>
                <div className="p-4 rounded-lg bg-muted/20 border border-primary/20">
                    <p className="font-semibold text-primary mb-2">📌 Read the instructions carefully before proceeding</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90">
                        <li><strong>Team size:</strong> 2–4 members (including Team Leader)</li>
                        <li>Open to students from GLA University (Noida or Mathura) campus and Outside Campus (other colleges).</li>
                        <li>All communication will be with the Team Leader only - fill details carefully.</li>
                        <li>Teams must build an AI-based solution as per the given problem statement.</li>
                        <li>Details related to Problem statements will be shared soon.</li>
                        <li>Teams will be shortlisted based on profile (Priority to First Come First serve).</li>
                        <li>Only shortlisted teams can participate.</li>
                        <li>Shortlisting result would be declared between <strong>16 Jan 2025 to 21 Jan 2025</strong> (only for internal teams).</li>
                    </ul>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-accent" />
                        Eligibility Criteria
                    </h3>
                    <p className="text-sm text-foreground/90">
                        <strong>Open for All:</strong> Students from any college or university across India and abroad are welcome to participate.
                    </p>
                </div>

                <div>
                    <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-success" />
                        Registration Fees
                    </h3>
                    <ul className="space-y-2 text-sm text-foreground/90">
                        <li>
                            <strong>Internal Participants (GLA University):</strong> ₹50 per member (shortlisted teams only)
                        </li>
                        <li>
                            <strong>External Participants:</strong> ₹100 per member (shortlisted teams only)
                        </li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                        Payment link and instructions will be shared after shortlisting.
                    </p>
                </div>
            </div>

            <div>
                <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-warning" />
                    Why You Should Participate?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { title: "Prove Your Skills", desc: "Compete with top tech enthusiasts" },
                        { title: "Learn by Doing", desc: "Hands-on exposure to modern technologies" },
                        { title: "Network", desc: "Connect with mentors, professionals, and peers" },
                        { title: "Career Boost", desc: "Strengthen your resume with a competitive CTF win" },
                        { title: "Glory & Recognition", desc: "Earn prizes, respect, and bragging rights" },
                    ].map((item) => (
                        <div key={item.title} className="p-3 rounded-lg bg-muted/10 border border-border/50">
                            <p className="font-semibold text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-border/50 pt-6">
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    Event Coordinators
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                        <p className="font-semibold mb-2">Faculty Coordinators:</p>
                        <ul className="space-y-1 text-muted-foreground">
                            <li>Dr. Ruby Panwar: +91 8630115921</li>
                            <li>Mr. Shivanshu Upadhyay: +91 8839953797</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold mb-2">Student Coordinators:</p>
                        <ul className="space-y-1 text-muted-foreground">
                            <li>Jatin Khetan: +91 9412714387</li>
                            <li>Om Lakshkar: +91 7755084628</li>
                            <li>Parth Garg: +91 7850056007</li>
                            <li>Yashasvi Pandey: yashasvi.pandey_cs23@gla.ac.in</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="text-center p-2 rounded bg-destructive/10 border border-destructive/20">
                <p className="text-xs font-semibold text-destructive">
                    Note: Incorrect or incomplete details may lead to disqualification.
                </p>
            </div>
        </motion.div>
    );
}

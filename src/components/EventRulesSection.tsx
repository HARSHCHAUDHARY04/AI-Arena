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
                    AI Battle Arena 2026 – Rulebook
                </h2>

                {/* Event Format */}
                <div className="mb-8 p-4 rounded-lg bg-muted/20 border border-primary/20">
                    <h3 className="font-bold text-lg mb-2 text-primary">Event Format</h3>
                    <p className="text-sm mb-2">A chess-style league system with 4 rounds:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90">
                        <li><strong>Round 1:</strong> All teams compete.</li>
                        <li><strong>Round 2:</strong> Teams with same points pair up.</li>
                        <li><strong>Round 3:</strong> Same pairing logic continues.</li>
                        <li><strong>Round 4:</strong> Final standings decided based on cumulative score.</li>
                    </ul>
                </div>

                {/* Problem Statement */}
                <div className="mb-8">
                    <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-accent" />
                        Problem Statement
                    </h3>
                    <p className="text-sm text-foreground/90 mb-4">
                        Build an APIs Question Answering System which accepts a PDF and multiple questions, processes them using your deployed model, and returns JSON responses.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-muted/10 p-3 rounded border border-border/50">
                            <h4 className="font-semibold text-xs mb-2">Input JSON Schema</h4>
                            <pre className="text-xs bg-black/20 p-2 rounded overflow-x-auto">
                                {`{
    "pdf_url": "https://example.com/sample.pdf",
    "questions": [
        "What is the summary of section 2?",
        "List all key points..."
    ]
}`}
                            </pre>
                        </div>
                        <div className="bg-muted/10 p-3 rounded border border-border/50">
                            <h4 className="font-semibold text-xs mb-2">Output JSON Schema</h4>
                            <pre className="text-xs bg-black/20 p-2 rounded overflow-x-auto">
                                {`{
    "answers": [
        "Answer to Q1...",
        "Answer to Q2...",
        "Answer to Q3..."
    ]
}`}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Rules & Regulations */}
                <div className="mb-8">
                    <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-warning" />
                        Rules & Regulations
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-foreground/90">
                        <li>
                            <strong>Allowed Models:</strong> Only pretrained models (GPT OSS, Deepseek, Qwen, Llama, Mistral). Fine-tuning is allowed.
                            <span className="block text-xs text-muted-foreground ml-5">No direct API calls to third-party AI services. Detection = Disqualification.</span>
                        </li>
                        <li>
                            <strong>API Endpoint:</strong> Must be exactly <code>/aibattle</code>.
                        </li>
                        <li>
                            <strong>Deployment:</strong> Teams must deploy models before the event (Vercel, ngrok, cloud, etc.).
                        </li>
                        <li>
                            <strong>Uptime:</strong> Hosted server must remain active for all rounds.
                        </li>
                    </ul>
                </div>

                {/* Judging Criteria */}
                <div className="mb-8">
                    <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-success" />
                        Judging Criteria
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                        {[
                            { label: "Accuracy", val: "40%" },
                            { label: "Relevance", val: "25%" },
                            { label: "Response Time", val: "20%" },
                            { label: "Stability", val: "10%" },
                            { label: "JSON Format", val: "5%" },
                        ].map((c) => (
                            <div key={c.label} className="text-center p-2 bg-muted/10 rounded border border-border/50">
                                <div className="font-bold text-lg text-primary">{c.val}</div>
                                <div className="text-[10px] uppercase tracking-wider">{c.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="text-xs p-3 bg-muted/20 rounded font-mono">
                        Score = (0.40 × accuracy) + (0.25 × relevance) + (0.20 × speed_score) + (0.10 × stability) + (0.05 × format_score)
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        * Speed Score = max(0, 100 - response_time_ms / 100)
                    </p>
                </div>

                {/* Endpoint Specification */}
                <div className="mb-8">
                    <h3 className="font-display font-bold text-lg mb-3">Endpoint Specification</h3>
                    <div className="space-y-3 text-sm">
                        <div className="p-3 border border-border/50 rounded bg-muted/5">
                            <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                                <span className="font-bold">Method:</span>
                                <code className="bg-primary/20 px-2 py-0.5 rounded text-primary w-fit">POST</code>

                                <span className="font-bold">URL:</span>
                                <code className="break-all">https://your-server/aibattle</code>

                                <span className="font-bold">Headers:</span>
                                <code>Content-Type: application/json</code>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            <strong>Note:</strong> Any malformed JSON → zero score. Plagiarised endpoints → disqualification.
                            PDFs may be 5–250 pages. Questions 5–15.
                        </p>
                    </div>
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

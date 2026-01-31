import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    Plus,
    Trash2,
    FileText,
    Server,
    AlertCircle,
    CheckCircle,
    Loader2,
    Users,
    Zap,
    History,
    Terminal,
    Trophy,
    Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/integrations/mongo/client';

interface Team {
    id?: string;
    _id: string;
    name: string;
}

interface EvaluationScores {
    accuracy_score: number;
    relevance_score: number;
    speed_score: number;
    stability_score: number;
    format_score: number;
    total_score: number;
    details: {
        tests_passed: number;
        tests_total: number;
        avg_latency_ms: number;
    };
}

interface AdminEvaluationPanelProps {
    eventId: string;
}

export function AdminEvaluationPanel({ eventId }: AdminEvaluationPanelProps) {
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [teamEndpoint, setTeamEndpoint] = useState<string>('');

    // Test Configuration
    const [pdfUrl, setPdfUrl] = useState('https://proceedings.neurips.cc/paper/2020/file/6b493230205f780e1bc26945df7481e5-Paper.pdf');
    const [questions, setQuestions] = useState<string[]>([
        "What are the two main components that RAG combines, and what pre-trained models are used for each component?",
        "What is the key difference between RAG-Sequence and RAG-Token models in how they handle retrieved documents?",
        "Which Wikipedia dump and how many documents were used for the non-parametric memory in the RAG experiments?",
        "On which three open-domain QA datasets did RAG achieve state-of-the-art results according to the paper?",
        "What percentage of cases did the top retrieved document come from a gold article in the FEVER fact verification task?"
    ]);

    // Execution State
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [fullEvaluating, setFullEvaluating] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [scores, setScores] = useState<EvaluationScores | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        if (eventId) {
            fetchTeams();
        }
    }, [eventId]);

    useEffect(() => {
        if (selectedTeamId) {
            fetchTeamSubmission(selectedTeamId);
        } else {
            setTeamEndpoint('');
        }
    }, [selectedTeamId]);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    };

    const fetchTeams = async () => {
        setLoadingTeams(true);
        try {
            const res = await fetch(`${API_BASE}/api/teams?event_id=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setTeams(data);
            }
        } catch (err) {
            console.error("Failed to fetch teams", err);
            toast({ title: "Error", description: "Could not load teams", variant: "destructive" });
        } finally {
            setLoadingTeams(false);
        }
    };

    const fetchTeamSubmission = async (teamId: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/api_submissions?team_id=${teamId}&event_id=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    const submission = data[0];
                    if (submission.endpoint_url) {
                        setTeamEndpoint(submission.endpoint_url);
                        addLog(`Auto-loaded endpoint for team: ${submission.endpoint_url}`);
                    }
                } else {
                    setTeamEndpoint('');
                    addLog(`No submission found for selected team.`);
                }
            }
        } catch (err) {
            console.error("Failed to fetch submission", err);
        }
    };

    const handleAddQuestion = () => {
        setQuestions([...questions, "New question..."]);
    };

    const handleRemoveQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleQuestionChange = (index: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[index] = value;
        setQuestions(newQuestions);
    };

    const handleQuickTest = async () => {
        if (!teamEndpoint) {
            toast({ title: "Missing Endpoint", description: "Please enter an endpoint URL.", variant: "destructive" });
            return;
        }

        setEvaluating(true);
        setError(null);
        setResponse(null);
        setScores(null);
        addLog(`Starting quick test for ${teamEndpoint}...`);

        try {
            const res = await fetch(`${API_BASE}/api/proxy-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint_url: teamEndpoint,
                    payload: { pdf_link: pdfUrl, questions: questions }
                }),
            });

            const data = await res.json();
            setResponse(data.data);

            if (data.success) {
                addLog(`Success: Response received in ${data.latency}ms`);
            } else {
                setError(data.error || `HTTP ${data.status}`);
                addLog(`Error: ${data.error || 'Request failed'}`);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to connect to Team API";
            setError(msg);
            addLog(`Critical Error: ${msg}`);
        } finally {
            setEvaluating(false);
        }
    };

    const handleFullEvaluation = async () => {
        if (!selectedTeamId || !teamEndpoint) {
            toast({ title: "Missing Info", description: "Select team and endpoint first.", variant: "destructive" });
            return;
        }

        setFullEvaluating(true);
        setError(null);
        setScores(null);
        addLog(`Starting full scored evaluation for team ID: ${selectedTeamId}...`);

        try {
            const res = await fetch(`${API_BASE}/api/evaluate-api`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    team_id: selectedTeamId,
                    event_id: eventId,
                    endpoint_url: teamEndpoint
                }),
            });

            const data = await res.json();
            if (data.success) {
                setScores(data.scores);
                addLog(`Full Evaluation Complete! Total Score: ${data.scores.total_score}`);
                toast({ title: "Evaluation Complete", description: `Score: ${data.scores.total_score}` });
            } else {
                setError(data.error || "Evaluation process failed");
                addLog(`Evaluation Error: ${data.error || 'Failed'}`);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Backend evaluation failed";
            setError(msg);
            addLog(`Error: ${msg}`);
        } finally {
            setFullEvaluating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Team & Logic */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-5 w-5 text-primary" />
                            <h3 className="font-display font-bold text-lg">Team Selector</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Select Team</label>
                            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pick a team to test..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {loadingTeams ? (
                                        <div className="p-2 text-sm text-center text-muted-foreground">Loading...</div>
                                    ) : teams.map((team) => (
                                        <SelectItem key={team._id} value={team._id}>
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Endpoint URL</label>
                            <Input
                                value={teamEndpoint}
                                onChange={(e) => setTeamEndpoint(e.target.value)}
                                placeholder="https://..."
                                className="font-mono text-xs"
                            />
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            <Button
                                variant="default"
                                onClick={handleQuickTest}
                                disabled={evaluating || fullEvaluating || !teamEndpoint}
                                className="w-full"
                            >
                                {evaluating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                                Run Quick Test
                            </Button>
                            <Button
                                variant="accent"
                                onClick={handleFullEvaluation}
                                disabled={evaluating || fullEvaluating || !selectedTeamId || !teamEndpoint}
                                className="w-full"
                            >
                                {fullEvaluating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                                Full Scored Evaluation
                            </Button>
                        </div>
                    </div>

                    <div className="glass-card p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-accent" />
                            <h3 className="font-display font-bold text-lg">Test Data</h3>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">PDF Link</label>
                            <Input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} className="text-xs font-mono h-8" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-muted-foreground">Questions</label>
                                <Button variant="ghost" size="sm" onClick={handleAddQuestion} className="h-6 w-6 p-0"><Plus className="h-3 w-3" /></Button>
                            </div>
                            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                {questions.map((q, i) => (
                                    <div key={i} className="flex gap-1.5">
                                        <Input value={q} onChange={(e) => handleQuestionChange(i, e.target.value)} className="text-xs h-7" />
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveQuestion(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Results & Logs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Metrics Section */}
                    {scores && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4"
                        >
                            {[
                                { label: 'Total Score', value: scores.total_score, icon: Trophy, color: 'text-primary' },
                                { label: 'Accuracy', value: `${scores.accuracy_score}%`, icon: Activity, color: 'text-success' },
                                { label: 'Latency', value: `${scores.details.avg_latency_ms}ms`, icon: Activity, color: 'text-warning' },
                                { label: 'Passed', value: `${scores.details.tests_passed}/${scores.details.tests_total}`, icon: CheckCircle, color: 'text-accent' },
                            ].map((stat, i) => (
                                <div key={i} className="glass-card p-4 flex flex-col items-center justify-center text-center">
                                    <stat.icon className={`h-5 w-5 mb-1 ${stat.color}`} />
                                    <span className="text-2xl font-display font-bold">{stat.value}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">{stat.label}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    <div className="glass-card p-0 overflow-hidden flex flex-col h-[500px]">
                        <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Terminal className="h-4 w-4 text-primary" />
                                <span className="font-display font-bold text-sm tracking-wide">EXECUTION LOGS & OUTPUT</span>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="text-[10px] bg-black/40">TEAM: {selectedTeamId || 'NONE'}</Badge>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
                            {/* Log Panel */}
                            <div className="border-r border-white/5 bg-black/40 flex flex-col">
                                <div className="px-3 py-1 bg-white/5 text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">System Logs</div>
                                <div className="flex-1 p-3 font-mono text-xs overflow-y-auto custom-scrollbar space-y-1">
                                    {logs.length === 0 ? (
                                        <p className="text-muted-foreground italic opacity-30">Waiting for actions...</p>
                                    ) : logs.map((log, i) => (
                                        <p key={i} className={log.includes('Error') ? 'text-destructive' : log.includes('Success') ? 'text-success' : 'text-muted-foreground'}>
                                            {log}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            {/* Raw Data Panel */}
                            <div className="flex flex-col bg-black/20">
                                <div className="px-3 py-1 bg-white/5 text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">API Response Data</div>
                                <div className="flex-1 p-3 font-mono text-xs overflow-auto custom-scrollbar">
                                    {evaluating || fullEvaluating ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-50">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                            <p className="text-[10px] animate-pulse">Awaiting API Response...</p>
                                        </div>
                                    ) : error ? (
                                        <div className="text-destructive whitespace-pre-wrap">{error}</div>
                                    ) : response ? (
                                        <pre className="text-success/90 whitespace-pre-wrap">
                                            {JSON.stringify(response, null, 2)}
                                        </pre>
                                    ) : (
                                        <p className="text-muted-foreground italic opacity-30">No output yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

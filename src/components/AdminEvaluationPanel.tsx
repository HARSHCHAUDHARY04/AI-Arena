import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/integrations/mongo/client';

interface Team {
    id: string;
    _id?: string;
    name: string;
    // Add other fields if needed
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
    const [pdfUrl, setPdfUrl] = useState('https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-12.pdf');
    const [questions, setQuestions] = useState<string[]>([
        "What is the summary of section 2?",
        "List all key points from page 4.",
        "Explain the methodology used in the document."
    ]);

    // Execution State
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (eventId) {
            fetchTeams();
        }
    }, [eventId]);

    // When team changes, try to find their submission endpoint
    useEffect(() => {
        if (selectedTeamId) {
            fetchTeamSubmission(selectedTeamId);
        } else {
            setTeamEndpoint('');
        }
    }, [selectedTeamId]);

    const fetchTeams = async () => {
        setLoadingTeams(true);
        try {
            // Fetch teams for this event
            // Note: Adjust endpoint if your API differs
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
        // Try to auto-fill the endpoint from their submission
        try {
            const res = await fetch(`${API_BASE}/api/api_submissions?team_id=${teamId}&event_id=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    // Assuming the latest submission or the first one found
                    const submission = data[0];
                    if (submission.endpoint) {
                        setTeamEndpoint(submission.endpoint);
                    }
                } else {
                    setTeamEndpoint(''); // Reset if no submission found
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

    const handleEvaluate = async () => {
        if (!selectedTeamId) {
            toast({ title: "Select a Team", description: "Please select a team to evaluate.", variant: "destructive" });
            return;
        }
        if (!teamEndpoint) {
            toast({ title: "Missing Endpoint", description: "No API endpoint found for this team. Please enter one manually if available.", variant: "destructive" });
            return;
        }

        setEvaluating(true);
        setError(null);
        setResponse(null);

        const payload = {
            pdf_url: pdfUrl,
            questions: questions
        };

        try {
            const res = await fetch(teamEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            setResponse(data);

            if (!res.ok) {
                setError(`HTTP ${res.status}: ${res.statusText}`);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to connect to Team API");
        } finally {
            setEvaluating(false);
        }
    };

    const requestPreview = JSON.stringify({
        pdf_url: pdfUrl,
        questions: questions
    }, null, 2);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Configuration */}
            <div className="lg:col-span-1 space-y-6">
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-primary" />
                        <h3 className="font-display font-bold text-lg">Select Team</h3>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Team to Evaluate</label>
                        <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a team..." />
                            </SelectTrigger>
                            <SelectContent>
                                {loadingTeams ? (
                                    <div className="p-2 text-sm text-center text-muted-foreground">Loading...</div>
                                ) : teams.length === 0 ? (
                                    <div className="p-2 text-sm text-center text-muted-foreground">No teams found</div>
                                ) : (
                                    teams.map((team) => (
                                        <SelectItem key={team.id || team._id} value={team.id || team._id || ''}>
                                            {team.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Team API Endpoint</label>
                        <Input
                            value={teamEndpoint}
                            onChange={(e) => setTeamEndpoint(e.target.value)}
                            placeholder="https://..."
                            className="font-mono text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            extracted from submission or enter manually
                        </p>
                    </div>
                </div>

                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-accent" />
                        <h3 className="font-display font-bold text-lg">Test Case</h3>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">PDF URL</label>
                        <Input
                            value={pdfUrl}
                            onChange={(e) => setPdfUrl(e.target.value)}
                            className="font-mono text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-muted-foreground">Questions</label>
                            <Button variant="ghost" size="sm" onClick={handleAddQuestion} className="h-6 w-6 p-0">
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {questions.map((q, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input
                                        value={q}
                                        onChange={(e) => handleQuestionChange(i, e.target.value)}
                                        className="text-sm h-8"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                        onClick={() => handleRemoveQuestion(i)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        variant="default"
                        onClick={handleEvaluate}
                        disabled={evaluating || !selectedTeamId}
                    >
                        {evaluating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Running Test...
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Run Evaluation
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Right Column: Execution & Results */}
            <div className="lg:col-span-2 space-y-6">
                <div className="glass-card p-0 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-3 border-b border-border/50 bg-muted/20 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="font-display font-bold text-sm">Evaluation Result</span>
                            {response && <Badge variant="default" className="bg-success text-success-foreground">Completed</Badge>}
                            {error && <Badge variant="destructive">Error</Badge>}
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>Target: <code className="bg-black/20 px-1 rounded">{selectedTeamId || 'None'}</code></span>
                        </div>
                    </div>

                    <div className="grid grid-rows-2 h-full">
                        {/* Request View */}
                        <div className="row-span-1 border-b border-border/50 flex flex-col min-h-0">
                            <div className="px-3 py-1 bg-black/10 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Request Payload</div>
                            <div className="flex-1 p-4 bg-black/20 overflow-auto custom-scrollbar">
                                <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">
                                    {requestPreview}
                                </pre>
                            </div>
                        </div>

                        {/* Response View */}
                        <div className="row-span-1 flex flex-col min-h-0 bg-black/10">
                            <div className="px-3 py-1 bg-black/10 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Response Output</div>
                            <div className="flex-1 p-4 overflow-auto custom-scrollbar relative">
                                {evaluating ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                                        <p className="text-xs text-muted-foreground">Waiting for team API response...</p>
                                    </div>
                                ) : error ? (
                                    <div className="text-destructive p-2 text-xs font-mono">
                                        <p className="font-bold">Execution Failed:</p>
                                        <p>{error}</p>
                                    </div>
                                ) : response ? (
                                    <pre className="text-xs font-mono text-success-foreground/90 whitespace-pre-wrap">
                                        {JSON.stringify(response, null, 2)}
                                    </pre>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground opacity-50">
                                        <p className="text-sm">Run evaluation to see results</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

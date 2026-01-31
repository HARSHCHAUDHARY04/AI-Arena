import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Play,
    Plus,
    Trash2,
    FileText,
    Server,
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_BASE } from '@/integrations/mongo/client';

export function ApiTestSection() {
    const [apiUrl, setApiUrl] = useState('https://your-server.com/aibattle');
    const [pdfUrl, setPdfUrl] = useState('https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-12.pdf');
    const [questions, setQuestions] = useState<string[]>([
        "What is the summary of section 2?",
        "List all key points from page 4.",
        "Explain the methodology used in the document."
    ]);
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handleTest = async () => {
        setLoading(true);
        setError(null);
        setResponse(null);

        const payload = {
            pdf_link: pdfUrl,
            questions: questions
        };

        try {
            // Use Backend Proxy to avoid CORS and get full details
            const res = await fetch(`${API_BASE}/api/proxy-test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint_url: apiUrl,
                    payload: payload
                }),
            });

            const data = await res.json();

            if (data.success) {
                setResponse(data.data);
            } else {
                setError(data.error || `HTTP Error ${data.status}`);
                // If we have partial data (e.g. error response JSON), show it
                if (data.data) {
                    setResponse(data.data);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to connect to API");
        } finally {
            setLoading(false);
        }
    };

    const requestPreview = JSON.stringify({
        pdf_link: pdfUrl,
        questions: questions
    }, null, 2);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
            <div className="space-y-6">
                {/* Configuration Card */}
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded bg-primary/10">
                            <Server className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-lg">Configuration</h3>
                            <p className="text-xs text-muted-foreground">Setup your test parameters</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">API Endpoint URL</label>
                        <Input
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            placeholder="https://..."
                            className="font-mono text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">PDF Document URL</label>
                        <Input
                            value={pdfUrl}
                            onChange={(e) => setPdfUrl(e.target.value)}
                            placeholder="https://..."
                            className="font-mono text-sm"
                        />
                    </div>
                </div>

                {/* Questions Card */}
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded bg-accent/10">
                                <FileText className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-lg">Test Questions</h3>
                                <p className="text-xs text-muted-foreground">{questions.length} questions added</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleAddQuestion} className="h-8">
                            <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {questions.map((q, i) => (
                            <div key={i} className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        value={q}
                                        onChange={(e) => handleQuestionChange(i, e.target.value)}
                                        placeholder={`Question ${i + 1}`}
                                        className="text-sm"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive shrink-0"
                                    onClick={() => handleRemoveQuestion(i)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <Button
                    className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                    onClick={handleTest}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Testing API...
                        </>
                    ) : (
                        <>
                            <Play className="h-5 w-5 mr-2" />
                            Run Test Request
                        </>
                    )}
                </Button>
            </div>

            <div className="space-y-6">
                {/* Request Preview */}
                <div className="glass-card p-0 overflow-hidden flex flex-col h-[300px]">
                    <div className="p-3 border-b border-border/50 bg-muted/20 flex justify-between items-center">
                        <span className="text-xs font-mono font-semibold text-muted-foreground">REQUEST PAYLOAD</span>
                        <Badge variant="outline" className="text-[10px] font-mono">JSON</Badge>
                    </div>
                    <div className="flex-1 p-4 bg-black/20 overflow-auto custom-scrollbar">
                        <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">
                            {requestPreview}
                        </pre>
                    </div>
                </div>

                {/* Response Preview */}
                <div className={`glass-card p-0 overflow-hidden flex flex-col h-[400px] border transition-colors ${error ? 'border-destructive/50' : response ? 'border-success/50' : 'border-border/50'
                    }`}>
                    <div className="p-3 border-b border-border/50 bg-muted/20 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-muted-foreground">RESPONSE OUTPUT</span>
                            {error && <Badge variant="destructive" className="text-[10px]">ERROR</Badge>}
                            {response && <Badge variant="default" className="bg-success text-success-foreground text-[10px]">SUCCESS</Badge>}
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono">JSON</Badge>
                    </div>
                    <div className="flex-1 p-4 bg-black/20 overflow-auto custom-scrollbar relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-destructive p-4 text-center">
                                <AlertCircle className="h-8 w-8 mb-2" />
                                <p className="font-semibold">Request Failed</p>
                                <p className="text-xs opacity-80 mt-1 break-all">{error}</p>
                                <p className="text-[10px] text-muted-foreground mt-4 max-w-xs">
                                    Note: Direct browser calls may fail due to CORS.
                                    Ensure your server allows requests from this origin,
                                    or use a tool like Postman for definitive testing.
                                </p>
                            </div>
                        ) : response ? (
                            <pre className="text-xs font-mono text-white whitespace-pre-wrap">
                                {JSON.stringify(response, null, 2)}
                            </pre>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                                <div className="h-12 w-12 rounded-full bg-muted/10 flex items-center justify-center mb-3">
                                    <Play className="h-5 w-5 opacity-50" />
                                </div>
                                <p className="text-sm">Ready to test</p>
                                <p className="text-xs opacity-50">Click "Run Test Request" to see results</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

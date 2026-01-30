import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import db, { API_BASE } from "@/integrations/mongo/client";
import { Send, Loader2, Zap, AlertTriangle, Play, Trophy } from "lucide-react";

type Json = any;

interface ApiSubmissionFormProps {
  teamId: string;
  eventId: string;
  currentEndpoint?: string;
  isLocked?: boolean;
  onSubmit?: () => void;
}

interface EvaluationScores {
  accuracy_score: number;
  latency_score: number;
  stability_score: number;
  penalty_points: number;
  total_score: number;
  details: {
    tests_passed: number;
    tests_failed: number;
    avg_latency_ms: number;
  };
}

export function ApiSubmissionForm({
  teamId,
  eventId,
  currentEndpoint = "",
  isLocked = false,
  onSubmit,
}: ApiSubmissionFormProps) {
  const [endpoint, setEndpoint] = useState(currentEndpoint);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationScores, setEvaluationScores] =
    useState<EvaluationScores | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(!!currentEndpoint);
  const { toast } = useToast();

  const validateEndpoint = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateEndpoint(endpoint)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid API endpoint URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const apiUrl = API_BASE;
      const res = await fetch(`${apiUrl}/api/submit-api`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          event_id: eventId,
          endpoint_url: endpoint,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit API endpoint");
      }

      if (data.success) {
        const isUpdate = data.action === "updated";
        toast({
          title: isUpdate ? "API Updated!" : "API Submitted!",
          description: isUpdate
            ? "Your endpoint has been updated. Use Evaluate to test it."
            : "Your endpoint has been registered. Use Evaluate to test it.",
        });

        setIsSubmitted(true);
        setEvaluationScores(null); // Clear previous evaluation scores on new submission
        onSubmit?.();
      } else {
        throw new Error(data.error || "Failed to submit API endpoint");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not save your API endpoint",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!validateEndpoint(endpoint)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid API endpoint URL",
        variant: "destructive",
      });
      return;
    }

    if (!isSubmitted) {
      toast({
        title: "Submit First",
        description: "Please submit your API endpoint before evaluating",
        variant: "destructive",
      });
      return;
    }

    setEvaluating(true);
    setEvaluationScores(null);

    try {
      const apiUrl = API_BASE;
      const res = await fetch(`${apiUrl}/api/evaluate-api`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          event_id: eventId,
          endpoint_url: endpoint,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");

      if (data?.success && data?.scores) {
        setEvaluationScores(data.scores);
        toast({
          title: "Evaluation Complete!",
          description: `Total Score: ${data.scores.total_score}/100`,
        });
      } else {
        throw new Error(data?.error || "Evaluation failed");
      }
    } catch (error) {
      console.error("Evaluation error:", error);
      toast({
        title: "Evaluation Failed",
        description:
          error instanceof Error ? error.message : "Could not evaluate API",
        variant: "destructive",
      });
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Zap className="h-6 w-6 text-primary" />
        <h2 className="font-display font-bold text-xl">API Submission</h2>
      </div>

      {isLocked && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 mb-4">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-sm text-warning">
            Submissions are locked. Competition has started.
          </span>
        </div>
      )}

      <div className="space-y-4">
        {/* API Contract Info */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm font-medium text-foreground mb-2">
            API Contract:
          </p>
          <div className="font-mono text-xs text-muted-foreground space-y-1">
            <p>
              <span className="text-primary">Request:</span>{" "}
              {'{ "input": "test_data" }'}
            </p>
            <p>
              <span className="text-accent">Response:</span>{" "}
              {'{ "output": "predicted_result" }'}
            </p>
          </div>
        </div>

        {/* Endpoint Input */}
        <div className="space-y-2">
          <Label htmlFor="endpoint">API Endpoint URL</Label>
          <Input
            id="endpoint"
            type="url"
            placeholder="https://your-api.com/predict"
            value={endpoint}
            onChange={(e) => {
              setEndpoint(e.target.value);
              if (e.target.value !== currentEndpoint) {
                setIsSubmitted(false);
                setEvaluationScores(null);
              }
            }}
            disabled={isLocked}
            className="font-mono"
          />
        </div>

        {/* Evaluation Scores */}
        {evaluationScores && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="p-4 rounded-lg border bg-primary/10 border-primary/30"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="font-medium text-primary">
                Evaluation Results
              </span>
              <span className="ml-auto text-lg font-display font-bold text-primary">
                {evaluationScores.total_score}/100
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 rounded bg-background/50">
                <p className="text-muted-foreground text-xs">Accuracy</p>
                <p className="font-semibold">
                  {evaluationScores.accuracy_score}%
                </p>
              </div>
              <div className="p-2 rounded bg-background/50">
                <p className="text-muted-foreground text-xs">Latency</p>
                <p className="font-semibold">
                  {evaluationScores.latency_score}%
                </p>
              </div>
              <div className="p-2 rounded bg-background/50">
                <p className="text-muted-foreground text-xs">Stability</p>
                <p className="font-semibold">
                  {evaluationScores.stability_score}%
                </p>
              </div>
              <div className="p-2 rounded bg-background/50">
                <p className="text-muted-foreground text-xs">Penalties</p>
                <p className="font-semibold text-destructive">
                  -{evaluationScores.penalty_points}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
              Tests: {evaluationScores.details.tests_passed}/
              {evaluationScores.details.tests_passed +
                evaluationScores.details.tests_failed}{" "}
              passed | Avg latency: {evaluationScores.details.avg_latency_ms}ms
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={handleSubmit}
            disabled={!endpoint || loading || isLocked}
            className="flex-1 min-w-[120px]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSubmitted ? "Resubmit" : "Submit"}
          </Button>
          <Button
            variant="accent"
            onClick={handleEvaluate}
            disabled={!isSubmitted || evaluating || isLocked}
            className="flex-1 min-w-[120px]"
          >
            {evaluating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Evaluate
          </Button>
        </div>

        {/* Helper text */}
        {!isSubmitted && endpoint && (
          <p className="text-xs text-muted-foreground text-center">
            Submit your endpoint first, then use Evaluate to test it
          </p>
        )}
      </div>
    </motion.div>
  );
}

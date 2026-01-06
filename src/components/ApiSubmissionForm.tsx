import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Clock,
  Zap,
  AlertTriangle
} from 'lucide-react';

interface ApiSubmissionFormProps {
  teamId: string;
  eventId: string;
  currentEndpoint?: string;
  isLocked?: boolean;
  onSubmit?: () => void;
}

interface TestResult {
  success: boolean;
  response?: unknown;
  latency?: number;
  error?: string;
}

export function ApiSubmissionForm({ 
  teamId, 
  eventId, 
  currentEndpoint = '', 
  isLocked = false,
  onSubmit 
}: ApiSubmissionFormProps) {
  const [endpoint, setEndpoint] = useState(currentEndpoint);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const validateEndpoint = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleTest = async () => {
    if (!validateEndpoint(endpoint)) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid API endpoint URL',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const startTime = Date.now();

    try {
      // Sample test request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: 'test_sample_data' }),
      });

      const latency = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response format
      if (!data.hasOwnProperty('output')) {
        setTestResult({
          success: false,
          error: 'Response must contain "output" field. Expected: { "output": "predicted_result" }',
          latency,
        });
        return;
      }

      setTestResult({
        success: true,
        response: data,
        latency,
      });

      toast({
        title: 'Test Successful!',
        description: `API responded in ${latency}ms`,
      });
    } catch (error) {
      const latency = Date.now() - startTime;
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reach endpoint',
        latency,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateEndpoint(endpoint)) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid API endpoint URL',
        variant: 'destructive',
      });
      return;
    }

    if (!testResult?.success) {
      toast({
        title: 'Test Required',
        description: 'Please test your API endpoint before submitting',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Check if submission already exists
      const { data: existing } = await supabase
        .from('api_submissions')
        .select('id')
        .eq('team_id', teamId)
        .eq('event_id', eventId)
        .single();

      if (existing) {
        // Update existing submission
        const { error } = await supabase
          .from('api_submissions')
          .update({
            endpoint_url: endpoint,
            is_validated: true,
            last_test_at: new Date().toISOString(),
            last_test_result: testResult,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new submission
        const { error } = await supabase
          .from('api_submissions')
          .insert({
            team_id: teamId,
            event_id: eventId,
            endpoint_url: endpoint,
            is_validated: true,
            last_test_at: new Date().toISOString(),
            last_test_result: testResult as unknown as Record<string, unknown>,
          });

        if (error) throw error;
      }

      toast({
        title: 'API Submitted!',
        description: 'Your endpoint has been registered for the competition',
      });

      onSubmit?.();
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission Failed',
        description: 'Could not save your API endpoint',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
          <p className="text-sm font-medium text-foreground mb-2">API Contract:</p>
          <div className="font-mono text-xs text-muted-foreground space-y-1">
            <p><span className="text-primary">Request:</span> {'{ "input": "test_data" }'}</p>
            <p><span className="text-accent">Response:</span> {'{ "output": "predicted_result" }'}</p>
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
            onChange={(e) => setEndpoint(e.target.value)}
            disabled={isLocked}
            className="font-mono"
          />
        </div>

        {/* Test Result */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`p-4 rounded-lg border ${
              testResult.success 
                ? 'bg-success/10 border-success/30' 
                : 'bg-destructive/10 border-destructive/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span className={`font-medium ${testResult.success ? 'text-success' : 'text-destructive'}`}>
                {testResult.success ? 'Test Passed' : 'Test Failed'}
              </span>
              {testResult.latency && (
                <span className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {testResult.latency}ms
                </span>
              )}
            </div>
            
            {testResult.success && testResult.response && (
              <pre className="text-xs font-mono bg-background/50 p-2 rounded overflow-x-auto">
                {JSON.stringify(testResult.response, null, 2)}
              </pre>
            )}
            
            {!testResult.success && testResult.error && (
              <p className="text-sm text-destructive">{testResult.error}</p>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={!endpoint || testing || isLocked}
            className="flex-1"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Test API
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!testResult?.success || loading || isLocked}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

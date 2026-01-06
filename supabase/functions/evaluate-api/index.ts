import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvaluationResult {
  accuracy_score: number;
  latency_score: number;
  stability_score: number;
  penalty_points: number;
  total_score: number;
  details: {
    tests_passed: number;
    tests_failed: number;
    avg_latency_ms: number;
    timeout_count: number;
    invalid_response_count: number;
  };
}

interface TestCase {
  input: string;
  expected_output: string;
  weight: number;
}

// Sample test cases - in production, these would come from the event's dataset
const getTestCases = (): TestCase[] => [
  { input: "test_data_1", expected_output: "result_1", weight: 1 },
  { input: "test_data_2", expected_output: "result_2", weight: 1 },
  { input: "test_data_3", expected_output: "result_3", weight: 1 },
  { input: "test_data_4", expected_output: "result_4", weight: 1 },
  { input: "test_data_5", expected_output: "result_5", weight: 1 },
];

async function testApiEndpoint(
  endpointUrl: string,
  input: string,
  timeout: number = 5000
): Promise<{ success: boolean; output?: string; latency: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    if (!response.ok) {
      return { success: false, latency, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    
    if (!data.output) {
      return { success: false, latency, error: 'Invalid response format: missing output field' };
    }

    return { success: true, output: data.output, latency };
  } catch (err) {
    const latency = Date.now() - startTime;
    const error = err as Error;
    if (error.name === 'AbortError') {
      return { success: false, latency, error: 'Timeout' };
    }
    return { success: false, latency, error: error.message };
  }
}

function calculateScores(
  testResults: Array<{ passed: boolean; latency: number; error?: string }>,
  testCases: TestCase[]
): EvaluationResult {
  const totalWeight = testCases.reduce((sum, tc) => sum + tc.weight, 0);
  let passedWeight = 0;
  let totalLatency = 0;
  let timeoutCount = 0;
  let invalidResponseCount = 0;
  let testsPassed = 0;
  let testsFailed = 0;

  testResults.forEach((result, index) => {
    if (result.passed) {
      passedWeight += testCases[index].weight;
      testsPassed++;
    } else {
      testsFailed++;
      if (result.error === 'Timeout') {
        timeoutCount++;
      } else if (result.error?.includes('Invalid response')) {
        invalidResponseCount++;
      }
    }
    totalLatency += result.latency;
  });

  const avgLatency = testResults.length > 0 ? totalLatency / testResults.length : 0;

  // Calculate accuracy score (0-100)
  const accuracy_score = (passedWeight / totalWeight) * 100;

  // Calculate latency score (0-100, lower latency = higher score)
  // Target: < 200ms = 100 points, > 5000ms = 0 points
  const latency_score = Math.max(0, Math.min(100, 100 - ((avgLatency - 200) / 48)));

  // Calculate stability score based on consistency
  const successRate = testsPassed / testResults.length;
  const stability_score = successRate * 100;

  // Calculate penalties
  const penalty_points = (timeoutCount * 5) + (invalidResponseCount * 10);

  // Calculate total score
  const total_score = Math.max(0, 
    (accuracy_score * 0.5) + 
    (latency_score * 0.25) + 
    (stability_score * 0.25) - 
    penalty_points
  );

  return {
    accuracy_score: Math.round(accuracy_score * 100) / 100,
    latency_score: Math.round(latency_score * 100) / 100,
    stability_score: Math.round(stability_score * 100) / 100,
    penalty_points: Math.round(penalty_points * 100) / 100,
    total_score: Math.round(total_score * 100) / 100,
    details: {
      tests_passed: testsPassed,
      tests_failed: testsFailed,
      avg_latency_ms: Math.round(avgLatency),
      timeout_count: timeoutCount,
      invalid_response_count: invalidResponseCount,
    },
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { submission_id, event_id, team_id, endpoint_url, level_id } = await req.json();

    console.log(`Starting evaluation for team ${team_id} on event ${event_id}`);
    console.log(`Endpoint URL: ${endpoint_url}`);

    // Get test cases (in production, fetch from event's dataset)
    const testCases = getTestCases();
    const testResults: Array<{ passed: boolean; latency: number; error?: string }> = [];

    // Run tests
    for (const testCase of testCases) {
      console.log(`Testing with input: ${testCase.input}`);
      const result = await testApiEndpoint(endpoint_url, testCase.input);
      
      const passed = result.success && result.output === testCase.expected_output;
      testResults.push({
        passed,
        latency: result.latency,
        error: result.error,
      });
      
      console.log(`Result: ${passed ? 'PASSED' : 'FAILED'}, Latency: ${result.latency}ms`);
    }

    // Calculate scores
    const scores = calculateScores(testResults, testCases);
    console.log('Evaluation scores:', scores);

    // Update or insert score in database
    const { data: existingScore } = await supabase
      .from('scores')
      .select('id')
      .eq('team_id', team_id)
      .eq('event_id', event_id)
      .maybeSingle();

    if (existingScore) {
      await supabase
        .from('scores')
        .update({
          accuracy_score: scores.accuracy_score,
          latency_score: scores.latency_score,
          stability_score: scores.stability_score,
          penalty_points: scores.penalty_points,
          total_score: scores.total_score,
          level_id: level_id || null,
          evaluated_at: new Date().toISOString(),
        })
        .eq('id', existingScore.id);
    } else {
      await supabase.from('scores').insert({
        team_id,
        event_id,
        accuracy_score: scores.accuracy_score,
        latency_score: scores.latency_score,
        stability_score: scores.stability_score,
        penalty_points: scores.penalty_points,
        total_score: scores.total_score,
        level_id: level_id || null,
      });
    }

    // Update submission with test results
    if (submission_id) {
      await supabase
        .from('api_submissions')
        .update({
          last_test_at: new Date().toISOString(),
          last_test_result: scores.details as unknown as Record<string, unknown>,
          is_validated: scores.accuracy_score > 0,
        })
        .eq('id', submission_id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      scores,
      message: 'Evaluation completed successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const error = err as Error;
    console.error('Evaluation error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

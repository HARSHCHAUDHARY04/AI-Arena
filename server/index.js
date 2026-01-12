require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'ai_arena';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

let db;
async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log('Connected to MongoDB', MONGODB_URI);
}

// Auth: login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const user = await db.collection('users').findOne({ email });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Fetch user role
    const userRole = await db.collection('user_roles').findOne({ user_id: user._id.toString() });
    const role = userRole?.role || 'participant';

    res.json({ token, user: { id: user._id.toString(), email: user.email, role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Admin create user
app.post('/auth/admin-create-user', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const existing = await db.collection('users').findOne({ email });
    if (existing) return res.status(400).json({ error: 'user exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.collection('users').insertOne({ email, passwordHash, createdAt: new Date() });
    const userId = result.insertedId.toString();
    if (role) {
      await db.collection('user_roles').insertOne({ user_id: userId, role, created_at: new Date() });
    }
    res.json({ id: userId, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Generic REST for collections (list/select/create/update/delete)
app.get('/api/:collection', async (req, res) => {
  const { collection } = req.params;
  const q = { ...req.query };
  // simple eq handling: ?eq_field=value  or ?field=value
  try {
    const cursor = db.collection(collection).find(q);
    const results = await cursor.toArray();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  try {
    const doc = await db.collection(collection).findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ error: 'not found' });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/:collection', async (req, res) => {
  const { collection } = req.params;
  const body = req.body;
  try {
    const result = await db.collection(collection).insertOne({ ...body, createdAt: new Date() });
    res.json({ id: result.insertedId.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.put('/api/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const body = req.body;
  try {
    const result = await db.collection(collection).updateOne({ _id: new ObjectId(id) }, { $set: body });
    res.json({ matched: result.matchedCount, modified: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.delete('/api/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  try {
    const result = await db.collection(collection).deleteOne({ _id: new ObjectId(id) });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Helper: Test API endpoint
async function testApiEndpoint(endpointUrl, input, timeout = 5000) {
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
    if (!response.ok) return { success: false, latency, error: `HTTP ${response.status}` };
    const data = await response.json();
    if (!data.output) return { success: false, latency, error: 'Invalid response format' };
    return { success: true, output: data.output, latency };
  } catch (err) {
    const latency = Date.now() - startTime;
    if (err.name === 'AbortError') return { success: false, latency, error: 'Timeout' };
    return { success: false, latency, error: err.message };
  }
}

function calculateScores(testResults, testCases) {
  const totalWeight = testCases.reduce((sum, tc) => sum + tc.weight, 0);
  let passedWeight = 0, totalLatency = 0, timeoutCount = 0, invalidResponseCount = 0;
  let testsPassed = 0, testsFailed = 0;
  testResults.forEach((result, index) => {
    if (result.passed) {
      passedWeight += testCases[index].weight;
      testsPassed++;
    } else {
      testsFailed++;
      if (result.error === 'Timeout') timeoutCount++;
      else if (result.error?.includes('Invalid')) invalidResponseCount++;
    }
    totalLatency += result.latency;
  });
  const avgLatency = testResults.length > 0 ? totalLatency / testResults.length : 0;
  const accuracy_score = (passedWeight / totalWeight) * 100;
  const latency_score = Math.max(0, Math.min(100, 100 - ((avgLatency - 200) / 48)));
  const successRate = testResults.length > 0 ? testsPassed / testResults.length : 0;
  const stability_score = successRate * 100;
  const penalty_points = (timeoutCount * 5) + (invalidResponseCount * 10);
  const total_score = Math.max(0,
    (accuracy_score * 0.5) + (latency_score * 0.25) + (stability_score * 0.25) - penalty_points
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

// Evaluate API endpoint (migrated from Supabase edge function)
app.post('/api/evaluate-api', async (req, res) => {
  const { team_id, event_id, endpoint_url, submission_id, level_id } = req.body;
  if (!team_id || !event_id || !endpoint_url) {
    return res.status(400).json({ error: 'team_id, event_id, endpoint_url required' });
  }
  try {
    const testCases = [
      { input: 'test_data_1', expected_output: 'result_1', weight: 1 },
      { input: 'test_data_2', expected_output: 'result_2', weight: 1 },
      { input: 'test_data_3', expected_output: 'result_3', weight: 1 },
      { input: 'test_data_4', expected_output: 'result_4', weight: 1 },
      { input: 'test_data_5', expected_output: 'result_5', weight: 1 },
    ];
    const testResults = [];
    for (const testCase of testCases) {
      const result = await testApiEndpoint(endpoint_url, testCase.input);
      const passed = result.success && result.output === testCase.expected_output;
      testResults.push({ passed, latency: result.latency, error: result.error });
    }
    const scores = calculateScores(testResults, testCases);
    const existingScore = await db.collection('scores').findOne({ team_id, event_id });
    if (existingScore) {
      await db.collection('scores').updateOne({ _id: existingScore._id }, {
        $set: { ...scores, level_id: level_id || null, evaluated_at: new Date() }
      });
    } else {
      await db.collection('scores').insertOne({
        team_id, event_id, ...scores, level_id: level_id || null, evaluated_at: new Date()
      });
    }
    if (submission_id) {
      await db.collection('api_submissions').updateOne({ _id: new ObjectId(submission_id) }, {
        $set: {
          last_test_at: new Date(),
          last_test_result: scores.details,
          is_validated: scores.accuracy_score > 0
        }
      });
    }
    res.json({ success: true, scores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'evaluation failed' });
  }
});

// Analytics: Mock Score History
app.get('/api/score-history', async (req, res) => {
  try {
    const { event_id } = req.query;
    if (!event_id) return res.status(400).json({ error: 'event_id required' });

    // Fetch real current scores
    const topScores = await db.collection('scores')
      .find({ event_id })
      .sort({ total_score: -1 })
      .limit(5)
      .toArray();

    // Get team names
    const teamIds = topScores.map(s => new ObjectId(s.team_id));
    const teams = await db.collection('teams').find({ _id: { $in: teamIds } }).toArray();
    const teamMap = {};
    teams.forEach(t => teamMap[t._id.toString()] = t.name);

    // Generate mock history: 5 rounds
    const rounds = ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Current'];
    const data = rounds.map((round, rIndex) => {
      const point = { name: round };
      topScores.forEach(score => {
        const teamName = teamMap[score.team_id] || 'Unknown';
        // Random progression to reach final score
        if (rIndex === 4) {
          point[teamName] = score.total_score;
        } else {
          // Progress roughly linearly with some noise
          const factor = (rIndex + 1) / 5;
          point[teamName] = Math.max(0, Math.floor(score.total_score * factor * (0.9 + Math.random() * 0.2)));
        }
      });
      return point;
    });

    res.json({ data, topTeams: topScores.map(s => teamMap[s.team_id] || 'Unknown') });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Announcements
app.get('/api/announcements', async (req, res) => {
  try {
    // Return last 5 active announcements, newest first
    const announcements = await db.collection('announcements')
      .find({})
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();
    res.json(announcements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/announcements', async (req, res) => {
  const { message, type, created_by } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  try {
    const result = await db.collection('announcements').insertOne({
      message,
      type: type || 'info', // info, warning, success
      created_by,
      created_at: new Date()
    });
    res.json({ id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

const PORT = process.env.PORT || 4000;
main().then(() => {
  app.listen(PORT, () => console.log('Server listening on', PORT));
}).catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});

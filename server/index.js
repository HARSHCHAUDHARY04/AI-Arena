require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const tournamentService = require("./tournamentService");
const { getRoundConfig } = require("./Tournamentrounds.constants");

const app = express();
app.use(
  cors({
    origin: [
      "https://ai-arena-sepia.vercel.app",
      "https://www.aibattlearena.in",
      "https://aibattlearena.in",
      "http://localhost:5173",
      "http://localhost:4173",
      "http://localhost:8080",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use("/pdfs", express.static("pdfs"));

// Serve round 2 PDF at root as per user request
app.get("/round2.pdf", (req, res) => {
  res.sendFile(path.join(__dirname, "pdfs", "round2.pdf"));
});

// Serve round 4 PDF at root as well
app.get("/round4.pdf", (req, res) => {
  res.sendFile(path.join(__dirname, "pdfs", "Franz_Kafka_The_Trial.pdf"));
});

// Serve round 5 PDF at root
app.get("/round5.pdf", (req, res) => {
  res.sendFile(path.join(__dirname, "pdfs", "Level5.pdf"));
});

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "ai_arena";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

let db;
async function ensureSingleEvent() {
  const title = "AI Battle Arena 2026";
  const existing = await db.collection("events").findOne({ title });
  if (!existing) {
    console.log("Seeding single event:", title);
    await db.collection("events").insertOne({
      title,
      description: "The official AI Battle Arena 2026 competition. Main event.",
      problem_statement: "Build an AI Agent to answer questions from a PDF.",
      rules: "Standard Rules apply.",
      api_contract: "POST /aibattle",
      status: "active",
      submissions_locked: false,
      scoreboard_approved: false, // Default hidden
      created_at: new Date(),
      is_system_event: true,
    });
  } else {
    console.log("Single event found:", title);
  }
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log("Connected to MongoDB", MONGODB_URI);
  await ensureSingleEvent();
}

// Auth Helper
async function getUserRole(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return "participant";

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRole = await db
      .collection("user_roles")
      .findOne({ user_id: decoded.sub });
    return userRole?.role || "participant";
  } catch (err) {
    return "participant";
  }
}

// Auth: login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });
  try {
    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(401).json({ error: "invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash || "");
    if (!ok) return res.status(401).json({ error: "invalid credentials" });
    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Fetch user role
    const userRole = await db
      .collection("user_roles")
      .findOne({ user_id: user._id.toString() });
    const role = userRole?.role || "participant";

    res.json({
      token,
      user: { id: user._id.toString(), email: user.email, role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// [NEW] Change Password Endpoint
app.post("/auth/change-password", async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify old password
    const ok = await bcrypt.compare(oldPassword, user.passwordHash || "");
    if (!ok) return res.status(401).json({ error: "Incorrect old password" });

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update both hash and plain text (as per user requirement to store plain)
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash: newPasswordHash,
          plain_password: newPassword, // Update the plain reference too
          updated_at: new Date(),
        },
      },
    );

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin create user
app.post("/auth/admin-create-user", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });
  try {
    const existing = await db.collection("users").findOne({ email });
    if (existing) return res.status(400).json({ error: "user exists" });
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db
      .collection("users")
      .insertOne({ email, passwordHash, createdAt: new Date() });
    const userId = result.insertedId.toString();
    if (role) {
      await db
        .collection("user_roles")
        .insertOne({ user_id: userId, role, created_at: new Date() });
    }
    res.json({ id: userId, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// [NEW] Enhanced Team Members API (with User Details)
app.get("/api/team_members", async (req, res) => {
  const { user_id, team_id } = req.query;
  try {
    const query = {};
    if (user_id) query.user_id = user_id;
    if (team_id) query.team_id = team_id;

    if (Object.keys(query).length === 0) {
      // Just return all if no filter (or limit?)
      const results = await db
        .collection("team_members")
        .find({})
        .limit(100)
        .toArray();
      return res.json(results);
    }

    // Pipeline to join users
    const pipeline = [
      { $match: query },
      {
        $addFields: {
          userObjectId: { $toObjectId: "$user_id" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userObjectId",
          foreignField: "_id",
          as: "user_details",
        },
      },
      {
        $unwind: {
          path: "$user_details",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    const results = await db
      .collection("team_members")
      .aggregate(pipeline)
      .toArray();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// Generic REST routes moved to bottom to prevent conflicts with specific API routes

// Helper: Test API endpoint
async function testApiEndpoint(endpointUrl, input, timeout = 60000) {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420"
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    if (!response.ok)
      return { success: false, latency, error: `HTTP ${response.status}` };
    const data = await response.json();
    if (!data.output)
      return { success: false, latency, error: "Invalid response format" };
    return { success: true, output: data.output, latency };
  } catch (err) {
    const latency = Date.now() - startTime;
    if (err.name === "AbortError")
      return { success: false, latency, error: "Timeout" };
    return { success: false, latency, error: err.message };
  }
}

function calculateScores(testResults, testCases) {
  // Weights matching Rulebook
  // Accuracy: 40%, Relevance: 25%, Speed: 20%, Stability: 10%, Format: 5%

  let passedWeight = 0;
  let totalLatency = 0;
  let validJsonCount = 0;
  let successCount = 0;
  const totalWeight = testCases.reduce((sum, tc) => sum + tc.weight, 0);

  testResults.forEach((result, index) => {
    // Stability: Did the API return a 200 OK?
    if (result.success) {
      successCount++;
    }

    // Format: Did the API return the expected JSON structure?
    // testApiEndpoint checks for data.output, so if result.success is true implies valid JSON logic was passed there,
    // but strict check: !result.error?.includes('Invalid')
    if (result.success && !result.error) {
      validJsonCount++;
    }

    // Accuracy (and acting Relevance proxy): Did it match expected output?
    if (result.passed) {
      passedWeight += testCases[index].weight;
    }

    totalLatency += result.latency;
  });

  const totalTests = testResults.length;
  if (totalTests === 0)
    return {
      accuracy_score: 0,
      relevance_score: 0,
      speed_score: 0,
      stability_score: 0,
      format_score: 0,
      total_score: 0,
      details: {},
    };

  // 1. Accuracy (40%)
  // If Malformed JSON (0 format score), total score should be 0 per rule?
  // "Any malformed JSON -> score = 0" applies to the specific request usually, or global?
  // Assuming if ANY is malformed, risk of 0, but usually calculated per-request averages.
  // Rule: "Any malformed JSON -> score = 0" implies strict disqualification for that entry.
  // We will implement strict penalty: if validJsonCount < totalTests, maybe failing?
  // For now, calculating linear scores.

  const accuracy_score = (passedWeight / totalWeight) * 100;

  // 2. Relevance (25%) - Proxying via Accuracy for automated tests
  const relevance_score = accuracy_score;

  // 3. Speed Score (20%)
  // Formula: max(0, 100 - response_time_ms / 100)
  const avgLatency = totalLatency / totalTests;
  const speed_score = Math.max(0, 100 - avgLatency / 100);

  // 4. Stability (10%)
  const stability_score = (successCount / totalTests) * 100;

  // 5. Format Score (5%)
  const format_score = (validJsonCount / totalTests) * 100;

  // Weighted Total
  // (0.40 * acc) + (0.25 * rel) + (0.20 * speed) + (0.10 * stab) + (0.05 * fmt)
  let total_score =
    accuracy_score * 0.4 +
    relevance_score * 0.25 +
    speed_score * 0.2 +
    stability_score * 0.1 +
    format_score * 0.05;

  // Critical Failure override
  if (format_score < 100) {
    // If "Any malformed JSON -> score = 0" is strictly interpreted:
    // total_score = 0;
    // We'll leave it as weighted for now to allow partial credit unless specified otherwise by user.
    // User said: "Any malformed JSON -> score = 0".
    // Let's apply strict rule: if any request failed JSON parsing, total score is 0.
    if (validJsonCount < totalTests) total_score = 0;
  }

  return {
    accuracy_score: Math.round(accuracy_score * 100) / 100,
    relevance_score: Math.round(relevance_score * 100) / 100,
    speed_score: Math.round(speed_score * 100) / 100,
    stability_score: Math.round(stability_score * 100) / 100,
    format_score: Math.round(format_score * 100) / 100,
    total_score: Math.round(total_score * 100) / 100,
    details: {
      tests_passed: passedWeight, // approximated for details
      tests_total: totalTests,
      avg_latency_ms: Math.round(avgLatency),
    },
  };
}

// Evaluate API endpoint (migrated from Supabase edge function)
app.post("/api/evaluate-api", async (req, res) => {
  const { team_id, event_id, endpoint_url, submission_id, level_id } = req.body;
  if (!team_id || !event_id || !endpoint_url) {
    return res
      .status(400)
      .json({ error: "team_id, event_id, endpoint_url required" });
  }
  try {
    // Get round configuration (default to Round 1 if not specified)
    const activeRound = level_id ? parseInt(level_id) : 1;
    const roundConfig = getRoundConfig(activeRound);

    // Use questions from the round config instead of placeholders
    const testCases = roundConfig.questions.map((q, idx) => ({
      input: q,
      expected_output: roundConfig.groundTruths[idx],
      weight: 1
    }));

    const testResults = [];
    for (const testCase of testCases) {
      // For the quick/auto eval, we pass the PDF link as part of the context if needed
      // but the current testApiEndpoint only takes 'input'. 
      // We'll wrap it to match what the participant dashboard expects.
      const result = await testApiEndpoint(endpoint_url, {
        pdf_url: roundConfig.pdf_url,
        questions: [testCase.input]
      });

      // Note: result.output might be an array if the team API returns [answer]
      const actualOutput = Array.isArray(result.output) ? result.output[0] : result.output;

      const passed = result.success && actualOutput === testCase.expected_output;
      testResults.push({
        passed,
        latency: result.latency,
        error: result.error,
      });
    }
    const scores = calculateScores(testResults, testCases);
    const existingScore = await db
      .collection("scores")
      .findOne({ team_id, event_id });
    if (existingScore) {
      await db.collection("scores").updateOne(
        { _id: existingScore._id },
        {
          $set: {
            ...scores,
            level_id: level_id || null,
            evaluated_at: new Date(),
          },
          dataset_meta: {
            pdf_url: roundConfig.pdf_url,
            questions: roundConfig.questions || []
          }
        },
      );
    } else {
      await db.collection("scores").insertOne({
        team_id,
        event_id,
        ...scores,
        level_id: level_id || null,
        evaluated_at: new Date(),
      });
    }
    if (submission_id) {
      await db.collection("api_submissions").updateOne(
        { _id: new ObjectId(submission_id) },
        {
          $set: {
            last_test_at: new Date(),
            last_test_result: scores.details,
            is_validated: scores.accuracy_score > 0,
          },
        },
      );
    }
    res.json({ success: true, scores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "evaluation failed" });
  }
});

// Submit or Update API Endpoint
app.post("/api/submit-api", async (req, res) => {
  const { team_id, event_id, endpoint_url } = req.body;
  if (!team_id || !event_id || !endpoint_url) {
    return res
      .status(400)
      .json({ error: "team_id, event_id, endpoint_url required" });
  }

  try {
    // Check if submission already exists
    const existing = await db
      .collection("api_submissions")
      .findOne({ team_id, event_id });

    if (existing) {
      // Update existing submission
      const result = await db.collection("api_submissions").updateOne(
        { _id: existing._id },
        {
          $set: {
            endpoint_url: endpoint_url,
            is_validated: false,
            last_test_at: new Date().toISOString(),
            last_test_result: null,
          },
        },
      );

      res.json({
        success: true,
        action: "updated",
        message: "API endpoint updated successfully",
        submission: {
          _id: existing._id,
          team_id,
          event_id,
          endpoint_url,
          is_validated: false,
          last_test_at: new Date().toISOString(),
          last_test_result: null,
        },
      });
    } else {
      // Create new submission
      const submission = {
        team_id,
        event_id,
        endpoint_url,
        is_validated: false,
        last_test_at: new Date().toISOString(),
        last_test_result: null,
        createdAt: new Date(),
      };

      const result = await db
        .collection("api_submissions")
        .insertOne(submission);

      res.json({
        success: true,
        action: "created",
        message: "API endpoint submitted successfully",
        submission: {
          _id: result.insertedId,
          ...submission,
        },
      });
    }
  } catch (err) {
    console.error("API submission error:", err);
    res.status(500).json({ error: "Failed to submit API endpoint" });
  }
});

// Analytics: Mock Score History
app.get("/api/score-history", async (req, res) => {
  try {
    const { event_id } = req.query;
    if (!event_id) return res.status(400).json({ error: "event_id required" });

    // Fetch real current scores
    const topScores = await db
      .collection("scores")
      .find({ event_id })
      .sort({ total_score: -1 })
      .limit(5)
      .toArray();

    // Get team names
    const teamIds = topScores.map((s) => new ObjectId(s.team_id));
    const teams = await db
      .collection("teams")
      .find({ _id: { $in: teamIds } })
      .toArray();
    const teamMap = {};
    teams.forEach((t) => (teamMap[t._id.toString()] = t.name));

    // Generate mock history: 5 rounds
    const rounds = ["Round 1", "Round 2", "Round 3", "Round 4", "Current"];
    const data = rounds.map((round, rIndex) => {
      const point = { name: round };
      topScores.forEach((score) => {
        const teamName = teamMap[score.team_id] || "Unknown";
        // Random progression to reach final score
        if (rIndex === 4) {
          point[teamName] = score.total_score;
        } else {
          // Progress roughly linearly with some noise
          const factor = (rIndex + 1) / 5;
          point[teamName] = Math.max(
            0,
            Math.floor(
              score.total_score * factor * (0.9 + Math.random() * 0.2),
            ),
          );
        }
      });
      return point;
    });

    res.json({
      data,
      topTeams: topScores.map((s) => teamMap[s.team_id] || "Unknown"),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// [NEW] Proxy Test Endpoint for Dashboard
app.post("/api/proxy-test", async (req, res) => {
  const { endpoint_url, payload } = req.body;
  if (!endpoint_url || !payload)
    return res.status(400).json({ error: "endpoint_url and payload required" });

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const response = await fetch(endpoint_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420"
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    // We want the RAW JSON response to show the user exactly what their API returned
    let responseData;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }
    }

    console.log(`Proxy Test: ${endpoint_url} -> Status ${response.status}`);

    let errorMsg = null;
    if (!response.ok) {
      if (typeof responseData === 'object' && responseData !== null) {
        errorMsg = responseData.error || responseData.message || (responseData.detail ? JSON.stringify(responseData.detail) : null);
      } else if (typeof responseData === 'string') {
        errorMsg = responseData.slice(0, 200);
      }
    }

    res.json({
      success: response.ok,
      status: response.status,
      data: responseData,
      error: errorMsg,
      latency,
    });
  } catch (err) {
    const latency = Date.now() - startTime;
    console.error("Proxy Test Failed:", err);
    res.json({
      success: false,
      status: 0,
      data: null,
      error: err.message,
      latency,
    });
  }
});

// [NEW] Batch Verify All Endpoints
app.post("/api/verify-all-endpoints", async (req, res) => {
  const { event_id } = req.body;
  if (!event_id) return res.status(400).json({ error: "event_id required" });

  try {
    const teams = await db.collection("teams").find({ event_id }).toArray();
    const results = [];

    // Parallel ping all teams
    await Promise.all(teams.map(async (team) => {
      const submission = await db.collection("api_submissions").findOne({
        team_id: team._id.toString(),
        event_id: event_id
      });

      if (!submission || !submission.endpoint_url) {
        results.push({
          team_id: team._id.toString(),
          team_name: team.name,
          status: 'missing',
          endpoint: null,
          latency: 0
        });
        return;
      }

      // Quick ping (no payload processing, just check if reachable)
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for bulk check

        const response = await fetch(submission.endpoint_url, {
          method: "OPTIONS", // Try OPTIONS or a HEAD request first
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        results.push({
          team_id: team._id.toString(),
          team_name: team.name,
          status: response.ok || response.status === 405 ? 'online' : 'offline', // 405 is fine for OPTIONS
          endpoint: submission.endpoint_url,
          latency: Date.now() - startTime
        });
      } catch (err) {
        results.push({
          team_id: team._id.toString(),
          team_name: team.name,
          status: 'offline',
          endpoint: submission.endpoint_url,
          error: err.message,
          latency: Date.now() - startTime
        });
      }
    }));

    res.json({ success: true, results });
  } catch (err) {
    console.error("Batch verification failed:", err);
    res.status(500).json({ error: "Batch verification failed" });
  }
});

// [NEW] Dataset Management
app.post("/api/rounds/:id/dataset", async (req, res) => {
  const { id } = req.params;
  const { dataset_name, dataset_description, pdf_url, questions } = req.body;
  if (!pdf_url || !questions)
    return res.status(400).json({ error: "pdf_url and questions required" });

  try {
    const round = await db
      .collection("rounds")
      .findOne({ _id: new ObjectId(id) });
    if (!round) return res.status(404).json({ error: "round not found" });
    if (round.dataset_locked)
      return res.status(403).json({ error: "dataset is locked" });

    await db.collection("rounds").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          dataset_name,
          dataset_description,
          dataset_meta: { pdf_url, questions }, // Store securely, not sending back to clients unless authorized
          dataset_locked: true, // Lock immediately as per specific rule "Once uploaded... Locked"
        },
      },
    );
    res.json({ success: true, message: "Dataset uploaded and locked" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// [NEW] Round Progression System
app.post("/api/rounds/advance", async (req, res) => {
  const { event_id, from_round_number } = req.body;
  // from_round_number: 1, 2, 3... transition to next.
  // if 0 or null -> Start event (Round 1 setup)

  try {
    if (!from_round_number || from_round_number === 0) {
      // Start Round 1: All 40 teams active
      // Just ensure all teams are 'active'
      await db
        .collection("teams")
        .updateMany(
          { event_id },
          { $set: { status: "active", shortlist_status: "shortlisted" } },
        );
      res.json({ message: "Event Started. All teams active for Round 1." });
      return;
    }

    // Logic for R1 -> R2 (Demo Round Transition)
    if (from_round_number === 1) {
      // Demo Round: Everyone qualifies for Round 2
      await db
        .collection("teams")
        .updateMany(
          { event_id },
          { $set: { status: "active", qualification: "Round 2 Qualified (from Demo)" } },
        );

      res.json({ message: "Demo Round Ended. All teams advanced to Round 2." });
    }
    // Logic for R2 -> R3 (Winner Bracket)
    else if (from_round_number === 2) {
      // Only active teams participated.
      // Top performers -> R2 Winners. Bottom -> R2 Losers.
      // Let's say Top 10 are Winners, Bottom 10 Losers? Rulebook says "Top performers... Remaining...".
      // Assuming split half for now (10 Winners, 10 Losers) or just Winners advance to Final?
      // Rulebook: "Final Round: R2 Winners + R3 Winners".
      // This implies R2 Losers go to R3 (Crossover) to fight R1 Eliminated?
      // Wait: "Participants R3: R1 Eliminated + R2 Losers". This is a huge bracket.
      // Let's implement Top 10 qualify to Final directly (R2 Winners). Bottom 10 go to R3.

      // Need to fetch scores AGAIN (assuming they were updated for R2).
      // Note: System needs to distinguish R2 scores from R1.
      // Current 'scores' collection upserts. We might need to store round history.
      // For this prototype, we assume the scores in DB are the current round's scores.

      const activeTeams = await db
        .collection("teams")
        .find({ event_id, status: "active" })
        .toArray();
      const activeIds = activeTeams.map((t) => t._id.toString());

      const scores = await db
        .collection("scores")
        .find({ event_id, team_id: { $in: activeIds } })
        .sort({ total_score: -1 })
        .toArray();

      const topHalf = scores.slice(0, 10); // Winners -> Final
      const bottomHalf = scores.slice(10); // Losers -> Round 3

      const winnerIds = topHalf.map((s) => new ObjectId(s.team_id));
      const loserIds = bottomHalf.map((s) => new ObjectId(s.team_id));

      // Winners stay active (skip R3? Or wait for Final).
      await db
        .collection("teams")
        .updateMany(
          { _id: { $in: winnerIds } },
          { $set: { qualification: "Finalist (R2 Winner)" } },
        );

      // Losers go to R3 (rejoin eliminated pool? Or specific R3 Status)
      await db
        .collection("teams")
        .updateMany(
          { _id: { $in: loserIds } },
          { $set: { status: "active_r3", qualification: "Round 3 Contender" } },
        );

      // Also reactivate R1 eliminated for R3? Rulebook: "Participants: R1 eliminated teams + R2 loser teams"
      await db
        .collection("teams")
        .updateMany(
          { event_id, status: "eliminated" },
          { $set: { status: "active_r3", qualification: "Round 3 Wildcard" } },
        );

      res.json({
        message:
          "Round 2 Ended. Winners to Final. Losers + R1 Eliminated to Round 3.",
      });
    }
    // Logic for R3 -> Final
    else if (from_round_number === 3) {
      // R3 Participants compete. Winners go to Final.
      // R3 Participants are 'active_r3' status.
      const r3Teams = await db
        .collection("teams")
        .find({ event_id, status: "active_r3" })
        .toArray();
      const r3Ids = r3Teams.map((t) => t._id.toString());

      const scores = await db
        .collection("scores")
        .find({ event_id, team_id: { $in: r3Ids } })
        .sort({ total_score: -1 })
        .toArray();

      // How many from R3 go to Final?
      // Total Finalists = 5 Winners.
      // We already have 10 from R2? Rulebook says "Top 5 teams are declared FINAL WINNERS" at the end.
      // It doesn't specify how many enter Final.
      // Let's assume Top 10 from R3 join the Top 10 from R2 = 20 Finalists?
      // Or keeping it consistent with "Top 5 Final Winners", maybe 10+10 is fine.

      const topR3 = scores.slice(0, 10);
      const eliminatedR3 = scores.slice(10);

      await db
        .collection("teams")
        .updateMany(
          { _id: { $in: topR3.map((s) => new ObjectId(s.team_id)) } },
          { $set: { status: "active", qualification: "Finalist (R3 Winner)" } },
        );
      await db
        .collection("teams")
        .updateMany(
          { _id: { $in: eliminatedR3.map((s) => new ObjectId(s.team_id)) } },
          { $set: { status: "eliminated", qualification: "Eliminated R3" } },
        );

      res.json({
        message: "Round 3 Ended. R3 Winners join R2 Winners in Final.",
      });
    }
    // Final Round
    else if (from_round_number === 4) {
      // Calculate Final Winners (Top 5)
      const finalists = await db
        .collection("teams")
        .find({ event_id, qualification: { $regex: "Finalist" } })
        .toArray();
      const finalistIds = finalists.map((t) => t._id.toString());

      const scores = await db
        .collection("scores")
        .find({ event_id, team_id: { $in: finalistIds } })
        .sort({ total_score: -1 })
        .toArray();

      const winners = scores.slice(0, 5);
      const winnerIds = winners.map((s) => new ObjectId(s.team_id));

      await db
        .collection("teams")
        .updateMany({ event_id }, { $set: { is_winner: false } }); // Reset
      await db
        .collection("teams")
        .updateMany(
          { _id: { $in: winnerIds } },
          { $set: { is_winner: true, qualification: "CHAMPION" } },
        );

      res.json({
        message: "Final Round Ended. Champions Declared.",
        winners: winners,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "round advancement failed" });
  }
});

// ========================================
// TOURNAMENT API ENDPOINTS
// ========================================

// Initialize tournament (create 5 rounds)
app.post("/api/tournament/rounds/initialize", async (req, res) => {
  const { event_id } = req.body;
  if (!event_id) return res.status(400).json({ error: "event_id required" });

  try {
    const result = await tournamentService.initializeTournament(db, event_id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    console.error("Tournament init error:", err);
    res.status(500).json({ error: "Failed to initialize tournament" });
  }
});

// Get all tournament rounds
app.get("/api/tournament/rounds", async (req, res) => {
  const { event_id } = req.query;
  if (!event_id) return res.status(400).json({ error: "event_id required" });

  try {
    const rounds = await tournamentService.getTournamentRounds(db, event_id);
    res.json(rounds);
  } catch (err) {
    console.error("Get rounds error:", err);
    res.status(500).json({ error: "Failed to get tournament rounds" });
  }
});

// Get matches for a specific round
app.get("/api/tournament/rounds/:roundNumber/matches", async (req, res) => {
  const roundNumber = parseInt(req.params.roundNumber);
  const { event_id } = req.query;

  if (!event_id) return res.status(400).json({ error: "event_id required" });
  if (isNaN(roundNumber) || roundNumber < 1 || roundNumber > 5) {
    return res.status(400).json({ error: "Invalid round number (1-5)" });
  }

  try {
    const matches = await tournamentService.getRoundMatches(
      db,
      event_id,
      roundNumber,
    );
    res.json(matches);
  } catch (err) {
    console.error("Get matches error:", err);
    res.status(500).json({ error: "Failed to get matches" });
  }
});

// Generate random matchups for a round
app.post("/api/tournament/rounds/:roundNumber/generate", async (req, res) => {
  const roundNumber = parseInt(req.params.roundNumber);
  const { event_id } = req.body;

  if (!event_id) return res.status(400).json({ error: "event_id required" });
  if (isNaN(roundNumber) || roundNumber < 1 || roundNumber > 5) {
    return res.status(400).json({ error: "Invalid round number (1-5)" });
  }

  try {
    const result = await tournamentService.generateMatchups(
      db,
      event_id,
      roundNumber,
    );
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    console.error("Generate matchups error:", err);
    res.status(500).json({ error: "Failed to generate matchups" });
  }
});

// Clear matchups for a round (allows regeneration)
app.delete("/api/tournament/rounds/:roundNumber/clear", async (req, res) => {
  const roundNumber = parseInt(req.params.roundNumber);
  const { event_id } = req.body;

  if (!event_id) return res.status(400).json({ error: "event_id required" });
  if (isNaN(roundNumber) || roundNumber < 1 || roundNumber > 5) {
    return res.status(400).json({ error: "Invalid round number (1-5)" });
  }

  try {
    const result = await tournamentService.clearMatchups(
      db,
      event_id,
      roundNumber,
    );
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    console.error("Clear matchups error:", err);
    res.status(500).json({ error: "Failed to clear matchups" });
  }
});

// Approve and start a round (parallel execution)
app.post("/api/tournament/rounds/:roundNumber/start", async (req, res) => {
  const roundNumber = parseInt(req.params.roundNumber);
  const { event_id } = req.body;

  console.log(req.params);

  if (!event_id) return res.status(400).json({ error: "event_id required" });
  if (isNaN(roundNumber) || roundNumber < 1 || roundNumber > 5) {
    return res.status(400).json({ error: "Invalid round number (1-5)" });
  }

  try {
    const result = await tournamentService.startRound(
      db,
      event_id,
      roundNumber,
    );
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    console.error("Start round error:", err);
    res.status(500).json({ error: "Failed to start round" });
  }
});

// Clear matchups for a round (admin function)
app.delete("/api/tournament/rounds/:roundNumber/matchups", async (req, res) => {
  const roundNumber = parseInt(req.params.roundNumber);
  const { event_id } = req.query;

  if (!event_id) return res.status(400).json({ error: "event_id required" });

  try {
    const result = await tournamentService.clearMatchups(
      db,
      event_id,
      roundNumber,
    );
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    console.error("Clear matchups error:", err);
    res.status(500).json({ error: "Failed to clear matchups" });
  }
});

// Get team's tournament progress
app.get("/api/tournament/team-progress/:teamId", async (req, res) => {
  const { teamId } = req.params;
  const { event_id } = req.query;

  if (!event_id) return res.status(400).json({ error: "event_id required" });

  try {
    const progress = await tournamentService.getTeamProgress(
      db,
      event_id,
      teamId,
    );
    res.json(progress || { message: "No tournament progress found" });
  } catch (err) {
    console.error("Get team progress error:", err);
    res.status(500).json({ error: "Failed to get team progress" });
  }
});

// Get tournament leaderboard
app.get("/api/tournament/leaderboard", async (req, res) => {
  const { event_id } = req.query;
  if (!event_id) return res.status(400).json({ error: "event_id required" });

  try {
    // Check scoreboard visibility
    const event = await db
      .collection("events")
      .findOne({ _id: new ObjectId(event_id) });
    const isApproved = event?.scoreboard_approved || false;

    // Check auth
    const role = await getUserRole(req);
    const isAdmin = role === "admin" || role === "organizer";

    if (!isApproved && !isAdmin) {
      return res.json({ hidden: true, message: "Scoreboard awaiting approval" });
    }

    const leaderboard = await tournamentService.getLeaderboard(db, event_id);
    res.json(leaderboard);
  } catch (err) {
    console.error("Get leaderboard error:", err);
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
});

// Toggle scoreboard visibility
app.post("/api/events/:id/toggle-scoreboard", async (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;

  try {
    const role = await getUserRole(req);
    if (role !== "admin") {
      return res.status(403).json({ error: "Only admins can toggle scoreboard" });
    }

    await db
      .collection("events")
      .updateOne({ _id: new ObjectId(id) }, { $set: { scoreboard_approved: !!approved } });

    res.json({ success: true, scoreboard_approved: !!approved });
  } catch (err) {
    console.error("Toggle scoreboard error:", err);
    res.status(500).json({ error: "Failed to toggle scoreboard" });
  }
});

// Get all tournament matches (with optional filters)
app.get("/api/tournament/matches", async (req, res) => {
  const { event_id, round_number, team_id } = req.query;
  if (!event_id) return res.status(400).json({ error: "event_id required" });

  try {
    const query = { event_id };
    if (round_number) query.round_number = parseInt(round_number);
    if (team_id) {
      query.$or = [{ team_a_id: team_id }, { team_b_id: team_id }];
    }

    const matches = await db
      .collection("tournament_matches")
      .find(query)
      .sort({ round_number: 1, created_at: 1 })
      .toArray();

    res.json(matches);
  } catch (err) {
    console.error("Get tournament matches error:", err);
    res.status(500).json({ error: "Failed to get matches" });
  }
});

// Generic REST for collections (list/select/create/update/delete)
// MOVED HERE: specific routes must come first
app.get("/api/:collection", async (req, res) => {
  const { collection } = req.params;

  // Exclude special endpoints that have their own handlers
  const excludedCollections = [
    "proxy-test",
    "evaluate-api",
    "score-history",
    "team_members",
    "rounds",
  ];
  if (excludedCollections.includes(collection)) {
    return res.status(404).json({ error: "Endpoint not found" });
  }

  const q = { ...req.query };
  try {
    const cursor = db.collection(collection).find(q);
    const results = await cursor.toArray();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/api/:collection/:id", async (req, res) => {
  const { collection, id } = req.params;
  try {
    const doc = await db
      .collection(collection)
      .findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ error: "not found" });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.post("/api/:collection", async (req, res) => {
  const { collection } = req.params;

  // Exclude special endpoints
  const excludedCollections = [
    "proxy-test",
    "evaluate-api",
    "team_members",
    "rounds",
  ];
  if (excludedCollections.includes(collection)) {
    return res
      .status(404)
      .json({ error: "Endpoint not found - this route is reserved" });
  }

  const body = req.body;
  try {
    const result = await db
      .collection(collection)
      .insertOne({ ...body, createdAt: new Date() });
    res.json({ id: result.insertedId.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.put("/api/:collection/:id", async (req, res) => {
  const { collection, id } = req.params;
  const body = req.body;
  try {
    const result = await db
      .collection(collection)
      .updateOne({ _id: new ObjectId(id) }, { $set: body });
    res.json({ matched: result.matchedCount, modified: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.delete("/api/:collection/:id", async (req, res) => {
  const { collection, id } = req.params;
  try {
    const result = await db
      .collection(collection)
      .deleteOne({ _id: new ObjectId(id) });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

const PORT = process.env.PORT || 4000;
main()
  .then(() => {
    app.listen(PORT, () => console.log("Server listening on", PORT));
  })
  .catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
  });

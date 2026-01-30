
/**
 * Tournament Service - Enhanced with Anthropic Judge Evaluation
 * Handles 5-round admin-controlled team-vs-team evaluation system
 * with parallel execution and Anthropic-based verdicts.
 */

const { ObjectId } = require("mongodb");
const Anthropic = require("@anthropic-ai/sdk");
const { getRoundConfig } = require("./Tournamentrounds.constants");

// Tournament Constants
const TOTAL_ROUNDS = 5;

// Point system
const POINTS = {
  WIN: 2,
  DRAW: 1,
  LOSS: 0
};

// Initialize Anthropic client
const anthropicClient = new Anthropic({
  apiKey:
    process.env.ANTHROPIC_API_KEY 
});

/**
 * Initialize tournament for an event - creates 5 rounds with pending status
 */
async function initializeTournament(db, eventId) {
  const existingRounds = await db
    .collection("tournament_rounds")
    .find({ event_id: eventId })
    .toArray();

  if (existingRounds.length > 0) {
    return {
      success: false,
      error: "Tournament already initialized for this event",
    };
  }

  const rounds = [];
  for (let i = 1; i <= TOTAL_ROUNDS; i++) {
    const roundConfig = getRoundConfig(i);
    rounds.push({
      round_number: i,
      event_id: eventId,
      name: roundConfig.name,
      description: roundConfig.description,
      pdf_link: roundConfig.pdfLink,
      difficulty: roundConfig.difficulty,
      status: "pending",
      started_at: null,
      completed_at: null,
      created_at: new Date(),
    });
  }

  await db.collection("tournament_rounds").insertMany(rounds);
  return {
    success: true,
    message: `Tournament initialized with ${TOTAL_ROUNDS} rounds`,
  };
}

/**
 * Get all tournament rounds for an event
 */
async function getTournamentRounds(db, eventId) {
  const rounds = await db
    .collection("tournament_rounds")
    .find({ event_id: eventId })
    .sort({ round_number: 1 })
    .toArray();

  // Enrich with match counts
  for (const round of rounds) {
    const matchStats = await db
      .collection("tournament_matches")
      .aggregate([
        { $match: { event_id: eventId, round_number: round.round_number } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            running: {
              $sum: { $cond: [{ $eq: ["$status", "running"] }, 1, 0] },
            },
          },
        },
      ])
      .toArray();

    round.match_stats = matchStats[0] || { total: 0, completed: 0, running: 0 };
  }

  return rounds;
}

/**
 * Get matches for a specific round
 */
async function getRoundMatches(db, eventId, roundNumber) {
  const matches = await db
    .collection("tournament_matches")
    .find({ event_id: eventId, round_number: roundNumber })
    .toArray();

  // Enrich with team names
  const teamIds = [
    ...new Set(matches.flatMap((m) => [m.team_a_id, m.team_b_id])),
  ];
  const teams = await db
    .collection("teams")
    .find({ _id: { $in: teamIds.map((id) => new ObjectId(id)) } })
    .toArray();

  const teamMap = {};
  teams.forEach((t) => (teamMap[t._id.toString()] = t.name));

  return matches.map((match) => ({
    ...match,
    team_a_name: teamMap[match.team_a_id] || "Unknown",
    team_b_name: teamMap[match.team_b_id] || "Unknown",
  }));
}

/**
 * Generate random matchups for a round
 */
async function generateMatchups(db, eventId, roundNumber) {
  const round = await db.collection("tournament_rounds").findOne({
    event_id: eventId,
    round_number: roundNumber,
  });

  if (!round) {
    return { success: false, error: "Round not found" };
  }

  if (round.status !== "pending") {
    return {
      success: false,
      error: "Can only generate matchups for pending rounds",
    };
  }

  const existingMatches = await db
    .collection("tournament_matches")
    .find({ event_id: eventId, round_number: roundNumber })
    .toArray(); 

  if (existingMatches.length > 0) {
    return {
      success: false,
      error:
        "Matchups already generated for this round. Clear them first to regenerate.",
    };
  }

  let teamsToMatch = [];
  const eventIdString =
    typeof eventId === "string" ? eventId : eventId.toString();

  if (roundNumber === 1) {
    const teams = await db
      .collection("teams")
      .find({
        event_id: eventIdString,
        shortlist_status: "shortlisted",
      })
      .toArray();

    teamsToMatch = teams.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      pool: "all",
    }));

    for (const team of teams) {
      await db.collection("team_tournament_progress").updateOne(
        { team_id: team._id.toString(), event_id: eventId },
        {
          $setOnInsert: {
            team_id: team._id.toString(),
            team_name: team.name,
            event_id: eventId,
            total_score: 0,
            points: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            status: "active",
            round_history: [],
            created_at: new Date(),
          },
        },
        { upsert: true },
      );
    }
  } else {
    const progress = await db
      .collection("team_tournament_progress")
      .find({ event_id: eventId, status: "active" })
      .toArray();

    const pools = {};
    for (const p of progress) {
      const poolKey = `wins_${p.wins}`;
      if (!pools[poolKey]) pools[poolKey] = [];
      pools[poolKey].push({
        id: p.team_id,
        name: p.team_name,
        pool: poolKey,
        wins: p.wins,
      });
    }

    teamsToMatch = Object.values(pools).flat();
  }

  const shuffled = shuffleTeamsWithinPools(teamsToMatch);
  const matches = [];
  const teamLookup = {};

  for (const t of teamsToMatch) {
    teamLookup[t.id] = t.name || "Unknown Team";
  }

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    matches.push({
      round_number: roundNumber,
      event_id: eventId,
      team_a_id: shuffled[i].id,
      team_b_id: shuffled[i + 1].id,
      team_a_name: teamLookup[shuffled[i].id] || "Unknown",
      team_b_name: teamLookup[shuffled[i + 1].id] || "Unknown",
      team_a_scores: null,
      team_b_scores: null,
      team_a_latency: null,
      team_b_latency: null,
      score_a: null,
      score_b: null,
      result: null,
      verdict: null,
      status: "waiting",
      created_at: new Date(),
      evaluated_at: null,
    });
  }

  if (shuffled.length % 2 !== 0) {
    const byeTeam = shuffled[shuffled.length - 1];
    matches.push({
      round_number: roundNumber,
      event_id: eventId,
      team_a_id: byeTeam.id,
      team_b_id: null,
      team_a_name: teamLookup[byeTeam.id] || "Unknown",
      team_b_name: "BYE",
      team_a_scores: {
        score: 10,
        reasoning: {
          contextRelevance: "BYE",
          groundedness: "BYE",
          accuracy: "BYE",
          style: "BYE",
          efficiency: "BYE",
        },
      },
      team_b_scores: {
        score: 0,
        reasoning: {
          contextRelevance: "N/A",
          groundedness: "N/A",
          accuracy: "N/A",
          style: "N/A",
          efficiency: "N/A",
        },
      },
      team_a_latency: 0,
      team_b_latency: null,
      score_a: 10,
      score_b: 0,
      result: "team_a_win",
      verdict: "Automatic win - BYE (no opponent)",
      status: "completed",
      created_at: new Date(),
      evaluated_at: new Date(),
    });
  }

  if (matches.length > 0) {
    await db.collection("tournament_matches").insertMany(matches);
  }

  return {
    success: true,
    matches_created: matches.length,
    message: `Generated ${matches.length} matchups for Round ${roundNumber}`,
  };
}

function shuffleTeamsWithinPools(teams) {
  const pools = {};
  teams.forEach((t) => {
    if (!pools[t.pool]) pools[t.pool] = [];
    pools[t.pool].push(t);
  });

  for (const poolKey of Object.keys(pools)) {
    pools[poolKey] = fisherYatesShuffle(pools[poolKey]);
  }

  return Object.values(pools).flat();
}

function fisherYatesShuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Start a round - approve and execute all matches in parallel
 */
async function startRound(db, eventId, roundNumber) {
  const round = await db.collection("tournament_rounds").findOne({
    event_id: eventId,
    round_number: roundNumber,
  });

  if (!round) {
    return { success: false, error: "Round not found" };
  }

  if (round.status !== "pending") {
    return { success: false, error: "Round is not in pending status" };
  }

  if (roundNumber > 1) {
    const prevRound = await db.collection("tournament_rounds").findOne({
      event_id: eventId,
      round_number: roundNumber - 1,
    });

    if (!prevRound || prevRound.status !== "completed") {
      return {
        success: false,
        error: "Previous round must be completed first",
      };
    }
  }

  const matches = await db
    .collection("tournament_matches")
    .find({ event_id: eventId, round_number: roundNumber, status: "waiting" })
    .toArray();

  if (matches.length === 0) {
    return {
      success: false,
      error: "No matches found. Generate matchups first.",
    };
  }

  await db
    .collection("tournament_rounds")
    .updateOne(
      { _id: round._id },
      { $set: { status: "running", started_at: new Date() } },
    );

  executeMatchesParallel(db, eventId, roundNumber, matches);

  return {
    success: true,
    message: `Round ${roundNumber} started with ${matches.length} matches executing in parallel`,
  };
}

/**
 * Execute all matches in parallel - non-blocking
 */
async function executeMatchesParallel(db, eventId, roundNumber, matches) {
  console.log(
    `[Tournament] Starting parallel evaluation for Round ${roundNumber} with ${matches.length} matches`,
  );

  await db
    .collection("tournament_matches")
    .updateMany(
      { event_id: eventId, round_number: roundNumber, status: "waiting" },
      { $set: { status: "running" } },
    );

  const results = await Promise.allSettled(
    matches.map((match) => evaluateMatch(db, match, roundNumber)),
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(
    `[Tournament] Round ${roundNumber} evaluation complete: ${successful} success, ${failed} failed`,
  );

  const pendingMatches = await db
    .collection("tournament_matches")
    .find({
      event_id: eventId,
      round_number: roundNumber,
      status: { $ne: "completed" },
    })
    .toArray();

  if (pendingMatches.length === 0) {
    await db
      .collection("tournament_rounds")
      .updateOne(
        { event_id: eventId, round_number: roundNumber },
        { $set: { status: "completed", completed_at: new Date() } },
      );
    console.log(`[Tournament] Round ${roundNumber} marked as completed`);
  }
}

/**
 * Evaluate a single match using Anthropic Judge
 */
async function evaluateMatch(db, match, roundNumber) {
  try {
    if (!match.team_b_id) {
      return { success: true, result: "bye" };
    }

    // Get round configuration
    const roundConfig = getRoundConfig(roundNumber);

    // Get team API submissions
    const teamA = await db
      .collection("api_submissions")
      .findOne({ team_id: match.team_a_id });
    const teamB = await db
      .collection("api_submissions")
      .findOne({ team_id: match.team_b_id });

    if (!teamA?.endpoint_url || !teamB?.endpoint_url) {
      let result, scoreA, scoreB, verdict;
      let customPoints = null;

      if (!teamA?.endpoint_url && !teamB?.endpoint_url) {
        result = "draw";
        scoreA = 0;
        scoreB = 0;
        verdict = "Both teams missing API endpoints.";
        customPoints = { teamA: 0, teamB: 0 };
      } else if (!teamA?.endpoint_url) {
        result = "team_b_win";
        scoreA = 0;
        scoreB = 10;
        verdict = "Team A missing API endpoint. Automatic win for Team B.";
      } else {
        result = "team_a_win";
        scoreA = 10;
        scoreB = 0;
        verdict = "Team B missing API endpoint. Automatic win for Team A.";
      }

      await db.collection("tournament_matches").updateOne(
        { _id: match._id },
        {
          $set: {
            team_a_scores: { score: scoreA, reasoning: { description: "Default score" } },
            team_b_scores: { score: scoreB, reasoning: { description: "Default score" } },
            team_a_latency: 0,
            team_b_latency: 0,
            score_a: scoreA,
            score_b: scoreB,
            result: result,
            verdict: verdict,
            status: "completed",
            evaluated_at: new Date(),
          },
        },
      );

      await updateTeamProgress(
        db,
        match.event_id,
        match.team_a_id,
        match.team_b_id,
        result,
        scoreA,
        scoreB,
        roundNumber,
        verdict,
        customPoints,
      );

      return {
        success: true,
        result,
        scoreA,
        scoreB,
      };
    }

    // Fetch responses from both team APIs
    const [responseA, responseB] = await Promise.all([
      fetchTeamResponses(
        teamA.endpoint_url,
        roundConfig.pdfLink,
        roundConfig.questions,
        roundConfig.timeout,
      ),
      fetchTeamResponses(
        teamB.endpoint_url,
        roundConfig.pdfLink,
        roundConfig.questions,
        roundConfig.timeout,
      ),
    ]);

    // Judge the battle using Anthropic
    const judgeResult = await judgeMatchWithAnthropic({
      roundNumber: roundNumber,
      context: roundConfig.context,
      questions: roundConfig.questions,
      groundTruths: roundConfig.groundTruths,
      teamA: {
        id: match.team_a_id,
        name: match.team_a_name,
        answers: responseA.answers,
        latencyMs: responseA.avgLatency,
      },
      teamB: {
        id: match.team_b_id,
        name: match.team_b_name,
        answers: responseB.answers,
        latencyMs: responseB.avgLatency,
      },
    });

    // Determine winner based on Anthropic's judgment
    let result;
    if (judgeResult.winnerId === match.team_a_id) {
      result = "team_a_win";
    } else if (judgeResult.winnerId === match.team_b_id) {
      result = "team_b_win";
    } else {
      result = "draw";
    }

    // Update match record
    await db.collection("tournament_matches").updateOne(
      { _id: match._id },
      {
        $set: {
          team_a_scores: judgeResult.teamAScores,
          team_b_scores: judgeResult.teamBScores,
          team_a_latency: responseA.avgLatency,
          team_b_latency: responseB.avgLatency,
          score_a: judgeResult.teamAScores.score,
          score_b: judgeResult.teamBScores.score,
          result: result,
          verdict: judgeResult.analysis,
          status: "completed",
          evaluated_at: new Date(),
        },
      },
    );

    // Update team progress
    await updateTeamProgress(
      db,
      match.event_id,
      match.team_a_id,
      match.team_b_id,
      result,
      judgeResult.teamAScores.score,
      judgeResult.teamBScores.score,
      roundNumber,
      judgeResult.analysis,
    );

    return {
      success: true,
      result,
      scoreA: judgeResult.teamAScores.score,
      scoreB: judgeResult.teamBScores.score,
    };
  } catch (error) {
    console.error(`[Tournament] Match evaluation failed:`, error);

    await db.collection("tournament_matches").updateOne(
      { _id: match._id },
      {
        $set: {
          team_a_scores: { score: 0, reasoning: {} },
          team_b_scores: { score: 0, reasoning: {} },
          team_a_latency: null,
          team_b_latency: null,
          score_a: 0,
          score_b: 0,
          result: "draw",
          verdict: `Evaluation error: ${error.message}. Both teams receive 0 points.`,
          status: "completed",
          evaluated_at: new Date(),
        },
      },
    );

    throw error;
  }
}

/**
 * Fetch responses from team's API endpoint
 * Sends all questions at once and receives answers as a list
 */
async function fetchTeamResponses(endpointUrl, pdfLink, questions, timeout) {
  try {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pdf_link: pdfLink,
        questions: questions, // Send all questions as array
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const totalLatency = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      const answers = data.answers || [];
      
      // Ensure we have an answer for each question
      const paddedAnswers = questions.map((_, index) => answers[index] || "");
      
      return {
        answers: paddedAnswers,
        avgLatency: Math.round(totalLatency),
      };
    } else {
      // Return empty answers on failure
      return {
        answers: questions.map(() => ""),
        avgLatency: Math.round(totalLatency),
      };
    }
  } catch (err) {
    // Return empty answers and timeout penalty on error
    return {
      answers: questions.map(() => ""),
      avgLatency: timeout,
    };
  }
}

/**
 * Judge match using Anthropic API (deterministic)
 */
async function judgeMatchWithAnthropic(matchup) {
  const systemPrompt = `You are an Elite RAG Battle Judge. Your role is to evaluate two RAG model responses objectively and deterministically.

IMPORTANT: You must be completely consistent and deterministic in your scoring. Given the same inputs, you must always produce the exact same scores. Use strict, rule-based evaluation criteria.

SCORING CRITERIA (0-10 scale for each):

1. RELEVANCE (contextRelevance): How well the answer addresses the question using the provided context.
   - 10: Directly answers the question using context information
   - 7-9: Mostly answers with minor omissions
   - 4-6: Partially relevant answer
   - 1-3: Barely relevant
   - 0: Completely irrelevant

2. GROUNDEDNESS: Whether claims are supported by the provided context.
   - 10: All claims directly supported by context
   - 7-9: Most claims supported, minor extrapolations
   - 4-6: Some unsupported claims
   - 1-3: Mostly unsupported
   - 0: Contradicts context

3. ACCURACY: How closely the answer matches the ground truth.
   - 10: Exact or semantically identical match
   - 7-9: Substantially correct with minor differences
   - 4-6: Partially correct
   - 1-3: Mostly incorrect
   - 0: Completely wrong

4. STYLE: Quality of presentation (clarity, conciseness, professionalism).
   - 10: Clear, concise, professional
   - 7-9: Good quality with minor issues
   - 4-6: Acceptable but could be improved
   - 1-3: Poor quality
   - 0: Incomprehensible

5. EFFICIENCY: Based strictly on latency:
   - <800ms = 10
   - 800-1499ms = 8
   - 1500-2999ms = 6
   - >=3000ms = 4

FINAL SCORE: Calculate the average of all 5 metrics.
WINNER: Team with higher average score wins. If scores are within 0.5 points, declare a draw.

You MUST respond with valid JSON only, no other text.`;

  const userPrompt = `Evaluate these two RAG model responses for Round ${matchup.roundNumber}:

SHARED CONTEXT:
${matchup.context}

QUESTIONS:
${JSON.stringify(matchup.questions, null, 2)}

GROUND TRUTH ANSWERS:
${JSON.stringify(matchup.groundTruths, null, 2)}

---

TEAM A: "${matchup.teamA.name}"
- Answers: ${JSON.stringify(matchup.teamA.answers, null, 2)}
- Total Latency: ${matchup.teamA.latencyMs}ms

TEAM B: "${matchup.teamB.name}"
- Answers: ${JSON.stringify(matchup.teamB.answers, null, 2)}
- Total Latency: ${matchup.teamB.latencyMs}ms

---

Respond with this exact JSON structure:
{
  "teamAScores": {
    "score": <number 0-10>,
    "reasoning": {
      "contextRelevance": "<explanation>",
      "groundedness": "<explanation>",
      "accuracy": "<explanation>",
      "style": "<explanation>",
      "efficiency": "<explanation>"
    }
  },
  "teamBScores": {
    "score": <number 0-10>,
    "reasoning": {
      "contextRelevance": "<explanation>",
      "groundedness": "<explanation>",
      "accuracy": "<explanation>",
      "style": "<explanation>",
      "efficiency": "<explanation>"
    }
  },
  "winnerId": "<'teamA' or 'teamB' or 'draw'>",
  "analysis": "<overall verdict explaining the decision>"
}`;

  const response = await anthropicClient.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    temperature: 0, // Deterministic output
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response received from Anthropic API");
  }

  let judgeResponse;
  try {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    judgeResponse = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error("Failed to parse response:", textContent.text);
    throw new Error(`Failed to parse API response: ${parseError}`);
  }

  if (
    !judgeResponse.teamAScores ||
    !judgeResponse.teamBScores ||
    !judgeResponse.winnerId ||
    !judgeResponse.analysis
  ) {
    throw new Error("Invalid response structure from API");
  }

  return {
    teamAScores: judgeResponse.teamAScores,
    teamBScores: judgeResponse.teamBScores,
    winnerId:
      judgeResponse.winnerId === "teamA"
        ? matchup.teamA.id
        : judgeResponse.winnerId === "teamB"
          ? matchup.teamB.id
          : "draw",
    analysis: judgeResponse.analysis,
  };
}

/**
 * Update team progress after a match
 */
async function updateTeamProgress(
  db,
  eventId,
  teamAId,
  teamBId,
  result,
  scoreA,
  scoreB,
  roundNumber,
  verdict,
  customPoints = null,
) {
  const teamA = await db
    .collection("teams")
    .findOne({ _id: new ObjectId(teamAId) });
  const teamB = teamBId
    ? await db.collection("teams").findOne({ _id: new ObjectId(teamBId) })
    : null;

  // Calculate points based on result
  let teamAPoints = 0;
  let teamBPoints = 0;

  if (customPoints) {
    teamAPoints = customPoints.teamA;
    teamBPoints = customPoints.teamB;
  } else if (result === "team_a_win") {
    teamAPoints = POINTS.WIN;
    teamBPoints = POINTS.LOSS;
  } else if (result === "team_b_win") {
    teamAPoints = POINTS.LOSS;
    teamBPoints = POINTS.WIN;
  } else {
    teamAPoints = POINTS.DRAW;
    teamBPoints = POINTS.DRAW;
  }

  // Update Team A
  const teamAUpdate = {
    $inc: { 
      total_score: scoreA,
      points: teamAPoints
    },
    $push: {
      round_history: {
        round: roundNumber,
        result:
          result === "team_a_win"
            ? "win"
            : result === "team_b_win"
              ? "loss"
              : "draw",
        score: scoreA,
        opponent_score: scoreB,
        points: teamAPoints,
        opponent: teamB?.name || "BYE",
        verdict: verdict,
      },
    },
  };

  if (result === "team_a_win") {
    teamAUpdate.$inc.wins = 1;
  } else if (result === "team_b_win") {
    teamAUpdate.$inc.losses = 1;
  } else {
    teamAUpdate.$inc.draws = 1;
  }

  await db
    .collection("team_tournament_progress")
    .updateOne({ team_id: teamAId, event_id: eventId }, teamAUpdate);

  // Update Team B (if not BYE)
  if (teamBId) {
    const teamBUpdate = {
      $inc: { 
        total_score: scoreB,
        points: teamBPoints
      },
      $push: {
        round_history: {
          round: roundNumber,
          result:
            result === "team_b_win"
              ? "win"
              : result === "team_a_win"
                ? "loss"
                : "draw",
          score: scoreB,
          opponent_score: scoreA,
          points: teamBPoints,
          opponent: teamA?.name || "Unknown",
          verdict: verdict,
        },
      },
    };

    if (result === "team_b_win") {
      teamBUpdate.$inc.wins = 1;
    } else if (result === "team_a_win") {
      teamBUpdate.$inc.losses = 1;
    } else {
      teamBUpdate.$inc.draws = 1;
    }

    await db
      .collection("team_tournament_progress")
      .updateOne({ team_id: teamBId, event_id: eventId }, teamBUpdate);
  }
}

/**
 * Get team's tournament progress
 */
async function getTeamProgress(db, eventId, teamId) {
  return await db.collection("team_tournament_progress").findOne({
    event_id: eventId,
    team_id: teamId,
  });
}

/**
 * Get tournament leaderboard
 */
async function getLeaderboard(db, eventId) {
  return await db
    .collection("team_tournament_progress")
    .find({ event_id: eventId })
    .sort({ points: -1, wins: -1, total_score: -1 })
    .toArray();
}

/**
 * Clear matchups for a round (admin function)
 */
async function clearMatchups(db, eventId, roundNumber) {
  const round = await db.collection("tournament_rounds").findOne({
    event_id: eventId,
    round_number: roundNumber,
  });

  if (!round || round.status !== "pending") {
    return {
      success: false,
      error: "Can only clear matchups for pending rounds",
    };
  }

  await db.collection("tournament_matches").deleteMany({
    event_id: eventId,
    round_number: roundNumber,
  });

  return { success: true, message: "Matchups cleared" };
}

module.exports = {
  TOTAL_ROUNDS,
  POINTS,
  initializeTournament,
  getTournamentRounds,
  getRoundMatches,
  generateMatchups,
  startRound,
  evaluateMatch,
  getTeamProgress,
  getLeaderboard,
  clearMatchups,
};
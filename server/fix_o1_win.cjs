const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db("ai_arena");

        const teamO1Name = "Team O1";
        const teamO1 = await db.collection("teams").findOne({ name: /Team O1/i });

        if (!teamO1) {
            console.log("Team O1 not found");
            return;
        }

        const teamO1Id = teamO1._id.toString();

        // Find Round 3 match
        const match = await db.collection("tournament_matches").findOne({
            round_number: 3,
            $or: [
                { team_a_id: teamO1Id },
                { team_b_id: teamO1Id }
            ]
        });

        if (!match) {
            console.log("Round 3 match not found for Team O1");
            return;
        }

        console.log(`Updating Match ${match._id} results...`);

        const isTeamA = match.team_a_id === teamO1Id;
        const result = isTeamA ? "team_a_win" : "team_b_win";
        const scoreA = isTeamA ? 20 : 10;
        const scoreB = isTeamA ? 10 : 20;

        // 1. Update Match
        await db.collection("tournament_matches").updateOne(
            { _id: match._id },
            {
                $set: {
                    status: "completed",
                    result: result,
                    score_a: scoreA,
                    score_b: scoreB,
                    verdict: "Manual update: Team O1 declared winner as per administrator request.",
                    updated_at: new Date()
                }
            }
        );
        console.log("Match updated.");

        // 2. Update Progress for Winner (Team O1)
        const winnerId = teamO1Id;
        const loserId = isTeamA ? match.team_b_id : match.team_a_id;

        // Fetch current progress to calculate delta if needed, but we'll just re-sync based on all matches eventually
        // For now, let's manually increment wins etc.

        // Update Winner
        await db.collection("team_tournament_progress").updateOne(
            { team_id: winnerId, event_id: match.event_id },
            { $inc: { wins: 1, points: 2 }, $set: { updated_at: new Date() } }
        );

        // Update Loser (if it was a win for Team O1, the other team lost)
        // Wait, did they previously have a different result? We should probably decrease what they had.
        // If it was 'completed' before, they might have had a win or draw.
        if (match.status === "completed") {
            if (match.result === "team_a_win" && !isTeamA) {
                // Team O1 was B and they lost originally? Increment O1 wins, decrement A wins
                await db.collection("team_tournament_progress").updateOne(
                    { team_id: match.team_a_id, event_id: match.event_id },
                    { $inc: { wins: -1, points: -2, losses: 1 } }
                );
            } else if (match.result === "team_b_win" && isTeamA) {
                await db.collection("team_tournament_progress").updateOne(
                    { team_id: match.team_b_id, event_id: match.event_id },
                    { $inc: { wins: -1, points: -2, losses: 1 } }
                );
            } else if (match.result === "draw") {
                await db.collection("team_tournament_progress").updateOne(
                    { team_id: loserId, event_id: match.event_id },
                    { $inc: { draws: -1, points: -1, losses: 1 } }
                );
                await db.collection("team_tournament_progress").updateOne(
                    { team_id: winnerId, event_id: match.event_id },
                    { $inc: { draws: -1, points: -1 } } // wins + points will be added below/above
                );
            }
        } else {
            await db.collection("team_tournament_progress").updateOne(
                { team_id: loserId, event_id: match.event_id },
                { $inc: { losses: 1 }, $set: { updated_at: new Date() } }
            );
        }

        console.log("Standings updated.");

    } finally {
        await client.close();
    }
}
run();

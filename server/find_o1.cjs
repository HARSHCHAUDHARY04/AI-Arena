const { MongoClient } = require("mongodb");
require("dotenv").config();

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db("ai_arena");

        // 1. Find Team O1
        const teamO1 = await db.collection("teams").findOne({ name: /Team O1/i });
        if (!teamO1) {
            console.log("Team O1 not found");
            return;
        }
        console.log(`Found Team O1: ${teamO1.name} (${teamO1._id.toString()})`);

        // 2. Find Round 3 Match
        const match = await db.collection("tournament_matches").findOne({
            round_number: 3,
            $or: [
                { team_a_id: teamO1._id.toString() },
                { team_b_id: teamO1._id.toString() }
            ]
        });

        if (!match) {
            console.log("Round 3 match for Team O1 not found");
            return;
        }

        console.log(`\nFound Match:`);
        console.log(`Team A: ${match.team_a_name} (${match.team_a_id})`);
        console.log(`Team B: ${match.team_b_name} (${match.team_b_id})`);
        console.log(`Status: ${match.status}`);

    } finally {
        await client.close();
    }
}
run();

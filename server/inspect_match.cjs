const { MongoClient } = require("mongodb");
require("dotenv").config();

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db("ai_arena");

        const teamO1 = await db.collection("teams").findOne({ name: /Team O1/i });
        const match = await db.collection("tournament_matches").findOne({
            round_number: 3,
            $or: [
                { team_a_id: teamO1._id.toString() },
                { team_b_id: teamO1._id.toString() }
            ]
        });

        console.log("Match Details:");
        console.log(JSON.stringify(match, null, 2));

        const progressA = await db.collection("team_tournament_progress").findOne({ team_id: match.team_a_id });
        const progressB = await db.collection("team_tournament_progress").findOne({ team_id: match.team_b_id });

        console.log("\nTeam A Progress (O1):");
        console.log(JSON.stringify(progressA, null, 2));
        console.log("\nTeam B Progress (Crossovers):");
        console.log(JSON.stringify(progressB, null, 2));

    } finally {
        await client.close();
    }
}
run();

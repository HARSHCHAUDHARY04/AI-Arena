const { MongoClient, ObjectId } = require("mongodb");
const { TOURNAMENT_ROUNDS } = require("./Tournamentrounds.constants");
require("dotenv").config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db("ai_arena");

        const event = await db.collection("events").findOne({ status: "active" });
        if (!event) {
            console.log("No active event found");
            return;
        }

        console.log(`Syncing rounds for event: ${event.title} (${event._id.toString()})`);

        for (let i = 1; i <= 5; i++) {
            const config = TOURNAMENT_ROUNDS[i];
            const result = await db.collection("tournament_rounds").updateOne(
                {
                    event_id: event._id.toString(),
                    round_number: i
                },
                {
                    $set: {
                        name: config.name,
                        description: config.description,
                        pdf_url: config.pdf_url,
                        difficulty: config.difficulty,
                        questions: config.questions,
                        groundTruths: config.groundTruths,
                        context: config.context,
                        timeout: config.timeout,
                        updated_at: new Date()
                    }
                }
            );
            console.log(`Round ${i}: ${result.matchedCount > 0 ? "✅ Updated" : "❌ Not found"}`);
        }

    } finally {
        await client.close();
    }
}
run();

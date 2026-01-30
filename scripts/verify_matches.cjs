
const { MongoClient } = require('mongodb');

async function main() {
    const uri = 'mongodb://localhost:27017'; // Default local URI
    const dbName = 'ai_arena'; // Matches server/index.js default

    console.log(`Connecting to ${uri}, DB: ${dbName}`);
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);

        console.log("Connected to DB...");

        const count = await db.collection('tournament_matches').countDocuments();
        console.log("Total Matches Found:", count);

        if (count > 0) {
            const matches = await db.collection('tournament_matches').find({}).toArray();
            console.log(`Found ${matches.length} matches.`);

            // Check for a specific match
            const match = matches[0];
            console.log("Sample Match:", JSON.stringify(match, null, 2));
            console.log("Team A ID:", match.team_a_id, "Type:", typeof match.team_a_id);

            // Check if matches have team_id matching what we expect (String)
        } else {
            console.log("No matches found in tournament_matches.");
        }

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await client.close();
    }
}

main();

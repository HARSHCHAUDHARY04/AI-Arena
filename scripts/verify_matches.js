
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'd:/datum/new/AI-Arena/.env' });

async function main() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('AI-Arena-DB');

        console.log("Connected to DB...");

        const matches = await db.collection('tournament_matches').find({}).limit(5).toArray();
        console.log("Total Matches Found:", await db.collection('tournament_matches').countDocuments());

        if (matches.length > 0) {
            console.log("Sample Match:", JSON.stringify(matches[0], null, 2));
            console.log("Team A ID Type:", typeof matches[0].team_a_id);
        } else {
            console.log("No matches found.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

main();

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'ai_arena';

async function main() {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    console.log('Connected to DB');

    const newVenue = "5008, AB-XII, GLA University, Mathura";

    // Update all events to use this venue (or filter by specific title if needed)
    console.log(`Updating venue to: ${newVenue}`);

    const result = await db.collection('events').updateMany(
        {}, // Match all events
        { $set: { venue: newVenue } }
    );

    console.log(`Matched ${result.matchedCount}, Modified ${result.modifiedCount}`);

    await client.close();
}

main().catch(console.error);

const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'ai_arena';

async function checkEvent() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const events = await db.collection('events').find({}).toArray();
        console.log('Events in DB:', JSON.stringify(events, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}
checkEvent();

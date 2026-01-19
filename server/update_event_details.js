const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'ai_arena';

async function updateEvent() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        console.log('Connected to MongoDB');

        // Target the single event
        const title = "AI Battle Arena 2026"; // Current title in DB per import script
        // Or find any active event if title changed.

        // We will update whatever event is there (usually only one).
        const event = await db.collection('events').findOne({});

        if (!event) {
            console.log('No event found to update.');
            return;
        }

        const updates = {
            title: "AI Battle Arena (Technavya'26)",
            description: "The ultimate AI agent building competition. Compete to build the smartest RAG agent to answer questions from a PDF document.",
            organizer: "GLA University, Mathura",
            date: "January 31, 2026",
            time: "10:00 AM onwards",
            venue: "R-3042, AB-XII, GLA University",
            prize: "₹30,000/-",
            start_time: new Date("2026-01-31T10:00:00+05:30"),
            end_time: new Date("2026-01-31T18:00:00+05:30")
        };

        await db.collection('events').updateOne({ _id: event._id }, { $set: updates });
        console.log('Event details updated successfully.');
        console.log(updates);

    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        await client.close();
    }
}

updateEvent();

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'ai_arena';

async function migrate() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);

        // 1. Find the Permanent Event
        const event = await db.collection('events').findOne({ title: 'AI Battle Arena 2026' });
        if (!event) {
            console.error('Permanent event not found!');
            return;
        }
        const eventId = event._id.toString();
        console.log('Found Permanent Event:', event.title, 'ID:', eventId);

        // 2. Count teams
        const teamCount = await db.collection('teams').countDocuments({});
        console.log('Total teams found:', teamCount);

        // 3. Update all teams to use this event_id
        // Note: We are forcibly moving ALL teams to this event for this fix.
        const teamsResult = await db.collection('teams').updateMany(
            {},
            { $set: { event_id: eventId } }
        );
        console.log(`Migrated ${teamsResult.modifiedCount} teams to Event ID ${eventId}`);

        // 4. Update api_submissions
        const submissionsResult = await db.collection('api_submissions').updateMany(
            {},
            { $set: { event_id: eventId } }
        );
        console.log(`Migrated ${submissionsResult.modifiedCount} submissions to Event ID ${eventId}`);

        // 5. Update scores
        const scoresResult = await db.collection('scores').updateMany(
            {},
            { $set: { event_id: eventId } }
        );
        console.log(`Migrated ${scoresResult.modifiedCount} scores to Event ID ${eventId}`);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.close();
    }
}

migrate();

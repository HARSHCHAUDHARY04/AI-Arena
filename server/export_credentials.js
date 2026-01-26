
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'ai_arena';
const EXPORT_FILE = path.join(__dirname, 'team_credentials.csv');

async function exportCredentials() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db(DB_NAME);

        const teams = await db.collection('teams').find({}).toArray();
        console.log(`Found ${teams.length} teams.`);

        let csvContent = "Team Name,Leader Name,Email,Password\n";

        for (const team of teams) {
            if (!team.members || team.members.length === 0) {
                console.warn(`Team ${team.name} has no members.`);
                continue;
            }

            // assuming first member is leader based on import order
            const leaderId = team.members[0];
            const leader = await db.collection('users').findOne({ _id: new ObjectId(leaderId) });

            if (leader) {
                // Escape fields if necessary (simple CSV escaping)
                const safeTeamName = `"${team.name.replace(/"/g, '""')}"`;
                const safeName = `"${leader.name.replace(/"/g, '""')}"`;
                const safeEmail = `"${leader.email.replace(/"/g, '""')}"`;
                const safePass = `"${(leader.plain_password || '').replace(/"/g, '""')}"`;

                csvContent += `${safeTeamName},${safeName},${safeEmail},${safePass}\n`;
            } else {
                console.warn(`Leader not found for team ${team.name} (ID: ${leaderId})`);
            }
        }

        fs.writeFileSync(EXPORT_FILE, csvContent);
        console.log(`Exported credentials to ${EXPORT_FILE}`);

    } catch (err) {
        console.error('Export failed:', err);
    } finally {
        await client.close();
    }
}

exportCredentials();

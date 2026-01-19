const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'ai_arena';

async function fixTeamMembers() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        console.log('Connected to MongoDB');

        // 1. Clear existing team_members to start fresh
        await db.collection('team_members').deleteMany({});
        console.log('Cleared existing team_members collection.');

        // 2. Fetch all teams
        const teams = await db.collection('teams').find({}).toArray();
        console.log(`Found ${teams.length} teams.`);

        let count = 0;
        const records = [];

        for (const team of teams) {
            if (team.members && team.members.length > 0) {
                for (const memberId of team.members) {
                    // memberId stored as String in teams.members array from import script
                    // We need to insert into team_members
                    // Schema expected by Dashboard calls seems to simply link them
                    // Let's check Dashboard.tsx: fetch ...?user_id=${user.id}
                    // So we must have user_id field.

                    records.push({
                        team_id: team._id.toString(),
                        user_id: memberId.toString(),
                        role: 'member', // Default role
                        created_at: new Date()
                    });
                    count++;
                }
            }
        }

        if (records.length > 0) {
            await db.collection('team_members').insertMany(records);
        }

        console.log(`Successfully populated ${count} records into 'team_members'.`);

    } catch (err) {
        console.error('Fix failed:', err);
    } finally {
        await client.close();
    }
}

fixTeamMembers();

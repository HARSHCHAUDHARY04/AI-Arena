const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'ai_arena';
const CSV_FILE = path.join(__dirname, 'teams data.csv');

// Regex splitter again for consistency
function parseCSVLine(line) {
    const pattern = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    const rawValues = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            rawValues.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    rawValues.push(current.trim().replace(/^"|"$/g, ''));
    return rawValues;
}

async function cleanup() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);

        // 1. Get Valid Team Names from CSV
        if (!fs.existsSync(CSV_FILE)) throw new Error('CSV not found');
        const lines = fs.readFileSync(CSV_FILE, 'utf-8').split(/\r?\n/).filter(l => l.trim().length > 0).slice(1);

        const validNames = [];
        for (const line of lines) {
            const cols = parseCSVLine(line);
            if (cols[1]) validNames.push(cols[1]); // Col 1 is Team Name
        }
        console.log(`Found ${validNames.length} valid team names in CSV.`);

        // 2. Find Valid Teams in DB
        const validTeams = await db.collection('teams').find({ name: { $in: validNames } }).toArray();
        const validTeamIds = validTeams.map(t => t._id); // ObjectId
        const validTeamIdStrings = validTeams.map(t => t._id.toString());

        console.log(`Matched ${validTeams.length} teams in Database.`);

        // 3. Find Valid Users (Members of these teams)
        const validUserIds = []; // ObjectId
        const validUserIdStrings = [];

        validTeams.forEach(t => {
            if (t.members) {
                t.members.forEach(mId => {
                    // Members are stored as strings in previous script
                    validUserIdStrings.push(mId.toString());
                });
            }
        });

        // Also get the ObjectIds for user cleanup
        // We'll trust the string match or convert if needed. 
        // Best to query users by these IDs to be sure.
        // Actually, let's just use string comparison if IDs are consistent, 
        // OR query DB to get the ObjectIds if stored as ObjectId. 
        // Looking at previous script: memberIds are strings. 
        // User _id is ObjectId. user_roles user_id is string.

        console.log(`Protected Users count: ${validUserIdStrings.length}`);

        // 4. Perform Deletions

        // TEAMS
        const teamDel = await db.collection('teams').deleteMany({ _id: { $nin: validTeamIds } });
        console.log(`Deleted Teams: ${teamDel.deletedCount}`);

        // USERS 
        // Need to convert string IDs back to ObjectId for $nin query on _id
        const userObjectIds = validUserIdStrings.map(id => {
            try { return new (require('mongodb').ObjectId)(id); } catch (e) { return null; }
        }).filter(id => id);

        const userDel = await db.collection('users').deleteMany({ _id: { $nin: userObjectIds } });
        console.log(`Deleted Users: ${userDel.deletedCount}`);

        // ROLES
        const roleDel = await db.collection('user_roles').deleteMany({ user_id: { $nin: validUserIdStrings } });
        console.log(`Deleted User Roles: ${roleDel.deletedCount}`);

        // SCORES (team_id is usually string)
        const scoreDel = await db.collection('scores').deleteMany({ team_id: { $nin: validTeamIdStrings } });
        console.log(`Deleted Scores: ${scoreDel.deletedCount}`);

        // SUBMISSIONS (team_id is usually string)
        const subDel = await db.collection('api_submissions').deleteMany({ team_id: { $nin: validTeamIdStrings } });
        console.log(`Deleted Submissions: ${subDel.deletedCount}`);

        // TEAM MEMBERS (team_id is usually string)
        const memberDel = await db.collection('team_members').deleteMany({ team_id: { $nin: validTeamIdStrings } });
        console.log(`Deleted Team Members: ${memberDel.deletedCount}`);

    } catch (err) {
        console.error('Cleanup failed:', err);
    } finally {
        await client.close();
    }
}

cleanup();

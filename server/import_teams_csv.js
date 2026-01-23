const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'ai_arena';
const CSV_FILE = path.join(__dirname, 'updated team data.csv');

// Helper to split CSV line handling quotes
// Simple regex to match fields that are either quoted or not containing commas
function parseCSVLine(line) {
    const pattern = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    // Actually a better simple parser for: val, "val, with comma", val
    // Split by comma, but rejoin if inside quotes.
    const rawValues = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            rawValues.push(current.trim().replace(/^"|"$/g, '')); // Trim and remove wrapping quotes
            current = '';
        } else {
            current += char;
        }
    }
    rawValues.push(current.trim().replace(/^"|"$/g, ''));
    return rawValues;
}

async function importTeams() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db(DB_NAME);

        // 1. Ensure Event
        const eventTitle = "AI Battle Arena 2026";
        let event = await db.collection('events').findOne({ title: eventTitle });
        if (!event) {
            console.log('Event not found, creating placeholder...');
            const res = await db.collection('events').insertOne({
                title: eventTitle,
                status: 'active',
                created_at: new Date()
            });
            event = { _id: res.insertedId };
        }
        console.log('Using Event ID:', event._id);

        // 2. Read CSV
        if (!fs.existsSync(CSV_FILE)) {
            console.error('CSV File not found:', CSV_FILE);
            return;
        }
        const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
        const lines = fileContent.split(/\r?\n/).filter(l => l.trim().length > 0);

        // Skip header (Line 0)
        const dataLines = lines.slice(1);
        console.log(`Found ${dataLines.length} teams to import.`);

        let processedCount = 0;

        for (const line of dataLines) {
            const cols = parseCSVLine(line);

            // Map based on index (0-based)
            // 0: Timestamp (unused)
            // 1: Team Name
            // Leader: 6:Name, 7:Course, 8:Roll, 9:Year, 10:LinkedIn, 11:Phone, 12:Email
            // Member2: 13:Name, 14:Course, 15:Roll, 16:Year, 17:LinkedIn, 18:Phone
            // Member3: 19:Name ...
            // Member4: 25:Name ...

            const teamName = cols[1];
            if (!teamName) continue;

            // Prepare Members
            const memberDefs = [
                { name: cols[6], course: cols[7], roll: cols[8], year: cols[9], linkedIn: cols[10], phone: cols[11], email: cols[12], isLeader: true },
                { name: cols[13], course: cols[14], roll: cols[15], year: cols[16], linkedIn: cols[17], phone: cols[18], isLeader: false },
                { name: cols[19], course: cols[20], roll: cols[21], year: cols[22], linkedIn: cols[23], phone: cols[24], isLeader: false },
                { name: cols[25], course: cols[26], roll: cols[27], year: cols[28], linkedIn: cols[29], phone: cols[30], isLeader: false }
            ];

            const memberIds = [];
            const defaultPassword = `${teamName}#2026`;
            const passwordHash = await bcrypt.hash(defaultPassword, 10);

            for (const m of memberDefs) {
                if (!m.name) continue; // Skip if name empty

                // Determine Email
                let email = m.email;
                if (!email) {
                    // Generate placeholder: roll_ROLL@ai-arena.internal OR name_random@...
                    const cleanRoll = m.roll ? m.roll.replace(/[^a-zA-Z0-9]/g, '') : '';
                    if (cleanRoll) {
                        email = `${cleanRoll}@ai-arena.internal`;
                    } else {
                        // Fallback purely on name + random
                        const cleanName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                        email = `${cleanName}_${Math.floor(Math.random() * 1000)}@ai-arena.internal`;
                    }
                }
                email = email.toLowerCase().trim();

                // Check or Create User
                let user = await db.collection('users').findOne({ email });
                let userId;

                if (user) {
                    userId = user._id;
                    // Optional: Update details if needed? keeping simple for now
                    console.log(`User exists: ${email} (${m.name})`);
                    // [NEW] Update password fields even if user exists
                    await db.collection('users').updateOne(
                        { _id: user._id },
                        {
                            $set: {
                                plain_password: defaultPassword,
                                passwordHash: passwordHash
                            }
                        }
                    );
                } else {
                    const newUser = {
                        email,
                        passwordHash,
                        name: m.name,
                        roll_number: m.roll,
                        course: m.course,
                        year: m.year,
                        phone: m.phone,
                        linkedin_url: m.linkedIn,
                        createdAt: new Date(),
                        linkedin_url: m.linkedIn,
                        createdAt: new Date(),
                        is_generated_email: !m.isLeader,
                        plain_password: defaultPassword // [NEW] Stored directly as requested
                    };
                    const res = await db.collection('users').insertOne(newUser);
                    userId = res.insertedId;

                    // Assign Role
                    await db.collection('user_roles').insertOne({
                        user_id: userId.toString(),
                        role: 'participant',
                        created_at: new Date()
                    });
                    console.log(`Created User: ${email} (${m.name})`);
                }
                memberIds.push(userId.toString());
            }

            // Create/Update Team
            let team = await db.collection('teams').findOne({ name: teamName });
            if (team) {
                await db.collection('teams').updateOne(
                    { _id: team._id },
                    {
                        $set: {
                            members: memberIds,
                            event_id: event._id.toString(),
                            updated_at: new Date()
                        }
                    }
                );
                console.log(`Updated Team: ${teamName}`);
            } else {
                await db.collection('teams').insertOne({
                    name: teamName,
                    members: memberIds,
                    event_id: event._id.toString(),
                    status: 'active',
                    created_at: new Date(),
                    shortlist_status: 'pending'
                });
                console.log(`Created Team: ${teamName}`);
            }

            // [NEW] Populate team_members collection
            // 1. Get the Team ID (either from update or insert)
            const finalTeam = await db.collection('teams').findOne({ name: teamName });
            if (finalTeam) {
                // Clear old members for this team to avoid dupes/stale data
                await db.collection('team_members').deleteMany({ team_id: finalTeam._id.toString() });

                const teamMemberRecords = memberIds.map(uId => ({
                    team_id: finalTeam._id.toString(),
                    user_id: uId.toString(),
                    role: 'member',
                    created_at: new Date()
                }));
                if (teamMemberRecords.length > 0) {
                    await db.collection('team_members').insertMany(teamMemberRecords);
                }
            }
            processedCount++;
        }

        console.log(`\nImport Completed. Processed ${processedCount} teams.`);

    } catch (err) {
        console.error('Import failed:', err);
    } finally {
        await client.close();
    }
}

importTeams();

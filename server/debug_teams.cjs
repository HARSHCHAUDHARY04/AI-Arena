const { MongoClient, ObjectId } = require('mongodb');

async function main() {
    const uri = 'mongodb://localhost:27017';
    const dbName = 'ai_arena';

    console.log(`Connecting to ${uri}, DB: ${dbName}\n`);
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);

        console.log("=== CHECKING TEAMS AND EVENT DATA ===\n");

        // Get the event
        const event = await db.collection('events').findOne({ title: "AI Battle Arena 2026" });
        if (!event) {
            console.log("❌ No event found!");
            return;
        }
        console.log(`✅ Event found: ${event.title}`);
        console.log(`   Event ID: ${event._id}`);
        console.log(`   Event ID Type: ${typeof event._id}`);
        console.log(`   Event ID String: ${event._id.toString()}\n`);

        // Check all teams
        const allTeams = await db.collection('teams').find({}).limit(5).toArray();
        console.log(`Total teams in DB: ${await db.collection('teams').countDocuments()}\n`);

        if (allTeams.length > 0) {
            console.log("Sample Teams:");
            allTeams.forEach((team, idx) => {
                console.log(`\n  Team ${idx + 1}: ${team.name}`);
                console.log(`    _id: ${team._id} (${typeof team._id})`);
                console.log(`    event_id: ${team.event_id} (${typeof team.event_id})`);
                console.log(`    shortlist_status: ${team.shortlist_status}`);
                console.log(`    status: ${team.status}`);
            });
        }

        // Try to find teams matching the query used in generateMatchups
        const eventIdForQuery = event._id; // Use ObjectId directly
        console.log(`\n\n=== TESTING MATCHUP QUERY ===`);
        console.log(`Looking for teams with event_id: ${eventIdForQuery}\n`);

        const matchingTeams = await db.collection('teams')
            .find({
                event_id: eventIdForQuery,
                $or: [
                    { shortlist_status: 'shortlisted' },
                    { status: 'active' }
                ]
            })
            .toArray();

        console.log(`Teams matching generateMatchups query: ${matchingTeams.length}`);
        if (matchingTeams.length > 0) {
            matchingTeams.forEach(team => {
                console.log(`  ✓ ${team.name} (shortlist: ${team.shortlist_status}, status: ${team.status})`);
            });
        } else {
            console.log("\n⚠️ NO TEAMS MATCH! This is why matchups aren't being created.");
            console.log("\nTesting different queries:");

            // Test without event_id
            const teamsNoEvent = await db.collection('teams')
                .find({
                    $or: [
                        { shortlist_status: 'shortlisted' },
                        { status: 'active' }
                    ]
                })
                .toArray();
            console.log(`  Teams with shortlist/status (no event filter): ${teamsNoEvent.length}`);

            // Test with event_id as string
            const teamsStringEvent = await db.collection('teams')
                .find({
                    event_id: eventIdForQuery.toString(),
                    $or: [
                        { shortlist_status: 'shortlisted' },
                        { status: 'active' }
                    ]
                })
                .toArray();
            console.log(`  Teams with event_id as string: ${teamsStringEvent.length}`);
        }

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await client.close();
    }
}

main();

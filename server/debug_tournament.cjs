const { MongoClient } = require('mongodb');

async function main() {
    const uri = 'mongodb://localhost:27017';
    const dbName = 'ai_arena';

    console.log(`Connecting to ${uri}, DB: ${dbName}`);
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);

        console.log("\n=== TOURNAMENT DATA VERIFICATION ===\n");

        // Check rounds
        const roundsCount = await db.collection('tournament_rounds').countDocuments();
        console.log(`Tournament Rounds: ${roundsCount}`);
        if (roundsCount > 0) {
            const rounds = await db.collection('tournament_rounds').find({}).toArray();
            rounds.forEach(round => {
                console.log(`  Round ${round.round_number}: ${round.status}, Event: ${round.event_id}`);
            });
        }

        // Check matches
        const matchesCount = await db.collection('tournament_matches').countDocuments();
        console.log(`\nTournament Matches: ${matchesCount}`);
        if (matchesCount > 0) {
            const matches = await db.collection('tournament_matches').find({}).limit(3).toArray();
            matches.forEach(match => {
                console.log(`  Match: ${match.team_a_name || match.team_a_id} vs ${match.team_b_name || match.team_b_id || 'BYE'}`);
                console.log(`    Round ${match.round_number}, Status: ${match.status}, Event: ${match.event_id}`);
                console.log(`    Team A ID: ${match.team_a_id} (type: ${typeof match.team_a_id})`);
                console.log(`    Team B ID: ${match.team_b_id} (type: ${typeof match.team_b_id})`);
            });
        }

        // Check team progress
        const progressCount = await db.collection('team_tournament_progress').countDocuments();
        console.log(`\nTeam Progress Records: ${progressCount}`);

        // Check teams collection for reference
        const teamsCount = await db.collection('teams').countDocuments();
        console.log(`\nTotal Teams: ${teamsCount}`);
        if (teamsCount > 0) {
            const sampleTeam = await db.collection('teams').findOne({});
            console.log(`  Sample Team ID: ${sampleTeam._id} (type: ${typeof sampleTeam._id})`);
            console.log(`  Sample Team Name: ${sampleTeam.name}`);
        }

        // Check events for event_id reference
        const events = await db.collection('events').find({}).toArray();
        console.log(`\nEvents: ${events.length}`);
        events.forEach(event => {
            console.log(`  Event: ${event.title}, ID: ${event._id} (type: ${typeof event._id})`);
        });

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await client.close();
    }
}

main();

const { MongoClient } = require('mongodb');

async function run() {
    const client = new MongoClient('mongodb+srv://harshchikara:Harsh123@cluster0.fuxeoxz.mongodb.net/');
    try {
        await client.connect();
        const db = client.db('ai_arena');
        const carioId = '696e686a861039c4e0365c68';

        const allMatches = await db.collection('tournament_matches').find({}).toArray();
        console.log('Total matches in database:', allMatches.length);

        const carioMatches = allMatches.filter(m => m.team_a_id === carioId || m.team_b_id === carioId);
        console.log('Cario matches:', JSON.stringify(carioMatches, null, 2));

        if (allMatches.length > 0) {
            console.log('Sample match team IDs:', allMatches[0].team_a_id, 'vs', allMatches[0].team_b_id);
        }

        const rounds = await db.collection('tournament_rounds').find({}).toArray();
        console.log('Rounds:', JSON.stringify(rounds.map(r => ({ n: r.round_number, s: r.status })), null, 2));

    } finally {
        await client.close();
    }
}

run();

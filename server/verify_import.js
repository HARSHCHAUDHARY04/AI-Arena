const { MongoClient } = require('mongodb');
const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'ai_arena';

async function verify() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);

        const teams = await db.collection('teams').countDocuments({});
        const users = await db.collection('users').countDocuments({});

        console.log(`Total Teams: ${teams}`);
        console.log(`Total Users: ${users}`);

        const sampleTeam = await db.collection('teams').findOne({ name: 'Cario' });
        console.log('Sample Team:', sampleTeam?.name, 'Members:', sampleTeam?.members?.length);

        const leaderEmail = 'chetan.gla_cs24@gla.ac.in';
        const leader = await db.collection('users').findOne({ email: leaderEmail });
        console.log('Leader found:', leader ? 'YES' : 'NO', leader?.email);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
verify();

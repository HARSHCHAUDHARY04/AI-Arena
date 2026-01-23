const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const database = client.db(process.env.DB_NAME);
        const teams = database.collection('teams');

        const count = await teams.countDocuments();
        console.log(`Total Teams: ${count}`);

        const cursor = teams.find({}, { projection: { name: 1, members: 1 } });
        const allTeams = await cursor.toArray();
        console.log("Teams in DB:");
        allTeams.forEach(t => {
            const memberCount = t.members ? t.members.length : 0;
            console.log(`- ${t.name} (Members: ${memberCount})`);
        });

    } finally {
        await client.close();
    }
}
run().catch(console.dir);

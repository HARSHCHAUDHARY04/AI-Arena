require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        console.log("Connected to Atlas!");

        // List databases
        const adminDb = client.db().admin();
        const result = await adminDb.listDatabases();
        console.log("Databases found:");
        result.databases.forEach(db => console.log(` - ${db.name}`));

        // Check specific DB
        const targetDb = client.db('ai_arena');
        const userCount = await targetDb.collection('users').countDocuments();
        const teamCount = await targetDb.collection('teams').countDocuments();

        console.log(`\nIn 'ai_arena':`);
        console.log(` - Users: ${userCount}`);
        console.log(` - Teams: ${teamCount}`);

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

run();

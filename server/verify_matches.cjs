
const { MongoClient } = require('mongodb');

async function main() {
    const uri = 'mongodb://localhost:27017';
    console.log(`Connecting to ${uri}`);
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const adminDb = client.db().admin();
        const dbs = await adminDb.listDatabases();
        console.log("Databases:", dbs.databases.map(d => d.name).join(', '));

        const dbName = 'ai_arena';
        const db = client.db(dbName);
        console.log(`Checking DB: ${dbName}`);

        const collections = await db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name).join(', '));

        const count = await db.collection('tournament_matches').countDocuments();
        console.log("tournament_matches count:", count);

        if (count > 0) {
            const matches = await db.collection('tournament_matches').find({}).limit(1).toArray();
            console.log("Sample Match:", JSON.stringify(matches[0], null, 2));
        }

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await client.close();
    }
}

main();

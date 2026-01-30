const { MongoClient } = require('mongodb');

async function run() {
    const client = MONGODB_URI;
    try {
        await client.connect();
        const db = client.db('ai_arena');
        const correctCarioId = '696e686a861039c4e0365c68';
        const user = await db.collection('users').findOne({ email: 'demo.leader@gla.ac.in' });

        if (user) {
            await db.collection('team_members').updateOne(
                { user_id: user._id.toString() },
                { $set: { team_id: correctCarioId } },
                { upsert: true }
            );
            console.log('Fixed demo.leader to Cario (ID: ' + correctCarioId + ')');
        } else {
            console.log('User not found');
        }
    } finally {
        await client.close();
    }
}

run();

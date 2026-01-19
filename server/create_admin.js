require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'ai_arena';

async function main() {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    console.log('Connected to DB');

    const email = 'admin@gmail.com';
    const password = '123456';

    // Check if exists
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
        console.log('User already exists, updating password...');
        const passwordHash = await bcrypt.hash(password, 10);
        await db.collection('users').updateOne({ email }, { $set: { passwordHash } });

        // Ensure role
        const roleDoc = await db.collection('user_roles').findOne({ user_id: existing._id.toString() });
        if (!roleDoc || roleDoc.role !== 'admin') {
            console.log('Updating role to admin...');
            await db.collection('user_roles').updateOne(
                { user_id: existing._id.toString() },
                { $set: { role: 'admin', updated_at: new Date() } },
                { upsert: true }
            );
        }
    } else {
        console.log('Creating new admin user...');
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await db.collection('users').insertOne({
            email,
            passwordHash,
            createdAt: new Date(),
            name: 'Admin User'
        });
        const userId = result.insertedId.toString();

        console.log('Assigning admin role...');
        await db.collection('user_roles').insertOne({
            user_id: userId,
            role: 'admin',
            created_at: new Date()
        });
    }

    console.log('Admin user ready: admin@gmail.com / 123456');
    await client.close();
}

main().catch(console.error);

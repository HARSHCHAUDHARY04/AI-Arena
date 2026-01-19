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
    const user = await db.collection('users').findOne({ email });

    if (!user) {
        console.log('User not found:', email);
    } else {
        console.log('User found:', user._id, user.email);
        const roleDoc = await db.collection('user_roles').findOne({ user_id: user._id.toString() });
        console.log('Role:', roleDoc ? roleDoc.role : 'No role assigned');

        // Check password check
        const isMatch = await bcrypt.compare('123456', user.passwordHash || '');
        console.log('Password "123456" matches:', isMatch);
    }

    await client.close();
}

main().catch(console.error);

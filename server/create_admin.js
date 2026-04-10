require("dotenv").config({ path: __dirname + "/.env" });
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "ai_arena";

async function createAdmin() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db(DB_NAME);

    const adminEmail = "admin@aibattlearena.in";
    const adminPassword = "AdminPassword123!";

    const existingUser = await db.collection("users").findOne({ email: adminEmail });
    
    if (existingUser) {
      console.log("Admin user already exists.");
      // Ensure it has the admin role
      const role = await db.collection("user_roles").findOne({ user_id: existingUser._id.toString() });
      if (!role || role.role !== "admin") {
         await db.collection("user_roles").updateOne(
           { user_id: existingUser._id.toString() },
           { $set: { role: "admin" } },
           { upsert: true }
         );
         console.log("Role updated to admin.");
      }
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const result = await db.collection("users").insertOne({
        email: adminEmail,
        passwordHash,
        createdAt: new Date()
      });
      
      const userId = result.insertedId.toString();
      await db.collection("user_roles").insertOne({
        user_id: userId,
        role: "admin",
        created_at: new Date()
      });
      
      console.log("Admin user created successfully!");
      console.log("Email:", adminEmail);
      console.log("Password:", adminPassword);
    }
  } catch (err) {
    console.error("Error creating admin:", err);
  } finally {
    await client.close();
  }
}

createAdmin();

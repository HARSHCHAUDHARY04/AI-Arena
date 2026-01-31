const { Anthropic } = require('@anthropic-ai/sdk');
require('dotenv').config();

const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = new Anthropic({ apiKey });

const candidates = [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-sonnet-20240229",
    "claude-3-opus-20240229",
    "claude-3-haiku-20240307",
    "claude-2.1"
];

async function checkModels() {
    console.log("Testing Anthropic models...");
    for (const model of candidates) {
        try {
            console.log(`Trying ${model}...`);
            await anthropic.messages.create({
                model: model,
                max_tokens: 10,
                messages: [{ role: "user", content: "Hello" }]
            });
            console.log(`✅ SUCCESS: ${model} is available.`);
            return; // Stop after finding the best available one
        } catch (err) {
            if (err.status === 404) {
                console.log(`❌ FAILED: ${model} not found (404).`);
            } else {
                console.log(`⚠️ ERROR on ${model}: ${err.message}`);
            }
        }
    }
}

checkModels();

// import fetch from "node-fetch";

const BASE_URL = "http://localhost:3001";

async function testOpenAIChat() {
    console.log("\n--- Testing OpenAI Endpoint (/v1/chat/completions) ---");
    const url = `${BASE_URL}/v1/chat/completions`;
    const body = {
        model: "gpt-4",
        messages: [
            { role: "user", content: "What is the capital of France?" }
        ]
    };

    try {
        const start = Date.now();
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        const duration = (Date.now() - start) / 1000;

        console.log(`Status: ${response.status} (${duration}s)`);
        if (data.choices && data.choices[0]?.message?.content) {
            console.log("✅ Success. Response snippet:", data.choices[0].message.content.slice(0, 100) + "...");
        } else {
            console.log("❌ Failure:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

async function testSystemPrompt() {
    console.log("\n--- Testing System Prompt (via OpenAI Endpoint) ---");
    const url = `${BASE_URL}/v1/chat/completions`;
    const body = {
        model: "gpt-4",
        messages: [
            { role: "system", content: "You are a pirate. Start every sentence with 'Arrr!'." },
            { role: "user", content: "Hello friend." }
        ]
    };

    try {
        const start = Date.now();
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        const duration = (Date.now() - start) / 1000;

        console.log(`Status: ${response.status} (${duration}s)`);
        if (data.choices && data.choices[0]?.message?.content) {
            console.log("✅ Success. Response snippet:", data.choices[0].message.content.slice(0, 100) + "...");
        } else {
            console.log("❌ Failure:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

async function testLegacyPrompt() {
    console.log("\n--- Testing Legacy Endpoint (/api/prompt) ---");
    const url = `${BASE_URL}/api/prompt`;
    const body = {
        prompt: "Name 3 primary colors.",
        options: { search: false }
    };

    try {
        const start = Date.now();
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ERKUT-API-KEY": process.env.ERKUT_API_KEY || "dummy_key_in_dev" // Dev mode ignores key anyway
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        const duration = (Date.now() - start) / 1000;

        console.log(`Status: ${response.status} (${duration}s)`);
        if (data.response) {
            console.log("✅ Success. Response snippet:", data.response.slice(0, 100) + "...");
        } else {
            console.log("❌ Failure:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

async function runTests() {
    await testOpenAIChat();
    console.log("Waiting 5s before next test...");
    await new Promise(r => setTimeout(r, 5000));

    await testSystemPrompt();
    console.log("Waiting 5s before next test...");
    await new Promise(r => setTimeout(r, 5000));

    await testLegacyPrompt();
}

runTests();

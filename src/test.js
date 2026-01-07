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

async function testAssistantsAPI() {
    console.log("\n--- Testing Assistants API (Stateful Flow) ---");
    const urlBase = `${BASE_URL}/v1`;

    try {
        // 1. Create Thread
        const threadRes = await fetch(`${urlBase}/threads`, { method: "POST" });
        const thread = await threadRes.json();
        console.log("✅ Thread Created:", thread.id);

        // 2. Add Message
        await fetch(`${urlBase}/threads/${thread.id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "user", content: "My secret code is 8888. Tell me 'OK' if you got it." })
        });

        // 3. Run
        const runRes = await fetch(`${urlBase}/threads/${thread.id}/runs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assistant_id: "asst_test" })
        });
        const run = await runRes.json();
        console.log("✅ Run Created:", run.id);

        // 4. Poll
        let currentRun = run;
        while (currentRun.status === "queued" || currentRun.status === "in_progress") {
            process.stdout.write(".");
            await new Promise(r => setTimeout(r, 2000));
            const pollRes = await fetch(`${urlBase}/threads/${thread.id}/runs/${run.id}`);
            currentRun = await pollRes.json();
        }
        console.log("\n✅ Run Finished:", currentRun.status);

        // 5. Get Messages
        const msgsRes = await fetch(`${urlBase}/threads/${thread.id}/messages`);
        const msgs = await msgsRes.json();
        const lastMsg = msgs.data[msgs.data.length - 1];
        console.log("✅ Response:", lastMsg.content[0].text.value);

        // 6. Test Continuity (Turn 2)
        console.log("\n--- Testing Continuity (Second Turn) ---");
        await new Promise(r => setTimeout(r, 3000));
        await fetch(`${urlBase}/threads/${thread.id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "user", content: "What is my secret code? Answer with the number only." })
        });

        const run2Res = await fetch(`${urlBase}/threads/${thread.id}/runs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assistant_id: "asst_test" })
        });
        let run2 = await run2Res.json();

        while (run2.status === "queued" || run2.status === "in_progress") {
            process.stdout.write(".");
            await new Promise(r => setTimeout(r, 2000));
            const poll2Res = await fetch(`${urlBase}/threads/${thread.id}/runs/${run2.id}`);
            run2 = await poll2Res.json();
        }
        console.log("\n✅ Run 2 Finished:", run2.status);

        const msgs2Res = await fetch(`${urlBase}/threads/${thread.id}/messages`);
        const msgs2 = await msgs2Res.json();
        const lastMsg2 = msgs2.data[msgs2.data.length - 1];
        console.log("✅ Continuity Response:", lastMsg2.content[0].text.value);

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
                "ERKUT-API-KEY": process.env.ERKUT_API_KEY || "dummy_key_in_dev"
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
    await new Promise(r => setTimeout(r, 2000));
    await testSystemPrompt();
    await new Promise(r => setTimeout(r, 2000));
    await testAssistantsAPI();
    await new Promise(r => setTimeout(r, 2000));
    await testLegacyPrompt();
}

runTests();

import process from "node:process";
import dotenv from "dotenv";
import { waitForTimeout } from "./utils/helpers.js";

dotenv.config();

const BASE_URL = "http://localhost:3001";
const API_KEY = process.env.ERKUT_API_KEY || "dummy_key_in_dev";

const GLOBAL_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${API_KEY}`,
};

async function testOpenAIChat() {
  console.log("\n--- Testing OpenAI Endpoint (/v1/chat/completions) ---");
  const url = `${BASE_URL}/v1/chat/completions`;
  const body = {
    model: "gpt-4",
    messages: [
      { role: "user", content: "What is the capital of France?" },
    ],
  };

  try {
    const start = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: GLOBAL_HEADERS,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    const duration = (Date.now() - start) / 1000;

    console.log(`Status: ${response.status} (${duration}s)`);
    if (data.choices && data.choices[0]?.message?.content) {
      console.log("✅ Success. Response snippet:", `${data.choices[0].message.content.slice(0, 100)}...`);
    }
    else {
      console.log("❌ Failure:", JSON.stringify(data, null, 2));
    }
  }
  catch (error) {
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
      { role: "user", content: "Hello friend." },
    ],
  };

  try {
    const start = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: GLOBAL_HEADERS,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    const duration = (Date.now() - start) / 1000;

    console.log(`Status: ${response.status} (${duration}s)`);
    if (data.choices && data.choices[0]?.message?.content) {
      console.log("✅ Success. Response snippet:", `${data.choices[0].message.content.slice(0, 100)}...`);
    }
    else {
      console.log("❌ Failure:", JSON.stringify(data, null, 2));
    }
  }
  catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function testAssistantsAPI() {
  console.log("\n--- Testing Assistants API (Stateful Flow) ---");
  const urlBase = `${BASE_URL}/v1`;

  try {
    // 1. Create Thread
    const threadRes = await fetch(`${urlBase}/threads`, {
      method: "POST",
      headers: GLOBAL_HEADERS,
    });
    const thread = await threadRes.json();
    console.log("✅ Thread Created:", thread.id);

    // 2. Add Message
    await fetch(`${urlBase}/threads/${thread.id}/messages`, {
      method: "POST",
      headers: GLOBAL_HEADERS,
      body: JSON.stringify({ role: "user", content: "My secret code is 8888. Tell me 'OK' if you got it." }),
    });

    // 3. Run
    const runRes = await fetch(`${urlBase}/threads/${thread.id}/runs`, {
      method: "POST",
      headers: GLOBAL_HEADERS,
      body: JSON.stringify({ assistant_id: "asst_test" }),
    });
    const run = await runRes.json();
    console.log("✅ Run Created:", run.id);

    // 4. Poll
    let currentRun = run;
    while (currentRun.status === "queued" || currentRun.status === "in_progress") {
      process.stdout.write(".");
      await waitForTimeout(2000);
      const pollRes = await fetch(`${urlBase}/threads/${thread.id}/runs/${run.id}`, { headers: GLOBAL_HEADERS });
      currentRun = await pollRes.json();
    }
    console.log("\n✅ Run Finished:", currentRun.status);

    // 5. Get Messages
    const msgsRes = await fetch(`${urlBase}/threads/${thread.id}/messages`, { headers: GLOBAL_HEADERS });
    const msgs = await msgsRes.json();
    const lastMsg = msgs.data[msgs.data.length - 1];
    console.log("✅ Response:", lastMsg.content[0].text.value);

    // 6. Test Continuity (Turn 2)
    console.log("\n--- Testing Continuity (Second Turn) ---");
    await waitForTimeout(3000);
    await fetch(`${urlBase}/threads/${thread.id}/messages`, {
      method: "POST",
      headers: GLOBAL_HEADERS,
      body: JSON.stringify({ role: "user", content: "What is my secret code? Answer with the number only." }),
    });

    const run2Res = await fetch(`${urlBase}/threads/${thread.id}/runs`, {
      method: "POST",
      headers: GLOBAL_HEADERS,
      body: JSON.stringify({ assistant_id: "asst_test" }),
    });
    let run2 = await run2Res.json();

    while (run2.status === "queued" || run2.status === "in_progress") {
      process.stdout.write(".");
      await waitForTimeout(2000);
      const poll2Res = await fetch(`${urlBase}/threads/${thread.id}/runs/${run2.id}`, { headers: GLOBAL_HEADERS });
      run2 = await poll2Res.json();
    }
    console.log("\n✅ Run 2 Finished:", run2.status);

    const msgs2Res = await fetch(`${urlBase}/threads/${thread.id}/messages`, { headers: GLOBAL_HEADERS });
    const msgs2 = await msgs2Res.json();
    const lastMsg2 = msgs2.data[msgs2.data.length - 1];
    const finalResponse2 = lastMsg2.content[0].text.value;
    console.log("✅ Continuity Response:", finalResponse2);

    if (finalResponse2.includes("8888")) {
      console.log("🌟 TEST SUCCESS: Conversation memory is working!");
    }
    else {
      console.error("❌ TEST ERROR: Assistant forgot the secret code!");
    }
  }
  catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function testLegacyPrompt() {
  console.log("\n--- Testing Legacy Endpoint (/api/prompt) ---");
  const url = `${BASE_URL}/api/prompt`;
  const body = {
    prompt: "Name 3 primary colors.",
    options: { search: false },
  };

  try {
    const start = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: GLOBAL_HEADERS,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    const duration = (Date.now() - start) / 1000;

    console.log(`Status: ${response.status} (${duration}s)`);
    if (data.response) {
      console.log("✅ Success. Response snippet:", `${data.response.slice(0, 100)}...`);
    }
    else {
      console.log("❌ Failure:", JSON.stringify(data, null, 2));
    }
  }
  catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function testNotFound() {
  console.log("\n--- Testing 404 Not Found Handler ---");
  const url = `${BASE_URL}/v1/invalid-route-name`;
  try {
    const response = await fetch(url, {
      headers: GLOBAL_HEADERS,
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    if (response.status === 404 && data.error?.type === "not_found_error") {
      console.log("✅ Success: Correct 404 JSON response.");
    }
    else {
      console.log("❌ Failure: Unexpected 404 response.", JSON.stringify(data, null, 2));
    }
  }
  catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function testInvalidAuth() {
  // skip auth test if in development mode (it's bypassed anyway)
  if (process.env.NODE_ENV === "development") {
    console.log("\n⚠️  [Bypassed] --- Testing Invalid API Key Handler --- (API key check is disabled in development mode)");
    return;
  }
  console.log("\n--- Testing Invalid API Key Handler ---");
  const url = `${BASE_URL}/v1/chat/completions`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid_key_here",
      },
      body: JSON.stringify({ model: "gpt-4", messages: [{ role: "user", content: "test" }] }),
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    if (response.status === 401 && data.error?.type === "invalid_request_error") {
      console.log("✅ Success: Correct 401 JSON response.");
    }
    else {
      console.log("❌ Failure: Unexpected 401 response.", JSON.stringify(data, null, 2));
    }
  }
  catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function testValidationErrors() {
  console.log("\n--- Testing Validation Errors (Missing Messages) ---");
  const url = `${BASE_URL}/v1/chat/completions`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: GLOBAL_HEADERS,
      body: JSON.stringify({ model: "gpt-4" }), // missing messages
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    if (response.status === 400 && data.error?.type === "invalid_request_error") {
      console.log("✅ Success: Correct 400 Validation response.");
    }
    else {
      console.log("❌ Failure: Unexpected 400 response.", JSON.stringify(data, null, 2));
    }
  }
  catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function testModelsEndpoint() {
  console.log("\n--- Testing GET /v1/models (n8n compat) ---");
  try {
    const response = await fetch(`${BASE_URL}/v1/models`, {
      headers: GLOBAL_HEADERS,
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    if (response.status === 200 && data.object === "list") {
      console.log("✅ Success: Models list returned correctly.");
      console.log("Models found:", data.data.map(m => m.id).join(", "));
    }
    else {
      console.log("❌ Failure:", JSON.stringify(data, null, 2));
    }
  }
  catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function testV1Root() {
  console.log("\n--- Testing GET /v1/ (n8n compat) ---");
  try {
    const response = await fetch(`${BASE_URL}/v1/`, {
      headers: GLOBAL_HEADERS,
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    if (response.status === 404 && data.error?.message.includes("Invalid URL")) {
      console.log("✅ Success: Correct 404 JSON error for root.");
    }
    else {
      console.log("❌ Failure:", JSON.stringify(data, null, 2));
    }
  }
  catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function testStressConcurrency(count = 5) {
  console.log(`\n--- Stress Testing Concurrency (${count} requests) ---`);
  const url = `${BASE_URL}/api/prompt`;
  const prompts = [
    "What is the capital of France?",
    "Tell me a joke.",
    "Define AI.",
    "How does a rocket work?",
    "Who was Albert Einstein?",
  ];

  const sendRequest = async (id, prompt) => {
    console.log(`[Req #${id}] Sending...`);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: GLOBAL_HEADERS,
        body: JSON.stringify({ prompt, options: { reason: false } }),
      });
      const data = await res.json();
      console.log(`[Req #${id}] Status: ${res.status}`);
      return data;
    }
    catch (err) {
      console.error(`[Req #${id}] Error: ${err.message}`);
      return null;
    }
  };

  const start = Date.now();
  const limitedPrompts = prompts.slice(0, count);
  // If count > prompts.length, repeat some
  while (limitedPrompts.length < count) {
    limitedPrompts.push(prompts[limitedPrompts.length % prompts.length]);
  }

  await Promise.all(limitedPrompts.map((p, i) => sendRequest(i + 1, p)));
  const duration = (Date.now() - start) / 1000;
  console.log(`\n🏁 Stress test finished in ${duration}s`);
}


async function testImageUpload() {
  console.log("\n--- Testing Image Upload (Multimodal) ---");
  const url = `${BASE_URL}/v1/chat/completions`;
  const body = {
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "What is in this image?" },
          {
            type: "image_url",
            image_url: {
              url: "https://upload.wikimedia.org/wikipedia/en/a/a6/Pok%C3%A9mon_Pikachu_art.png",
            },
          },
        ],
      },
    ],
  };

  try {
    const start = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: GLOBAL_HEADERS,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    const duration = (Date.now() - start) / 1000;

    console.log(`Status: ${response.status} (${duration}s)`);
    if (data.choices && data.choices[0]?.message?.content) {
      console.log("✅ Success. Response snippet:", `${data.choices[0].message.content.slice(0, 100)}...`);
    } else {
      console.log("❌ Failure:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function runTests() {
  await testOpenAIChat();

  await waitForTimeout(2000);
  await testSystemPrompt();

  await waitForTimeout(2000);
  await testAssistantsAPI();

  await waitForTimeout(2000);
  await testLegacyPrompt();

  await waitForTimeout(1000);
  await testNotFound();

  await waitForTimeout(1000);
  await testInvalidAuth();

  await waitForTimeout(1000);
  await testValidationErrors();

  await waitForTimeout(1000);
  await testModelsEndpoint();

  await waitForTimeout(1000);
  await testV1Root();

  await waitForTimeout(2000);
  await testImageUpload();

  await waitForTimeout(2000);
  await testStressConcurrency(5);
}

runTests();

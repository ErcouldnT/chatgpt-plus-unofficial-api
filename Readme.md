# 🧠 Unofficial ChatGPT API Node.js

> A developer-focused Node.js + Puppeteer-powered backend that exposes an unofficial OpenAI ChatGPT API by automating browser interaction with chatgpt.com. Now supports **OpenAI-compatible endpoints** for integration with tools like n8n, LangChain, and more — ideal for local testing, prompt chaining, and AI chatbot exploration without using official API keys.

## 🚀 Features

-   **OpenAI-Compatible Endpoint**: `POST /v1/chat/completions` (Drop-in replacement for official API).
-   **Assistants API (Stateful)**: Supports Threads, Messages, and Runs (`/v1/threads`).
-   **Legacy Endpoint**: `POST /api/prompt` for direct control.
-   **Authentication**: Supports standard `Authorization: Bearer <KEY>` and custom header `ERKUT-API-KEY`.
-   **Tools Support**: Automates "Search" and "Reasoning" (O1) modes.
-   **Robust Login**: Supports email/password login and **cookie-based session persistence** to bypass CAPTCHAs.
-   **System Prompts**: Supports system prompts via API request or global environment variable.
-   **Multimodal Support**: Send text and images (URL or Base64) in a single request.

## 🛠️ Setup Guide

### 1. 📦 Installation

```bash
git clone https://github.com/ErcouldnT/chatgpt-plus-unofficial-api.git
cd chatgpt-plus-unofficial-api
npm install
```

### 2. ⚙️ Configuration

Create a `.env` file at the project root (see `.env.example`):

```env
# Credentials (Fallback if cookies fail)
OPENAI_EMAIL=your_email@example.com
OPENAI_PASSWORD=your_password

# API Protection (Required)
ERKUT_API_KEY=sk-your-secret-key

# Session Persistence (Recommended)
# Export cookies from chatgpt.com using "EditThisCookie" extension, convert to Base64
COOKIE_JSON_B64=Wm9...

# Default System Prompt (Optional)
SYSTEM_PROMPT="You are a helpful assistant."
```

### 3. ▶️ Run the Server

**Development Mode** (Visible browser, relaxed auth):
```bash
npm run dev
```
_Note: `npm run dev` automatically sets `NODE_ENV=development`._

**Production Mode** (Headless browser, strict auth):
```bash
npm start
```

## 🔁 API Endpoints

### 1. OpenAI Compatible Chat Completion
**Endpoint**: `POST /v1/chat/completions`

Compatible with standard OpenAI clients.

**Headers**:
-   `Content-Type: application/json`
-   `Authorization: Bearer <ERKUT_API_KEY>`

**Body**:
```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "What is in this image?" },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://upload.wikimedia.org/wikipedia/en/a/a6/Pok%C3%A9mon_Pikachu_art.png"
          }
        }
      ]
    }
  ]
}
```

**Supported Models**:
-   `gpt-4`, `gpt-4o`, `gpt-3.5`: Standard chat.
-   `o1`, `reason`: Enables **Reasoning** mode.
-   `search`, `web`: Enables **Web Search** mode.

---

### 2. Assistants API (Stateful)
Compatible with the OpenAI Assistants spec. Useful for n8n "OpenAI Assistant" node.

**Flow**:
1. `POST /v1/threads` -> returns `thread_id`
2. `POST /v1/threads/:id/messages` -> add user message
3. `POST /v1/threads/:id/runs` -> trigger execution (async)
4. `GET /v1/threads/:id/runs/:runId` -> poll for `completed` status
5. `GET /v1/threads/:id/messages` -> get list of messages including assistant response

---

### 3. Legacy Prompt Endpoint
**Endpoint**: `POST /api/prompt`

**Headers**:
-   `Content-Type: application/json`
-   `ERKUT-API-KEY: <ERKUT_API_KEY>`

**Body**:
```json
{
  "prompt": "What is in this image?",
  "images": ["https://example.com/image.png"],
  "systemPrompt": "Optional override for system prompt",
  "options": {
    "search": false,
    "reason": false,
    "threadId": "optional-thread-uuid"
  }
}
```

> [!NOTE]
> The `images` array supports both public URLs and Base64 data strings (e.g., `data:image/png;base64,...`).

## 🧪 Testing

Run the comprehensive test suite (checks both endpoints, system prompts, and assistants):

```bash
npm test
```

## ⚠️ Limitations & Notes

-   **Rate Limits**: Subject to ChatGPT's free/plus plan limits.
-   **Stability**: Relies on DOM selectors. Changes to ChatGPT's UI may break the automation until updated.
-   **Security**: This is an unofficial API. Use responsibly.

## 👩‍💻 Author

Extended by Erkut, originally based on work by Roxylius.

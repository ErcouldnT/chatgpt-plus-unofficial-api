# 🧠 Unofficial ChatGPT API Node.js

> A developer-focused Node.js + Puppeteer-powered backend that exposes an unofficial OpenAI ChatGPT API by automating browser interaction with chat.openai.com—ideal for local testing, prompt chaining, and AI chatbot exploration without using official API keys.


## 🚀 Why This Project?

While OpenAI’s official APIs are powerful, they come with rate limits, cost barriers, and limited conversation thread support. This project enables developers to:

- Use their personal ChatGPT account to interact with ChatGPT programmatically.
- Automate login and session persistence using Puppeteer and stealth plugins.
- Send prompts and get responses in a structured, customizable format.
- Mimic reasoning and web search modes for enhanced answers (optional).
- Simulate a local API-like development flow for chatbot prototyping and AI experimentation.

---

## 🧰 Tech Stack

- **Node.js** (Express) – API service
- **Puppeteer + Stealth Plugin** – ChatGPT automation
- **dotenv** – Credential & config management
- **HTML parsing** (in-progress) – To extract & process response
- **CORS, Body-Parser** – Clean JSON APIs

---

## 🛠️ Setup Guide

### 1. 📦 Clone & install dependencies

```bash
# Clone the repo
git clone https://github.com/roxylius/ChatGPT_unofficial_API_Node.git

# Move to the repo folder
cd ChatGPT_unofficial_API_Node

# Install all dependencies
npm install
```

### 2. ⚙️ Configure environment variables

> Note: Google Auth support is not added, Signup and generate email/password for auth

Create a `.env` file at the project root:

```env
OPENAI_EMAIL=your-chatgpt-login-email
OPENAI_PASSWORD=your-chatgpt-password
```

Replace `chatgpt-login-email` and `your-chatgpt-password` with your actual OpenAI account credentials.

### 3. ▶️ Run the server

Start the server by running:

```bash
node server.js
```

or

```
npm run dev
```

The server runs at [http://localhost:3001/](http://localhost:3001/) and will confirm “Server is up and Running……”.

## 🧪 Example Test Prompt

Run a test interaction:

```bash
npm run test
```

 Test workflow:
> 🌐Launch Chrome -> 📁Load Chrome-user-data -> 🔐Login -> ✉️Send Prompt -> ⏳Poll Response -> 📄Extract Text -> 💬Return JSON

## 🔁 API Endpoints

#### POST /api/prompt

- **Description:** Sends a prompt to ChatGPT and retrieves the response.
- **Request Body:**

```json
{
  "prompt": "Your prompt here",
  "options": {
    "reason": false,
    "search": true,
    "threadId": "optional_thread_id"
  }
}
```

| Field              | Type    | Description                                   | Required |
| ------------------ | ------- | --------------------------------------------- | -------- |
| `prompt`           | String  | The text prompt to send to ChatGPT.           | Yes      |
| `options.reason`   | Boolean | Enables Reason mode (default: false).         | No       |
| `options.search`   | Boolean | Enables Search mode (default: false).         | No       |
| `options.threadId` | String  | Specifies an existing conversation thread ID. | No       |

- **Response:**

```json
{
  "threadId": "the_thread_id",
  "response": "The response from ChatGPT"
}
```

| Field      | Type   | Description                        |
| ---------- | ------ | ---------------------------------- |
| `threadId` | String | The ID of the conversation thread. |
| `response` | String | The cleaned response from ChatGPT. |

Sample Response:

```json
{
  "threadId": "681a6cba-c0fc-8004-977c-f34adf806988",
  "response": "Why don't scientists trust atoms? Because they make up everything!"
}
```

> **Note:** Response times may vary based on prompt complexity and ChatGPT’s server load. Parsing may occasionally be inconsistent, particularly in Reason mode.

## 📂 Key Components & Dictory Tree
```
.
├── chrome-user-data/      # Persists browser session data (cookies, localStorage)
├── src/
│   ├── flows/
│   │   ├── basic-login.js   # Handles email/password login automation
│   │   └── prompt-flow.js   # Handles sending prompts and polling for responses
│   ├── services/
│   │   └── puppeteer-services.js # Manages shared Puppeteer browser and page instances
│   ├── utils/
│   │   └── helpers.js       # Utility functions (e.g., login check, timeouts)
│   └── views/
│       ├── login.js         # Express router for login-related endpoints
│       └── prompt.js        # Express router for prompt-related endpoints
├── .env                   # Environment variables (OpenAI credentials, Port)
├── .env.example           # Example environment file
├── example-test.js        # Standalone test script for Puppeteer automation
├── feature.md             # List of features and bug fixes
├── insights.md            # Important notes and observations
├── package.json           # Project metadata and dependencies
├── routes.js              # Main Express router configuration
├── server.js              # Main application entry point, starts Express server and Puppeteer
└── README.md              # This file
```


## 🔧 Planned Features

- Add markdown/HTML parser for formatted output
- Add file/image support
- Improve “Reason” mode polling
- Signup support
- Enhanced thread context management


## ⚠️ Known Issues

- Small viewport may trigger mobile view and change behavior.
- “Reason” mode writes to alternate DOM nodes.
- Some long responses split across multiple elements.


## 📊 Workflow Diagram

graph TD
A\[Client Request] -->|/api/prompt| B\[Express Server]
B --> C{Check Auth?}
C -->|Yes| D\[Use existing session]
C -->|No| E\[Run Login Flow]
E --> F\[Persist Session]
D --> G\[Load ChatGPT Page]
G --> H\[Inject Prompt]
H --> I\[Poll for Response]
I --> J\[Extract Response HTML/Text]
J --> K\[Return JSON to Client]



## 👩‍💻 Author

Developed with ☕ by Roxylius



## 📄 License

ISC License


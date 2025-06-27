FROM node:20-bookworm

RUN apt-get update && apt-get install -y wget gnupg ca-certificates

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub \
    | gpg --dearmor -o /usr/share/keyrings/google-linux-signing-keyring.gpg \
  && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux-signing-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
    > /etc/apt/sources.list.d/google-chrome.list

RUN apt-get update && apt-get install -y --no-install-recommends \
     google-chrome-stable fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Create Chrome user data directory
RUN mkdir -p /app/chrome-user-data

# Declare volume for persistence
VOLUME ["/app/chrome-user-data"]

CMD ["node", "server.js"]


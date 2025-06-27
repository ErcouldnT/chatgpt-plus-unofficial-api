FROM node:20-bookworm

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      wget gnupg fonts-liberation libatk1.0-0 libnss3 \
      libx11-xcb1 libxcomposite1 libxrandr2 libgbm1 \
      libasound2 libpng-dev libxss1 libgtk-3-0 \
      google-chrome-stable && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
CMD ["node", "server.js"]
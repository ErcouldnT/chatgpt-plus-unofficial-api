FROM public.ecr.aws/zenika/alpine-chrome:with-puppeteer

# skip Puppeteer's Chromium download since it's already included in the image
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# install application dependencies
COPY package*.json ./
RUN npm ci

COPY . .

# create a volume for Chrome user data if needed
RUN mkdir -p /app/chrome-user-data
VOLUME ["/app/chrome-user-data"]

# run as chrome user instead of root for better security
USER chrome

CMD ["node", "server.js"]

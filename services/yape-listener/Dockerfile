FROM node:22-slim

WORKDIR /app

# Install build tools for better-sqlite3 native addon
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --production=false

COPY tsconfig.json ./
COPY *.ts ./
RUN npm run build

RUN npm prune --production

RUN mkdir -p /app/data

ENV PORT=3001
ENV DB_PATH=/app/data/yape.db

EXPOSE 3001

CMD ["node", "dist/server.js"]

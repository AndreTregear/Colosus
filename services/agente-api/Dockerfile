FROM node:22-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

RUN npm prune --production
RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV DB_PATH=/app/data/yaya.db

CMD ["node", "dist/server.js"]

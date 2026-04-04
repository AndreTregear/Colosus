FROM node:22-slim
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 8091
CMD ["npx", "tsx", "router.ts"]

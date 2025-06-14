FROM node:24-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY package*.json ./
RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["node", "--env-file=.env", "distributed-system-project/cache-proxy/index.ts"] 
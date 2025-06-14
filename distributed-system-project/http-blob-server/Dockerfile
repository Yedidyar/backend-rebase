FROM node:24-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY package*.json ./
RUN pnpm install

COPY . .

# Create storage and metadata directories
RUN mkdir -p storage metadata

EXPOSE ${PORT}

CMD ["node", "--env-file=.env", "distributed-system-project/http-blob-server/index.ts"] 
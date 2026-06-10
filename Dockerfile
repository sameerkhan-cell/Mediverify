# Production Dockerfile for MediVerify
FROM node:20-slim AS base

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm install

# Source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build
RUN npm run build

# Production Runner
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y openssl

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.output ./.output
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/prisma ./prisma

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]

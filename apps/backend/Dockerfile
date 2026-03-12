FROM node:18-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npx tsc -p tsconfig.build.json || true

ENV NODE_ENV=production
EXPOSE 3001

# Migrate then start
CMD npx prisma migrate deploy && node dist/main.js

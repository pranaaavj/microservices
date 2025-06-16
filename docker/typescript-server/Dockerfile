FROM node:20 AS base

# Stage 1
FROM base AS builder

COPY . .

RUN npm install 

RUN npx tsc 

# Stage 2
FROM base AS runner

COPY --from=builder /dist /app

COPY --from=builder package*.json .

RUN npm install --omit=dev

CMD ["node", "/app/index.js"]
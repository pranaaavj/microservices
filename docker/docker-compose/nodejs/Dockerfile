# Stage 1 - Building stage
FROM node AS builder

WORKDIR /app

COPY /package*.json /app
RUN npm install

COPY . .
RUN npm run build

# Stage 2 - Running Stage
FROM node:18-alpine AS runner

COPY --from=builder /app/dist ./
COPY --from=builder /app/package*.json ./ 

RUN npm install --omit=dev

CMD ["npm", "start"]
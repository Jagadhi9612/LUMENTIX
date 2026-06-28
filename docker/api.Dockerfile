FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
RUN npm install

FROM deps AS build
COPY . .
RUN npm run db:generate && npm run build --workspace @elite/api

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/db ./packages/db
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]

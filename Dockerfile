FROM node:20-slim

WORKDIR /app

# Install Redis and openssl
RUN apt-get update && apt-get install -y redis-server openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
COPY apps/customer/package.json ./apps/customer/
COPY apps/staff/package.json ./apps/staff/
COPY apps/superadmin/package.json ./apps/superadmin/
COPY packages/api/prisma/ ./packages/api/prisma/

RUN npm install

# Copy source
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

# Generate Prisma client
RUN npx prisma generate --schema=packages/api/prisma/schema.prisma

# Build Shared Package First
RUN npm run build --workspace=@dinesmart/shared

# Build Arguments
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Build All Frontends and API
RUN npm run build:customer && \
    npm run build:staff && \
    npm run build:superadmin && \
    npm run build:api

# Set production environment
ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

# Create a startup script that runs Redis and the app
RUN echo '#!/bin/sh\n\
redis-server --daemonize yes\n\
node packages/api/dist/app.js\n\
' > start.sh && chmod +x start.sh

CMD ["./start.sh"]

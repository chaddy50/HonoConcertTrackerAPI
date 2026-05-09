FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies first.
# Docker caches this layer separately, so re-builds only re-run npm ci
# when package.json or package-lock.json actually change.
COPY package*.json ./
RUN npm ci

# Generate Prisma client before compiling TypeScript.
# prisma generate outputs to src/generated/prisma, which tsc needs to see.
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the source and compile.
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/src/index.js"]

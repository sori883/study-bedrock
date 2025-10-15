# Build
FROM node:24.10-slim AS builder
ENV PNPM_HOME="/tmp/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm
WORKDIR /app

COPY pnpm-lock.yaml package.json ./
RUN --mount=type=cache,id=pnpm,target=/tmp/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Runtime
FROM node:24.10-alpine AS runner
WORKDIR /app

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080
CMD ["node", "server.js"]
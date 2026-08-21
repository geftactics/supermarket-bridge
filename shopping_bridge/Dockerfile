FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV HOME=/data
ENV STATE_FILE=/data/state.json
ENV PREFERRED_PRODUCTS_FILE=/data/preferred-products.json
ENV BIND_HOST=0.0.0.0

COPY package*.json ./
RUN npm install --omit=dev \
  && npx playwright install --with-deps chromium

COPY src ./src
COPY config ./config
COPY README.md ./

VOLUME ["/data"]
EXPOSE 8124

CMD ["node", "src/addon-runner.js"]

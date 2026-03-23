FROM node:20-alpine@sha256:b88333c42c23fbd91596ebd7fd10de239cedab9617de04142dde7315e3bc0afa
WORKDIR /app
COPY src/server.mjs ./server.mjs
EXPOSE 3001
USER node
CMD ["node", "server.mjs"]

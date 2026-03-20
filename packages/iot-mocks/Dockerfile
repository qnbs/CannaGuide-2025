FROM node:20-alpine
WORKDIR /app
COPY src/server.mjs ./server.mjs
EXPOSE 3001
USER node
CMD ["node", "server.mjs"]

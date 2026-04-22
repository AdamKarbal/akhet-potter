FROM node:18-slim

WORKDIR /app

COPY gateway/package*.json ./

RUN npm install

COPY gateway/. ./
COPY helpers ./helpers

# La gateway écoute sur 8000
EXPOSE 8000

CMD ["node", "index.js"]
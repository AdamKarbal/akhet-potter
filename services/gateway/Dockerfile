FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# La gateway écoute sur 8000
EXPOSE 8000

CMD ["node", "index.js"]
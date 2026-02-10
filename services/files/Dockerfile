FROM node:18-slim

WORKDIR /app

# On copie tout (y compris index.js, logic.js et tes fichiers html)
COPY . .

# Pas besoin de npm install car on utilise que des modules natifs (fs, http, path)
# Sauf si tu as un package.json, dans ce cas décommente la ligne suivante :
# RUN npm install

EXPOSE 8001

CMD ["node", "index.js"]
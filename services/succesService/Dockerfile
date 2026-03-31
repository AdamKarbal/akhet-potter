# Image de base demandée (légère)
FROM node:18-slim

# Création du dossier de travail dans le conteneur
WORKDIR /app

# On copie d'abord les fichiers de dépendances (optimisation cache Docker)
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du code source
COPY . .

# Le port sur lequel le service écoute (interne au réseau Docker)
EXPOSE 8005

# Commande de démarrage
CMD ["node", "index.js"]
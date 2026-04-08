#  PS8 - Akhet'Potter

##  Membres de l'équipe

* LABORIE Raphaël
* HITMI Younes
* KARBAL Adam

---

##  Installation & Lancement

###  Installation locale

1. Cloner le dépôt :

```bash
git clone <url-du-repo>
```

2. Lancer Docker

3. Aller dans le dossier du projet :

```bash
cd ps8-26-akhet-potter
```

4. Lancer le projet :

```bash
docker compose up --build
```

5. Ouvrir dans le navigateur :
   http://localhost:8000/

---

### 🌐 Accès en ligne

http://akhetpotter.ps8.pns.academy/

---

##  Fonctionnalités

###  Authentification

* Inscription avec :

  * Username
  * Mot de passe
  * Question de sécurité
  * Réponse à la question
    
* Connection avec :
  * Username
  * Mot de passe
    
* Mot de passe oublié :

  * Saisie du username
  * Question affichée
  * Vérification de la réponse
  * Modification du mot de passe

---

### Succès

* Premier sang : lancer une partie en ligne
* Entraînement : jouer contre l’IA
* L'élève dépasse le maître : battre l’IA
* Sociable : ajouter un ami
* Bavard : envoyer un message
* Sorcier : gagner une partie en ligne
* Champion des trois sorciers : gagner 100 parties

---

### Social

* Rechercher un ami
* Ajouter un ami (notification)
* Supprimer un ami
* Duel entre amis

---

### Chat

* Chat global :

  * Sur les pages (pages principales, amis, demandes amis, ...)
  * Tout le monde peut parler dedans
    
* Chat en match :

  * Messages prédéfinis
  * Possibilité de mute

---

### Mode 1vIA

* Partie contre une IA
* 20 secondes par tour

---

### Mode 1v1 en ligne

* Match en ligne
* Système de room

---

### ELO & Ligues

* 7 ligues (années façon Poudlard)
* 1000 ELO pour passer à la suivante

---

## Architecture ( à partir d'ici pas à jour jusqu'au 19/04/26 23h59 grand maxxxx)

Le dossier `services/` contient tous les services du projet.

Chaque service Node.js contient :

* `package.json`
* `index.js` (serveur HTTP)
* Logique métier

---

### 🔹 Services existants

* **gateway**

  * Point d’entrée
  * Redirige les requêtes

* **files**

  * Sert les fichiers front

---

### ➕ Ajouter un service

```bash
mkdir services/mon-service
cd services/mon-service
npm init -y
```

Créer ensuite un `index.js` avec un serveur HTTP.

---

### 🔗 Communication entre services

Packages utilisés :

```bash
npm install axios http-proxy
```

* **http-proxy** → transfert de requêtes
* **axios** → requêtes REST

---

## Structure

```
ps8-26-akhet-potter/
│
├── services/
│   ├── gateway/
│   ├── files/
│   └── autres services
│
├── docker-compose.yaml
└── README.md
```

---

## Commandes utiles

### Lancer

```bash
docker compose up --build
```

### Stopper

```bash
docker compose down
```

### Rebuild complet

```bash
docker compose down -v
docker compose up --build
```

---

## Remarques

* Architecture microservices
* Services indépendants
* Gateway central

---

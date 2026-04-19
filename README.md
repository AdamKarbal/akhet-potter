# PS8 - Akhet'Potter

## Membres de l'equipe

* LABORIE Raphaël
* HITMI Younes
* KARBAL Adam

---

## Installation & Lancement

### Installation locale

1. Cloner le depot :

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
   https://localhost:8000/

---

### Acces en ligne

https://akhetpotter.ps8.pns.academy/

---

## Fonctionnalites

### Authentification

* Inscription avec :
  * Username
  * Mot de passe
  * Question de securite
  * Reponse a la question
    
* Connection avec :
  * Username
  * Mot de passe
    
* Mot de passe oublie :
  * Saisie du username
  * Question affichee
  * Verification de la reponse
  * Modification du mot de passe

---

### Succes

* Premier sang : lancer une partie en ligne
* Entrainement : jouer contre l'IA
* L'eleve depasse le maitre : battre l'IA
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
  * Systeme de censure avec une blacklist (mot dans la blackliste pour le moment : "insulte", "censure")
    
* Chat en match :
  * Messages predefinis
  * Possibilite de mute

---

### Mode 1vIA

* Partie contre une IA
* 20 secondes par tour

---

### Mode 1v1 en ligne

* Match en ligne
* Systeme de room

---

### ELO & Ligues

* 7 ligues (annees facon Poudlard)
* 1000 ELO pour passer a la suivante

---

## Architecture Backend

Le projet repose sur une architecture orientee microservices. Cette separation permet d'isoler les responsabilites, de simplifier la maintenance, de faciliter la montee en charge ciblable de certains services (comme le jeu en ligne).

### Services developpes et leurs responsabilites

* **gateway** (Port 8000) : 
  C'est le point d'entree unique de l'application. Il gere le routage des requetes HTTP entrantes vers les microservices appropries, et le reverse-proxying des connexions WebSockets. Ce service permet de centraliser la gestion de la securite et d'abstraire la complexite de l'infrastructure backend au client.

* **files** (Port 8001) : 
  Serveur de fichiers statiques. Il est responsable de delivrer le contenu du Front-End (HTML, CSS, JS, images, son) au client.

* **auth** (Port 8002) : 
  Service d'authentification et de gestion des donnees utilisateurs. Il s'occupe de la creation de compte, de la connexion (generation de JWT), de la gestion de mot de passe oublie, mais aussi des relations sociales (liste d'amis, requetes d'amis) en interaction avec la base de donnees MongoDB.

* **game** (Port 8003) : 
  Le moteur de jeu multijoueur et JvIA. Ce service maintient l'etat des parties en temps reel, gere la file d'attente (matchmaking), applique les regles du jeu, synchronise les actions des joueurs (timers, coups) et distribue les notifications liees au jeu (demandes de duels entre amis).

* **social** (Port 8004) : 
  Gere la messagerie globale. Ce service permet la communication de tous les joueurs connectes sur l'interface principale, avec filtrage des insultes.

* **succes** (Port 8005) : 
  Gere la logique d'accomplissement des joueurs. Il est contacte de maniere asynchrone a la fin des actions cles (victoire, premier match, premier message, etc.) pour debloquer et stocker les succes sans ralentir le flux principal de jeu ou d'authentification.

* **db** (Port 27017) : 
  Instance MongoDB centralisant la donnee persistante de l'application (utilisateurs, amis, historiques, succes).

### Stratégie de Communication et Flux de Donnees

* **Requetes HTTP (REST)** : 
  Le client Front-End initie des requetes HTTP classiques (via `fetch`) vers la `gateway` pour toutes les actions ne necessitant pas de bidirectionnalite rapide. Cela concerne : 
  - La recuperation des fichiers statiques (vers le service `files`).
  - Toutes les actions de gestion de compte et de relations (login, signup, friend requests) redirigees vers le service `auth`.
  - La consultation des succes (redirige vers `succes`).
  - La communication inter-services pour des validations se fait egalement en HTTP de serveur a serveur (ex: le `game` service qui requete le `succes` service via `fetch` pour valider un trophee).

* **WebSockets (Temps Reel)** : 
  Le client initialise deux connexions persistantes bidirectionnelles distinctes afin de garantir la reactivite :
  1. **GameSocket** (vers `game`) : Initiee au chargement de la page si l'utilisateur est connecte. Elle transmet les actions de matchmaking, les coups joues, les timers, et recoit les etats du plateau ainsi que les notifications sociales prioritaires (invitation en duel, toast "demande d'ami recu").
  2. **SocialSocket** (vers `social`) : Initiee par le composant de chat global. Elle gere un canal de diffusion massif asynchrone pour les messages du hall.
  
L'utilisation de WebSockets pour le jeu et le chat est incontournable afin d'eviter le long-polling repetitif qui surchargerait le serveur, assurant une experience fluide pendant la partie. Le choix de separer en deux connexions (Game et Social) permet d'eviter d'avoir des lags dans une partie. La `gateway` gere dynamiquement la transmission des connexions WebSockets aux bons services cibles grace a des chemins distincts (`/socket.io/` vs `/social.io/`).

---
## Remarque

Concernant le service d'authentification (authService), la gestion des fonctionnalités sociales (ajout, suppression et liste d'amis) aurait dû être transférée vers le service socialService. Toutefois, cette migration n'a pu être réalisée par manque de temps et par un défaut de synchronisation au sein de l'équipe.

---
## Structure des Dossiers

```
ps8-26-akhet-potter/
|
|-- services/
|   |-- authService/
|   |-- backend/ (game service)
|   |-- files/
|   |-- gateway/
|   |-- socialService/
|   |-- succesService/
|
|-- docker-compose.yaml
|-- README.md
```
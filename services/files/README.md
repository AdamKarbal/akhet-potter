# Architecture Front-End

Ce document décrit l'architecture front-end de notre application, qui est servie par ce microservice (Files Service).

## Approche Globale : Single Page Application (SPA)

Notre front-end a été conçu comme une **Single Page Application (SPA)** en Vanilla JavaScript, sans l'utilisation de frameworks lourds comme React ou Angular. 
L'application repose sur un fichier principal (`main.js`) qui écoute les changements d'URL (via l'événement `hashchange`) et met à jour dynamiquement le contenu d'un conteneur central (`<div id="app">`).

Cette approche permet de :
- Naviguer entre les différentes vues de manière fluide, sans recharger la page entière.
- Maintenir en vie les connexions persistantes (comme nos WebSockets pour le jeu et le chat) tout au long de la navigation de l'utilisateur.
- Gérer un état d'application global sans perdre le contexte lors des transitions.

## Structure des Vues (Pages)

L'application est divisée en plusieurs pages principales, qui sont chargées dynamiquement en fonction de l'URL :

- **home-page** : Le menu principal offrant l'accès aux différents modes de jeu (1v1, Local, Vs IA).
- **login-page** : La page de connexion et d'inscription (qui agit de pair avec une modale d'authentification).
- **match-page** : L'interface principale pour les parties multijoueurs classées ou amicales en ligne.
- **vsordi-page** : L'interface dédiée aux parties contre l'intelligence artificielle.
- **settings-page** : La page permettant à l'utilisateur de configurer ses préférences (audio, etc.).
- **help-page** : Une page listant les règles du jeu et l'explication sur la ranked.
- **achievement-page** : La page listant les succès débloqués et à débloquer par l'utilisateur.
- **request-page** : L'interface dédiée à la gestion des demandes d'amis et des invitations à jouer.

Certaines fonctionnalités qui auraient pu être des pages complètes ont été intégrées sous forme de **pop-ups ou modales** (comme l'authentification rapide ou l'affichage de fin de partie avec `quit-component` / `revenge-component`) pour ne pas interrompre l'expérience utilisateur.

## Utilisation des Web Components (Composants Natifs)

Toute l'interface utilisateur est construite à l'aide de **Web Components**. Chaque élément de l'interface est encapsulé dans son propre composant.

Chaque composant majeur possède désormais son propre dossier contenant :
1. Un fichier **.js** (Logique métier et gestion du DOM).
2. Un fichier **.html** (Structure du composant).
3. Un fichier **.css** (Styles spécifiques au composant).


### Liste non-exhaustive des composants clés :

- **navbar-component** : Présent sur la majorité des pages, il permet la navigation globale.
- **global-chat-component** : Intégré globalement, il permet aux joueurs de discuter dans un salon général indépendamment de la page sur laquelle ils se trouvent (utilise un socket dédié).
- **chat-component** : Un chat spécifique instancié uniquement lors des parties en ligne (match-page).
- **GameBoard** & **player-layout** : Le cœur de l'interface de jeu, gérant l'affichage du plateau, des animations (via un Canvas/Renderer) et de l'état des joueurs.
- **social-component** : Composant gérant la liste d'amis et l'envoi de requêtes.
- **player-inventory** / **moves-component** : Composants pour l'affichage des actions et objets utilisables en partie.
- **gameloader-component** : Composant affichant l'attente lors du matchmaking.

### Justification de cette architecture :

L'utilisation des Web Components couplée à la séparation des fichiers (JS/HTML/CSS) nous a permis de :
- Garder un code très modulaire et lisible.
- Réutiliser facilement des éléments complexes (comme le `GameBoard` qui est utilisé aussi bien dans `match-page` que dans `vsordi-page`).
- Éviter les conflits de styles CSS (chaque composant chargeant son propre style de manière isolée).
- Faciliter le travail en équipe, chaque membre pouvant travailler sur un composant ou une vue spécifique sans impacter le reste de l'application.

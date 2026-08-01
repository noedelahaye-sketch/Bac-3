# Contexte

Noé prépare 4 dossiers pour valider sa formation Studi en marketing
et communication. Dépôt début décembre 2026. 43 questions au total,
plus une vidéo sur le Bloc 1.

Ce sont des dossiers à faire chez soi : notes libres, temps libre.
Chaque question de l'énoncé indique la compétence et les critères
évalués — c'est la grille de correction, donnée à l'avance. On
construit les réponses à partir des critères, jamais à partir des
cours en vrac.

Les 4 blocs, dans l'ordre de traitement :
- B1 Élaboration d'une stratégie — cas Bellewaerde (hôtel de parc).
  Porte la vidéo. Prioritaire.
- B2 Déploiement des actions — cas Bambu Lab (imprimante 3D, BtoB).
- B4 Management des acteurs — cas Drumeo x Your Story Agency.
- B3 Pilotage de la performance — cas PrepMyMeal (foodtruck).
  En dernier, le plus technique (tableur).

Cadence visée : environ 3 livrables par semaine.

# Le projet

L'application (index.html + css/style.css + js/*.js) est un outil
autonome de suivi et de révision : 44 livrables avec critères et
brouillons, fiche de cohérence, journal d'arbitrages, 84 flashcards
en répétition espacée, 25 questions de quiz et 30 fiches de méthode
(pages "Apprendre" et "Cours"). Stockage via window.storage, doit
rester fonctionnel hors ligne.

Fichiers JS : data.js (BLOCS, INFO, CARDS, QCM, FICHES), ressources.js
(RESSOURCES — contenu de cours détaillé par question), supports.js
(catalogue des PDF de cours), annexes.js (ANNEXES par bloc), app.js
(routage et vues).

Le design suit design-spec.md (typographie, palette, vocabulaire) et
brief-navigation.md (grille, routage à trois niveaux, structure des
pages — remplace les sections correspondantes de design-spec.md).
Polices auto-hébergées dans fonts/ (Clash Display, Instrument Sans,
Geist Mono), aucune dépendance externe.

cours/ contient les PDF de la formation, rangés par bloc. énoncé/
contient les énoncés d'examen ; celui du Bloc 1 est cartographié
dans docs/cartographie-b1.md.

# État d'avancement

- Bloc 1 (Bellewaerde) : les 11 questions ont leur INFO enrichi
  (vocabulaire Studi, source de cours). Ressource de cours détaillée
  (RESSOURCES) faite pour b1-Q1 et b1-Q7 seulement — les 9 autres
  questions restent à enrichir, une à la fois.
- Navigation à trois niveaux (Dossiers → Bloc → Question) posée pour
  le Bloc 1 uniquement : page Bloc et page Question en deux colonnes,
  avec énoncé/annexes du bloc. B2, B4, B3 ont leur tuile sur la page
  Dossiers mais leur page Bloc reste au rendu simple, sans contenu
  propre pour l'instant.
- B2, B4, B3 : pas encore cartographiés ni enrichis (cartographie,
  vocabulaire, ressources, navigation dédiée restent à faire, bloc
  par bloc, dans cet ordre : B2 puis B4 puis B3).

# Règles de travail

- Tu expliques les notions et structures les réponses avec Noé.
  Tu ne rédiges pas ses réponses à sa place : la vidéo lui demande
  d'expliquer son propre raisonnement.
- Tu ne traites jamais l'ensemble des cours d'un coup. Un bloc à la
  fois, une question à la fois.
- Design : palette et typographies existantes (Archivo, Instrument
  Sans), pas de dépendance externe ajoutée.
- Français, ton direct, pas de jargon inutile.


## Modèle de contenu — fiches de révision

- Une **fiche** = un `.md` dans `cours/bloc<n>/fiches/`, avec frontmatter YAML.
- Le frontmatter fait autorité : `titre`, `accroche`, `questions`,
  `questions_appui`, `competences`, `sources`, `lecture_min`. Aucun de ces
  éléments n'est écrit en dur dans un composant ou une page.
- `cours/blocs.json` définit les 4 blocs et l'ordre des fiches. La page Cours
  se construit entièrement depuis ce fichier + les frontmatters.
- Un **support** = un PDF de cours Studi d'origine. Il n'est jamais listé seul :
  il n'apparaît que dans le champ `sources` d'une fiche.
- Ajouter un bloc = créer `cours/bloc<n>/fiches/`, y déposer des `.md`,
  renseigner le titre dans `blocs.json`. Aucune modification de code.
- La vue « par question d'examen » est une projection calculée du champ
  `questions`. Ne jamais créer de fichier de contenu qui la duplique.

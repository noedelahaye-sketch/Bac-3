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

L'application (index.html + css/style.css + js/*.js) est un outil autonome
de suivi et de révision, en mode sombre. Quatre sections, chacune avec la
même navigation à trois niveaux (racine → bloc → détail) : Dossiers (44
livrables avec critères et brouillons), Cours (résumés + contenu de cours
par question), Apprendre → Flashcards (répétition espacée) et Apprendre →
Quiz (7 formats), ces deux dernières avec sélection par bloc puis par
notion/format. Bloc 1 porte aussi la fiche de cohérence et le journal
d'arbitrages (page Dossiers → Bloc 1).

Stockage en localStorage par appareil, plus synchronisation optionnelle
entre appareils via un Gist GitHub privé (section "Synchronisation" en bas
de la page Accueil — jeton à coller une fois par appareil). Reste
fonctionnel hors ligne : le premier rendu utilise toujours l'état local, la
synchronisation distante arrive ensuite en arrière-plan.

Déployé sur GitHub Pages : dépôt public github.com/noedelahaye-sketch/Bac-3,
site en ligne à https://noedelahaye-sketch.github.io/Bac-3/. `git push`
demande une authentification que Claude ne peut pas fournir depuis son bash
sandboxé (pas d'accès au trousseau) — c'est toujours Noé qui pousse, depuis
son propre Terminal.

Fichiers JS générés, jamais édités à la main : `js/cours.js`,
`js/questions.js`, `js/flashcards.js`, `js/quiz.js`, produits par
`node tools/generate-cours.js` à partir des sources dans `cours:/bloc<n>:/`
(voir « Modèle de contenu » plus bas). À relancer après toute modification
d'un `.md` ou `.json` source.

Fichiers JS écrits à la main : data.js (BLOCS, INFO — les 44 questions
d'examen et leurs critères), ressources.js (RESSOURCES, ancien format de
contenu détaillé, seulement b1-Q1/b1-Q7, en voie de remplacement par le
contenu par question généré), annexes.js (ANNEXES par bloc), app.js
(routage et toutes les vues).

Le design suit design-spec.md (vocabulaire) et brief-navigation.md (grille,
routage à trois niveaux, structure des pages — remplace les sections
correspondantes de design-spec.md ; les deux documents datent du mode clair
d'origine, la palette a depuis basculé en sombre, voir css/style.css pour
les valeurs actuelles). Polices auto-hébergées dans fonts/ (Clash Display,
Instrument Sans, Geist Mono), aucune dépendance externe.

**Piège de nommage** : les dossiers réels sur disque se terminent par un
deux-points (`cours:`, `bloc1:`, `resume:`, `questions:`, `flashcards:`,
`quiz:`, `énoncé:`). Ce n'est pas une coquille — `ls cours` échoue, il faut
toujours citer le nom exact avec son deux-points final.

# État d'avancement

- Bloc 1 (Bellewaerde) entièrement construit sur les 4 sections : Cours (7
  résumés + contenu par question sur les 11 questions), Dossiers (INFO
  enrichi sur les 11 questions ; la tuile de contenu de cours dans la page
  Question n'est branchée que sur b1-Q1 pour l'instant — généralisable aux
  10 autres sur le même modèle que Q1), Flashcards (329 cartes) et Quiz
  (256 questions, 7 formats).
- B2, B4, B3 : dossiers sources vides (`cours:/bloc2:/` etc.), tuiles
  "À venir" partout (Cours, Flashcards, Quiz). Pas encore cartographiés ni
  enrichis — bloc par bloc, dans cet ordre : B2 puis B4 puis B3, en
  reproduisant le pipeline déjà rodé sur B1 (résumés → contenu par
  question → flashcards → quiz → régénération).
- Point de vigilance avant de générer B2 : les id de flashcards/quiz ne
  sont pas préfixés par le bloc (ex. `c-f01-001`, `q-f01-001`). Si B2
  réutilise la même convention de numérotation que B1, ses cartes/questions
  pourraient entrer en collision avec celles de B1 dans le suivi de
  progression (S.box/S.due, historique quiz). À vérifier — ou à corriger
  dans `tools/generate-cours.js` en préfixant les id par bloc — avant de
  livrer B2.

# Règles de travail

- Tu expliques les notions et structures les réponses avec Noé.
  Tu ne rédiges pas ses réponses à sa place : la vidéo lui demande
  d'expliquer son propre raisonnement.
- Tu ne traites jamais l'ensemble des cours d'un coup. Un bloc à la
  fois, une question à la fois.
- Un chantier de site se construit pareil : un exemple minimal d'abord
  (un fichier, un format, un chemin de code), vérifié visuellement dans
  le navigateur, validé par Noé, puis généralisé au reste.
- Design : palette sombre et typographies existantes (Clash Display,
  Instrument Sans, Geist Mono), pas de dépendance externe ajoutée.
- Français, ton direct, pas de jargon inutile.


## Modèle de contenu

Tout le contenu vit sous `cours:/bloc<n>:/`, en quatre familles de
fichiers sources, jamais référencées en dur dans le code — le générateur
(`tools/generate-cours.js`) les lit et produit les `js/*.js` correspondants.

- **Résumés** — `resume:/*.md`, frontmatter YAML (`id`, `titre`, `accroche`,
  `questions`, `questions_appui`, `competences`, `sources`, `lecture_min`).
  `cours:/blocs.json` définit les 4 blocs et l'ordre des résumés ; la page
  Cours se construit entièrement depuis ce fichier + les frontmatters.
  → `js/cours.js` (RESUMES, COURS_BLOCS).
- **Contenu par question** — `questions:/*.md`, un fichier par question
  d'examen (frontmatter `id`, `competence`, `resumes`, `resumes_appui`).
  → `js/questions.js` (QUESTIONS_COURS), affiché derrière une tuile dans
  la page Question.
- **Flashcards** — `flashcards:/*.json`, un fichier par résumé, cartes
  avec `section`, `niveau` (1-2), `type` (definition/liste/distinction/
  application), `recto`, `verso`. → `js/flashcards.js` (FLASHCARDS).
- **Quiz** — `quiz:/*.json`, un fichier par résumé, questions avec
  `section`, `niveau`, `format` (qcm / qcm_multiple / vrai_faux /
  texte_a_trous / appariement / ordonnancement / ouverte) et les champs
  propres à chaque format. → `js/quiz.js` (QUIZ).

Un **support** = un PDF de cours Studi d'origine (dans `cours:/bloc<n>:/`,
hors sous-dossiers, gitignored). Il n'est jamais listé seul : il n'apparaît
que dans le champ `sources` d'un résumé.

Ajouter un bloc = déposer les `.md`/`.json` dans les quatre sous-dossiers
de `cours:/bloc<n>:/`, renseigner le bloc dans `blocs.json`, puis
`node tools/generate-cours.js`. Aucune modification de code si les
conventions existantes sont respectées.

La vue « par question d'examen » (chantier futur, pas encore construite)
est une projection calculée du champ `questions` des résumés. Ne jamais
créer de fichier de contenu qui la duplique.

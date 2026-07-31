# Brief — navigation à trois niveaux

Complète et remplace la section « Grille » et la section « Structure des pages »
de `design-spec.md`. Le reste du cahier des charges (typographie, palette,
vocabulaire, qualité de base, mouvement) reste valable tel quel.

---

## 1. Largeur et grille

| Élément | Valeur |
|---|---|
| Largeur maximale du contenu | **1240 px** |
| Marges latérales | 32 px sur ordinateur · 20 px tablette · 16 px mobile |
| Gouttière entre colonnes | 24 px |
| Largeur maximale d'un bloc de texte | **70 caractères** (`max-width: 68ch`) |

**La règle qui compte.** La mise en page occupe toute la largeur disponible ;
le texte, jamais. Une ligne de 1200 px est illisible : l'œil perd le début de
la ligne suivante. La largeur sert à poser des colonnes côte à côte, pas à
étirer des phrases.

Points de rupture : `1080px` et `720px`.

---

## 2. Les trois niveaux

```
#/dossiers          4 tuiles, une par bloc
     ↓
#/bloc/b1           questions du bloc + énoncé à droite
     ↓
#/q/b1-Q1           la question, en pleine page
```

Fil d'Ariane en haut de chaque page à partir du niveau 2 :
`Dossiers › Bloc 1 › Q1`. Chaque segment est cliquable.

---

## 3. Page Dossiers

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Dossiers                                                               │
│  44 livrables · dépôt début décembre                                    │
├──────────────┬──────────────┬──────────────┬──────────────┐             │
│ B1           │ B2           │ B4           │ B3           │             │
│              │              │              │              │             │
│ Élaboration  │ Déploiement  │ Management   │ Pilotage     │             │
│ d'une        │ des actions  │ des acteurs  │ de la        │             │
│ stratégie    │              │              │ performance  │             │
│              │              │              │              │             │
│ Bellewaerde  │ Bambu Lab    │ Drumeo × YSA │ PrepMyMeal   │             │
│              │              │              │              │             │
│ ▓▓▓▓░░░░ 36% │ ░░░░░░░░  0% │ ░░░░░░░░  0% │ ░░░░░░░░  0% │             │
│ 4 / 11       │ 0 / 13       │ 0 / 11       │ 0 / 9        │             │
└──────────────┴──────────────┴──────────────┴──────────────┘             │
```

**Disposition :** 4 colonnes au-delà de 1080 px · 2 × 2 entre 720 et 1080 ·
1 colonne en dessous.

**Contenu d'une tuile**, de haut en bas :
- le code du bloc, en chasse fixe, `--muted`
- le titre, Clash Display 600, 19 px
- le nom du cas, `--muted`, 13 px
- la barre de progression
- le compte `4 / 11`, en chasse fixe

**La barre de progression.** Hauteur 3 px, fond `--line`, remplissage
`--signal`, pas de rayon. Le pourcentage est écrit à droite de la barre, en
chasse fixe, 12 px, `--muted`. Discret : c'est une information, pas une
récompense.

Les tuiles sont ordonnées **par ordre de traitement conseillé** — B1, B2, B4,
B3 — et non par numéro. L'ordre encode la stratégie.

État survol : la bordure passe en `--signal`, rien d'autre ne bouge.

---

## 4. Page Bloc

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Dossiers › Bloc 1                                                      │
│  Élaboration d'une stratégie marketing et communication                 │
│  Bellewaerde — hôtel « Le Royaume de Léo »                              │
│  ▓▓▓▓░░░░░░░░░░░░ 36 %   ·   4 / 11 livrables                           │
├──────────────────────────────────────┬──────────────────────────────────┤
│  LES QUESTIONS                       │  L'ÉNONCÉ                        │
│                                      │  (colonne fixe au défilement)    │
│  Q1  Objectifs de veille       relu  │                                  │
│  Q2  Concurrents             rédigé  │  ▸ Contexte                      │
│  Q3  Opportunités et menaces  ●●○    │     Bellewaerde, 800 000 visi-   │
│  Q4  Recueil de données      à faire │     teurs par an, dont 40 % de   │
│  Q5  Segmentation            à faire │     Français…                    │
│  …                                   │                                  │
│  Vidéo  Présentation          à faire│  ▸ La mission                    │
│                                      │  ▸ Les données à retenir         │
│                                      │  ▸ Les annexes (6)               │
│                                      │                                  │
│                                      │  Ouvrir le PDF de l'énoncé       │
├──────────────────────────────────────┴──────────────────────────────────┤
│  ▸ Fiche de cohérence          4/9   │  ▸ Journal d'arbitrages      3   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Proportions :** 62 % pour les questions, 38 % pour l'énoncé, au-delà de
1080 px. En dessous, l'énoncé passe au-dessus de la liste, replié.

**La colonne énoncé est fixe** (`position: sticky; top: 72px`) et défile de
façon autonome si son contenu dépasse la hauteur de l'écran. C'est ce qui la
rend utile : tu gardes le contexte sous les yeux en parcourant les questions.

**Une ligne de question :** code en chasse fixe · intitulé · avancement des
critères (trois pastilles pleines ou vides) · statut. Hauteur 52 px.
Au survol, fond `--surface` et le code passe en `--ink`.

Fiche de cohérence et journal d'arbitrages descendent ici : ils sont propres
au bloc, pas à l'application entière.

---

## 5. Page Question

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Dossiers › Bloc 1 › Q5                                    ← Q4   Q6 →  │
├─────────────────────────────────────────────────────────────────────────┤
│  ░░░░▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                             │
│  Segmentation et trois profils types                            [rédigé]│
│  C1.2                                                                   │
├───────────────────────────────────────────┬─────────────────────────────┤
│  CE QUE TU DOIS FAIRE                     │  CE DONT TU DISPOSES        │
│                                           │  (colonne fixe)             │
│  L'ÉNONCÉ                                 │                             │
│  Réalisez une segmentation de la demande  │  RESSOURCE DE COURS         │
│  pour l'hôtel Bellewaerde en combinant…   │  ▸ Zone de chalandise       │
│                                           │  ▸ Critères de segmentation │
│  CE QUI EST ATTENDU                       │  ▸ Méthode des personas     │
│  · Une segmentation combinant les 4…      │    → Fiche 3 · Fiche 24     │
│  · Trois personas détaillés…              │    → Cours : Identifier et  │
│                                           │      comprendre ses cibles  │
│  CRITÈRES ÉVALUÉS                  2 / 3  │                             │
│  ☑ Zones géographiques pertinentes        │  ANNEXES UTILISABLES        │
│  ☑ Critères sociodémographiques…          │  Annexe 3 · Cahier des      │
│  ☐ Personas détaillés : motivations…      │  charges — p. 13-16         │
│                                           │  Typologies de chambres,    │
│  MON BROUILLON                            │  budget, planning.          │
│  ┌─────────────────────────────────────┐  │                             │
│  │                                     │  │  Annexe 6 · Étude de marché │
│  │                                     │  │  p. 22-24                   │
│  └─────────────────────────────────────┘  │  Fréquentation, saison-     │
│                          Enregistré       │  nalité, concurrence.       │
│                                           │                             │
│  ▸ NOTER UN ARBITRAGE                     │                             │
├───────────────────────────────────────────┴─────────────────────────────┤
│  À faire   ·   En cours   ·   Rédigé   ·   Relu                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Proportions :** 58 % à gauche, 42 % à droite, au-delà de 1080 px. En dessous,
une seule colonne : la partie droite passe **après** le brouillon, sauf les
annexes qui remontent juste sous les attendus.

**Le partage des deux colonnes encode une distinction réelle** : à gauche ce
qui t'est demandé et ce que tu produis, à droite ce dont tu disposes pour le
faire. Rien de ce qui est à droite ne se remplit ; rien de ce qui est à gauche
n'est de la documentation.

La colonne droite est fixe (`position: sticky`), comme sur la page Bloc.

**Les annexes** ne sont pas recopiées. Chacune est présentée par son numéro,
son titre, ses pages dans le PDF, et deux lignes disant ce qu'on y trouve et ce
qu'on en tire pour cette question. Un lien ouvre le PDF au besoin.

**Précédent et suivant** montent en haut, dans le fil d'Ariane, pour rester
accessibles sans faire défiler jusqu'en bas.

---

## 6. Structures de données à ajouter

```js
// js/data.js — enrichir chaque bloc
BLOCS[0].enonce = {
  contexte: "<p>…</p>",
  mission:  "<p>…</p>",
  donnees:  ["800 000 visiteurs par an", "40 % de Français", …],
  pdf:      "énoncés/<nom du fichier>.pdf"
};

// js/annexes.js — nouveau
ANNEXES["b1"] = [
  { n: 3,
    titre: "Cahier des charges du projet hôtelier",
    pages: "13-16",
    contenu: "Typologies de chambres, espaces communs, contraintes
              techniques et RSE, budget prévisionnel, planning.",
    utile: "Fournit les contraintes chiffrées à respecter dans
            toute proposition." }
];

// js/data.js — par question
INFO["b1-Q5"].enonce  = "Réalisez une segmentation de la demande…";
INFO["b1-Q5"].annexes = [3, 6];
```

---

## 7. Ce qui ne change pas

La barre de cadence compacte de 4 px reste sous la navigation, sur toutes les
pages. La typographie, la palette, le vocabulaire d'interface, les règles
d'accessibilité et de mouvement restent ceux de `design-spec.md`.

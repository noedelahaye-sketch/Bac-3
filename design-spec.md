# Cahier des charges — forme et navigation

Document de référence pour la refonte. Chaque décision est justifiée : si une
règle gêne à l'usage, on la change en connaissance de cause.

---

## 1. Le principe directeur

L'application a **un seul travail** : faire écrire 44 livrables d'ici décembre,
et faire retenir les notions au passage.

Trois conséquences sur la forme :

- **Chaque page a un job unique.** Si une page en fait deux, elle se découpe.
- **La page Question est le centre de gravité.** Tout le reste y conduit ou en
  revient. C'est là que se passe le vrai travail.
- **On ne décore rien.** Chaque élément visuel doit encoder une information
  vraie : un statut, une position, un écart au planning.

---

## 2. Typographie

Trois rôles, trois familles. Aucune n'est là pour faire joli.

### Display — **Clash Display**
Source : Fontshare (gratuit, 6 graisses). Compact et affirmé sans être étroit
ni vertical, donc lisible sur mobile.
Usage : titres de page, numéros, chiffres clés, question en tête de page.
Graisses : 600 pour les titres, 700 pour les chiffres.

*Repli si Fontshare pose problème :* Familjen Grotesk (Google Fonts), même
tempérament, un peu plus neutre.

### Texte — **Instrument Sans**
Source : Google Fonts. Excellente tenue en petit corps, ce qui compte pour des
critères et des résumés de cours.
Usage : tout le corps de texte, les libellés, les boutons.
Graisses : 400 courant, 500 accentué, 600 libellés.

### Codes — **Geist Mono**
Source : Google Fonts.
Usage exclusif : les codes du référentiel — `C1.2`, `Q7`, `B1` — les dates, les
compteurs, les numéros de fiche.

> **Pourquoi une mono ici.** Ces codes ne sont pas du texte : ce sont des
> identifiants administratifs venus du référentiel Studi. Les composer en
> chasse fixe dit la vérité sur ce qu'ils sont, et permet de les repérer d'un
> coup d'œil sans les mettre en couleur.

### Échelle

| Rôle | Taille | Famille | Interlignage |
|---|---|---|---|
| Titre de page | 30 / 24 px mobile | Clash 600 | 1.08 |
| Question en tête | 24 / 20 px | Clash 600 | 1.15 |
| Titre de section | 15 px | Clash 600 | 1.2 |
| Corps | 15 px, 14 px en dense | Instrument 400 | 1.55 |
| Libellé de section | 11 px, majuscules, +0.1em | Instrument 600 | 1.2 |
| Code | 12 px | Geist Mono 500 | 1 |
| Chiffre clé | 34 px | Clash 700 | 1 |

Pour un vrai fonctionnement hors ligne, héberger les fichiers de police dans
`fonts/` plutôt que d'appeler un CDN.

---

## 3. Palette

Six valeurs nommées, pas une de plus.

| Nom | Hex | Emploi |
|---|---|---|
| `--paper` | `#E4E7E0` | Fond général. Gris-vert froid, pas un crème. |
| `--surface` | `#F3F5F0` | Cartes, panneaux, champs de saisie. |
| `--ink` | `#10161A` | Texte principal, éléments actifs. |
| `--muted` | `#69706B` | Texte secondaire, libellés, codes. |
| `--line` | `#C7CCC3` | Filets, bordures, séparateurs. |
| `--signal` | `#1F3BD1` | **La seule couleur vive.** Progression, liens, focus. |
| `--flag` | `#B23A18` | Uniquement le repère de cadence et le retard. |

**Règle absolue :** `--signal` ne sert qu'à dire « c'est fait » ou « c'est
actif ». `--flag` ne sert qu'à dire « tu es en retard ». Aucune de ces deux
couleurs n'apparaît en décoration. Si tout devient bleu, plus rien ne signale.

Pas de dégradés. Pas d'ombres portées. La hiérarchie se fait par le contraste
de fond et le filet.

---

## 4. Grille et espacement

- Largeur maximale du contenu : **760 px**, centré. Au-delà, les lignes de
  texte deviennent trop longues pour être lues confortablement.
- Marges latérales : 20 px sur ordinateur, 16 px sur mobile.
- Échelle d'espacement, en multiples de 4 : `4 · 8 · 12 · 16 · 24 · 32 · 48`.
  Rien d'intermédiaire.
- Rayon des angles : `8px` pour les cartes, `6px` pour les boutons et les
  champs. Une seule valeur de chaque, partout.
- Épaisseur des filets : `1px`, toujours en `--line`.

---

## 5. La barre de cadence — l'élément signature

44 segments, un par livrable, et un trait vertical rouge qui marque où tu
devrais en être aujourd'hui.

C'est le seul élément décoratif toléré, parce qu'il n'est pas décoratif : il
répond en une seconde à la seule question qui compte vraiment.

**Trois déclinaisons :**

- **Complète** (accueil) — hauteur 24 px, segments cliquables, légende
- **Compacte** (barre de navigation, sur toutes les pages) — hauteur 4 px,
  pleine largeur, sans légende, non cliquable
- **Locale** (page Question) — les 44 segments, celui de la question courante
  en `--ink` et en relief. Réponse muette à « où j'en suis dans l'ensemble ».

États d'un segment : à faire `--line` · en cours `#93A0E5` · rédigé
`--signal` · relu `--ink`.

---

## 6. Navigation

Barre supérieure fixe, quatre entrées : **Accueil · Dossiers · Cours ·
Apprendre**. Le mémo devient une section de Cours, il n'a plus besoin de son
onglet. Cartes à répétition espacée et quiz sont deux sections d'une même
page Apprendre plutôt que deux onglets séparés : ce sont les deux façons de
retenir les notions, pas deux jobs différents.

Sous la barre, la cadence compacte sur 4 px. Elle est présente partout : c'est
le rappel permanent, sans jamais occuper de place.

Pastilles chiffrées sur Dossiers (livrables restants) et Apprendre (cartes du
jour). Nulle part ailleurs — une pastille partout ne signale plus rien.

**Adressage.** Chaque écran a son adresse, pour que le bouton retour du
navigateur fonctionne et qu'une question puisse être mise en favori :

```
#/                     accueil
#/dossiers             liste des blocs
#/q/b1-Q5              une question
#/cours                index des supports
#/cours/b1-cibles      un support
#/apprendre            cartes et quiz
```

---

## 7. Structure des pages

### Accueil — *où j'en suis*

```
┌──────────────────────────────────────────┐
│  VERDICT                                 │  Une phrase. « Tu es dans les
│  Rythme nécessaire : 2,6 / semaine       │  temps » ou « 4 livrables de
│  ▓▓▓▓▓▓░░░░│░░░░░░░░░░░░░░░░░░░░░░       │  retard ». Rien d'autre.
│  Terminés 12/44 · 17 sem. · 32 restants  │
├──────────────────────────────────────────┤
│  LA PROCHAINE CHOSE À FAIRE              │  Bloc sombre. Une seule
│  Bloc 1 · Q5 — Segmentation et personas  │  question, un seul bouton.
│  [ Ouvrir ]                              │
├──────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐          │
│  │ 12 cartes  │  │ 31/84      │          │  Deux raccourcis, pas plus.
│  │ à revoir   │  │ maîtrisées │          │
│  └────────────┘  └────────────┘          │
├──────────────────────────────────────────┤
│  Date limite · Exporter tout             │
└──────────────────────────────────────────┘
```

L'accueil ne liste rien. Il dit où tu en es et ouvre la porte suivante.

### Dossiers — *choisir sur quoi travailler*

Les quatre blocs dépliables. À l'intérieur, une **ligne** par question — plus
de contenu déplié ici, tout est parti dans la page Question.

```
┌──────────────────────────────────────────┐
│ ▸ Bloc 1 — Élaboration d'une stratégie   │
│   Bellewaerde                    4/11    │
├──────────────────────────────────────────┤
│  Q1   Objectifs de veille        relu    │  Clic → #/q/b1-Q1
│  Q2   Concurrents             rédigé     │
│  Q5   Segmentation           ●●○ 2/3     │  Critères cochés, en clair
│  Q6   Segments prioritaires   à faire    │
└──────────────────────────────────────────┘
```

Ligne : code en mono · intitulé · avancement des critères · statut.
Hauteur de ligne 52 px, pour rester confortable au doigt.

En tête de page, deux panneaux repliés par défaut : **Fiche de cohérence** et
**Journal d'arbitrages**.

### Question — *le cœur*

```
┌──────────────────────────────────────────┐
│ ← Dossiers        B1 · Q5      [rédigé]  │  Barre de retour, fixe
├──────────────────────────────────────────┤
│  ░░░░▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  Position parmi les 44
│                                          │
│  Segmentation et trois profils types     │  Clash 600, 24 px
│  C1.2                                    │  mono, --muted
├──────────────────────────────────────────┤
│  CE QUI EST ATTENDU                      │  Toujours ouvert.
│  · Une segmentation combinant les 4…     │  C'est la commande.
│  · Trois personas détaillés…             │
├──────────────────────────────────────────┤
│  ▸ RESSOURCE DE COURS            3 notions│ Replié par défaut.
│     Notions · Modèles · Application      │  Chaque item repliable.
│     Sources : Identifier ses cibles      │
├──────────────────────────────────────────┤
│  CRITÈRES ÉVALUÉS                  2/3   │  Cases à cocher.
│  ☑ Zones géographiques pertinentes       │
│  ☑ Critères sociodémographiques…         │
│  ☐ Personas détaillés : motivations…     │
├──────────────────────────────────────────┤
│  MON BROUILLON                           │  Zone de saisie haute,
│  ┌────────────────────────────────────┐  │  hauteur automatique.
│  │                                    │  │  « Enregistré » discret
│  └────────────────────────────────────┘  │  après la frappe.
├──────────────────────────────────────────┤
│  ▸ NOTER UN ARBITRAGE                    │  Retenu / écarté / pourquoi.
│                                          │  Alimente le journal.
├──────────────────────────────────────────┤
│  À faire · En cours · Rédigé · Relu      │  Barre basse fixe
│  ← Q4                            Q6 →    │  + navigation séquentielle
└──────────────────────────────────────────┘
```

**Trois décisions à ne pas négocier :**

*Les attendus sont toujours ouverts.* C'est la consigne. Elle ne se replie pas.

*La ressource de cours est repliée par défaut.* Sinon la page fait quatre
écrans et le brouillon devient inatteignable — or c'est là que tu travailles.

*Précédent et suivant en bas.* Traverser un bloc question par question doit
être fluide. Sans ça, tu remontes à la liste à chaque fois et tu perds le fil.

### Cours — *les repères*

Index par bloc. Chaque support : titre, nombre de pages, compétences, et les
questions qu'il alimente sous forme de liens. Le mémo devient une section
« Fiches de méthode » en bas de page, avec les 30 fiches.

### Apprendre — *retenir*

Une page, deux sections : **cartes à répétition espacée** et **quiz**. Les
deux poursuivent le même but — faire retenir les notions — donc elles
partagent un seul onglet plutôt que de le disputer.

Écran d'accueil de chaque section : pour les cartes, trois chiffres (à
revoir, vues, maîtrisées), deux boutons de session, les thèmes ; pour le
quiz, les boutons de lancement, puis stats et historique.
Pendant une session (carte ou quiz) : **elle occupe tout l'écran**, rien
d'autre. Pas de navigation, pas de statistiques. Une carte ou une question,
deux boutons. Résultat en fin de quiz, avec ce qui reste à retravailler.

---

## 8. Vocabulaire d'interface

Les mots font partie de la forme. Ils restent identiques d'un bout à l'autre.

| On dit | Jamais |
|---|---|
| À faire · En cours · Rédigé · Relu | Todo, WIP, Draft, Done |
| Ce qui est attendu | Objectifs, Consignes |
| Critères évalués | Checklist, Validation |
| Mon brouillon | Notes, Zone de texte |
| Noter un arbitrage | Journal, Log |
| Ressource de cours | Documentation, Ressources |
| Cartes à revoir | Révisions dues, Flashcards |

Phrases à l'infinitif ou à l'impératif, jamais de majuscule décorative en
milieu de phrase. Un bouton dit ce qui va se passer : « Ouvrir la question »,
pas « Voir ».

**Écrans vides.** Un espace vide invite à agir, il ne s'excuse pas.
« Rien à revoir aujourd'hui. Reviens demain, ou lance une session libre. »
Pas : « Aucune donnée disponible ».

---

## 9. Qualité de base

- Responsive jusqu'à 360 px de large. Zone tactile minimale : 44 px.
- Focus clavier visible : contour `--signal` de 2 px, jamais supprimé.
- `prefers-reduced-motion` respecté : toutes les transitions désactivées.
- Contraste : 4.5:1 minimum sur le texte courant.
- Aucune information portée par la seule couleur — un statut a toujours son
  mot écrit à côté de sa couleur.
- Sauvegarde automatique 400 ms après la dernière frappe, avec une mention
  « Enregistré » qui s'efface au bout de 2 secondes.
- Fonctionnement hors ligne complet : polices locales, aucune requête réseau.

---

## 10. Mouvement

Presque rien, et pour cause : cette application s'ouvre vingt fois par jour.
Une animation qu'on voit vingt fois devient une gêne.

- Transitions d'état : `140ms ease-out`, sur la couleur et l'opacité seulement.
- Ouverture d'un panneau : `180ms`, sur la hauteur.
- Changement de page : aucune transition. Instantané.
- Une seule exception : quand un critère est coché, le compteur passe de
  `2/3` à `3/3` avec un bref changement d'échelle. C'est le seul moment de
  satisfaction de l'interface, et il est mérité.

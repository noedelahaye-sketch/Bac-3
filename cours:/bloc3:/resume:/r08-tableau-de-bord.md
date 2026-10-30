---
id: b3-r08
bloc: 3
ordre: 8
titre: "Concevoir, outiller et diffuser le tableau de bord"
slug: r08-tableau-de-bord
accroche: "Tableau de bord : définition, types (stratégique ou prospectif, opérationnel, budgétaire), qualités, fiche d'indicateur et familles d'indicateurs ; architecture par public (pyramide), hiérarchie visuelle (40/35/25, lecture en Z), choix des graphiques et codes couleur ; dashboards opérationnels vs stratégiques, droits d'accès, personnalisation ; outils (Looker Studio, Power BI, Tableau, DashThis), connexions, automatisation, alertes et distribution ; analyse, diffusion et co-construction."
competences: [C3.3]
questions: [Q8]
questions_appui: [Q7, Q9]
mots: 3445
lecture_min: 16
sources:
  - support: "La mise en place d'un tableau de bord et le suivi des KPI"
  - support: "L'analyse et la présentation d'un tableau de bord"
  - support: "Concevoir et structurer un tableau de bord efficace"
  - support: "Maîtriser les outils de création de tableaux de bord"
  - support: "Application - Data Marketing & Tableaux de bord"
---

# Concevoir, outiller et diffuser le tableau de bord

> **Ce que couvre ce résumé.** Tout ce qu'il faut pour construire le tableau de bord demandé à l'examen :
> - **ce qu'est** un tableau de bord, ses **types**, ses **qualités**, ce que contient chaque **ligne d'indicateur** ;
> - comment l'**architecturer par public** et **hiérarchiser** visuellement ;
> - quel **graphique** pour quel message, quels **codes couleur** ;
> - **opérationnel** ou **stratégique** ; droits d'accès ; personnalisation ;
> - les **outils**, les **connexions**, l'**automatisation**, les **alertes** et la **distribution** ;
> - **analyser** et **diffuser** le tableau de bord.
>
> Cœur de la question **Q8** (tableau de bord opérationnel avec visualisations simples). Appui pour **Q7** (outils de collecte) et **Q9** (lecture des écarts).
>
> Choix et hiérarchie des KPI : [R7](r07-kpi-performance.md). Analyse des écarts et recommandations : [R9](r09-ecarts-recommandations.md). KPI de satisfaction : [R6](r06-mesurer-satisfaction.md).
>
> **Déjà vu ailleurs, non repris ici.**
> - Tableau de bord, **reporting** et outils d'amélioration continue (PDCA) en communication : **B2-R6 §2**.
> - Tableaux de bord et rapports, temps forts managériaux, seuils et **zones vert/orange/rouge** : **B4-R5 §2.3 et §3**.
> - Tri à plat, tri croisé : **B1-R3 §4**.
>
> **Comment lire ce résumé.** Texte courant et tableaux = **noyau à apprendre** (flashcards et quiz). 💡 = **aides à la compréhension** (exemples, cas concrets), sautables en révision rapide. 🎯 = **repères examen**, à lire une fois. 📖 = **définitions**. ⚠️ = **piège ou divergence** entre supports.

---

## 1. Le tableau de bord : définition, types, qualités

> 📖 Un **tableau de bord** est un **outil de pilotage** qui présente de manière **lisible et synthétique** les résultats de l'entreprise grâce à des **indicateurs de performance**. Il contrôle la réalisation des objectifs, **identifie le plus tôt possible les écarts** entre objectifs et réalité, et indique les **ajustements** (actions correctives) à mettre en place.

« Les vents ne sauraient être favorables à celui qui ne sait où il va » (Sénèque). Le tableau de bord n'est **pas destiné à une seule personne** : il se **diffuse**, devient un **outil de communication interne** et de **motivation**, et transmet objectifs et stratégie.

### 1.1 Trois types

| Type | Ce qu'il suit | Horizon |
|---|---|---|
| **Stratégique** (ou **prospectif**, *balanced scorecard*) | Les **déterminants** de la performance, ce qu'il faut maîtriser pour atteindre les objectifs | Long terme |
| **Opérationnel** | Les **plans d'action** mis en place | Court terme |
| **Budgétaire** | Les résultats **par rapport au budget prévisionnel** ; met en évidence les écarts | Période budgétaire |

Tous visent le même but : **suivre la réalisation des objectifs** et **décider**, en impliquant les acteurs.

### 1.2 Les quatre qualités

1. **Simple** : **10 à 15 indicateurs maximum**, lisible.
2. **Pertinent** : indicateurs **corrélés aux objectifs** (c'est la phase clé).
3. **Synoptique** : l'essentiel se voit **d'un coup d'œil**.
4. **Actualisé** : données à jour.

⚠️ **Combien d'indicateurs ?** Les cours « papier » disent **10 à 15** (« une dizaine » dans l'essentiel du cours commercial) pour un tableau de bord. Le module dashboard limite la **vue stratégique** à **5 indicateurs** et la **vue mobile** à **3**. La pyramide des KPI ([R7](r07-kpi-performance.md)) donne **2-3 / 5-7 / 10-15** selon le niveau. Retiens : **peu à la direction, davantage à l'opérationnel**.

### 1.3 Ce que contient chaque ligne d'indicateur

> 📖 Un **indicateur** est une information permettant la **mesure périodique** d'une réalité par rapport à un **critère prédéfini**. Il peut être qualitatif ou quantitatif.

Pour chaque indicateur du tableau de bord, il faut préciser :

| Mode de calcul | Objectif cible | Réalisé | **Écart** | Commentaire | Actions correctrices |
|---|---|---|---|---|---|

S'y ajoutent la **périodicité** d'édition et le **processus de collecte**.

> 🎯 **Repère examen (Q8, Q9).** C'est **la structure de tableau à reprendre telle quelle** dans ta copie Excel : une ligne par KPI du brief, avec la formule, la cible (annexe 8), le réalisé (annexe 7), l'écart en valeur et en %, un commentaire et une action. Le correcteur y voit en un coup d'œil que tu sais construire un tableau de bord.

### 1.4 Les familles d'indicateurs

**Deux grandes catégories (cours « Mise en place »)**

- **Indicateurs de résultat** : mesurent le **résultat final** d'une action ; constat **a posteriori**, contrôle des objectifs.
- **Indicateurs de suivi** : **jalons** qui mesurent la **progression** ; permettent d'**anticiper** et de corriger **avant** que le résultat soit acquis.

**Quatre types à sélectionner selon l'activité**

| Type | Mesure | Exemples |
|---|---|---|
| **De résultat** (réalisation des objectifs) | Niveau atteint | Activité, marge, qualité, coût |
| **De moyens** | Résultats **rapportés aux moyens** engagés | Ratios moyens / unités produites |
| **De variables d'action** (avancement du plan) | Progression des efforts | % de personnel formé, nombre de propositions émises |
| **D'environnement** | Ce que font les autres acteurs, internes ou externes | Services liés, concurrents, marché |

Certains indicateurs sont des **« clignotants »** : ils ont une fonction d'**alerte** en cas d'évolution anormale.

**Trois natures d'information (cours « Analyse et présentation »)** : **commerciale** (CA, satisfaction), **financière** (BFR, trésorerie, stocks, investissements), **sociale** (absentéisme, turn-over, masse salariale, accidents).

### 1.5 Les KPI commerciaux, en trois familles

| Famille | KPI et formules |
|---|---|
| **Productivité commerciale** | Productivité des appels (RDV / appels), durée moyenne de traitement, **taux de décroché**, **taux de transformation** (ventes / contacts), **taux de remontée** (réponses favorables à une sollicitation) |
| **Rentabilité commerciale** | Coût d'acquisition du contact (coût de l'opération / contacts utiles), **panier moyen = CA / nombre de clients**, **rentabilité = CA / coût total de l'opération**, **taux de marge** = marge brute HT / coût d'achat HT, **taux de marque** = marge brute HT / prix de vente HT |
| **Qualité de la relation** | Taux de satisfaction, **CES**, **NPS**, **taux de résolution au premier contact** (RPC ou FCR) |

⚠️ Ce cours note le **CES de 1 à 5** et le **NPS de 1 à 10**. La référence est le module NPS/CSAT/CES : **NPS de 0 à 10**, **CES de 1 à 7** ([R6](r06-mesurer-satisfaction.md)).

**Reporting ou pilotage ?** Deux objectifs cohabitent : le **reporting** analyse une période passée (CA réalisé) pour en tirer des conclusions et communiquer ; le **pilotage** est **prévisionnel** (CA prévu vs réalisé) et fixe le cap.

> 📖 Le **reporting** collecte et traite les données **au quotidien** ; ces données sont ensuite **réintégrées** dans les tableaux de bord. Le tableau de bord peut vivre sous **Excel** (tableur), dans un **CRM** (reporting commercial) ou dans un **ERP** (progiciel de gestion intégré, tableaux pré-construits).

---

## 2. Architecturer le tableau de bord par public

### 2.1 Un seul tableau pour tous ? Non

Un tableau unique **surchargé** perd le directeur dans les détails et prive l'équipe de la granularité dont elle a besoin. La **pyramide de décision** sert de structure :

| Niveau | Public | Contenu | Fréquence |
|---|---|---|---|
| **Stratégique** | Direction | Indicateurs **synthétiques** : CA marketing, **ROI** global, satisfaction, part de marché, croissance | Mensuelle, trimestrielle |
| **Tactique** | Responsables marketing | Analyses **par canal et par période** : CA par canal, coût d'acquisition, conversion, rétention, panier moyen | Hebdomadaire, mensuelle |
| **Opérationnel** | Équipes terrain | Données **temps réel et granulaires** : CPC, CTR, rebond, engagement par post, performance des créas | Quotidienne |

La navigation doit être **bidirectionnelle** : la direction peut **creuser** un indicateur préoccupant jusqu'au détail ; le terrain voit **sa contribution** aux objectifs globaux.

### 2.2 La démarche en étapes (module)

1. **Matrice des publics et besoins** : pour chaque audience (DG, responsables, équipe, commerciaux, service client), les **3 questions** auxquelles le tableau doit répondre, la **fréquence** de consultation, le **niveau de détail**.
2. **Lister les KPI par niveau** (stratégique, tactique, opérationnel).
3. **Structurer la navigation** en 4 pages : **synthèse des 5 KPI clés** → **vue par canal** (barres horizontales) → **détail campagne / créatif / audience** avec filtres → **détection des anomalies** avec alertes.
4. **Tester** une maquette avec **2-3 utilisateurs** : retrouvent-ils une information précise ?

### 2.3 Hiérarchie visuelle

**La règle des proportions** :

- **40 %** de l'espace aux **KPI principaux**, en **haut à gauche** (zone de lecture prioritaire en culture occidentale) ;
- **35 %** aux **indicateurs secondaires**, qui donnent le contexte ;
- **25 %** aux métriques de contexte et compléments.

**Pas d'égalitarisme visuel** : **3 KPI « héros »** bien mis en valeur communiquent mieux que 15 métriques traitées à égalité.

**Parcours de lecture en Z** : gauche → droite en haut, diagonale vers le bas à gauche, puis gauche → droite. On place les éléments clés sur cette trajectoire.

**Grouper par finalité métier** (**acquisition, conversion, fidélisation**), **pas par source technique** (Facebook, GA4, CRM). Une organisation logique **divise par deux** le temps de recherche.

**Test du « regard flou »** : reculer de 2 mètres, plisser les yeux. Ce qui ressort en premier doit être les KPI principaux ; sinon, on ajuste tailles, couleurs, positions.

---

## 3. Choisir les visualisations et les codes graphiques

**Règle d'or** : **un graphique = un message unique et clair**. S'il faut l'expliquer à l'oral, il est mal choisi ou trop chargé.

| Message | Visualisation | Règles |
|---|---|---|
| **Évolution dans le temps** | **Courbe** (graphique linéaire) | Ajouter une **ligne de tendance** ; superposer le coût pour lire le ROI |
| **Comparaison entre catégories** | **Barres horizontales** | Lisibilité des libellés longs ; **< 15 catégories** |
| **Répartition simple** | **Secteurs** (camembert) | **5 catégories maximum** ; regrouper les < 5 % dans « Autres » ; **jamais en 3D** |
| **Corrélation entre 2 variables** | **Nuage de points** | Ex. budget (x) / conversions (y), taille = coût par conversion, couleur = canal |
| **Chiffre clé** | **KPI seul** (« carte ») | Lisible immédiatement |

S'y ajoutent les **jauges** (atteinte d'un objectif) et les **feux tricolores**, que l'énoncé cite.

**Codes couleur**

- **Une couleur par canal**, **toujours la même** dans tous les tableaux, consignée dans une **mini-charte** partagée.
- **Statuts** : **rouge** = alerte critique, sous-performance dangereuse ; **orange** = vigilance, écart modéré ; **vert** = objectif atteint ou dépassé ; **gris** = neutre. **Couleurs vives réservées aux alertes**, palette neutre (gris, bleu foncé) pour le reste.
- **Accessibilité** : tester le **daltonisme** (Color Oracle, Coblis) et l'impression **noir et blanc** ; un bon graphique reste lisible sans couleur (formes, motifs, tailles).

**Erreurs classiques** : camembert à plus de 5 parts ; couleurs sans signification ; **3D** et effets qui déforment les proportions ; tout afficher sans hiérarchie ; **axes mal calibrés** (couper un axe exagère les variations, sauf si c'est signalé).

**Lisibilité** : légendes explicites avec **unités**, **période de référence**, définition courte des indicateurs moins évidents. Le tableau doit être **compréhensible en ton absence**.

---

## 4. Opérationnel ou stratégique : deux philosophies

| | **Dashboard opérationnel** | **Dashboard stratégique** |
|---|---|---|
| **Image** | Cockpit du pilote | Tableau de bord de la compagnie aérienne |
| **Priorité** | **Densité** d'information actualisée, **interactivité** (filtres, export) | **Synthèse**, perspective long terme |
| **Consultation** | Plusieurs fois par jour | Réunion mensuelle ou trimestrielle, **≤ 10 minutes** d'attention |
| **Organisation** | **Alertes en haut**, métriques au centre, détails en périphérie | **5 KPI maximum**, une courbe de tendance, une section **« À retenir »** |
| **Granularité** | Mot-clé, audience, créatif, tranche horaire | Agrégée |
| **Commentaires** | — | **Contexte** sous chaque KPI (saisonnalité, événement, facteur externe) |

**Alertes automatiques** : des seuils **intelligents**, sans fausses alertes. Exemple du module : **orange** au-delà de **15 %** d'écart avec la moyenne mobile sur 7 jours, **rouge** au-delà de **30 %**. Ou encore une alerte si les conversions baissent de **20 %** ou si le CPC monte de **30 %**.

**« À retenir »** : **3 points de synthèse maximum** et **une recommandation prioritaire**, concrète et **chiffrée**.

⚠️ Ne pas mettre de métriques opérationnelles dans le dashboard stratégique « pour donner plus d'informations » : un dirigeant face à 50 indicateurs **n'utilisera pas l'outil**.

**Droits d'accès en trois niveaux** (principe du **besoin d'en connaître**) :

1. **Consultation** (commerciaux, service client) : leads, conversion, satisfaction, **sans** coûts ni budgets.
2. **Analyse complète** (équipe marketing) : toutes les métriques, filtres, exports.
3. **Administration** (responsables, direction) : données financières sensibles, paramétrage des alertes et seuils.

On **trace** les accès (logs), non par méfiance, mais pour comprendre l'usage réel.

---

## 5. Personnalisation et expérience utilisateur

Un dashboard techniquement parfait mais **rigide** finit **abandonné** au profit d'exports Excel artisanaux. Principe : **cohérence dans la diversité**.

- **Personnalisable** : ordre des widgets, **filtres** (zone, canal, période), **alertes** à ses seuils, **vues sauvegardées** (« Acquisition », « Fidélisation », par zone).
- **Fixe** : **définitions** des indicateurs, **codes couleur**, structures de données.

**Navigation** : **3 clics maximum** pour toute donnée importante ; organisation **métier** (funnel acquisition → conversion → fidélisation) ; fil d'Ariane ; **liens contextuels** (clic sur un KPI global → détail) ; recherche dès qu'on dépasse une dizaine d'indicateurs.

**Performance et supports** : affichage complet en **moins de 10 secondes** (au-delà, abandon) ; **version mobile** avec les **3 KPI critiques** ; **version présentation** (contrastes et textes renforcés, vue synthèse, export vers PowerPoint ou Google Slides) ; modes **débutant** et **expert**.

---

## 6. Outils, connexions, automatisation, distribution

### 6.1 Choisir l'outil

| Critère | **Looker Studio** (Google) | **Power BI** (Microsoft) | **Tableau** | **DashThis** |
|---|---|---|---|---|
| Gratuit | ✓ | ✗ (≈ 10 €/utilisateur/mois) | ✗ | ✗ |
| Prise en main facile | ✓ | ✗ | ✗ | ✓ |
| Connecteurs marketing natifs | ✓ (GA, Google Ads, Search Console, YouTube) | ✗ (paramétrages) | ✗ | ✓ |
| Analyses avancées, IA | ✗ | ✓ (anomalies, prédictif) | ✓ (statistiques, data mining) | ✗ |
| Collaboration avancée | ✗ | ✓ (commentaires, espaces de travail) | ✓ | ✗ |
| Idéal pour | **Petit budget, besoin rapide, écosystème Google** | **Stratégie data ambitieuse, multi-sources** | Analyses complexes | **Équipe légère**, agences |

**Limites de Looker Studio** : calculs avancés, personnalisation graphique restreinte, lenteur sur gros volumes, **dépendance à Google** (LinkedIn Ads, TikTok demandent des contournements), quotas. **Klipfolio** mise sur la personnalisation.

**Conseils** : anticiper les besoins à **3-5 ans** ; **tester 2 semaines** avec ses vraies données ; un outil puissant mais **mal adopté** vaut moins qu'un outil simple et utilisé.

> 💡 Delish Box (box alimentaires) connecte en une matinée GA, Facebook Ads (via **Supermetrics**) et un Google Sheets des ventes Shopify dans Looker Studio : **4 h par semaine** gagnées et **300 € par mois** économisés sur des campagnes coupées plus tôt.

### 6.2 Connecter les sources

- **Inventorier** les sources avant tout. GA, Google Ads, Search Console ont des connecteurs natifs ; Facebook, LinkedIn ou le CRM passent par un **connecteur tiers** (Supermetrics, ≈ 99 €/mois) ou un **export quotidien** vers Google Sheets.
- **Quotas d'API** (GA : 10 000 requêtes par jour) et **délais de stabilisation** (GA : 24-48 h ; Google Ads : quasi temps réel).
- **Sécuriser** : **comptes de service** dédiés (continuité si un collaborateur part), **moindre privilège**, documentation, **revue trimestrielle** des droits, alerte si une autorisation est révoquée, procédure de récupération.
- **Performance** : données **pré-agrégées** plutôt que brutes (traitement divisé par 10) ; fenêtre de **13 mois** pour les tendances, archivage au-delà.
- Un **méta-dashboard** surveille la santé des connexions (dernière mise à jour, erreurs).

### 6.3 Automatiser les rafraîchissements

Caler la fréquence sur les **cycles de décision**, pas l'inverse :

| Données | Fréquence | Pourquoi |
|---|---|---|
| Publicitaires (Google Ads, Facebook Ads) | Horaire ou quotidienne | Pilotage fin des enchères |
| Web analytics (GA) | Quotidienne | Tendances et anomalies |
| CRM | Hebdomadaire | Aligné sur le reporting commercial |
| **Satisfaction (NPS, CSAT)** | **Mensuelle** | Temps nécessaire pour des tendances significatives |
| Financières | Mensuelle ou trimestrielle | Clôtures comptables |

**Synchroniser les dépendances** : le ROI exige à la fois les coûts et les ventes, à mettre à jour ensemble. **Versionner** le tableau de bord (qui, quoi, quand, pourquoi) et tester sur une **copie** avant mise en production.

### 6.4 Alertes à trois niveaux

**3 à 5 KPI d'alerte maximum.** Une alerte doit **déclencher une action** ; sinon elle est inutile. Elle doit être **contextualisée** (« conversion mobile -15 % depuis la nouvelle page produit d'hier »).

| Niveau | Exemple | Canal |
|---|---|---|
| **Critique** | ROI négatif, budget épuisé | **SMS** immédiat |
| **Important** | Conversion -10 %, coût d'acquisition +20 % | **E-mail** détaillé avec lien |
| **Informatif** | Pic de trafic, objectif mensuel atteint | **Slack / Teams** |

### 6.5 Distribuer les insights

| Canal | Pour | Atout |
|---|---|---|
| **E-mail** (PDF ou lien) | Rapports hebdomadaires ou mensuels | Traçabilité |
| **Slack / Teams** | Alertes critiques, urgences | Réactivité |
| **Dashboard en accès direct** | Consultation autonome | Données live |
| **Présentation en réunion** | Synthèses stratégiques | Discussion, **storytelling** des données |

**Le bon moment** : un hebdomadaire part le **lundi matin**, pas le vendredi après-midi. **Trois formats** au plus (écran, impression, présentation). **Intégrer** les insights dans les outils du quotidien (Slack, CRM).

**Mesurer l'usage** : vues par rapport, durée de consultation, taux d'ouverture des envois, sections les plus lues, questions suscitées. « L'efficacité se mesure aux **décisions** qu'il influence, pas au nombre de rapports envoyés. »

> 💡 L'application HealthyHub (groupe bien-être, 4 enseignes) part d'un constat proche du cas PrepMyMeal : **150 tableaux Excel** différents, reporting en **2-3 semaines**, pas de vision client unifiée. Solution type : **CDP** pour unifier les données, **Power BI**, dashboards **stratégique / pilotage / opérationnel**, gouvernance (charte, responsables data, RGPD), **ambassadeurs data** dans chaque équipe, déploiement en **4 phases** (cadrage et **POC** → **pilote** sur 1-2 enseignes → généralisation → optimisation), calé **hors saisons hautes**. Priorisation des problèmes avec une matrice **Impact × Facilité**.

---

## 7. Analyser, piloter et diffuser le tableau de bord

### 7.1 Piloter

> 📖 **Piloter**, c'est évaluer la performance **par rapport aux objectifs** : l'analyse des écarts détermine les leviers pour **corriger la trajectoire** si les écarts sont **négatifs**, ou **réajuster les objectifs** si les écarts sont **positifs**.

**Deux approches** : **managériale** (indicateurs = outils de **motivation**, récompense objective des résultats) et **de gestion** (indicateurs de coût, rentabilité, finances).

### 7.2 Cinq finalités

1. **Mesure** : résultats réels vs objectifs (quantités, clients, CA, panier moyen, marges).
2. **Diagnostic** : met en évidence les **dysfonctionnements** (données sous le **seuil de tolérance**).
3. **Communication** avec les équipes et la direction.
4. **Information**, notamment en **réseau** : se situer par rapport aux autres unités.
5. **Motivation** : chacun connaît régulièrement l'atteinte de ses objectifs.

Au niveau **collectif**, il mesure la situation, compare services ou personnes, fixe les objectifs et le plan d'action ; au niveau **individuel**, il repère points forts et axes d'amélioration.

### 7.3 Le tableau de bord alerte, il n'explique pas

⚠️ Une baisse de performance **ne donne ni les raisons ni les solutions** : c'est au **dirigeant** d'analyser les causes. Le diagnostic distingue :

- les causes **internes** (stocks, gestion, organisation) ;
- les causes **externes** (saisonnalité, concurrence, marché) ;
- des **objectifs trop élevés** par rapport aux capacités de l'entreprise.

Il se complète par des **entretiens** avec l'équipe et des **reportings**, puis débouche sur des **actions correctives** décidées **avec l'adhésion de l'équipe** (méthodes d'analyse : [R9](r09-ecarts-recommandations.md)).

**Entreprise récente, peu d'historique** : une analyse **très régulière** aide à comprendre les écarts et à fixer ensuite des objectifs **réalistes**. C'est exactement la situation de PrepMyMeal avec une première tournée.

**Non-conformités** : les traiter **vite** ; mais plusieurs non-conformités mineures et **répétitives**, ou liées à un **défaut d'origine**, appellent un traitement **curatif à la source** (en amont) plutôt que sur les conséquences (en aval).

### 7.4 Co-construire et diffuser

Un tableau de bord doit être **accepté et diffusé**. Il ne sert pas à **imposer** des idées, mais à **motiver** et **communiquer**. D'où la recommandation de le **co-construire** avec les équipes concernées (commerciaux, SAV, techniciens) : plus de motivation, plus de réalisme, moins d'erreurs (indicateurs non pertinents, données absentes).

> 🎯 **Repère examen (Q8).** L'énoncé demande un tableau de bord **opérationnel** avec des **visualisations simples et intuitives** (graphiques, jauges, courbes). Une structure qui coche tous les critères :
> 1. **Bandeau de 4-5 KPI « héros »** en haut à gauche, chacun avec sa **jauge** vs l'objectif du brief : **CA total** (108 000 € pour > 100 000 €), **satisfaction moyenne** (≈ 4,2 pour 4,3), **inscriptions** (≈ 791 par ville pour 700), **temps d'attente moyen** (≈ 7,3 min pour 6), **conversion moyenne** (≈ 30 % pour 35 %).
> 2. **Tableau ville × KPI** avec **mise en forme conditionnelle** (vert = objectif atteint, orange = proche, rouge = sous l'objectif) : c'est le cœur du pilotage.
> 3. **Barres horizontales** du CA par ville, avec la **bande d'objectif** 12 000-15 000 €.
> 4. **Courbe** semaine 1 → semaine 8 (la tournée est **chronologique** : Paris S1 … Nantes S8) pour lire l'évolution de la satisfaction et du temps d'attente.
> 5. **Nuage de points** coût opérationnel / marge nette par ville (rentabilité).
> 6. Une zone **« À retenir »** : 3 constats et 1 recommandation chiffrée.
>
> Précise l'**outil** (Excel pour la copie ; **Looker Studio** gratuit relié au CRM et à GA en production), la **fréquence** (quotidienne pendant chaque étape, synthèse hebdomadaire à la fin de chaque ville) et les **destinataires** (équipe du foodtruck : opérationnel ; CEO : 5 KPI et « À retenir »). Calculs détaillés : fiche Q8.

---

## L'essentiel en 10 points

1. **Tableau de bord** = outil de **pilotage**, lisible et synthétique, qui repère **au plus tôt les écarts** objectif / réalisé et oriente les **actions correctives**. Il se **diffuse** : communication et motivation.
2. **Types** : **stratégique** (prospectif, *balanced scorecard*, long terme), **opérationnel** (plans d'action, court terme), **budgétaire** (écarts au budget). **Qualités** : **simple** (10-15 indicateurs), **pertinent**, **synoptique**, **actualisé**.
3. **Chaque indicateur** : mode de calcul, **cible**, **réalisé**, **écart**, commentaire, action corrective ; plus la **périodicité** et le **processus de collecte**.
4. Indicateurs de **résultat** (a posteriori) vs de **suivi** (jalons, anticipation) ; types : résultat, **moyens**, **variables d'action**, **environnement** ; **clignotants** = alertes. KPI commerciaux : **productivité**, **rentabilité** (panier moyen = CA / clients ; rentabilité = CA / coût), **qualité de la relation**.
5. **Pyramide de décision** : stratégique (direction), tactique (responsables), opérationnel (terrain) ; navigation **bidirectionnelle** ; démarche : matrice des publics → KPI par niveau → 4 pages (synthèse, canal, détail, anomalies) → test utilisateurs.
6. **Hiérarchie visuelle** : **40 / 35 / 25 %**, KPI héros **en haut à gauche**, lecture en **Z**, grouper par **finalité métier** ; test du **regard flou**.
7. **Graphiques** : **courbe** = évolution ; **barres horizontales** = comparaison ; **secteurs** ≤ 5 parts, jamais en 3D ; **nuage** = corrélation ; **KPI seul** = chiffre clé. **Rouge / orange / vert / gris** ; une couleur par canal ; tester daltonisme et noir et blanc.
8. **Opérationnel** = dense, interactif, alertes en haut ; **stratégique** = 5 KPI, tendance, **« À retenir »** (3 points + 1 recommandation chiffrée). Accès : **consultation**, **analyse**, **administration**. Personnaliser sans toucher aux **définitions**. **3 clics**, **< 10 s**.
9. **Outils** : **Looker Studio** (gratuit, Google, simple), **Power BI** (avancé, collaboratif, payant), **Tableau** (statistiques), **DashThis** (agences). Comptes de **service**, moindre privilège, pré-agrégation. Rafraîchissement calé sur les **cycles de décision** (satisfaction : **mensuel**). Alertes **critique / important / informatif** (SMS / e-mail / Slack).
10. Le tableau de bord **alerte mais n'explique pas** : diagnostic des causes **internes / externes / objectifs trop élevés**, entretiens, puis actions correctives **avec l'équipe**. Écarts négatifs → corriger ; positifs → **réajuster les objectifs**. **Co-construire** le tableau de bord.

---

## Sources (PDF d'origine)

Dossier `par thèmes:/Mesure et pilotage de la performance/` :

- `mise-place-tableau-bord-suivi-KPI_papier.pdf` — La mise en place d'un tableau de bord et le suivi des KPI
- `analyse-presentat-tableau-bord_pdf.pdf` — L'analyse et la présentation d'un tableau de bord

Dossier `par thèmes:/Data-Marketing et tableau de bord/` :

- `module_concev-struct-table-bord-effic.pdf` — Concevoir et structurer un tableau de bord efficace
- `maitrise-outil-creat-tabl-bord.pdf` — Maîtriser les outils de création de tableaux de bord
- `applica-data-marke-tablea-bord.pdf` — Application - Data Marketing & Tableaux de bord

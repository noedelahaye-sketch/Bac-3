---
id: b3-7
type: question
bloc: 3
dossier: 3
titre: "Q7 — Sélectionner et justifier les KPI du foodtruck"
competence: C3.3
resumes: [b3-r07]
resumes_appui: [b3-r03, b3-r06, b3-r02]
---

# Q7 — Sélectionner et justifier les KPI du foodtruck

La question demande des KPI **quantitatifs et qualitatifs**, **justifiés**, qui **traduisent les objectifs** (visibilité, notoriété, ventes, satisfaction), avec les **outils et méthodes de collecte** et le **respect du RGPD**. Deux critères : KPI **alignés** avec les objectifs (l'énoncé cite taux de conversion, NPS, ROI, engagement) ; processus de collecte et d'analyse **explicité**, **adapté** au contexte et **conforme au RGPD** (anonymisation, consentement, sécurité).

**La règle de fond** ([R7 §2 et §6](../resume/r07-kpi-performance.md)) : un **KPI** est relié à **un objectif** et sert **une décision**. Pour chaque KPI, réponds à « pourquoi ce KPI ? » et « à quelle décision sert-il ? ». Les objectifs sont donnés par l'**annexe 6** (notoriété, expérience immersive, test de recettes, acquisition, proximité) et chiffrés par le **brief du CEO** (annexe 8).

**La matrice à présenter** (objectif → KPI → formule → outil → RGPD)

| Objectif | KPI (cible du brief) | Formule | Outil de collecte (annexe 6) | RGPD |
|---|---|---|---|---|
| **Visibilité, notoriété** | Mentions digitales (≥ 500/ville), **taux d'engagement** (> 40 %), reach, part de voix du hashtag | Engagement = interactions / portée | **Social listening**, statistiques des réseaux | Données publiques **agrégées** |
| **Fréquentation, ventes** | Visiteurs (1 200/ville), **taux de conversion** (≥ 35 %), **CA** (12-15 k€/ville, > 100 k€), panier moyen | Conversion = acheteurs / visiteurs ; panier = CA / acheteurs | **Caisse** du foodtruck, comptage | Pas de donnée personnelle |
| **Acquisition** | **Inscriptions** site/app (≥ 700/ville), trafic issu des QR codes | Inscriptions / visiteurs | **CRM**, **QR codes tagués (UTM)**, **GA** | **Consentement** à l'inscription, double opt-in, bandeau cookies |
| **Fidélisation** | **Taux de réachat** (≥ 25 %), CLV | Clients ayant acheté ≥ 2 fois / clients | CRM, e-mailing et SMS de relance | Consentement pour les relances |
| **Expérience, satisfaction** | **Temps d'attente** (≤ 6 min), **satisfaction** (≥ 4,3/5), **NPS**, verbatims, plats les plus vendus | NPS = % promoteurs − % détracteurs | Caisse (horodatage), **tablettes**, enquête J+7 | Réponses **anonymisées**, durée de conservation fixée |
| **Rentabilité** | Marge nette, coût opérationnel, **ROI** | ROI = (gain − coût) / coût | Comptabilité, caisse | Données internes |

**Les qualitatifs** comptent aussi (l'énoncé les demande) : **verbatims** des tablettes et des réseaux, **observation** de la file d'attente, retours de l'équipe sur place, recettes testées ([R6 §4](../resume/r06-mesurer-satisfaction.md)).

**Pour la justification**, plusieurs grilles du cours aident à structurer :
- la **pyramide** (stratégiques pour le CEO : CA, ROI, inscriptions ; tactiques : conversion, réachat ; opérationnels : attente, ventes par heure) ;
- l'**entonnoir AARRR** du growth hacking : acquisition, activation, rétention, revenu, recommandation ([R2 §6](../resume/r02-parcours-client.md)) ;
- la distinction **action / résultat** : flyers distribués ou jours de présence sont des **métriques d'action** ; les likes isolés sont une **vanity metric** s'ils ne sont pas reliés aux inscriptions.

**Le processus de collecte et d'analyse** (deuxième critère) : caisse et tablettes → **CRM** (centralisation, segmentation nouveaux / récurrents) ; QR codes tagués **par ville** → GA et CRM pour relier la visite au truck, l'inscription et le réachat ; social listening sur le hashtag ; consolidation dans un **tableau de bord** (Looker Studio ou Power BI) ; **réconciliation** entre ventes en caisse et inscriptions ; **modèle d'attribution** en U plutôt que last-click, pour ne pas attribuer le réachat au seul e-mail de relance ([R7 §7](../resume/r07-kpi-performance.md)). Le RGPD se traite à chaque étape ([R3 §5](../resume/r03-donnees-outils-rgpd.md)).

**Pièges**

- **Lister** des KPI sans les **relier aux objectifs** ni donner de **formule**.
- Confondre **ROAS** (CA / dépense pub) et **ROI** (gain − coût) / coût.
- Oublier les **qualitatifs** ou le **RGPD**, tous deux exigés.
- Prendre la « satisfaction sur 5 » du brief pour un CSAT : c'est une **note moyenne**, le CSAT est un **% de satisfaits**.

Pour approfondir : [R7 — KPI et performance](../resume/r07-kpi-performance.md) (familles de KPI, formules, pyramide, alignement, attribution), [R6](../resume/r06-mesurer-satisfaction.md) (KPI de satisfaction), [R3](../resume/r03-donnees-outils-rgpd.md) (collecte et RGPD) et [R2](../resume/r02-parcours-client.md) (AARRR).

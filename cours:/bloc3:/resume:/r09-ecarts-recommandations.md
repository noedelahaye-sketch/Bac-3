---
id: b3-r09
bloc: 3
ordre: 9
titre: "Analyser les écarts et formuler des recommandations"
slug: r09-ecarts-recommandations
accroche: "Analyser les écarts en 4 étapes (quantifier, tester la significativité, segmenter, formuler des hypothèses) ; benchmarks, cycles et impact des événements ; signaux faibles, corrélation et causalité ; investigation en 5 étapes et 5 pourquoi ; interactions entre canaux ; matrice impact/effort et ROI prévisionnel ; recommandation en 5 parties, plan d'action, critères de succès ; cercle vertueux d'optimisation continue."
competences: [C3.3]
questions: [Q9]
questions_appui: [Q2, Q8]
mots: 3256
lecture_min: 15
sources:
  - support: "Analyser les performances marketing et identifier les écarts"
  - support: "Interpréter les résultats et formuler des recommandations"
  - support: "En bref - Créer un cercle vertueux d'optimisation continue"
  - support: "Auto-évaluation - Data Marketing & Tableaux de bord"
---

# Analyser les écarts et formuler des recommandations

> **Ce que couvre ce résumé.** La dernière marche du pilotage, de l'écart constaté à la décision :
> - **mesurer** un écart et savoir s'il est **significatif** ;
> - le **contextualiser** (benchmarks, cycles, événements, marché) ;
> - en **trouver la cause** (investigation, 5 pourquoi, segmentation, interactions entre canaux) ;
> - **prioriser** les actions (impact/effort, ROI prévisionnel) ;
> - **formuler** une recommandation qui convainc et un **plan d'action** suivi ;
> - installer un **cercle vertueux** d'optimisation continue.
>
> Cœur de la question **Q9** (interpréter les résultats du foodtruck face au brief du CEO, proposer actions correctives et préconisations opérationnelles). Appui pour **Q2** (diagnostic) et **Q8** (colonne « écart » du tableau de bord).
>
> KPI : [R7](r07-kpi-performance.md). Tableau de bord : [R8](r08-tableau-de-bord.md). Leviers d'expérience et de fidélisation à mobiliser dans les actions : [R4](r04-experience-fidelisation.md). Boucle de rétroaction satisfaction : [R6](r06-mesurer-satisfaction.md).
>
> **Déjà vu ailleurs, non repris ici.**
> - **Ishikawa** (5M / 5P), causes internes et externes, **action corrective** (deux acceptions), curatif vs préventif, plan d'action correctif, **OKR** : **B4-R5 §4-5**.
> - **PDCA** et outils d'amélioration continue : **B2-R6 §2.2**.
> - Plan d'action, **QQOQCCP**, séquençage, **Gantt** : **B4-R2 §5-6**.
> - Modèles d'attribution : [R7 §7.3](r07-kpi-performance.md).
>
> **Comment lire ce résumé.** Texte courant et tableaux = **noyau à apprendre** (flashcards et quiz). 💡 = **aides à la compréhension** (exemples, cas concrets), sautables en révision rapide. 🎯 = **repères examen**, à lire une fois. 📖 = **définitions**. ⚠️ = **piège ou divergence** entre supports.

---

## 1. Analyser un écart en 4 étapes

**Question préalable** : « **Mon objectif était-il réaliste et fondé sur des données fiables ?** » Un écart ne signale pas toujours un problème de performance ; il peut révéler un **défaut de projection** ou une méconnaissance du marché.

### Étape 1 : quantifier l'écart

| Écart | Formule | Exemple (CAC 42 € pour 50 € visés) |
|---|---|---|
| **Absolu** | **Réalisé − Objectif** | 42 − 50 = **−8 €** |
| **Relatif** | **(Réalisé − Objectif) / Objectif × 100** | −8 / 50 = **−16 %** |

Pour un **taux**, l'écart absolu s'exprime en **points** : conversion e-mail 2,1 % pour 2,8 % visés = **−0,7 point**, soit **−25 %** en relatif. Ne jamais écrire seulement « en dessous de l'objectif ».

⚠️ **Lire le sens de l'écart.** Pour un coût ou un temps d'attente, un écart **négatif est favorable** ; pour un CA ou un taux de conversion, il est **défavorable**. Indique toujours « favorable » ou « défavorable ».

Astuce : automatiser les colonnes **« écart absolu »** et **« écart relatif »** dans le tableau de suivi mensuel (Google Sheets, Excel).

### Étape 2 : évaluer la significativité

Tous les écarts ne méritent pas une action. Une variation peut venir de la **saisonnalité**, d'un **événement externe** ou d'un **petit échantillon**. On regarde la **durée**, la **récurrence** et l'**amplitude** de l'écart par rapport aux variations habituelles. Outils : un **test statistique** (type t-test) si les données le permettent, ou au minimum la **médiane des 3 mois précédents**.

### Étape 3 : segmenter

Un écart global peut cacher d'excellents résultats sur un segment compensés par une chute sur un autre. On décompose par **canal**, **période**, **produit**, **segment client**.

- **Pareto** : 20 % des causes expliquent 80 % de la variation.
- **3 dimensions** suffisent en général : **canal, temporalité, segment**.
- Chaque segment doit compter **au moins 100 événements** (clics, conversions) pour être fiable.
- Outil : une **matrice croisée** segments (nouveaux, récurrents, VIP) × canaux.
- Ajouter une colonne « **coût par session utile** » ou « coût par ajout au panier » donne une lecture plus stratégique que le seul CPA.

### Étape 4 : formuler des hypothèses vérifiables

« La baisse sur mobile **coïncide avec la mise à jour du site** » est actionnable ; « les mobinautes sont moins engagés » ne l'est pas.

> 💡 TechnoSport : conversion e-mail 2,1 % pour 2,8 % (−25 %). Segmentée : **nouveaux abonnés 3,4 %** (au-dessus), **abonnés de plus de 6 mois 1,2 %**. Le problème n'est pas l'acquisition mais la **rétention** ; hypothèse : le contenu ne se renouvelle pas. Action ciblée : personnaliser pour les anciens, sans refaire toute la stratégie e-mail.

---

## 2. Contextualiser : benchmarks, cycles, événements

### 2.1 Benchmarks externes

Une performance ne s'évalue **jamais dans l'absolu**. 2,8 % de conversion pour 3,2 % visés, c'est décevant ; mais **excellent** si le secteur est à 2,1 %. Le benchmark évite l'erreur « sous l'objectif donc en échec ».

**Sources** : rapports Google par secteur, études **Mailchimp** (e-mail), **Facebook Business**, **Salesforce**, **Statista**, **Kantar** ; récentes (**moins de 2 ans**) et de la **même zone géographique**. Concurrents : **SEMrush, Ahrefs, SimilarWeb**, Facebook Ad Library, Google Trends. Ne pas copier : **comprendre pour se différencier**.

**La lecture croisée interne / externe**

| Situation | Diagnostic probable |
|---|---|
| Résultats dans la fourchette **historique** et proches du **secteur** | **Objectifs trop ambitieux**, pas une dégradation |
| Résultats en baisse alors que les **concurrents progressent** | **Cause interne** |
| Trafic +10 % alors que le **marché fait +25 %** | Perte de **part de marché** malgré la hausse |

Rituel proposé : une demi-journée par mois de **benchmark « État du marché »**.

### 2.2 Cycles et tendances

- **Cycles hebdomadaires** : e-mails lus en début de semaine, e-commerce le week-end.
- **Saisonnalité** : le fitness explose en **janvier** (résolutions), baisse en **août**. On bâtit un **calendrier « 4 saisons »** (intensité, préparation, creux, réactivation).
- **Tendances de fond** : mobile, nouveaux canaux.

**Visualisations** : courbes avec **moyenne mobile** (7 jours pour lisser le bruit, 30 jours pour la tendance de fond), **aires empilées** (répartition entre canaux), **heat maps** temporelles (jour × heure).

### 2.3 Impact des événements

1. **Journal des événements** : Date / Événement / Hypothèse d'impact / KPI cible (campagnes, modifications du site, prix, concurrents, événements externes).
2. **Avant / après** sur des **périodes équivalentes**, en tenant compte de la saisonnalité ; idéalement avec un **groupe de contrôle** non exposé.
3. **Annotations** dans Google Analytics (ou Matomo, Adobe, Mixpanel) pour une timeline visuelle.

⚠️ **Corrélations trompeuses** : deux événements simultanés brouillent la cause (une baisse SEO attribuée à la mise à jour d'un article alors qu'elle vient d'une **mise à jour de l'algorithme** Google le même jour). Penser aux **effets retardés** (une campagne de notoriété agit plusieurs semaines après).

### 2.4 Prévoir

Méthode simple sous Excel : **tendance de fond** sur 12-24 mois (régression linéaire) × **coefficients saisonniers** (par mois ou trimestre) + **chocs** prévisibles (lancements, campagnes). Horizon fiable : **3 à 6 mois** ; commencer par 1-3 mois. Toujours donner une **fourchette**, réviser avec les données réelles, et décliner en **capacité** (« hausse des contacts → renfort du SAV »). Une **veille des signaux faibles** (Fait observé / Impact potentiel / Probabilité) nourrit les prévisions.

---

## 3. Interpréter : signal ou bruit, corrélation ou cause

### 3.1 Signal faible ou fluctuation normale ?

> 📖 Un **signal faible** est une variation **significative**, distincte des **fluctuations normales** d'un environnement digital naturellement volatil. Il peut aussi nourrir la **prospective**.

**Trois techniques** : **moyenne mobile sur 30 jours** ; **écarts-types** (ce qui sort de la plage habituelle) ; comparaison avec **l'année précédente** (N-1) pour séparer le saisonnier du structurel.

**Trois vérifications avant d'alerter** :

1. le **contexte saisonnier** (vacances, jours fériés) ;
2. les **sources** concernées (global ou un seul canal ?) ;
3. les **segments** touchés.

Si un seul canal ou segment est touché, on analyse cette niche **avant** d'agir globalement.

### 3.2 Corrélation et causalité

> 💡 Les clients qui lisent le blog avant d'acheter ont un panier **35 % plus élevé** ; chaque seconde de chargement en plus augmente le rebond de **15 %** (argument pour obtenir un budget technique).

- **Triangulation** : croiser au moins **deux sources ou méthodes** (quanti et quali, interne et externe, CRM et web analytics).
- Question test : « **Si j'améliore ce levier, le KPI bouge-t-il vraiment, et est-ce mesurable ?** » Si oui, un **test A/B** sur un petit segment avant de généraliser.

### 3.3 Quantifier l'impact business

Passer de métriques marketing (clics, impressions) à l'**impact business** fait passer le marketing de **centre de coût** à **centre de profit**.

**ROI = (CA additionnel − coût de la campagne) / coût de la campagne × 100**

> 💡 Optimisation Google Ads : 847 commandes de plus, **63 000 €** de CA additionnel pour **12 000 €** investis → (63 000 − 12 000) / 12 000 = **425 %**.

---

## 4. Trouver la cause

### 4.1 L'investigation en 5 étapes

1. **Circonscrire** : quand cela a commencé, quels segments, quelle ampleur.
2. **Inventorier les changements** de la période, **internes** (technique, campagnes) et **externes** (concurrents, secteur).
3. **Tester les hypothèses** sur des données granulaires.
4. **Valider** par des analyses ou des sources complémentaires.
5. **Documenter** (base de connaissances pour les prochaines fois).

Pour départager deux hypothèses : **« si X, alors test Y »** (« si c'est un bug, la chute ne touche que le mobile ; si c'est l'algorithme publicitaire, elle touche tous les canaux payants »).

> 💡 Conversions des montres homme -30 % : la baisse commence le 15 et ne touche que les **35-45 ans** ; une mise à jour du site a modifié la page de cette catégorie ; l'analyse du parcours confirme ; comparaison avec les autres segments ; documentation.

### 4.2 Les 5 pourquoi

On creuse chaque réponse jusqu'à la **cause racine**, pour traiter la cause et non le symptôme. Chaque « pourquoi » doit s'appuyer sur une **donnée** ; si elle manque, on met en place son suivi.

> 💡 Conversion -20 % → moins d'ajouts au panier → moins de temps sur les pages produits → images plus lentes depuis la mise à jour → images non optimisées pour mobile → **aucun audit technique prévu après la refonte**. Un **6ᵉ pourquoi** remonte à une cause **organisationnelle** : process qualité marketing/tech jamais formalisés. Le problème « marketing » se règle avec l'**IT**.

La méthode **décloisonne** (marketing, produit, IT, RH) et se complète par l'**Ishikawa** (voir B4-R5), utile en atelier collectif.

### 4.3 Segmenter pour localiser

« **Les moyennes tuent l'analyse.** » Segmenter par profil (démographie, comportement) et par **cycle de vie** : **acquisition, activation, fidélisation, rétention / réachat**.

**Trois règles d'une segmentation utile** :

1. **Taille** : au moins **5 % de la base** ;
2. **Homogène** à l'intérieur, **hétérogène** entre segments ;
3. **Actionnable** : accessible par des leviers spécifiques (« VIP urbains 30-45 ans, 3 commandes en 6 mois » plutôt que « plus de 35 ans »).

On mise d'abord sur les **« quick wins segmentés »**, et l'on documente **au moins une hypothèse d'optimisation par analyse segmentée**.

> 💡 Conversion e-mail globale 2,8 % (correcte), mais **femmes 25-35 ans 4,2 %** et **hommes 45-55 ans 1,4 %** : on travaille le segment faible au lieu de tout changer.

### 4.4 Les interactions entre canaux

| Effet | Définition | Exemple |
|---|---|---|
| **Synergie / effet de halo** | Un canal rend les autres plus efficaces **sans capter l'attribution** | Le display augmente la notoriété, donc le taux de clic des annonces search |
| **Cannibalisation** | Des canaux se disputent la même audience ; le coût d'acquisition gonfle sans gain global | Le SEA capte des conversions qui seraient venues du SEO ou du CRM : ROAS en baisse, dépendance au payant |

On construit une **matrice d'interdépendance** (+ synergie, − cannibalisation, ± mixte, 0 aucune) et l'on analyse sur plusieurs **fenêtres** (immédiat, 7 jours, 30 jours). ⚠️ Couper un canal au CPA élevé (Facebook Ads) peut faire baisser **un autre** canal (trafic organique de marque).

---

## 5. Prioriser les actions

### 5.1 La matrice impact / effort

- **Impact** (1 à 5) : gain potentiel en revenus, conversions, réduction de coûts.
- **Effort** (1 à 5) : temps, budget, compétences.
- **Score de priorité = Impact × Impact / Effort** (favorise le fort impact).

| | **Effort faible** | **Effort fort** |
|---|---|---|
| **Impact fort** | **Quick wins** : priorité immédiate | **Projets majeurs** : à planifier |
| **Impact faible** | **Projets de remplissage** | **Actions à éviter** |

Ajouter la **faisabilité organisationnelle** (nombre d'équipes à coordonner, validations) et la **timeline** : une amélioration modeste **déployable tout de suite** peut valoir mieux qu'une excellente disponible dans six mois. Construire une **roadmap trimestrielle** qui articule les deux horizons. Utilisée **en équipe**, la matrice objective les débats ; code couleur vert / jaune / rouge.

⚠️ Le module « Interpréter » simplifie l'échelle en **faible / moyen / fort** et **facile / modérée / complexe**. Les deux versions sont valables.

### 5.2 Le ROI prévisionnel

Si tu ne peux pas **chiffrer** ce que tu proposes, tu ne pourras pas le **défendre**.

- Traduire les gains de performance (conversion, CAC, CLV) en **CA** ou en **rentabilité**, pour comparer des actions de nature différente (UX, campagne payante, SEO).
- **Distinguer revenus additionnels et économies de coûts** (effets différents sur la trésorerie).
- **Fourchettes** et **scénarios** pessimiste / réaliste / optimiste ; règle de prudence : pour un gain espéré de +10 %, **calculer sur +5 %**.
- ⚠️ Gains surestimés (saturation, réaction des concurrents), coûts sous-estimés (coûts indirects, risque d'échec).
- **Payback period** (délai de retour) : un ROI modeste rentabilisé en 3 mois peut battre un excellent ROI à 24 mois.
- **Coefficient de risque** : 0,8 pour une action maîtrisée, 0,5 pour une action incertaine → **ROI pondéré**.

> 💡 Refonte des pages produits : 8 000 € pour +3 000 € par mois, soit 36 000 € sur un an → (36 000 − 8 000) / 8 000 = **350 %** annualisé.

---

## 6. Formuler une recommandation qui convainc

### 6.1 La structure en 5 parties

1. **Contexte et enjeu** : pourquoi maintenant, quel problème ou quelle opportunité.
2. **Analyse des données** : les faits qui fondent la proposition.
3. **Recommandation et plan d'action** : étapes concrètes, responsabilités.
4. **Bénéfices attendus chiffrés** : impact sur les KPI et les objectifs business.
5. **Risques et mesures de mitigation**, solutions alternatives.

Cet ordre suit le **questionnement naturel** du décideur : comprendre, vérifier, visualiser, chiffrer, sécuriser.

**La diapositive « Projection d'impact »** : hypothèses de base (KPI actuels) → projection après action → **ROI prévisionnel** → **plan de suivi**.

> 💡 +30 % de budget Facebook sur les femmes 25-35 ans : conversion 4,2 %, CAC 28 €, panier 145 €. **8 400 €** de budget additionnel → environ **300 clients** et **43 500 €** de CA → ROI ≈ **420 %**.

### 6.2 Adapter au destinataire

Trois questions avant chaque présentation : **qui** est mon audience (DG, DAF, marketing, IT) ? quelles sont ses **priorités** (CA, coûts, planning, expérience client) ? quelles **objections** pourrait-elle avoir ?

| Destinataire | Angle |
|---|---|
| **Direction générale** | Impact business, CA additionnel, **ROI** |
| **IT** | Faisabilité technique, ressources, compatibilité |
| **Équipe marketing** | Actions concrètes, **planning** de mise en œuvre |

### 6.3 La roadmap et le plan d'action

- **Qui fait quoi, quand** : responsabilités avec un **RACI** (*Responsible, Accountable, Consulted, Informed*) ; dépendances entre actions (parallèle ou séquentiel).
- **Planning à la semaine** avec des **livrables** (S1 analyse des audiences, livrable vendredi ; S2 création des campagnes, validation mercredi ; S3 lancement et A/B tests ; S4 analyse et optimisation).
- **Points de contrôle** intermédiaires plutôt qu'une mesure à la fin.
- Critères de réussite **SMART** (« taux de clic des pages produit de 1,8 % à 2,3 % d'ici fin Q2, via la refonte des visuels mobiles »).
- **Outil collaboratif** partagé : Trello, Asana, ClickUp, Monday, Notion.
- Commencer par **quelques quick wins** pour créer une dynamique, puis les projets ambitieux. « **Un plan imparfait exécuté à 100 % vaut mieux qu'un plan parfait resté sur le papier.** »

### 6.4 Les critères de succès, en 4 étapes

1. **Métriques et cibles** précises (conversion de 2,8 % à 3,2 % ; CAC de 32 € à 28 €).
2. **Délais d'évaluation** : une mesure **intermédiaire** (par exemple **4 semaines**) et une **définitive** (**12 semaines**).
3. **Critères d'arrêt** : seuils qui déclenchent une révision de la stratégie.
4. **Plan d'apprentissage** : documenter les enseignements, succès ou échec.

**Tableau de suivi post-implémentation** : Objectif | KPI de départ | KPI cible | Résultat **J+30 / J+60 / J+90** | Commentaires et actions correctives.

---

## 7. Le cercle vertueux d'optimisation continue

L'**analyse ponctuelle** s'arrête au rapport ; l'**optimisation continue** crée un **cycle perpétuel** où chaque résultat lance le cycle suivant.

**Les 6 étapes**

1. **Analyser** les données pour identifier une **opportunité** ;
2. formuler une **hypothèse testable** ;
3. **tester** en conditions contrôlées (A/B test) ;
4. **apprendre** des résultats ;
5. **implémenter** ce qui fonctionne ;
6. **nouvelle analyse** avec les données enrichies.

⚠️ La « validation hiérarchique » **ne fait pas partie** des 6 étapes (piège du quiz).

**Les 3 piliers**

| Pilier | Rôle |
|---|---|
| **Documentation partagée** | **Mémoire collective** : chaque test consigné de façon standardisée (fiche : objectif, hypothèse, méthode, résultats, décision, recommandation) |
| **Rituels structurés** | Rendez-vous **hebdomadaires, mensuels, trimestriels** pour analyser, prioriser, générer des hypothèses |
| **Culture transverse** | Impliquer marketing, produit, commercial, service client : plus d'insights et **déploiement plus rapide** des apprentissages |

⚠️ Un **taux de tests validés trop élevé** n'est pas un bon signe : il révèle des hypothèses trop « sûres », un **manque de prise de risque**. L'échec fait partie de l'apprentissage.

> 💡 GoodFoodBox (box de repas sains en ligne) : conversion visiteurs → abonnés stagnante depuis 3 mois. Opportunité : friction dans le tunnel d'abonnement → hypothèse : **formulaire trop long** → test A/B formulaire simplifié sur **50 % du trafic** → succès si **+10 %** de conversion avec un échantillon suffisant → fiche documentée → si concluant, déploiement puis optimisation de l'étape suivante (choix de la box).

---

## 8. Application au foodtruck PrepMyMeal

> 🎯 **Repère examen (Q9).** Le critère exige des actions correctives **adaptées aux causes et aux écarts**, et des préconisations **opérationnelles** : **planning, acteurs, moyens, estimation des coûts**. La démarche de ce résumé s'applique ainsi.
>
> **1. Quantifier les écarts** (annexe 7 vs annexe 8, moyennes simples sur 8 villes) :
>
> | KPI | Objectif | Réalisé | Écart | Villes à l'objectif |
> |---|---|---|---|---|
> | CA total | > 100 000 € | 108 000 € | **+8 %** favorable | — |
> | CA par ville | 12 000-15 000 € | 13 500 € (moyenne) | dans la fourchette | Marseille, Bordeaux ; Paris et Lyon au-dessus ; 4 villes en dessous |
> | Fréquentation | 1 200 / ville | 1 219 | +1,6 % | 5 / 8 |
> | Conversion | ≥ 35 % | 29,9 % | **−5,1 points** | 3 / 8 (Paris, Toulouse, Bordeaux) |
> | Inscriptions | ≥ 700 / ville | 791 | +13 % | 6 / 8 (pas Lille, Nantes) |
> | Réachat | ≥ 25 % | 25,0 % | 0 | 5 / 8 (pas Lille, Strasbourg, Nantes) |
> | Temps d'attente | ≤ 6 min | 7,3 min | **+1,3 min** défavorable | **1 / 8** (Strasbourg) |
> | Satisfaction | ≥ 4,3 / 5 | 4,16 | **−0,14** | 2 / 8 (Paris, Marseille) |
> | Mentions digitales | ≥ 500 / ville | 481 | −3,8 % | 3 / 8 (Paris, Lyon, Marseille) |
> | Engagement digital | > 40 % | non mesurable | — | colonne en valeur absolue |
>
> **2. Vérifier la fiabilité avant d'interpréter** (étape « objectif réaliste, données fiables ») : **Lyon** (200 clients, 7 %, mais 18 000 € et 800 inscriptions) est **incohérent** ; la colonne « engagement digital » **reproduit les inscriptions** ; la **marge nette dépasse CA − coût** dans toutes les villes ; les adresses de Strasbourg et Lyon sont celles de **Lille**. Signale-les, pose une hypothèse de lecture, recommande une **fiabilisation des données** (caisse, CRM).
>
> **3. Segmenter** : par **ville** et par **chronologie** (S1 Paris → S8 Nantes). Le temps d'attente **ne s'améliore pas** au fil de la tournée (9,2 min à Nantes) : il n'y a pas eu de **boucle d'apprentissage** d'une ville à l'autre.
>
> **4. Hypothèses et 5 pourquoi** : satisfaction sous 4,3 → attente trop longue → service lent aux pics de midi → paiement et préparation à la commande → **aucun dispositif de précommande** ni de renfort prévu.
>
> **5. Prioriser** (impact/effort) : quick wins = **précommande via l'app** (QR code) et menu resserré sur les best-sellers ; projet majeur = refonte du choix des emplacements (Lille, Strasbourg) ; chaque action avec **planning, acteur, moyens, coût, KPI de succès**, mesurée à **J+30** sur la tournée suivante. Calculs complets et plan chiffré : fiche Q9.

---

## L'essentiel en 10 points

1. **Avant tout** : l'objectif était-il **réaliste** et les **données fiables** ? Un écart peut venir d'une mauvaise projection.
2. **4 étapes** : **quantifier** (absolu = réalisé − objectif ; relatif = écart / objectif ; en **points** pour un taux), **significativité** (durée, récurrence, amplitude ; médiane 3 mois), **segmenter** (Pareto, 3 dimensions, ≥ 100 événements), **hypothèses vérifiables**.
3. **Contextualiser** : **benchmarks** (< 2 ans, même zone) ; dans l'historique et le secteur = objectif trop ambitieux ; en baisse quand les concurrents montent = cause interne. Cycles hebdomadaires, saisonnalité, tendances ; **journal d'événements**, avant/après, groupe de contrôle, annotations.
4. **Signal ou bruit** : moyenne mobile 30 j, écarts-types, N-1 ; vérifier saison, source, segment avant d'alerter. **Corrélation ≠ causalité** : triangulation, **A/B test**.
5. **Investigation en 5 étapes** : circonscrire, inventorier les changements, tester, valider, documenter ; « si X alors test Y ». **5 pourquoi** (parfois 6) étayés par des données ; complétés par Ishikawa.
6. **« Les moyennes tuent l'analyse »** : segments ≥ 5 % de la base, homogènes / hétérogènes, **actionnables** ; cycle de vie acquisition → activation → fidélisation → réachat. Interactions entre canaux : **synergie / halo** vs **cannibalisation**.
7. **Matrice impact / effort** (score = impact² / effort) : **quick wins**, projets majeurs, remplissage, à éviter. **ROI prévisionnel** : fourchettes, scénario prudent, revenus vs économies, **payback**, coefficient de risque.
8. **ROI = (CA additionnel − coût) / coût**. Il fait passer le marketing de centre de coût à **centre de profit**.
9. **Recommandation en 5 parties** : contexte, analyse, recommandation et plan, **bénéfices chiffrés**, **risques et mitigation** ; adaptée au destinataire (DG, IT, marketing). Plan : **RACI**, planning à la semaine, points de contrôle, SMART, quick wins d'abord. **Critères de succès** : cibles, mesure intermédiaire (4 sem.) et définitive (12 sem.), **critères d'arrêt**, plan d'apprentissage ; suivi J+30/60/90.
10. **Cercle vertueux** en 6 étapes : analyser → hypothèse → tester → apprendre → implémenter → réanalyser. 3 piliers : **documentation**, **rituels**, **culture transverse**. Trop de tests validés = pas assez de risque.

---

## Sources (PDF d'origine)

Dossier `par thèmes:/Data-Marketing et tableau de bord/` :

- `analy-perfor-mark-identif-ecar.pdf` — Analyser les performances marketing et identifier les écarts
- `module_inter-res-form-recom-strat.pdf` — Interpréter les résultats et formuler des recommandations
- `module_en-br-cre-cer-vert-opti-cont.pdf` — En bref - Créer un cercle vertueux d'optimisation continue
- `auto-evalua-data-market-tablea.pdf` — Auto-évaluation - Data Marketing & Tableaux de bord

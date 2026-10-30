---
id: b3-r03
bloc: 3
ordre: 3
titre: "Données clients : collecte, outils d'analyse et RGPD"
slug: r03-donnees-outils-rgpd
accroche: "De la donnée brute à l'information : typologies (online/offline, first/second/third party), Big, Fast et Smart Data, collecte multicanale et tracking, qualité des données, puis RGPD opérationnel : bases légales, consentement, registre, AIPD, DPO, cookies, sécurité, sous-traitants, violations."
competences: [C3.1, C3.3]
questions: [Q2, Q3]
questions_appui: [Q7]
mots: 4343
lecture_min: 20
sources:
  - support: "Les données clients online"
  - support: "Collecter des données marketing multicanales"
  - support: "Respecter le RGPD dans la collecte de données marketing"
---

# Données clients : collecte, outils d'analyse et RGPD

> **Ce que couvre ce résumé.** Deux blocs. **D'abord la donnée** : ce qu'elle est, comment la classer, Big, Fast et Smart Data, stratégie data, méthodes d'analyse, stockage. Puis **la collecte multicanale** : cartographie des sources, tracking, qualité. **Ensuite le RGPD appliqué au marketing** : bases légales, consentement, documentation, cookies, sécurité, sous-traitants, violations. Cœur des questions **Q2** et **Q3**, appui de **Q7** (compétences **C3.1**, **C3.3**).
>
> **Déjà vu ailleurs, non repris ici.**
> - Le cadre RGPD de base (CNIL, donnée personnelle, consentement donné « volontairement, explicitement et par écrit », tableau des 7 droits) et le CRM : **B1-R3**.
> - Data-driven marketing, first/second/third-party et **règle des 4C**, marketing automation : **B2-R2**.
> - Sources de collecte relationnelle et fichiers « qualifiés » : [R1](r01-connaitre-client.md).
> - Les modèles d'attribution : [R7](r07-kpi-performance.md).
>
> **Comment lire ce résumé.** Texte courant et tableaux = **noyau à apprendre** (flashcards et quiz). 💡 = **aides à la compréhension** (exemples, cas concrets), sautables en révision rapide. 🎯 = **repères examen**, à lire une fois. 📖 = **définitions**. ⚠️ = **piège ou divergence** entre supports.

---

## 1. La donnée et sa valeur

> 📖 Une **donnée** est une **information brute** (nombres, textes, images, vidéos, sons) qui n'a **pas de signification en soi**. Une fois traitée et contextualisée, elle devient une **information**, qui permet de décider.

Les données sont **structurées** (organisées, en bases relationnelles, faciles à interroger par requêtes) ou **non structurées** (texte libre, images, audio, vidéo, qui demandent des techniques plus avancées). Il existe aussi des données **semi-structurées** (JSON, XML).

**Ce que l'analyse apporte** :
- identifier la cible et ses besoins ;
- détecter tendances et relations cachées ;
- planifier et piloter l'action de communication en temps réel ;
- optimiser la stratégie marketing et le canal de vente ;
- inspirer l'**innovation** ;
- améliorer l'efficacité opérationnelle.

> 💡 Moins de **10 %** des entreprises ont une stratégie de gestion des données online.

### 1.1 Les « V » de la donnée

Ce sont les caractéristiques qui définissent les défis du big data. Le cours en présente **six** :

| V | Signification | Réponse à apporter |
|---|---|---|
| **Volume** | Quantité massive générée chaque jour | Stockage **évolutif** |
| **Vélocité** | Vitesse de génération, de collecte et de traitement (temps réel) | Systèmes de collecte rapides |
| **Variété** | Diversité des types : structurées, semi-structurées, non structurées | Plateformes polyvalentes (**Hadoop**), normalisation |
| **Véracité** | Qualité, **fiabilité** | Processus de correction des erreurs |
| **Volatilité** | **Durée de vie** des données (éphémères ou à conserver) | Mécanismes d'**archivage** |
| **Valeur** | Capacité à en tirer des informations exploitables | Identifier les données à réelle valeur commerciale |

### 1.2 Classer les données

**Selon la source**

| Source | Définition | Exemples |
|---|---|---|
| **Offline** (hors ligne) | Non connectées à un réseau ; souvent internes ou recueillies au contact du client | Formulaires prospects sur un salon, **programmes de fidélité**, **passages en caisse**, questionnaires, systèmes de point de vente (**POS**), clés USB, capteurs industriels |
| **Online** (en ligne) | Accessibles par Internet, hébergées sur des serveurs distants | Bases en ligne, réseaux sociaux, applications, e-commerce, streaming, données temps réel (GPS, IoT), **recherches en ligne** |

**Selon l'origine (qui collecte)**

| Origine | Définition | Atouts | Risques |
|---|---|---|---|
| **First party data** | Collectées **directement par l'entreprise** auprès de son public (site, questionnaires, SAV, création de compte, caisse) | **Fiables** (déclaratives), faciles à collecter et gérer, recueillies à chaque contact | — |
| **Second party data** | Venues d'**entreprises partenaires** qui échangent leurs bases (une compagnie aérienne et un groupe hôtelier) | Toucher de **nouveaux prospects**, partenariats BtoB, « **scaler** » les données | Vérifier que le partenaire respecte le RGPD ; autorisation de transmission à recueillir |
| **Third party data** | **Achetées** à un « **marchand de données** » | Élargir l'audience, affiner l'analyse, repérer des opportunités | ⚠️ L'acheteur est **entièrement responsable** si la collecte était illégale : il ne peut pas s'exonérer |

**Selon le niveau de traitement**

| Niveau | Définition |
|---|---|
| **Primaires** | Collectées **à la source**, pour un objectif précis : données brutes, « de première main » |
| **Secondaires** | Déjà collectées et traitées **par d'autres, pour d'autres besoins** (publications, rapports publics, études, bases partenaires) ; plus simples à traiter, car déjà triées |
| **Tertiaires** | Un niveau supplémentaire d'**agrégation** ou d'analyse : souvent issues des réseaux sociaux ou de Google, sur des comportements génériques ; ce sont elles qui posent les problèmes de vie privée |

⚠️ Le cours écrit « données secondaires (*second party data*) ». Ne confonds pas : **secondaire** désigne un **niveau de traitement**, **second party** une **origine** (partenaire).

> 💡 **Cambridge Analytica** (scandale de 2018) : une application de quiz Facebook (2014, Aleksandr Kogan) téléchargée par environ **270 000 personnes** a aspiré les données de **millions de leurs amis sans consentement**. Ces données ont été réutilisées pour des profils psychographiques en politique (campagne de Trump en 2016, Brexit). Le cours cite aussi les questions posées sur **TEMU**.

### 1.3 Open Data, Data Science

> 📖 L'**Open Data** (données ouvertes) consiste à rendre des données **librement disponibles**, à utiliser, redistribuer et partager **sans restriction** : transparence, innovation, participation. Certaines sont publiques par **obligation légale** (bilans, comptes de résultat). Sources : **INSEE**, CNIL. Le travail tiré de données publiques reste la propriété de l'entreprise qui l'a produit.

**Big Data ≠ Open Data** : le Big Data se définit par **l'ampleur**, l'Open Data par **l'usage ouvert**. Une Big Data n'est pas forcément ouverte, une Open Data n'est pas forcément énorme.

**Big Data ≠ Data Science** : le Big Data concerne les **outils informatiques** (émission, transmission, stockage). La Data Science concerne les **méthodes d'analyse**, mégadonnées ou non.

> 📖 La **Data Science** est un domaine multidisciplinaire (statistiques, mathématiques, informatique, expertise métier) qui extrait des connaissances de données structurées et non structurées. Elle permet de créer des **Data Products**, des produits qui tirent leur valeur de l'analyse de données, comme les **moteurs de recommandation** (Netflix, Spotify, YouTube, TikTok).

---

## 2. Big Data, Fast Data, Smart Data

| Notion | Définition | Ce qui la caractérise | Exemple du cours |
|---|---|---|---|
| **Big Data** | Ensemble **très volumineux** de données (« mégadonnées »), généré par une multitude d'outils digitaux et géré par des outils très performants | Volume énorme : **2,5 trillions d'octets par jour en 2022**, un volume qui **double tous les deux ans** ; question énergétique des data centers ; lien fort avec l'évolution des TIC | **Netflix** et *House of Cards* : données de visionnage, recommandations, bandes-annonces personnalisées |
| **Fast Data** | Collecte, traitement et analyse **en temps réel**, à grande vitesse | Vitesse, analyse au fil de l'eau, **réactivité**, intégration au big data | **Waze** : itinéraires, trafic et dangers signalés en temps réel |
| **Smart Data** | **Sélectionner à la source** les informations stratégiques et les exploiter vite, **sans stocker l'inutile** | Analyse « en streaming » ; collecte ciblée, nettoyage, machine learning, contextualisation, IA, conformité | **La Poste** : délais réduits, tournées optimisées, risques prévenus, coûts minimisés |

**Le lien entre les deux** : le **Big Data** répond surtout à **volume, variété, vélocité** ; le **Smart Data** répond à **valeur et véracité**.

**Avantages du Smart Data** : une meilleure décision avec moins d'erreurs, des opérations optimisées, des services personnalisés, de nouvelles opportunités.

### 2.1 La stratégie data

| Approche | Objectif | Exemple |
|---|---|---|
| **Défensive** | **Sécurité et intégrité** des données, vie privée, respect de la loi : captation optimisée, processus standardisés, stockage sécurisé | Hôpital (données sensibles) |
| **Offensive** | **Compétitivité et rentabilité** : opportunités, compréhension des besoins par l'analyse, la modélisation, la visualisation, l'enrichissement | Commerce de détail |

**L'appétence pour le Big Data** croise l'appétence de l'entreprise avec la maturité de son secteur :

| | Secteur **peu mature** | Secteur **mature** |
|---|---|---|
| Entreprise **sans appétence** | **Big Observation** (artisanat, boulangerie) | **Big Problem** (agriculture traditionnelle) |
| Entreprise **qui a investi** | **Big Risk** : trop peu de données, investissement non rentabilisé | **Big Opportunity** |

**Devenir data driven**, c'est fonder ses décisions sur l'analyse des données plutôt que sur l'intuition. Cela suppose :
- l'**engagement de la gouvernance**, avec une vision et des objectifs suivis par KPI ;
- la **formation des collaborateurs** ;
- une **infrastructure technologique** adaptée ;
- une **compréhension approfondie des clients**.

---

## 3. Analyser et stocker les données online

**Big Quali.**

> 📖 Le **Big Quali** est la capacité à recueillir et analyser une **masse de données qualitatives** pour saisir toutes les facettes d'une marque.

On utilise le **NLP** (traitement automatisé du langage naturel) sur les avis, commentaires et forums, et le machine learning pour détecter **thèmes récurrents, opinions, sentiments**.

**Susciter la contribution des clients.**

> 📖 Le **marketing participatif** consiste à demander l'avis et la participation des clients (blogs, chats, forums, réseaux sociaux, sondages).

Il a deux dimensions : l'une **objective** (messages et outils qui incitent à participer) et l'autre **affective** (la confiance et la fidélité poussent à produire du contenu).

> 💡 **Hasbro** fait voter le public sur 16 nouvelles cartes du Monopoly, dans une version écolo.

**Optimiser l'évaluation en ligne.** Le feedback digital est riche mais **volatil** : copié, amplifié, déformé. Un seul avis très négatif peut détourner les internautes. Les avis restent **subjectifs**, comme le montrent les avis contradictoires sur un même restaurant TripAdvisor. Il faut donc **répondre aux mécontents** et piloter les avis.

**La data visualisation.**

> 📖 La **data visualisation** est le processus de traitement visuel des données, de la collecte à la représentation graphique. C'est un **outil d'aide à la décision** et de communication interne et externe.

Le modèle de référence **Dataflow** compte **4 étapes** : collecte des données brutes → **transformation** (métadonnées, élimination de l'inutile, création de tables) → **mapping** (tables associées à des éléments visuels) → structuration visuelle.

> 💡 **Ville Prudente** : un tableau de bord dynamique de l'accidentologie routière des villes sur 10 ans. Construction d'un tableau de bord : [R8](r08-tableau-de-bord.md).

**L'analyse en temps réel** :
- **Stream Processing** : agrégation, filtrage et transformation en continu, détection d'anomalies ;
- **Online Machine Learning** : modèles mis à jour en continu, chatbots réactifs ;
- **tableaux de bord en temps réel**.

**Le data cleaning.**

> 📖 Le **data cleaning** consiste à identifier puis corriger les données inexactes ou non pertinentes, pour améliorer leur fiabilité, leur valeur et leur cohérence.

**6 bonnes pratiques** : surveiller les erreurs (registre) · normaliser et automatiser les processus · **supprimer les doublons** · **valider** après nettoyage · analyser une fois les données propres · **communiquer les procédures** aux équipes.

**Le stockage**

| Solution | Principe |
|---|---|
| **Data Lake** | Stocke **à bas coût** des données **brutes**, structurées ou non, **sans transformation** ; hautement évolutif |
| **Data Warehouse** | Infrastructure **centralisée et structurée** : données transformées pour le **reporting et l'analyse**, optimisée pour les requêtes complexes, avec historique |
| **Stockage distribué** | Données réparties sur **plusieurs serveurs** : évolutivité, coûts réduits, **tolérance aux pannes** (Google File System, Amazon S3, Hadoop chez Facebook, Cassandra chez Netflix) |

---

## 4. Collecter des données marketing multicanales

L'enjeu : « sans données fiables, pas d'analyse pertinente ; sans analyse pertinente, pas de stratégie efficace ». Chaque canal produit ses données **dans son format**, d'où des données **en silos**.

> 💡 Le fil rouge du module : **Camille**, chargée de marketing chez **TechnoSport** (e-commerce, Google Ads, Facebook et Instagram, newsletter Mailchimp, blog, Amazon et Cdiscount).

### 4.1 Cartographier les sources

**Méthode** : lister chaque canal → identifier ses outils de mesure (Google Analytics, Facebook Pixel) → documenter le **format** des données (CSV, API) → noter les **limitations** (pas d'API, données incomplètes, fréquence d'export).

Un **tableau d'inventaire** vivant (Google Sheets ou Notion) en tient la liste, avec une colonne par information : canal, données générées, format, fréquence de mise à jour, limitations, **responsable interne**. Un **schéma visuel** des flux de données permet de repérer les points de convergence et les ruptures.

**Chaque outil a sa logique**

| Outil | Ce qu'il mesure |
|---|---|
| **Google Analytics** | Cookies **first-party**, granularité très fine sur les parcours |
| **Facebook Pixel** | **Événements** qui optimisent la publicité |
| **Mailchimp** | Métriques e-mailing détaillées via son API |
| **Amazon Seller Central** | Données transactionnelles, mais **pas de données nominatives** et des exports avec **24 à 48 h de délai** |

Le défi majeur est l'**attribution cross-canal** : quel canal mérite le crédit d'une vente découverte sur Instagram, mûrie par la newsletter et conclue sur Amazon ? Voir [R7](r07-kpi-performance.md).

### 4.2 Configurer le tracking

**Procédure en 4 étapes pour chaque outil** : (1) installation via **Google Tag Manager** pour centraliser les balises ; (2) configuration des **événements clés** ; (3) **test** de déclenchement (mode Debug) ; (4) **documentation** interne.

**Google Analytics** :
- suivi **e-commerce amélioré** : vue produit, ajout au panier, début de commande, checkout ;
- **objectifs de conversion valorisés** (inscription newsletter = 5 €, demande de devis = 25 €, achat à sa valeur réelle) ;
- tableau de correspondance « **événement business ↔ événement de tracking** » ;
- audiences personnalisées, événements personnalisés ;
- **Google Signals** pour le suivi **cross-device**.

**Facebook Pixel** :
- installation sur **toutes** les pages, y compris la confirmation de commande ;
- événements standards : vue de contenu, ajout au panier, initiation de commande, achat ;
- **Conversions API (CAPI)**, côté serveur, pour limiter les pertes dues aux bloqueurs ;
- audiences de **retargeting**.

**Intégrer le CRM et l'offline** : on synchronise des **identifiants clients hashés** (e-mails) avec les plateformes publicitaires pour créer des audiences de clients existants. On met aussi en place une **suppression automatique** des données devenues inutiles, pour respecter le RGPD.

### 4.3 Évaluer la qualité des données

**Les 5 critères de qualité**

| Critère | Question |
|---|---|
| **Exactitude** | Les données reflètent-elles la réalité (ventes GA = commandes réelles) ? |
| **Complétude** | Manque-t-il des données nécessaires au calcul des KPI ? |
| **Cohérence** | Les sources concordent-elles entre elles ? |
| **Fraîcheur** | Les données sont-elles assez récentes ? |
| **Granularité** | Le niveau de détail permet-il de segmenter (produit, source, période) ? |

**Grille d'audit mensuel** : chaque source est notée de 1 à 5 sur chaque critère, avec une **action corrective sous 3/5**. Chaque seuil est relié à une action, par exemple « fraîcheur < 3 → exports automatisés par API ». Une **carte de chaleur des risques** croise les critères et les canaux.

> 💡 GA comptait **1 247** transactions contre **1 329** commandes réelles (plus de 6 % d'écart). Causes : pages de confirmation non trackées (virement), redirection PayPal mal configurée, **refus de cookies**. Après correction, l'écart passe **sous 2 %**, avec une réconciliation mensuelle.

**Audit des écarts en 3 étapes** : repérer les écarts (tableaux croisés internes / outils) → vérifier les **déclencheurs** (tags, événements, paramètres d'URL) → **documenter** la cause.

**Alertes automatiques** :
- trafic **− 30 %** sur la moyenne des 7 derniers jours ;
- conversions **+ 200 %** (doublons, bug) ;
- taux de rebond **> 85 %**.

Elles s'affichent dans un tableau de bord **vert, orange, rouge** (Looker Studio et Sheets).

### 4.4 Optimiser et maintenir

- **Taux de consentement cookies** : de 68 % à 84 % grâce à une bannière plus claire et moins intrusive. Les formulations sont testées en A/B : « personnaliser les offres selon vos préférences sportives » gagne **7 %**.
- **Enrichir les données e-mail** par des champs personnalisés (sport pratiqué, budget), puis créer des **scores d'appétence** et d'engagement.
- **Tracking mobile** et cross-device.
- Un KPI du dispositif lui-même : le **taux de données exploitables**.

**Les limites à intégrer** :
- les navigateurs bloquent les **cookies tiers** (Safari) : il faut privilégier le **first-party** ;
- **iOS 14.5** exige un consentement pour le suivi inter-applications ;
- les outils gratuits ont leurs limites (échantillonnage GA, quotas d'API).

⚠️ **Durées de conservation** : ce module cite **13 mois maximum pour les cookies analytics** et **25 mois pour les données de prospection**. Le module RGPD paramètre GA à **26 mois maximum**. Ce sont deux durées différentes ; mentionne la source si tu les cites.

**Maintenance** : surveillance **hebdomadaire**, vérification **mensuelle** des tags, audit **trimestriel** de la qualité, revue **semestrielle** des outils, révision **annuelle** de l'architecture. S'y ajoutent un **log des incidents**, la formation trimestrielle de l'équipe et des plateformes de consentement (**Didomi**, **Axeptio**).

> 🎯 **Repère examen (Q2, Q7).** L'énoncé exige des outils permettant une « collecte et une analyse détaillées des interactions » (CRM, web analytics, heatmaps) et des processus de collecte « explicités ». Cite :
> - les **sources** et ce que chacune mesure ;
> - leurs **limites** (avis Trustpilot = échantillon auto-sélectionné ; captures GA de périodes différentes) ;
> - les **5 critères de qualité**.
>
> Au foodtruck, la caisse, les tablettes, les QR codes (à tracer avec des **UTM**) et le CRM doivent converger : **réconciliation** entre ventes caisse et inscriptions app.

---

## 5. Le RGPD appliqué à la collecte marketing

> 📖 Le **RGPD** (Règlement Général sur la Protection des Données), en vigueur depuis **mai 2018**, s'applique à **toute organisation**, publique ou privée, **même hors UE**, dès lors qu'elle traite des données de **résidents européens**. Selon le support « Les données clients online », il oblige les entreprises à **localiser leurs serveurs dans l'UE**.
>
> 📖 **Donnée personnelle** (CNIL) : toute information se rapportant à une personne physique **identifiée ou identifiable**, directement (nom) ou indirectement (numéro de sécurité sociale), à partir d'une seule donnée ou d'un **croisement**.

**Principes** : **licéité, loyauté, transparence**.

**Sanctions** : jusqu'à **4 % du CA mondial annuel ou 20 millions d'euros**, le montant le plus élevé.

> 💡 Sanctions citées : **Carrefour (600 000 €)** pour défaut de transparence ; Google et Meta (millions d'euros) ; **Google Analytics** jugé contraire au RGPD par l'autorité autrichienne (**DSB, 13/01/2022**) à cause des transferts vers les États-Unis, après les **101 plaintes de l'association NOYB**.

**Risques du Big Data pour la vie privée** : collecte au-delà du nécessaire ; **profilage** menant à des décisions automatisées **discriminatoires** (emploi, crédit, assurance) ; violation de confidentialité (revente, cyberattaque).

**Privacy by Design** : intégrer la protection des données **dès la conception** de toute campagne (collecte de leads, acquisition, retargeting).

### 5.1 Les 6 bases légales

Chaque traitement doit reposer sur **l'une des six bases légales** :

| Base légale | Usage marketing typique (cas TechnoSport) |
|---|---|
| **Consentement** | **Newsletter**, prospection, cookies publicitaires |
| **Exécution d'un contrat** | Suivi de commande, relation client après achat |
| **Obligation légale** | Conservation comptable |
| **Sauvegarde des intérêts vitaux** | — |
| **Mission de service public** | — |
| **Intérêt légitime** | Optimisation du site, personnalisation, **retargeting** (selon le cours) |

**L'intérêt légitime impose un test de proportionnalité** documenté en 3 colonnes, à faire valider par le DPO ou un juriste :
1. l'**intérêt** poursuivi ;
2. la **nécessité** (pas d'alternative moins intrusive) ;
3. l'**équilibre** avec les droits des personnes.

⚠️ D'après les corrigés du module, l'historique d'achats et les préférences déclarées des clients existants peuvent relever de l'intérêt légitime. En revanche, la **géolocalisation précise** et le **tracking comportemental** exigent un **consentement explicite**.

### 5.2 Le consentement

> 📖 Le consentement RGPD doit être **libre, spécifique, éclairé et univoque**, et **révocable à tout moment**. **La charge de la preuve incombe à l'entreprise.**

| Critère | Ce qu'il impose |
|---|---|
| **Libre** | **Aucune case pré-cochée** ; ne pas conditionner l'accès au service au marketing |
| **Spécifique** | **Une case par finalité** (newsletter, offres partenaires, études) |
| **Éclairé** | Dire **qui** collecte, **pourquoi**, **comment** (canaux), **combien de temps**, **avec qui** on partage, en langage simple |
| **Univoque** | Phrases **affirmatives** (« Je souhaite recevoir… »), sans double négation |

**À mettre en place** :
- un lien « **Gérer mes préférences** » dans chaque e-mail ;
- une **trace horodatée** de chaque consentement (date, heure, version du formulaire, IP) ;
- le **double opt-in** (confirmation de l'inscription par e-mail) ;
- un rappel annuel aux abonnés.

⚠️ **Pas de design manipulateur** : un bouton « Accepter » surdimensionné face à un « Refuser » caché est une **violation**. On peut optimiser la clarté et mettre en avant les **bénéfices** (« Nous vous enverrons nos meilleures offres »), jamais forcer le choix.

### 5.3 Les droits des personnes

Ce module parle de **huit droits fondamentaux**. B1-R3 en détaille sept.

**Organisation** : une **adresse e-mail dédiée** et un **formulaire accessible** sur toutes les pages.

**Délais** : réponse sous **30 jours maximum**, par exemple pour une rectification à répercuter dans tous les systèmes.

**Les droits les plus exigeants**

- **Droit d'accès** : fournir une copie des données, les finalités, les destinataires et les durées.
- **Droit à l'effacement** (droit à l'oubli) : il s'applique si les données ne sont plus nécessaires, si le consentement est retiré ou si la personne s'oppose à l'intérêt légitime. ⚠️ Il **n'est pas absolu** : on peut refuser pour une **obligation légale** (comptabilité, garantie), la liberté d'expression ou la défense en justice, en documentant la décision.
- **Droit à la portabilité** : export **structuré, lisible par machine** (JSON, CSV), à auditer une fois par an.

### 5.4 Documentation et accountability

> 📖 Le principe d'**accountability** (responsabilité) oblige à **démontrer** la conformité par la documentation.

**Le registre des traitements** est « la pierre angulaire » de la conformité ; on peut partir du **modèle CNIL**.

- **Une fiche par traitement**, avec identifiant, date, responsable, **base légale**, **finalités**, **catégories de données**, **personnes concernées**, **destinataires**, cartographie des flux, **durées de conservation**, **mesures de sécurité**.
- **Révision trimestrielle**.

> 💡 Newsletter TechnoSport : finalité « information commerciale », données (e-mail, prénom, historique, préférences), destinataires (équipe marketing et Mailchimp), conservation **3 ans après le dernier contact**.

**L'AIPD (analyse d'impact sur la protection des données)**, prévue par l'**article 35** :

> 📖 L'**AIPD** évalue et réduit les risques d'un traitement pour les droits et libertés des personnes.

Elle est **obligatoire pour certains traitements seulement** : ceux listés par la CNIL ou ceux qui remplissent **au moins 2 des 9 critères** :

| Les 9 critères de l'AIPD |
|---|
| 1. Évaluation ou **scoring** (profilage) |
| 2. **Décision automatique** avec effet (risque de discrimination) |
| 3. **Surveillance** systématique des personnes |
| 4. Données **sensibles** |
| 5. Collecte **à grande échelle** |
| 6. **Croisement** de données issues de traitements différents |
| 7. Personnes **vulnérables** (patients, personnes âgées) |
| 8. Usage d'une **nouvelle technologie** |
| 9. Traitement qui **autorise ou refuse l'accès** à un service ou un contrat |

**Déroulé** : décrire le traitement → identifier les risques (**confidentialité**, **disponibilité**, **intégrité**) en probabilité et en gravité → **mesures de mitigation** (pseudonymisation, durée de conservation limitée, audit des algorithmes, formation) → validation par le **DPO** et décision documentée.

> 💡 Un **scoring comportemental** pour des recommandations déclenche l'AIPD. Risques identifiés : discrimination, intrusion dans la vie privée, détournement.

**Le DPO (délégué à la protection des données)** est **obligatoire** pour les **autorités et organismes publics**, pour les **traitements à grande échelle** et pour les **traitements systématiques**.

**Son rôle** : superviser la conformité, conseiller, coopérer avec l'autorité de contrôle, servir de **point de contact** aux personnes, mener les AIPD.

**Gouvernance**
- **Rôles** : responsable des traitements, référent RGPD, administrateurs de données, responsable sécurité, correspondants métiers.
- **Une matrice des accès** : qui voit quoi.
- **Un « RGPD Check » en 10 points** avant chaque campagne :

| Le RGPD Check : 10 points avant chaque campagne |
|---|
| 1. Base légale |
| 2. Mentions d'information |
| 3. Gestion du consentement |
| 4. Durée de conservation |
| 5. Sécurisation des données |
| 6. Registre mis à jour |
| 7. Droits des utilisateurs anticipés |
| 8. Conformité des sous-traitants |
| 9. Cookies |
| 10. Documentation de preuve |

### 5.5 Outils et cookies

**Configurer les outils**
- **E-mailing** : double opt-in, consentements **granulaires**, suppression automatique des inactifs, preuves horodatées, lien de désabonnement visible.
- **Google Analytics** : **anonymisation des IP**, conservation réduite (**26 mois maximum** selon ce module), pas de données démographiques superflues.
- **Formulaires** : mentions d'information, cases vierges, lien vers la politique de confidentialité.

**La hiérarchie des cookies**

| Niveau | Exemples | Consentement |
|---|---|---|
| **Exemptés** (strictement nécessaires) | Panier, authentification, sécurité, équilibrage de charge | **Non requis** |
| **Consentement simplifié** | Amélioration de l'expérience **sans tracking** | Simplifié |
| **Consentement explicite** | **Publicité ciblée**, partage avec des tiers, **profilage** | **Explicite** |

Le bandeau doit offrir trois choix clairs : **accepter tout, refuser, personnaliser**. Poursuivre la navigation ne vaut plus consentement.

Il faut aussi une **CMP** (plateforme de gestion du consentement) conforme au *Transparency & Consent Framework* de l'IAB Europe.

**En cas de refus** : un **ciblage contextuel** (contenu consulté, géolocalisation approximative, créneau horaire), et des tableaux de bord qui distinguent les données complètes des échantillons partiels.

### 5.6 Sécurité, sous-traitants, violations

**Les 3 piliers de la sécurité** : **confidentialité**, **intégrité**, **disponibilité**.

**Les mesures**
- **Chiffrement** des bases (AES-256), clés stockées à part.
- **Principe du moindre privilège** : chacun accède seulement à ce que sa fonction exige.
- **Connexions sécurisées** : HTTPS, VPN, SFTP.
- **Sauvegardes chiffrées** sur des sites séparés, testées régulièrement.
- **Sensibilisation à l'ingénierie sociale** et au phishing.

> 📖 Un **sous-traitant** traite des données **pour le compte** du responsable de traitement, **selon ses instructions**. ⚠️ Le responsable **reste garant** de la protection des données.

**Encadrer les sous-traitants**
- **Clauses RGPD** au contrat : objet, durée, nature, finalités, catégories de données.
- **Audit** : localisation des données dans l'UE, ISO 27001, chiffrement, gestion des incidents.
- Un **droit d'audit**, un **référent RGPD** chez chaque sous-traitant, un plan de continuité.

**Les violations de données**
- **Grille de gravité** : nombre de personnes, sensibilité des données, probabilité de préjudice, impact sur la réputation.
- **Alertes automatiques** en cas d'accès anormaux.
- **Notification à la CNIL dans les 72 heures**, sauf absence de risque pour les personnes. Elle précise la nature de la violation, les catégories et le nombre de personnes, les conséquences, les mesures prises.
- **Information des personnes concernées** par des modèles prêts à l'emploi, plus un exercice de crise annuel.

**Durées de conservation citées** :
- **3 ans après le dernier contact** pour la newsletter (cas TechnoSport) ;
- **13 mois** pour les cookies analytics et **25 mois** pour la prospection (module collecte) ;
- **26 mois** pour Google Analytics (module RGPD).

> 🎯 **Repère examen (Q3).** Le critère est : « les processus de collecte et d'analyse des données respectent les exigences du RGPD ». Structure ta réponse **point de contact par point de contact** de ta cartographie :
>
> | Point de contact | Base légale | Information et consentement | Durée de conservation |
> |---|---|---|---|
> | Site et app | Consentement cookies (bandeau 3 choix, CMP) | Bandeau | — |
> | Inscription via QR code | Consentement **spécifique**, case non cochée | **Double opt-in** | — |
> | Newsletter, SMS de relance | **Consentement** | Lien « gérer mes préférences » | — |
> | Commande | **Contrat** | — | — |
> | Avis et tablettes | — | Information | — |
> | Heatmaps et GA | — | IP anonymisée, consentement | Conservation limitée |
> | Transporteur (Chronofresh) | — | **Sous-traitant** : clauses au contrat | — |
>
> Ajoute :
> - les **droits** des personnes (adresse e-mail dédiée, réponse sous 30 jours) ;
> - le **registre** ;
> - l'**AIPD** si tu proposes du scoring ou de la segmentation comportementale, qui croise des données à grande échelle ;
> - la **sécurité** (moindre privilège, chiffrement) ;
> - la **notification sous 72 h**.
>
> Pour **Q7** : les **données de la caisse** sont du first party, et les données de satisfaction recueillies sur tablette peuvent être **anonymisées**.

---

## L'essentiel en 10 points

1. Une **donnée** brute devient une **information** une fois traitée. Les données sont **structurées** ou **non structurées**, et définies par **6 V** : volume, vélocité, variété, véracité, volatilité, valeur.
2. On les classe selon la **source** (offline : caisse, POS, fidélité ; online), l'**origine** (**first party** fiables, **second party** partenaires, **third party** achetées, dont l'acheteur reste **responsable**) et le **niveau de traitement** (primaires, secondaires, tertiaires).
3. Le **Big Data** répond au volume, à la variété et à la vélocité, le **Smart Data** à la valeur et à la véracité. Le **Fast Data** est le temps réel (Waze). Open Data ≠ Big Data ; Data Science = méthodes d'analyse.
4. Stratégie data **défensive** (sécurité) ou **offensive** (compétitivité). La matrice d'appétence donne : Big Observation, Problem, Risk, Opportunity. **Data driven** = gouvernance, formation, infrastructure, compréhension client.
5. Outils : **Big Quali** (NLP), **marketing participatif**, **dataviz** (Dataflow en 4 étapes), stream processing, **data cleaning** (6 bonnes pratiques). Stockage : **Data Lake** (brut) ≠ **Data Warehouse** (structuré) ; stockage distribué.
6. Collecte multicanale : **cartographier** les sources (format, limites, responsable), configurer le tracking en 4 étapes (**Tag Manager** → événements → test → documentation), intégrer le CRM par **identifiants hashés**.
7. **5 critères de qualité** : exactitude, complétude, cohérence, fraîcheur, granularité. Audit noté de 1 à 5, alertes automatiques, réconciliation des sources.
8. RGPD : **6 bases légales** (consentement, contrat, obligation légale, intérêts vitaux, service public, intérêt légitime avec **test de proportionnalité**). Consentement **libre, spécifique, éclairé, univoque**, révocable et **prouvé**.
9. **Accountability** : registre des traitements, **AIPD** (au moins 2 des 9 critères, art. 35), **DPO** (public, grande échelle, systématique). Cookies **exemptés / simplifiés / explicites** ; bandeau « accepter, refuser, personnaliser ».
10. Sécurité : **confidentialité, intégrité, disponibilité**, moindre privilège, chiffrement. Le responsable reste **garant** de ses sous-traitants. Violation : **notification CNIL sous 72 h**. Sanction maximale : **4 % du CA mondial ou 20 M€**.

---

## Sources (PDF d'origine)

Dossier `par thèmes:/Analyser et cartographier les parcours client/` :

- `donnees-clients-online_web.pdf` — Les données clients online

Dossier `par thèmes:/Data-Marketing et tableau de bord/` :

- `collecte-donnee-marketi-multic.pdf` — Collecter des données marketing multicanales
- `module_respec-rgpd-colle-donne_market.pdf` — Respecter le RGPD dans la collecte de données marketing

---
id: b3-3
type: question
bloc: 3
dossier: 1
titre: "Q3 — Montrer que la cartographie respecte le RGPD"
competence: C3.1
resumes: [b3-r03]
resumes_appui: [b3-r02]
---

# Q3 — Montrer que la cartographie respecte le RGPD

La question est **directement liée à Q1** : il ne s'agit pas de réciter le RGPD, mais d'expliquer **en quoi ta cartographie** respecte la législation sur la **collecte**, le **traitement** et la **diffusion** des données. Le critère : « les processus de collecte et d'analyse des données respectent les exigences de la RGPD ».

**La méthode qui marque des points** ([R3 §5](../resume/r03-donnees-outils-rgpd.md)) : reprendre les **points de contact de ta carte, un par un**, et dire pour chacun quelle donnée est collectée, sur quelle **base légale**, avec quelle **information ou quel consentement**, pour quelle **durée**.

| Point de contact | Donnée | Base légale | Mise en conformité |
|---|---|---|---|
| Site et app (GA, heatmaps) | Navigation, cookies | **Consentement** (sauf cookies strictement nécessaires) | Bandeau à **3 choix** (accepter, refuser, personnaliser) via une **CMP** ; IP anonymisée ; conservation limitée |
| Inscription (site, app, **QR code du foodtruck**) | E-mail, prénom, préférences | **Consentement** pour le marketing | Cases **non pré-cochées**, **une case par finalité**, **double opt-in**, preuve **horodatée** |
| Commande et livraison | Identité, adresse, paiement | **Exécution du contrat** | Minimisation ; transporteur = **sous-traitant** encadré par contrat (clauses RGPD, droit d'audit) |
| Newsletter, e-mails et SMS de relance | Coordonnées, historique | **Consentement** | Lien « **gérer mes préférences** » et désinscription dans chaque envoi |
| CRM et segmentation | Historique d'achat | **Intérêt légitime** (clients existants) avec test de proportionnalité | Registre ; AIPD si **scoring** ou croisement à grande échelle |
| Avis Trustpilot, tablettes du foodtruck | Opinions, verbatims | Information des personnes ; **anonymisation** des réponses | Pas de donnée identifiante inutile |
| Caisse du foodtruck | Ventes, panier, temps d'attente | **Pas de donnée personnelle** nécessaire | Données agrégées |

Puis les **obligations transversales** : **registre des traitements** (une fiche par traitement), **droits des personnes** (accès, rectification, effacement, opposition, portabilité ; adresse dédiée, réponse sous **30 jours**), **sécurité** (moindre privilège, chiffrement, sauvegardes), **violation de données** notifiée à la CNIL sous **72 h**, **DPO** ou référent RGPD, **RGPD Check en 10 points** avant chaque campagne. Ajoute le principe de **Privacy by Design** : la protection est pensée dès la conception du parcours.

**Pièges**

- **Réciter le cours** sans le rattacher aux points de contact de PrepMyMeal.
- Dire que tout repose sur le consentement : la **commande** relève du **contrat**, la conservation comptable d'une **obligation légale**.
- Oublier le **foodtruck** (QR codes, tablettes, caisse) alors qu'il fait partie du parcours.
- Oublier la **diffusion** : partage avec le transporteur, Trustpilot, outils (Mailchimp, GA) = **destinataires** à inscrire au registre ; transfert hors UE à vérifier (le cas Google Analytics en Autriche).

⚠️ Durées : le cours cite **13 mois** pour les cookies analytics et **25 mois** pour la prospection (module collecte), **26 mois** pour GA (module RGPD), **3 ans après le dernier contact** pour une newsletter. Cite la source de la durée que tu retiens.

Pour approfondir : [R3 — Données, outils et RGPD](../resume/r03-donnees-outils-rgpd.md) (bases légales, consentement, droits, registre, AIPD, cookies, sous-traitants) et [R2](../resume/r02-parcours-client.md) pour les points de contact.

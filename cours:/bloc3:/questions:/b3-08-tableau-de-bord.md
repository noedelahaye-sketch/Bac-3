---
id: b3-8
type: question
bloc: 3
dossier: 3
titre: "Q8 — Construire le tableau de bord opérationnel du foodtruck"
competence: C3.3
resumes: [b3-r08]
resumes_appui: [b3-r07, b3-r09]
---

# Q8 — Construire le tableau de bord opérationnel du foodtruck

La question demande de **construire** (pas de décrire) un tableau de bord **opérationnel** à partir des résultats de l'annexe 7, intégrant les KPI de Q7, avec des **visualisations simples et intuitives** (graphiques, jauges, courbes). Un seul critère : les visualisations sont **intuitives**, permettent de **suivre facilement** les KPI et **aident à la décision**. La copie se rend en **Excel ou Word** : construis-le dans le tableur.

**1. La structure** ([R8 §2-3](../resume/r08-tableau-de-bord.md))

- **En haut à gauche**, 4-5 **KPI « héros »** avec **jauge** vs objectif : CA total, conversion moyenne, satisfaction moyenne, temps d'attente moyen, inscriptions par ville.
- **Au centre**, le **tableau ville × KPI** avec **mise en forme conditionnelle** (vert = objectif atteint, orange = proche, rouge = sous l'objectif). Chaque ligne d'indicateur indique : **formule, cible, réalisé, écart, commentaire, action** ([R8 §1.3](../resume/r08-tableau-de-bord.md)).
- **Barres horizontales** du CA par ville, avec la **bande d'objectif** 12 000-15 000 €.
- **Courbe** semaine 1 → semaine 8 (la tournée est chronologique, de Paris à Nantes) pour le temps d'attente et la satisfaction.
- **Nuage de points** coût opérationnel / marge nette par ville.
- Une zone **« À retenir »** : 3 constats et 1 recommandation chiffrée.

**2. Les chiffres à poser** (annexes 7 et 8 ; moyennes simples sur 8 villes)

| KPI | Objectif | Réalisé | Écart |
|---|---|---|---|
| CA total | > 100 000 € | **108 000 €** | +8 % |
| CA moyen par ville | 12 000-15 000 € | 13 500 € | dans la fourchette |
| Clients / visiteurs par ville | 1 200 | 1 219 | +1,6 % |
| Taux de conversion | ≥ 35 % | 29,9 % | −5,1 points |
| Inscriptions par ville | ≥ 700 | 791 (6 330 au total) | +13 % |
| Taux de réachat | ≥ 25 % | 25,0 % | atteint de justesse |
| Temps d'attente | ≤ 6 min | 7,3 min | +1,3 min (défavorable) |
| Satisfaction | ≥ 4,3 / 5 | 4,16 | −0,14 |
| Mentions digitales par ville | ≥ 500 | 481 (3 850 au total) | −3,8 % |
| Engagement digital | > 40 % | **non mesurable** | — |

**Tableau ville × objectifs atteints** (fréquentation, conversion, CA ≥ 12 000 €, inscriptions, réachat, attente, satisfaction, mentions) : **Paris 7/8**, **Marseille 6/8**, Bordeaux 5/8, Lyon 4/8, Toulouse 4/8, Strasbourg 2/8, Nantes 1/8, **Lille 0/8**. Seul objectif atteint partout ou presque : les **inscriptions** ; seul objectif manqué presque partout : le **temps d'attente** (seule Strasbourg à 5 min).

**3. Signaler les anomalies dans le tableau** (une note sous le tableau suffit, mais elle montre ton sens critique)

- **Lyon** : 200 clients à 7 % de conversion, mais 18 000 € de CA et 800 inscriptions : données **incohérentes** (à vérifier en caisse) ; à isoler des moyennes ou à signaler. Sans Lyon, le CA moyen tombe à 12 857 € et la conversion moyenne monte à 33,1 %.
- La colonne « **taux d'engagement digital (% visiteurs actifs)** » reprend **les inscriptions en valeur absolue** : l'objectif de 40 % ne peut pas être évalué.
- La **marge nette** dépasse **CA − coût opérationnel** dans toutes les villes (Paris : 21 000 € de marge pour 25 000 − 11 000 = 14 000 €) : précise ton hypothèse de lecture (marge incluant les ventes en ligne générées ?).
- « **Nombre de clients** » se lit comme la **fréquentation** pour être comparé aux 1 200 **visiteurs** du brief : dis-le.

**4. Préciser l'usage** : outil (**Excel** pour la copie, **Looker Studio** gratuit relié au CRM, à la caisse et à GA en production) ; **fréquence** (suivi quotidien pendant chaque étape, bilan à la fin de chaque ville, synthèse à la fin de la tournée) ; **destinataires** (équipe du foodtruck : vue opérationnelle ; CEO : 5 KPI et « À retenir ») ; **seuils d'alerte** (attente > 6 min, satisfaction < 4,3).

**Pièges** : un tableau de **chiffres bruts** sans objectif ni écart ; des **camemberts** à 8 parts (au-delà de 5, illisibles) ou des graphiques **3D** ; trop de couleurs (réserve le rouge et le vert aux statuts) ; oublier la **légende** et les **unités**. Écris les chiffres avec une espace pour les milliers (consigne de l'énoncé : 1 000).

Pour approfondir : [R8 — Tableau de bord](../resume/r08-tableau-de-bord.md) (structure, hiérarchie visuelle, choix des graphiques, alertes, outils), [R7](../resume/r07-kpi-performance.md) (KPI et formules) et [R9](../resume/r09-ecarts-recommandations.md) (calcul des écarts).

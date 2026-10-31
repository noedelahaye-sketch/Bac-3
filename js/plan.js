/* Plan d'action des dernières semaines : données + moteur de report.
   Une semaine = un bloc. Le moteur ne stocke rien : il lit les questions
   terminées (fournies par l'appli) et recalcule les dates à chaque affichage. */
var PLAN = (function(){
  var DEPOT = "2026-12-08";          /* dernier jour de secours */
  var CAP_WEEKEND = 2;                /* samedi sans programme (le dimanche reste un repos) */
  var CAP_LIBRE = 3;                  /* jour sans programme en semaine (S5) */
  var CAP_SECOURS = 3;                /* 7 et 8 décembre */
  var OFF = "off";                    /* jour barré : jamais utilisé, même en retard */

  /* [lundi … samedi] ; une liste de numéros de question, [] = rien de prévu, OFF = barré.
     Les questions à cheval sur deux jours dans le cahier (B4 Q5, B3 Q3 et Q5)
     sont posées sur le mardi. */
  var SEMAINES = [
    { id:"s1", n:1, debut:"2026-11-02", bloc:"b1", titre:"Bloc 1 · Bellewaerde",
      jours:[["Q1","Q2"],["Q3","Q4"],OFF,["Q5","Q6"],["Q7","Q8"],["Q9","Q10"]] },
    { id:"s2", n:2, debut:"2026-11-09", bloc:"b2", titre:"Bloc 2 · Bambu Lab",
      jours:[["Q1","Q2"],["Q3","Q4","Q5"],["Q6","Q7","Q8"],["Q9","Q10"],["Q11","Q12","Q13"],[]] },
    { id:"s3", n:3, debut:"2026-11-16", bloc:"b4", titre:"Bloc 4 · Drumeo × Your Story Agency",
      jours:[["Q1","Q2"],["Q3","Q4","Q5"],["Q6","Q7"],["Q8","Q9"],["Q10","Q11"],[]] },
    { id:"s4", n:4, debut:"2026-11-23", bloc:"b3", titre:"Bloc 3 · PrepMyMeal",
      jours:[["Q1","Q2"],["Q3","Q4","Q5"],["Q6"],["Q7","Q8"],["Q9"],[]] },
    { id:"s5", n:5, debut:"2026-11-30", bloc:"b1", titre:"Vidéo du Bloc 1 + marge",
      jours:[["Vidéo"],[],[],[],[],[]], tampon:true }
  ];
  var SECOURS = ["2026-12-07","2026-12-08"];

  function p2(n){ return (n<10?"0":"")+n; }
  function ymd(d){ return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate()); }
  function parse(s){ var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return new Date(+m[1],+m[2]-1,+m[3]); }
  function addDays(s,n){ var d=parse(s); d.setDate(d.getDate()+n); return ymd(d); }
  function diffDays(a,b){ return Math.round((parse(b)-parse(a))/86400000); }

  /* Tous les jours du 2 nov au 8 déc, dans l'ordre. */
  function calendrier(){
    var jours=[], plan={};
    SEMAINES.forEach(function(w){
      w.jours.forEach(function(l,i){
        plan[addDays(w.debut,i)] = { semaine:w, liste:l };
      });
    });
    var debut=SEMAINES[0].debut, fin=DEPOT, n=diffDays(debut,fin);
    for(var i=0;i<=n;i++){
      var date=addDays(debut,i), dow=parse(date).getDay(); /* 0 = dimanche */
      var p=plan[date], j={ date:date, dow:dow, cap:0, type:"libre", prevus:[], semaine:null };
      if(SECOURS.indexOf(date)>=0){ j.type="secours"; j.cap=CAP_SECOURS; }
      else if(p){
        j.semaine=p.semaine;
        if(p.liste===OFF){ j.type="off"; j.cap=0; }
        else if(p.liste.length){ j.type="plan"; j.cap=p.liste.length; j.prevus=p.liste; }
        else { j.type="libre"; j.cap=(dow===0||dow===6)?CAP_WEEKEND:CAP_LIBRE; }
      } else { /* dimanches, et les jours d'une semaine sans programme */
        j.cap=(dow===0||dow===6)?CAP_WEEKEND:CAP_LIBRE;
        var w=SEMAINES.filter(function(x){ return diffDays(x.debut,date)>=0 && diffDays(x.debut,date)<7; })[0];
        j.semaine=w||null;
      }
      /* le dimanche est un repos : jamais de travail, même en retard */
      if(dow===0 && j.type!=="secours"){ j.type="repos"; j.cap=0; j.prevus=[]; }
      jours.push(j);
    }
    return jours;
  }

  /* estFait(id) → booléen ; aujourdhui = "YYYY-MM-DD".
     Retourne les jours avec leurs questions placées, et les compteurs. */
  function calculer(estFait, aujourdhui){
    var jours=calendrier();
    var ordre=[]; /* [{id, bloc, n, orig(index de jour)}] dans l'ordre du cahier */
    jours.forEach(function(j,idx){
      j.prevus.forEach(function(n){
        var bloc=j.semaine.bloc;
        ordre.push({ id:bloc+"-"+n, bloc:bloc, n:n, orig:idx, origDate:j.date });
      });
    });
    var utilisables=[]; /* index des jours qui peuvent recevoir du travail */
    jours.forEach(function(j,idx){ if(j.cap>0) utilisables.push(idx); });
    var iAuj=-1;
    for(var k=0;k<utilisables.length;k++){ if(jours[utilisables[k]].date>=aujourdhui){ iAuj=k; break; } }
    if(iAuj<0) iAuj=utilisables.length; /* le plan est passé */
    var posOrig={}; utilisables.forEach(function(idx,k){ posOrig[idx]=k; });

    var items=[], horsPlan=[];
    var cur=0, used=0;
    ordre.forEach(function(it){
      it.fait=!!estFait(it.id);
      if(it.fait){ it.date=it.origDate; it.deplace=false; it.jours=0; items.push(it); return; }
      var s=Math.max(posOrig[it.orig], cur, iAuj);
      if(s!==cur) used=0;
      while(s<utilisables.length && used>=jours[utilisables[s]].cap){ s++; used=0; }
      cur=s; used++;
      if(s>=utilisables.length){ it.date=null; it.deplace=true; it.jours=null; horsPlan.push(it); }
      else {
        it.date=jours[utilisables[s]].date;
        it.deplace=it.date!==it.origDate;
        it.jours=diffDays(it.origDate,it.date);
      }
      items.push(it);
    });

    jours.forEach(function(j){ j.items=[]; });
    var parDate={}; jours.forEach(function(j){ parDate[j.date]=j; });
    items.forEach(function(it){ if(it.date) parDate[it.date].items.push(it); });
    /* un jour garde l'ordre du cahier */
    var rang={}; ordre.forEach(function(o,i){ rang[o.id]=i; });
    jours.forEach(function(j){ j.items.sort(function(a,b){ return rang[a.id]-rang[b.id]; }); });

    var total=items.length, faits=items.filter(function(i){return i.fait;}).length;
    var enRetard=items.filter(function(i){ return !i.fait && i.origDate<aujourdhui; }).length;
    var enAvance=items.filter(function(i){ return i.fait && i.origDate>aujourdhui; }).length;
    var aFaire=items.filter(function(i){ return !i.fait; });
    var fin=null;
    aFaire.forEach(function(i){ if(i.date && (!fin || i.date>fin)) fin=i.date; });
    return { jours:jours, items:items, total:total, faits:faits, enRetard:enRetard, enAvance:enAvance,
             horsPlan:horsPlan, fin:fin, parDate:parDate, semaines:SEMAINES };
  }

  return { SEMAINES:SEMAINES, DEPOT:DEPOT, calculer:calculer, ymd:ymd, parse:parse, addDays:addDays, diffDays:diffDays };
})();
if(typeof module!=="undefined") module.exports=PLAN;

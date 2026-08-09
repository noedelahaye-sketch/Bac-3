(function(){
  var START = new Date(2026,6,30);
  var DEFAULT_DEADLINE = "2026-12-01";
  var KEY = "studi-suivi-v1";

  var ALL = [];
  BLOCS.forEach(function(b){ b.qs.forEach(function(q){ q.id = b.id+"-"+q.n; q.bloc = b; ALL.push(q); }); });

  var S = { status:{}, checks:{}, notes:{}, fiche:{}, journal:[], box:{}, due:{}, fail:{}, cardState:{}, cardEdits:{}, quiz:[], quizSeen:{}, cardRuns:[], coursLu:{}, statusAt:{}, coursLuAt:{}, coursLuSection:{}, coursNotes:{},
            newToday:{d:0,n:0}, doneToday:{d:0,n:0}, streak:{current:0,max:0,lastDate:0}, cartes:{},
            deadline:DEFAULT_DEADLINE, open:{b1:true}, view:"accueil", _ts:0 };
  var SES=null, QZ=null, saveTimer=null;
  var main = document.getElementById("main");
  var nav  = document.getElementById("nav");
  var appEl = document.querySelector(".app");
  var searchOpen = false;
  var pendingJumpTerm = null;
  var scrollMemory = {};
  if("scrollRestoration" in history) history.scrollRestoration = "manual";

  var MEM = {};
  var Store = {
    get: async function(k){
      try { var v=localStorage.getItem(k); if(v!=null) return {key:k, value:v}; } catch(e){}
      return MEM[k] ? {key:k, value:MEM[k]} : null;
    },
    set: async function(k,v){
      try { localStorage.setItem(k,v); return {key:k,value:v}; } catch(e){}
      MEM[k]=v; return {key:k,value:v};
    }
  };

  /* ---------- Synchronisation (Gist GitHub privé) ---------- */
  var SYNC_TOKEN_KEY="studi-sync-token", SYNC_GIST_KEY="studi-sync-gist-id", GIST_FILENAME="studi-suivi-sync.json";
  var syncStatus={state:"off", at:null};
  function getSyncToken(){ try{ return localStorage.getItem(SYNC_TOKEN_KEY)||""; }catch(e){ return ""; } }
  function getSyncGistId(){ try{ return localStorage.getItem(SYNC_GIST_KEY)||""; }catch(e){ return ""; } }
  function setSyncToken(t){ try{ localStorage.setItem(SYNC_TOKEN_KEY,t); }catch(e){} }
  function setSyncGistId(id){ try{ localStorage.setItem(SYNC_GIST_KEY,id); }catch(e){} }
  function clearSync(){ try{ localStorage.removeItem(SYNC_TOKEN_KEY); localStorage.removeItem(SYNC_GIST_KEY); }catch(e){} syncStatus={state:"off",at:null}; }
  async function ghFetch(url, opts){
    opts = opts || {};
    var headers = Object.assign({"Authorization":"token "+getSyncToken(), "Accept":"application/vnd.github+json"}, opts.headers||{});
    var res = await fetch(url, Object.assign({}, opts, {headers:headers}));
    if(!res.ok){ var e=new Error("gh "+res.status); e.status=res.status; throw e; }
    if(res.status===204) return null;
    return res.json();
  }
  async function findOrCreateGist(){
    var existing=getSyncGistId();
    if(existing) return existing;
    var list=await ghFetch("https://api.github.com/gists?per_page=100");
    var found=(list||[]).filter(function(g){ return g.files && g.files[GIST_FILENAME]; })[0];
    if(found){ setSyncGistId(found.id); return found.id; }
    var body={description:"Suivi Studi — synchronisation", public:false, files:{}};
    body.files[GIST_FILENAME]={content: JSON.stringify({_ts:0})};
    var created=await ghFetch("https://api.github.com/gists", {method:"POST", body:JSON.stringify(body)});
    setSyncGistId(created.id);
    return created.id;
  }
  async function pullFromGist(){
    var id=await findOrCreateGist();
    var gist=await ghFetch("https://api.github.com/gists/"+id);
    var file=gist.files && gist.files[GIST_FILENAME];
    if(!file) return null;
    var raw=file.content;
    if(file.truncated){ var r=await fetch(file.raw_url); raw=await r.text(); }
    return JSON.parse(raw);
  }
  async function pushToGist(state){
    var id=await findOrCreateGist();
    var body={files:{}};
    body.files[GIST_FILENAME]={content: JSON.stringify(state)};
    await ghFetch("https://api.github.com/gists/"+id, {method:"PATCH", body:JSON.stringify(body)});
  }
  async function reconcileSync(){
    var remote=await pullFromGist();
    var remoteEmpty=isStateEmpty(remote), localEmpty=isStateEmpty(S);
    if(!remoteEmpty && (localEmpty || (remote._ts||0) > (S._ts||0))){
      applyState(remote);
      try{ Store.set(KEY, JSON.stringify(S)); }catch(e){}
      return "pulled";
    }
    if(!localEmpty && (remoteEmpty || (S._ts||0) > (remote?remote._ts||0:0))){
      await pushToGist(S);
      return "pushed";
    }
    return "none";
  }
  function renderSyncStatus(){
    var el=document.getElementById("syncStatusText");
    if(!el) return;
    var t=syncStatus.at ? syncStatus.at.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) : "";
    if(syncStatus.state==="syncing") el.textContent="Synchronisation…";
    else if(syncStatus.state==="ok") el.textContent="Synchronisé à "+t;
    else if(syncStatus.state==="error") el.textContent="Échec de synchronisation"+(t?" (dernière réussite "+t+")":"") ;
    else el.textContent="Non activée";
  }
  var syncPushTimer=null;
  var syncPret=false;
  function scheduleSyncPush(){
    if(!getSyncToken()) return;
    if(!syncPret) return; /* la lecture du distant n'a pas encore eu lieu */
    if(isStateEmpty(S)) return;
    clearTimeout(syncPushTimer);
    syncPushTimer=setTimeout(function(){
      syncStatus={state:"syncing", at:syncStatus.at};
      renderSyncStatus();
      pushToGist(S).then(function(){
        syncStatus={state:"ok", at:new Date()};
        renderSyncStatus();
      }).catch(function(){
        syncStatus={state:"error", at:syncStatus.at};
        renderSyncStatus();
      });
    }, 1500);
  }
  function resumeSauvegarde(sv){
    function n(o){ return o?Object.keys(o).length:0; }
    var cartesVues=n(sv.box);
    var series=(sv.cardRuns||[]).length;
    var derniere=series?(sv.cardRuns[sv.cardRuns.length-1]):null;
    var l=[];
    l.push(n(sv.status)+" question(s) avec un statut");
    l.push(n(sv.checks)+" question(s) avec des critères cochés");
    l.push(cartesVues+" carte(s) vue(s)");
    l.push(series+" série(s) de cartes"+(derniere?" — dernière : "+derniere.d+", "+derniere.ok+"/"+derniere.n:""));
    l.push((sv.quiz||[]).length+" quiz passé(s)");
    l.push(n(sv.coursLu)+" résumé(s) marqué(s)");
    l.push(Object.keys(sv.coursNotes||{}).reduce(function(t,r){ return t+Object.keys(sv.coursNotes[r]).length; },0)+" note(s) en marge du cours");
    l.push(n(sv.cartes)+" carte(s) mentale(s)");
    if(sv._ts) l.push("enregistrée le "+new Date(sv._ts).toLocaleString("fr-FR"));
    return l.join("\n");
  }
  function isStateEmpty(sv){
    if(!sv) return true;
    return !(sv.status && Object.keys(sv.status).length)
        && !(sv.checks && Object.keys(sv.checks).length)
        && !(sv.notes && Object.keys(sv.notes).length)
        && !(sv.fiche && Object.keys(sv.fiche).length)
        && !(sv.journal && sv.journal.length)
        && !(sv.box && Object.keys(sv.box).length)
        && !(sv.cardEdits && Object.keys(sv.cardEdits).length)
        && !(sv.quizSeen && Object.keys(sv.quizSeen).length)
        && !(sv.cardRuns && sv.cardRuns.length)
        && !(sv.coursLu && Object.keys(sv.coursLu).length)
        && !(sv.coursNotes && Object.keys(sv.coursNotes).length)
        && !(sv.cartes && Object.keys(sv.cartes).length)
        && !(sv.quiz && sv.quiz.length);
  }
  function applyState(sv){
    S.status=sv.status||{}; S.checks=sv.checks||{}; S.notes=sv.notes||{}; S.fiche=sv.fiche||{};
    S.journal=sv.journal||[]; S.box=sv.box||{}; S.due=sv.due||{}; S.fail=sv.fail||{}; S.cardState=sv.cardState||{}; S.cardEdits=sv.cardEdits||{}; S.quiz=sv.quiz||[]; S.quizSeen=sv.quizSeen||{}; S.cardRuns=sv.cardRuns||[]; S.coursLu=sv.coursLu||{}; S.statusAt=sv.statusAt||{}; S.coursLuAt=sv.coursLuAt||{}; S.coursLuSection=sv.coursLuSection||{}; S.coursNotes=sv.coursNotes||{}; S.reprendre=sv.reprendre||null;
    S.newToday=sv.newToday||{d:0,n:0};
    S.doneToday=sv.doneToday||{d:0,n:0};
    S.cartes=sv.cartes||{};
    S.streak=sv.streak||{current:0,max:0,lastDate:0};
    S.deadline=sv.deadline||DEFAULT_DEADLINE; S.open=sv.open||{b1:true}; S._ts=sv._ts||0;
  }
  /* save() = vraie modification de données : avance _ts et déclenche la synchro.
     save({silent:true}) = simple navigation : enregistre en local sans toucher à
     _ts ni pousser, pour qu'un appareil resté ouvert sur des données périmées ne
     se déclare pas « le plus récent » et n'écrase pas le travail fait ailleurs. */
  var pushEnAttente=false;
  function save(opts){
    var silent=!!(opts&&opts.silent);
    if(!silent){ S._ts=Date.now(); pushEnAttente=true; }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){
      try{ Store.set(KEY, JSON.stringify(S)); }catch(e){}
      if(pushEnAttente){ pushEnAttente=false; scheduleSyncPush(); }
    }, 400);
  }
  function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function resolveRessourceItem(it){
    if(it.contenu) return it;
    var found=null;
    Object.keys(RESSOURCES).some(function(qid){
      var r=RESSOURCES[qid];
      var hit=(r.notions||[]).concat(r.modeles||[]).filter(function(x){return x.id===it.ref && x.contenu;})[0];
      if(hit){ found={nom:hit.nom, contenu:hit.contenu, qid:qid}; return true; }
      return false;
    });
    return found;
  }
  function renderRessource(qid){
    var res = (typeof RESSOURCES!=="undefined") ? RESSOURCES[qid] : null;
    if(!res) return "";
    var total=(res.notions?res.notions.length:0)+(res.modeles?res.modeles.length:0);
    var h='<details class="ressource"><summary>Ressource de cours<span class="count">'+total+' notion'+(total>1?'s':'')+'</span></summary>';
    h+='<div class="rc-intro">'+res.intro+'</div>';
    if(res.notions && res.notions.length){
      h+='<div class="rc-lab">Notions</div>';
      res.notions.forEach(function(n){
        var it=resolveRessourceItem(n); if(!it) return;
        h+='<details class="rc-item"><summary>'+it.nom+(it.qid?' <em>déjà vu en '+it.qid.replace('-',' ').toUpperCase()+'</em>':'')+'</summary><div>'+it.contenu+'</div></details>';
      });
    }
    if(res.modeles && res.modeles.length){
      h+='<div class="rc-lab">Modèles</div>';
      res.modeles.forEach(function(m){
        var it=resolveRessourceItem(m); if(!it) return;
        h+='<details class="rc-item"><summary>'+it.nom+(it.qid?' <em>déjà vu en '+it.qid.replace('-',' ').toUpperCase()+'</em>':'')+'</summary><div>'+it.contenu+'</div></details>';
      });
    }
    h+='<div class="rc-lab">Application au cas</div><div class="rc-app">'+res.application+'</div>';
    if(res.sources && res.sources.length){
      h+='<div class="rc-lab">Sources</div><ul class="rc-src">';
      res.sources.forEach(function(s){ h+='<li>'+s+'</li>'; });
      h+='</ul>';
    }
    h+='</details>';
    return h;
  }
  function renderQuestionCoursTile(qid){
    var qc=(typeof QUESTIONS_COURS!=="undefined")?QUESTIONS_COURS[qid]:null;
    if(!qc) return "";
    return '<button class="tile" data-go-question-cours="'+qid+'">'+
      '<span class="tile-code code">Cours</span>'+
      '<span class="tile-title">Contenu de cours pour cette question</span>'+
      '<span class="tile-cas">Notions, définitions et modèles nécessaires pour répondre.</span>'+
      '</button>';
  }
  function renderCoursSlot(qid){
    var t = renderQuestionCoursTile(qid) || renderRessource(qid);
    if(t) return t;
    return '<div class="tile tile-empty">'+
      '<span class="tile-code code">Cours</span>'+
      '<span class="tile-title">À venir</span>'+
      '<span class="tile-cas">Pas encore de contenu de cours pour cette question.</span>'+
      '</div>';
  }
  function weeksLeft(){ return Math.max(0,(new Date(S.deadline+"T00:00:00") - new Date())/(1000*60*60*24*7)); }
  function expectedDone(){
    var d=new Date(S.deadline+"T00:00:00");
    var total=(d-START)/86400000, gone=(new Date()-START)/86400000;
    if(total<=0) return ALL.length;
    return Math.round(ALL.length*Math.min(1,Math.max(0,gone/total)));
  }
  function isDone(id){ var s=S.status[id]; return s==="draft"||s==="done"; }
  function doneCount(){ return ALL.filter(function(q){return isDone(q.id);}).length; }

  var INTERV=[0,1,3,7,16,35,70,140,280,560];
  var NEW_CAP=15;
  var TOTAL_CAP=30;
  var NEW_RESERVE=10;
  function today(){ var d=new Date(); return new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime(); }
  function newBudget(){
    var t=today();
    if(!S.newToday || S.newToday.d!==t) S.newToday={d:t,n:0};
    return Math.max(0, NEW_CAP-S.newToday.n);
  }
  function consumeNewBudget(n){
    if(!n) return;
    newBudget(); S.newToday.n+=n;
    save();
  }
  /* Le quota du jour est un compteur qui se vide, pas un calcul refait sur le
     vivier : sans lui, 60 révisions en retard affichent « 30 » indéfiniment,
     quel que soit le travail déjà fourni. Toute carte notée le décrémente,
     d'où qu'elle vienne — série du jour, bonus ou série libre par bloc. */
  function dayDone(){
    var t=today();
    if(!S.doneToday || S.doneToday.d!==t) S.doneToday={d:t,n:0};
    return S.doneToday.n;
  }
  function dayBudget(){ return Math.max(0, TOTAL_CAP-dayDone()); }
  function consumeDay(n){
    if(!n) return;
    dayDone(); S.doneToday.n+=n;
    save();
  }
  function markStreakDay(){
    var t=today(), oneDay=86400000;
    if(S.streak.lastDate===t) return;
    S.streak.current=(S.streak.lastDate===t-oneDay)?S.streak.current+1:1;
    S.streak.lastDate=t;
    S.streak.max=Math.max(S.streak.max||0,S.streak.current);
    save();
  }
  function streakDisplay(){
    var oneDay=86400000, t=today();
    if(!S.streak || !S.streak.lastDate) return 0;
    if(S.streak.lastDate===t || S.streak.lastDate===t-oneDay) return S.streak.current;
    return 0;
  }
  function activeCards(list){ return (list||FLASHCARDS).filter(function(c){ return !S.cardState[c.id]; }); }
  /* Une carte peut être réécrite depuis le site. La réécriture vit dans S.cardEdits
     (donc en localStorage + synchro), jamais dans les .json sources : régénérer le
     contenu ne l'efface pas, mais la source et l'affichage divergent tant que la
     correction n'a pas été reportée dans cours:/bloc<n>:/flashcards:/. */
  function cardRecto(c){ var e=S.cardEdits[c.id]; return (e&&e.recto)||c.recto; }
  function cardVerso(c){ var e=S.cardEdits[c.id]; return (e&&e.verso)||c.verso; }
  function dueReviews(list){
    return activeCards(list).filter(function(c){
      var b=S.box[c.id]||0;
      return b>0 && (S.due[c.id]||0)<=today();
    }).sort(function(a,b){
      return (S.due[a.id]||0)-(S.due[b.id]||0);
    });
  }
  function newCardsIn(list){ return activeCards(list).filter(function(c){ return !(S.box[c.id]); }); }
  /* Ce qui reste du quota, réparti entre révisions et nouvelles. Une part du
     quota est réservée aux nouvelles (proportionnelle à ce qu'il reste à faire)
     pour que l'avancée dans le cours ne s'arrête pas dès qu'il y a du retard. */
  function dueBreakdown(list){
    var reste=dayBudget();
    if(!reste) return {reviews:0, news:0, total:0};
    var revDispo=dueReviews(list).length;
    var newDispo=Math.min(newBudget(), newCardsIn(list).length);
    var reserve=Math.min(NEW_RESERVE, Math.ceil(reste*NEW_RESERVE/TOTAL_CAP), newDispo);
    var reviews=Math.min(revDispo, reste-reserve);
    var news=Math.min(newDispo, reste-reviews);
    return {reviews:reviews, news:news, total:reviews+news};
  }
  /* Le reste de ce qui serait dû aujourd'hui, une fois le quota épuisé :
     facultatif, jamais compté dans l'objectif ni dans la série. */
  function bonusBreakdown(list){
    var b=dueBreakdown(list);
    var reviews=Math.max(0, dueReviews(list).length-b.reviews);
    var news=Math.max(0, Math.min(newBudget(), newCardsIn(list).length)-b.news);
    return {reviews:reviews, news:news, total:reviews+news};
  }
  function dueLabel(list){
    var b=dueBreakdown(list);
    if(!b.total) return "Rien à revoir aujourd'hui";
    var parts=[];
    if(b.reviews) parts.push(b.reviews+' révision'+(b.reviews>1?'s':''));
    if(b.news) parts.push(b.news+' nouvelle'+(b.news>1?'s':''));
    return parts.join(' + ');
  }
  /* Composition de ce qui reste en plus du quota : le même vocabulaire que la
     file du jour, pour qu'on lise les deux lignes d'un coup. */
  function bonusLabel(list){
    var b=bonusBreakdown(list);
    if(!b.total) return "";
    var parts=[];
    if(b.reviews) parts.push(b.reviews+' révision'+(b.reviews>1?'s':''));
    if(b.news) parts.push(b.news+' nouvelle'+(b.news>1?'s':''));
    return parts.join(' et ');
  }
  function buildDueQueue(list){
    var b=dueBreakdown(list);
    var reviews=dueReviews(list).slice(0,b.reviews);
    var picked=newCardsIn(list).slice(0,b.news);
    return shuffle(reviews.concat(picked));
  }
  function buildBonusQueue(list){
    var b=dueBreakdown(list), bo=bonusBreakdown(list);
    var reviews=dueReviews(list).slice(b.reviews, b.reviews+bo.reviews);
    var picked=newCardsIn(list).slice(b.news, b.news+bo.news);
    return shuffle(reviews.concat(picked));
  }
  function dueCount(){ return dueBreakdown(FLASHCARDS).total; }
  function bonusCount(){ return bonusBreakdown(FLASHCARDS).total; }
  /* À appeler avant grade() : c'est S.box qui dit si la carte était neuve. */
  function countCardDone(id){
    if(!S.box[id]) consumeNewBudget(1);
    consumeDay(1);
  }
  /* La série se valide sur l'objectif du jour, jamais sur le bonus : le bonus
     doit rester facultatif, pas une condition pour ne pas casser la série. */
  function majSerie(){
    if(!dueBreakdown(FLASHCARDS).total) markStreakDay();
  }
  function grade(i,ok){
    var b=S.box[i]||0, nb=ok?Math.min(INTERV.length-1,b+1):1;
    S.box[i]=nb; S.due[i]=today()+INTERV[nb]*86400000;
    if(!ok) S.fail[i]=(S.fail[i]||0)+1;
    save();
  }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),x=a[i];a[i]=a[j];a[j]=x;} return a; }

  var VIEWS=[["accueil","Accueil"],["dossiers","Dossiers"],["cours","Cours"],["apprendre","Apprendre"]];
  var KNOWN_VIEWS=["accueil","dossiers","cours","apprendre","flashcards","flashcardsBloc","flashcardsSort","quiz","quizBloc","cartes","cartesListe","cartesBloc","carte","carteEdit","recherche"];
  function parseHash(hash){
    var h=(hash||"").replace(/^#/,"");
    if(h.charAt(0)==="/") h=h.slice(1);
    if(!h) return {view:"accueil"};
    var parts=h.split("/").filter(Boolean).map(function(p){ try{ return decodeURIComponent(p); }catch(e){ return p; } });
    if(parts[0]==="q" && parts[1]) return {view:"question", id:parts[1]};
    if(parts[0]==="bloc" && parts[1]) return {view:"bloc", id:parts[1]};
    if(parts[0]==="cours" && parts[1]==="bloc" && parts[2]) return {view:"coursBloc", id:parts[2]};
    /* 4e segment optionnel : l'ancre d'une section du résumé (liens des flashcards) */
    if(parts[0]==="cours" && parts[1]==="resume" && parts[2]) return {view:"coursResume", id:parts[2], ancre:parts[3]||null};
    if(parts[0]==="cours" && parts[1]==="question" && parts[2]) return {view:"coursQuestion", id:parts[2]};
    if(parts[0]==="cours") return {view:"cours"};
    if(parts[0]==="quiz" && parts[1]==="bloc" && parts[2]) return {view:"quizBloc", id:parts[2]};
    if(parts[0]==="flashcards" && parts[1]==="bloc" && parts[2]) return {view:"flashcardsBloc", id:parts[2]};
    if(parts[0]==="cartes" && parts[1]==="blocs") return {view:"cartesListe"};
    if(parts[0]==="cartes" && parts[1]==="bloc" && parts[2]) return {view:"cartesBloc", id:parts[2]};
    if(parts[0]==="carte" && parts[1] && parts[2]==="plan") return {view:"carteEdit", id:parts[1]};
    if(parts[0]==="carte" && parts[1]) return {view:"carte", id:parts[1]};
    if(parts[0]==="recherche") return {view:"recherche", id:parts.slice(1).join("/")||""};
    if(parts[0]==="reviser") return {view:"apprendre"};
    if(KNOWN_VIEWS.indexOf(parts[0])>=0) return {view:parts[0]};
    return {view:"accueil"};
  }
  function hashFor(view,param,ancre){
    if(view==="question") return "#/q/"+param;
    if(view==="bloc") return "#/bloc/"+param;
    if(view==="coursBloc") return "#/cours/bloc/"+param;
    if(view==="coursResume") return "#/cours/resume/"+param+(ancre?"/"+ancre:"");
    if(view==="coursQuestion") return "#/cours/question/"+param;
    if(view==="cours") return "#/cours";
    if(view==="quizBloc") return "#/quiz/bloc/"+param;
    if(view==="flashcardsBloc") return "#/flashcards/bloc/"+param;
    if(view==="cartesListe") return "#/cartes/blocs";
    if(view==="cartesBloc") return "#/cartes/bloc/"+param;
    if(view==="carte") return "#/carte/"+param;
    if(view==="carteEdit") return "#/carte/"+param+"/plan";
    if(view==="recherche") return "#/recherche/"+encodeURIComponent(param||"");
    if(view==="accueil") return "#/";
    return "#/"+view;
  }
  var BASE_TITLE=document.title;
  function pageTitle(){
    var v=ROUTE.view, id=ROUTE.id;
    var cb=(typeof COURS_BLOCS!=="undefined")?COURS_BLOCS:[];
    if(v==="dossiers") return "Dossiers";
    if(v==="cours") return "Cours";
    if(v==="apprendre") return "Apprendre";
    if(v==="bloc"){ var b=blocById(id); return b ? b.code+" · "+b.titre : "Bloc"; }
    if(v==="question"){ var q=ALL.filter(function(x){return x.id===id;})[0]; return q ? q.n+" · "+q.t : "Question"; }
    if(v==="coursBloc"){ var b2=cb.filter(function(x){return String(x.numero)===String(id);})[0]; return b2 ? "Cours · "+b2.titre : "Cours"; }
    if(v==="coursResume"){ var r=(typeof RESUMES!=="undefined")?RESUMES[id]:null; return r ? r.titre : "Résumé"; }
    if(v==="coursQuestion"){ var qc=(typeof QUESTIONS_COURS!=="undefined")?QUESTIONS_COURS[id]:null; return qc ? qc.titre : "Cours"; }
    if(v==="flashcards") return "Flashcards";
    if(v==="flashcardsBloc"){ var b3=cb.filter(function(x){return String(x.numero)===String(id);})[0]; return b3 ? "Flashcards · "+b3.titre : "Flashcards"; }
    if(v==="flashcardsSort") return "Flashcards";
    if(v==="cartes") return "Cartes mentales";
    if(v==="cartesListe") return "Mes cartes";
    if(v==="cartesBloc"){ var bm=cb.filter(function(x){return String(x.numero)===String(id);})[0]; return bm ? "Cartes · "+bm.court : "Cartes sans bloc"; }
    if(v==="carte"||v==="carteEdit"){ var mm=S.cartes&&S.cartes[id]; return mm ? mm.t : "Carte mentale"; }
    if(v==="quiz") return "Quiz";
    if(v==="quizBloc"){ var b4=cb.filter(function(x){return String(x.numero)===String(id);})[0]; return b4 ? "Quiz · "+b4.titre : "Quiz"; }
    if(v==="recherche") return id ? "Recherche : "+id : "Recherche";
    return null;
  }
  function updateTitle(){
    var t=pageTitle();
    document.title = t ? (t+" — "+BASE_TITLE) : BASE_TITLE;
  }
  var ROUTE={view:"accueil"};
  function applyRoute(r){
    scrollMemory[hashFor(ROUTE.view, ROUTE.id)]=window.scrollY;
    if(ROUTE.view==="coursResume" && ROUTE.id){
      var secIdx=currentSectionIndex();
      if(secIdx>0) S.coursLuSection[ROUTE.id]=secIdx; else delete S.coursLuSection[ROUTE.id];
    }
    if(r.view!==ROUTE.view){ SES=null; QZ=null; }
    searchOpen = (r.view==="recherche");
    ROUTE=r; S.view=(KNOWN_VIEWS.indexOf(r.view)>=0)?r.view:"accueil";
    if(r.view==="question" && r.id) S.reprendre={type:"question", id:r.id, t:Date.now()};
    else if(r.view==="coursResume" && r.id) S.reprendre={type:"resume", id:r.id, t:Date.now()};
    save({silent:true});
    render();
    main.classList.remove("view-anim");
    void main.offsetWidth;
    main.classList.add("view-anim");
    var term=pendingJumpTerm; pendingJumpTerm=null;
    if(!(term && jumpToTerm(term)) && !jumpToAncre(r)){
      var h=hashFor(r.view, r.id);
      window.scrollTo(0, scrollMemory.hasOwnProperty(h) ? scrollMemory[h] : 0);
    }
    updateReadProgress();
  }
  /* Arrivée sur un résumé par une ancre de section (lien d'une flashcard) :
     on se pose sur le titre visé et on le signale une seconde. */
  function jumpToAncre(r){
    if(r.view!=="coursResume" || !r.ancre) return false;
    var el=main.querySelector(".resume #"+cssId(r.ancre));
    if(!el) return false;
    scrollToEl(el);
    el.classList.add("sec-cible");
    setTimeout(function(){ el.classList.remove("sec-cible"); },1600);
    return true;
  }
  function cssId(id){
    return (window.CSS && CSS.escape) ? CSS.escape(id) : String(id).replace(/[^\w-]/g,"");
  }
  function scrollToEl(el){
    var qbar=main.querySelector(".qbar");
    var offset=nav.offsetHeight+(qbar?qbar.offsetHeight:0)+16;
    window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top+window.scrollY-offset));
  }
  function updateReadProgress(){
    if(ROUTE.view!=="coursResume") return;
    var el=document.getElementById("readProgressFill");
    if(!el) return;
    var max=document.documentElement.scrollHeight-window.innerHeight;
    var pct=max>0 ? Math.min(100,Math.max(0,(window.scrollY/max)*100)) : 0;
    el.style.width=pct+"%";
  }
  function updateSectionActive(){
    if(ROUTE.view!=="coursResume") return;
    var heads=main.querySelectorAll(".resume h3");
    if(!heads.length) return;
    var idx=currentSectionIndex();
    var items=main.querySelectorAll(".sommaire li");
    for(var i=0;i<items.length;i++) items[i].classList.toggle("sec-on", i===idx);
    var label=document.getElementById("qbarSection");
    if(label){
      var scrolled=window.scrollY>heads[0].offsetTop-200;
      var titre="";
      if(scrolled){
        var clone=heads[idx].cloneNode(true);
        var pill=clone.querySelector(".h3-pill");
        if(pill) clone.removeChild(pill);
        titre=clone.textContent.trim();
      }
      label.textContent=titre;
      label.classList.toggle("show", !!scrolled);
    }
  }
  var readProgressPending=false;
  window.addEventListener("scroll",function(){
    if(ROUTE.view!=="coursResume" || readProgressPending) return;
    readProgressPending=true;
    requestAnimationFrame(function(){
      readProgressPending=false;
      updateReadProgress();
      updateSectionActive();
    });
  },{passive:true});
  function go(view,param,ancre){
    var h=hashFor(view,param,ancre);
    if(location.hash===h) applyRoute(parseHash(h));
    else location.hash=h;
  }
  window.addEventListener("hashchange",function(){
    var r=parseHash(location.hash);
    if((SES||QZ) && r.view!==ROUTE.view){
      if(!confirm("Tu es en session. Quitter maintenant efface ta progression sur la carte ou la question en cours. Continuer ?")){
        history.forward();
        return;
      }
    }
    applyRoute(r);
  });

  function submitSearch(){
    var input=document.getElementById("navsearch-input");
    var term=input?input.value.trim():"";
    if(term) go("recherche", term);
  }
  window.addEventListener("keydown",function(e){
    if((e.metaKey||e.ctrlKey) && (e.key==="k"||e.key==="K")){
      e.preventDefault();
      searchOpen=true;
      var form=document.getElementById("navsearch"), input=document.getElementById("navsearch-input");
      if(form) form.classList.add("open");
      if(input){ input.focus(); input.select(); }
    }
  });
  document.addEventListener("click",function(e){
    if(!searchOpen) return;
    var form=document.getElementById("navsearch");
    if(form && !form.contains(e.target)){
      searchOpen=false;
      form.classList.remove("open");
    }
  });

  function tickClass(q,i,exp,left){
    var st=S.status[q.id];
    var c = st==="done"?"relu":st==="draft"?"done":st==="wip"?"wip":"";
    if(i===exp && left>0) c+=" mark";
    return c;
  }
  function renderCadenceCompact(){
    var cc=document.getElementById("cadenceCompact"); if(!cc) return;
    var done=doneCount(), left=ALL.length-done, exp=expectedDone();
    var h="";
    ALL.forEach(function(q,i){ h+='<div class="seg '+tickClass(q,i,exp,left)+'"></div>'; });
    cc.innerHTML=h;
  }

  function renderNav(){
    var h="";
    var activeView = (ROUTE.view==="question"||ROUTE.view==="bloc"||ROUTE.view==="coursQuestion") ? "dossiers" : (ROUTE.view==="coursBloc"||ROUTE.view==="coursResume") ? "cours" : (ROUTE.view==="flashcards"||ROUTE.view==="flashcardsBloc"||ROUTE.view==="flashcardsSort"||ROUTE.view==="quiz"||ROUTE.view==="quizBloc"||ROUTE.view==="cartes"||ROUTE.view==="cartesListe"||ROUTE.view==="cartesBloc"||ROUTE.view==="carte"||ROUTE.view==="carteEdit") ? "apprendre" : ROUTE.view;
    VIEWS.forEach(function(v){
      var badge="";
      if(v[0]==="dossiers"){ var r=ALL.length-doneCount(); if(r) badge='<i>'+r+'</i>'; }
      if(v[0]==="apprendre"){ var d=dueCount(); if(d) badge='<i>'+d+'</i>'; }
      h+='<button class="navb'+(activeView===v[0]?" on":"")+'" data-go="'+v[0]+'">'+v[1]+badge+'</button>';
    });
    h+='<form class="navsearch'+(searchOpen?" open":"")+'" id="navsearch">';
    h+='<button type="button" class="navsearch-icon" id="navSearchToggle" title="Rechercher" aria-label="Rechercher">'+ICON_SEARCH+'</button>';
    h+='<input id="navsearch-input" type="search" value="'+esc(ROUTE.view==="recherche"?ROUTE.id||"":"")+'" placeholder="Rechercher une notion" aria-label="Rechercher">';
    h+='</form>';
    nav.innerHTML=h;
    nav.querySelectorAll("[data-go]").forEach(function(el){
      el.addEventListener("click",function(){ go(el.getAttribute("data-go")); });
    });
    var searchForm=document.getElementById("navsearch");
    var searchToggle=document.getElementById("navSearchToggle");
    var searchInput=document.getElementById("navsearch-input");
    if(searchToggle) searchToggle.addEventListener("click",function(e){
      e.stopPropagation();
      searchOpen=!searchOpen;
      searchForm.classList.toggle("open", searchOpen);
      if(searchOpen) searchInput.focus();
    });
    if(searchForm) searchForm.addEventListener("submit",function(e){ e.preventDefault(); submitSearch(); });
    if(searchInput) searchInput.addEventListener("keydown",function(e){
      if(e.key==="Enter"){ e.preventDefault(); submitSearch(); }
    });
    renderCadenceCompact();
  }

  /* ---------- ACCUEIL ---------- */
  function renderReprendre(skipQid, skipResId){
    var rp=S.reprendre;
    if(!rp || !rp.id) return "";
    if(rp.type==="question"){
      if(rp.id===skipQid) return "";
      var q=ALL.filter(function(x){return x.id===rp.id;})[0];
      if(!q || isDone(q.id)) return "";
      return '<button class="reprendre" data-goq="'+q.id+'"><span class="rep-lab">Reprendre</span>'+
             '<span class="rep-t">'+esc(q.bloc.code)+' &middot; '+esc(q.n)+' — '+esc(q.t)+'</span></button>';
    }
    if(rp.type==="resume"){
      if(rp.id===skipResId) return "";
      var r=(typeof RESUMES!=="undefined")?RESUMES[rp.id]:null;
      if(!r || luEtat(r.id)==="lu") return "";
      return '<button class="reprendre" data-go-resume="'+r.id+'"><span class="rep-lab">Reprendre</span>'+
             '<span class="rep-t">'+esc(r.titre)+'</span></button>';
    }
    return "";
  }

  function renderAujourdhui(){
    var nxt=ALL.filter(function(q){return !isDone(q.id);})[0];
    var resPrev=nextResumeToRead();
    var h=renderReprendre(nxt?nxt.id:null, resPrev?resPrev.id:null);
    h+='<div class="lab">Aujourd\'hui</div><div class="today">';
    if(nxt){
      var crit=nxt.k.filter(function(_,i){return (S.checks[nxt.id]||{})[i];}).length;
      h+='<button class="today-card t-redi" data-goq="'+nxt.id+'">';
      h+='<span class="today-lab">Rédiger</span>';
      h+='<span class="today-title">'+esc(nxt.t)+'</span>';
      h+='<span class="today-meta">'+esc(nxt.bloc.code)+' &middot; '+esc(nxt.n)+' &middot; '+crit+'/'+nxt.k.length+' critères</span>';
      h+='</button>';
    } else {
      h+='<div class="today-card t-redi today-done"><span class="today-lab">Rédiger</span>';
      h+='<span class="today-title">Tout est rédigé</span>';
      h+='<span class="today-meta">Les 44 livrables sont faits.</span></div>';
    }

    var res=resPrev;
    if(res){
      var enCours=luEtat(res.id)==="wip";
      h+='<button class="today-card t-lire" data-go-resume="'+res.id+'">';
      h+='<span class="today-lab">Lire</span>';
      h+='<span class="today-title">'+esc(res.titre)+'</span>';
      h+='<span class="today-meta">'+(enCours?'Repris en cours':'Nouveau')+' &middot; '+res.lecture_min+' min</span>';
      h+='</button>';
    } else {
      h+='<div class="today-card t-lire today-done"><span class="today-lab">Lire</span>';
      h+='<span class="today-title">Tous les résumés sont lus</span>';
      h+='<span class="today-meta">Rien de nouveau à lire.</span></div>';
    }

    /* même tuile que la page Flashcards, à la taille de la grille d'accueil */
    h+=renderCtaJour("today-cta");

    h+='</div>';
    return h;
  }

  function runTime(r){
    if(r && typeof r.t==="number") return r.t;
    var m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec((r&&r.d)||"");
    return m ? new Date(+m[3], +m[2]-1, +m[1]).getTime() : 0;
  }
  function weekActivity(){
    var since=today()-6*86400000;
    var q=Object.keys(S.statusAt||{}).filter(function(id){
      return S.statusAt[id]>=since && S.status[id] && S.status[id]!=="todo";
    }).length;
    var r=Object.keys(S.coursLuAt||{}).filter(function(id){
      return S.coursLuAt[id]>=since && luEtat(id)==="lu";
    }).length;
    var c=(S.cardRuns||[]).filter(function(x){ return runTime(x)>=since; })
      .reduce(function(a,x){ return a+(x.n||0); },0);
    return {questions:q, resumes:r, cartes:c};
  }
  function renderSemaine(){
    var a=weekActivity(), cur=streakDisplay(), max=(S.streak&&S.streak.max)||0;
    var parts=[];
    if(a.questions) parts.push(a.questions+' question'+(a.questions>1?'s':'')+' avancée'+(a.questions>1?'s':''));
    if(a.resumes) parts.push(a.resumes+' résumé'+(a.resumes>1?'s':'')+' lu'+(a.resumes>1?'s':''));
    if(a.cartes) parts.push(a.cartes+' carte'+(a.cartes>1?'s':'')+' revue'+(a.cartes>1?'s':''));
    var h='<div class="semaine">';
    h+='<div class="sem-streak"><span class="num">'+cur+'</span><span class="lbl">jour'+(cur>1?'s':'')+' d\'affilée</span>';
    h+='<span class="sem-sub">Record : '+max+'</span></div>';
    h+='<div class="sem-body"><div class="lab">Cette semaine</div>';
    if(!parts.length){
      h+='<div class="sem-vide">Rien encore cette semaine. La première action compte.</div>';
    } else {
      h+='<div class="sem-stats">';
      [[a.questions, "question"+(a.questions>1?"s":"")+" avancée"+(a.questions>1?"s":"")],
       [a.resumes,   "résumé"+(a.resumes>1?"s":"")+" lu"+(a.resumes>1?"s":"")],
       [a.cartes,    "carte"+(a.cartes>1?"s":"")+" revue"+(a.cartes>1?"s":"")]
      ].forEach(function(p){
        h+='<div class="sem-stat"><span class="n'+(p[0]?'':' zero')+'">'+p[0]+'</span>';
        h+='<span class="l">'+p[1]+'</span></div>';
      });
      h+='</div>';
    }
    h+='</div></div>';
    return h;
  }

  function renderBilan(){
    var resumes=allResumesOrdered();
    var lus=luCount(resumes.map(function(r){return r.id;}));
    var active=activeCards();
    var vus=active.filter(function(c){return (S.box[c.id]||0)>0;}).length;
    var score=avgPct(S.quiz);
    var items=[
      {n:doneCount(), tot:ALL.length, lbl:"livrables rédigés", go:"dossiers"},
      {n:lus, tot:resumes.length, lbl:"résumés lus", go:"cours"},
      {n:vus, tot:active.length, lbl:"cartes vues", go:"flashcards"},
      {txt:(score===null?'—':Math.round(score*100)+'<span class="on">%</span>'), lbl:"score quiz moyen", go:"quiz"}
    ];
    var h='<div class="lab">Où j\'en suis</div><div class="bilan">';
    items.forEach(function(it){
      h+='<button class="bilan-card" data-go="'+it.go+'">';
      h+='<span class="num">'+(it.txt!==undefined?it.txt:it.n+'<span class="on">/'+it.tot+'</span>')+'</span>';
      h+='<span class="lbl">'+it.lbl+'</span>';
      h+='</button>';
    });
    h+='</div>';
    return h;
  }

  function vAccueil(){
    var done=doneCount(), left=ALL.length-done, wl=weeksLeft();
    var pace= wl>0.15 ? left/wl : left;
    var exp=expectedDone(), delta=done-exp;
    var verdict,cls;
    if(left===0){verdict="Tout est déposé.";cls="ok";}
    else if(delta>=0){verdict="Tu es dans les temps.";cls="ok";}
    else {verdict=Math.abs(delta)+" livrable"+(Math.abs(delta)>1?"s":"")+" de retard.";cls="late";}

    var h=renderAujourdhui();
    h+=renderSemaine();
    h+='<div class="cadence"><div class="verdict '+cls+'">'+verdict+'</div>';
    h+='<div class="sub">Rythme nécessaire pour tenir la date : <strong>'+pace.toFixed(1)+' livrable'+(pace>=2?'s':'')+' par semaine</strong>.</div>';
    h+='<div class="ticks">';
    ALL.forEach(function(q,i){
      var qst=S.status[q.id]||"todo";
      var qlbl=qst==="done"?"relu":qst==="draft"?"rédigé":qst==="wip"?"en cours":"à faire";
      h+='<div class="tick '+tickClass(q,i,exp,left)+'" title="'+q.bloc.code+' '+q.n+' — '+qlbl+'"></div>';
    });
    h+='</div>';
    h+='<div class="stats"><div class="stat"><div class="num">'+done+'<span class="on">/'+ALL.length+'</span></div><div class="lbl">Terminés</div></div>';
    h+='<div class="stat"><div class="num">'+Math.floor(wl)+'</div><div class="lbl">Semaines restantes</div></div>';
    h+='<div class="stat"><div class="num">'+left+'</div><div class="lbl">Restants</div></div></div></div>';

    h+=renderBilan();

    h+='<details class="notions reglages"><summary>Réglages</summary>';

    h+='<div class="foot">Date limite de dépôt : <input type="date" id="dl" value="'+S.deadline+'"><br>';
    h+='<button id="exp">Exporter tout en texte</button>';
    h+='<textarea class="f" id="expbox" style="display:none;margin-top:8px;min-height:220px;font-size:12px"></textarea></div>';

    h+='<div class="foot">';
    h+='<div class="lab">Sauvegarde des données</div>';
    h+='<p class="rappel">Copie de secours complète de ta progression. Une restauration écrase les données de cet appareil et devient la référence pour les autres.</p>';
    h+='<button id="sauvExport">Copier ma sauvegarde</button> ';
    h+='<button id="sauvImportOuvrir">Restaurer une sauvegarde</button>';
    h+='<textarea class="f" id="sauvBox" style="display:none;margin-top:8px;min-height:140px;font-size:11px" placeholder="Colle ici une sauvegarde puis appuie sur Restaurer"></textarea>';
    h+='<button id="sauvImport" style="display:none;margin-top:8px">Restaurer maintenant</button>';
    h+='<span id="sauvMsg" class="rappel"></span>';
    h+='</div>';

    h+='<div class="foot">';
    h+='<div class="lab">Synchronisation</div>';
    if(getSyncToken()){
      h+='<p class="rappel">Tes données sont synchronisées via un Gist GitHub privé et te suivent d\'un appareil à l\'autre.<br>';
      h+='<span id="syncStatusText">Non activée</span></p>';
      h+='<button id="syncDeactivate">Désactiver sur cet appareil</button>';
    } else {
      h+='<p class="rappel">Sans synchronisation, tes données restent sur cet appareil uniquement. Colle un jeton GitHub (portée <b>gist</b> uniquement) pour les retrouver aussi sur ton téléphone.</p>';
      h+='<input type="password" class="f" id="syncTokenInput" placeholder="Jeton GitHub (portée gist)" autocomplete="off">';
      h+='<button id="syncActivate" style="margin-top:8px">Activer la synchronisation</button>';
      h+='<span id="syncStatusText" class="rappel"></span>';
    }
    h+='</div>';
    h+='</details>';
    return h;
  }

  /* ---------- DOSSIERS ---------- */
  function renderQuestionBody(q, opts){
    opts = opts || {};
    var h='';
    var inf=INFO[q.id];
    if(inf){
      h+='<div class="lab">Ce qui est attendu concrètement</div><ul class="att">';
      inf[0].forEach(function(a){h+='<li>'+a+'</li>';});
      h+='</ul><details class="notions"><summary>Notions à mobiliser — '+inf[1].length+'</summary><ul>';
      inf[1].forEach(function(n){h+='<li>'+n+'</li>';});
      h+='</ul><p class="rappel">Ces notions sont détaillées dans l\'onglet Cours. Si un point te manque, demande-le-moi.</p></details>';
    }
    h+=renderCoursSlot(q.id);
    if(q.trame) h+='<div class="lab">Trame détaillée</div><div class="trame">'+q.trame+'</div>';
    var checkedCrit=q.k.filter(function(_,i){return (S.checks[q.id]||{})[i];}).length;
    h+='<div class="lab-row"><span class="lab">Critères évalués — compétence '+q.c+'</span><span class="count">'+checkedCrit+'/'+q.k.length+'</span></div>';
    q.k.forEach(function(k,i){
      var ck=(S.checks[q.id]||{})[i]?" checked":"";
      h+='<label class="crit"><input type="checkbox" data-check="'+q.id+'" data-i="'+i+'"'+ck+'><span>'+k+'</span></label>';
    });
    if(!opts.hideStatus){
      h+='<div class="lab">Où j\'en suis</div><div class="states">';
      var st=S.status[q.id]||"todo";
      [["todo","À faire"],["wip","En cours"],["draft","Rédigé"],["done","Relu"]].forEach(function(p){
        h+='<button data-set="'+q.id+'" data-v="'+p[0]+'" aria-pressed="'+(st===p[0])+'">'+p[1]+'</button>';
      });
      h+='</div>';
    }
    return h;
  }

  function renderArbitrage(q){
    return '<details class="notions arbitrage"><summary>Noter un arbitrage</summary>'+
      '<div class="jform">'+
      '<textarea class="f" data-arb-in placeholder="Ce que j\'ai retenu"></textarea>'+
      '<textarea class="f" data-arb-out placeholder="Ce que j\'ai écarté"></textarea>'+
      '<textarea class="f" data-arb-why placeholder="Pourquoi"></textarea>'+
      '<button class="jadd" data-arb-add="'+q.id+'">Ajouter au journal</button>'+
      '</div></details>';
  }

  function renderBreadcrumb(trail){
    var h='<nav class="crumbs">';
    trail.forEach(function(seg,i){
      if(i>0) h+='<span class="crumb-sep">&rsaquo;</span>';
      if(seg.view){
        h+='<button class="crumb" data-crumb="'+seg.view+'"'+(seg.param?' data-crumb-param="'+seg.param+'"':'')+'>'+seg.label+'</button>';
      } else {
        h+='<span class="crumb current">'+seg.label+'</span>';
      }
    });
    h+='</nav>';
    return h;
  }

  function renderLocalCadence(currentIdx){
    var done=doneCount(), left=ALL.length-done, exp=expectedDone();
    var h='<div class="ticks local">';
    ALL.forEach(function(q,i){
      var c=tickClass(q,i,exp,left).replace(" mark","");
      if(i===currentIdx) c+=" current";
      h+='<div class="tick '+c+'" title="'+q.bloc.code+' '+q.n+'"></div>';
    });
    h+='</div>';
    return h;
  }

  /* ---------- QUESTION ---------- */
  function renderAnnexesUtilisables(q){
    var inf=INFO[q.id];
    if(!inf || !inf.annexes || !inf.annexes.length) return "";
    var list=(typeof ANNEXES!=="undefined" && ANNEXES[q.bloc.id]) ? ANNEXES[q.bloc.id] : [];
    var h='';
    inf.annexes.forEach(function(n){
      var a=list.filter(function(x){return x.n===n;})[0];
      if(!a) return;
      h+='<div class="annexe-item"><div class="annexe-h">Annexe '+a.n+' &middot; '+a.titre+' <span class="code">p. '+a.pages+'</span></div>';
      h+='<p>'+a.contenu+'</p><p>'+a.utile+'</p></div>';
    });
    return h;
  }

  function vQuestion(qid){
    var q=ALL.filter(function(x){return x.id===qid;})[0];
    if(!q){
      return '<div class="qbar">'+renderBreadcrumb([{label:"Dossiers",view:"dossiers"}])+'</div><p class="rappel">Question introuvable.</p>';
    }
    S.open[q.bloc.id]=true;
    var idx=ALL.indexOf(q);
    var st=S.status[q.id]||"todo";
    var lbl=st==="done"?"relu":st==="draft"?"rédigé":st==="wip"?"en cours":"à faire";
    var chipc=st==="done"?" done":st==="draft"?" draft":st==="wip"?" wip":"";
    var prev=ALL[idx-1], next=ALL[idx+1];
    var inf=INFO[q.id];
    var rich=!!(inf && inf.enonce);

    var h='<div class="qbar">'+renderBreadcrumb([
      {label:"Dossiers",view:"dossiers"},
      {label:q.bloc.code,view:"bloc",param:q.bloc.id},
      {label:q.n}
    ]);
    if(rich){
      h+='<div class="qseq">';
      h+= prev ? '<button class="linkf" data-goq="'+prev.id+'">&larr; '+prev.n+'</button>' : '<span></span>';
      h+= next ? '<button class="tile-thin" data-goq="'+next.id+'">'+next.n+' &rarr;</button>' : '<span></span>';
      h+='</div>';
    } else {
      h+='<span class="chip'+chipc+'">'+lbl+'</span>';
    }
    h+='</div>';
    h+=renderLocalCadence(idx);

    if(!rich){
      h+='<h1 class="qhead-title">'+q.t+'</h1><div class="qhead-code code">'+q.c+'</div>';
      h+=renderQuestionBody(q,{hideStatus:true});
      h+=renderArbitrage(q);
      h+='<div class="qbottom"><div class="qbottom-inner"><div class="states">';
      [["todo","À faire"],["wip","En cours"],["draft","Rédigé"],["done","Relu"]].forEach(function(p){
        h+='<button data-set="'+q.id+'" data-v="'+p[0]+'" aria-pressed="'+(st===p[0])+'">'+p[1]+'</button>';
      });
      h+='</div><div class="qseq">';
      h+= prev ? '<button class="linkf" data-goq="'+prev.id+'">&larr; '+prev.n+'</button>' : '<span></span>';
      h+= next ? '<button class="linkf" data-goq="'+next.id+'">'+next.n+' &rarr;</button>' : '<span></span>';
      h+='</div></div></div>';
      return h;
    }

    h+='<div class="qtitle-row"><h1 class="qhead-title">'+q.t+'</h1><span class="chip'+chipc+'">'+lbl+'</span></div>';
    h+='<div class="qhead-code code">'+q.c+'</div>';

    h+='<div class="q-cols"><div class="q-left">';
    h+='<div class="q-enonce-text"><div class="lab">L\'énoncé</div><div class="enonce-box"><p class="enonce-text">'+inf.enonce+'</p></div></div>';
    var compTxt=(typeof COMPETENCES!=="undefined" && COMPETENCES[q.c]) ? COMPETENCES[q.c] : '<p class="rappel">Compétence à renseigner.</p>';
    h+='<div class="q-comp-crit">';
    h+='<div class="q-competences"><div class="lab">Compétence évaluée &middot; '+q.c+'</div><div class="comp-box">'+compTxt+'</div></div>';
    var checkedCrit=q.k.filter(function(_,i){return (S.checks[q.id]||{})[i];}).length;
    h+='<div class="q-criteres"><div class="lab-row"><span class="lab">Critères évalués</span><span class="count">'+checkedCrit+'/'+q.k.length+'</span></div>';
    q.k.forEach(function(k,i){
      var ck=(S.checks[q.id]||{})[i]?" checked":"";
      h+='<label class="crit"><input type="checkbox" data-check="'+q.id+'" data-i="'+i+'"'+ck+'><span>'+k+'</span></label>';
    });
    if(inf.doc){
      h+='<a class="doc-btn" href="'+inf.doc+'" target="_blank" rel="noopener">Rédiger la réponse sur le document &rarr;</a>';
    }
    h+='</div>';
    h+='</div>'; // q-comp-crit
    h+='<div class="q-arbitrage">'+renderArbitrage(q)+'</div>';
    h+='</div>'; // q-left
    h+='<div class="q-right"><div class="lab">Ce dont tu disposes</div>'+renderCoursSlot(q.id)+renderAnnexesUtilisables(q)+'</div>';
    h+='</div>'; // q-cols

    h+='<div class="qbottom"><div class="qbottom-inner"><div class="states">';
    [["todo","À faire"],["wip","En cours"],["draft","Rédigé"],["done","Relu"]].forEach(function(p){
      h+='<button data-set="'+q.id+'" data-v="'+p[0]+'" aria-pressed="'+(st===p[0])+'">'+p[1]+'</button>';
    });
    h+='</div></div></div>';
    return h;
  }

  function isVideo(q){ return q && q.n==="Vidéo"; }
  function renderQuestionRow(q){
    var st=S.status[q.id]||"todo";
    var lbl=st==="done"?"relu":st==="draft"?"rédigé":st==="wip"?"en cours":"à faire";
    var chipc=st==="done"?" done":st==="draft"?" draft":st==="wip"?" wip":"";
    var checkedCrit=q.k.filter(function(_,i){return (S.checks[q.id]||{})[i];}).length;
    var dots=[]; for(var i=0;i<q.k.length;i++){ dots.push(i<checkedCrit?"&#9679;":"&#9675;"); } dots=dots.join("&#8202;");
    var h='<button class="qrow'+(isVideo(q)?' qrow-video':'')+'" id="q-'+q.id+'" data-goq="'+q.id+'">';
    h+='<span class="qn">'+q.n+'</span><span class="qt">'+q.t+'</span>';
    h+='<span class="qprog">'+dots+' '+checkedCrit+'/'+q.k.length+'</span>';
    h+='<span class="chip'+chipc+'">'+lbl+'</span></button>';
    return h;
  }

  function renderQuestionTile(q){
    var st=S.status[q.id]||"todo";
    var lbl=st==="done"?"relu":st==="draft"?"rédigé":st==="wip"?"en cours":"à faire";
    var chipc=st==="done"?" done":st==="draft"?" draft":st==="wip"?" wip":"";
    var checkedCrit=q.k.filter(function(_,i){return (S.checks[q.id]||{})[i];}).length;
    var h='<button class="tile'+(isVideo(q)?' tile-video':'')+'" id="q-'+q.id+'" data-goq="'+q.id+'">';
    h+='<span class="tile-code code">'+q.n+'</span>';
    h+='<span class="tile-title">'+q.t+'</span>';
    h+='<span class="tile-cas">'+checkedCrit+'/'+q.k.length+' critères</span>';
    h+='<span class="chip'+chipc+'">'+lbl+'</span>';
    h+='</button>';
    return h;
  }

  /* ---------- BLOC ---------- */
  function vBloc(blocId){
    var b=BLOCS.filter(function(x){return x.id===blocId;})[0];
    if(!b){
      return renderBreadcrumb([{label:"Dossiers",view:"dossiers"}])+'<p class="rappel">Bloc introuvable.</p>';
    }
    var done=b.qs.filter(function(q){return isDone(q.id);}).length;
    var left=b.qs.length-done;
    var pct=b.qs.length?Math.round(100*done/b.qs.length):0;
    var termine=b.qs.length>0 && done===b.qs.length;
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Dossiers",view:"dossiers"},{label:b.code}])+'</div>';
    h+='<h1 class="qhead-title">'+b.titre+'</h1><div class="qhead-code code">'+b.cas+'</div>';
    h+='<div class="lab-row"><span class="lab">Avancement</span><span class="count'+(termine?' count-done':'')+'">'+
      (termine?'Terminé':'Il te reste '+left+' question'+(left>1?'s':'')+' sur '+b.qs.length)+'</span></div>';

    if(!b.enonce){
      b.qs.forEach(function(q){ h+=renderQuestionRow(q); });
      return h;
    }

    if(blocId==="b1"){
      var fOpen=S.open.fiche?" open":"";
      var fFilled=FICHE_B1.filter(function(f){return (S.fiche[f[0]]||"").trim();}).length;
      h+='<section class="panel accent'+fOpen+'"><button class="phead" data-panel="fiche"><span class="chev">&#9654;</span>';
      h+='<h2>Fiche de cohérence<span class="cas">Tes décisions structurantes. À relire au début de chaque session.</span></h2>';
      h+='<span class="count">'+fFilled+'/'+FICHE_B1.length+'</span></button><div class="pbody fiche">';
      FICHE_B1.forEach(function(f){
        h+='<div class="row"><div class="k"><span>'+f[1]+'</span><em>'+f[2]+'</em></div>';
        h+='<textarea class="f" data-fiche="'+f[0]+'" placeholder="—">'+esc(S.fiche[f[0]])+'</textarea></div>';
      });
      h+='<div class="given"><b>Donné par l\'énoncé, non négociable :</b> budget 18 à 21 M€ dont 1 M€ communication et lancement · ouverture printemps N+3 · +15 % de CA global en 3 ans · 100 chambres dont 8 PMR minimum · 70 % de circuits courts.</div></div></section>';
    }

    var enoncePanelKey="enonce-"+blocId;
    if(S.open[enoncePanelKey]===undefined) S.open[enoncePanelKey]=true;
    var eOpen=!!S.open[enoncePanelKey];
    h+='<section class="panel accent'+(eOpen?" open":"")+'"><button class="phead" data-panel="'+enoncePanelKey+'"><span class="chev">&#9654;</span>';
    h+='<h2>Énoncé<span class="cas">Contexte, mission et données du cas.</span></h2></button>';
    h+='<div class="pbody">';
    h+='<div class="enonce-top">';
    h+='<div class="enonce-context"><div class="rc-app plain">'+b.enonce.contexte+'</div></div>';
    h+='<div class="enonce-mission"><div class="lab">La mission</div><div class="rc-app">'+b.enonce.mission+'</div></div>';
    h+='<div class="enonce-donnees">';
    h+='<div class="lab">Les données à retenir</div><div class="rc-app"><ul class="att">';
    b.enonce.donnees.forEach(function(d){ h+='<li>'+d+'</li>'; });
    h+='</ul></div>';
    h+='</div>';
    h+='<div class="enonce-preview">';
    h+='<details class="notions pdf-inline"><summary>Afficher l\'aperçu ici</summary>';
    h+='<iframe class="enonce-frame" src="'+encodeURI(b.enonce.pdf)+'" title="PDF de l\'énoncé"></iframe>';
    h+='</details>';
    h+='<a class="linkf enonce-pdf" href="'+encodeURI(b.enonce.pdf)+'" target="_blank" rel="noopener">Ouvrir le PDF dans un nouvel onglet</a>';
    h+='</div>';
    h+='</div>';
    h+='</div></section>';

    h+='<div class="lab">Les questions</div><div class="tiles">';
    b.qs.forEach(function(q){ h+=renderQuestionTile(q); });
    h+='</div>';

    if(blocId==="b1"){
      var jOpen=S.open.journal?" open":"";
      h+='<section class="panel accent'+jOpen+'"><button class="phead" data-panel="journal"><span class="chev">&#9654;</span>';
      h+='<h2>Journal d\'arbitrages<span class="cas">Trois lignes après chaque session. C\'est le script de ta vidéo.</span></h2>';
      h+='<span class="count">'+S.journal.length+'</span></button><div class="pbody"><div class="jform">';
      h+='<input class="f" id="j-q" placeholder="Question concernée — ex. Bloc 1 · Q5">';
      h+='<textarea class="f" id="j-in" placeholder="Ce que j\'ai retenu"></textarea>';
      h+='<textarea class="f" id="j-out" placeholder="Ce que j\'ai écarté"></textarea>';
      h+='<textarea class="f" id="j-why" placeholder="Pourquoi"></textarea>';
      h+='<button class="jadd" id="j-add">Ajouter au journal</button></div>';
      if(!S.journal.length) h+='<div class="empty">Rien pour l\'instant. La première entrée devrait arriver après ta session sur la question 1.</div>';
      else S.journal.slice().reverse().forEach(function(e){
        h+='<div class="jentry"><button class="del" data-del="'+e.id+'">&times;</button>';
        h+='<div class="meta">'+esc(e.date)+(e.q?' · '+esc(e.q):'')+'</div>';
        if(e.in) h+='<div><b>Retenu :</b> '+esc(e.in)+'</div>';
        if(e.out)h+='<div><b>Écarté :</b> '+esc(e.out)+'</div>';
        if(e.why)h+='<div><b>Pourquoi :</b> '+esc(e.why)+'</div>';
        h+='</div>';
      });
      h+='</div></section>';
    }
    return h;
  }

  function blocCritStats(b){
    var total=0, checked=0;
    b.qs.forEach(function(q){
      total+=q.k.length;
      checked+=q.k.filter(function(_,i){return (S.checks[q.id]||{})[i];}).length;
    });
    return {total:total, checked:checked};
  }
  function renderDossiersEntry(){
    var nxt=ALL.filter(function(q){return !isDone(q.id);})[0];
    if(!nxt){
      return '<div class="today-card t-redi today-done" style="margin-bottom:var(--space-24)"><span class="today-lab">Rédiger</span>'+
        '<span class="today-title">Tout est rédigé</span><span class="today-meta">Les 44 livrables sont faits.</span></div>';
    }
    var crit=nxt.k.filter(function(_,i){return (S.checks[nxt.id]||{})[i];}).length;
    return '<button class="today-card t-redi" data-goq="'+nxt.id+'" style="margin-bottom:var(--space-24)">'+
      '<span class="today-lab">Prochaine question</span>'+
      '<span class="today-title">'+esc(nxt.t)+'</span>'+
      '<span class="today-meta">'+esc(nxt.bloc.code)+' &middot; '+esc(nxt.n)+' &middot; '+crit+'/'+nxt.k.length+' critères</span>'+
      '</button>';
  }
  function vDossiers(){
    var firstUnfinished=BLOCS.filter(function(b){return b.qs.some(function(q){return !isDone(q.id);});})[0];
    var h=renderDossiersEntry();
    h+='<div class="tiles">';
    BLOCS.forEach(function(b,idx){
      var done=b.qs.filter(function(q){return isDone(q.id);}).length;
      var wip=b.qs.filter(function(q){return (S.status[q.id]||"todo")==="wip";}).length;
      var pct=b.qs.length?Math.round(100*done/b.qs.length):0;
      var pctWip=b.qs.length?Math.round(100*wip/b.qs.length):0;
      var crit=blocCritStats(b);
      var termine=b.qs.length>0 && done===b.qs.length;
      var enCours=b===firstUnfinished;
      h+='<button class="tile'+(termine?' tile-termine':'')+(enCours?' tile-encours':'')+'" data-go-bloc="'+b.id+'">';
      h+='<span class="tile-code code">Étape '+(idx+1)+' &middot; '+b.code+(termine?' &middot; Terminé':'')+'</span>';
      h+='<span class="tile-title">'+b.titre+'</span>';
      h+='<span class="tile-cas">'+b.cas+'</span>';
      h+='<span class="tile-bar-row"><span class="tile-bar"><span class="tile-fill" style="width:'+pct+'%"></span><span class="tile-fill tile-fill-wip" style="width:'+pctWip+'%;left:'+pct+'%"></span></span><span class="tile-pct code">'+done+'/'+b.qs.length+'</span></span>';
      h+='<span class="tile-count code">'+crit.checked+'/'+crit.total+' critères</span>';
      h+='</button>';
    });
    h+='</div>';
    return h;
  }

  /* ---------- APPRENDRE (cartes + quiz) ---------- */
  var TYPE_LABELS={definition:"Définition",liste:"Liste",distinction:"Distinction",application:"Application"};

  function vApprendre(){
    var dApp=dueCount(), boApp=bonusCount();
    var h='<div class="tiles-hub">';
    h+='<button class="tile tile-hub" data-go="flashcards">';
    h+='<span class="tile-code code">Cartes à répétition espacée</span>';
    h+='<span class="tile-title">Flashcards</span>';
    h+='<span class="tile-cas">'+activeCards().length+' cartes &middot; '+(dApp?dueLabel(FLASHCARDS):(boApp?bonusLabel(FLASHCARDS)+' en bonus':'révisions à jour'))+'</span>';
    if(dApp) h+='<span class="tile-quiz-btn btn-flash" data-flashcards-due-all>Cartes du jour ('+dApp+')</span>';
    else if(boApp) h+='<span class="tile-quiz-btn btn-flash" data-flashcards-bonus>Bonus ('+boApp+')</span>';
    else h+='<span class="tile-quiz-btn btn-flash" data-flashcards-due-all>Rien à revoir aujourd\'hui</span>';
    h+='</button>';
    h+='<button class="tile tile-hub" data-go="quiz">';
    h+='<span class="tile-code code">Questions et exercices</span>';
    h+='<span class="tile-title">Quiz</span>';
    h+='<span class="tile-cas">'+QUIZ.length+' questions &middot; 7 formats</span>';
    h+='<span class="tile-quiz-btn btn-quiz" data-quiz-random-all="10">10 questions au hasard</span>';
    h+='</button>';
    var nbC=Object.keys(S.cartes||{}).length;
    h+='<button class="tile tile-hub" data-go="cartes">';
    h+='<span class="tile-code code">Structurer une notion</span>';
    h+='<span class="tile-title">Cartes mentales</span>';
    h+='<span class="tile-cas">'+(nbC?nbC+' carte'+(nbC>1?'s':''):'Aucune carte')+' &middot; tu écris, ça se dessine</span>';
    h+='<span class="tile-quiz-btn btn-mm" data-mm-new="0">Nouvelle carte</span>';
    h+='</button>';
    h+='</div>';
    return h;
  }

  /* Trois états : il reste du quota, le quota est fait mais il reste du dû
     (bonus), plus rien à faire. Le sous-titre dit toujours les deux chiffres :
     l'objectif du jour, qui descend, et ce qui reste en bonus.
     `extra` sert à l'accueil, qui reprend la même tuile à la taille de sa grille. */
  function renderCtaJour(extra){
    var d=dueCount(), bo=bonusCount(), cls='tile cta-tile'+(extra?' '+extra:'');
    if(d){
      return '<button class="'+cls+'" data-flashcards-due-all>Cartes du jour ('+d+')'+
        '<span class="cta-sub">'+dueLabel(FLASHCARDS)+'</span>'+
        (bo?'<span class="cta-sub cta-retard">+ '+bonusLabel(FLASHCARDS)+' en bonus</span>':'')+
        '</button>';
    }
    if(bo){
      return '<button class="'+cls+' cta-bonus" data-flashcards-bonus>Continuer en bonus ('+bo+')'+
        '<span class="cta-sub">'+bonusLabel(FLASHCARDS)+'</span>'+
        '<span class="cta-sub cta-retard">Facultatif</span></button>';
    }
    return '<div class="'+cls+' cta-vide">Cartes du jour'+
      '<span class="cta-sub">Rien à revoir aujourd\'hui</span></div>';
  }

  function renderDashPanel(clickable){
    var active=activeCards();
    var vus=active.filter(function(c){return (S.box[c.id]||0)>0;}).length;
    var maitr=active.filter(function(c){return (S.box[c.id]||0)>=4;}).length;
    var n1=active.filter(function(c){return (S.box[c.id]||0)===1 && !S.fail[c.id];}).length;
    var n2=active.filter(function(c){return (S.box[c.id]||0)===2;}).length;
    var n3=active.filter(function(c){return (S.box[c.id]||0)===3;}).length;
    var streakCur=streakDisplay(), streakMax=(S.streak&&S.streak.max)||0;
    var h='<div class="mini dash-panel'+(clickable?' clickable" data-go="flashcards"':'"')+'><div class="lab">Tableau de bord global</div><div class="stats stats-top">';
    h+='<div class="stat"><div class="num">'+vus+'<span class="on">/'+active.length+'</span></div><div class="lbl">cartes vues</div></div>';
    h+='<div class="stat"><div class="badge-stack">';
    h+='<span class="stat-badge lvl1">Niveau 1 &middot; '+n1+'</span>';
    h+='<span class="stat-badge lvl2">Niveau 2 &middot; '+n2+'</span>';
    h+='<span class="stat-badge lvl3">Niveau 3 &middot; '+n3+'</span>';
    h+='<span class="stat-badge lvl4">Maîtrisées : '+maitr+'</span>';
    h+='</div></div>';
    h+='<div class="stat"><div class="num">'+streakCur+'</div><div class="lbl">jours d\'affilée</div><div class="dash-sub">Record : '+streakMax+'</div></div>';
    h+='</div></div>';
    return h;
  }

  function vFlashcards(){
    if(SES) return renderCardsSession();
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Apprendre",view:"apprendre"},{label:"Flashcards"}])+'</div>';
    h+='<h1 class="qhead-title">Flashcards</h1><div class="qhead-code code">'+activeCards().length+' cartes</div>';
    h+='<div class="grid-cta-dash">';
    h+=renderCtaJour();
    h+=renderDashPanel(false);
    h+='</div>';
    h+='<div class="lab">Par bloc</div><div class="tiles">';
    (typeof COURS_BLOCS!=="undefined"?COURS_BLOCS:[]).forEach(function(b){
      var n=activeCards().filter(function(c){return c.bloc===b.numero;}).length;
      if(n){
        h+='<button class="tile" data-go-flashcards-bloc="'+b.numero+'">';
        h+='<span class="tile-code code">Bloc '+b.numero+'</span>';
        h+='<span class="tile-title">'+b.court+'</span>';
        h+='<span class="tile-cas">'+n+' carte'+(n>1?'s':'')+'</span>';
        h+='<span class="tile-quiz-btn" data-flashcards-bloc-random="'+b.numero+':10">Réviser 10 cartes</span>';
        h+='</button>';
      } else {
        h+='<div class="tile tile-empty">';
        h+='<span class="tile-code code">Bloc '+b.numero+'</span>';
        h+='<span class="tile-title">À venir</span>';
        h+='<span class="tile-cas">Pas encore de cartes</span>';
        h+='</div>';
      }
    });
    h+='</div>';
    h+='<div class="tiles">'+renderCardSortTile()+'</div>';
    return h;
  }

  function vFlashcardsBloc(numero){
    if(SES) return renderCardsSession();
    var b=(typeof COURS_BLOCS!=="undefined"?COURS_BLOCS:[]).filter(function(x){return String(x.numero)===String(numero);})[0];
    var list=activeCards().filter(function(c){return String(c.bloc)===String(numero);});
    if(!b || !list.length){
      return '<div class="qbar">'+renderBreadcrumb([{label:"Apprendre",view:"apprendre"},{label:"Flashcards",view:"flashcards"}])+'</div><p class="rappel">Pas encore de cartes pour ce bloc.</p>';
    }
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Apprendre",view:"apprendre"},{label:"Flashcards",view:"flashcards"},{label:b.court}])+'</div>';
    h+='<h1 class="qhead-title">'+b.titre+'</h1><div class="qhead-code code">'+list.length+' cartes</div>';

    var d=buildDueQueue(list).length;
    var vus=list.filter(function(c){return (S.box[c.id]||0)>0;}).length;
    var maitr=list.filter(function(c){return (S.box[c.id]||0)>=4;}).length;
    h+='<div class="lab">Tableau de bord</div>';
    h+='<div class="stats stats-top">';
    h+='<div class="stat"><div class="num">'+d+'</div><div class="lbl">Cartes à revoir</div></div>';
    h+='<div class="stat"><div class="num">'+vus+'<span class="on">/'+list.length+'</span></div><div class="lbl">Vues</div></div>';
    h+='<div class="stat"><div class="num">'+maitr+'</div><div class="lbl">Maîtrisées</div></div>';
    h+='</div>';
    var runs=(S.cardRuns||[]).filter(function(r){return String(r.bloc)===String(numero);});
    if(runs.length){
      var best=runs.reduce(function(a,r){var p=r.ok/r.n;return p>a?p:a;},0);
      var avg=runs.reduce(function(a,r){return a+r.ok/r.n;},0)/runs.length;
      h+='<div class="stats stats-top">';
      h+='<div class="stat"><div class="num">'+runs.length+'</div><div class="lbl">Séries réalisées</div></div>';
      h+='<div class="stat"><div class="num">'+Math.round(best*100)+'<span class="on">%</span></div><div class="lbl">Meilleure série</div></div>';
      h+='<div class="stat"><div class="num">'+Math.round(avg*100)+'<span class="on">%</span></div><div class="lbl">Score moyen</div></div>';
      h+='</div>';
      h+='<div class="lab">Historique</div>';
      runs.slice(-8).reverse().forEach(function(r){
        h+='<div class="hrow"><span>'+r.d+'</span><b>'+r.ok+' / '+r.n+'</b></div>';
      });
    } else h+='<p class="rappel">Aucune série réalisée pour ce bloc pour l\'instant.</p>';

    h+='<div class="lab">Par sujet</div><div class="tiles">';
    (b.fiches||[]).forEach(function(rid){
      var r=(typeof RESUMES!=="undefined")?RESUMES[rid]:null;
      var n=list.filter(function(c){return c.resume===rid;}).length;
      if(!r || !n) return;
      h+='<button class="tile" data-flashcards-filter="resume:'+rid+'">';
      h+='<span class="tile-title">'+r.titre+'</span>';
      h+='<span class="tile-cas">'+n+' carte'+(n>1?'s':'')+'</span>';
      h+='</button>';
    });
    h+='</div>';

    h+='<div class="lab">Par type</div><div class="tiles">';
    Object.keys(TYPE_LABELS).forEach(function(t){
      var n=list.filter(function(c){return c.type===t;}).length;
      if(!n) return;
      h+='<button class="tile" data-flashcards-filter="type:'+t+':'+numero+'">';
      h+='<span class="tile-title">'+TYPE_LABELS[t]+'</span>';
      h+='<span class="tile-cas">'+n+' carte'+(n>1?'s':'')+'</span>';
      h+='</button>';
    });
    h+='</div>';
    return h;
  }

  function renderCardsSession(){
    var c=SES.list[SES.i];
    if(!c){
      return '<div class="done-msg"><b>Session terminée.</b> '+SES.ok+' sue'+(SES.ok>1?'s':'')+' sur '+SES.list.length+'.</div><button class="jadd" data-lrn="stop">Revenir</button>';
    }
    var h='<div class="prog">Carte '+(SES.i+1)+' sur '+SES.list.length+'</div>';
    h+='<div class="card'+(SES.show?'':' flip')+'"'+(SES.show?'':' data-lrn="show"')+'>';
    h+='<div class="cmeta"><span class="m-niveau n'+c.niveau+'">Niveau '+c.niveau+'</span><span class="m-section">'+esc(c.section)+'</span><span class="m-type t-'+c.type+'">'+(TYPE_LABELS[c.type]||c.type)+'</span></div>';
    if(SES.show){
      h+='<div class="cq-rappel">'+esc(cardRecto(c))+'</div>';
      h+='<div class="ca ca-center">'+esc(cardVerso(c)).replace(/\n/g,'<br>')+'</div>';
      h+='<div class="ca-tools">'+renderCoursLink(c)+
        '<button class="ca-tool" data-lrn="setaside-revoir" title="À modifier" aria-label="À modifier">'+ICON_PENCIL+'</button>'+
        '<button class="ca-tool" data-lrn="setaside-supprime" title="Supprimer" aria-label="Supprimer">'+ICON_TRASH+'</button></div>';
      h+='<div class="cbtns"><button class="no" data-lrn="ko">À revoir</button><button class="yes" data-lrn="ok">Je savais</button></div>';
    } else {
      h+='<div class="cq cq-center">'+esc(cardRecto(c))+'</div><div class="cflip-hint">Touche la carte pour voir la réponse</div>';
    }
    h+='</div><button class="quit" data-lrn="stop">Arrêter la session</button>';
    return h;
  }

  /* Lien vers le passage du résumé d'où vient la carte. Navigation sur place,
     jamais un nouvel onglet : l'application installée doit rester dans sa
     fenêtre. Quitter la série est assumé — le clic coupe la session. */
  function renderCoursLink(c){
    if(!c || !c.ancre) return "";
    var r=(typeof RESUMES!=="undefined")?RESUMES[c.resume]:null;
    if(!r) return "";
    var href=hashFor("coursResume", c.resume, c.ancre);
    var titre=r.titre+" · "+(c.secTitre||c.section||"");
    return '<a class="ca-cours" href="'+href+'" data-cours-lien="'+c.resume+'" data-cours-ancre="'+c.ancre+
      '" title="'+esc(titre)+' — quitte la série en cours">'+ICON_BOOK+
      '<span class="ca-cours-lab">Cours</span></a>';
  }

  var ICON_RETOUR='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
  var ICON_BOOK='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>';
  var ICON_PENCIL='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  var ICON_TRASH='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';
  var ICON_SEARCH='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';

  function cardSourceFile(c){
    var m=/^b(\d+)-/.exec(c.resume||"");
    return m ? ("cours:/bloc"+m[1]+":/flashcards:/cards-"+c.resume+".json") : (c.resume||"?");
  }
  function groupCardsBySource(cards){
    var groups=[], byKey={};
    cards.forEach(function(c){
      var src=cardSourceFile(c);
      if(!byKey[src]){ byKey[src]={src:src,cards:[]}; groups.push(byKey[src]); }
      byKey[src].cards.push(c);
    });
    return groups;
  }
  function copyListText(cards){
    return groupCardsBySource(cards).map(function(g){
      return g.src+"\n"+g.cards.map(function(c){
        if(!S.cardEdits[c.id]) return "  "+c.id;
        /* carte réécrite sur le site : on donne le nouveau texte pour pouvoir le
           reporter dans le .json source */
        return "  "+c.id+"\n    recto: "+cardRecto(c).replace(/\n/g," ")+
               "\n    verso: "+cardVerso(c).replace(/\n/g,"\\n");
      }).join("\n");
    }).join("\n\n");
  }
  function renderCardSortRow(c, actionsHtml, extraMeta, editable){
    var meta=esc(c.section);
    if(extraMeta) meta+=' &middot; '+extraMeta;
    if(S.cardEdits[c.id]) meta+=' &middot; <span class="cs-tag-edit">modifiée</span>';
    var h='<div class="cs-item"><div class="cs-row"><div class="cs-main"><div class="cs-meta">'+meta+'</div>'+
      '<div class="cs-recto">'+esc(cardRecto(c))+'</div>'+
      '<div class="cs-verso">'+esc(cardVerso(c)).replace(/\n/g,'<br>')+'</div></div>'+
      '<div class="cs-actions">'+actionsHtml+'</div></div>';
    if(editable) h+=renderCardEditor(c);
    return h+'</div>';
  }
  function renderCardEditor(c){
    var h='<div class="cs-edit" id="cs-edit-'+c.id+'" hidden>';
    h+='<label class="cs-edit-lab" for="cs-edit-recto-'+c.id+'">Recto — la question</label>';
    h+='<textarea class="f" id="cs-edit-recto-'+c.id+'" rows="2">'+esc(cardRecto(c))+'</textarea>';
    h+='<label class="cs-edit-lab" for="cs-edit-verso-'+c.id+'">Verso — la réponse</label>';
    h+='<textarea class="f" id="cs-edit-verso-'+c.id+'" rows="4">'+esc(cardVerso(c))+'</textarea>';
    h+='<div class="cs-edit-btns"><button class="jadd" data-cs-save="'+c.id+'">Enregistrer et réactiver</button>';
    h+='<button class="linkf" data-cs-save-only="'+c.id+'">Enregistrer sans réactiver</button>';
    if(S.cardEdits[c.id]) h+='<button class="linkf" data-cs-reset="'+c.id+'">Rétablir l\'original</button>';
    h+='<button class="linkf" data-cs-cancel="'+c.id+'">Annuler</button></div>';
    h+='<p class="cs-edit-note">La correction reste sur tes appareils (elle suit la synchro). Le fichier source du bloc n\'est pas touché : « Copier la liste » te redonne le nouveau texte pour le reporter plus tard.</p>';
    return h+'</div>';
  }
  function renderCardSortGroup(key, label, cards, copyKey){
    var h='<div class="cs-group"><div class="cs-group-head"><span class="cs-group-label">'+label+' &middot; '+cards.length+'</span>';
    if(cards.length) h+='<button class="linkf" data-cs-copy="'+copyKey+'">Copier la liste</button>';
    h+='</div>';
    if(!cards.length){
      h+='<p class="rappel">Rien ici.</p>';
    } else {
      cards.forEach(function(c){
        var actions, extraMeta="";
        if(key==="suggeree"){
          var fc=S.fail[c.id]||0;
          extraMeta=fc+' échec'+(fc>1?'s':'');
          actions='<button class="icon-btn" data-cs-set="'+c.id+':revoir" title="À modifier">'+ICON_PENCIL+'</button><button class="icon-btn" data-cs-set="'+c.id+':supprime" title="Supprimer">'+ICON_TRASH+'</button>';
        } else {
          var other=key==="revoir"?"supprime":"revoir";
          var otherIcon=key==="revoir"?ICON_TRASH:ICON_PENCIL;
          var otherTitle=key==="revoir"?"Supprimer":"À modifier";
          actions=(key==="revoir"?'<button data-cs-edit="'+c.id+'">Modifier</button>':'')+
            '<button data-cs-reactivate="'+c.id+'">Réactiver</button><button class="icon-btn" data-cs-set="'+c.id+':'+other+'" title="'+otherTitle+'">'+otherIcon+'</button>';
        }
        h+=renderCardSortRow(c, actions, extraMeta, key==="revoir");
      });
      h+='<textarea class="f cs-copybox" id="cs-copybox-'+copyKey+'" style="display:none" readonly>'+esc(copyListText(cards))+'</textarea>';
    }
    h+='</div>';
    return h;
  }
  function renderCardSortTile(){
    var revoir=FLASHCARDS.filter(function(c){return S.cardState[c.id]==="revoir";}).length;
    var supprime=FLASHCARDS.filter(function(c){return S.cardState[c.id]==="supprime";}).length;
    var suggeree=FLASHCARDS.filter(function(c){return !S.cardState[c.id] && (S.fail[c.id]||0)>=5;}).length;
    var parts=[];
    if(revoir) parts.push(revoir+' à modifier');
    if(supprime) parts.push(supprime+' supprimée'+(supprime>1?'s':''));
    if(suggeree) parts.push(suggeree+' suggérée'+(suggeree>1?'s':''));
    var h='<button class="tile" data-go="flashcardsSort">';
    h+='<span class="tile-code code">Tri</span>';
    h+='<span class="tile-title">Cartes mises de côté</span>';
    h+='<span class="tile-cas">'+(parts.length?parts.join(' &middot; '):'Rien pour l\'instant')+'</span>';
    h+='</button>';
    return h;
  }
  function vFlashcardsSort(){
    var revoir=FLASHCARDS.filter(function(c){return S.cardState[c.id]==="revoir";});
    var supprime=FLASHCARDS.filter(function(c){return S.cardState[c.id]==="supprime";});
    var suggeree=FLASHCARDS.filter(function(c){return !S.cardState[c.id] && (S.fail[c.id]||0)>=5;});
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Apprendre",view:"apprendre"},{label:"Flashcards",view:"flashcards"},{label:"Cartes mises de côté"}])+'</div>';
    h+='<h1 class="qhead-title">Cartes mises de côté</h1><div class="qhead-code code">À modifier, supprimées, ou repérées comme difficiles</div>';
    h+=renderCardSortGroup("revoir","À modifier",revoir,"revoir");
    h+=renderCardSortGroup("supprime","Supprimées",supprime,"supprime");
    h+=renderCardSortGroup("suggeree","Suggérées au tri",suggeree,"suggeree");
    return h;
  }

  var FORMAT_LABELS={qcm:"QCM",qcm_multiple:"QCM multiple",texte_a_trous:"Texte à trous",vrai_faux:"Vrai / Faux",appariement:"Appariement",ordonnancement:"Ordre",ouverte:"Question ouverte"};

  function avgPct(arr){ return arr.length? arr.reduce(function(a,r){return a+r.s/r.n;},0)/arr.length : null; }
  function quizTrend(runs){
    var n=runs.length, recentN=Math.min(5,n), recent=runs.slice(n-recentN);
    var prevN=Math.min(5,n-recentN);
    if(prevN<1) return null;
    var prev=runs.slice(n-recentN-prevN, n-recentN);
    return Math.round((avgPct(recent)-avgPct(prev))*100);
  }
  function renderQuizDashPanel(runs, withBlocCoverage, clickable){
    var scoreMoyen=avgPct(runs);
    var trend=quizTrend(runs);
    var last=runs.length?runs[runs.length-1]:null;
    var h='<div class="mini dash-panel'+(clickable?' clickable" data-go="quiz"':'"')+'><div class="lab">Tableau de bord'+(withBlocCoverage?' global':'')+'</div><div class="stats stats-top">';
    h+='<div class="stat"><div class="num">'+(scoreMoyen===null?'—':Math.round(scoreMoyen*100)+'<span class="on">%</span>')+'</div><div class="lbl">score moyen</div></div>';
    var trendCls=trend===null?'':(trend>2?' trend-up':(trend<-2?' trend-down':''));
    var trendTxt=trend===null?'—':((trend>0?'+':'')+trend+'<span class="on">pts</span>');
    var trendLbl=trend===null?'tendance':(trend>2?'en progression':(trend<-2?'en baisse':'stable'));
    h+='<div class="stat"><div class="num'+trendCls+'">'+trendTxt+'</div><div class="lbl">'+trendLbl+'</div></div>';
    if(withBlocCoverage){
      h+='<div class="stat"><div class="badge-stack">';
      (typeof COURS_BLOCS!=="undefined"?COURS_BLOCS:[]).forEach(function(b){
        var qn=QUIZ.filter(function(q){return q.bloc===b.numero;}).length;
        var br=S.quiz.filter(function(r){return String(r.bloc)===String(b.numero);});
        if(!qn) h+='<span class="stat-badge empty">Bloc '+b.numero+' &middot; à venir</span>';
        else if(!br.length) h+='<span class="stat-badge todo">Bloc '+b.numero+' &middot; pas testé</span>';
        else h+='<span class="stat-badge done">Bloc '+b.numero+' &middot; '+Math.round(avgPct(br)*100)+'%</span>';
      });
      h+='</div></div>';
    }
    h+='<div class="stat"><div class="num">'+(last?Math.round(last.s/last.n*100)+'<span class="on">%</span>':'—')+'</div><div class="lbl">dernier test</div>'+(last?'<div class="dash-sub">'+last.d+'</div>':'')+'</div>';
    h+='</div></div>';
    return h;
  }

  function vQuiz(){
    if(QZ) return renderQuizSession();
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Apprendre",view:"apprendre"},{label:"Quiz"}])+'</div>';
    h+='<h1 class="qhead-title">Quiz</h1><div class="qhead-code code">'+QUIZ.length+' questions</div>';
    h+='<div class="grid-cta-dash">';
    h+='<button class="tile cta-tile cta-quiz" data-quiz-random-all="10">10 questions au hasard<span class="cta-sub">tous les blocs</span></button>';
    h+=renderQuizDashPanel(S.quiz, true);
    h+='</div>';
    h+='<div class="lab">Par bloc</div><div class="tiles">';
    (typeof COURS_BLOCS!=="undefined"?COURS_BLOCS:[]).forEach(function(b){
      var n=QUIZ.filter(function(q){return q.bloc===b.numero;}).length;
      if(n){
        h+='<button class="tile" data-go-quiz-bloc="'+b.numero+'">';
        h+='<span class="tile-code code">Bloc '+b.numero+'</span>';
        h+='<span class="tile-title">'+b.court+'</span>';
        h+='<span class="tile-cas">'+n+' question'+(n>1?'s':'')+'</span>';
        h+='<span class="tile-quiz-btn" data-quiz-bloc-random="'+b.numero+':10">Lancer 10 questions</span>';
        h+='</button>';
      } else {
        h+='<div class="tile tile-empty">';
        h+='<span class="tile-code code">Bloc '+b.numero+'</span>';
        h+='<span class="tile-title">À venir</span>';
        h+='<span class="tile-cas">Pas encore de quiz</span>';
        h+='</div>';
      }
    });
    h+='</div>';
    if(S.quiz.length){
      h+='<div class="lab">Historique</div>';
      S.quiz.slice(-8).reverse().forEach(function(r){
        h+='<div class="hrow"><span>'+r.d+'</span><b>'+r.s+' / '+r.n+'</b></div>';
      });
    }
    return h;
  }

  function vQuizBloc(numero){
    if(QZ) return renderQuizSession();
    var b=(typeof COURS_BLOCS!=="undefined"?COURS_BLOCS:[]).filter(function(x){return String(x.numero)===String(numero);})[0];
    var list=QUIZ.filter(function(q){return String(q.bloc)===String(numero);});
    if(!b || !list.length){
      return '<div class="qbar">'+renderBreadcrumb([{label:"Apprendre",view:"apprendre"},{label:"Quiz",view:"quiz"}])+'</div><p class="rappel">Pas encore de quiz pour ce bloc.</p>';
    }
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Apprendre",view:"apprendre"},{label:"Quiz",view:"quiz"},{label:b.court}])+'</div>';
    h+='<h1 class="qhead-title">'+b.titre+'</h1><div class="qhead-code code">'+list.length+' questions</div>';

    var runs=S.quiz.filter(function(r){return String(r.bloc)===String(numero);});
    h+='<div class="dash-row">'+renderQuizDashPanel(runs, false)+'</div>';
    if(runs.length){
      h+='<div class="lab">Historique</div>';
      runs.slice(-8).reverse().forEach(function(r){
        h+='<div class="hrow"><span>'+r.d+'</span><b>'+r.s+' / '+r.n+'</b></div>';
      });
    } else h+='<p class="rappel">Aucune série réalisée pour ce bloc pour l\'instant.</p>';

    h+='<div class="lab">Lancer une série</div><div class="states">';
    h+='<button data-quiz-bloc-random="'+numero+':10">10 questions au hasard</button>';
    h+='<button data-quiz-bloc-random="'+numero+':'+list.length+'">Toutes ('+list.length+')</button></div>';

    h+='<div class="lab">Par notion</div><div class="tiles">';
    (b.fiches||[]).forEach(function(rid){
      var r=(typeof RESUMES!=="undefined")?RESUMES[rid]:null;
      var n=list.filter(function(q){return q.resume===rid;}).length;
      var vu=list.filter(function(q){return q.resume===rid && S.quizSeen[q.id];}).length;
      if(!r || !n) return;
      h+='<button class="tile" data-quiz-filter="resume:'+rid+'">';
      h+='<span class="tile-title">'+r.titre+'</span>';
      h+='<span class="tile-cas">'+vu+'/'+n+' question'+(n>1?'s':'')+' vue'+(n>1?'s':'')+'</span>';
      h+='</button>';
    });
    h+='</div>';

    h+='<div class="lab">Par format</div><div class="tiles">';
    Object.keys(FORMAT_LABELS).forEach(function(fmt){
      var n=list.filter(function(q){return q.format===fmt;}).length;
      if(!n) return;
      h+='<button class="tile" data-quiz-filter="format:'+fmt+':'+numero+'">';
      h+='<span class="tile-title">'+FORMAT_LABELS[fmt]+'</span>';
      h+='<span class="tile-cas">'+n+' question'+(n>1?'s':'')+'</span>';
      h+='</button>';
    });
    h+='</div>';
    return h;
  }

  function initQuizInput(q){
    if(!q) return null;
    if(q.format==="qcm_multiple") return [];
    if(q.format==="texte_a_trous") return q.trous.map(function(){return "";});
    if(q.format==="appariement") return q.colonne_a.map(function(){return null;});
    if(q.format==="ordonnancement") return shuffle(q.elements.map(function(_,i){return i;}));
    if(q.format==="ouverte") return {show:false,text:""};
    return null;
  }

  function finishCardSessionIfDone(){
    if(SES.i>=SES.list.length){
      S.cardRuns=S.cardRuns||[];
      var blocs={}; SES.list.forEach(function(c){ blocs[c.bloc]=true; });
      var blocKeys=Object.keys(blocs);
      S.cardRuns.push({d:new Date().toLocaleDateString("fr-FR"),t:Date.now(),ok:SES.ok,n:SES.list.length,bloc:blocKeys.length===1?blocKeys[0]:null});
      save();
    }
  }

  function finishQuizQuestion(correct){
    QZ.checked=true;
    var q=QZ.list[QZ.i];
    S.quizSeen[q.id]=true;
    if(correct) QZ.ok++; else QZ.wrong.push(q.question);
    if(QZ.i===QZ.list.length-1){ S.quiz.push({d:new Date().toLocaleDateString("fr-FR"),t:Date.now(),s:QZ.ok,n:QZ.list.length,bloc:QZ.list[0].bloc}); }
    save();
  }

  function renderBlanksText(texte, values, checked, trous){
    return esc(texte).replace(/\{(\d+)\}/g, function(_, n){
      var idx=parseInt(n,10)-1;
      if(checked){
        var val=(values[idx]||"").trim();
        var ok=val.toLowerCase()===String(trous[idx]||"").trim().toLowerCase();
        return '<b class="blank-res '+(ok?'good':'bad')+'">'+(val?esc(val):'&mdash;')+(ok?'':' <i>('+esc(trous[idx])+')</i>')+'</b>';
      }
      return '<input class="blank-input" data-qz-blank="'+idx+'" value="'+esc(values[idx]||"")+'">';
    });
  }

  function renderQuizBody(q){
    var h="";
    if(q.format==="qcm"){
      h+='<div class="opts">';
      q.options.forEach(function(o,k){
        var cls=""; if(QZ.checked){ if(k===q.reponse) cls=" good"; else if(k===QZ.input) cls=" bad"; }
        h+='<button class="opt'+cls+'" data-qz-opt="'+k+'"'+(QZ.checked?' disabled':'')+'>'+esc(o)+'</button>';
      });
      h+='</div>';
    } else if(q.format==="vrai_faux"){
      h+='<div class="opts">';
      [true,false].forEach(function(v){
        var cls=""; if(QZ.checked){ if(v===q.reponse) cls=" good"; else if(v===QZ.input) cls=" bad"; }
        h+='<button class="opt'+cls+'" data-qz-vf="'+v+'"'+(QZ.checked?' disabled':'')+'>'+(v?"Vrai":"Faux")+'</button>';
      });
      h+='</div>';
    } else if(q.format==="qcm_multiple"){
      h+='<div class="opts">';
      q.options.forEach(function(o,k){
        var sel=QZ.input.indexOf(k)>=0;
        var cls=""; if(QZ.checked){ if(q.reponse.indexOf(k)>=0) cls=" good"; else if(sel) cls=" bad"; } else if(sel) cls=" sel";
        h+='<button class="opt'+cls+'" data-qz-multi="'+k+'"'+(QZ.checked?' disabled':'')+'>'+(sel?"&#9745; ":"&#9744; ")+esc(o)+'</button>';
      });
      h+='</div>';
      if(!QZ.checked) h+='<button class="jadd" data-qz-validate>Valider</button>';
    } else if(q.format==="texte_a_trous"){
      h+='<div class="blanks">'+renderBlanksText(q.texte, QZ.input, QZ.checked, q.trous)+'</div>';
      if(q.propositions && q.propositions.length && !QZ.checked){
        h+='<p class="rappel">Mots proposés : '+q.propositions.map(esc).join(' &middot; ')+'</p>';
      }
      if(!QZ.checked) h+='<button class="jadd" data-qz-validate>Valider</button>';
    } else if(q.format==="appariement"){
      var correctMap={}; (q.paires||[]).forEach(function(p){correctMap[p[0]]=p[1];});
      h+='<div class="match-list">';
      q.colonne_a.forEach(function(a,i){
        h+='<div class="match-row"><span class="match-a">'+esc(a)+'</span>';
        h+='<select class="match-select" data-qz-match="'+i+'"'+(QZ.checked?' disabled':'')+'><option value="">—</option>';
        q.colonne_b.forEach(function(b,j){
          h+='<option value="'+j+'"'+(QZ.input[i]===j?' selected':'')+'>'+esc(b)+'</option>';
        });
        h+='</select>';
        if(QZ.checked){
          var ok=QZ.input[i]===correctMap[i];
          h+='<span class="match-mark '+(ok?'good':'bad')+'">'+(ok?'&#10003;':'&#10007;')+'</span>';
        }
        h+='</div>';
      });
      h+='</div>';
      if(QZ.checked){
        h+='<p class="rappel">Corrigé : '+q.colonne_a.map(function(a,i){return esc(a)+' &rarr; '+esc(q.colonne_b[correctMap[i]]);}).join(' &middot; ')+'</p>';
      } else h+='<button class="jadd" data-qz-validate>Valider</button>';
    } else if(q.format==="ordonnancement"){
      h+='<div class="order-list">';
      QZ.input.forEach(function(elIdx,pos){
        var ok = QZ.checked ? (q.ordre[pos]===elIdx) : null;
        h+='<div class="order-row'+(QZ.checked?(ok?' good':' bad'):'')+'"><span class="order-num code">'+(pos+1)+'</span><span class="order-text">'+esc(q.elements[elIdx])+'</span>';
        if(!QZ.checked){
          h+='<span class="order-btns"><button class="order-btn" data-qz-move="'+pos+':up"'+(pos===0?' disabled':'')+'>&uarr;</button>';
          h+='<button class="order-btn" data-qz-move="'+pos+':down"'+(pos===QZ.input.length-1?' disabled':'')+'>&darr;</button></span>';
        } else h+='<span class="order-mark">'+(ok?'&#10003;':'&#10007;')+'</span>';
        h+='</div>';
      });
      h+='</div>';
      if(!QZ.checked) h+='<button class="jadd" data-qz-validate>Valider l\'ordre</button>';
    } else if(q.format==="ouverte"){
      if(!QZ.input.show){
        h+='<textarea class="f big" placeholder="Note ta réponse ici (facultatif)" data-qz-open-text>'+esc(QZ.input.text||"")+'</textarea>';
        h+='<button class="jadd" data-qz-open-reveal>Voir les attendus</button>';
      } else {
        h+='<div class="lab">Attendus</div><ul class="att">';
        q.attendus.forEach(function(a){h+='<li>'+esc(a)+'</li>';});
        h+='</ul>';
        if(!QZ.checked) h+='<div class="cbtns"><button class="no" data-qz-open-grade="ko">À revoir</button><button class="yes" data-qz-open-grade="ok">Je savais</button></div>';
      }
    }
    return h;
  }

  function renderQuizSession(){
    if(QZ.i>=QZ.list.length){
      var pct=Math.round(100*QZ.ok/QZ.list.length);
      var h='<div class="done-msg"><b>'+QZ.ok+' / '+QZ.list.length+'</b> — '+pct+' % de bonnes réponses.</div>';
      if(QZ.wrong.length){ h+='<div class="lab">À retravailler</div><ul class="att">'; QZ.wrong.forEach(function(w){h+='<li>'+esc(w)+'</li>';}); h+='</ul>'; }
      h+='<button class="jadd" data-lrn="qstop">Revenir</button>';
      return h;
    }
    var q=QZ.list[QZ.i];
    var h='<div class="prog">Question '+(QZ.i+1)+' sur '+QZ.list.length+' &middot; score '+QZ.ok+'</div>';
    h+='<div class="card qz-card"><div class="cmeta"><span class="m-niveau n'+q.niveau+'">Niveau '+q.niveau+'</span><span class="m-section">'+esc(q.section)+'</span><span class="m-section">'+(FORMAT_LABELS[q.format]||q.format)+'</span></div>';
    h+='<div class="cq">'+esc(q.question)+'</div>';
    h+=renderQuizBody(q);
    if(QZ.checked) h+='<div class="expl">'+esc(q.explication||'')+'</div><div class="cbtns"><button class="yes" data-lrn="qnext">Suivante</button></div>';
    h+='</div><button class="quit" data-lrn="qstop">Arrêter le quiz</button>';
    return h;
  }

  /* ---------- CARTES MENTALES ----------
     Une carte = un titre, un bloc et un plan indenté. Le dessin est toujours
     recalculé depuis le plan : rien n'est positionné à la main, donc rien ne se
     désaligne. S.cartes[id] = {t, bloc, txt, plie:{path:true}, at}. */
  var CARTE_EX="Diagnostic\n  Externe\n    PESTEL\n    5 forces de Porter\n  Interne\n    Ressources\n    Compétences clés\nCibles\n  Personas\n  Segments prioritaires\nPositionnement\n  Promesse\n  Preuves";

  function cartesTriees(){
    return Object.keys(S.cartes||{}).map(function(id){
      var c=S.cartes[id]; return {id:id, t:c.t, bloc:c.bloc, txt:c.txt, at:c.at||0};
    }).sort(function(a,b){ return (b.at||0)-(a.at||0); });
  }
  function nouvelleCarte(bloc){
    var id="mm"+Date.now().toString(36);
    S.cartes[id]={t:"Nouvelle carte", bloc:bloc||null, txt:"", plie:{}, at:Date.now()};
    save();
    return id;
  }
  function nbIdees(txt){
    return String(txt||"").split(/\r?\n/).filter(function(l){ return l.trim(); }).length;
  }
  /* Les blocs viennent des dossiers, pas du contenu de cours : on peut faire une
     carte sur le Bloc 3 avant d'en avoir écrit le moindre résumé. L'ordre est
     celui de travail (1, 2, 4, 3), comme partout ailleurs. */
  function blocsCartes(){
    return BLOCS.map(function(b){
      return {numero:parseInt(String(b.id).replace(/\D/g,""),10), code:b.code, titre:b.titre};
    });
  }
  /* Les résumés d'un bloc, dans l'ordre du cours. Un bloc sans contenu (B3, B4
     aujourd'hui) renvoie une liste vide : le choix de résumé disparaît alors. */
  function resumesDuBloc(numero){
    var cb=(typeof COURS_BLOCS!=="undefined"?COURS_BLOCS:[]).filter(function(x){ return String(x.numero)===String(numero); })[0];
    if(!cb || typeof RESUMES==="undefined") return [];
    return (cb.fiches||[]).map(function(id){ return RESUMES[id]; }).filter(Boolean);
  }
  function resumeDeLaCarte(c){
    if(!c || !c.resume || typeof RESUMES==="undefined") return null;
    return RESUMES[c.resume]||null;
  }

  /* Racine : deux portes, écrire ou relire. Rien d'autre à décider ici. */
  function vCartes(){
    var liste=cartesTriees();
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Apprendre",view:"apprendre"},{label:"Cartes mentales"}])+'</div>';
    h+='<h1 class="qhead-title">Cartes mentales</h1><div class="qhead-code code">'+liste.length+' carte'+(liste.length>1?'s':'')+'</div>';
    h+='<div class="mm-portes">';
    h+='<button class="tile cta-tile cta-mm" data-mm-new="0">Nouvelle carte'+
       '<span class="cta-sub">Tu écris un plan, la carte se dessine</span></button>';
    h+='<button class="tile cta-tile cta-mm-liste" data-go="cartesListe">Mes cartes'+
       '<span class="cta-sub">'+(liste.length?'Rangées par bloc':'Rien à relire pour l\'instant')+'</span></button>';
    h+='</div>';
    return h;
  }

  /* Les blocs, comme partout ailleurs sur le site : une tuile par bloc, et le
     fourre-tout « Sans bloc » seulement s'il contient quelque chose. */
  function vCartesListe(){
    var liste=cartesTriees();
    var blocs=blocsCartes();
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Cartes mentales",view:"cartes"},{label:"Mes cartes"}])+'</div>';
    h+='<h1 class="qhead-title">Mes cartes</h1><div class="qhead-code code">'+liste.length+' carte'+(liste.length>1?'s':'')+'</div>';
    h+='<div class="tiles">';
    blocs.forEach(function(b){
      var n=liste.filter(function(c){ return String(c.bloc)===String(b.numero); }).length;
      h+='<button class="tile" data-go-cartes-bloc="'+b.numero+'">';
      h+='<span class="tile-code code">'+esc(b.code)+'</span>';
      h+='<span class="tile-title">'+esc(b.titre)+'</span>';
      h+='<span class="tile-cas">'+(n?n+' carte'+(n>1?'s':''):'Aucune carte')+'</span>';
      h+='</button>';
    });
    var sans=liste.filter(function(c){
      return !blocs.some(function(b){ return String(c.bloc)===String(b.numero); });
    }).length;
    if(sans){
      h+='<button class="tile" data-go-cartes-bloc="sans">';
      h+='<span class="tile-code code">Hors bloc</span>';
      h+='<span class="tile-title">Sans bloc</span>';
      h+='<span class="tile-cas">'+sans+' carte'+(sans>1?'s':'')+'</span>';
      h+='</button>';
    }
    h+='</div>';
    return h;
  }

  function vCartesBloc(numero){
    var blocs=blocsCartes();
    var b=blocs.filter(function(x){ return String(x.numero)===String(numero); })[0];
    var liste=cartesTriees().filter(function(c){
      return b ? String(c.bloc)===String(b.numero)
               : !blocs.some(function(x){ return String(c.bloc)===String(x.numero); });
    });
    var titre=b?b.titre:"Sans bloc";
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Cartes mentales",view:"cartes"},{label:"Mes cartes",view:"cartesListe"},{label:esc(titre)}])+'</div>';
    h+='<h1 class="qhead-title">'+esc(titre)+'</h1><div class="qhead-code code">'+(b?esc(b.code)+' &middot; ':'')+liste.length+' carte'+(liste.length>1?'s':'')+'</div>';
    if(b) h+='<button class="jadd" data-mm-new="'+b.numero+'">Nouvelle carte dans ce bloc</button>';
    if(!liste.length){
      h+='<div class="tile tile-empty mm-vide"><span class="tile-title">Aucune carte ici</span>'+
         '<span class="tile-cas">'+(b?'La prochaine sera rattachée à ce bloc.':'Les cartes sans bloc apparaîtront ici.')+'</span></div>';
      return h;
    }
    h+='<div class="tiles">';
    liste.forEach(function(c){
      var n=nbIdees(c.txt);
      h+='<button class="tile mm-tuile" data-go-carte="'+c.id+'">';
      h+='<span class="tile-title">'+esc(c.t)+'</span>';
      h+='<span class="tile-cas">'+(n?n+' idée'+(n>1?'s':''):'Plan vide')+'</span>';
      h+='</button>';
    });
    h+='</div>';
    return h;
  }

  /* La carte seule : rien d'autre à l'écran que le dessin, un retour et un
     bouton Modifier. C'est l'écran de révision, pas l'établi. */
  function vCarte(id){
    var c=S.cartes[id];
    if(!c) return '<div class="qbar">'+renderBreadcrumb([{label:"Apprendre",view:"apprendre"},{label:"Cartes mentales",view:"cartes"}])+'</div><div class="mm-intro">Cette carte n\'existe plus.</div>';
    var h='<div class="mmv-bar">';
    h+='<button class="mmv-retour" data-crumb="cartes" title="Toutes les cartes">'+ICON_RETOUR+'</button>';
    h+='<span class="mmv-titre">'+esc(c.t)+'</span>';
    h+='<div class="mm-zoom mmv-zoom"><button class="mm-onglet on" data-mm-zoom="ajuste">Ajuster</button>'+
       '<button class="mm-onglet" data-mm-zoom="plein">100 %</button></div>';
    var r=resumeDeLaCarte(c);
    if(r) h+='<button class="mmv-edit mmv-cours" data-go-resume="'+r.id+'" title="'+esc(r.titre)+'">'+ICON_BOOK+'<span>Cours</span></button>';
    h+='<button class="mmv-edit" data-mm-edit="'+id+'">'+ICON_PENCIL+'<span>Modifier</span></button>';
    h+='<button class="mmv-edit mmv-del" data-mm-del="'+id+'" title="Supprimer la carte">'+ICON_TRASH+'</button>';
    h+='</div>';
    h+='<div class="mm-canvas mmv-canvas mm-ajuste" id="mmCanvas"></div>';
    return h;
  }

  /* L'établi : le plan, ses outils, et l'aperçu qui suit la frappe. */
  function vCarteEdit(id){
    var c=S.cartes[id];
    if(!c) return '<div class="qbar">'+renderBreadcrumb([{label:"Apprendre",view:"apprendre"},{label:"Cartes mentales",view:"cartes"}])+'</div><div class="mm-intro">Cette carte n\'existe plus.</div>';
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Cartes mentales",view:"cartes"},{label:esc(c.t),view:"carte",param:id},{label:"Modifier"}])+'</div>';
    h+='<div class="mm-head">';
    h+='<input class="mm-titre" id="mmTitre" value="'+esc(c.t)+'" aria-label="Titre de la carte">';
    h+='<select class="mm-bloc" id="mmBloc" aria-label="Bloc de rattachement"><option value="">Sans bloc</option>';
    blocsCartes().forEach(function(b){
      h+='<option value="'+b.numero+'"'+(String(c.bloc)===String(b.numero)?' selected':'')+'>'+esc(b.code)+' — '+esc(b.titre)+'</option>';
    });
    h+='</select>';
    h+='<button class="mm-sup" data-mm-del="'+id+'" title="Supprimer la carte">'+ICON_TRASH+'</button>';
    h+='<button class="jadd mm-fini" data-mm-voir="'+id+'">Voir la carte</button>';
    h+='</div>';
    /* Rattacher un résumé donne à la carte un aller direct vers le cours dont
       elle sort. Le choix n'apparaît qu'une fois le bloc connu. */
    var res=resumesDuBloc(c.bloc);
    if(res.length){
      h+='<div class="mm-lien-cours"><label class="mm-lab" for="mmResume">Résumé lié</label>';
      h+='<select class="mm-bloc" id="mmResume"><option value="">Aucun</option>';
      res.forEach(function(r){
        h+='<option value="'+r.id+'"'+(c.resume===r.id?' selected':'')+'>'+esc(r.titre)+'</option>';
      });
      h+='</select></div>';
    } else if(c.bloc){
      h+='<div class="mm-lien-cours mm-lien-vide">Pas encore de résumé de cours sur ce bloc.</div>';
    }
    /* Bascule plan / aperçu : sur téléphone une seule des deux colonnes tient à
       l'écran, sur grand écran les deux cohabitent et la bascule disparaît. */
    h+='<div class="mm-onglets"><button class="mm-onglet on" data-mm-vue="plan">Plan</button><button class="mm-onglet" data-mm-vue="carte">Aperçu</button></div>';
    h+='<div class="mm-grid" id="mmGrid">';
    h+='<div class="mm-col mm-col-plan">';
    h+='<textarea class="mm-txt-in" id="mmTxt" spellcheck="false" placeholder="Une idée par ligne. Deux espaces pour la rattacher à celle du dessus.">'+esc(c.txt||"")+'</textarea>';
    h+='<div class="mm-outils"><button class="mm-out" data-mm-indent="1" title="Décaler à droite">&rarr;</button>'+
       '<button class="mm-out" data-mm-indent="-1" title="Décaler à gauche">&larr;</button>'+
       (c.txt?'':'<button class="mm-out mm-out-ex" data-mm-exemple="1">Partir d\'un exemple</button>')+
       '</div>';
    h+='</div>';
    h+='<div class="mm-col mm-col-carte">';
    h+='<div class="mm-zoom"><button class="mm-onglet on" data-mm-zoom="ajuste">Ajuster</button>'+
       '<button class="mm-onglet" data-mm-zoom="plein">100 %</button></div>';
    h+='<div class="mm-canvas mm-ajuste" id="mmCanvas"></div>'+
       '<div class="mm-aide">Touche une idée pour replier ou déplier sa branche.</div></div>';
    h+='</div>';
    return h;
  }

  /* Le dessin ne passe pas par render() : re-rendre la page à chaque frappe
     ferait perdre le curseur dans le textarea. On remplace le seul SVG. */
  function dessineCarte(id){
    var c=S.cartes[id];
    var box=document.getElementById("mmCanvas");
    if(!c || !box || typeof CARTES==="undefined") return;
    var arbre=CARTES.parse(c.txt, c.t);
    if(!arbre.k.length){
      box.innerHTML='<div class="mm-canvas-vide">La carte apparaît ici dès la première ligne du plan.</div>';
      return;
    }
    box.innerHTML=CARTES.svg(arbre, c.plie||{});
    box.querySelectorAll("[data-mm-path]").forEach(function(g){
      g.addEventListener("click",function(){
        var p=g.getAttribute("data-mm-path");
        if(!c.plie) c.plie={};
        if(c.plie[p]) delete c.plie[p]; else c.plie[p]=true;
        save();
        dessineCarte(id);
      });
    });
  }

  /* Décale les lignes couvertes par la sélection : c'est l'opération de base
     d'un plan, elle doit marcher à la tabulation comme au bouton du pouce. */
  function decale(ta, sens){
    var v=ta.value, s=ta.selectionStart, e=ta.selectionEnd;
    var deb=v.lastIndexOf("\n", s-1)+1;
    var fin=v.indexOf("\n", e); if(fin<0) fin=v.length;
    var avant=v.slice(deb,fin), lignes=avant.split("\n"), delta0=0, total=0;
    var apres=lignes.map(function(l,i){
      var n;
      if(sens>0){ n="  "+l; }
      else { n=l.replace(/^ {1,2}/,""); }
      var d=n.length-l.length;
      if(i===0) delta0=d;
      total+=d;
      return n;
    }).join("\n");
    ta.value=v.slice(0,deb)+apres+v.slice(fin);
    ta.selectionStart=Math.max(deb, s+delta0);
    ta.selectionEnd=Math.max(ta.selectionStart, e+total);
  }

  function bindCartes(){
    /* Une carte neuve n'a rien à montrer : on ouvre directement l'établi.
       Créée depuis un bloc, elle en hérite — un réglage de moins à faire. */
    main.querySelectorAll("[data-mm-new]").forEach(function(el){
      el.addEventListener("click",function(e){
        e.stopPropagation();
        var b=parseInt(el.getAttribute("data-mm-new"),10);
        go("carteEdit", nouvelleCarte(b>0?b:null));
      });
    });
    main.querySelectorAll("[data-go-cartes-bloc]").forEach(function(el){
      el.addEventListener("click",function(){ go("cartesBloc", el.getAttribute("data-go-cartes-bloc")); });
    });
    main.querySelectorAll("[data-go-carte]").forEach(function(el){
      el.addEventListener("click",function(){ go("carte", el.getAttribute("data-go-carte")); });
    });
    main.querySelectorAll("[data-mm-edit]").forEach(function(el){
      el.addEventListener("click",function(){ go("carteEdit", el.getAttribute("data-mm-edit")); });
    });
    main.querySelectorAll("[data-mm-voir]").forEach(function(el){
      el.addEventListener("click",function(){ go("carte", el.getAttribute("data-mm-voir")); });
    });
    main.querySelectorAll("[data-mm-del]").forEach(function(el){
      el.addEventListener("click",function(){
        var id=el.getAttribute("data-mm-del");
        var c=S.cartes[id];
        if(!confirm("Supprimer « "+((c&&c.t)||"cette carte")+" » ? C'est définitif.")) return;
        delete S.cartes[id]; save(); go("cartes");
      });
    });
    if(ROUTE.view!=="carte" && ROUTE.view!=="carteEdit") return;
    var id=ROUTE.id, c=S.cartes[id];
    if(!c) return;
    main.querySelectorAll("[data-mm-zoom]").forEach(function(el){
      el.addEventListener("click",function(){
        var box=document.getElementById("mmCanvas");
        if(box) box.classList.toggle("mm-ajuste", el.getAttribute("data-mm-zoom")==="ajuste");
        main.querySelectorAll("[data-mm-zoom]").forEach(function(b){ b.classList.toggle("on", b===el); });
      });
    });
    if(ROUTE.view!=="carteEdit") return;
    var titre=document.getElementById("mmTitre");
    if(titre) titre.addEventListener("input",function(){
      c.t=titre.value.trim()||"Sans titre"; c.at=Date.now(); save(); dessineCarte(id); updateTitle();
    });
    var bloc=document.getElementById("mmBloc");
    if(bloc) bloc.addEventListener("change",function(){
      c.bloc=bloc.value?parseInt(bloc.value,10):null;
      /* un résumé d'un autre bloc n'aurait plus de sens : on le détache */
      if(c.resume && !resumesDuBloc(c.bloc).some(function(r){ return r.id===c.resume; })) delete c.resume;
      c.at=Date.now(); save();
      render();
    });
    var res=document.getElementById("mmResume");
    if(res) res.addEventListener("change",function(){
      if(res.value) c.resume=res.value; else delete c.resume;
      c.at=Date.now(); save();
    });
    var ta=document.getElementById("mmTxt");
    if(ta){
      ta.addEventListener("input",function(){ c.txt=ta.value; c.at=Date.now(); save(); dessineCarte(id); });
      ta.addEventListener("keydown",function(e){
        if(e.key==="Tab"){
          e.preventDefault();
          decale(ta, e.shiftKey?-1:1);
          c.txt=ta.value; save(); dessineCarte(id);
        } else if(e.key==="Enter"){
          /* la nouvelle ligne reprend l'indentation : sans ça, chaque idée
             sœur demande de retaper les espaces */
          var v=ta.value, s=ta.selectionStart;
          var deb=v.lastIndexOf("\n", s-1)+1;
          var creux=(v.slice(deb,s).match(/^ */)||[""])[0];
          if(!creux) return;
          e.preventDefault();
          ta.value=v.slice(0,s)+"\n"+creux+v.slice(ta.selectionEnd);
          ta.selectionStart=ta.selectionEnd=s+1+creux.length;
          c.txt=ta.value; save(); dessineCarte(id);
        }
      });
    }
    main.querySelectorAll("[data-mm-indent]").forEach(function(el){
      el.addEventListener("click",function(){
        if(!ta) return;
        ta.focus();
        decale(ta, parseInt(el.getAttribute("data-mm-indent"),10));
        c.txt=ta.value; save(); dessineCarte(id);
      });
    });
    main.querySelectorAll("[data-mm-exemple]").forEach(function(el){
      el.addEventListener("click",function(){
        c.txt=CARTE_EX; c.at=Date.now(); save(); render();
      });
    });
    main.querySelectorAll("[data-mm-vue]").forEach(function(el){
      el.addEventListener("click",function(){
        var vue=el.getAttribute("data-mm-vue");
        var grid=document.getElementById("mmGrid");
        if(grid) grid.classList.toggle("montre-carte", vue==="carte");
        main.querySelectorAll("[data-mm-vue]").forEach(function(b){ b.classList.toggle("on", b===el); });
      });
    });
  }

  /* ---------- MEMO ---------- */
  /* ---------- COURS ---------- */
  function normTok(s){
    return String(s||"").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  }
  function luEtat(id){ return S.coursLu[id]||"nonlu"; }
  function luChip(id){
    var st=luEtat(id);
    if(st==="nonlu") return "";
    return '<span class="chip'+(st==="lu"?" done":" wip")+'">'+(st==="lu"?"lu":"en cours")+'</span>';
  }
  function renderLuBadge(id){
    var st=luEtat(id);
    var lbl=st==="lu"?"Lu":st==="wip"?"En cours":"Pas encore lu";
    return '<button class="lu-badge st-'+st+'" data-lu-cycle="'+id+'">'+lbl+'</button>';
  }
  function luCount(ids){
    return (ids||[]).filter(function(id){ return luEtat(id)==="lu"; }).length;
  }
  function allResumesOrdered(){
    var out=[];
    (typeof COURS_BLOCS!=="undefined"?COURS_BLOCS:[]).forEach(function(b){
      if(b.statut!=="complet") return;
      b.fiches.map(function(id){ return (typeof RESUMES!=="undefined")?RESUMES[id]:null; })
        .filter(Boolean)
        .sort(function(a,c){ return a.ordre-c.ordre; })
        .forEach(function(r){ out.push(r); });
    });
    return out;
  }
  function nextResumeToRead(){
    var all=allResumesOrdered();
    return all.filter(function(r){ return luEtat(r.id)==="wip"; })[0]
        || all.filter(function(r){ return luEtat(r.id)==="nonlu"; })[0]
        || null;
  }

  /* ---------- RECHERCHE ---------- */
  function stripHtml(s){
    return String(s||"").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim();
  }
  function normCharMap(s){
    var norm="", map=[];
    for(var i=0;i<s.length;i++){
      var n=s.charAt(i).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      for(var j=0;j<n.length;j++){ norm+=n[j]; map.push(i); }
    }
    return {norm:norm, map:map};
  }
  function jumpToTerm(term){
    var normTerm=normTok(term);
    if(!normTerm) return false;
    var walker=document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
      acceptNode:function(node){
        var p=node.parentNode;
        if(!p) return NodeFilter.FILTER_REJECT;
        var tag=p.nodeName;
        if(tag==="SCRIPT"||tag==="STYLE"||tag==="TEXTAREA") return NodeFilter.FILTER_REJECT;
        if(!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while((node=walker.nextNode())){
      var text=node.nodeValue;
      var nm=normCharMap(text);
      var idx=nm.norm.indexOf(normTerm);
      if(idx<0) continue;
      var startOrig=nm.map[idx];
      var endIdx=idx+normTerm.length-1;
      var endOrig=(endIdx<nm.map.length)? nm.map[endIdx]+1 : text.length;
      var range=document.createRange();
      range.setStart(node,startOrig);
      range.setEnd(node,endOrig);
      var markEl=document.createElement("mark");
      markEl.className="jump-highlight";
      try{ range.surroundContents(markEl); }catch(e){ continue; }
      var details=markEl.closest("details");
      if(details) details.open=true;
      markEl.scrollIntoView({block:"center", behavior:"smooth"});
      setTimeout(function(){ markEl.classList.add("jump-fade"); },1200);
      return true;
    }
    return false;
  }
  var SEARCH_INDEX=null;
  function buildSearchIndex(){
    if(SEARCH_INDEX) return SEARCH_INDEX;
    var idx=[];
    ALL.forEach(function(q){
      var inf=INFO[q.id]||{};
      var text=[q.t, q.c, inf.enonce, (inf[0]||[]).join(" "), (inf[1]||[]).join(" "), (q.k||[]).join(" ")].join(" ");
      var stripped=stripHtml(text);
      idx.push({type:"question", qid:q.id, q:q, title:q.t, stripped:stripped, haystack:normTok(stripped)});
    });
    if(typeof RESUMES!=="undefined"){
      Object.keys(RESUMES).forEach(function(id){
        var r=RESUMES[id];
        var stripped=stripHtml([r.titre, r.accroche, r.html].join(" "));
        idx.push({type:"resume", id:id, bloc:"b"+r.bloc, title:r.titre, stripped:stripped, haystack:normTok(stripped)});
      });
    }
    if(typeof QUESTIONS_COURS!=="undefined"){
      Object.keys(QUESTIONS_COURS).forEach(function(qid){
        var qc=QUESTIONS_COURS[qid];
        var stripped=stripHtml([qc.titre, qc.html].join(" "));
        idx.push({type:"questionCours", qid:qid, bloc:"b"+qc.bloc, title:qc.titre, stripped:stripped, haystack:normTok(stripped)});
      });
    }
    if(typeof ANNEXES!=="undefined"){
      Object.keys(ANNEXES).forEach(function(blocId){
        ANNEXES[blocId].forEach(function(a){
          var stripped=stripHtml([a.titre, a.contenu, a.utile].join(" "));
          idx.push({type:"annexe", bloc:blocId, n:a.n, title:a.titre, stripped:stripped, haystack:normTok(stripped)});
        });
      });
    }
    SEARCH_INDEX=idx;
    return idx;
  }
  function searchIndex(term){
    var norm=normTok(term);
    if(!norm) return [];
    return buildSearchIndex().filter(function(e){ return e.haystack.indexOf(norm)>=0; });
  }
  function excerptFor(entry, normTerm, termLen){
    var idx=entry.haystack.indexOf(normTerm);
    if(idx<0) return esc(entry.stripped.slice(0,120));
    var start=Math.max(0, idx-60), end=Math.min(entry.stripped.length, idx+termLen+60);
    var pre=esc(entry.stripped.slice(start, idx));
    var mid=esc(entry.stripped.slice(idx, idx+termLen));
    var post=esc(entry.stripped.slice(idx+termLen, end));
    return (start>0?"\u2026 ":"")+pre+"<mark>"+mid+"</mark>"+post+(end<entry.stripped.length?" \u2026":"");
  }
  function firstQuestionForAnnexe(blocId, n){
    var q=ALL.filter(function(x){ return x.bloc.id===blocId; })
             .filter(function(x){ var inf=INFO[x.id]; return inf && inf.annexes && inf.annexes.indexOf(n)>=0; })[0];
    return q ? q.id : null;
  }
  function blocById(id){ return BLOCS.filter(function(b){ return b.id===id; })[0]; }
  function renderSearchHit(e, normTerm, termLen, goAttr, term){
    var b=blocById(e.bloc);
    var h='<button class="search-hit" '+goAttr+' data-term="'+esc(term)+'">';
    h+='<div class="search-hit-title">'+esc(e.title)+(b?' <span class="code">'+esc(b.code)+'</span>':'')+'</div>';
    h+='<div class="search-hit-excerpt">'+excerptFor(e,normTerm,termLen)+'</div>';
    h+='</button>';
    return h;
  }
  function vRecherche(term){
    term=(term||"").trim();
    var h='<h1 class="qhead-title">Recherche</h1>';
    if(!term){
      h+='<div class="qhead-code code">Tape un terme dans la barre de recherche.</div>';
      return h;
    }
    var all=searchIndex(term);
    var normTerm=normTok(term), termLen=term.length;
    h+='<div class="qhead-code code">&laquo;&nbsp;'+esc(term)+'&nbsp;&raquo; &middot; '+all.length+' r\u00e9sultat'+(all.length>1?'s':'')+'</div>';
    if(!all.length){
      h+='<p class="rappel">Aucune correspondance.</p>';
      return h;
    }
    var questions=all.filter(function(e){ return e.type==="question"; });
    var resumes=all.filter(function(e){ return e.type==="resume"; });
    var qCours=all.filter(function(e){ return e.type==="questionCours"; });
    var annexes=all.filter(function(e){ return e.type==="annexe"; });

    if(resumes.length){
      h+='<div class="lab">Dans les r\u00e9sum\u00e9s de cours</div>';
      resumes.forEach(function(e){
        h+=renderSearchHit(e, normTerm, termLen, 'data-go-resume="'+e.id+'"', term);
      });
    }

    if(qCours.length){
      h+='<div class="lab">Dans le contenu par question</div>';
      qCours.forEach(function(e){
        h+=renderSearchHit(e, normTerm, termLen, 'data-go-question-cours="'+e.qid+'"', term);
      });
    }

    if(questions.length){
      h+='<div class="lab">O\u00f9 cette notion est \u00e9valu\u00e9e</div>';
      var byBloc={}, order=[];
      questions.forEach(function(e){
        var bid=e.q.bloc.id;
        if(!byBloc[bid]){ byBloc[bid]={bloc:e.q.bloc, items:[]}; order.push(bid); }
        byBloc[bid].items.push(e.q);
      });
      order.sort(function(a,b){
        return BLOCS.map(function(x){return x.id;}).indexOf(a) - BLOCS.map(function(x){return x.id;}).indexOf(b);
      });
      order.forEach(function(bid){
        var g=byBloc[bid];
        g.items.sort(function(a,b){ return ALL.indexOf(a)-ALL.indexOf(b); });
        h+='<div class="lab">'+esc(g.bloc.code)+' &middot; '+esc(g.bloc.titre)+'</div>';
        g.items.forEach(function(q){
          h+='<button class="qrow" data-goq="'+q.id+'" data-term="'+esc(term)+'"><span class="qn">'+esc(q.n)+'</span><span class="qt">'+esc(q.t)+'</span></button>';
        });
      });
    }

    if(annexes.length){
      h+='<div class="lab">Dans les annexes</div>';
      annexes.forEach(function(e){
        var qid=firstQuestionForAnnexe(e.bloc, e.n);
        var b=blocById(e.bloc);
        var hh='<button class="search-hit'+(qid?'':' search-hit-inert')+'"'+(qid?' data-goq="'+qid+'" data-term="'+esc(term)+'"':'')+'>';
        hh+='<div class="search-hit-title">Annexe '+e.n+' &middot; '+esc(e.title)+(b?' <span class="code">'+esc(b.code)+'</span>':'')+'</div>';
        hh+='<div class="search-hit-excerpt">'+excerptFor(e,normTerm,termLen)+'</div>';
        hh+='</button>';
        h+=hh;
      });
    }

    return h;
  }
  function resolveQid(blocNum, token){
    var blocId="b"+blocNum, norm=normTok(token);
    var q=ALL.filter(function(x){ return x.bloc.id===blocId && normTok(x.n)===norm; })[0];
    return q ? q.id : null;
  }
  function renderQuestionLinks(label, tokens, blocNum){
    if(!tokens || !tokens.length) return "";
    var h='<div class="rc-lab">'+label+'</div><div class="rc-app">';
    tokens.forEach(function(t,i){
      if(i) h+=' &middot; ';
      var qid=resolveQid(blocNum, t);
      h+= qid ? '<button class="linkf" data-goq="'+qid+'">'+t+'</button>' : t;
    });
    h+='</div>';
    return h;
  }
  function vCours(){
    var blocs=(typeof COURS_BLOCS!=="undefined")?COURS_BLOCS:[];
    var h='<div class="tiles">';
    blocs.forEach(function(b){
      if(b.statut==="complet"){
        var listB=b.fiches.map(function(id){return RESUMES[id];}).filter(Boolean).sort(function(a,c){return a.ordre-c.ordre;});
        var totalMinB=listB.reduce(function(a,r){return a+r.lecture_min;},0);
        var promesse=listB.length>1 ? 'de « '+listB[0].titre+' » à « '+listB[listB.length-1].titre+' »' : (listB[0]?listB[0].titre:'');
        h+='<button class="tile" data-go-cours-bloc="'+b.numero+'">';
        h+='<span class="tile-code code">Bloc '+b.numero+'</span>';
        h+='<span class="tile-title">'+b.court+'</span>';
        h+='<span class="tile-cas">'+b.fiches.length+' résumé'+(b.fiches.length>1?'s':'')+' &middot; '+totalMinB+' min<br>'+promesse+'</span>';
        var lusB=luCount(b.fiches), totB=b.fiches.length;
        h+='<div class="tile-bar-row"><span class="tile-bar"><span class="tile-fill" style="width:'+(totB?Math.round(lusB/totB*100):0)+'%"></span></span><span class="tile-pct">'+lusB+'/'+totB+' lus</span></div>';
        h+='</button>';
      } else {
        h+='<div class="tile tile-empty">';
        h+='<span class="tile-code code">Bloc '+b.numero+'</span>';
        h+='<span class="tile-title">À venir</span>';
        h+='<span class="tile-cas">Pas encore de résumés</span>';
        h+='</div>';
      }
    });
    h+='</div>';
    return h;
  }
  function vCoursBloc(numero){
    var b=(typeof COURS_BLOCS!=="undefined"?COURS_BLOCS:[]).filter(function(x){return String(x.numero)===String(numero);})[0];
    if(!b || b.statut!=="complet"){
      return '<div class="qbar">'+renderBreadcrumb([{label:"Cours",view:"cours"}])+'</div><p class="rappel">Bloc introuvable.</p>';
    }
    var list=b.fiches.map(function(id){return RESUMES[id];}).filter(Boolean).sort(function(a,c){return a.ordre-c.ordre;});
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Cours",view:"cours"},{label:b.court}])+'</div>';
    h+='<h1 class="qhead-title">'+b.titre+'</h1><div class="qhead-code code">'+b.epreuve+'</div>';
    var lus=luCount(list.map(function(r){return r.id;}));
    var minRestant=list.filter(function(r){return luEtat(r.id)!=="lu";}).reduce(function(a,r){return a+r.lecture_min;},0);
    h+='<div class="lab-row"><span class="lab">Résumés</span><span class="count">'+lus+'/'+list.length+' lus'+(minRestant?' &middot; il te reste '+minRestant+' min':'')+'</span></div>';
    var nextR=list.filter(function(r){return luEtat(r.id)==="wip";})[0] || list.filter(function(r){return luEtat(r.id)==="nonlu";})[0];
    h+='<div class="tiles">';
    list.forEach(function(r){
      h+='<button class="tile'+(r===nextR?' tile-encours':'')+'" data-go-resume="'+r.id+'">';
      h+='<span class="tile-code code">'+r.ordre+'. '+r.competences.join(", ")+'</span>';
      h+='<span class="tile-title">'+r.titre+'</span>';
      h+='<span class="tile-cas">'+r.accroche+'</span>';
      h+='<span class="tile-count code">'+r.lecture_min+' min &middot; '+r.questions.length+' question'+(r.questions.length>1?'s':'')+'</span>';
      h+=luChip(r.id);
      h+='</button>';
    });
    h+='</div>';
    return h;
  }
  function renderTesteToi(r){
    var nCards=activeCards().filter(function(c){return c.resume===r.id;}).length;
    var nQuiz=QUIZ.filter(function(q){return q.resume===r.id;}).length;
    if(!nCards && !nQuiz) return "";
    var nc=Math.min(10,nCards), nq=Math.min(10,nQuiz);
    var h='<div class="teste-toi"><div class="lab">Teste-toi sur ce résumé</div><div class="tt-btns">';
    if(nCards) h+='<button class="tt-btn tt-flash" data-flashcards-resume-start="'+r.id+':'+r.bloc+'">'+nc+' carte'+(nc>1?'s':'')+' au hasard</button>';
    if(nQuiz) h+='<button class="tt-btn tt-quiz" data-quiz-resume-start="'+r.id+':'+r.bloc+'">'+nq+' question'+(nq>1?'s':'')+' au hasard</button>';
    h+='</div></div>';
    return h;
  }
  function foldSourcesSection(){
    var container=main.querySelector(".resume");
    if(!container) return;
    var kids=Array.prototype.slice.call(container.children);
    for(var i=0;i<kids.length;i++){
      var el=kids[i];
      if(el.tagName==="H3" && el.textContent.trim().toLowerCase()==="sources"){
        var det=document.createElement("details");
        det.className="notions section-fold";
        var sum=document.createElement("summary");
        sum.textContent=el.textContent;
        det.appendChild(sum);
        var toMove=[], j=i+1;
        while(j<kids.length && kids[j].tagName!=="H3"){ toMove.push(kids[j]); j++; }
        container.insertBefore(det, el);
        toMove.forEach(function(n){ det.appendChild(n); });
        container.removeChild(el);
        return;
      }
    }
  }
  function inFoldedSources(el){ return !!el.closest(".section-fold"); }
  function styliseTuile(html){
    if(!/<b>/i.test(html)){
      var i=html.indexOf(" (");
      html = i>0 ? "<b>"+html.slice(0,i)+"</b>"+html.slice(i) : "<b>"+html+"</b>";
    }
    return html.replace(/^((?:\s|<[^>]+>)*)(\S)/, function(_,pre,c){ return pre+c.toUpperCase(); });
  }
  function tileifyEnumerations(container){
    Array.prototype.slice.call(container.querySelectorAll("p")).forEach(function(p){
      if(inFoldedSources(p)) return;
      var html=p.innerHTML;
      var m=/^<b>([^:<]*:)<\/b>\s*/.exec(html);
      if(!m) return;
      var rest=html.slice(m[0].length);
      var parts=rest.split(" · ");
      if(parts.length<3) return;
      if(parts.some(function(s){ return s.replace(/<[^>]+>/g,"").trim().length>140; })) return;
      var dense=parts.length>6;
      var wrap=document.createElement("div");
      wrap.className="enum-block";
      var lab=document.createElement("div"); lab.className="enum-label"; lab.innerHTML="<b>"+m[1]+"</b>";
      var row=document.createElement("div"); row.className=dense?"enum-chips":"enum-tiles";
      parts.forEach(function(part){
        var item=document.createElement("span");
        item.className=dense?"enum-chip":"enum-tile";
        item.innerHTML=dense?part.trim():'<span class="et-in">'+styliseTuile(part.trim())+'</span>';
        row.appendChild(item);
      });
      wrap.appendChild(lab); wrap.appendChild(row);
      p.replaceWith(wrap);
    });
  }
  function chainifyArrows(container){
    Array.prototype.slice.call(container.querySelectorAll("p")).forEach(function(p){
      if(inFoldedSources(p)) return;
      var html=p.innerHTML;
      if((html.match(/→/g)||[]).length<2) return;
      if(/<a /.test(html)) return;
      var lead="", rest=html;
      var mlabel=/^<b>([^:<]*:)<\/b>\s*/.exec(html);
      if(mlabel){ lead=mlabel[1]; rest=html.slice(mlabel[0].length); }
      var steps=rest.split("→").map(function(s){ return s.trim(); }).filter(Boolean);
      if(steps.length<3) return;
      if(steps.some(function(s){ return s.replace(/<[^>]+>/g,"").length>90; })) return;
      var wrap=document.createElement("div"); wrap.className="chain-block";
      if(lead){ var lab=document.createElement("div"); lab.className="enum-label"; lab.innerHTML="<b>"+lead+"</b>"; wrap.appendChild(lab); }
      var row=document.createElement("div"); row.className="chain-row";
      steps.forEach(function(s,i){
        if(i){ var arrow=document.createElement("span"); arrow.className="chain-arrow"; arrow.textContent="→"; row.appendChild(arrow); }
        var node=document.createElement("span"); node.className="chain-step"; node.innerHTML=s;
        row.appendChild(node);
      });
      wrap.appendChild(row);
      p.replaceWith(wrap);
    });
  }
  function markSteps(container){
    Array.prototype.slice.call(container.querySelectorAll("p")).forEach(function(p){
      if(inFoldedSources(p)) return;
      var m=/^<b>Étape\s+(\d+)\s*[—-]/.exec(p.innerHTML);
      if(!m) return;
      p.classList.add("step-para");
      p.setAttribute("data-step-n", m[1]);
    });
  }
  /* Bloc 1 : "**Définition.**" en tête. Bloc 2 : l'émoji 📖. */
  var DEF_EMOJI=/^\s*\u{1F4D6}/u;
  /* Le Bloc 2 marque la définition par l'émoji seul : on ajoute le libellé
     "Définition." derrière, pour que les deux blocs se lisent pareil. */
  function labelDefinition(el){
    if(!el || el.querySelector(".def-lab")) return;
    el.innerHTML=el.innerHTML.replace(DEF_EMOJI, function(m){
      return m+' <b class="def-lab">Définition.</b>';
    });
  }
  function markDefinitions(container){
    Array.prototype.slice.call(container.querySelectorAll("p")).forEach(function(p){
      if(inFoldedSources(p)) return;
      if(p.closest("blockquote")) return; /* déjà encadré par le blockquote */
      if(/^<b>Définition\b/.test(p.innerHTML)){ p.classList.add("def-para"); return; }
      if(DEF_EMOJI.test(p.innerHTML)){ p.classList.add("def-para"); labelDefinition(p); }
    });
    /* Au Bloc 2 la majorité des définitions sont des items de liste : plusieurs
       termes définis à la suite. On teinte l'item sur place — le sortir de son
       <ul> casserait la liste, et une liste entière n'est pas un aparté. */
    Array.prototype.slice.call(container.querySelectorAll("li")).forEach(function(li){
      if(inFoldedSources(li)) return;
      if(DEF_EMOJI.test(li.innerHTML)){ li.classList.add("def-li"); labelDefinition(li); }
    });
  }
  function markCasBlockquotes(container){
    Array.prototype.slice.call(container.querySelectorAll("blockquote")).forEach(function(bq){
      if(inFoldedSources(bq)) return;
      var firstP=bq.querySelector("p");
      if(!firstP) return;
      var lead=firstP.innerHTML;
      /* Bloc 1 : l'aparté s'annonce par son mot d'ouverture en gras. */
      if(/^<b>(Cas|Exemple|Illustration)\b/.test(lead)) bq.classList.add("bq-cas");
      else if(/^<b>Définition\b/.test(lead)) bq.classList.add("bq-def");
      /* Bloc 2 : il s'annonce par un émoji — 💡 aide à la compréhension
         (exemple, astuce, cas concret), 🎯 repère examen, 📖 définition. */
      else if(/^\s*\u{1F4A1}/u.test(lead)) bq.classList.add("bq-cas");
      else if(/^\s*\u{1F3AF}/u.test(lead)) bq.classList.add("bq-exam");
      else if(/^\s*\u{1F4D6}/u.test(lead)){ bq.classList.add("bq-def"); labelDefinition(firstP); }
    });
  }
  /* Apartés (définitions, cas, exemples) renvoyés en colonne de marge */
  var MARGE_MIN=1080;
  function estAparte(el){
    return el.classList && (el.classList.contains("def-para")||el.classList.contains("bq-def")||el.classList.contains("bq-cas")||el.classList.contains("bq-exam")||el.classList.contains("note-perso"));
  }
  /* Critère : un bloc "large" ne peut pas cohabiter avec un aparté.
     Tableau de 3 colonnes ou plus, rangée de tuiles, frise, bloc de code, séparateur. */
  function estBlocLarge(el){
    if(el.tagName==="PRE") return true;
    if(!el.classList) return false;
    if(el.classList.contains("enum-block")||el.classList.contains("chain-block")) return true;
    if(el.classList.contains("table-wrap")){
      var tr=el.querySelector("tr");
      return tr ? tr.children.length>2 : false;
    }
    return false;
  }
  function apartesEnMarge(container){
    if(window.innerWidth<MARGE_MIN) return;
    /* groupes délimités par les titres et sous-titres, sur tout le résumé */
    var groupes=[], cur={items:[]};
    Array.prototype.slice.call(container.children).forEach(function(el){
      if(el.tagName==="H3"||el.tagName==="H4"||el.tagName==="HR"){ if(cur.items.length) groupes.push(cur); cur={items:[]}; }
      else if(el.classList && el.classList.contains("section-fold")){ if(cur.items.length) groupes.push(cur); cur={items:[]}; }
      else cur.items.push(el);
    });
    if(cur.items.length) groupes.push(cur);

    groupes.forEach(function(g){
      var apartes=g.items.filter(estAparte);
      if(!apartes.length) return;
      if(g.items.some(estBlocLarge)) return;
      if(apartes.length===g.items.length) return; /* rien à mettre en face */
      var grid=document.createElement("div"); grid.className="mg-grid";
      var colMain=document.createElement("div"); colMain.className="mg-main";
      var colSide=document.createElement("aside"); colSide.className="mg-side";
      container.insertBefore(grid, g.items[0]);
      g.items.forEach(function(el){ (estAparte(el)?colSide:colMain).appendChild(el); });
      grid.appendChild(colMain); grid.appendChild(colSide);
    });
  }
  function defaireMarge(container){
    Array.prototype.slice.call(container.querySelectorAll(".mg-grid")).forEach(function(grid){
      var colMain=grid.querySelector(".mg-main"), colSide=grid.querySelector(".mg-side");
      var remis=[];
      /* restaure l'ordre source : les apartés se réinsèrent après le texte du groupe */
      Array.prototype.slice.call(colMain.children).forEach(function(el){ remis.push(el); });
      Array.prototype.slice.call(colSide.children).forEach(function(el){ remis.push(el); });
      remis.forEach(function(el){ container.insertBefore(el, grid); });
      container.removeChild(grid);
    });
  }
  function numberHeadings(container){
    Array.prototype.slice.call(container.querySelectorAll("h3")).forEach(function(h){
      if(inFoldedSources(h)) return;
      var m=/^(\d+)\.\s+([\s\S]*)$/.exec(h.innerHTML);
      if(!m) return;
      h.classList.add("h3-num");
      h.innerHTML='<span class="h3-pill">'+m[1]+'</span>'+m[2];
    });
    Array.prototype.slice.call(container.querySelectorAll("h4")).forEach(function(h){
      if(inFoldedSources(h)) return;
      h.classList.add("h4-rule");
    });
  }
  /* ---------- Notes personnelles en marge du cours ----------
     Une note s'accroche à l'id d'un titre du résumé — le même point d'ancrage
     que les liens de flashcards, et le seul qui survive à une régénération du
     cours. Elle vit dans S.coursNotes[résumé][ancre] : sur l'appareil et dans
     la synchro, jamais dans le .md source. Comme elle porte la classe
     note-perso, estAparte() la reconnaît et la colonne de marge existante
     l'accueille sans code de mise en page supplémentaire. */
  var noteMode=false;
  function notesDuResume(rid){ return (S.coursNotes && S.coursNotes[rid]) || {}; }
  function nbNotes(rid){ return Object.keys(notesDuResume(rid)).length; }
  function elementNote(rid, ancre){
    var texte=notesDuResume(rid)[ancre];
    var el=document.createElement("aside");
    el.className="note-perso"+(texte===undefined?" note-vide":"");
    el.setAttribute("data-note-ancre", ancre);
    if(texte===undefined){
      el.innerHTML='<button class="note-add" data-note-edit="'+ancre+'">+ Écrire une note ici</button>';
      return el;
    }
    el.innerHTML='<div class="note-lab">Ma note</div><div class="note-txt">'+esc(texte).replace(/\n/g,'<br>')+'</div>'+
      (noteMode?'<div class="note-actions"><button class="linkf" data-note-edit="'+ancre+'">Modifier</button>'+
                '<button class="linkf" data-note-del="'+ancre+'">Supprimer</button></div>':'');
    return el;
  }
  function poserNotes(container, rid){
    Array.prototype.slice.call(container.querySelectorAll(".note-perso")).forEach(function(n){ n.parentNode.removeChild(n); });
    Array.prototype.slice.call(container.querySelectorAll("h3[id],h4[id]")).forEach(function(h){
      if(inFoldedSources(h)) return;
      var aUneNote=notesDuResume(rid)[h.id]!==undefined;
      if(!aUneNote && !noteMode) return;
      h.parentNode.insertBefore(elementNote(rid, h.id), h.nextSibling);
    });
  }
  /* Repose les notes sans re-rendre la page : un render() complet ferait
     sauter la position de lecture au milieu d'une prise de note. La colonne
     de marge se défait puis se refait, comme au redimensionnement. */
  function rafraichirNotes(rid){
    var container=main.querySelector(".resume");
    if(!container) return;
    if(container.querySelector(".mg-grid")) defaireMarge(container);
    poserNotes(container, rid);
    if(window.innerWidth>=MARGE_MIN) apartesEnMarge(container);
  }
  function editeurNote(rid, ancre){
    var el=main.querySelector('.note-perso[data-note-ancre="'+ancre+'"]');
    if(!el) return;
    el.className="note-perso note-editing";
    el.innerHTML='<div class="note-lab">Ma note</div>'+
      '<textarea class="f" id="note-ta" rows="4"></textarea>'+
      '<div class="note-actions"><button class="jadd" data-note-save="'+ancre+'">Enregistrer</button>'+
      '<button class="linkf" data-note-cancel="1">Annuler</button></div>';
    var ta=el.querySelector("#note-ta");
    ta.value=notesDuResume(rid)[ancre]||"";
    ta.focus();
  }
  /* Un seul écouteur délégué, posé une fois : les notes naissent après le
     rendu, elles rateraient le câblage habituel. */
  main.addEventListener("click", function(e){
    var t=e.target.closest && e.target.closest("[data-note-mode],[data-note-edit],[data-note-save],[data-note-del],[data-note-cancel]");
    if(!t) return;
    var rid=ROUTE.id;
    if(t.hasAttribute("data-note-mode")){
      noteMode=!noteMode;
      t.textContent=noteMode?"Terminer l'annotation":"Annoter le cours";
      main.classList.toggle("note-mode", noteMode);
      rafraichirNotes(rid);
      return;
    }
    if(t.hasAttribute("data-note-edit")){ editeurNote(rid, t.getAttribute("data-note-edit")); return; }
    if(t.hasAttribute("data-note-cancel")){ rafraichirNotes(rid); return; }
    if(t.hasAttribute("data-note-del")){
      if(!confirm("Supprimer cette note ?")) return;
      var a=t.getAttribute("data-note-del");
      if(S.coursNotes[rid]) delete S.coursNotes[rid][a];
      if(S.coursNotes[rid] && !Object.keys(S.coursNotes[rid]).length) delete S.coursNotes[rid];
      save(); majCompteurNotes(rid); rafraichirNotes(rid);
      return;
    }
    if(t.hasAttribute("data-note-save")){
      var an=t.getAttribute("data-note-save");
      var ta=document.getElementById("note-ta");
      var v=ta?ta.value.trim():"";
      if(!S.coursNotes[rid]) S.coursNotes[rid]={};
      if(v) S.coursNotes[rid][an]=v;
      else {
        delete S.coursNotes[rid][an];
        if(!Object.keys(S.coursNotes[rid]).length) delete S.coursNotes[rid];
      }
      save(); majCompteurNotes(rid); rafraichirNotes(rid);
    }
  });
  function majCompteurNotes(rid){
    var el=document.getElementById("noteCount");
    if(!el) return;
    var n=nbNotes(rid);
    el.textContent=n?(n+" note"+(n>1?"s":"")):"";
  }
  function enrichirResume(){
    var container=main.querySelector(".resume");
    if(!container) return;
    tileifyEnumerations(container);
    chainifyArrows(container);
    markSteps(container);
    markDefinitions(container);
    markCasBlockquotes(container);
    numberHeadings(container);
    if(ROUTE.view==="coursResume") poserNotes(container, ROUTE.id);
    apartesEnMarge(container);
  }
  function extractSections(html){
    var tmp=document.createElement("div");
    tmp.innerHTML=html;
    return Array.prototype.map.call(tmp.querySelectorAll("h3"), function(el){ return el.textContent.trim(); });
  }
  function renderSommaire(sections){
    if(sections.length<2) return "";
    var h='<details class="sommaire" open><summary>Sommaire</summary><ol>';
    sections.forEach(function(s,i){ h+='<li><button data-scroll-sec="'+i+'">'+esc(s)+'</button></li>'; });
    h+='</ol></details>';
    return h;
  }
  function currentSectionIndex(){
    var els=main.querySelectorAll(".resume h3");
    if(!els.length) return 0;
    var qbar=main.querySelector(".qbar");
    var offset=nav.offsetHeight+(qbar?qbar.offsetHeight:0)+24;
    var idx=0;
    for(var i=0;i<els.length;i++){
      if(els[i].getBoundingClientRect().top<=offset) idx=i; else break;
    }
    return idx;
  }
  function scrollToSection(idx){
    var els=main.querySelectorAll(".resume h3");
    var el=els[idx];
    if(!el) return;
    var qbar=main.querySelector(".qbar");
    var offset=nav.offsetHeight+(qbar?qbar.offsetHeight:0)+16;
    var y=el.getBoundingClientRect().top+window.scrollY-offset;
    window.scrollTo({top:y, behavior:"smooth"});
  }
  function vCoursResume(id){
    var r=(typeof RESUMES!=="undefined")?RESUMES[id]:null;
    if(!r){
      return '<div class="qbar">'+renderBreadcrumb([{label:"Cours",view:"cours"}])+'</div><p class="rappel">Résumé introuvable.</p>';
    }
    var b=(typeof COURS_BLOCS!=="undefined"?COURS_BLOCS:[]).filter(function(x){return x.numero===r.bloc;})[0];
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Cours",view:"cours"},{label:b?b.court:("Bloc "+r.bloc),view:"coursBloc",param:r.bloc},{label:r.titre}])+'<span class="qbar-section" id="qbarSection"></span>'+renderLuBadge(r.id)+'<div class="read-progress"><span class="read-progress-fill" id="readProgressFill"></span></div></div>';
    h+='<h1 class="qhead-title">'+r.titre+'</h1>';
    h+='<div class="qhead-code code">'+r.lecture_min+' min &middot; '+r.mots+' mots &middot; '+r.competences.join(", ")+'</div>';
    h+='<p class="intro">'+r.accroche+'</p>';
    var sections=extractSections(r.html);
    var repriseIdx=S.coursLuSection[r.id];
    if(luEtat(r.id)==="wip" && repriseIdx && sections[repriseIdx]){
      h+='<button class="reprendre" data-scroll-sec="'+repriseIdx+'"><span class="rep-lab">Reprendre</span>'+
         '<span class="rep-t">'+esc(sections[repriseIdx])+'</span></button>';
    }
    h+=renderSommaire(sections);
    var nN=nbNotes(r.id);
    h+='<div class="note-bar"><button class="note-mode-btn" data-note-mode="1">'+(noteMode?"Terminer l'annotation":"Annoter le cours")+'</button>'+
       '<span class="note-count" id="noteCount">'+(nN?(nN+" note"+(nN>1?"s":"")):"")+'</span></div>';
    h+=renderQuestionLinks("Indispensable pour", r.questions, r.bloc);
    h+=renderQuestionLinks("En complément pour", r.questions_appui, r.bloc);
    h+='<div class="resume">'+r.html+'</div>';
    h+=renderTesteToi(r);
    var ordre=allResumesOrdered(), ridx=ordre.indexOf(r);
    var prevR=ridx>0?ordre[ridx-1]:null, nextR=ridx>=0&&ridx<ordre.length-1?ordre[ridx+1]:null;
    if(prevR||nextR){
      h+='<div class="qseq res-nav">';
      h+= prevR ? '<button class="linkf" data-go-resume="'+prevR.id+'">&larr; '+esc(prevR.titre)+'</button>' : '<span></span>';
      h+= nextR ? '<button class="tile-thin" data-go-resume="'+nextR.id+'">'+esc(nextR.titre)+' &rarr;</button>' : '<span></span>';
      h+='</div>';
    }
    return h;
  }
  function renderResumeLinks(label, ids){
    if(!ids || !ids.length) return "";
    var h='<div class="rc-lab">'+label+'</div><div class="rc-app">';
    ids.forEach(function(rid,i){
      if(i) h+=' &middot; ';
      var r=(typeof RESUMES!=="undefined")?RESUMES[rid]:null;
      h+= r ? '<button class="linkf" data-go-resume="'+rid+'">'+esc(r.titre)+'</button>' : rid;
    });
    h+='</div>';
    return h;
  }
  function vCoursQuestion(qid){
    var qc=(typeof QUESTIONS_COURS!=="undefined")?QUESTIONS_COURS[qid]:null;
    var q=ALL.filter(function(x){return x.id===qid;})[0];
    if(!qc || !q){
      return '<div class="qbar">'+renderBreadcrumb([{label:"Dossiers",view:"dossiers"}])+'</div><p class="rappel">Contenu introuvable.</p>';
    }
    var h='<div class="qbar">'+renderBreadcrumb([
      {label:"Dossiers",view:"dossiers"},
      {label:q.bloc.code,view:"bloc",param:q.bloc.id},
      {label:q.n,view:"question",param:q.id},
      {label:"Cours"}
    ])+'</div>';
    h+='<h1 class="qhead-title">'+qc.titre+'</h1><div class="qhead-code code">'+q.bloc.code+' &middot; '+q.n+' &middot; '+qc.competence+'</div>';
    h+=renderResumeLinks("Approfondir avec le résumé", qc.resumes);
    h+=renderResumeLinks("Voir aussi", qc.resumes_appui);
    h+='<div class="resume">'+qc.html+'</div>';
    var order=ALL.filter(function(x){return (typeof QUESTIONS_COURS!=="undefined")&&QUESTIONS_COURS[x.id];});
    var qidx=order.indexOf(q);
    var prevQ=qidx>0?order[qidx-1]:null, nextQ=(qidx>=0&&qidx<order.length-1)?order[qidx+1]:null;
    if(prevQ||nextQ){
      h+='<div class="qseq res-nav">';
      h+= prevQ ? '<button class="linkf" data-go-question-cours="'+prevQ.id+'">&larr; '+esc(prevQ.n+' — '+(QUESTIONS_COURS[prevQ.id]||{}).titre)+'</button>' : '<span></span>';
      h+= nextQ ? '<button class="tile-thin" data-go-question-cours="'+nextQ.id+'">'+esc(nextQ.n+' — '+(QUESTIONS_COURS[nextQ.id]||{}).titre)+' &rarr;</button>' : '<span></span>';
      h+='</div>';
    }
    return h;
  }

  function positionQbar(){
    var qbar=main.querySelector(".qbar");
    if(qbar) qbar.style.top=nav.offsetHeight+"px";
  }
  function layoutQuestionCols(){
    var cols=main.querySelector(".q-cols");
    if(!cols) return;
    var right=cols.querySelector(".q-right");
    if(!right) return;
    if(window.innerWidth>=1080){
      var qbar=main.querySelector(".qbar");
      right.style.top=(nav.offsetHeight+(qbar?qbar.offsetHeight:0)+16)+"px";
    } else {
      right.style.top="";
    }
  }
  window.addEventListener("resize",function(){
    if(ROUTE.view==="question"||ROUTE.view==="bloc") positionQbar();
    if(ROUTE.view==="question") layoutQuestionCols();
    if(ROUTE.view==="coursResume"){
      var container=main.querySelector(".resume");
      if(!container) return;
      var large=window.innerWidth>=MARGE_MIN;
      var enPlace=!!container.querySelector(".mg-grid");
      if(large && !enPlace) apartesEnMarge(container);
      else if(!large && enPlace) defaireMarge(container);
    }
  });

  function render(){
    var v=ROUTE.view;
    appEl.classList.toggle("session", !!(((v==="flashcards"||v==="flashcardsBloc")&&SES)||((v==="quiz"||v==="quizBloc")&&QZ)));
    renderNav();
    main.classList.add("wide");
    /* série de flashcards : la carte occupe l'écran et se centre, nav masquée */
    main.classList.toggle("card-session", !!((v==="flashcards"||v==="flashcardsBloc")&&SES));
    if(v==="question"){
      main.classList.add("with-qbottom");
      main.innerHTML=vQuestion(ROUTE.id);
      positionQbar();
      layoutQuestionCols();
    } else if(v==="bloc"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vBloc(ROUTE.id);
      positionQbar();
    } else if(v==="coursBloc"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vCoursBloc(ROUTE.id);
      positionQbar();
    } else if(v==="coursResume"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vCoursResume(ROUTE.id);
      positionQbar();
      foldSourcesSection();
      enrichirResume();
      updateSectionActive();
    } else if(v==="coursQuestion"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vCoursQuestion(ROUTE.id);
      positionQbar();
    } else if(v==="flashcards"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vFlashcards();
      positionQbar();
    } else if(v==="flashcardsBloc"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vFlashcardsBloc(ROUTE.id);
      positionQbar();
    } else if(v==="flashcardsSort"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vFlashcardsSort();
      positionQbar();
    } else if(v==="cartes"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vCartes();
      positionQbar();
    } else if(v==="cartesListe"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vCartesListe();
      positionQbar();
    } else if(v==="cartesBloc"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vCartesBloc(ROUTE.id);
      positionQbar();
    } else if(v==="carte"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vCarte(ROUTE.id);
      dessineCarte(ROUTE.id);
    } else if(v==="carteEdit"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vCarteEdit(ROUTE.id);
      positionQbar();
      dessineCarte(ROUTE.id);
    } else if(v==="recherche"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vRecherche(ROUTE.id);
      positionQbar();
    } else if(v==="quiz"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vQuiz();
      positionQbar();
    } else if(v==="quizBloc"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vQuizBloc(ROUTE.id);
      positionQbar();
    } else {
      main.classList.remove("with-qbottom");
      var h = v==="dossiers"?vDossiers() : v==="apprendre"?vApprendre() : v==="cours"?vCours() : vAccueil();
      var titles={accueil:"Suivi des 4 dossiers",dossiers:"Dossiers",apprendre:"Apprendre",cours:"Cours"};
      var subs={accueil:"Formation — dépôt début décembre",dossiers:"44 livrables · dépôt début décembre",apprendre:"Tes flashcards et ton quiz de révision.",cours:"Les résumés de cours, et les questions que chacun alimente."};
      main.innerHTML='<div class="eyebrow">'+subs[v]+'</div><h1>'+titles[v]+'</h1>'+h;
    }
    renderSyncStatus();
    updateTitle();
    bind();
  }

  function bind(){
    main.querySelectorAll("[data-panel]").forEach(function(el){
      el.addEventListener("click",function(){ var id=el.getAttribute("data-panel"); S.open[id]=!S.open[id]; save(); render(); });
    });
    main.querySelectorAll("[data-cs-set]").forEach(function(el){
      el.addEventListener("click",function(){
        var parts=el.getAttribute("data-cs-set").split(":");
        S.cardState[parts[0]]=parts[1]; save(); render();
      });
    });
    main.querySelectorAll("[data-cs-reactivate]").forEach(function(el){
      el.addEventListener("click",function(){ delete S.cardState[el.getAttribute("data-cs-reactivate")]; save(); render(); });
    });
    main.querySelectorAll("[data-cs-edit]").forEach(function(el){
      el.addEventListener("click",function(){
        var box=document.getElementById("cs-edit-"+el.getAttribute("data-cs-edit"));
        if(!box) return;
        box.hidden=!box.hidden;
        if(!box.hidden) box.querySelector("textarea").focus();
      });
    });
    function enregistrerEdition(id, reactiver){
      var carte=FLASHCARDS.filter(function(c){return c.id===id;})[0];
      if(!carte) return;
      var recto=(document.getElementById("cs-edit-recto-"+id).value||"").trim();
      var verso=(document.getElementById("cs-edit-verso-"+id).value||"").trim();
      if(!recto||!verso) return;
      if(recto===carte.recto && verso===carte.verso) delete S.cardEdits[id];
      else S.cardEdits[id]={recto:recto, verso:verso};
      if(reactiver) delete S.cardState[id];
      save(); render();
    }
    main.querySelectorAll("[data-cs-save]").forEach(function(el){
      el.addEventListener("click",function(){ enregistrerEdition(el.getAttribute("data-cs-save"), true); });
    });
    main.querySelectorAll("[data-cs-save-only]").forEach(function(el){
      el.addEventListener("click",function(){ enregistrerEdition(el.getAttribute("data-cs-save-only"), false); });
    });
    main.querySelectorAll("[data-cs-reset]").forEach(function(el){
      el.addEventListener("click",function(){ delete S.cardEdits[el.getAttribute("data-cs-reset")]; save(); render(); });
    });
    main.querySelectorAll("[data-cs-cancel]").forEach(function(el){
      el.addEventListener("click",function(){
        var box=document.getElementById("cs-edit-"+el.getAttribute("data-cs-cancel"));
        if(box) box.hidden=true;
      });
    });
    main.querySelectorAll("[data-cs-copy]").forEach(function(el){
      el.addEventListener("click",function(){
        var box=document.getElementById("cs-copybox-"+el.getAttribute("data-cs-copy"));
        if(box){ box.style.display="block"; box.focus(); box.select(); }
      });
    });
    main.querySelectorAll("[data-set]").forEach(function(el){
      el.addEventListener("click",function(){
        var qid=el.getAttribute("data-set");
        S.status[qid]=el.getAttribute("data-v");
        S.statusAt[qid]=Date.now();
        save(); render();
      });
    });
    main.querySelectorAll("[data-lu-cycle]").forEach(function(el){
      el.addEventListener("click",function(){
        var id=el.getAttribute("data-lu-cycle");
        var order=["nonlu","wip","lu"];
        var next=order[(order.indexOf(luEtat(id))+1)%order.length];
        if(next==="nonlu"){ delete S.coursLu[id]; delete S.coursLuAt[id]; }
        else { S.coursLu[id]=next; S.coursLuAt[id]=Date.now(); }
        save(); render();
      });
    });
    main.querySelectorAll("[data-scroll-sec]").forEach(function(el){
      el.addEventListener("click",function(){ scrollToSection(parseInt(el.getAttribute("data-scroll-sec"),10)); });
    });
    main.querySelectorAll("[data-check]").forEach(function(el){
      el.addEventListener("change",function(){ var id=el.getAttribute("data-check"),i=el.getAttribute("data-i"); S.checks[id]=S.checks[id]||{}; S.checks[id][i]=el.checked; save(); render(); });
    });
    main.querySelectorAll("[data-arb-add]").forEach(function(el){
      el.addEventListener("click",function(){
        var qid=el.getAttribute("data-arb-add");
        var q=ALL.filter(function(x){return x.id===qid;})[0];
        var wrap=el.closest(".arbitrage");
        var i=wrap.querySelector("[data-arb-in]").value.trim();
        var o=wrap.querySelector("[data-arb-out]").value.trim();
        var w=wrap.querySelector("[data-arb-why]").value.trim();
        if(!i&&!o&&!w) return;
        S.journal.push({id:Date.now(), date:new Date().toLocaleDateString("fr-FR"), q:q?(q.bloc.code+' · '+q.n):qid, in:i, out:o, why:w});
        save(); render();
      });
    });
    main.querySelectorAll("[data-fiche]").forEach(function(el){
      el.addEventListener("input",function(){ S.fiche[el.getAttribute("data-fiche")]=el.value; save(); });
    });
    main.querySelectorAll("[data-del]").forEach(function(el){
      el.addEventListener("click",function(){ var id=el.getAttribute("data-del"); S.journal=S.journal.filter(function(e){return String(e.id)!==id;}); save(); render(); });
    });
    main.querySelectorAll("[data-goq]").forEach(function(el){
      el.addEventListener("click",function(){ pendingJumpTerm=el.getAttribute("data-term")||null; go("question", el.getAttribute("data-goq")); });
    });
    main.querySelectorAll("[data-go-bloc]").forEach(function(el){
      el.addEventListener("click",function(){ go("bloc", el.getAttribute("data-go-bloc")); });
    });
    main.querySelectorAll("[data-go-cours-bloc]").forEach(function(el){
      el.addEventListener("click",function(){ go("coursBloc", el.getAttribute("data-go-cours-bloc")); });
    });
    main.querySelectorAll("[data-go-resume]").forEach(function(el){
      el.addEventListener("click",function(){ pendingJumpTerm=el.getAttribute("data-term")||null; go("coursResume", el.getAttribute("data-go-resume")); });
    });
    main.querySelectorAll("[data-go-question-cours]").forEach(function(el){
      el.addEventListener("click",function(){ pendingJumpTerm=el.getAttribute("data-term")||null; go("coursQuestion", el.getAttribute("data-go-question-cours")); });
    });
    main.querySelectorAll("[data-crumb]").forEach(function(el){
      el.addEventListener("click",function(){ go(el.getAttribute("data-crumb"), el.getAttribute("data-crumb-param")); });
    });
    main.querySelectorAll("[data-go]").forEach(function(el){
      el.addEventListener("click",function(){ go(el.getAttribute("data-go")); });
    });
    main.querySelectorAll("[data-resume-go]").forEach(function(el){
      el.addEventListener("click",function(e){
        e.preventDefault();
        go("coursResume", el.getAttribute("data-resume-go"));
      });
    });
    main.querySelectorAll("[data-go-quiz-bloc]").forEach(function(el){
      el.addEventListener("click",function(){ go("quizBloc", el.getAttribute("data-go-quiz-bloc")); });
    });
    main.querySelectorAll("[data-go-flashcards-bloc]").forEach(function(el){
      el.addEventListener("click",function(){ go("flashcardsBloc", el.getAttribute("data-go-flashcards-bloc")); });
    });
    main.querySelectorAll("[data-flashcards-due-all]").forEach(function(el){
      el.addEventListener("click",function(e){
        e.stopPropagation();
        var dq=buildDueQueue(FLASHCARDS);
        if(!dq.length){ go("flashcards"); return; }
        SES={list:dq,i:0,show:false,ok:0,capped:true};
        if(ROUTE.view!=="flashcards" && ROUTE.view!=="flashcardsBloc"){
          ROUTE={view:"flashcards"}; S.view="flashcards";
          history.replaceState(null,"",hashFor("flashcards")); save();
        }
        render();
      });
    });
    bindCartes();
    main.querySelectorAll("[data-flashcards-bonus]").forEach(function(el){
      el.addEventListener("click",function(e){
        e.stopPropagation();
        var bq=buildBonusQueue(FLASHCARDS);
        if(!bq.length){ go("flashcards"); return; }
        SES={list:bq,i:0,show:false,ok:0,bonus:true};
        if(ROUTE.view!=="flashcards" && ROUTE.view!=="flashcardsBloc"){
          ROUTE={view:"flashcards"}; S.view="flashcards";
          history.replaceState(null,"",hashFor("flashcards")); save();
        }
        render();
      });
    });
    main.querySelectorAll("[data-flashcards-bloc-random]").forEach(function(el){
      el.addEventListener("click",function(e){
        e.stopPropagation();
        var parts=el.getAttribute("data-flashcards-bloc-random").split(":"), numero=parts[0], n=parseInt(parts[1],10);
        var l=shuffle(activeCards().filter(function(c){return String(c.bloc)===numero;})).slice(0,n);
        if(!l.length) return;
        SES={list:l,i:0,show:false,ok:0}; render();
      });
    });
    main.querySelectorAll("[data-flashcards-filter]").forEach(function(el){
      el.addEventListener("click",function(){
        var parts=el.getAttribute("data-flashcards-filter").split(":"), list;
        if(parts[0]==="resume") list=activeCards().filter(function(c){return c.resume===parts[1];});
        else if(parts[0]==="type") list=activeCards().filter(function(c){return c.type===parts[1] && String(c.bloc)===parts[2];});
        list=shuffle(list||[]);
        if(!list.length) return;
        SES={list:list,i:0,show:false,ok:0}; render();
      });
    });
    main.querySelectorAll("[data-flashcards-resume-start]").forEach(function(el){
      el.addEventListener("click",function(){
        var parts=el.getAttribute("data-flashcards-resume-start").split(":"), rid=parts[0], bloc=parts[1];
        var list=shuffle(activeCards().filter(function(c){return c.resume===rid;})).slice(0,10);
        if(!list.length) return;
        SES={list:list,i:0,show:false,ok:0};
        ROUTE={view:"flashcardsBloc", id:bloc}; S.view="flashcardsBloc";
        history.replaceState(null,"",hashFor("flashcardsBloc",bloc)); save();
        render();
      });
    });
    main.querySelectorAll("[data-quiz-resume-start]").forEach(function(el){
      el.addEventListener("click",function(){
        var parts=el.getAttribute("data-quiz-resume-start").split(":"), rid=parts[0], bloc=parts[1];
        var list=shuffle(QUIZ.filter(function(q){return q.resume===rid;})).slice(0,10);
        if(!list.length) return;
        QZ={list:list,i:0,ok:0,wrong:[],checked:false,input:initQuizInput(list[0])};
        ROUTE={view:"quizBloc", id:bloc}; S.view="quizBloc";
        history.replaceState(null,"",hashFor("quizBloc",bloc)); save();
        render();
      });
    });
    main.querySelectorAll("[data-quiz-bloc-random]").forEach(function(el){
      el.addEventListener("click",function(e){
        e.stopPropagation();
        var parts=el.getAttribute("data-quiz-bloc-random").split(":"), numero=parts[0], n=parseInt(parts[1],10);
        var list=shuffle(QUIZ.filter(function(q){return String(q.bloc)===numero;})).slice(0,n);
        QZ={list:list,i:0,ok:0,wrong:[],checked:false,input:initQuizInput(list[0])};
        render();
      });
    });
    main.querySelectorAll("[data-quiz-random-all]").forEach(function(el){
      el.addEventListener("click",function(e){
        e.stopPropagation();
        var n=parseInt(el.getAttribute("data-quiz-random-all"),10);
        var list=shuffle(QUIZ).slice(0,n);
        if(!list.length) return;
        QZ={list:list,i:0,ok:0,wrong:[],checked:false,input:initQuizInput(list[0])};
        if(ROUTE.view!=="quiz" && ROUTE.view!=="quizBloc"){
          ROUTE={view:"quiz"}; S.view="quiz";
          history.replaceState(null,"",hashFor("quiz")); save();
        }
        render();
      });
    });
    main.querySelectorAll("[data-quiz-filter]").forEach(function(el){
      el.addEventListener("click",function(){
        var parts=el.getAttribute("data-quiz-filter").split(":"), list;
        if(parts[0]==="resume") list=QUIZ.filter(function(q){return q.resume===parts[1];});
        else if(parts[0]==="format") list=QUIZ.filter(function(q){return q.format===parts[1] && String(q.bloc)===parts[2];});
        list=shuffle(list||[]);
        if(!list.length) return;
        QZ={list:list,i:0,ok:0,wrong:[],checked:false,input:initQuizInput(list[0])};
        render();
      });
    });
    main.querySelectorAll("[data-qz-opt]").forEach(function(el){
      el.addEventListener("click",function(){
        if(QZ.checked) return;
        var k=parseInt(el.getAttribute("data-qz-opt"),10), q=QZ.list[QZ.i];
        QZ.input=k; finishQuizQuestion(k===q.reponse); render();
      });
    });
    main.querySelectorAll("[data-qz-vf]").forEach(function(el){
      el.addEventListener("click",function(){
        if(QZ.checked) return;
        var v=el.getAttribute("data-qz-vf")==="true", q=QZ.list[QZ.i];
        QZ.input=v; finishQuizQuestion(v===q.reponse); render();
      });
    });
    main.querySelectorAll("[data-qz-multi]").forEach(function(el){
      el.addEventListener("click",function(){
        if(QZ.checked) return;
        var k=parseInt(el.getAttribute("data-qz-multi"),10);
        var idx=QZ.input.indexOf(k);
        if(idx>=0) QZ.input.splice(idx,1); else QZ.input.push(k);
        render();
      });
    });
    main.querySelectorAll("[data-qz-blank]").forEach(function(el){
      el.addEventListener("input",function(){
        QZ.input[parseInt(el.getAttribute("data-qz-blank"),10)]=el.value;
      });
    });
    main.querySelectorAll("[data-qz-match]").forEach(function(el){
      el.addEventListener("change",function(){
        var idx=parseInt(el.getAttribute("data-qz-match"),10);
        QZ.input[idx]=el.value===""?null:parseInt(el.value,10);
      });
    });
    main.querySelectorAll("[data-qz-move]").forEach(function(el){
      el.addEventListener("click",function(){
        var parts=el.getAttribute("data-qz-move").split(":"), pos=parseInt(parts[0],10), dir=parts[1];
        var target=dir==="up"?pos-1:pos+1;
        if(target<0||target>=QZ.input.length) return;
        var tmp=QZ.input[pos]; QZ.input[pos]=QZ.input[target]; QZ.input[target]=tmp;
        render();
      });
    });
    main.querySelectorAll("[data-qz-open-text]").forEach(function(el){
      el.addEventListener("input",function(){ QZ.input.text=el.value; });
    });
    main.querySelectorAll("[data-qz-open-reveal]").forEach(function(el){
      el.addEventListener("click",function(){ QZ.input.show=true; render(); });
    });
    main.querySelectorAll("[data-qz-open-grade]").forEach(function(el){
      el.addEventListener("click",function(){
        finishQuizQuestion(el.getAttribute("data-qz-open-grade")==="ok"); render();
      });
    });
    main.querySelectorAll("[data-qz-validate]").forEach(function(el){
      el.addEventListener("click",function(){
        var q=QZ.list[QZ.i], correct=false;
        if(q.format==="qcm_multiple"){
          var a=QZ.input.slice().sort(), b=q.reponse.slice().sort();
          correct = a.length===b.length && a.every(function(v,i){return v===b[i];});
        } else if(q.format==="texte_a_trous"){
          correct = q.trous.every(function(t,i){return (QZ.input[i]||"").trim().toLowerCase()===String(t).trim().toLowerCase();});
        } else if(q.format==="appariement"){
          var correctMap={}; (q.paires||[]).forEach(function(p){correctMap[p[0]]=p[1];});
          correct = q.colonne_a.every(function(_,i){return QZ.input[i]===correctMap[i];});
        } else if(q.format==="ordonnancement"){
          correct = QZ.input.every(function(v,i){return v===q.ordre[i];});
        }
        finishQuizQuestion(correct); render();
      });
    });
    main.querySelectorAll("[data-lrn]").forEach(function(el){
      el.addEventListener("click",function(){
        var a=el.getAttribute("data-lrn");
        if(a==="show") SES.show=true;
        else if(a==="ok"){ var cid=SES.list[SES.i].id; countCardDone(cid); grade(cid,true); SES.ok++; SES.i++; SES.show=false; finishCardSessionIfDone(); }
        else if(a==="ko"){ var cid=SES.list[SES.i].id; countCardDone(cid); grade(cid,false); SES.i++; SES.show=false; finishCardSessionIfDone(); }
        else if(a==="setaside-revoir"||a==="setaside-supprime"){
          var cid=SES.list[SES.i].id;
          /* une carte mise de côté a bien été traitée : elle consomme le quota du jour,
             sinon la file se recharge aussitôt avec une autre nouvelle carte */
          countCardDone(cid);
          S.cardState[cid]=(a==="setaside-revoir")?"revoir":"supprime";
          SES.i++; SES.show=false; finishCardSessionIfDone(); save();
        }
        else if(a==="stop") SES=null;
        else if(a==="qnext"){ QZ.i++; QZ.checked=false; if(QZ.i<QZ.list.length) QZ.input=initQuizInput(QZ.list[QZ.i]); }
        else if(a==="qstop") QZ=null;
        if(a==="ok"||a==="ko"||a==="setaside-revoir"||a==="setaside-supprime") majSerie();
        render();
      });
    });
    main.querySelectorAll("[data-cours-lien]").forEach(function(el){
      el.addEventListener("click",function(e){
        e.preventDefault();
        /* départ assumé vers le cours : on coupe la session avant de changer
           d'URL, sinon hashchange réclame une confirmation dont on n'a que
           faire ici — le clic sur le lien est déjà la réponse. */
        SES=null; QZ=null;
        go("coursResume", el.getAttribute("data-cours-lien"), el.getAttribute("data-cours-ancre"));
      });
    });
    var add=document.getElementById("j-add");
    if(add) add.addEventListener("click",function(){
      var q=document.getElementById("j-q").value.trim(), i=document.getElementById("j-in").value.trim();
      var o=document.getElementById("j-out").value.trim(), w=document.getElementById("j-why").value.trim();
      if(!i&&!o&&!w) return;
      S.journal.push({id:Date.now(),date:new Date().toLocaleDateString("fr-FR"),q:q,in:i,out:o,why:w});
      S.open.journal=true; save(); render();
    });
    var dl=document.getElementById("dl");
    if(dl) dl.addEventListener("change",function(){ S.deadline=dl.value||DEFAULT_DEADLINE; save(); render(); });
    var exp=document.getElementById("exp");
    if(exp) exp.addEventListener("click",function(){
      var box=document.getElementById("expbox"); box.value=exportText(); box.style.display="block"; box.focus(); box.select();
    });
    var sauvExport=document.getElementById("sauvExport");
    if(sauvExport) sauvExport.addEventListener("click",function(){
      var box=document.getElementById("sauvBox");
      box.value=JSON.stringify(S);
      box.style.display="block"; box.focus(); box.select();
      document.getElementById("sauvMsg").textContent="Sauvegarde du "+new Date().toLocaleString("fr-FR")+" — copie ce texte et garde-le.";
    });
    var sauvOuvrir=document.getElementById("sauvImportOuvrir");
    if(sauvOuvrir) sauvOuvrir.addEventListener("click",function(){
      var box=document.getElementById("sauvBox");
      box.value=""; box.style.display="block"; box.focus();
      document.getElementById("sauvImport").style.display="inline-block";
      document.getElementById("sauvMsg").textContent="";
    });
    var sauvImport=document.getElementById("sauvImport");
    if(sauvImport) sauvImport.addEventListener("click",function(){
      var box=document.getElementById("sauvBox"), msg=document.getElementById("sauvMsg");
      var brut=(box.value||"").trim();
      if(!brut){ msg.textContent="Colle d'abord une sauvegarde."; return; }
      var sv;
      try{ sv=JSON.parse(brut); }catch(e){ msg.textContent="Ce texte n'est pas une sauvegarde valide."; return; }
      if(!sv || typeof sv!=="object" || (sv.status===undefined && sv.box===undefined)){
        msg.textContent="Ce texte ne ressemble pas à une sauvegarde de l'application."; return;
      }
      var res=resumeSauvegarde(sv);
      if(!confirm("Restaurer cette sauvegarde ?\n\n"+res+"\n\nLes données actuelles de cet appareil seront remplacées.")) return;
      applyState(sv);
      S._ts=Date.now(); /* la restauration est un acte volontaire : elle fait autorité */
      try{ Store.set(KEY, JSON.stringify(S)); }catch(e){}
      scheduleSyncPush();
      render();
      alert("Sauvegarde restaurée.\n\n"+res);
    });
    var syncActivateBtn=document.getElementById("syncActivate");
    if(syncActivateBtn) syncActivateBtn.addEventListener("click",function(){
      var input=document.getElementById("syncTokenInput");
      var token=(input&&input.value||"").trim();
      if(!token) return;
      setSyncToken(token);
      syncStatus={state:"syncing", at:null};
      renderSyncStatus();
      (async function(){
        try{
          await reconcileSync();
          syncPret=true;
          syncStatus={state:"ok", at:new Date()};
        }catch(e){
          syncStatus={state:"error", at:null};
        }
        render();
      })();
    });
    var syncDeactivateBtn=document.getElementById("syncDeactivate");
    if(syncDeactivateBtn) syncDeactivateBtn.addEventListener("click",function(){
      clearSync(); render();
    });
  }

  function exportText(){
    var out="SUIVI DES 4 DOSSIERS — export du "+new Date().toLocaleDateString("fr-FR")+"\n\n=== FICHE DE COHÉRENCE — BLOC 1 ===\n";
    FICHE_B1.forEach(function(f){ out+=f[1]+" ("+f[2]+") : "+(S.fiche[f[0]]||"—")+"\n"; });
    out+="\n=== JOURNAL D'ARBITRAGES ===\n";
    if(!S.journal.length) out+="(vide)\n";
    S.journal.forEach(function(e){
      out+="\n"+e.date+(e.q?" · "+e.q:"")+"\n";
      if(e.in) out+="  Retenu : "+e.in+"\n";
      if(e.out)out+="  Écarté : "+e.out+"\n";
      if(e.why)out+="  Pourquoi : "+e.why+"\n";
    });
    BLOCS.forEach(function(b){
      out+="\n\n=== "+b.code.toUpperCase()+" — "+b.titre.toUpperCase()+" ===\n";
      b.qs.forEach(function(q){
        var st=S.status[q.id]||"todo";
        var lbl=st==="done"?"relu":st==="draft"?"rédigé":st==="wip"?"en cours":"à faire";
        out+="\n["+lbl.toUpperCase()+"] "+q.n+" — "+q.t+"\n";
        if((S.notes[q.id]||"").trim()) out+=S.notes[q.id]+"\n";
      });
    });
    return out;
  }

  (async function init(){
    try{
      var r=await Store.get(KEY);
      if(r&&r.value){
        var sv=JSON.parse(r.value);
        applyState(sv);
        S.view=sv.view||"accueil";
      }
    }catch(e){}
    if(location.hash && location.hash!=="#"){
      ROUTE=parseHash(location.hash);
    } else if(S.view==="memo"){
      ROUTE={view:"cours"};
    } else if(KNOWN_VIEWS.indexOf(S.view)>=0 && S.view!=="accueil"){
      ROUTE={view:S.view};
      history.replaceState(null,"",hashFor(S.view));
    } else {
      ROUTE={view:"accueil"};
    }
    render();
    /* ouverture directe sur une ancre (lien d'une flashcard dans un nouvel
       onglet) : la mise en page doit être posée avant de calculer la position */
    if(ROUTE.view==="coursResume" && ROUTE.ancre) requestAnimationFrame(function(){ jumpToAncre(ROUTE); });

    if(getSyncToken()){
      syncStatus={state:"syncing", at:null};
      renderSyncStatus();
      try{
        var action=await reconcileSync();
        if(action==="pulled") render();
        syncPret=true;
        syncStatus={state:"ok", at:new Date()};
      }catch(e){
        /* pull impossible : on ne pousse rien, sinon on risque d'écraser
           un état distant qu'on n'a pas pu lire. Réessai au prochain chargement. */
        syncStatus={state:"error", at:null};
      }
      renderSyncStatus();
    } else {
      syncPret=true;
    }
  })();
})();

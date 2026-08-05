(function(){
  var START = new Date(2026,6,30);
  var DEFAULT_DEADLINE = "2026-12-01";
  var KEY = "studi-suivi-v1";

  var ALL = [];
  BLOCS.forEach(function(b){ b.qs.forEach(function(q){ q.id = b.id+"-"+q.n; q.bloc = b; ALL.push(q); }); });

  var S = { status:{}, checks:{}, notes:{}, fiche:{}, journal:[], box:{}, due:{}, fail:{}, cardState:{}, quiz:[], quizSeen:{}, cardRuns:[], coursLu:{}, statusAt:{}, coursLuAt:{}, coursLuSection:{},
            newToday:{d:0,n:0}, streak:{current:0,max:0,lastDate:0},
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
  function scheduleSyncPush(){
    if(!getSyncToken()) return;
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
  function isStateEmpty(sv){
    if(!sv) return true;
    return !(sv.status && Object.keys(sv.status).length)
        && !(sv.checks && Object.keys(sv.checks).length)
        && !(sv.notes && Object.keys(sv.notes).length)
        && !(sv.fiche && Object.keys(sv.fiche).length)
        && !(sv.journal && sv.journal.length)
        && !(sv.box && Object.keys(sv.box).length)
        && !(sv.quizSeen && Object.keys(sv.quizSeen).length)
        && !(sv.cardRuns && sv.cardRuns.length)
        && !(sv.coursLu && Object.keys(sv.coursLu).length)
        && !(sv.quiz && sv.quiz.length);
  }
  function applyState(sv){
    S.status=sv.status||{}; S.checks=sv.checks||{}; S.notes=sv.notes||{}; S.fiche=sv.fiche||{};
    S.journal=sv.journal||[]; S.box=sv.box||{}; S.due=sv.due||{}; S.fail=sv.fail||{}; S.cardState=sv.cardState||{}; S.quiz=sv.quiz||[]; S.quizSeen=sv.quizSeen||{}; S.cardRuns=sv.cardRuns||[]; S.coursLu=sv.coursLu||{}; S.statusAt=sv.statusAt||{}; S.coursLuAt=sv.coursLuAt||{}; S.coursLuSection=sv.coursLuSection||{}; S.reprendre=sv.reprendre||null;
    S.newToday=sv.newToday||{d:0,n:0};
    S.streak=sv.streak||{current:0,max:0,lastDate:0};
    S.deadline=sv.deadline||DEFAULT_DEADLINE; S.open=sv.open||{b1:true}; S._ts=sv._ts||0;
  }
  function save(){
    S._ts=Date.now();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){ try{ Store.set(KEY, JSON.stringify(S)); }catch(e){} scheduleSyncPush(); }, 400);
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
  function dueReviews(list){
    return activeCards(list).filter(function(c){
      var b=S.box[c.id]||0;
      return b>0 && (S.due[c.id]||0)<=today();
    }).sort(function(a,b){
      return (S.due[a.id]||0)-(S.due[b.id]||0);
    });
  }
  function newCardsIn(list){ return activeCards(list).filter(function(c){ return !(S.box[c.id]); }); }
  function dueBreakdown(list){
    var reviews=Math.min(dueReviews(list).length, TOTAL_CAP);
    var news=Math.max(0, Math.min(newBudget(), TOTAL_CAP-reviews));
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
  function buildDueQueue(list){
    var b=dueBreakdown(list);
    var reviews=dueReviews(list).slice(0,b.reviews);
    var picked=newCardsIn(list).slice(0,b.news);
    return shuffle(reviews.concat(picked));
  }
  function dueCount(){ return buildDueQueue(FLASHCARDS).length; }
  function grade(i,ok){
    var b=S.box[i]||0, nb=ok?Math.min(INTERV.length-1,b+1):1;
    S.box[i]=nb; S.due[i]=today()+INTERV[nb]*86400000;
    if(!ok) S.fail[i]=(S.fail[i]||0)+1;
    save();
  }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),x=a[i];a[i]=a[j];a[j]=x;} return a; }

  var VIEWS=[["accueil","Accueil"],["dossiers","Dossiers"],["cours","Cours"],["apprendre","Apprendre"]];
  var KNOWN_VIEWS=["accueil","dossiers","cours","apprendre","flashcards","flashcardsBloc","flashcardsSort","quiz","quizBloc","recherche"];
  function parseHash(hash){
    var h=(hash||"").replace(/^#/,"");
    if(h.charAt(0)==="/") h=h.slice(1);
    if(!h) return {view:"accueil"};
    var parts=h.split("/").filter(Boolean).map(function(p){ try{ return decodeURIComponent(p); }catch(e){ return p; } });
    if(parts[0]==="q" && parts[1]) return {view:"question", id:parts[1]};
    if(parts[0]==="bloc" && parts[1]) return {view:"bloc", id:parts[1]};
    if(parts[0]==="cours" && parts[1]==="bloc" && parts[2]) return {view:"coursBloc", id:parts[2]};
    if(parts[0]==="cours" && parts[1]==="resume" && parts[2]) return {view:"coursResume", id:parts[2]};
    if(parts[0]==="cours" && parts[1]==="question" && parts[2]) return {view:"coursQuestion", id:parts[2]};
    if(parts[0]==="cours") return {view:"cours"};
    if(parts[0]==="quiz" && parts[1]==="bloc" && parts[2]) return {view:"quizBloc", id:parts[2]};
    if(parts[0]==="flashcards" && parts[1]==="bloc" && parts[2]) return {view:"flashcardsBloc", id:parts[2]};
    if(parts[0]==="recherche") return {view:"recherche", id:parts.slice(1).join("/")||""};
    if(parts[0]==="reviser") return {view:"apprendre"};
    if(KNOWN_VIEWS.indexOf(parts[0])>=0) return {view:parts[0]};
    return {view:"accueil"};
  }
  function hashFor(view,param){
    if(view==="question") return "#/q/"+param;
    if(view==="bloc") return "#/bloc/"+param;
    if(view==="coursBloc") return "#/cours/bloc/"+param;
    if(view==="coursResume") return "#/cours/resume/"+param;
    if(view==="coursQuestion") return "#/cours/question/"+param;
    if(view==="cours") return "#/cours";
    if(view==="quizBloc") return "#/quiz/bloc/"+param;
    if(view==="flashcardsBloc") return "#/flashcards/bloc/"+param;
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
    save();
    render();
    main.classList.remove("view-anim");
    void main.offsetWidth;
    main.classList.add("view-anim");
    var term=pendingJumpTerm; pendingJumpTerm=null;
    if(!(term && jumpToTerm(term))){
      var h=hashFor(r.view, r.id);
      window.scrollTo(0, scrollMemory.hasOwnProperty(h) ? scrollMemory[h] : 0);
    }
    updateReadProgress();
  }
  function updateReadProgress(){
    if(ROUTE.view!=="coursResume") return;
    var el=document.getElementById("readProgressFill");
    if(!el) return;
    var max=document.documentElement.scrollHeight-window.innerHeight;
    var pct=max>0 ? Math.min(100,Math.max(0,(window.scrollY/max)*100)) : 0;
    el.style.width=pct+"%";
  }
  var readProgressPending=false;
  window.addEventListener("scroll",function(){
    if(ROUTE.view!=="coursResume" || readProgressPending) return;
    readProgressPending=true;
    requestAnimationFrame(function(){ readProgressPending=false; updateReadProgress(); });
  },{passive:true});
  function go(view,param){
    var h=hashFor(view,param);
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
    var activeView = (ROUTE.view==="question"||ROUTE.view==="bloc"||ROUTE.view==="coursQuestion") ? "dossiers" : (ROUTE.view==="coursBloc"||ROUTE.view==="coursResume") ? "cours" : (ROUTE.view==="flashcards"||ROUTE.view==="flashcardsBloc"||ROUTE.view==="flashcardsSort"||ROUTE.view==="quiz"||ROUTE.view==="quizBloc") ? "apprendre" : ROUTE.view;
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

    var d=dueCount();
    if(d){
      h+='<button class="today-card t-revi" data-flashcards-due-all>';
      h+='<span class="today-lab">Réviser</span>';
      h+='<span class="today-title">'+d+' carte'+(d>1?'s':'')+' du jour</span>';
      h+='<span class="today-meta">'+dueLabel(FLASHCARDS)+'</span>';
      h+='</button>';
    } else {
      h+='<div class="today-card t-revi today-done"><span class="today-lab">Réviser</span>';
      h+='<span class="today-title">Rien à revoir</span>';
      h+='<span class="today-meta">Reviens demain.</span></div>';
    }

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
    var dApp=dueCount();
    var h='<div class="tiles-hub">';
    h+='<button class="tile tile-hub" data-go="flashcards">';
    h+='<span class="tile-code code">Cartes à répétition espacée</span>';
    h+='<span class="tile-title">Flashcards</span>';
    h+='<span class="tile-cas">'+activeCards().length+' cartes &middot; '+dueLabel(FLASHCARDS)+'</span>';
    h+='<span class="tile-quiz-btn btn-flash" data-flashcards-due-all>'+(dApp?'Cartes du jour ('+dApp+')':'Rien à revoir aujourd\'hui')+'</span>';
    h+='</button>';
    h+='<button class="tile tile-hub" data-go="quiz">';
    h+='<span class="tile-code code">Questions et exercices</span>';
    h+='<span class="tile-title">Quiz</span>';
    h+='<span class="tile-cas">'+QUIZ.length+' questions &middot; 7 formats</span>';
    h+='<span class="tile-quiz-btn btn-quiz" data-quiz-random-all="10">10 questions au hasard</span>';
    h+='</button>';
    h+='</div>';
    return h;
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
    h+='<button class="tile cta-tile" data-flashcards-due-all>Cartes du jour<span class="cta-sub">'+dueLabel(FLASHCARDS)+'</span></button>';
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
    var runs=S.cardRuns||[];
    if(runs.length){
      var best=runs.reduce(function(a,r){var p=r.ok/r.n;return p>a?p:a;},0);
      h+='<div class="stats stats-top"><div class="stat"><div class="num">'+runs.length+'</div><div class="lbl">Séries réalisées</div></div>';
      h+='<div class="stat"><div class="num">'+Math.round(best*100)+'<span class="on">%</span></div><div class="lbl">Meilleure série</div></div></div>';
      h+='<div class="lab">Historique</div>';
      runs.slice(-8).reverse().forEach(function(r){
        h+='<div class="hrow"><span>'+r.d+'</span><b>'+r.ok+' / '+r.n+'</b></div>';
      });
    }
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
      h+='<div class="ca ca-center">'+esc(c.verso).replace(/\n/g,'<br>')+'</div><div class="cbtns"><button class="no" data-lrn="ko">À revoir</button><button class="yes" data-lrn="ok">Je savais</button></div>';
      h+='<div class="cbtns-setaside"><button data-lrn="setaside-revoir" title="À modifier">'+ICON_PENCIL+'</button><button data-lrn="setaside-supprime" title="Supprimer">'+ICON_TRASH+'</button></div>';
    } else {
      h+='<div class="cq cq-center">'+esc(c.recto)+'</div><div class="cflip-hint">Touche la carte pour voir la réponse</div>';
    }
    h+='</div><button class="quit" data-lrn="stop">Arrêter la session</button>';
    return h;
  }

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
      return g.src+"\n"+g.cards.map(function(c){return "  "+c.id;}).join("\n");
    }).join("\n\n");
  }
  function renderCardSortRow(c, actionsHtml, extraMeta){
    var meta=esc(c.section);
    if(extraMeta) meta+=' &middot; '+extraMeta;
    return '<div class="cs-row"><div class="cs-main"><div class="cs-meta">'+meta+'</div>'+
      '<div class="cs-recto">'+esc(c.recto)+'</div>'+
      '<div class="cs-verso">'+esc(c.verso).replace(/\n/g,'<br>')+'</div></div>'+
      '<div class="cs-actions">'+actionsHtml+'</div></div>';
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
          actions='<button data-cs-reactivate="'+c.id+'">Réactiver</button><button class="icon-btn" data-cs-set="'+c.id+':'+other+'" title="'+otherTitle+'">'+otherIcon+'</button>';
        }
        h+=renderCardSortRow(c, actions, extraMeta);
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
      if(SES.capped) markStreakDay();
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

  /* ---------- MEMO ---------- */
  /* ---------- COURS ---------- */
  function normTok(s){
    return String(s||"").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  }
  var LU_ETATS=[["nonlu","Pas encore lu"],["wip","En cours"],["lu","Lu"]];
  function luEtat(id){ return S.coursLu[id]||"nonlu"; }
  function luChip(id){
    var st=luEtat(id);
    if(st==="nonlu") return "";
    return '<span class="chip'+(st==="lu"?" done":" wip")+'">'+(st==="lu"?"lu":"en cours")+'</span>';
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
        h+='<button class="tile" data-go-cours-bloc="'+b.numero+'">';
        h+='<span class="tile-code code">Bloc '+b.numero+'</span>';
        h+='<span class="tile-title">'+b.court+'</span>';
        h+='<span class="tile-cas">'+b.fiches.length+' résumé'+(b.fiches.length>1?'s':'')+' &middot; '+b.competences.join(", ")+'</span>';
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
    var h='<div class="teste-toi"><div class="lab">Teste-toi sur ce résumé</div><div class="tt-btns">';
    if(nCards) h+='<button class="tile-quiz-btn btn-flash" data-flashcards-resume-start="'+r.id+':'+r.bloc+'">'+nCards+' carte'+(nCards>1?'s':'')+'</button>';
    if(nQuiz) h+='<button class="tile-quiz-btn btn-quiz" data-quiz-resume-start="'+r.id+':'+r.bloc+'">'+nQuiz+' question'+(nQuiz>1?'s':'')+' de quiz</button>';
    h+='</div></div>';
    return h;
  }
  function extractSections(html){
    var tmp=document.createElement("div");
    tmp.innerHTML=html;
    return Array.prototype.map.call(tmp.querySelectorAll("h3"), function(el){ return el.textContent.trim(); });
  }
  function renderSommaire(sections){
    if(sections.length<2) return "";
    var h='<nav class="sommaire"><div class="lab">Sommaire</div><ol>';
    sections.forEach(function(s,i){ h+='<li><button data-scroll-sec="'+i+'">'+esc(s)+'</button></li>'; });
    h+='</ol></nav>';
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
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Cours",view:"cours"},{label:b?b.court:("Bloc "+r.bloc),view:"coursBloc",param:r.bloc},{label:r.titre}])+'<div class="read-progress"><span class="read-progress-fill" id="readProgressFill"></span></div></div>';
    h+='<div class="qtitle-row"><h1 class="qhead-title">'+r.titre+'</h1>'+luChip(r.id)+'</div>';
    h+='<div class="qhead-code code">'+r.lecture_min+' min &middot; '+r.mots+' mots &middot; '+r.competences.join(", ")+'</div>';
    h+='<p class="intro">'+r.accroche+'</p>';
    var sections=extractSections(r.html);
    var repriseIdx=S.coursLuSection[r.id];
    if(luEtat(r.id)==="wip" && repriseIdx && sections[repriseIdx]){
      h+='<button class="reprendre" data-scroll-sec="'+repriseIdx+'"><span class="rep-lab">Reprendre</span>'+
         '<span class="rep-t">'+esc(sections[repriseIdx])+'</span></button>';
    }
    h+=renderQuestionLinks("Indispensable pour", r.questions, r.bloc);
    h+=renderQuestionLinks("En complément pour", r.questions_appui, r.bloc);
    h+=renderSommaire(sections);
    h+='<div class="resume">'+r.html+'</div>';
    var st=luEtat(r.id);
    h+='<div class="lu-bar"><span class="lab">Où j\'en suis dans ce résumé</span><div class="states">';
    LU_ETATS.forEach(function(p){
      h+='<button data-lu="'+r.id+'" data-luv="'+p[0]+'" aria-pressed="'+(st===p[0])+'">'+p[1]+'</button>';
    });
    h+='</div></div>';
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
    h+='<div class="resume">'+qc.html+'</div>';
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
  });

  function render(){
    var v=ROUTE.view;
    appEl.classList.toggle("session", !!(((v==="flashcards"||v==="flashcardsBloc")&&SES)||((v==="quiz"||v==="quizBloc")&&QZ)));
    renderNav();
    main.classList.add("wide");
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
    main.querySelectorAll("[data-lu]").forEach(function(el){
      el.addEventListener("click",function(){
        var id=el.getAttribute("data-lu"), v=el.getAttribute("data-luv");
        if(v==="nonlu"){ delete S.coursLu[id]; delete S.coursLuAt[id]; }
        else { S.coursLu[id]=v; S.coursLuAt[id]=Date.now(); }
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
        var list=shuffle(activeCards().filter(function(c){return c.resume===rid;}));
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
        var list=shuffle(QUIZ.filter(function(q){return q.resume===rid;}));
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
        else if(a==="ok"){ var cid=SES.list[SES.i].id, wasNew=!(S.box[cid]); grade(cid,true); if(SES.capped&&wasNew) consumeNewBudget(1); SES.ok++; SES.i++; SES.show=false; finishCardSessionIfDone(); }
        else if(a==="ko"){ var cid=SES.list[SES.i].id, wasNew=!(S.box[cid]); grade(cid,false); if(SES.capped&&wasNew) consumeNewBudget(1); SES.i++; SES.show=false; finishCardSessionIfDone(); }
        else if(a==="setaside-revoir"){ S.cardState[SES.list[SES.i].id]="revoir"; SES.i++; SES.show=false; finishCardSessionIfDone(); save(); }
        else if(a==="setaside-supprime"){ S.cardState[SES.list[SES.i].id]="supprime"; SES.i++; SES.show=false; finishCardSessionIfDone(); save(); }
        else if(a==="stop") SES=null;
        else if(a==="qnext"){ QZ.i++; QZ.checked=false; if(QZ.i<QZ.list.length) QZ.input=initQuizInput(QZ.list[QZ.i]); }
        else if(a==="qstop") QZ=null;
        render();
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

    if(getSyncToken()){
      syncStatus={state:"syncing", at:null};
      renderSyncStatus();
      try{
        var action=await reconcileSync();
        if(action==="pulled") render();
        syncStatus={state:"ok", at:new Date()};
      }catch(e){
        syncStatus={state:"error", at:null};
      }
      renderSyncStatus();
    }
  })();
})();

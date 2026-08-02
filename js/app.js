(function(){
  var START = new Date(2026,6,30);
  var DEFAULT_DEADLINE = "2026-12-01";
  var KEY = "studi-suivi-v1";

  var ALL = [];
  BLOCS.forEach(function(b){ b.qs.forEach(function(q){ q.id = b.id+"-"+q.n; q.bloc = b; ALL.push(q); }); });

  var S = { status:{}, checks:{}, notes:{}, fiche:{}, journal:[], box:{}, due:{}, quiz:[],
            deadline:DEFAULT_DEADLINE, open:{b1:true}, view:"accueil" };
  var SES=null, QZ=null, saveTimer=null;
  var main = document.getElementById("main");
  var nav  = document.getElementById("nav");
  var appEl = document.querySelector(".app");

  var MEM = {};
  var Store = {
    get: async function(k){
      try { if(window.storage && window.storage.get) return await window.storage.get(k); } catch(e){}
      return MEM[k] ? {key:k, value:MEM[k]} : null;
    },
    set: async function(k,v){
      try { if(window.storage && window.storage.set) return await window.storage.set(k,v); } catch(e){}
      MEM[k]=v; return {key:k,value:v};
    }
  };
  function save(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){ try{ Store.set(KEY, JSON.stringify(S)); }catch(e){} }, 400);
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
    return renderQuestionCoursTile(qid) || renderRessource(qid);
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

  var INTERV=[0,1,2,4,8,16];
  function today(){ var d=new Date(); return new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime(); }
  function dueNow(i){ var b=S.box[i]||0; return b===0 ? true : (S.due[i]||0)<=today(); }
  function dueCount(){ return FLASHCARDS.filter(function(c){return dueNow(c.id);}).length; }
  function grade(i,ok){ var b=S.box[i]||0, nb=ok?Math.min(5,b+1):1; S.box[i]=nb; S.due[i]=today()+INTERV[nb]*86400000; save(); }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),x=a[i];a[i]=a[j];a[j]=x;} return a; }

  var VIEWS=[["accueil","Accueil"],["dossiers","Dossiers"],["cours","Cours"],["apprendre","Apprendre"]];
  var KNOWN_VIEWS=["accueil","dossiers","cours","apprendre","flashcards","quiz"];
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
    if(view==="accueil") return "#/";
    return "#/"+view;
  }
  var ROUTE={view:"accueil"};
  function applyRoute(r){
    if(r.view!==ROUTE.view){ SES=null; QZ=null; }
    ROUTE=r; S.view=(KNOWN_VIEWS.indexOf(r.view)>=0)?r.view:"accueil"; save();
    render();
    window.scrollTo(0,0);
  }
  function go(view,param){
    var h=hashFor(view,param);
    if(location.hash===h) applyRoute(parseHash(h));
    else location.hash=h;
  }
  window.addEventListener("hashchange",function(){ applyRoute(parseHash(location.hash)); });

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
    var activeView = (ROUTE.view==="question"||ROUTE.view==="bloc"||ROUTE.view==="coursQuestion") ? "dossiers" : (ROUTE.view==="coursBloc"||ROUTE.view==="coursResume") ? "cours" : (ROUTE.view==="flashcards"||ROUTE.view==="quiz") ? "apprendre" : ROUTE.view;
    VIEWS.forEach(function(v){
      var badge="";
      if(v[0]==="dossiers"){ var r=ALL.length-doneCount(); if(r) badge='<i>'+r+'</i>'; }
      if(v[0]==="apprendre"){ var d=dueCount(); if(d) badge='<i>'+d+'</i>'; }
      h+='<button class="navb'+(activeView===v[0]?" on":"")+'" data-go="'+v[0]+'">'+v[1]+badge+'</button>';
    });
    nav.innerHTML=h;
    nav.querySelectorAll("[data-go]").forEach(function(el){
      el.addEventListener("click",function(){ go(el.getAttribute("data-go")); });
    });
    renderCadenceCompact();
  }

  /* ---------- ACCUEIL ---------- */
  function vAccueil(){
    var done=doneCount(), left=ALL.length-done, wl=weeksLeft();
    var pace= wl>0.15 ? left/wl : left;
    var exp=expectedDone(), delta=done-exp;
    var verdict,cls;
    if(left===0){verdict="Tout est déposé.";cls="ok";}
    else if(delta>=0){verdict="Tu es dans les temps.";cls="ok";}
    else {verdict=Math.abs(delta)+" livrable"+(Math.abs(delta)>1?"s":"")+" de retard.";cls="late";}

    var h='<div class="cadence"><div class="verdict '+cls+'">'+verdict+'</div>';
    h+='<div class="sub">Rythme nécessaire pour tenir la date : <strong>'+pace.toFixed(1)+' livrable'+(pace>=2?'s':'')+' par semaine</strong>.</div>';
    h+='<div class="ticks">';
    ALL.forEach(function(q,i){
      h+='<div class="tick '+tickClass(q,i,exp,left)+'" title="'+q.bloc.code+' '+q.n+'"></div>';
    });
    h+='</div><div class="legend"><span><i class="dot" style="background:var(--signal)"></i>rédigé</span><span><i class="dot" style="background:#93A0E5"></i>en cours</span><span><i class="dot" style="background:var(--line)"></i>à faire</span><span><i class="dot" style="background:var(--flag);width:2px;height:11px"></i>où tu devrais en être</span></div>';
    h+='<div class="stats"><div class="stat"><div class="num">'+done+'<span class="on">/'+ALL.length+'</span></div><div class="lbl">Terminés</div></div>';
    h+='<div class="stat"><div class="num">'+Math.floor(wl)+'</div><div class="lbl">Semaines restantes</div></div>';
    h+='<div class="stat"><div class="num">'+left+'</div><div class="lbl">Restants</div></div></div></div>';

    var nxt=ALL.filter(function(q){return !isDone(q.id);})[0];
    if(nxt){
      h+='<div class="next"><div class="eyebrow">La prochaine chose à faire</div>';
      h+='<div class="t">'+nxt.bloc.code+' · '+nxt.n+' — '+nxt.t+'</div>';
      h+='<button data-goq="'+nxt.id+'">Ouvrir la question</button></div>';
    } else {
      h+='<div class="next"><div class="eyebrow">Terminé</div><div class="t">Les 44 livrables sont rédigés.</div></div>';
    }

    var d=dueCount(), maitr=FLASHCARDS.filter(function(c){return (S.box[c.id]||0)>=4;}).length;
    h+='<div class="grid2">';
    h+='<div class="mini" data-go="flashcards"><div class="eyebrow">Révision</div><div class="bignum">'+d+'</div><div class="lbl">carte'+(d>1?'s':'')+' à revoir</div></div>';
    h+='<div class="mini" data-go="flashcards"><div class="eyebrow">Acquis</div><div class="bignum">'+maitr+'<span class="on">/'+FLASHCARDS.length+'</span></div><div class="lbl">notions maîtrisées</div></div>';
    h+='</div>';

    h+='<div class="foot">Date limite de dépôt : <input type="date" id="dl" value="'+S.deadline+'"><br>';
    h+='Tes données sont enregistrées automatiquement et te suivent d\'un appareil à l\'autre.<br>';
    h+='<button id="exp">Exporter tout en texte</button>';
    h+='<textarea class="f" id="expbox" style="display:none;margin-top:8px;min-height:220px;font-size:12px"></textarea></div>';
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
    h+='<div class="lab">Mon brouillon</div><textarea class="f big" data-note="'+q.id+'" placeholder="Écris ici. Tu récupéreras tout d\'un coup depuis l\'accueil, bouton Exporter.">'+esc(S.notes[q.id])+'</textarea>';
    h+='<span class="saved-flag" id="saved-'+q.id+'">Enregistré</span>';
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
    var h='<div class="lab">Annexes utilisables</div>';
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
      h+= next ? '<button class="linkf" data-goq="'+next.id+'">'+next.n+' &rarr;</button>' : '<span></span>';
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
    h+='<div class="q-enonce-text"><div class="lab">L\'énoncé</div><p class="enonce-text">'+inf.enonce+'</p></div>';
    h+='<div class="q-attendus"><div class="lab">Ce qui est attendu</div><ul class="att">';
    inf[0].forEach(function(a){h+='<li>'+a+'</li>';});
    h+='</ul></div>';
    h+='<div class="q-annexes">'+renderAnnexesUtilisables(q)+'</div>';
    var checkedCrit=q.k.filter(function(_,i){return (S.checks[q.id]||{})[i];}).length;
    h+='<div class="q-criteres"><div class="lab-row"><span class="lab">Critères évalués</span><span class="count">'+checkedCrit+'/'+q.k.length+'</span></div>';
    q.k.forEach(function(k,i){
      var ck=(S.checks[q.id]||{})[i]?" checked":"";
      h+='<label class="crit"><input type="checkbox" data-check="'+q.id+'" data-i="'+i+'"'+ck+'><span>'+k+'</span></label>';
    });
    h+='</div>';
    h+='<div class="q-brouillon"><div class="lab">Mon brouillon</div><textarea class="f big" data-note="'+q.id+'" placeholder="Écris ici. Tu récupéreras tout d\'un coup depuis l\'accueil, bouton Exporter.">'+esc(S.notes[q.id])+'</textarea><span class="saved-flag" id="saved-'+q.id+'">Enregistré</span></div>';
    h+='<div class="q-arbitrage">'+renderArbitrage(q)+'</div>';
    h+='</div>'; // q-left
    h+='<div class="q-right"><div class="lab">Ce dont tu disposes</div>'+renderCoursSlot(q.id)+'</div>';
    h+='</div>'; // q-cols

    h+='<div class="qbottom"><div class="qbottom-inner"><div class="states">';
    [["todo","À faire"],["wip","En cours"],["draft","Rédigé"],["done","Relu"]].forEach(function(p){
      h+='<button data-set="'+q.id+'" data-v="'+p[0]+'" aria-pressed="'+(st===p[0])+'">'+p[1]+'</button>';
    });
    h+='</div></div></div>';
    return h;
  }

  function renderQuestionRow(q){
    var st=S.status[q.id]||"todo";
    var lbl=st==="done"?"relu":st==="draft"?"rédigé":st==="wip"?"en cours":"à faire";
    var chipc=st==="done"?" done":st==="draft"?" draft":st==="wip"?" wip":"";
    var checkedCrit=q.k.filter(function(_,i){return (S.checks[q.id]||{})[i];}).length;
    var dots=[]; for(var i=0;i<q.k.length;i++){ dots.push(i<checkedCrit?"&#9679;":"&#9675;"); } dots=dots.join("&#8202;");
    var h='<button class="qrow" id="q-'+q.id+'" data-goq="'+q.id+'">';
    h+='<span class="qn">'+q.n+'</span><span class="qt">'+q.t+'</span>';
    h+='<span class="qprog">'+dots+' '+checkedCrit+'/'+q.k.length+'</span>';
    h+='<span class="chip'+chipc+'">'+lbl+'</span></button>';
    return h;
  }

  /* ---------- BLOC ---------- */
  function vBloc(blocId){
    var b=BLOCS.filter(function(x){return x.id===blocId;})[0];
    if(!b){
      return renderBreadcrumb([{label:"Dossiers",view:"dossiers"}])+'<p class="rappel">Bloc introuvable.</p>';
    }
    var done=b.qs.filter(function(q){return isDone(q.id);}).length;
    var pct=b.qs.length?Math.round(100*done/b.qs.length):0;
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Dossiers",view:"dossiers"},{label:b.code}])+'</div>';
    h+='<h1 class="qhead-title">'+b.titre+'</h1><div class="qhead-code code">'+b.cas+'</div>';
    h+='<div class="lab-row"><span class="lab">Avancement</span><span class="count">'+done+'/'+b.qs.length+' &middot; '+pct+' %</span></div>';

    if(!b.enonce){
      b.qs.forEach(function(q){ h+=renderQuestionRow(q); });
      return h;
    }

    h+='<div class="bloc-cols">';
    h+='<details class="bloc-enonce"><summary>L\'énoncé</summary><div class="bloc-enonce-body">';
    h+='<details class="notions" open><summary>Contexte</summary><div class="rc-app">'+b.enonce.contexte+'</div></details>';
    h+='<details class="notions"><summary>La mission</summary><div class="rc-app">'+b.enonce.mission+'</div></details>';
    h+='<details class="notions"><summary>Les données à retenir</summary><ul class="att">';
    b.enonce.donnees.forEach(function(d){ h+='<li>'+d+'</li>'; });
    h+='</ul></details>';
    h+='<details class="notions"><summary>Les annexes ('+b.enonce.annexes.length+')</summary><ul class="att">';
    b.enonce.annexes.forEach(function(a){ h+='<li>Annexe '+a.n+' &middot; '+a.titre+'</li>'; });
    h+='</ul></details>';
    h+='<a class="linkf enonce-pdf" href="'+encodeURI(b.enonce.pdf)+'" target="_blank" rel="noopener">Ouvrir le PDF de l\'énoncé</a>';
    h+='</div></details>';

    h+='<div class="bloc-questions"><div class="lab">Les questions</div>';
    b.qs.forEach(function(q){ h+=renderQuestionRow(q); });
    h+='</div></div>';

    if(blocId==="b1"){
      h+='<div class="bloc-bottom">';
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
      h+='</div>';
    }
    return h;
  }

  function vDossiers(){
    var h='<div class="tiles">';
    BLOCS.forEach(function(b){
      var done=b.qs.filter(function(q){return isDone(q.id);}).length;
      var pct=b.qs.length?Math.round(100*done/b.qs.length):0;
      h+='<button class="tile" data-go-bloc="'+b.id+'">';
      h+='<span class="tile-code code">'+b.code+'</span>';
      h+='<span class="tile-title">'+b.titre+'</span>';
      h+='<span class="tile-cas">'+b.cas+'</span>';
      h+='<span class="tile-bar-row"><span class="tile-bar"><span class="tile-fill" style="width:'+pct+'%"></span></span><span class="tile-pct code">'+pct+' %</span></span>';
      h+='<span class="tile-count code">'+done+' / '+b.qs.length+'</span>';
      h+='</button>';
    });
    h+='</div>';
    return h;
  }

  /* ---------- APPRENDRE (cartes + quiz) ---------- */
  var TYPE_LABELS={definition:"Définition",liste:"Liste",distinction:"Distinction",application:"Application"};

  function vApprendre(){
    var h='<div class="tiles">';
    h+='<button class="tile" data-go="flashcards">';
    h+='<span class="tile-code code">Flashcards</span>';
    h+='<span class="tile-title">Cartes à répétition espacée</span>';
    h+='<span class="tile-cas">'+FLASHCARDS.length+' cartes &middot; '+dueCount()+' à revoir aujourd\'hui</span>';
    h+='</button>';
    h+='<button class="tile" data-go="quiz">';
    h+='<span class="tile-code code">Quiz</span>';
    h+='<span class="tile-title">Questions et exercices</span>';
    h+='<span class="tile-cas">'+QUIZ.length+' questions &middot; 7 formats</span>';
    h+='</button>';
    h+='</div>';
    return h;
  }

  function vFlashcards(){
    if(SES) return renderCardsSession();
    return renderFlashcardsHome();
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
    } else {
      h+='<div class="cq cq-center">'+esc(c.recto)+'</div><div class="cflip-hint">Touche la carte pour voir la réponse</div>';
    }
    h+='</div><button class="quit" data-lrn="stop">Arrêter la session</button>';
    return h;
  }

  function renderFlashcardsHome(){
    var d=dueCount(), vus=FLASHCARDS.filter(function(c){return (S.box[c.id]||0)>0;}).length;
    var maitr=FLASHCARDS.filter(function(c){return (S.box[c.id]||0)>=4;}).length;
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Apprendre",view:"apprendre"},{label:"Flashcards"}])+'</div>';
    h+='<h1 class="qhead-title">Flashcards</h1><div class="qhead-code code">'+FLASHCARDS.length+' cartes</div>';
    h+='<div class="stats stats-top">';
    h+='<div class="stat"><div class="num">'+d+'</div><div class="lbl">Cartes à revoir</div></div>';
    h+='<div class="stat"><div class="num">'+vus+'<span class="on">/'+FLASHCARDS.length+'</span></div><div class="lbl">Vues</div></div>';
    h+='<div class="stat"><div class="num">'+maitr+'</div><div class="lbl">Maîtrisées</div></div></div>';
    h+='<div class="states">';
    h+='<button data-lrn="start"'+(d?'':' disabled')+'>'+(d?'Cartes du jour ('+d+')':'Rien à revoir aujourd\'hui')+'</button>';
    h+='<button data-lrn="startall">Tout revoir ('+FLASHCARDS.length+')</button></div>';
    if(!d) h+='<p class="rappel">Rien à revoir aujourd\'hui. Reviens demain, ou lance une session libre.</p>';
    h+='<p class="rappel">Les cartes reviennent selon ton niveau : une carte sue réapparaît dans 2, 4, 8 puis 16 jours ; une carte ratée revient dès demain.</p>';
    return h;
  }

  var FORMAT_LABELS={qcm:"QCM",qcm_multiple:"QCM multiple",texte_a_trous:"Texte à trous",vrai_faux:"Vrai / Faux",appariement:"Appariement",ordonnancement:"Ordre",ouverte:"Question ouverte"};

  function vQuiz(){
    if(QZ) return renderQuizSession();
    return renderQuizHome();
  }

  function renderQuizHome(){
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Apprendre",view:"apprendre"},{label:"Quiz"}])+'</div>';
    h+='<h1 class="qhead-title">Quiz</h1><div class="qhead-code code">'+QUIZ.length+' questions</div>';
    h+='<div class="states">';
    h+='<button data-quiz="10">10 questions</button><button data-quiz="'+QUIZ.length+'">Toutes ('+QUIZ.length+')</button></div>';
    if(S.quiz.length){
      var best=S.quiz.reduce(function(a,r){var p=r.s/r.n;return p>a?p:a;},0);
      h+='<div class="stats stats-top"><div class="stat"><div class="num">'+S.quiz.length+'</div><div class="lbl">Quiz passés</div></div>';
      h+='<div class="stat"><div class="num">'+Math.round(best*100)+'<span class="on">%</span></div><div class="lbl">Meilleur score</div></div></div>';
      h+='<div class="lab">Historique</div>';
      S.quiz.slice(-8).reverse().forEach(function(r){
        h+='<div class="hrow"><span>'+r.d+'</span><b>'+r.s+' / '+r.n+'</b></div>';
      });
    } else h+='<p class="rappel">Aucun quiz passé pour l\'instant. Les questions portent sur les pièges classiques, pas seulement sur les définitions.</p>';
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

  function finishQuizQuestion(correct){
    QZ.checked=true;
    if(correct) QZ.ok++; else QZ.wrong.push(QZ.list[QZ.i].question);
    if(QZ.i===QZ.list.length-1){ S.quiz.push({d:new Date().toLocaleDateString("fr-FR"),s:QZ.ok,n:QZ.list.length}); save(); }
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
    h+='<div class="lab-row"><span class="lab">Résumés</span><span class="count">'+list.length+'</span></div>';
    h+='<div class="tiles">';
    list.forEach(function(r){
      h+='<button class="tile" data-go-resume="'+r.id+'">';
      h+='<span class="tile-code code">'+r.ordre+'. '+r.competences.join(", ")+'</span>';
      h+='<span class="tile-title">'+r.titre+'</span>';
      h+='<span class="tile-cas">'+r.accroche+'</span>';
      h+='<span class="tile-count code">'+r.lecture_min+' min &middot; '+r.questions.length+' question'+(r.questions.length>1?'s':'')+'</span>';
      h+='</button>';
    });
    h+='</div>';
    return h;
  }
  function vCoursResume(id){
    var r=(typeof RESUMES!=="undefined")?RESUMES[id]:null;
    if(!r){
      return '<div class="qbar">'+renderBreadcrumb([{label:"Cours",view:"cours"}])+'</div><p class="rappel">Résumé introuvable.</p>';
    }
    var b=(typeof COURS_BLOCS!=="undefined"?COURS_BLOCS:[]).filter(function(x){return x.numero===r.bloc;})[0];
    var h='<div class="qbar">'+renderBreadcrumb([{label:"Cours",view:"cours"},{label:b?b.court:("Bloc "+r.bloc),view:"coursBloc",param:r.bloc},{label:r.titre}])+'</div>';
    h+='<h1 class="qhead-title">'+r.titre+'</h1><div class="qhead-code code">'+r.lecture_min+' min &middot; '+r.mots+' mots &middot; '+r.competences.join(", ")+'</div>';
    h+='<p class="intro">'+r.accroche+'</p>';
    h+=renderQuestionLinks("Indispensable pour", r.questions, r.bloc);
    h+=renderQuestionLinks("En complément pour", r.questions_appui, r.bloc);
    h+='<div class="resume">'+r.html+'</div>';
    if(r.sources && r.sources.length){
      h+='<div class="rc-lab">Sources</div><ul class="rc-src">';
      r.sources.forEach(function(s){ h+='<li>'+s.support+' &middot; '+s.lecons+' leçon'+(s.lecons>1?'s':'')+'</li>'; });
      h+='</ul>';
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
  function positionBlocEnonce(){
    var qbar=main.querySelector(".qbar"), enonce=main.querySelector(".bloc-enonce");
    if(!qbar || !enonce) return;
    if(window.innerWidth>=1080){
      enonce.setAttribute("open","");
      enonce.style.top=(nav.offsetHeight+qbar.offsetHeight+16)+"px";
    } else {
      enonce.style.top="";
    }
  }
  function layoutQuestionCols(){
    var cols=main.querySelector(".q-cols");
    if(!cols) return;
    var left=cols.querySelector(".q-left"), right=cols.querySelector(".q-right"), annexes=cols.querySelector(".q-annexes");
    if(!left || !right || !annexes) return;
    if(window.innerWidth>=1080){
      right.appendChild(annexes);
      var qbar=main.querySelector(".qbar");
      right.style.top=(nav.offsetHeight+(qbar?qbar.offsetHeight:0)+16)+"px";
    } else {
      var attendus=left.querySelector(".q-attendus");
      if(attendus && attendus.nextSibling!==annexes) attendus.parentNode.insertBefore(annexes, attendus.nextSibling);
      right.style.top="";
    }
  }
  window.addEventListener("resize",function(){
    if(ROUTE.view==="question"||ROUTE.view==="bloc") positionQbar();
    if(ROUTE.view==="bloc") positionBlocEnonce();
    if(ROUTE.view==="question") layoutQuestionCols();
  });

  function render(){
    var v=ROUTE.view;
    appEl.classList.toggle("session", !!((v==="flashcards"&&SES)||(v==="quiz"&&QZ)));
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
      positionBlocEnonce();
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
    } else if(v==="quiz"){
      main.classList.remove("with-qbottom");
      main.innerHTML=vQuiz();
      positionQbar();
    } else {
      main.classList.remove("with-qbottom");
      var h = v==="dossiers"?vDossiers() : v==="apprendre"?vApprendre() : v==="cours"?vCours() : vAccueil();
      var titles={accueil:"Suivi des 4 dossiers",dossiers:"Dossiers",apprendre:"Apprendre",cours:"Cours"};
      var subs={accueil:"Formation — dépôt début décembre",dossiers:"44 livrables · dépôt début décembre",apprendre:"Tes flashcards et ton quiz de révision.",cours:"Les résumés de cours, et les questions que chacun alimente."};
      main.innerHTML='<div class="eyebrow">'+subs[v]+'</div><h1>'+titles[v]+'</h1>'+h;
    }
    bind();
  }

  function bind(){
    main.querySelectorAll("[data-panel]").forEach(function(el){
      el.addEventListener("click",function(){ var id=el.getAttribute("data-panel"); S.open[id]=!S.open[id]; save(); render(); });
    });
    main.querySelectorAll("[data-set]").forEach(function(el){
      el.addEventListener("click",function(){ S.status[el.getAttribute("data-set")]=el.getAttribute("data-v"); save(); render(); });
    });
    main.querySelectorAll("[data-check]").forEach(function(el){
      el.addEventListener("change",function(){ var id=el.getAttribute("data-check"),i=el.getAttribute("data-i"); S.checks[id]=S.checks[id]||{}; S.checks[id][i]=el.checked; save(); });
    });
    main.querySelectorAll("[data-note]").forEach(function(el){
      el.addEventListener("input",function(){
        var id=el.getAttribute("data-note");
        S.notes[id]=el.value; save();
        clearTimeout(el._flagT);
        el._flagT=setTimeout(function(){
          var flag=document.getElementById("saved-"+id);
          if(!flag) return;
          flag.classList.add("show");
          clearTimeout(flag._hideT);
          flag._hideT=setTimeout(function(){ flag.classList.remove("show"); },2000);
        },400);
      });
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
      el.addEventListener("click",function(){ go("question", el.getAttribute("data-goq")); });
    });
    main.querySelectorAll("[data-go-bloc]").forEach(function(el){
      el.addEventListener("click",function(){ go("bloc", el.getAttribute("data-go-bloc")); });
    });
    main.querySelectorAll("[data-go-cours-bloc]").forEach(function(el){
      el.addEventListener("click",function(){ go("coursBloc", el.getAttribute("data-go-cours-bloc")); });
    });
    main.querySelectorAll("[data-go-resume]").forEach(function(el){
      el.addEventListener("click",function(){ go("coursResume", el.getAttribute("data-go-resume")); });
    });
    main.querySelectorAll("[data-go-question-cours]").forEach(function(el){
      el.addEventListener("click",function(){ go("coursQuestion", el.getAttribute("data-go-question-cours")); });
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
    main.querySelectorAll("[data-quiz]").forEach(function(el){
      el.addEventListener("click",function(){
        var n=parseInt(el.getAttribute("data-quiz"),10);
        var list=shuffle(QUIZ).slice(0,n);
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
        if(a==="start"){ var l=shuffle(FLASHCARDS.filter(function(c){return dueNow(c.id);})); if(!l.length) return; SES={list:l,i:0,show:false,ok:0}; }
        else if(a==="startall") SES={list:shuffle(FLASHCARDS),i:0,show:false,ok:0};
        else if(a==="show") SES.show=true;
        else if(a==="ok"){ grade(SES.list[SES.i].id,true); SES.ok++; SES.i++; SES.show=false; }
        else if(a==="ko"){ grade(SES.list[SES.i].id,false); SES.i++; SES.show=false; }
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
        S.status=sv.status||{}; S.checks=sv.checks||{}; S.notes=sv.notes||{}; S.fiche=sv.fiche||{};
        S.journal=sv.journal||[]; S.box=sv.box||{}; S.due=sv.due||{}; S.quiz=sv.quiz||[];
        S.deadline=sv.deadline||DEFAULT_DEADLINE; S.open=sv.open||{b1:true}; S.view=sv.view||"accueil";
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
  })();
})();

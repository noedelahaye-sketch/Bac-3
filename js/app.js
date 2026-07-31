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
  function dueCount(){ return CARDS.filter(function(c){return dueNow(c.i);}).length; }
  function grade(i,ok){ var b=S.box[i]||0, nb=ok?Math.min(5,b+1):1; S.box[i]=nb; S.due[i]=today()+INTERV[nb]*86400000; save(); }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),x=a[i];a[i]=a[j];a[j]=x;} return a; }

  var VIEWS=[["accueil","Accueil"],["dossiers","Dossiers"],["cours","Cours"],["reviser","Réviser"],["quiz","Quiz"]];
  var KNOWN_VIEWS=["accueil","dossiers","cours","reviser","quiz"];

  function slugify(s){
    return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9]+/g,"-").replace(/(^-+|-+$)/g,"");
  }
  function parseHash(hash){
    var h=(hash||"").replace(/^#/,"");
    if(h.charAt(0)==="/") h=h.slice(1);
    if(!h) return {view:"accueil"};
    var parts=h.split("/").filter(Boolean);
    if(parts[0]==="q" && parts[1]) return {view:"question", id:parts[1]};
    if(parts[0]==="cours") return {view:"cours", support:parts[1]||null};
    if(KNOWN_VIEWS.indexOf(parts[0])>=0) return {view:parts[0]};
    return {view:"accueil"};
  }
  function hashFor(view,param){
    if(view==="question") return "#/q/"+param;
    if(view==="cours") return param ? "#/cours/"+param : "#/cours";
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
    var activeView = ROUTE.view==="question" ? "dossiers" : ROUTE.view;
    VIEWS.forEach(function(v){
      var badge="";
      if(v[0]==="dossiers"){ var r=ALL.length-doneCount(); if(r) badge='<i>'+r+'</i>'; }
      if(v[0]==="reviser"){ var d=dueCount(); if(d) badge='<i>'+d+'</i>'; }
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
      h+='<button data-goq="'+nxt.id+'">Ouvrir</button></div>';
    } else {
      h+='<div class="next"><div class="eyebrow">Terminé</div><div class="t">Les 44 livrables sont rédigés.</div></div>';
    }

    var d=dueCount(), maitr=CARDS.filter(function(c){return (S.box[c.i]||0)>=4;}).length;
    h+='<div class="grid2">';
    h+='<div class="mini" data-go="reviser"><div class="eyebrow">Révision</div><div class="bignum">'+d+'</div><div class="lbl">carte'+(d>1?'s':'')+' à revoir</div></div>';
    h+='<div class="mini" data-go="reviser"><div class="eyebrow">Acquis</div><div class="bignum">'+maitr+'<span class="on">/'+CARDS.length+'</span></div><div class="lbl">notions maîtrisées</div></div>';
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
    h+=renderRessource(q.id);
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
  function vQuestion(qid){
    var q=ALL.filter(function(x){return x.id===qid;})[0];
    if(!q){
      return '<button class="linkf" data-go="dossiers">&larr; Dossiers</button><p class="rappel">Question introuvable.</p>';
    }
    S.open[q.bloc.id]=true;
    var idx=ALL.indexOf(q);
    var st=S.status[q.id]||"todo";
    var lbl=st==="done"?"relu":st==="draft"?"rédigé":st==="wip"?"en cours":"à faire";
    var chipc=st==="done"?" done":st==="draft"?" draft":st==="wip"?" wip":"";
    var h='<div class="qbar"><button class="back" data-go="dossiers">&larr; Dossiers</button>';
    h+='<span class="code">'+q.bloc.code.replace('Bloc ','B')+' &middot; '+q.n+'</span>';
    h+='<span class="chip'+chipc+'">'+lbl+'</span></div>';
    h+=renderLocalCadence(idx);
    h+='<h1 class="qhead-title">'+q.t+'</h1><div class="qhead-code code">'+q.c+'</div>';
    h+=renderQuestionBody(q,{hideStatus:true});
    h+=renderArbitrage(q);
    var prev=ALL[idx-1], next=ALL[idx+1];
    h+='<div class="qbottom"><div class="qbottom-inner">';
    h+='<div class="states">';
    [["todo","À faire"],["wip","En cours"],["draft","Rédigé"],["done","Relu"]].forEach(function(p){
      h+='<button data-set="'+q.id+'" data-v="'+p[0]+'" aria-pressed="'+(st===p[0])+'">'+p[1]+'</button>';
    });
    h+='</div><div class="qseq">';
    h+= prev ? '<button class="linkf" data-goq="'+prev.id+'">&larr; '+prev.n+'</button>' : '<span></span>';
    h+= next ? '<button class="linkf" data-goq="'+next.id+'">'+next.n+' &rarr;</button>' : '<span></span>';
    h+='</div></div></div>';
    return h;
  }

  function vDossiers(){
    var h='';
    var fOpen=S.open.fiche?" open":"";
    var fFilled=FICHE_B1.filter(function(f){return (S.fiche[f[0]]||"").trim();}).length;
    h+='<section class="panel accent'+fOpen+'"><button class="phead" data-panel="fiche"><span class="chev">&#9654;</span>';
    h+='<h2>Fiche de cohérence — Bloc 1<span class="cas">Tes décisions structurantes. À relire au début de chaque session.</span></h2>';
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

    BLOCS.forEach(function(b){
      var bd=b.qs.filter(function(q){return isDone(q.id);}).length;
      var op=S.open[b.id]?" open":"";
      h+='<section class="panel'+op+'" id="sec-'+b.id+'"><button class="phead" data-panel="'+b.id+'"><span class="chev">&#9654;</span>';
      h+='<h2>'+b.code+' — '+b.titre+'<span class="cas">'+b.cas+'</span></h2>';
      h+='<span class="count">'+bd+'/'+b.qs.length+'</span></button><div class="qlist">';
      b.qs.forEach(function(q){
        var st=S.status[q.id]||"todo";
        var lbl=st==="done"?"relu":st==="draft"?"rédigé":st==="wip"?"en cours":"à faire";
        var chipc=st==="done"?" done":st==="draft"?" draft":st==="wip"?" wip":"";
        var checkedCrit=q.k.filter(function(_,i){return (S.checks[q.id]||{})[i];}).length;
        var dots=[]; for(var i=0;i<q.k.length;i++){ dots.push(i<checkedCrit?"&#9679;":"&#9675;"); } dots=dots.join("&#8202;");
        h+='<button class="qrow" id="q-'+q.id+'" data-goq="'+q.id+'">';
        h+='<span class="qn">'+q.n+'</span><span class="qt">'+q.t+'</span>';
        h+='<span class="qprog">'+dots+' '+checkedCrit+'/'+q.k.length+'</span>';
        h+='<span class="chip'+chipc+'">'+lbl+'</span></button>';
      });
      h+='</div></section>';
    });
    return h;
  }

  /* ---------- REVISER ---------- */
  function vReviser(){
    if(SES){
      var c=SES.list[SES.i];
      if(!c){
        return '<div class="done-msg"><b>Session terminée.</b> '+SES.ok+' sue'+(SES.ok>1?'s':'')+' sur '+SES.list.length+'.</div><button class="jadd" data-lrn="stop">Revenir</button>';
      }
      var h='<div class="prog">Carte '+(SES.i+1)+' sur '+SES.list.length+' · '+c.t+'</div><div class="card"><div class="cq">'+c.q+'</div>';
      if(SES.show){
        h+='<div class="ca">'+c.a+'</div><div class="cbtns"><button class="no" data-lrn="ko">Pas su</button><button class="yes" data-lrn="ok">Je savais</button></div>';
        h+='<div class="fref"><button class="linkf" data-fiche-go="'+c.f+'">Fiche '+c.f+' du mémo &rarr;</button></div>';
      } else h+='<button class="reveal" data-lrn="show">Voir la réponse</button>';
      h+='</div><button class="quit" data-lrn="stop">Arrêter la session</button>';
      return h;
    }
    var d=dueCount(), vus=CARDS.filter(function(c){return (S.box[c.i]||0)>0;}).length;
    var maitr=CARDS.filter(function(c){return (S.box[c.i]||0)>=4;}).length;
    var h='<div class="stats" style="margin-top:0">';
    h+='<div class="stat"><div class="num">'+d+'</div><div class="lbl">À revoir</div></div>';
    h+='<div class="stat"><div class="num">'+vus+'<span class="on">/'+CARDS.length+'</span></div><div class="lbl">Vues</div></div>';
    h+='<div class="stat"><div class="num">'+maitr+'</div><div class="lbl">Maîtrisées</div></div></div>';
    h+='<div class="lab">Session</div><div class="states">';
    h+='<button data-lrn="start"'+(d?'':' disabled')+'>'+(d?'Cartes du jour ('+d+')':'Rien à revoir aujourd\'hui')+'</button>';
    h+='<button data-lrn="startall">Tout revoir ('+CARDS.length+')</button></div>';
    h+='<div class="lab">Par thème</div><div class="states">';
    var t={}; CARDS.forEach(function(c){t[c.t]=(t[c.t]||0)+1;});
    Object.keys(t).sort().forEach(function(k){
      var dd=CARDS.filter(function(c){return c.t===k&&dueNow(c.i);}).length;
      h+='<button data-theme="'+k+'">'+k+' <em>'+t[k]+(dd?' · '+dd+' à revoir':'')+'</em></button>';
    });
    h+='</div><p class="rappel">Les cartes reviennent selon ton niveau : une carte sue réapparaît dans 2, 4, 8 puis 16 jours ; une carte ratée revient dès demain.</p>';
    return h;
  }

  /* ---------- QUIZ ---------- */
  function vQuiz(){
    if(QZ){
      if(QZ.i>=QZ.list.length){
        var pct=Math.round(100*QZ.ok/QZ.list.length);
        var h='<div class="done-msg"><b>'+QZ.ok+' / '+QZ.list.length+'</b> — '+pct+' % de bonnes réponses.</div>';
        if(QZ.wrong.length){ h+='<div class="lab">À retravailler</div><ul class="att">'; QZ.wrong.forEach(function(w){h+='<li>'+w+'</li>';}); h+='</ul>'; }
        h+='<button class="jadd" data-lrn="qstop">Revenir</button>';
        return h;
      }
      var q=QZ.list[QZ.i];
      var h='<div class="prog">Question '+(QZ.i+1)+' sur '+QZ.list.length+' · score '+QZ.ok+'</div><div class="card"><div class="cq">'+q.q+'</div><div class="opts">';
      q.o.forEach(function(o,k){
        var cls=""; if(QZ.answered!==null){ if(k===q.c) cls=" good"; else if(k===QZ.answered) cls=" bad"; }
        h+='<button class="opt'+cls+'" data-opt="'+k+'"'+(QZ.answered!==null?' disabled':'')+'>'+o+'</button>';
      });
      h+='</div>';
      if(QZ.answered!==null) h+='<div class="expl">'+q.e+'</div><div class="cbtns"><button class="yes" data-lrn="qnext">Suivante</button></div>';
      h+='</div><button class="quit" data-lrn="qstop">Arrêter le quiz</button>';
      return h;
    }
    var h='<div class="lab">Lancer un quiz</div><div class="states">';
    h+='<button data-quiz="10">10 questions</button><button data-quiz="'+QCM.length+'">Toutes ('+QCM.length+')</button></div>';
    if(S.quiz.length){
      var best=S.quiz.reduce(function(a,r){var p=r.s/r.n;return p>a?p:a;},0);
      h+='<div class="stats"><div class="stat"><div class="num">'+S.quiz.length+'</div><div class="lbl">Quiz passés</div></div>';
      h+='<div class="stat"><div class="num">'+Math.round(best*100)+'<span class="on">%</span></div><div class="lbl">Meilleur score</div></div></div>';
      h+='<div class="lab">Historique</div>';
      S.quiz.slice(-8).reverse().forEach(function(r){
        h+='<div class="hrow"><span>'+r.d+'</span><b>'+r.s+' / '+r.n+'</b></div>';
      });
    } else h+='<p class="rappel">Aucun quiz passé pour l\'instant. Les questions portent sur les pièges classiques, pas seulement sur les définitions.</p>';
    return h;
  }

  /* ---------- MEMO ---------- */
  /* ---------- COURS ---------- */
  function vCours(supportSlug){
    var by={};
    if(typeof RESSOURCES!=="undefined"){
      Object.keys(RESSOURCES).forEach(function(qid){
        var r=RESSOURCES[qid], q=ALL.filter(function(x){return x.id===qid;})[0];
        (r.sources||[]).forEach(function(s){
          var parts=s.split(" — "), support=parts[0].trim(), note=parts.slice(1).join(" — ").trim();
          var slug=slugify(support);
          by[slug]=by[slug]||{name:support, items:[]};
          by[slug].items.push({qid:qid, note:note, label:q?(q.bloc.code+' · '+q.n+' — '+q.t):qid});
        });
      });
    }
    var slugs=Object.keys(by).sort(function(a,b){return by[a].name.localeCompare(by[b].name);});
    var h='<p class="intro">Les supports de cours mobilisés jusqu\'ici, et les questions que chacun alimente.</p>';
    if(!slugs.length) h+='<p class="rappel">Rien d\'indexé pour l\'instant.</p>';
    slugs.forEach(function(slug){
      var entry=by[slug], key="src-"+slug, op=(S.open[key]||supportSlug===slug)?" open":"";
      h+='<section class="panel'+op+'" id="src-'+slug+'"><button class="phead" data-panel="'+key+'"><span class="chev">&#9654;</span>';
      h+='<h2>'+entry.name+'</h2><span class="count">'+entry.items.length+'</span></button><div class="pbody">';
      entry.items.forEach(function(item){
        h+='<div class="src-item"><button class="linkf" data-goq="'+item.qid+'">'+item.label+'</button>';
        if(item.note) h+='<div class="rappel">'+item.note+'</div>';
        h+='</div>';
      });
      h+='</div></section>';
    });
    h+='<div class="lab">Fiches de méthode — '+FICHES.length+'</div>';
    h+='<p class="intro">Ouvre la fiche dont tu as besoin, applique-la au cas, passe à la suivante.</p>';
    FICHES.forEach(function(f){
      var op=S.open["f"+f.n]?" open":"";
      h+='<section class="panel'+op+'" id="fiche-'+f.n+'"><button class="phead" data-panel="f'+f.n+'"><span class="chev">&#9654;</span>';
      h+='<h2>'+f.n+'. '+f.t+'<span class="cas">'+f.q+'</span></h2></button>';
      h+='<div class="pbody memo">'+f.c+'</div></section>';
    });
    return h;
  }

  function positionQbar(){
    var qbar=main.querySelector(".qbar");
    if(qbar) qbar.style.top=nav.offsetHeight+"px";
  }
  window.addEventListener("resize",function(){ if(ROUTE.view==="question") positionQbar(); });

  function render(){
    renderNav();
    var v=ROUTE.view;
    if(v==="question"){
      main.classList.add("with-qbottom");
      main.innerHTML=vQuestion(ROUTE.id);
      positionQbar();
    } else {
      main.classList.remove("with-qbottom");
      var h = v==="dossiers"?vDossiers() : v==="reviser"?vReviser() : v==="quiz"?vQuiz() : v==="cours"?vCours(ROUTE.support) : vAccueil();
      var titles={accueil:"Suivi des 4 dossiers",dossiers:"Dossiers",reviser:"Réviser",quiz:"Quiz",cours:"Cours"};
      var subs={accueil:"Formation — dépôt début décembre",dossiers:"44 livrables · critères et brouillons",reviser:"Cartes à répétition espacée",quiz:"Questions à choix multiple",cours:"Index des supports et fiches de méthode"};
      main.innerHTML='<div class="eyebrow">'+subs[v]+'</div><h1>'+titles[v]+'</h1>'+h;
      if(v==="cours" && ROUTE.support){
        var t=document.getElementById("src-"+ROUTE.support);
        if(t){ var tt=t; setTimeout(function(){ tt.scrollIntoView({behavior:"smooth",block:"start"}); },60); }
      }
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
    main.querySelectorAll("[data-go]").forEach(function(el){
      el.addEventListener("click",function(){ go(el.getAttribute("data-go")); });
    });
    main.querySelectorAll("[data-fiche-go]").forEach(function(el){
      el.addEventListener("click",function(){
        var n=el.getAttribute("data-fiche-go"); S.open["f"+n]=true; save(); go("cours");
        setTimeout(function(){ var t=document.getElementById("fiche-"+n); if(t) t.scrollIntoView({behavior:"smooth",block:"start"}); },60);
      });
    });
    main.querySelectorAll("[data-theme]").forEach(function(el){
      el.addEventListener("click",function(){
        SES={list:shuffle(CARDS.filter(function(c){return c.t===el.getAttribute("data-theme");})),i:0,show:false,ok:0}; render();
      });
    });
    main.querySelectorAll("[data-quiz]").forEach(function(el){
      el.addEventListener("click",function(){
        var n=parseInt(el.getAttribute("data-quiz"),10);
        QZ={list:shuffle(QCM).slice(0,n),i:0,ok:0,answered:null,wrong:[]}; render();
      });
    });
    main.querySelectorAll("[data-opt]").forEach(function(el){
      el.addEventListener("click",function(){
        if(QZ.answered!==null) return;
        var k=parseInt(el.getAttribute("data-opt"),10), q=QZ.list[QZ.i];
        QZ.answered=k;
        if(k===q.c) QZ.ok++; else QZ.wrong.push(q.q);
        if(QZ.i===QZ.list.length-1){ S.quiz.push({d:new Date().toLocaleDateString("fr-FR"),s:QZ.ok,n:QZ.list.length}); save(); }
        render();
      });
    });
    main.querySelectorAll("[data-lrn]").forEach(function(el){
      el.addEventListener("click",function(){
        var a=el.getAttribute("data-lrn");
        if(a==="start"){ var l=shuffle(CARDS.filter(function(c){return dueNow(c.i);})); if(!l.length) return; SES={list:l,i:0,show:false,ok:0}; }
        else if(a==="startall") SES={list:shuffle(CARDS),i:0,show:false,ok:0};
        else if(a==="show") SES.show=true;
        else if(a==="ok"){ grade(SES.list[SES.i].i,true); SES.ok++; SES.i++; SES.show=false; }
        else if(a==="ko"){ grade(SES.list[SES.i].i,false); SES.i++; SES.show=false; }
        else if(a==="stop") SES=null;
        else if(a==="qnext"){ QZ.i++; QZ.answered=null; }
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

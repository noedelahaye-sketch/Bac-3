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
    saveTimer = setTimeout(function(){ try{ Store.set(KEY, JSON.stringify(S)); }catch(e){} }, 300);
  }
  function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
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

  var VIEWS=[["accueil","Accueil"],["dossiers","Dossiers"],["reviser","Réviser"],["quiz","Quiz"],["memo","Mémo"]];

  function go(v){
    if(v!==S.view){ SES=null; QZ=null; }
    S.view=v; save();
    if(location.hash!=="#"+v) location.hash=v;
    render();
    window.scrollTo(0,0);
  }

  function renderNav(){
    var h="";
    VIEWS.forEach(function(v){
      var badge="";
      if(v[0]==="dossiers"){ var r=ALL.length-doneCount(); if(r) badge='<i>'+r+'</i>'; }
      if(v[0]==="reviser"){ var d=dueCount(); if(d) badge='<i>'+d+'</i>'; }
      h+='<button class="navb'+(S.view===v[0]?" on":"")+'" data-go="'+v[0]+'">'+v[1]+badge+'</button>';
    });
    nav.innerHTML=h;
    nav.querySelectorAll("[data-go]").forEach(function(el){
      el.addEventListener("click",function(){ go(el.getAttribute("data-go")); });
    });
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
      var st=S.status[q.id], c=isDone(q.id)?"done":(st==="wip"?"wip":"");
      if(i===exp&&left>0) c+=" mark";
      h+='<div class="tick '+c+'" title="'+q.bloc.code+' '+q.n+'"></div>';
    });
    h+='</div><div class="legend"><span><i class="dot" style="background:var(--signal)"></i>rédigé</span><span><i class="dot" style="background:#9AA8E8"></i>en cours</span><span><i class="dot" style="background:#D5D9D0"></i>à faire</span><span><i class="dot" style="background:var(--alert);width:2px;height:11px"></i>où tu devrais en être</span></div>';
    h+='<div class="stats"><div class="stat"><div class="num">'+done+'<span class="on">/'+ALL.length+'</span></div><div class="lbl">Terminés</div></div>';
    h+='<div class="stat"><div class="num">'+Math.floor(wl)+'</div><div class="lbl">Semaines restantes</div></div>';
    h+='<div class="stat"><div class="num">'+left+'</div><div class="lbl">Restants</div></div></div></div>';

    var nxt=ALL.filter(function(q){return !isDone(q.id);})[0];
    if(nxt){
      h+='<div class="next"><div class="eyebrow">La prochaine chose à faire</div>';
      h+='<div class="t">'+nxt.bloc.code+' · '+nxt.n+' — '+nxt.t+'</div>';
      h+='<button data-jump="'+nxt.id+'" data-bloc="'+nxt.bloc.id+'">Ouvrir</button></div>';
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
        var qo=S.open[q.id]?" open":"";
        h+='<div class="q'+qo+'" id="q-'+q.id+'"><button class="qhead" data-q="'+q.id+'"><span class="qn">'+q.n+'</span><span class="qt">'+q.t+'</span><span class="chip'+chipc+'">'+lbl+'</span></button><div class="qbody">';
        var inf=INFO[q.id];
        if(inf){
          h+='<div class="lab">Ce qui est attendu concrètement</div><ul class="att">';
          inf[0].forEach(function(a){h+='<li>'+a+'</li>';});
          h+='</ul><details class="notions"><summary>Notions à mobiliser — '+inf[1].length+'</summary><ul>';
          inf[1].forEach(function(n){h+='<li>'+n+'</li>';});
          h+='</ul><p class="rappel">Ces notions sont détaillées dans l\'onglet Mémo. Si un point te manque, demande-le-moi.</p></details>';
        }
        if(q.trame) h+='<div class="lab">Trame détaillée</div><div class="trame">'+q.trame+'</div>';
        h+='<div class="lab">Critères évalués — compétence '+q.c+'</div>';
        q.k.forEach(function(k,i){
          var ck=(S.checks[q.id]||{})[i]?" checked":"";
          h+='<label class="crit"><input type="checkbox" data-check="'+q.id+'" data-i="'+i+'"'+ck+'><span>'+k+'</span></label>';
        });
        h+='<div class="lab">Brouillon</div><textarea class="f big" data-note="'+q.id+'" placeholder="Écris ici. Tu récupéreras tout d\'un coup depuis l\'accueil, bouton Exporter.">'+esc(S.notes[q.id])+'</textarea>';
        h+='<div class="lab">Où j\'en suis</div><div class="states">';
        [["todo","À faire"],["wip","En cours"],["draft","Rédigé"],["done","Relu"]].forEach(function(p){
          h+='<button data-set="'+q.id+'" data-v="'+p[0]+'" aria-pressed="'+(st===p[0])+'">'+p[1]+'</button>';
        });
        h+='</div></div></div>';
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
  function vMemo(){
    var h='<p class="intro">Les '+FICHES.length+' notions qui couvrent les 43 questions. Ouvre la fiche dont tu as besoin, applique-la au cas, passe à la suivante.</p>';
    FICHES.forEach(function(f){
      var op=S.open["f"+f.n]?" open":"";
      h+='<section class="panel'+op+'" id="fiche-'+f.n+'"><button class="phead" data-panel="f'+f.n+'"><span class="chev">&#9654;</span>';
      h+='<h2>'+f.n+'. '+f.t+'<span class="cas">'+f.q+'</span></h2></button>';
      h+='<div class="pbody memo">'+f.c+'</div></section>';
    });
    return h;
  }

  function render(){
    renderNav();
    var v=S.view;
    var h = v==="dossiers"?vDossiers() : v==="reviser"?vReviser() : v==="quiz"?vQuiz() : v==="memo"?vMemo() : vAccueil();
    var titles={accueil:"Suivi des 4 dossiers",dossiers:"Dossiers",reviser:"Réviser",quiz:"Quiz",memo:"Mémo méthodo"};
    var subs={accueil:"Formation — dépôt début décembre",dossiers:"44 livrables · critères et brouillons",reviser:"Cartes à répétition espacée",quiz:"Questions à choix multiple",memo:FICHES.length+" fiches de méthode"};
    main.innerHTML='<div class="eyebrow">'+subs[v]+'</div><h1>'+titles[v]+'</h1>'+h;
    bind();
  }

  function bind(){
    main.querySelectorAll("[data-panel]").forEach(function(el){
      el.addEventListener("click",function(){ var id=el.getAttribute("data-panel"); S.open[id]=!S.open[id]; save(); render(); });
    });
    main.querySelectorAll("[data-q]").forEach(function(el){
      el.addEventListener("click",function(){ var id=el.getAttribute("data-q"); S.open[id]=!S.open[id]; save(); render(); });
    });
    main.querySelectorAll("[data-set]").forEach(function(el){
      el.addEventListener("click",function(){ S.status[el.getAttribute("data-set")]=el.getAttribute("data-v"); save(); render(); });
    });
    main.querySelectorAll("[data-check]").forEach(function(el){
      el.addEventListener("change",function(){ var id=el.getAttribute("data-check"),i=el.getAttribute("data-i"); S.checks[id]=S.checks[id]||{}; S.checks[id][i]=el.checked; save(); });
    });
    main.querySelectorAll("[data-note]").forEach(function(el){
      el.addEventListener("input",function(){ S.notes[el.getAttribute("data-note")]=el.value; save(); });
    });
    main.querySelectorAll("[data-fiche]").forEach(function(el){
      el.addEventListener("input",function(){ S.fiche[el.getAttribute("data-fiche")]=el.value; save(); });
    });
    main.querySelectorAll("[data-del]").forEach(function(el){
      el.addEventListener("click",function(){ var id=el.getAttribute("data-del"); S.journal=S.journal.filter(function(e){return String(e.id)!==id;}); save(); render(); });
    });
    main.querySelectorAll("[data-jump]").forEach(function(el){
      el.addEventListener("click",function(){
        S.open[el.getAttribute("data-bloc")]=true; S.open[el.getAttribute("data-jump")]=true; save(); go("dossiers");
        setTimeout(function(){ var t=document.getElementById("q-"+el.getAttribute("data-jump")); if(t) t.scrollIntoView({behavior:"smooth",block:"center"}); },60);
      });
    });
    main.querySelectorAll("[data-go]").forEach(function(el){
      el.addEventListener("click",function(){ go(el.getAttribute("data-go")); });
    });
    main.querySelectorAll("[data-fiche-go]").forEach(function(el){
      el.addEventListener("click",function(){
        var n=el.getAttribute("data-fiche-go"); S.open["f"+n]=true; save(); go("memo");
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

  window.addEventListener("hashchange",function(){
    var v=location.hash.replace("#","");
    if(v && v!==S.view && VIEWS.some(function(x){return x[0]===v;})){ SES=null; QZ=null; S.view=v; render(); }
  });

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
    var hv=location.hash.replace("#","");
    if(hv && VIEWS.some(function(x){return x[0]===hv;})) S.view=hv;
    render();
  })();
})();

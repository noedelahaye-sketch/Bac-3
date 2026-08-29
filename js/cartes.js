/* Cartes mentales — moteur autonome : texte indenté en entrée, SVG en sortie.
   Aucune dépendance, aucune connaissance de l'application : app.js s'occupe du
   routage, du stockage et des vues, ce fichier ne fait que lire un plan et le
   dessiner. Le plan est la seule source de vérité — il n'y a pas de position
   enregistrée, donc rien à ranger à la main et rien à réparer après coup. */
(function(){
  "use strict";

  var GAP_X=52;        /* espace entre deux colonnes de profondeur */
  var GAP_Y=12;        /* espace vertical entre deux nœuds voisins */
  var PAD_X=11, PAD_Y=8;
  var LINE_H=16, FONT_SIZE=13, ROOT_FONT=15;
  var MAX_LINE=186;    /* largeur de texte au-delà de laquelle on passe à la ligne */
  var MAX_LINES=3;
  var MARGE=14;
  var AJOUT_R=10;               /* le « + » au bout d'un étage : une pastille */

  /* Mesure réelle du texte : sans elle les boîtes sont soit trop larges, soit
     trop courtes selon les mots. Le canevas sert uniquement de règle. */
  var mesureCtx=null;
  function largeur(txt, taille, gras){
    if(!mesureCtx){
      var c=document.createElement("canvas");
      mesureCtx=c.getContext("2d");
    }
    mesureCtx.font=(gras?"600 ":"500 ")+taille+"px 'Instrument Sans', system-ui, sans-serif";
    return mesureCtx.measureText(txt).width;
  }

  function couper(txt, taille, gras){
    var mots=String(txt).split(/\s+/).filter(Boolean);
    if(!mots.length) return [""];
    var lignes=[], cur=mots[0];
    for(var i=1;i<mots.length;i++){
      var essai=cur+" "+mots[i];
      if(largeur(essai,taille,gras)<=MAX_LINE){ cur=essai; }
      else { lignes.push(cur); cur=mots[i]; }
    }
    lignes.push(cur);
    if(lignes.length>MAX_LINES){
      lignes=lignes.slice(0,MAX_LINES);
      lignes[MAX_LINES-1]=lignes[MAX_LINES-1].replace(/\s*\S*$/,"")+"…";
    }
    return lignes;
  }

  /* ---------- lecture du plan ----------
     Une ligne = une idée, l'indentation fait la hiérarchie (2 espaces ou une
     tabulation par niveau). Un saut de plus d'un niveau est ramené au niveau
     suivant : on ne refuse jamais un plan, on le redresse. */
  function parse(txt, titre){
    var racine={t:titre||"Sans titre", k:[], path:"r", niveau:0, ligne:-1};
    var pile=[racine];
    var no=0;
    String(txt||"").split(/\r?\n/).forEach(function(ligne){
      if(!ligne.trim()) return;
      var brut=ligne.replace(/\t/g,"  ");
      var creux=brut.match(/^ */)[0].length;
      var niveau=Math.floor(creux/2)+1;
      if(niveau>pile.length) niveau=pile.length;
      var parent=pile[niveau-1];
      var n={t:brut.trim().replace(/^[-*·]\s*/,""), k:[], niveau:niveau, ligne:no++};
      n.path=parent.path+"."+parent.k.length;
      parent.k.push(n);
      pile[niveau]=n;
      pile.length=niveau+1;
    });
    return racine;
  }

  /* Le plan tel qu'il s'écrit, à partir d'un arbre : sert au pré-remplissage. */
  function serialise(racine){
    var out=[];
    (function descend(n, prof){
      if(prof>0) out.push(new Array(prof).join("  ")+n.t);
      n.k.forEach(function(e){ descend(e, prof+1); });
    })(racine, 0);
    return out.join("\n");
  }

  function compte(n){
    var t=0;
    n.k.forEach(function(e){ t+=1+compte(e); });
    return t;
  }

  /* ---------- retouche du plan ----------
     L'établi ne manipule jamais l'arbre : il agit sur les lignes du plan, qui
     reste la seule source. Chaque nœud connaît son numéro de ligne (n.ligne),
     et ces fonctions font le reste — ajouter, supprimer, décaler, déplacer une
     branche entière. Toutes travaillent sur un plan normalisé : lignes vides
     retirées, tabulations converties, sauts de niveau redressés. Sans ça, le
     numéro de ligne d'un nœud ne désignerait pas la bonne ligne du texte. */
  function normalise(txt){
    return serialise(parse(txt, ""));
  }
  function enLignes(txt){
    return normalise(txt).split("\n").filter(function(l){ return l.trim(); });
  }
  function niveauDe(l){
    return Math.floor(l.match(/^ */)[0].length/2)+1;
  }
  function creuse(txt, niveau){
    return new Array(Math.max(1,niveau)).join("  ")+String(txt).trim();
  }
  /* Première ligne qui n'appartient plus à la branche ouverte en i. */
  function finBranche(L, i){
    var n=niveauDe(L[i]), j=i+1;
    while(j<L.length && niveauDe(L[j])>n) j++;
    return j;
  }
  function parentDe(L, i){
    var n=niveauDe(L[i]);
    for(var j=i-1;j>=0;j--){ if(niveauDe(L[j])<n) return j; }
    return -1;
  }
  /* Le frère d'avant / d'après, ou -1 : c'est ce qui autorise ou refuse un
     décalage (on ne peut pas indenter une idée qui n'a rien au-dessus d'elle). */
  function frereAvant(L, i){
    var n=niveauDe(L[i]);
    for(var j=i-1;j>=0;j--){
      var m=niveauDe(L[j]);
      if(m===n) return j;
      if(m<n) return -1;
    }
    return -1;
  }
  function frereApres(L, i){
    var f=finBranche(L,i);
    return (f<L.length && niveauDe(L[f])===niveauDe(L[i])) ? f : -1;
  }

  /* Ajouts. i = -1 désigne la racine : son enfant est une idée de niveau 1
     posée en fin de plan. Renvoie l'index de la ligne créée. */
  function ajouteEnfant(L, i, txt){
    if(i<0){ L.push(creuse(txt||"", 1)); return L.length-1; }
    var pos=finBranche(L,i);
    L.splice(pos, 0, creuse(txt||"", niveauDe(L[i])+1));
    return pos;
  }
  function ajouteFrere(L, i, txt){
    if(i<0) return ajouteEnfant(L, -1, txt);
    var pos=finBranche(L,i);
    L.splice(pos, 0, creuse(txt||"", niveauDe(L[i])));
    return pos;
  }
  function supprime(L, i){
    if(i<0) return -1;
    var f=finBranche(L,i);
    L.splice(i, f-i);
    return Math.min(i, L.length-1);
  }
  function renomme(L, i, txt){
    if(i<0) return;
    L[i]=creuse(txt, niveauDe(L[i]));
  }

  /* Décalages et déplacements : toujours la branche entière, jamais la seule
     ligne — sinon les idées filles changeraient de parent sans qu'on l'ait
     demandé. Renvoie le nouvel index, ou -1 si le geste n'a pas de sens. */
  function detache(L, i){
    var f=finBranche(L,i);
    return L.splice(i, f-i);
  }
  function decaleBranche(b, delta){
    var base=niveauDe(b[0]);
    return b.map(function(l){ return creuse(l, niveauDe(l)-base+Math.max(1,base+delta)); });
  }
  function indente(L, i){
    if(i<0 || frereAvant(L,i)<0) return -1;
    var b=decaleBranche(detache(L,i), 1);
    L.splice.apply(L, [i,0].concat(b));
    return i;
  }
  function desindente(L, i){
    if(i<0 || niveauDe(L[i])<=1) return -1;
    var p=parentDe(L,i);
    var b=decaleBranche(detache(L,i), -1);
    /* on ressort sous le parent, après tout ce qu'il contient encore */
    var pos=finBranche(L,p);
    L.splice.apply(L, [pos,0].concat(b));
    return pos;
  }
  function monte(L, i){
    var f=frereAvant(L,i);
    if(i<0 || f<0) return -1;
    var b=detache(L,i);
    L.splice.apply(L, [f,0].concat(b));
    return f;
  }
  function descend(L, i){
    var f=frereApres(L,i);
    if(i<0 || f<0) return -1;
    var b=detache(L,i);
    /* i pointe désormais sur l'ex-frère suivant : on passe derrière lui */
    var fin=finBranche(L,i);
    L.splice.apply(L, [fin,0].concat(b));
    return fin;
  }

  /* Déplacement libre : la branche i part se ranger auprès de cible, soit
     dedans (dernière fille), soit juste avant / juste après. C'est le geste du
     glisser-déposer. On refuse de déplacer une branche dans sa propre
     descendance : la carte n'aurait plus de racine. */
  function deplace(L, i, cible, ou){
    if(i<0 || cible===i) return -1;
    var f=finBranche(L,i);
    if(cible>i && cible<f) return -1;
    var b=detache(L,i);
    var c=cible>i ? cible-b.length : cible;
    var niv, pos;
    if(ou==="dedans"){ niv=niveauDe(L[c])+1; pos=finBranche(L,c); }
    else if(ou==="avant"){ niv=niveauDe(L[c]); pos=c; }
    else { niv=niveauDe(L[c]); pos=finBranche(L,c); }
    var d=decaleBranche(b, niv-niveauDe(b[0]));
    L.splice.apply(L, [pos,0].concat(d));
    return pos;
  }

  /* Le chemin d'un nœud (r.0.2) à partir de son numéro de ligne, et l'inverse :
     l'établi parle en chemins (c'est ce que porte le SVG), le plan en lignes. */
  function chemins(racine){
    var parLigne={}, parChemin={};
    (function descend(n){
      if(n.ligne>=0){ parLigne[n.ligne]=n.path; parChemin[n.path]=n.ligne; }
      n.k.forEach(descend);
    })(racine);
    return {ligne:parLigne, chemin:parChemin};
  }

  /* ---------- mise en page gauche → droite ----------
     Les colonnes sont alignées sur la profondeur : deux idées de même niveau
     commencent au même x, ce qui rend la carte lisible sans la ranger. */
  function layout(racine, plies, opts){
    plies=plies||{};
    opts=opts||{};
    var colonnes=[];
    (function mesure(n){
      var estRacine=n.niveau===0;
      n.lignes=couper(n.t, estRacine?ROOT_FONT:FONT_SIZE, estRacine);
      var lmax=0;
      n.lignes.forEach(function(l){ lmax=Math.max(lmax, largeur(l, estRacine?ROOT_FONT:FONT_SIZE, estRacine)); });
      n.w=Math.round(lmax)+PAD_X*2;
      n.h=n.lignes.length*(estRacine?LINE_H+2:LINE_H)+PAD_Y*2;
      n.plie=!!plies[n.path] && n.k.length>0;
      n.caches=n.plie?compte(n):0;
      if(n.plie) n.w+=22;
      colonnes[n.niveau]=Math.max(colonnes[n.niveau]||0, n.w);
      if(!n.plie) n.k.forEach(mesure);
    })(racine);

    var x=[], acc=MARGE;
    colonnes.forEach(function(w,i){ x[i]=acc; acc+=w+GAP_X; });

    /* La colonne d'un étage, même quand aucune idée n'y figure encore : c'est
       là que se pose le bouton « + » d'un nœud sans enfant. */
    function colonne(niveau, n){
      return (x[niveau]!==undefined)?x[niveau]:(n.x+n.w+GAP_X);
    }
    var curseur=MARGE, noeuds=[], liens=[], ajouts=[];
    (function place(n){
      n.x=x[n.niveau];
      if(n.plie || !n.k.length){
        n.y=curseur;
        curseur+=n.h+GAP_Y;
      } else {
        n.k.forEach(place);
        /* Un « + » au bout de chaque étage ouvert : la prochaine idée se pose
           là où on l'attend, sous la dernière notée, sans rien sélectionner
           d'abord. Il occupe sa propre place, il ne recouvre donc jamais rien. */
        if(opts.etabli){
          ajouts.push({path:n.path, de:n, x:colonne(n.niveau+1, n), y:curseur, w:AJOUT_R*2, h:AJOUT_R*2});
          curseur+=AJOUT_R*2+GAP_Y;
        }
        var p=n.k[0], d=n.k[n.k.length-1];
        n.y=Math.round((p.y+p.h/2 + d.y+d.h/2)/2 - n.h/2);
      }
      noeuds.push(n);
      if(!n.plie) n.k.forEach(function(e){ liens.push({de:n, vers:e}); });
    })(racine);

    /* Une idée sans fille n'a pas d'étage, donc pas de « + » permanent : il
       n'apparaît qu'une fois qu'on l'a choisie, en face d'elle. */
    if(opts.etabli && opts.selection){
      noeuds.forEach(function(n){
        if(n.path!==opts.selection || n.k.length) return;
        ajouts.push({path:n.path, de:n, x:colonne(n.niveau+1, n), y:Math.round(n.y+n.h/2-AJOUT_R),
                     w:AJOUT_R*2, h:AJOUT_R*2, seul:true});
      });
    }

    /* La racine peut déborder vers le haut si sa branche est courte. */
    var ymin=Infinity, ymax=-Infinity, xmax=0;
    noeuds.forEach(function(n){
      ymin=Math.min(ymin,n.y); ymax=Math.max(ymax,n.y+n.h); xmax=Math.max(xmax,n.x+n.w);
    });
    ajouts.forEach(function(a){
      ymin=Math.min(ymin,a.y); ymax=Math.max(ymax,a.y+a.h); xmax=Math.max(xmax,a.x+a.w);
    });
    var dy=MARGE-ymin;
    if(dy!==0){
      noeuds.forEach(function(n){ n.y+=dy; });
      ajouts.forEach(function(a){ a.y+=dy; });
    }

    return {noeuds:noeuds, liens:liens, ajouts:ajouts,
            w:Math.round(xmax+MARGE), h:Math.round(ymax-ymin+MARGE*2)};
  }

  /* La couleur vient de la branche de premier niveau : on suit une idée à
     l'œil sans lire, et deux branches voisines ne se confondent jamais. */
  function branche(n){
    if(n.niveau===0) return "r";
    var p=n.path.split(".");
    return p[1]||"0";
  }

  function esc(s){
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  /* opts.selection : chemin du nœud en cours de retouche (l'établi l'entoure).
     opts.etabli : la carte devient l'établi — un « + » au bout de chaque étage
     et, pour l'idée choisie sans fille, un « + » en face d'elle. Le pliage n'a
     pas de poignée : c'est la boîte elle-même qu'on ouvre et qu'on referme. */
  function svg(racine, plies, opts){
    opts=opts||{};
    var L=layout(racine, plies, opts);
    var h='<svg class="mm-svg" width="'+L.w+'" height="'+L.h+'" viewBox="0 0 '+L.w+' '+L.h+'" xmlns="http://www.w3.org/2000/svg">';
    L.liens.forEach(function(l){
      var x1=l.de.x+l.de.w, y1=l.de.y+l.de.h/2, x2=l.vers.x, y2=l.vers.y+l.vers.h/2;
      var mx=(x1+x2)/2;
      h+='<path class="mm-lien b'+(branche(l.vers)%6)+'" d="M'+x1+' '+y1+' C'+mx+' '+y1+' '+mx+' '+y2+' '+x2+' '+y2+'"/>';
    });
    L.noeuds.forEach(function(n){
      var estRacine=n.niveau===0;
      var cls='mm-noeud'+(estRacine?' mm-racine':' b'+(branche(n)%6))+(n.plie?' mm-plie':'')+(n.k.length?' mm-parent':'')
             +(opts.selection===n.path?' mm-sel':'');
      h+='<g class="'+cls+'" data-mm-path="'+esc(n.path)+'">';
      h+='<rect class="mm-boite" x="'+n.x+'" y="'+n.y+'" width="'+n.w+'" height="'+n.h+'" rx="9"/>';
      var taille=estRacine?ROOT_FONT:FONT_SIZE;
      var lh=estRacine?LINE_H+2:LINE_H;
      var y0=n.y+PAD_Y+lh*0.76;
      n.lignes.forEach(function(l,i){
        h+='<text class="mm-txt" x="'+(n.x+PAD_X)+'" y="'+(y0+i*lh)+'" font-size="'+taille+'">'+esc(l)+'</text>';
      });
      if(n.plie){
        h+='<circle class="mm-pastille" cx="'+(n.x+n.w-13)+'" cy="'+(n.y+n.h/2)+'" r="9"/>';
        h+='<text class="mm-pastille-txt" x="'+(n.x+n.w-13)+'" y="'+(n.y+n.h/2+3.5)+'">'+n.caches+'</text>';
      }
      h+='</g>';
    });
    /* Le « + » se raccroche à son idée comme une fille, mais en pointillé :
       la place est ouverte, elle n'est pas encore prise. */
    (L.ajouts||[]).forEach(function(a){
      var cx=a.x+a.w/2, cy=a.y+a.h/2, d=a.de;
      if(d){
        var x1=d.x+d.w, y1=d.y+d.h/2, x2=a.x, mx=(x1+x2)/2;
        h+='<path class="mm-lien mm-lien-ajout" d="M'+x1+' '+y1+' C'+mx+' '+y1+' '+mx+' '+cy+' '+x2+' '+cy+'"/>';
      }
      h+='<g class="mm-ajout'+(a.seul?' mm-ajout-seul':'')+'" data-mm-ajout="'+esc(a.path)+'">';
      h+='<circle class="mm-ajout-boite" cx="'+cx+'" cy="'+cy+'" r="'+(a.w/2)+'"/>';
      h+='<text class="mm-ajout-txt" x="'+cx+'" y="'+(cy+4.5)+'">+</text>';
      h+='</g>';
    });
    h+='</svg>';
    return h;
  }

  window.CARTES={
    parse:parse, serialise:serialise, layout:layout, svg:svg, compte:compte,
    normalise:normalise, enLignes:enLignes, chemins:chemins,
    plan:{
      niveau:niveauDe, finBranche:finBranche, parent:parentDe,
      frereAvant:frereAvant, frereApres:frereApres,
      ajouteEnfant:ajouteEnfant, ajouteFrere:ajouteFrere,
      supprime:supprime, renomme:renomme,
      indente:indente, desindente:desindente, monte:monte, descend:descend,
      deplace:deplace
    }
  };
})();

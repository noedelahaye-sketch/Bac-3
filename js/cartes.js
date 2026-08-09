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
    var racine={t:titre||"Sans titre", k:[], path:"r", niveau:0};
    var pile=[racine];
    String(txt||"").split(/\r?\n/).forEach(function(ligne){
      if(!ligne.trim()) return;
      var brut=ligne.replace(/\t/g,"  ");
      var creux=brut.match(/^ */)[0].length;
      var niveau=Math.floor(creux/2)+1;
      if(niveau>pile.length) niveau=pile.length;
      var parent=pile[niveau-1];
      var n={t:brut.trim().replace(/^[-*·]\s*/,""), k:[], niveau:niveau};
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

  /* ---------- mise en page gauche → droite ----------
     Les colonnes sont alignées sur la profondeur : deux idées de même niveau
     commencent au même x, ce qui rend la carte lisible sans la ranger. */
  function layout(racine, plies){
    plies=plies||{};
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

    var curseur=MARGE, noeuds=[], liens=[];
    (function place(n){
      n.x=x[n.niveau];
      if(n.plie || !n.k.length){
        n.y=curseur;
        curseur+=n.h+GAP_Y;
      } else {
        n.k.forEach(place);
        var p=n.k[0], d=n.k[n.k.length-1];
        n.y=Math.round((p.y+p.h/2 + d.y+d.h/2)/2 - n.h/2);
      }
      noeuds.push(n);
      if(!n.plie) n.k.forEach(function(e){ liens.push({de:n, vers:e}); });
    })(racine);

    /* La racine peut déborder vers le haut si sa branche est courte. */
    var ymin=Infinity, ymax=-Infinity, xmax=0;
    noeuds.forEach(function(n){
      ymin=Math.min(ymin,n.y); ymax=Math.max(ymax,n.y+n.h); xmax=Math.max(xmax,n.x+n.w);
    });
    var dy=MARGE-ymin;
    if(dy!==0) noeuds.forEach(function(n){ n.y+=dy; });

    return {noeuds:noeuds, liens:liens, w:Math.round(xmax+MARGE), h:Math.round(ymax-ymin+MARGE*2)};
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

  function svg(racine, plies){
    var L=layout(racine, plies);
    var h='<svg class="mm-svg" width="'+L.w+'" height="'+L.h+'" viewBox="0 0 '+L.w+' '+L.h+'" xmlns="http://www.w3.org/2000/svg">';
    L.liens.forEach(function(l){
      var x1=l.de.x+l.de.w, y1=l.de.y+l.de.h/2, x2=l.vers.x, y2=l.vers.y+l.vers.h/2;
      var mx=(x1+x2)/2;
      h+='<path class="mm-lien b'+(branche(l.vers)%6)+'" d="M'+x1+' '+y1+' C'+mx+' '+y1+' '+mx+' '+y2+' '+x2+' '+y2+'"/>';
    });
    L.noeuds.forEach(function(n){
      var estRacine=n.niveau===0;
      var cls='mm-noeud'+(estRacine?' mm-racine':' b'+(branche(n)%6))+(n.plie?' mm-plie':'')+(n.k.length?' mm-parent':'');
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
    h+='</svg>';
    return h;
  }

  window.CARTES={ parse:parse, serialise:serialise, layout:layout, svg:svg, compte:compte };
})();

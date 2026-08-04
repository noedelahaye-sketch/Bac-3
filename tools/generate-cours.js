#!/usr/bin/env node
/*
 * Génère js/cours.js, js/questions.js, js/flashcards.js et js/quiz.js à
 * partir de cours:/blocs.json, des résumés markdown de
 * cours:/bloc<n>:/resume:/*.md, du contenu de cours par question de
 * cours:/bloc<n>:/questions:/*.md, des flashcards de
 * cours:/bloc<n>:/flashcards:/*.json et du quiz de
 * cours:/bloc<n>:/quiz:/*.json.
 *
 * Aucune dépendance externe (frontmatter et markdown parsés à la main) :
 * le résultat est un artefact de build, jamais édité à la main. Les .md
 * et .json sources restent la seule source de vérité.
 *
 * Usage :
 *   node tools/generate-cours.js                  écrit js/cours.js, js/questions.js, js/flashcards.js et js/quiz.js
 *   node tools/generate-cours.js --preview=b1-f02  écrit un aperçu HTML autonome, sans rien écrire ailleurs
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const COURS_DIR = path.join(ROOT, "cours:");
const OUT_FILE = path.join(ROOT, "js", "cours.js");
const QUESTIONS_OUT_FILE = path.join(ROOT, "js", "questions.js");
const FLASHCARDS_OUT_FILE = path.join(ROOT, "js", "flashcards.js");
const QUIZ_OUT_FILE = path.join(ROOT, "js", "quiz.js");

/* ---------- Frontmatter (YAML minimal, propre au schéma des résumés) ---------- */

function parseScalar(s) {
  s = s.trim();
  if (s === "" || s === "[]") return [];
  if (s.startsWith("[") && s.endsWith("]")) {
    return s
      .slice(1, -1)
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x !== "")
      .map(parseScalar);
  }
  if (/^".*"$/.test(s)) return s.slice(1, -1);
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  return s;
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error("Frontmatter introuvable (délimiteurs --- manquants)");
  const lines = m[1].split(/\r?\n/);
  const body = m[2];
  const data = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const km = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!km) {
      i++;
      continue;
    }
    const key = km[1], rest = km[2];
    if (rest.trim() === "") {
      // bloc = liste de maps (ex. sources: - support: "..." \n lecons: N)
      const items = [];
      i++;
      while (i < lines.length && /^\s+-\s/.test(lines[i])) {
        const item = {};
        const first = lines[i].match(/^\s*-\s*([a-zA-Z_]+):\s*(.*)$/);
        if (first) item[first[1]] = parseScalar(first[2]);
        i++;
        while (i < lines.length && /^\s{2,}[a-zA-Z_]+:/.test(lines[i]) && !/^\s*-\s/.test(lines[i])) {
          const cm = lines[i].match(/^\s*([a-zA-Z_]+):\s*(.*)$/);
          if (cm) item[cm[1]] = parseScalar(cm[2]);
          i++;
        }
        items.push(item);
      }
      data[key] = items;
    } else {
      data[key] = parseScalar(rest);
      i++;
    }
  }
  return { data, body };
}

/* ---------- Markdown -> HTML (sous-ensemble utilisé par les résumés) ---------- */

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(text, linkMap) {
  let t = escapeHtml(text);
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, target) {
    if (/^https?:\/\//.test(target)) {
      return '<a href="' + target + '" target="_blank" rel="noopener">' + label + "</a>";
    }
    const file = target.split("#")[0].split("/").pop();
    const id = linkMap[file];
    if (id) return '<a href="#" data-resume-go="' + id + '">' + label + "</a>";
    return label; // lien relatif non résolu : on garde le texte, pas le lien mort
  });
  t = t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  t = t.replace(/\*([^*]+)\*/g, "<i>$1</i>");
  return t;
}

function splitRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function isTableSep(line) {
  return /^\|[\s:|-]+\|?\s*$/.test(line.trim());
}

function convertBody(body, linkMap, sourcesMap) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let inSources = false;

  function isBlockStart(l) {
    return (
      /^#{1,6}\s+/.test(l) ||
      l.trim().startsWith("```") ||
      /^>\s?/.test(l) ||
      /^\|.*\|\s*$/.test(l) ||
      /^-\s+/.test(l) ||
      /^\d+\.\s+/.test(l) ||
      /^-{3,}\s*$/.test(l)
    );
  }

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }

    // titre
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      if (level === 1) {
        i++; // le H1 du document fait doublon avec le champ "titre" du frontmatter
        continue;
      }
      inSources = h[2].trim() === "Sources";
      const tag = "h" + Math.min(level + 1, 6);
      out.push("<" + tag + ">" + inline(h[2], linkMap) + "</" + tag + ">");
      i++;
      continue;
    }

    // bloc de code
    if (line.trim().startsWith("```")) {
      i++;
      const code = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // ferme la clôture ```
      out.push("<pre><code>" + escapeHtml(code.join("\n")) + "</code></pre>");
      continue;
    }

    // citation
    if (/^>\s?/.test(line)) {
      const qs = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        qs.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      const paras = qs
        .filter((l) => l.trim() !== "")
        .map((l) => "<p>" + inline(l, linkMap) + "</p>")
        .join("");
      out.push("<blockquote>" + paras + "</blockquote>");
      continue;
    }

    // tableau
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const headerCells = splitRow(line);
      i += 2;
      const bodyRows = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) {
        bodyRows.push(splitRow(lines[i]));
        i++;
      }
      let t = "<table><thead><tr>";
      t += headerCells.map((c) => "<th>" + inline(c, linkMap) + "</th>").join("");
      t += "</tr></thead><tbody>";
      bodyRows.forEach((r) => {
        t += "<tr>" + r.map((c) => "<td>" + inline(c, linkMap) + "</td>").join("") + "</tr>";
      });
      t += "</tbody></table>";
      out.push('<div class="table-wrap">' + t + "</div>");
      continue;
    }

    // liste à puces
    if (/^-\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^-\s+/, ""));
        i++;
      }
      out.push("<ul>" + items.map((it) => "<li>" + inline(it, linkMap) + "</li>").join("") + "</ul>");
      continue;
    }

    // liste numérotée
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      out.push("<ol>" + items.map((it) => "<li>" + inline(it, linkMap) + "</li>").join("") + "</ol>");
      continue;
    }

    // séparateur
    if (/^-{3,}\s*$/.test(line)) {
      out.push("<hr>");
      i++;
      continue;
    }

    // paragraphe (lignes brutes consécutives)
    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== "" && !isBlockStart(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    const paraText = paraLines.join(" ");

    // dans "## Sources", un paragraphe tout en gras ("**Support — Bilan.pdf**")
    // suivi d'une liste à puces = les leçons de ce support : on lie chaque
    // leçon trouvée dans sources.json vers son PDF sous "par thèmes:/".
    const supportHeading = paraLines.length === 1 && paraText.trim().match(/^\*\*(.+)\*\*$/);
    if (inSources && supportHeading && i < lines.length && /^-\s+/.test(lines[i])) {
      const items = [];
      while (i < lines.length && /^-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^-\s+/, ""));
        i++;
      }
      out.push("<p>" + inline(paraText, linkMap) + "</p>");
      const supportName = supportHeading[1].replace(/\s*[—-]\s*Bilan\.pdf\s*$/, "").trim();
      const support = sourcesMap && sourcesMap[supportName];
      out.push(
        "<ul>" +
          items
            .map(function (it) {
              const raw = it.trim();
              // certains résumés citent la même leçon en ajoutant un détail
              // entre parenthèses (les notions traitées pour ce résumé-là) :
              // on retente sans ce suffixe avant d'abandonner le lien.
              const base = raw.replace(/\s*\([^)]*\)\s*$/, "").trim();
              const file = support && (support.lecons[raw] || support.lecons[base]);
              if (!file) return "<li>" + inline(it, linkMap) + "</li>";
              // "./" évite que "cours:" (mot ASCII pur suivi de ":") soit lu
              // comme un schéma d'URL (à la "mailto:") plutôt qu'un chemin relatif.
              const href = encodeURI("./cours:/bloc" + support.bloc + ":/par thèmes:/" + support.folder + "/" + file);
              return '<li><a href="' + href + '" target="_blank" rel="noopener">' + inline(it, linkMap) + "</a></li>";
            })
            .join("") +
          "</ul>"
      );
      continue;
    }

    out.push("<p>" + inline(paraText, linkMap) + "</p>");
  }

  return out.join("\n");
}

/* ---------- Chargement des résumés ---------- */

// cours:/bloc<n>:/par thèmes:/sources.json — associe chaque support cité en
// "## Sources" d'un résumé au PDF par leçon correspondant, sous
// cours:/bloc<n>:/par thèmes:/<support>/<fichier>. Absent tant qu'un bloc
// n'a pas encore été traité : les leçons restent alors du texte simple.
function loadSourcesMap(blocNum) {
  const file = path.join(COURS_DIR, "bloc" + blocNum + ":", "par thèmes:", "sources.json");
  if (!fs.existsSync(file)) return null;
  const map = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.keys(map).forEach((k) => {
    map[k].bloc = blocNum;
  });
  return map;
}

function loadBlocResumes(blocNum) {
  const dir = path.join(COURS_DIR, "bloc" + blocNum + ":", "resume:");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data, body } = parseFrontmatter(raw);
      return { file: f, dir, data, body };
    });
}

function loadAllResumes(blocsJson) {
  let all = [];
  blocsJson.blocs.forEach((b) => {
    all = all.concat(loadBlocResumes(b.numero));
  });
  return all;
}

function loadBlocQuestions(blocNum) {
  const dir = path.join(COURS_DIR, "bloc" + blocNum + ":", "questions:");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data, body } = parseFrontmatter(raw);
      return { file: f, dir, data, body };
    });
}

function loadAllQuestions(blocsJson) {
  let all = [];
  blocsJson.blocs.forEach((b) => {
    all = all.concat(loadBlocQuestions(b.numero));
  });
  return all;
}

// Frontmatter id ("b1-1", "b1-Vidéo") -> id réel de la question dans l'app
// ("b1-Q1", "b1-Vidéo"), construit dans js/data.js comme bloc.id+"-"+q.n.
function toAppQid(ficheId) {
  const m = String(ficheId).match(/^(b\d+)-(.+)$/);
  if (!m) return ficheId;
  const suffix = /^\d+$/.test(m[2]) ? "Q" + m[2] : m[2];
  return m[1] + "-" + suffix;
}

function buildLinkMap(all) {
  const map = {};
  all.forEach((p) => {
    map[p.file] = p.data.id;
  });
  return map;
}

function buildResume(p, linkMap) {
  const d = p.data;
  return {
    id: d.id,
    bloc: d.bloc,
    ordre: d.ordre,
    titre: d.titre,
    slug: d.slug,
    accroche: d.accroche,
    competences: d.competences,
    questions: d.questions,
    questions_appui: d.questions_appui,
    mots: d.mots,
    lecture_min: d.lecture_min,
    sources: d.sources,
    html: convertBody(p.body, linkMap, loadSourcesMap(d.bloc)),
  };
}

function buildQuestionCours(p, linkMap) {
  const d = p.data;
  return {
    id: toAppQid(d.id),
    bloc: d.bloc,
    dossier: d.dossier,
    titre: d.titre,
    competence: d.competence,
    resumes: d.resumes,
    resumes_appui: d.resumes_appui,
    html: convertBody(p.body, linkMap),
  };
}

/* ---------- Chargement des flashcards ---------- */

function loadBlocFlashcards(blocNum) {
  const dir = path.join(COURS_DIR, "bloc" + blocNum + ":", "flashcards:");
  if (!fs.existsSync(dir)) return [];
  const cards = [];
  fs.readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .forEach((f) => {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      (data.cartes || []).forEach((c) => {
        cards.push({
          id: c.id,
          resume: data.resume,
          bloc: data.bloc,
          section: c.section,
          niveau: c.niveau,
          type: c.type,
          recto: c.recto,
          verso: c.verso,
        });
      });
    });
  return cards;
}

function loadAllFlashcards(blocsJson) {
  let all = [];
  blocsJson.blocs.forEach((b) => {
    all = all.concat(loadBlocFlashcards(b.numero));
  });
  return all;
}

/* ---------- Chargement du quiz ---------- */

function loadBlocQuiz(blocNum) {
  const dir = path.join(COURS_DIR, "bloc" + blocNum + ":", "quiz:");
  if (!fs.existsSync(dir)) return [];
  const items = [];
  fs.readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .forEach((f) => {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      (data.questions || []).forEach((q) => {
        items.push(Object.assign({ resume: data.resume, bloc: data.bloc }, q));
      });
    });
  return items;
}

function loadAllQuiz(blocsJson) {
  let all = [];
  blocsJson.blocs.forEach((b) => {
    all = all.concat(loadBlocQuiz(b.numero));
  });
  return all;
}

/* ---------- CLI ---------- */

function main() {
  const args = process.argv.slice(2);
  const previewArg = args.find((a) => a.startsWith("--preview="));

  const blocsJson = JSON.parse(fs.readFileSync(path.join(COURS_DIR, "blocs.json"), "utf8"));
  const all = loadAllResumes(blocsJson);
  const linkMap = buildLinkMap(all);

  if (previewArg) {
    const key = previewArg.split("=")[1];
    const p = all.find((x) => x.data.id === key || x.file === key || x.file.startsWith(key));
    if (!p) {
      console.error("Résumé introuvable pour :", key);
      process.exit(1);
    }
    const resume = buildResume(p, linkMap);
    console.log(JSON.stringify(resume, null, 2));
    return;
  }

  const previewHtmlArg = args.find((a) => a.startsWith("--preview-html="));
  if (previewHtmlArg) {
    const [key, outPath] = previewHtmlArg.split("=")[1].split(":");
    const p = all.find((x) => x.data.id === key || x.file === key || x.file.startsWith(key));
    if (!p) {
      console.error("Résumé introuvable pour :", key);
      process.exit(1);
    }
    const resume = buildResume(p, linkMap);
    const cssPath = path.relative(path.dirname(path.resolve(outPath)), path.join(ROOT, "css", "style.css"));
    const html =
      '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">' +
      '<title>Aperçu — ' + resume.titre + '</title>' +
      '<link rel="stylesheet" href="' + cssPath + '">' +
      "</head><body><div class=\"app\"><main style=\"max-width:760px\">" +
      '<div class="eyebrow">Bloc ' + resume.bloc + " · résumé " + resume.ordre + " · " + resume.competences.join(", ") + '</div>' +
      "<h1>" + resume.titre + "</h1>" +
      '<p class="intro">' + resume.accroche + "</p>" +
      '<p class="rappel">' + resume.lecture_min + " min de lecture · " + resume.mots + " mots · questions : " + resume.questions.join(", ") +
      (resume.questions_appui.length ? " · en appui : " + resume.questions_appui.join(", ") : "") + "</p>" +
      '<div class="resume">' + resume.html + "</div>" +
      "</main></div></body></html>";
    fs.writeFileSync(outPath, html, "utf8");
    console.log("Aperçu écrit :", outPath);
    return;
  }

  const result = {};
  all.forEach((p) => {
    result[p.data.id] = buildResume(p, linkMap);
  });
  const blocs = blocsJson.blocs.map((b) => ({
    numero: b.numero,
    titre: b.titre,
    court: b.court,
    statut: b.statut,
    epreuve: b.epreuve,
    competences: b.competences,
    fiches: b.fiches,
  }));
  const js =
    "var RESUMES = " + JSON.stringify(result, null, 2) + ";\n" +
    "var COURS_BLOCS = " + JSON.stringify(blocs, null, 2) + ";\n";
  fs.writeFileSync(OUT_FILE, js, "utf8");
  console.log(
    "Écrit :",
    path.relative(ROOT, OUT_FILE),
    "—",
    Object.keys(result).length,
    "résumé(s),",
    blocs.length,
    "bloc(s)."
  );

  const questions = loadAllQuestions(blocsJson);
  const qResult = {};
  questions.forEach((p) => {
    const qc = buildQuestionCours(p, linkMap);
    qResult[qc.id] = qc;
  });
  const qJs = "var QUESTIONS_COURS = " + JSON.stringify(qResult, null, 2) + ";\n";
  fs.writeFileSync(QUESTIONS_OUT_FILE, qJs, "utf8");
  console.log(
    "Écrit :",
    path.relative(ROOT, QUESTIONS_OUT_FILE),
    "—",
    Object.keys(qResult).length,
    "question(s)."
  );

  const flashcards = loadAllFlashcards(blocsJson);
  const fcJs = "var FLASHCARDS = " + JSON.stringify(flashcards, null, 2) + ";\n";
  fs.writeFileSync(FLASHCARDS_OUT_FILE, fcJs, "utf8");
  console.log(
    "Écrit :",
    path.relative(ROOT, FLASHCARDS_OUT_FILE),
    "—",
    flashcards.length,
    "carte(s)."
  );

  const quiz = loadAllQuiz(blocsJson);
  const qzJs = "var QUIZ = " + JSON.stringify(quiz, null, 2) + ";\n";
  fs.writeFileSync(QUIZ_OUT_FILE, qzJs, "utf8");
  console.log(
    "Écrit :",
    path.relative(ROOT, QUIZ_OUT_FILE),
    "—",
    quiz.length,
    "question(s) de quiz."
  );
}

main();

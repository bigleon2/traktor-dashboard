/**
 * Export PDF — TRAKTOR PRO 3 Assignations MIDI
 * Format A4 paysage, 4 colonnes : Contrôle | Description | Cas d'usage | Type
 * Badge "Non officiel" sur les Commandes Virtuelles
 */

import jsPDF from "jspdf";
import type { MidiControl } from "./midiData";

const CAT_COLORS_RGB: Record<string, [number, number, number]> = {
  "AUDIO RECORDER":       [244,  63,  94],
  "Browser":              [139,  92, 246],
  "Commandes Virtuelles": [217,  70, 239],
  "Deck Common":          [ 14, 165, 233],
  "FX Unit":              [245, 158,  11],
  "Global":               [236,  72, 153],
  "Layout":               [ 20, 184, 166],
  "Loop Recorder":        [249, 115,  22],
  "Master Clock":         [ 16, 185, 129],
  "Mixer":                [239,  68,  68],
  "Modifier":             [ 99, 102, 241],
  "Preview Player":       [  6, 182, 212],
  "Remix Deck":           [132, 204,  22],
  "Track Deck":           [168,  85, 247],
};

const TYPE_COLORS_RGB: Record<string, { bg: [number,number,number]; text: [number,number,number] }> = {
  "Entrée/Sortie": { bg: [237, 233, 254], text: [109,  40, 217] },
  "Entrée":        { bg: [209, 250, 229], text: [  4, 120,  87] },
  "Sortie":        { bg: [254, 226, 226], text: [185,  28,  28] },
};

const TYPE_LABELS: Record<string, string> = {
  "Entrée/Sortie": "E/S",
  "Entrée":        "IN",
  "Sortie":        "OUT",
};

type AnnotationRecord = Record<string, { canal: string; noteCC: string; note: string }>;

interface ExportOptions {
  data: MidiControl[];
  filterLabel: string;
  searchQuery?: string;
  annotations?: AnnotationRecord;
}

export function exportToPdf({ data, filterLabel, searchQuery, annotations = {} }: ExportOptions) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const PW = 297;
  const PH = 210;
  const ML = 12;
  const MR = 12;
  const CW = PW - ML - MR;

  // Largeurs colonnes
  const C_NOM   = 52;
  const C_DESC  = 90;
  const C_USAGE = 65;
  const C_TYPE  = CW - C_NOM - C_DESC - C_USAGE;

  const X0 = ML;
  const X1 = ML + C_NOM;
  const X2 = ML + C_NOM + C_DESC;
  const X3 = ML + C_NOM + C_DESC + C_USAGE;

  const ROW_H   = 9;
  const HDR_H   = 9;
  let y = 0;
  let pageNum = 1;

  // ── Dessin en-tête tableau ──────────────────────────────────────────────────
  function drawTableHeader() {
    doc.setFillColor(124, 58, 237);
    doc.rect(ML, y, CW, HDR_H, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("CONTRÔLE",         X0 + 2, y + 6);
    doc.text("DESCRIPTION",      X1 + 2, y + 6);
    doc.text("CAS D'USAGE",      X2 + 2, y + 6);
    doc.text("TYPE",             X3 + 2, y + 6);
    y += HDR_H;
  }

  // ── Nouvelle page ───────────────────────────────────────────────────────────
  function newPage() {
    // Pied de page courant
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 140, 180);
    doc.text("TRAKTOR PRO 3 — Assignations MIDI", ML, PH - 4);
    doc.text(`Page ${pageNum}`, PW - MR, PH - 4, { align: "right" });

    doc.addPage();
    pageNum++;
    doc.setFillColor(250, 247, 242);
    doc.rect(0, 0, PW, PH, "F");
    y = ML;
    drawTableHeader();
  }

  // ── PAGE DE TITRE ───────────────────────────────────────────────────────────
  doc.setFillColor(250, 247, 242);
  doc.rect(0, 0, PW, PH, "F");

  // Bande violette
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, PW, 28, "F");
  doc.setFillColor(244, 63, 94);
  doc.rect(0, 26, PW, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("TRAKTOR PRO 3", ML, 13);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(220, 200, 255);
  doc.text("Assignations MIDI — Référence complète", ML, 21);

  const now = new Date();
  doc.setFontSize(7.5);
  doc.setTextColor(200, 180, 255);
  doc.text(`Généré le ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`, PW - MR, 21, { align: "right" });

  // Bloc filtre
  y = 38;
  doc.setFillColor(237, 233, 254);
  doc.roundedRect(ML, y, CW * 0.55, 20, 2, 2, "F");
  doc.setDrawColor(196, 181, 253);
  doc.setLineWidth(0.4);
  doc.roundedRect(ML, y, CW * 0.55, 20, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(109, 40, 217);
  doc.text(`Filtre : ${filterLabel}`, ML + 4, y + 8);
  if (searchQuery) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 90, 180);
    doc.text(`Recherche : "${searchQuery}"`, ML + 4, y + 15);
  }

  // Compteurs
  const countES  = data.filter(d => d.type === "Entrée/Sortie").length;
  const countIN  = data.filter(d => d.type === "Entrée").length;
  const countOUT = data.filter(d => d.type === "Sortie").length;
  const countNO  = data.filter(d => d.nonOfficiel).length;
  const statsArr = [
    { label: "Total",         value: data.length, color: [124, 58, 237] as [number,number,number] },
    { label: "E/S",           value: countES,     color: [109, 40, 217] as [number,number,number] },
    { label: "IN",            value: countIN,     color: [4, 120, 87]   as [number,number,number] },
    { label: "OUT",           value: countOUT,    color: [185, 28, 28]  as [number,number,number] },
    ...(countNO > 0 ? [{ label: "Non officiel", value: countNO, color: [162, 28, 175] as [number,number,number] }] : []),
  ];
  const bw = 38;
  statsArr.forEach((s, i) => {
    const bx = ML + i * (bw + 3);
    const by = y + 25;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(bx, by, bw, 16, 2, 2, "F");
    doc.setDrawColor(...s.color);
    doc.setLineWidth(0.5);
    doc.roundedRect(bx, by, bw, 16, 2, 2, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...s.color);
    doc.text(String(s.value), bx + bw / 2, by + 9, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(120, 100, 140);
    doc.text(s.label, bx + bw / 2, by + 14, { align: "center" });
  });

  // Légende
  y = 90;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 60, 120);
  doc.text("Légende :", ML, y);
  const legends = [
    { code: "E/S",  desc: "Entrée/Sortie — bidirectionnel",     color: [109, 40, 217] as [number,number,number] },
    { code: "IN",   desc: "Entrée seule — reçoit MIDI",         color: [4, 120, 87]   as [number,number,number] },
    { code: "OUT",  desc: "Sortie seule — envoie MIDI",         color: [185, 28, 28]  as [number,number,number] },
    { code: "★",    desc: "Commande virtuelle non officielle",  color: [162, 28, 175] as [number,number,number] },
  ];
  let lx = ML + 22;
  legends.forEach(l => {
    doc.setFillColor(
      Math.min(255, l.color[0] + 140),
      Math.min(255, l.color[1] + 130),
      Math.min(255, l.color[2] + 190)
    );
    doc.roundedRect(lx, y - 3.5, 7, 4.5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...l.color);
    doc.text(l.code, lx + 3.5, y, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(80, 70, 90);
    doc.text(l.desc, lx + 9, y);
    lx += 60;
  });

  // ── PAGES DE DONNÉES ────────────────────────────────────────────────────────
  doc.addPage();
  pageNum++;
  doc.setFillColor(250, 247, 242);
  doc.rect(0, 0, PW, PH, "F");
  y = ML;
  drawTableHeader();

  const grouped: Record<string, MidiControl[]> = {};
  data.forEach(item => {
    if (!grouped[item.categorie]) grouped[item.categorie] = [];
    grouped[item.categorie].push(item);
  });

  let rowIdx = 0;

  Object.entries(grouped).forEach(([cat, items]) => {
    const catColor = CAT_COLORS_RGB[cat] || [120, 120, 120];

    // En-tête catégorie
    if (y + 8 + ROW_H > PH - 12) newPage();
    doc.setFillColor(catColor[0], catColor[1], catColor[2]);
    doc.rect(ML, y, CW, 7, "F");
    doc.setFillColor(...catColor);
    doc.rect(ML, y, 2.5, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...catColor);
    doc.text(`${cat}  (${items.length})`, ML + 5, y + 5);
    y += 8;

    items.forEach(item => {
      // Calculer hauteur nécessaire
      const descLines = doc.splitTextToSize(item.description, C_DESC - 4).length;
      const usageLines = item.usageTypique ? doc.splitTextToSize(item.usageTypique, C_USAGE - 6).length : 0;
      const nomLines = doc.splitTextToSize(item.nom, C_NOM - 6).length;
      const extraNom = item.nonOfficiel ? 1 : 0;
      const neededH = Math.max(ROW_H, (Math.max(descLines, usageLines, nomLines + extraNom)) * 4 + 4);

      if (y + neededH > PH - 12) newPage();

      // Fond alterné
      if (rowIdx % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(250, 247, 255);
      }
      doc.rect(ML, y, CW, neededH, "F");

      // Barre catégorie
      doc.setFillColor(...catColor);
      doc.rect(ML, y, 1.5, neededH, "F");

      // Nom
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(30, 20, 50);
      const nomArr = doc.splitTextToSize(item.nom, C_NOM - 6);
      doc.text(nomArr.slice(0, 3), X0 + 3, y + 5);

      // Badge non officiel
      if (item.nonOfficiel) {
        const badgeY = y + 5 + Math.min(nomArr.length, 3) * 3.5;
        doc.setFillColor(253, 244, 255);
        doc.roundedRect(X0 + 3, badgeY - 2.5, 23, 4, 1, 1, "F");
        doc.setFontSize(5.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(162, 28, 175);
        doc.text("★ Non officiel", X0 + 4, badgeY + 0.5);
      }

      // Description
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(75, 65, 90);
      const descArr = doc.splitTextToSize(item.description, C_DESC - 4);
      doc.text(descArr.slice(0, 5), X1 + 2, y + 5);

      // Cas d'usage
      if (item.usageTypique) {
        doc.setFillColor(255, 251, 235);
        doc.roundedRect(X2 + 2, y + 1.5, C_USAGE - 4, neededH - 3, 1.5, 1.5, "F");
        doc.setFont("helvetica", "italic");
        doc.setFontSize(6.5);
        doc.setTextColor(180, 83, 9);
        const usageArr = doc.splitTextToSize(item.usageTypique, C_USAGE - 8);
        doc.text(usageArr.slice(0, 4), X2 + 4, y + 5);
      }

      // Badge type
      const ts = TYPE_COLORS_RGB[item.type] || { bg: [243,244,246], text: [107,114,128] };
      doc.setFillColor(...ts.bg);
      doc.roundedRect(X3 + 1, y + 2, C_TYPE - 2, 5.5, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...ts.text);
      doc.text(TYPE_LABELS[item.type] || item.type, X3 + C_TYPE / 2, y + 6, { align: "center" });

      // Séparateur
      doc.setDrawColor(230, 225, 240);
      doc.setLineWidth(0.15);
      doc.line(ML, y + neededH, ML + CW, y + neededH);

      y += neededH;
      rowIdx++;
    });

    y += 3;
  });

  // Pied de page toutes les pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(245, 240, 232);
    doc.rect(0, PH - 9, PW, 9, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(160, 140, 180);
    doc.text("TRAKTOR PRO 3 — Assignations MIDI — Native Instruments", ML, PH - 3.5);
    doc.text(`${p} / ${totalPages}`, PW - MR, PH - 3.5, { align: "right" });
  }

  const safeName = filterLabel.replace(/[^a-zA-Z0-9_\-]/g, "_").substring(0, 40);
  doc.save(`TRAKTOR_PRO3_MIDI_${safeName}.pdf`);
}

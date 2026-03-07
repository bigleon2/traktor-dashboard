/*
 * Export PDF — TRAKTOR PRO 3 Assignations MIDI
 * Génère un PDF A4 propre et imprimable à partir des données filtrées.
 * Utilise jsPDF en mode texte pur (pas de screenshot) pour un rendu net.
 */

import jsPDF from "jspdf";
import type { MidiControl } from "./midiData";

// Couleurs joyeuses par catégorie (RGB)
const CAT_COLORS_RGB: Record<string, [number, number, number]> = {
  "AUDIO RECORDER":  [244,  63,  94],
  "Browser":         [139,  92, 246],
  "Deck Common":     [ 14, 165, 233],
  "FX Unit":         [245, 158,  11],
  "Global":          [236,  72, 153],
  "Layout":          [ 20, 184, 166],
  "Loop Recorder":   [249, 115,  22],
  "Master Clock":    [ 16, 185, 129],
  "Mixer":           [239,  68,  68],
  "Modifier":        [ 99, 102, 241],
  "Preview Player":  [  6, 182, 212],
  "Remix Deck":      [132, 204,  22],
  "Track Deck":      [168,  85, 247],
};

const TYPE_COLORS_RGB: Record<string, [number, number, number]> = {
  "Entrée/Sortie": [109,  40, 217],
  "Entrée":        [  4, 120,  87],
  "Sortie":        [185,  28,  28],
};

const TYPE_LABELS: Record<string, string> = {
  "Entrée/Sortie": "E/S",
  "Entrée":        "IN",
  "Sortie":        "OUT",
};

interface ExportOptions {
  data: MidiControl[];
  filterLabel: string;   // ex: "Browser", "Toutes catégories", "Entrée/Sortie"
  searchQuery?: string;
}

export function exportToPdf({ data, filterLabel, searchQuery }: ExportOptions) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN_L = 14;
  const MARGIN_R = 14;
  const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
  const COL_NOM = 58;
  const COL_DESC = 95;
  const COL_TYPE = 22;
  const ROW_H = 7;
  const HEADER_H = 8;

  let y = 0;

  // ── Fonction utilitaire : nouvelle page ──────────────────────────────────
  function newPage() {
    doc.addPage();
    y = 14;
    drawPageHeader();
    drawTableHeader(y);
    y += HEADER_H;
  }

  // ── En-tête de page ──────────────────────────────────────────────────────
  function drawPageHeader() {
    // Bande violette en haut
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, PAGE_W, 12, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("TRAKTOR PRO 3 — Assignations MIDI", MARGIN_L, 8);

    const pageNum = doc.getCurrentPageInfo().pageNumber;
    doc.text(`Page ${pageNum}`, PAGE_W - MARGIN_R, 8, { align: "right" });

    y = 16;
  }

  // ── En-tête du tableau ───────────────────────────────────────────────────
  function drawTableHeader(yPos: number) {
    doc.setFillColor(245, 240, 232);
    doc.rect(MARGIN_L, yPos, CONTENT_W, HEADER_H, "F");

    doc.setDrawColor(200, 185, 255);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN_L, yPos, CONTENT_W, HEADER_H);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 80, 160);

    doc.text("CONTRÔLE", MARGIN_L + 2, yPos + 5.5);
    doc.text("DESCRIPTION", MARGIN_L + COL_NOM + 2, yPos + 5.5);
    doc.text("TYPE", MARGIN_L + COL_NOM + COL_DESC + 2, yPos + 5.5);
  }

  // ── Ligne de données ─────────────────────────────────────────────────────
  function drawRow(item: MidiControl, rowIndex: number, yPos: number) {
    const isEven = rowIndex % 2 === 0;
    const catColor = CAT_COLORS_RGB[item.categorie] || [120, 120, 120];
    const typeColor = TYPE_COLORS_RGB[item.type] || [80, 80, 80];

    // Fond alterné
    if (!isEven) {
      doc.setFillColor(252, 249, 245);
      doc.rect(MARGIN_L, yPos, CONTENT_W, ROW_H, "F");
    }

    // Barre colorée catégorie à gauche
    doc.setFillColor(...catColor);
    doc.rect(MARGIN_L, yPos, 1.5, ROW_H, "F");

    // Nom du contrôle
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(30, 20, 50);
    const nomTrunc = item.nom.length > 28 ? item.nom.substring(0, 27) + "…" : item.nom;
    doc.text(nomTrunc, MARGIN_L + 3, yPos + 4.5);

    // Catégorie (sous le nom)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...catColor);
    doc.text(item.categorie, MARGIN_L + 3, yPos + 6.5);

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(80, 70, 90);
    const descTrunc = item.description.length > 55 ? item.description.substring(0, 54) + "…" : item.description;
    doc.text(descTrunc, MARGIN_L + COL_NOM + 2, yPos + 4.8);

    // Badge type
    const typeLabel = TYPE_LABELS[item.type] || item.type;
    const badgeW = 12;
    const badgeX = MARGIN_L + COL_NOM + COL_DESC + 2;
    doc.setFillColor(typeColor[0], typeColor[1], typeColor[2], 0.12);
    doc.setFillColor(
      Math.min(255, typeColor[0] + 160),
      Math.min(255, typeColor[1] + 140),
      Math.min(255, typeColor[2] + 200)
    );
    doc.roundedRect(badgeX, yPos + 1.5, badgeW, 4.5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...typeColor);
    doc.text(typeLabel, badgeX + badgeW / 2, yPos + 4.5, { align: "center" });

    // Ligne séparatrice légère
    doc.setDrawColor(230, 220, 240);
    doc.setLineWidth(0.1);
    doc.line(MARGIN_L, yPos + ROW_H, MARGIN_L + CONTENT_W, yPos + ROW_H);
  }

  // ── PAGE 1 : Titre et résumé ─────────────────────────────────────────────
  // Fond crème
  doc.setFillColor(250, 247, 242);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  // Bande violette en-tête
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, PAGE_W, 42, "F");

  // Titre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("TRAKTOR PRO 3", PAGE_W / 2, 18, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(220, 200, 255);
  doc.text("Assignations MIDI — Référence complète", PAGE_W / 2, 27, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(200, 180, 255);
  doc.text("Native Instruments", PAGE_W / 2, 35, { align: "center" });

  // Infos du filtre
  y = 52;
  doc.setFillColor(237, 233, 254);
  doc.roundedRect(MARGIN_L, y, CONTENT_W, 22, 3, 3, "F");
  doc.setDrawColor(196, 181, 253);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN_L, y, CONTENT_W, 22, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(109, 40, 217);
  doc.text("Filtre appliqué", MARGIN_L + 5, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 60, 120);
  doc.text(`Catégorie : ${filterLabel}`, MARGIN_L + 5, y + 14);
  if (searchQuery) {
    doc.text(`Recherche : "${searchQuery}"`, MARGIN_L + 5, y + 19);
  }

  // Compteurs
  y = 84;
  const stats = [
    { label: "Contrôles affichés", value: data.length, color: [124, 58, 237] as [number,number,number] },
    { label: "Entrée/Sortie", value: data.filter(d => d.type === "Entrée/Sortie").length, color: [109, 40, 217] as [number,number,number] },
    { label: "Entrée", value: data.filter(d => d.type === "Entrée").length, color: [4, 120, 87] as [number,number,number] },
    { label: "Sortie", value: data.filter(d => d.type === "Sortie").length, color: [185, 28, 28] as [number,number,number] },
  ];
  const boxW = CONTENT_W / 4 - 2;
  stats.forEach((s, i) => {
    const bx = MARGIN_L + i * (boxW + 2.5);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(bx, y, boxW, 18, 2, 2, "F");
    doc.setDrawColor(s.color[0], s.color[1], s.color[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(bx, y, boxW, 18, 2, 2, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...s.color);
    doc.text(String(s.value), bx + boxW / 2, y + 10, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(120, 100, 140);
    doc.text(s.label, bx + boxW / 2, y + 15, { align: "center" });
  });

  // Légende types
  y = 112;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(80, 60, 120);
  doc.text("Légende des types :", MARGIN_L, y);
  y += 5;

  const legend = [
    { label: "E/S — Entrée/Sortie : contrôle bidirectionnel", color: [109, 40, 217] as [number,number,number] },
    { label: "IN — Entrée seule : reçoit des messages MIDI", color: [4, 120, 87] as [number,number,number] },
    { label: "OUT — Sortie seule : envoie des messages MIDI", color: [185, 28, 28] as [number,number,number] },
  ];
  legend.forEach(l => {
    doc.setFillColor(
      Math.min(255, l.color[0] + 160),
      Math.min(255, l.color[1] + 140),
      Math.min(255, l.color[2] + 200)
    );
    doc.roundedRect(MARGIN_L, y, 8, 4, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...l.color);
    doc.text(l.label.split(" — ")[0], MARGIN_L + 4, y + 2.8, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(80, 70, 90);
    doc.text(l.label.split(" — ")[1], MARGIN_L + 11, y + 2.8);
    y += 6;
  });

  // Date de génération
  y = 140;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(160, 140, 180);
  const now = new Date();
  doc.text(
    `Généré le ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
    PAGE_W / 2, y, { align: "center" }
  );

  // ── PAGES DE DONNÉES ─────────────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(250, 247, 242);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  drawPageHeader();
  drawTableHeader(y);
  y += HEADER_H;

  // Grouper par catégorie
  const grouped: Record<string, MidiControl[]> = {};
  data.forEach(item => {
    if (!grouped[item.categorie]) grouped[item.categorie] = [];
    grouped[item.categorie].push(item);
  });

  let globalRowIndex = 0;

  Object.entries(grouped).forEach(([cat, items]) => {
    // Vérifier si on a la place pour l'en-tête de catégorie + au moins 1 ligne
    if (y + 8 + ROW_H > PAGE_H - 14) {
      newPage();
    }

    // En-tête de catégorie
    const catColor = CAT_COLORS_RGB[cat] || [120, 120, 120];
    doc.setFillColor(catColor[0], catColor[1], catColor[2]);
    doc.rect(MARGIN_L, y, CONTENT_W, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`${cat}  (${items.length} contrôle${items.length > 1 ? "s" : ""})`, MARGIN_L + 3, y + 5);
    y += 7;

    items.forEach(item => {
      if (y + ROW_H > PAGE_H - 14) {
        newPage();
      }
      drawRow(item, globalRowIndex, y);
      y += ROW_H;
      globalRowIndex++;
    });

    y += 3; // espace entre catégories
  });

  // ── Pied de page sur toutes les pages ────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(245, 240, 232);
    doc.rect(0, PAGE_H - 10, PAGE_W, 10, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(160, 140, 180);
    doc.text("TRAKTOR PRO 3 — Assignations MIDI — Native Instruments", MARGIN_L, PAGE_H - 4);
    doc.text(`${p} / ${totalPages}`, PAGE_W - MARGIN_R, PAGE_H - 4, { align: "right" });
  }

  // ── Téléchargement ───────────────────────────────────────────────────────
  const safeName = filterLabel.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`TRAKTOR_PRO3_MIDI_${safeName}.pdf`);
}

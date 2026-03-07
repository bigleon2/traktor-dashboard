/*
 * TRAKTOR PRO 3 — Bright & Joyful Interface
 * Fond crème chaud #FAF7F2 / #FFFDF9
 * Accents : violet #7C3AED, rose #F43F5E, orange #F97316, vert #10B981, bleu #0EA5E9
 * Typographie : Space Grotesk (titres) + JetBrains Mono (données)
 *
 * Fonctionnalités :
 * - Sous-filtres dynamiques par préfixe (Browser, Deck Common, Mixer, Remix Deck, Track Deck, Commandes Virtuelles)
 * - Colonne "Cas d'usage typique" visible en mode étendu
 * - Badge "Non officiel" sur les Commandes Virtuelles
 * - Export PDF enrichi avec colonne Cas d'usage
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Search, Filter, X, Music2, Zap, ArrowUpDown,
  LayoutGrid, List, ExternalLink, Activity, ChevronDown, FileDown,
  AlertCircle, Lightbulb, Star, BookOpen, Pencil, Check
} from "lucide-react";
import { exportToPdf } from "@/lib/exportPdf";
import { MIDI_DATA, CATEGORIES, STATS_BY_CATEGORY, CAT_COLORS, TOTAL } from "@/lib/midiData";
import { useAnnotations } from "@/hooks/useAnnotations";
import { useFavorites } from "@/hooks/useFavorites";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031120973/VmM56JPUAEXAm5tmyDWKUu/traktor-hero-33nLS4kk55t8zYwQV5WzgH.webp";

// ─── Sous-groupes par catégorie (détectés automatiquement) ───────────────────
const SUBGROUP_MAP: Record<string, { label: string; prefix: string | null }[]> = {
  "Browser": [
    { label: "Tous", prefix: null },
    { label: "List (33)", prefix: "List" },
    { label: "Tree (21)", prefix: "Tree" },
    { label: "Favorites (2)", prefix: "Favorites" },
  ],
  "Commandes Virtuelles": [
    { label: "Tous", prefix: null },
    { label: "MIDI Buttons (8)", prefix: "MIDI Button" },
    { label: "MIDI Knobs (8)", prefix: "MIDI Knob" },
    { label: "MIDI Faders (8)", prefix: "MIDI Fader" },
  ],
  "Deck Common": [
    { label: "Tous", prefix: null },
    { label: "Général (30)", prefix: "__none__" },
    { label: "Loop (7)", prefix: "Loop" },
    { label: "Timecode (5)", prefix: "Timecode" },
    { label: "Move (4)", prefix: "Move" },
    { label: "Freeze Mode (4)", prefix: "Freeze Mode" },
  ],
  "Mixer": [
    { label: "Tous", prefix: null },
    { label: "Général (19)", prefix: "__none__" },
    { label: "EQ (8)", prefix: "EQ" },
    { label: "X-Fader (6)", prefix: "X-Fader" },
  ],
  "Remix Deck": [
    { label: "Tous", prefix: null },
    { label: "Général (19)", prefix: "__none__" },
    { label: "Legacy (13)", prefix: "Legacy" },
    { label: "Direct Mapping (6)", prefix: "Direct Mapping" },
    { label: "Step Sequencer (5)", prefix: "Step Sequencer" },
    { label: "Meters (3)", prefix: "Meters" },
  ],
  "Track Deck": [
    { label: "Tous", prefix: null },
    { label: "Général (19)", prefix: "__none__" },
    { label: "Grid (12)", prefix: "Grid" },
    { label: "Cue (8)", prefix: "Cue" },
  ],
};

// ─── Couleurs joyeuses par type ───────────────────────────────────────────────
const TYPE_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "Entrée/Sortie": { bg: "#EDE9FE", text: "#6D28D9", border: "#C4B5FD", dot: "#7C3AED" },
  "Entrée":        { bg: "#D1FAE5", text: "#047857", border: "#6EE7B7", dot: "#10B981" },
  "Sortie":        { bg: "#FEE2E2", text: "#B91C1C", border: "#FCA5A5", dot: "#EF4444" },
};

const TYPE_LABELS: Record<string, string> = {
  "Entrée/Sortie": "E/S", "Entrée": "IN", "Sortie": "OUT",
};

// Couleurs vives joyeuses pour les catégories
const CAT_COLORS_BRIGHT: Record<string, string> = {
  "AUDIO RECORDER":      "#F43F5E",
  "Browser":             "#8B5CF6",
  "Commandes Virtuelles":"#D946EF",
  "Deck Common":         "#0EA5E9",
  "FX Unit":             "#F59E0B",
  "Global":              "#EC4899",
  "Layout":              "#14B8A6",
  "Loop Recorder":       "#F97316",
  "Master Clock":        "#10B981",
  "Mixer":               "#EF4444",
  "Modifier":            "#6366F1",
  "Preview Player":      "#06B6D4",
  "Remix Deck":          "#84CC16",
  "Track Deck":          "#A855F7",
};

// ─── Badge Type ───────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const s = TYPE_STYLE[type] || { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB", dot: "#9CA3AF" };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono"
      style={{ background: s.bg, color: s.text, border: `1.5px solid ${s.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {TYPE_LABELS[type] || type}
    </span>
  );
}

// ─── Badge Non Officiel ───────────────────────────────────────────────────────
function NonOfficielBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: "#FDF4FF", color: "#A21CAF", border: "1.5px solid #E879F9" }}>
      <AlertCircle size={9} />
      Non officiel
    </span>
  );
}

// ─── Tooltip graphiques ───────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-purple-100 rounded-xl p-3 shadow-xl text-xs font-mono">
      <p className="text-purple-700 font-bold mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon, bgColor }: {
  label: string; value: number; color: string; icon: any; bgColor: string;
}) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(start);
    }, 18);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="joy-card p-5 flex items-start justify-between group"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: `${color}99` }}>{label}</p>
        <p className="text-4xl font-bold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{displayed}</p>
      </div>
      <div className="p-3 rounded-2xl" style={{ background: bgColor }}>
        <Icon size={22} style={{ color }} />
      </div>
    </motion.div>
  );
}

// ─── Annotation Panel ───────────────────────────────────────────────────────
type AnnotationData = { canal: string; noteCC: string; note: string };

function AnnotationPanel({
  categorie, nom, annotation, onSave
}: {
  categorie: string;
  nom: string;
  annotation: AnnotationData | null;
  onSave: (data: AnnotationData) => void;
}) {
  const [canal, setCanal] = useState(annotation?.canal || "");
  const [noteCC, setNoteCC] = useState(annotation?.noteCC || "");
  const [note, setNote] = useState(annotation?.note || "");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave({ canal, noteCC, note });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div
      className="mx-4 mb-2 p-3 rounded-xl border border-teal-200 bg-teal-50"
      onClick={e => e.stopPropagation()}
    >
      <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <BookOpen size={10} /> Annotation MIDI personnelle
      </p>
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-teal-500 font-mono">Canal MIDI</label>
          <input
            value={canal}
            onChange={e => setCanal(e.target.value)}
            placeholder="ex: 1"
            className="w-20 border border-teal-200 rounded-lg px-2 py-1 text-xs font-mono text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-teal-500 font-mono">Note / CC</label>
          <input
            value={noteCC}
            onChange={e => setNoteCC(e.target.value)}
            placeholder="ex: CC74"
            className="w-24 border border-teal-200 rounded-lg px-2 py-1 text-xs font-mono text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <label className="text-[10px] text-teal-500 font-mono">Note libre</label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="ex: Bouton Play deck A"
            className="w-full border border-teal-200 rounded-lg px-2 py-1 text-xs font-mono text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            saved ? "bg-emerald-500 text-white" : "bg-teal-600 text-white hover:bg-teal-700"
          }`}
        >
          {saved ? <><Check size={11} /> Enregistré</> : <><Pencil size={11} /> Sauvegarder</>}
        </button>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("Toutes");
  const [selectedSubgroup, setSelectedSubgroup] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("Tous");
  const [sortField, setSortField] = useState<"nom" | "categorie" | "type">("categorie");
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"explorer" | "stats">("explorer");
  const [isExporting, setIsExporting] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  // Ref pour fermer annotation quand on clique ailleurs
  const annotRef = useRef<HTMLDivElement>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null); // clé "cat||nom"
  // Ref pour le raccourci Ctrl+K / Cmd+K
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchShortcutActive, setSearchShortcutActive] = useState(false);

  // Hooks persistance localStorage
  const { toggleFavorite, isFavorite, favoriteCount } = useFavorites();
  const { setAnnotation, getAnnotation, annotationCount } = useAnnotations();

  // Raccourci clavier Ctrl+K / Cmd+K → focus barre de recherche
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (activeTab !== "explorer") setActiveTab("explorer");
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
          setSearchShortcutActive(true);
          setTimeout(() => setSearchShortcutActive(false), 1200);
        }, activeTab !== "explorer" ? 150 : 0);
      }
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        setSearch("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  // Réinitialiser le sous-groupe quand la catégorie change
  useEffect(() => {
    setSelectedSubgroup(null);
    setExpandedRow(null);
  }, [selectedCat]);

  const subgroups = selectedCat !== "Toutes" ? (SUBGROUP_MAP[selectedCat] || null) : null;

  const filtered = useMemo(() => {
    let data = MIDI_DATA;
    if (selectedCat !== "Toutes") data = data.filter(d => d.categorie === selectedCat);

    // Sous-filtre par préfixe
    if (selectedSubgroup && selectedCat !== "Toutes") {
      if (selectedSubgroup === "__none__") {
        // Contrôles sans préfixe reconnu
        const knownPrefixes = (SUBGROUP_MAP[selectedCat] || [])
          .map(s => s.prefix)
          .filter(p => p && p !== "__none__" && p !== null) as string[];
        data = data.filter(d => !knownPrefixes.some(p => d.nom.startsWith(p)));
      } else {
        data = data.filter(d => d.nom.startsWith(selectedSubgroup));
      }
    }

    if (showFavoritesOnly) data = data.filter(d => isFavorite(d.categorie, d.nom));
    if (selectedType !== "Tous") data = data.filter(d => d.type === selectedType);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(d =>
        d.nom.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.categorie.toLowerCase().includes(q) ||
        (d.usageTypique && d.usageTypique.toLowerCase().includes(q))
      );
    }
    return [...data].sort((a, b) => {
      const va = a[sortField], vb = b[sortField];
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [search, selectedCat, selectedSubgroup, selectedType, sortField, sortAsc, showFavoritesOnly, isFavorite]);

  const pieData = useMemo(() => [
    { name: "Entrée/Sortie", value: MIDI_DATA.filter(d => d.type === "Entrée/Sortie").length },
    { name: "Sortie",        value: MIDI_DATA.filter(d => d.type === "Sortie").length },
    { name: "Entrée",        value: MIDI_DATA.filter(d => d.type === "Entrée").length },
  ], []);

  const barData = useMemo(() =>
    STATS_BY_CATEGORY.map(s => ({
      name: s.categorie.length > 12 ? s.categorie.substring(0, 12) + "…" : s.categorie,
      fullName: s.categorie,
      "E/S": s.entree_sortie,
      "IN":  s.entree,
      "OUT": s.sortie,
    })), []);

  const handleSort = (field: "nom" | "categorie" | "type") => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const clearFilters = () => {
    setSearch(""); setSelectedCat("Toutes"); setSelectedType("Tous"); setSelectedSubgroup(null); setShowFavoritesOnly(false);
  };
  const hasFilters = search || selectedCat !== "Toutes" || selectedType !== "Tous" || selectedSubgroup || showFavoritesOnly;

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      let filterLabel = "Toutes catégories";
      if (selectedCat !== "Toutes") {
        filterLabel = selectedSubgroup && selectedSubgroup !== "__none__"
          ? `${selectedCat} › ${selectedSubgroup}`
          : selectedCat;
      } else if (selectedType !== "Tous") {
        filterLabel = selectedType;
      }
      exportToPdf({
        data: filtered,
        filterLabel: showFavoritesOnly ? `⭐ Favoris — ${filterLabel}` : filterLabel,
        searchQuery: search.trim() || undefined,
        annotations: Object.fromEntries(
          filtered.map(d => {
            const a = getAnnotation(d.categorie, d.nom);
            return [`${d.categorie}||${d.nom}`, a];
          }).filter(([, a]) => a !== null)
        ) as Record<string, { canal: string; noteCC: string; note: string }>,
      });
    } finally {
      setTimeout(() => setIsExporting(false), 1200);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #FAF7F2 0%, #FDF6EC 50%, #F7F3EE 100%)" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative h-56 overflow-hidden rounded-b-3xl shadow-lg">
        <img src={HERO_IMG} alt="TRAKTOR PRO 3" className="w-full h-full object-cover object-center" style={{ filter: "brightness(0.55) saturate(1.1)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(124,58,237,0.25) 0%, rgba(0,0,0,0.45) 100%)" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-300 font-semibold text-xs tracking-[0.25em] uppercase font-mono">Native Instruments</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <h1 className="text-5xl font-bold text-white tracking-tight drop-shadow-lg">
              TRAKTOR <span className="text-violet-300">PRO 3</span>
            </h1>
            <p className="text-white/70 text-sm mt-1.5 tracking-widest font-mono">
              ASSIGNATIONS MIDI — RÉFÉRENCE COMPLÈTE
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container py-8 space-y-7">

        {/* ── STAT CARDS ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Contrôles total"  value={TOTAL}  color="#7C3AED" bgColor="#EDE9FE" icon={Activity} />
          <StatCard label="Catégories"        value={CATEGORIES.length} color="#0EA5E9" bgColor="#E0F2FE" icon={LayoutGrid} />
          <StatCard label="Entrée / Sortie"   value={MIDI_DATA.filter(d => d.type === "Entrée/Sortie").length} color="#10B981" bgColor="#D1FAE5" icon={Zap} />
          <StatCard label="Sortie seule"      value={MIDI_DATA.filter(d => d.type === "Sortie").length} color="#EF4444" bgColor="#FEE2E2" icon={Music2} />
        </div>

        {/* ── ONGLETS ───────────────────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap">
          {(["explorer", "stats"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm ${
                activeTab === tab
                  ? "bg-violet-600 text-white shadow-violet-200 shadow-md"
                  : "bg-white text-gray-500 hover:text-violet-600 hover:bg-violet-50 border border-gray-200"
              }`}>
              {tab === "explorer" ? "🎛 Explorateur" : "📊 Statistiques"}
            </button>
          ))}
          {/* Bouton Favoris */}
          <button
            onClick={() => setShowFavoritesOnly(f => !f)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm flex items-center gap-2 ${
              showFavoritesOnly
                ? "bg-amber-400 text-white shadow-amber-200 shadow-md"
                : "bg-white text-gray-500 hover:text-amber-500 hover:bg-amber-50 border border-gray-200"
            }`}>
            <Star size={14} fill={showFavoritesOnly ? "white" : "none"} />
            Favoris {favoriteCount > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              showFavoritesOnly ? "bg-white/30 text-white" : "bg-amber-100 text-amber-600"
            }`}>{favoriteCount}</span>}
          </button>
          {/* Compteur annotations */}
          {annotationCount > 0 && (
            <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-teal-50 text-teal-600 border border-teal-200">
              <BookOpen size={14} />
              {annotationCount} annotation{annotationCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "explorer" ? (
            <motion.div key="explorer" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">

              {/* ── FILTRES PRINCIPAUX ────────────────────────────────────── */}
              <div className="joy-card p-4 space-y-3">
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Recherche */}
                  <div className="relative flex-1 min-w-[220px]">
                    <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${searchShortcutActive ? "text-violet-500" : "text-gray-400"}`} />
                    <input
                      ref={searchInputRef}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher un contrôle, description ou cas d'usage…"
                      className={`w-full border rounded-xl pl-9 pr-24 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 bg-white transition-all font-mono ${
                        searchShortcutActive
                          ? "border-violet-400 ring-2 ring-violet-300 shadow-violet-100 shadow-md"
                          : "border-gray-200 focus:ring-violet-300 focus:border-violet-400"
                      }`}
                    />
                    {/* Badge raccourci clavier */}
                    {!search && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                        <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-gray-100 text-gray-400 border border-gray-200 leading-none">
                          {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}
                        </kbd>
                        <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-gray-100 text-gray-400 border border-gray-200 leading-none">K</kbd>
                      </span>
                    )}
                    {search && (
                      <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Catégorie */}
                  <div className="relative">
                    <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
                      className="border border-gray-200 rounded-xl pl-8 pr-8 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 appearance-none font-mono cursor-pointer">
                      <option value="Toutes">Toutes catégories</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Type */}
                  <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 appearance-none font-mono cursor-pointer">
                    <option value="Tous">Tous les types</option>
                    <option value="Entrée/Sortie">Entrée / Sortie</option>
                    <option value="Entrée">Entrée</option>
                    <option value="Sortie">Sortie</option>
                  </select>

                  {/* Vue */}
                  <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    <button onClick={() => setViewMode("table")}
                      className={`p-2 rounded-lg transition-colors ${viewMode === "table" ? "bg-white text-violet-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                      <List size={15} />
                    </button>
                    <button onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white text-violet-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                      <LayoutGrid size={15} />
                    </button>
                  </div>

                  {hasFilters && (
                    <button onClick={clearFilters}
                      className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-semibold border border-rose-200 rounded-xl px-3 py-2 hover:bg-rose-50 transition-all">
                      <X size={12} /> Effacer
                    </button>
                  )}

                  {/* Bouton Favoris filtre rapide */}
                  {showFavoritesOnly && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                      <Star size={12} fill="currentColor" />
                      Mode Favoris actif
                    </div>
                  )}

                  {/* Bouton Export PDF */}
                  <button
                    onClick={handleExportPdf}
                    disabled={isExporting || filtered.length === 0}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all border disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: isExporting ? "#EDE9FE" : "#7C3AED",
                      color: isExporting ? "#7C3AED" : "white",
                      borderColor: "#7C3AED",
                      boxShadow: isExporting ? "none" : "0 2px 8px rgba(124,58,237,0.25)"
                    }}
                    title={`Exporter ${filtered.length} contrôle(s) en PDF`}
                  >
                    <FileDown size={13} />
                    {isExporting ? "Génération…" : `PDF (${filtered.length})`}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                  <span className="text-violet-600 font-bold text-sm">{filtered.length}</span>
                  <span>/ {TOTAL} contrôles</span>
                  {hasFilters && <span className="text-rose-400 font-semibold">• Filtres actifs</span>}
                </div>
              </div>

              {/* ── FILTRES RAPIDES PAR CATÉGORIE ───────────────────────────── */}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedCat("Toutes")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    selectedCat === "Toutes"
                      ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                      : "bg-white text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                  }`}>
                  Toutes ({TOTAL})
                </button>
                {CATEGORIES.map(cat => {
                  const count = MIDI_DATA.filter(d => d.categorie === cat).length;
                  const color = CAT_COLORS_BRIGHT[cat] || "#888";
                  const isActive = selectedCat === cat;
                  return (
                    <button key={cat}
                      onClick={() => setSelectedCat(cat === selectedCat ? "Toutes" : cat)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border"
                      style={isActive ? {
                        background: color, color: "white", borderColor: color,
                        boxShadow: `0 2px 8px ${color}40`
                      } : {
                        background: `${color}12`, color: color,
                        borderColor: `${color}40`
                      }}>
                      {cat} <span style={{ opacity: 0.7 }}>({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* ── SOUS-FILTRES (apparaissent si la catégorie sélectionnée en a) ── */}
              <AnimatePresence>
                {subgroups && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="joy-card p-3 flex flex-wrap gap-2 items-center">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">
                        Sous-groupe :
                      </span>
                      {subgroups.map(sg => {
                        const isActive = selectedSubgroup === sg.prefix || (sg.prefix === null && !selectedSubgroup);
                        const color = CAT_COLORS_BRIGHT[selectedCat] || "#7C3AED";
                        return (
                          <button
                            key={sg.label}
                            onClick={() => setSelectedSubgroup(sg.prefix)}
                            className="px-3 py-1 rounded-full text-xs font-semibold transition-all border"
                            style={isActive ? {
                              background: color, color: "white", borderColor: color,
                              boxShadow: `0 2px 6px ${color}40`
                            } : {
                              background: `${color}10`, color: color,
                              borderColor: `${color}35`
                            }}
                          >
                            {sg.label}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── VUE TABLEAU ─────────────────────────────────────────────── */}
              {viewMode === "table" && (
                <div className="joy-card overflow-hidden">
                  {/* En-tête */}
                  <div className="grid grid-cols-[2fr_3fr_auto_1fr] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <button onClick={() => handleSort("nom")} className="flex items-center gap-1.5 hover:text-violet-600 transition-colors text-left">
                      Contrôle <ArrowUpDown size={11} className={sortField === "nom" ? "text-violet-500" : ""} />
                    </button>
                    <span>Description</span>
                    <span className="flex items-center gap-1 text-amber-500">
                      <Lightbulb size={11} /> Cas d'usage
                    </span>
                    <button onClick={() => handleSort("type")} className="flex items-center gap-1.5 hover:text-violet-600 transition-colors">
                      Type <ArrowUpDown size={11} className={sortField === "type" ? "text-violet-500" : ""} />
                    </button>
                  </div>

                  {/* Lignes */}
                  <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                    {filtered.length === 0 ? (
                      <div className="py-16 text-center text-gray-400 text-sm">
                        <Search size={32} className="mx-auto mb-3 opacity-30" />
                        Aucun contrôle trouvé
                      </div>
                    ) : filtered.map((item, i) => {
                      const catColor = CAT_COLORS_BRIGHT[item.categorie] || "#888";
                      const isExpanded = expandedRow === i;
                      return (
                        <div key={`row-wrap-${item.categorie}-${item.nom}-${i}`}>
                        <motion.div
                          key={`${item.categorie}-${item.nom}-${i}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(i * 0.008, 0.25) }}
                          className={`grid grid-cols-[2fr_3fr_auto_1fr] gap-4 px-5 py-3.5 cursor-pointer transition-colors duration-150 ${
                            isExpanded ? "bg-violet-50" : i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-[#FDFCFA] hover:bg-gray-50"
                          }`}
                          onClick={() => setExpandedRow(isExpanded ? null : i)}
                        >
                          {/* Nom + catégorie + badge non officiel + étoile favori */}
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-1 min-h-[20px] rounded-full flex-shrink-0 mt-1" style={{ background: catColor }} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={e => { e.stopPropagation(); toggleFavorite(item.categorie, item.nom); }}
                                  className="flex-shrink-0 transition-transform hover:scale-125 focus:outline-none"
                                  title={isFavorite(item.categorie, item.nom) ? "Retirer des favoris" : "Ajouter aux favoris"}
                                >
                                  <Star
                                    size={13}
                                    fill={isFavorite(item.categorie, item.nom) ? "#F59E0B" : "none"}
                                    stroke={isFavorite(item.categorie, item.nom) ? "#F59E0B" : "#D1D5DB"}
                                  />
                                </button>
                                <p className="text-sm font-semibold text-gray-800 font-mono">{item.nom}</p>
                                {item.nonOfficiel && <NonOfficielBadge />}
                              </div>
                              <p className="text-[10px] font-semibold mt-0.5 truncate" style={{ color: catColor }}>{item.categorie}</p>
                            </div>
                          </div>

                          {/* Description */}
                          <p className={`text-sm text-gray-500 leading-relaxed ${isExpanded ? "" : "truncate"}`}>
                            {item.description}
                          </p>

                          {/* Cas d'usage */}
                          <div className="min-w-[120px] max-w-[200px]">
                            {item.usageTypique ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 leading-tight">
                                <Lightbulb size={9} className="flex-shrink-0 text-amber-500" />
                                <span className={isExpanded ? "" : "truncate"}>{item.usageTypique}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-300 font-mono">—</span>
                            )}
                          </div>

                          {/* Type + chevron + annotation */}
                          <div className="flex items-center justify-between gap-2">
                            <TypeBadge type={item.type} />
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-gray-300">
                              <ChevronDown size={14} />
                            </motion.div>
                          </div>
                        </motion.div>

                        {/* Panneau d'annotation (visible si ligne étendue) */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              key={`annot-${i}`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <AnnotationPanel
                                categorie={item.categorie}
                                nom={item.nom}
                                annotation={getAnnotation(item.categorie, item.nom)}
                                onSave={(data) => setAnnotation(item.categorie, item.nom, data)}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── VUE GRILLE ──────────────────────────────────────────────── */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[680px] overflow-y-auto pr-1">
                  {filtered.map((item, i) => {
                    const catColor = CAT_COLORS_BRIGHT[item.categorie] || "#888";
                    const favActive = isFavorite(item.categorie, item.nom);
                    const annot = getAnnotation(item.categorie, item.nom);
                    return (
                      <motion.div
                        key={`${item.categorie}-${item.nom}-${i}`}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(i * 0.012, 0.35) }}
                        className="joy-card p-4 relative"
                        style={{ borderLeft: `4px solid ${catColor}` }}
                      >
                        {/* Bouton favori grille */}
                        <button
                          onClick={() => toggleFavorite(item.categorie, item.nom)}
                          className="absolute top-3 right-3 transition-transform hover:scale-125 focus:outline-none"
                          title={favActive ? "Retirer des favoris" : "Ajouter aux favoris"}
                        >
                          <Star size={14} fill={favActive ? "#F59E0B" : "none"} stroke={favActive ? "#F59E0B" : "#D1D5DB"} />
                        </button>
                        <div className="flex items-start justify-between gap-2 mb-2 pr-5">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 leading-tight font-mono">{item.nom}</p>
                            {item.nonOfficiel && <div className="mt-1"><NonOfficielBadge /></div>}
                          </div>
                          <TypeBadge type={item.type} />
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed mb-2">{item.description}</p>
                        {item.usageTypique && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mb-2">
                            <Lightbulb size={9} className="flex-shrink-0 text-amber-500" />
                            {item.usageTypique}
                          </div>
                        )}
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: `${catColor}18`, color: catColor }}>
                          {item.categorie}
                        </span>
                        {/* Annotation résumé en grille */}
                        {annot && (annot.canal || annot.noteCC) && (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-2 py-1">
                            <BookOpen size={9} className="flex-shrink-0" />
                            {annot.canal && <span>Ch: {annot.canal}</span>}
                            {annot.canal && annot.noteCC && <span className="text-teal-300">·</span>}
                            {annot.noteCC && <span>{annot.noteCC}</span>}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

          ) : (
            /* ── ONGLET STATISTIQUES ──────────────────────────────────────── */
            <motion.div key="stats" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Barres */}
                <div className="joy-card p-5">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5">Contrôles par catégorie</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <XAxis type="number" tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#6B7280", fontSize: 10, fontFamily: "JetBrains Mono" }} width={90} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="E/S" stackId="a" fill="#8B5CF6" />
                      <Bar dataKey="IN"  stackId="a" fill="#10B981" />
                      <Bar dataKey="OUT" stackId="a" fill="#EF4444" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Camembert */}
                <div className="joy-card p-5">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5">Répartition par type</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                        paddingAngle={4} dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}>
                        <Cell fill="#8B5CF6" />
                        <Cell fill="#EF4444" />
                        <Cell fill="#10B981" />
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={(value) => <span style={{ color: "#6B7280", fontSize: 11, fontFamily: "JetBrains Mono" }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tableau de synthèse croisée */}
              <div className="joy-card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Synthèse croisée — Catégorie × Type</h3>
                  <p className="text-xs text-gray-400 mt-1 font-mono">Cliquez sur une ligne pour filtrer dans l'explorateur</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-gray-400 font-semibold uppercase tracking-wider">Catégorie</th>
                        <th className="text-center px-4 py-3 text-violet-500 font-semibold">E/S</th>
                        <th className="text-center px-4 py-3 text-emerald-500 font-semibold">IN</th>
                        <th className="text-center px-4 py-3 text-rose-500 font-semibold">OUT</th>
                        <th className="text-center px-4 py-3 text-gray-500 font-semibold">Total</th>
                        <th className="px-5 py-3 text-gray-400 font-semibold">Proportion</th>
                        <th className="text-center px-3 py-3 text-fuchsia-500 font-semibold">Sous-groupes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {STATS_BY_CATEGORY.map((s, i) => {
                        const color = CAT_COLORS_BRIGHT[s.categorie] || "#888";
                        const pct = Math.round((s.total / TOTAL) * 100);
                        const hasSubgroups = !!SUBGROUP_MAP[s.categorie];
                        return (
                          <tr key={s.categorie}
                            className={`${i % 2 === 0 ? "bg-white" : "bg-[#FDFCFA]"} hover:bg-violet-50 transition-colors cursor-pointer`}
                            onClick={() => { setSelectedCat(s.categorie); setActiveTab("explorer"); }}>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                                <span className="text-gray-700 font-semibold">{s.categorie}</span>
                              </div>
                            </td>
                            <td className="text-center px-4 py-3 text-violet-600 font-bold">{s.entree_sortie || "—"}</td>
                            <td className="text-center px-4 py-3 text-emerald-600 font-bold">{s.entree || "—"}</td>
                            <td className="text-center px-4 py-3 text-rose-500 font-bold">{s.sortie || "—"}</td>
                            <td className="text-center px-4 py-3 text-gray-800 font-bold">{s.total}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%`, background: color }} />
                                </div>
                                <span className="text-gray-400 w-8 text-right">{pct}%</span>
                              </div>
                            </td>
                            <td className="text-center px-3 py-3">
                              {hasSubgroups ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                  style={{ background: `${color}15`, color, border: `1px solid ${color}40` }}>
                                  {(SUBGROUP_MAP[s.categorie].length - 1)} groupes
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td className="px-5 py-3 text-gray-600 font-bold">TOTAL</td>
                        <td className="text-center px-4 py-3 text-violet-600 font-bold">{MIDI_DATA.filter(d => d.type === "Entrée/Sortie").length}</td>
                        <td className="text-center px-4 py-3 text-emerald-600 font-bold">{MIDI_DATA.filter(d => d.type === "Entrée").length}</td>
                        <td className="text-center px-4 py-3 text-rose-500 font-bold">{MIDI_DATA.filter(d => d.type === "Sortie").length}</td>
                        <td className="text-center px-4 py-3 text-gray-900 font-bold text-sm">{TOTAL}</td>
                        <td /><td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Lien Google Sheets */}
              <div className="flex justify-center">
                <a href="https://docs.google.com/spreadsheets/d/1MNlCGFzjtBaGW1MkSh18vFm-kT7wzXv-X3gkXR2YsKc/edit"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-all shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-300">
                  <ExternalLink size={15} />
                  Ouvrir dans Google Sheets
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-amber-100 mt-12 py-5" style={{ background: "#F5F0E8" }}>
        <div className="container flex items-center justify-between text-xs font-mono text-gray-400">
          <span>TRAKTOR PRO 3 — {TOTAL} assignations MIDI</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Données extraites du manuel officiel · Commandes Virtuelles issues de la base de connaissances
          </span>
        </div>
      </footer>
    </div>
  );
}

/*
 * TRAKTOR PRO 3 — Dark Studio Interface
 * Page principale : tableau de bord interactif des assignations MIDI
 * Design: fond #0A0E1A, accents cyan #00D4FF, vert néon #00FF88, orange #FF6B35
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Search, Filter, ChevronDown, ChevronUp, X, Music2,
  Zap, ArrowUpDown, LayoutGrid, List, ExternalLink, Activity
} from "lucide-react";
import { MIDI_DATA, CATEGORIES, STATS_BY_CATEGORY, TYPE_COLORS, CAT_COLORS, TOTAL } from "@/lib/midiData";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031120973/VmM56JPUAEXAm5tmyDWKUu/traktor-hero-33nLS4kk55t8zYwQV5WzgH.webp";

const TYPE_LABELS: Record<string, string> = {
  "Entrée/Sortie": "E/S",
  "Entrée": "IN",
  "Sortie": "OUT",
};

const TYPE_BG: Record<string, string> = {
  "Entrée/Sortie": "bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/30",
  "Entrée": "bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/30",
  "Sortie": "bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30",
};

// ─── Composant Badge Type ─────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${TYPE_BG[type] || "bg-white/10 text-white/60 border-white/20"}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 led-on" style={{ background: TYPE_COLORS[type] || "#888" }} />
      {TYPE_LABELS[type] || type}
    </span>
  );
}

// ─── Tooltip personnalisé pour les graphiques ─────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2235] border border-[#00D4FF]/20 rounded-lg p-3 shadow-xl text-xs font-mono">
      <p className="text-[#00D4FF] font-bold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
}

// ─── Composant Stat Card ──────────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(start);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-[#111827] border border-white/5 rounded-xl p-5 overflow-hidden group hover:border-white/10 transition-all duration-300"
      style={{ boxShadow: `0 0 30px ${color}10` }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at 50% 0%, ${color}08 0%, transparent 70%)` }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-2">{label}</p>
          <p className="text-4xl font-bold font-mono" style={{ color }}>{displayed}</p>
        </div>
        <div className="p-2 rounded-lg" style={{ background: `${color}15` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div className="mt-3 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
    </motion.div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("Toutes");
  const [selectedType, setSelectedType] = useState<string>("Tous");
  const [sortField, setSortField] = useState<"nom" | "categorie" | "type">("categorie");
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"explorer" | "stats">("explorer");
  const searchRef = useRef<HTMLInputElement>(null);

  // Filtrage + tri
  const filtered = useMemo(() => {
    let data = MIDI_DATA;
    if (selectedCat !== "Toutes") data = data.filter(d => d.categorie === selectedCat);
    if (selectedType !== "Tous") data = data.filter(d => d.type === selectedType);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(d =>
        d.nom.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.categorie.toLowerCase().includes(q)
      );
    }
    return [...data].sort((a, b) => {
      const va = a[sortField], vb = b[sortField];
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [search, selectedCat, selectedType, sortField, sortAsc]);

  // Données graphiques
  const pieData = useMemo(() => [
    { name: "Entrée/Sortie", value: MIDI_DATA.filter(d => d.type === "Entrée/Sortie").length },
    { name: "Sortie", value: MIDI_DATA.filter(d => d.type === "Sortie").length },
    { name: "Entrée", value: MIDI_DATA.filter(d => d.type === "Entrée").length },
  ], []);

  const barData = useMemo(() =>
    STATS_BY_CATEGORY.map(s => ({
      name: s.categorie.length > 10 ? s.categorie.substring(0, 10) + "…" : s.categorie,
      fullName: s.categorie,
      "E/S": s.entree_sortie,
      "IN": s.entree,
      "OUT": s.sortie,
    })), []);

  const handleSort = (field: "nom" | "categorie" | "type") => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const clearFilters = () => {
    setSearch(""); setSelectedCat("Toutes"); setSelectedType("Tous");
  };

  const hasFilters = search || selectedCat !== "Toutes" || selectedType !== "Tous";

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative h-64 overflow-hidden">
        <img src={HERO_IMG} alt="TRAKTOR PRO 3" className="w-full h-full object-cover object-center opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E1A]/30 via-transparent to-[#0A0E1A]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF88] led-on" />
              <span className="font-mono text-xs text-[#00FF88] tracking-[0.3em] uppercase">Native Instruments</span>
              <div className="w-2 h-2 rounded-full bg-[#00FF88] led-on" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-center text-glow-cyan">
              TRAKTOR <span className="text-[#00D4FF]">PRO 3</span>
            </h1>
            <p className="text-center text-white/50 font-mono text-sm mt-2 tracking-widest">
              ASSIGNATIONS MIDI — RÉFÉRENCE COMPLÈTE
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container py-8 space-y-8">

        {/* ── STATS CARDS ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Contrôles total" value={TOTAL} color="#00D4FF" icon={Activity} />
          <StatCard label="Catégories" value={CATEGORIES.length} color="#00FF88" icon={LayoutGrid} />
          <StatCard label="Entrée/Sortie" value={MIDI_DATA.filter(d => d.type === "Entrée/Sortie").length} color="#00D4FF" icon={Zap} />
          <StatCard label="Sortie seule" value={MIDI_DATA.filter(d => d.type === "Sortie").length} color="#FF6B35" icon={Music2} />
        </div>

        {/* ── ONGLETS ───────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-[#111827] rounded-xl p-1 w-fit">
          {(["explorer", "stats"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30"
                  : "text-white/40 hover:text-white/70"
              }`}>
              {tab === "explorer" ? "Explorateur" : "Statistiques"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "explorer" ? (
            <motion.div key="explorer" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">

              {/* ── FILTRES ─────────────────────────────────────────────────── */}
              <div className="bg-[#111827] border border-white/5 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Recherche */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      ref={searchRef}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher un contrôle, une description…"
                      className="w-full bg-[#0A0E1A] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#00D4FF]/50 font-mono transition-colors"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Catégorie */}
                  <div className="relative">
                    <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    <select
                      value={selectedCat}
                      onChange={e => setSelectedCat(e.target.value)}
                      className="bg-[#0A0E1A] border border-white/10 rounded-lg pl-8 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#00D4FF]/50 appearance-none font-mono cursor-pointer"
                    >
                      <option value="Toutes">Toutes catégories</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Type */}
                  <select
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                    className="bg-[#0A0E1A] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00D4FF]/50 appearance-none font-mono cursor-pointer"
                  >
                    <option value="Tous">Tous les types</option>
                    <option value="Entrée/Sortie">Entrée/Sortie</option>
                    <option value="Entrée">Entrée</option>
                    <option value="Sortie">Sortie</option>
                  </select>

                  {/* Vue */}
                  <div className="flex gap-1 bg-[#0A0E1A] border border-white/10 rounded-lg p-1">
                    <button onClick={() => setViewMode("table")}
                      className={`p-1.5 rounded transition-colors ${viewMode === "table" ? "bg-[#00D4FF]/15 text-[#00D4FF]" : "text-white/30 hover:text-white/60"}`}>
                      <List size={15} />
                    </button>
                    <button onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-[#00D4FF]/15 text-[#00D4FF]" : "text-white/30 hover:text-white/60"}`}>
                      <LayoutGrid size={15} />
                    </button>
                  </div>

                  {hasFilters && (
                    <button onClick={clearFilters}
                      className="flex items-center gap-1.5 text-xs text-[#FF6B35] hover:text-[#FF6B35]/80 font-mono border border-[#FF6B35]/20 rounded-lg px-3 py-2 hover:bg-[#FF6B35]/5 transition-all">
                      <X size={12} /> Effacer
                    </button>
                  )}
                </div>

                {/* Résultats */}
                <div className="flex items-center gap-2 text-xs font-mono text-white/30">
                  <span className="text-[#00D4FF] font-bold">{filtered.length}</span>
                  <span>/ {TOTAL} contrôles</span>
                  {hasFilters && <span className="text-[#FF6B35]">• Filtres actifs</span>}
                </div>
              </div>

              {/* ── CATÉGORIES RAPIDES ──────────────────────────────────────── */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCat("Toutes")}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all border ${
                    selectedCat === "Toutes"
                      ? "bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/40"
                      : "bg-white/3 text-white/40 border-white/10 hover:border-white/20 hover:text-white/60"
                  }`}>
                  Toutes ({TOTAL})
                </button>
                {CATEGORIES.map(cat => {
                  const count = MIDI_DATA.filter(d => d.categorie === cat).length;
                  const color = CAT_COLORS[cat] || "#888";
                  return (
                    <button key={cat}
                      onClick={() => setSelectedCat(cat === selectedCat ? "Toutes" : cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all border ${
                        selectedCat === cat
                          ? "border-opacity-60 text-white"
                          : "bg-white/3 text-white/40 border-white/10 hover:text-white/60"
                      }`}
                      style={selectedCat === cat ? {
                        background: `${color}20`,
                        borderColor: `${color}60`,
                        color: color,
                      } : {}}>
                      {cat} <span className="opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* ── VUE TABLEAU ─────────────────────────────────────────────── */}
              {viewMode === "table" && (
                <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
                  {/* En-tête */}
                  <div className="grid grid-cols-[2fr_3fr_1fr] gap-4 px-5 py-3 bg-[#0A0E1A] border-b border-white/5 text-xs font-mono text-white/30 uppercase tracking-widest">
                    <button onClick={() => handleSort("nom")} className="flex items-center gap-1.5 hover:text-white/60 transition-colors text-left">
                      Contrôle <ArrowUpDown size={11} className={sortField === "nom" ? "text-[#00D4FF]" : ""} />
                    </button>
                    <span>Description</span>
                    <button onClick={() => handleSort("type")} className="flex items-center gap-1.5 hover:text-white/60 transition-colors">
                      Type <ArrowUpDown size={11} className={sortField === "type" ? "text-[#00D4FF]" : ""} />
                    </button>
                  </div>

                  {/* Lignes */}
                  <div className="divide-y divide-white/3 max-h-[600px] overflow-y-auto">
                    <AnimatePresence>
                      {filtered.length === 0 ? (
                        <div className="py-16 text-center text-white/20 font-mono text-sm">
                          <Search size={32} className="mx-auto mb-3 opacity-30" />
                          Aucun contrôle trouvé
                        </div>
                      ) : filtered.map((item, i) => {
                        const catColor = CAT_COLORS[item.categorie] || "#888";
                        const isExpanded = expandedRow === i;
                        return (
                          <motion.div
                            key={`${item.categorie}-${item.nom}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i * 0.01, 0.3) }}
                            className={`grid grid-cols-[2fr_3fr_1fr] gap-4 px-5 py-3.5 cursor-pointer transition-colors duration-150 group ${
                              isExpanded ? "bg-[#1a2235]" : "hover:bg-white/2"
                            }`}
                            onClick={() => setExpandedRow(isExpanded ? null : i)}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="w-1 h-full min-h-[20px] rounded-full flex-shrink-0 mt-0.5" style={{ background: catColor }} />
                              <div className="min-w-0">
                                <p className="text-sm font-mono font-medium text-white/90 truncate">{item.nom}</p>
                                <p className="text-[10px] font-mono text-white/25 mt-0.5" style={{ color: `${catColor}80` }}>{item.categorie}</p>
                              </div>
                            </div>
                            <p className={`text-sm text-white/55 leading-relaxed ${isExpanded ? "" : "truncate"}`}>
                              {item.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <TypeBadge type={item.type} />
                              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-white/20 group-hover:text-white/40">
                                <ChevronDown size={14} />
                              </motion.div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* ── VUE GRILLE ──────────────────────────────────────────────── */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[700px] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {filtered.map((item, i) => {
                      const catColor = CAT_COLORS[item.categorie] || "#888";
                      return (
                        <motion.div
                          key={`${item.categorie}-${item.nom}`}
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: Math.min(i * 0.015, 0.4) }}
                          className="bg-[#111827] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all duration-200 group"
                          style={{ borderLeft: `3px solid ${catColor}60` }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm font-mono font-semibold text-white/90 leading-tight">{item.nom}</p>
                            <TypeBadge type={item.type} />
                          </div>
                          <p className="text-xs text-white/45 leading-relaxed mb-3">{item.description}</p>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${catColor}15`, color: catColor }}>
                            {item.categorie}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

          ) : (
            /* ── ONGLET STATISTIQUES ──────────────────────────────────────── */
            <motion.div key="stats" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Graphique en barres */}
                <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
                  <h3 className="text-sm font-mono font-semibold text-white/60 uppercase tracking-widest mb-5">
                    Contrôles par catégorie
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <XAxis type="number" tick={{ fill: "#ffffff30", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#ffffff50", fontSize: 10, fontFamily: "JetBrains Mono" }} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="E/S" stackId="a" fill="#00D4FF" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="IN" stackId="a" fill="#00FF88" />
                      <Bar dataKey="OUT" stackId="a" fill="#FF6B35" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Graphique en camembert */}
                <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
                  <h3 className="text-sm font-mono font-semibold text-white/60 uppercase tracking-widest mb-5">
                    Répartition par type
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                        paddingAngle={3} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}>
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={TYPE_COLORS[entry.name] || "#888"} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={(value) => <span style={{ color: "#ffffff60", fontSize: 11, fontFamily: "JetBrains Mono" }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tableau de synthèse croisée */}
              <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h3 className="text-sm font-mono font-semibold text-white/60 uppercase tracking-widest">
                    Synthèse croisée — Catégorie × Type
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="bg-[#0A0E1A]">
                        <th className="text-left px-5 py-3 text-white/30 font-normal uppercase tracking-widest">Catégorie</th>
                        <th className="text-center px-4 py-3 text-[#00D4FF]/60 font-normal">E/S</th>
                        <th className="text-center px-4 py-3 text-[#00FF88]/60 font-normal">IN</th>
                        <th className="text-center px-4 py-3 text-[#FF6B35]/60 font-normal">OUT</th>
                        <th className="text-center px-4 py-3 text-white/30 font-normal">Total</th>
                        <th className="px-5 py-3 text-white/20 font-normal">Proportion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/3">
                      {STATS_BY_CATEGORY.map((s, i) => {
                        const color = CAT_COLORS[s.categorie] || "#888";
                        const pct = Math.round((s.total / TOTAL) * 100);
                        return (
                          <tr key={s.categorie} className={`${i % 2 === 0 ? "" : "bg-white/1"} hover:bg-white/3 transition-colors cursor-pointer`}
                            onClick={() => { setSelectedCat(s.categorie); setActiveTab("explorer"); }}>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                <span className="text-white/70">{s.categorie}</span>
                              </div>
                            </td>
                            <td className="text-center px-4 py-3 text-[#00D4FF]">{s.entree_sortie || "—"}</td>
                            <td className="text-center px-4 py-3 text-[#00FF88]">{s.entree || "—"}</td>
                            <td className="text-center px-4 py-3 text-[#FF6B35]">{s.sortie || "—"}</td>
                            <td className="text-center px-4 py-3 text-white/80 font-bold">{s.total}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                                </div>
                                <span className="text-white/25 w-8 text-right">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#0A0E1A] border-t border-white/10">
                        <td className="px-5 py-3 text-white/50 font-bold">TOTAL</td>
                        <td className="text-center px-4 py-3 text-[#00D4FF] font-bold">{MIDI_DATA.filter(d => d.type === "Entrée/Sortie").length}</td>
                        <td className="text-center px-4 py-3 text-[#00FF88] font-bold">{MIDI_DATA.filter(d => d.type === "Entrée").length}</td>
                        <td className="text-center px-4 py-3 text-[#FF6B35] font-bold">{MIDI_DATA.filter(d => d.type === "Sortie").length}</td>
                        <td className="text-center px-4 py-3 text-white font-bold">{TOTAL}</td>
                        <td className="px-5 py-3" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Lien Google Sheets */}
              <div className="flex justify-center">
                <a href="https://docs.google.com/spreadsheets/d/1MNlCGFzjtBaGW1MkSh18vFm-kT7wzXv-X3gkXR2YsKc/edit"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-xl text-[#00D4FF] text-sm font-mono hover:bg-[#00D4FF]/15 transition-all glow-cyan">
                  <ExternalLink size={15} />
                  Ouvrir dans Google Sheets
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 mt-16 py-6">
        <div className="container flex items-center justify-between text-xs font-mono text-white/20">
          <span>TRAKTOR PRO 3 — {TOTAL} assignations MIDI</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] led-on" />
            Données extraites du manuel officiel
          </span>
        </div>
      </footer>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  Warehouse,
  Table2,
  TrendingUp,
  Trash2,
  Pencil,
  X,
  Search,
  ChevronDown,
  PackageMinus,
  Wallet,
  ScanBarcode,
  User,
  Camera,
  Sun,
  Moon,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// ---------- design tokens ----------
const THEMES = {
  light: {
    cream: "#FBF6EE", paper: "#FFFFFF", ink: "#2A2018", inkMuted: "#8A7A68", border: "#E8DCC8",
    primary: "#A6382B", primaryDark: "#7E2A20", primarySoft: "#F3E1DB",
    gold: "#BD8A2A", goldSoft: "#F7ECD3", teal: "#1F4E49", tealSoft: "#E3ECE9",
    good: "#3E7A4B", goodSoft: "#E4F0E6", bad: "#B23A3A", badSoft: "#F7E3E1",
  },
  dark: {
    cream: "#171210", paper: "#231C17", ink: "#F3EBE0", inkMuted: "#A99A88", border: "#3A3027",
    primary: "#B8412F", primaryDark: "#E8A093", primarySoft: "#3B2420",
    gold: "#E0B04E", goldSoft: "#3A2F17", teal: "#3A9A8E", tealSoft: "#1F3A37",
    good: "#6DBF7E", goodSoft: "#1F3524", bad: "#DE6262", badSoft: "#402120",
  },
};
const themeCss = Object.entries(THEMES)
  .map(([k, v]) => `[data-theme="${k}"]{${Object.entries(v).map(([n, c]) => `--c-${n}:${c};`).join("")}color-scheme:${k};}`)
  .join("\n");
const C = Object.fromEntries(Object.keys(THEMES.light).map((k) => [k, `var(--c-${k})`]));

const TYPES = ["Gilam", "Darojka", "Kavrolin"];
const MANUFACTURERS = ["Eron", "Turk", "Samarqand", "Jizzax", "Buxoro", "Noma'lum"];
const MONTH_NAMES = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
const LOW_STOCK = 3;
const ACCOUNTS = ["Avaz", "Ibrohim", "Ismoil", "Avzal"];
const RESTRICTED = ["Avzal"]; // faqat o'z profilini ko'radi
const EXP_CATS = ["Ovqat", "Arenda", "Svet", "Suv", "Musor", "Boshqa"];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmt = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};
const money = (n) => `$${fmt(n)}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const unitLabel = (type) => (type === "Gilam" ? "m²" : "metr");
const priceUnitLabel = (type) => (type === "Gilam" ? "$/m²" : "$/metr");

function inPeriod(dateStr, period) {
  if (period === "all") return true;
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  if (period === "day") return d.toDateString() === now.toDateString();
  if (period === "week") {
    const day = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return d >= monday && d <= sunday;
  }
  if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (period === "year") return d.getFullYear() === now.getFullYear();
  return true;
}

// ---------- reusable UI bits ----------
function KilimStrip({ color = C.gold }) {
  return (
    <svg viewBox="0 0 200 10" preserveAspectRatio="none" style={{ width: "100%", height: 8, display: "block" }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <polygon
          key={i}
          points={`${i * 10},5 ${i * 10 + 5},0 ${i * 10 + 10},5 ${i * 10 + 5},10`}
          fill={i % 2 === 0 ? color : "transparent"}
          stroke={color}
          strokeWidth="0.5"
        />
      ))}
    </svg>
  );
}

function Card({ children, style, className = "" }) {
  return (
    <div
      className={`rounded-2xl p-4 ${className}`}
      style={{ background: C.paper, border: `1px solid ${C.border}`, boxShadow: "0 1px 2px rgba(42,32,24,0.04)", ...style }}
    >
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition"
      style={
        active
          ? { background: C.primary, color: "#fff", fontWeight: 600 }
          : { background: C.paper, color: C.inkMuted, border: `1px solid ${C.border}` }
      }
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs mb-1" style={{ color: C.inkMuted, fontWeight: 600 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${C.border}`,
  background: C.cream,
  color: C.ink,
  fontSize: 15,
  outline: "none",
};

function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

function Select({ value, onChange, options }) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={onChange} style={{ ...inputStyle, appearance: "none", paddingRight: 32 }}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={16} style={{ position: "absolute", right: 10, top: 12, color: C.inkMuted, pointerEvents: "none" }} />
    </div>
  );
}

function PrimaryButton({ children, onClick, style, type = "button" }) {
  return (
    <button type={type} onClick={onClick} className="w-full py-3 rounded-xl font-semibold text-sm" style={{ background: C.primary, color: "#fff", ...style }}>
      {children}
    </button>
  );
}

function TypeBadge({ type }) {
  const colors = { Gilam: C.primary, Darojka: C.gold, Kavrolin: C.teal };
  const soft = { Gilam: C.primarySoft, Darojka: C.goldSoft, Kavrolin: C.tealSoft };
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: soft[type], color: colors[type] }}>
      {type}
    </span>
  );
}

function StockBadge({ stock }) {
  if (stock <= 0)
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: C.badSoft, color: C.bad }}>
        Tugagan
      </span>
    );
  if (stock < LOW_STOCK)
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: C.goldSoft, color: C.gold }}>
        Kam qoldi
      </span>
    );
  return null;
}

// ---------- Do'kon (inventory) ----------
function emptyProductForm() {
  return {
    id: null,
    type: TYPES[0],
    name: "",
    barcode: "",
    manufacturer: MANUFACTURERS[0],
    pricePerUnit: "",
    costPerUnit: "",
    dona: "",
    eni: "",
    boyi: "",
    stockMeters: "",
  };
}

function productToForm(p) {
  return {
    id: p.id,
    type: p.type,
    name: p.name,
    barcode: p.barcode ? String(p.barcode) : "",
    manufacturer: p.manufacturer,
    pricePerUnit: String(p.pricePerUnit ?? p.pricePerM2 ?? ""),
    costPerUnit: String(p.costPerUnit ?? ""),
    dona: p.dona != null ? String(p.dona) : "",
    eni: p.eni != null ? String(p.eni) : "",
    boyi: p.boyi != null ? String(p.boyi) : "",
    stockMeters: String(p.stock ?? 0),
  };
}

function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? productToForm(initial) : emptyProductForm());
  useEffect(() => setForm(initial ? productToForm(initial) : emptyProductForm()), [initial]);
  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const isGilam = form.type === "Gilam";
  const dona = parseFloat(form.dona) || 0;
  const eni = parseFloat(form.eni) || 0;
  const boyi = parseFloat(form.boyi) || 0;
  const computedStock = isGilam ? dona * eni * boyi : parseFloat(form.stockMeters) || 0;

  function submit() {
    if (!form.name.trim()) return;
    onSave({
      id: form.id || uid(),
      type: form.type,
      name: form.name.trim(),
      barcode: form.barcode.trim() || undefined,
      manufacturer: form.manufacturer,
      pricePerUnit: parseFloat(form.pricePerUnit) || 0,
      costPerUnit: parseFloat(form.costPerUnit) || 0,
      dona: isGilam ? dona : undefined,
      eni: isGilam ? eni : undefined,
      boyi: isGilam ? boyi : undefined,
      stock: computedStock,
    });
  }

  return (
    <Card>
      <h2 className="text-lg font-bold mb-3" style={{ color: C.primaryDark, fontFamily: "'Playfair Display', serif" }}>
        {form.id ? "Mahsulotni tahrirlash" : "Do'konga yangi mahsulot qo'shish"}
      </h2>
      <Field label="Mahsulot turi">
        <Select value={form.type} onChange={(e) => update("type", e.target.value)} options={TYPES} />
      </Field>
      <Field label="Nomi / modeli">
        <TextInput placeholder="Masalan: Bugatti-3x4" value={form.name} onChange={(e) => update("name", e.target.value)} />
      </Field>
      <Field label="Shtrix kod (ixtiyoriy)">
        <TextInput inputMode="numeric" placeholder="Skaner qiling yoki yozing" value={form.barcode} onChange={(e) => update("barcode", e.target.value)} />
      </Field>
      <Field label="Ishlab chiqaruvchi">
        <Select value={form.manufacturer} onChange={(e) => update("manufacturer", e.target.value)} options={MANUFACTURERS} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`1 ${unitLabel(form.type)} narxi (sotish, $)`}>
          <TextInput type="number" inputMode="decimal" placeholder="0" value={form.pricePerUnit} onChange={(e) => update("pricePerUnit", e.target.value)} />
        </Field>
        <Field label={`1 ${unitLabel(form.type)} zavod (tan) narxi ($)`}>
          <TextInput type="number" inputMode="decimal" placeholder="0" value={form.costPerUnit} onChange={(e) => update("costPerUnit", e.target.value)} />
        </Field>
      </div>

      {isGilam ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Necha dona bor">
              <TextInput type="number" inputMode="decimal" placeholder="0" value={form.dona} onChange={(e) => update("dona", e.target.value)} />
            </Field>
            <Field label="Eni (m)">
              <TextInput type="number" inputMode="decimal" placeholder="0" value={form.eni} onChange={(e) => update("eni", e.target.value)} />
            </Field>
            <Field label="Bo'yi (m)">
              <TextInput type="number" inputMode="decimal" placeholder="0" value={form.boyi} onChange={(e) => update("boyi", e.target.value)} />
            </Field>
          </div>
          <div className="rounded-xl px-3 py-2 mb-3 flex justify-between items-center" style={{ background: C.goldSoft }}>
            <span className="text-sm" style={{ color: C.inkMuted }}>
              Jami maydon (avtomatik)
            </span>
            <span className="font-bold" style={{ color: C.gold }}>
              {fmt(computedStock)} m²
            </span>
          </div>
        </>
      ) : (
        <Field label="Necha metr bor">
          <TextInput type="number" inputMode="decimal" placeholder="0" value={form.stockMeters} onChange={(e) => update("stockMeters", e.target.value)} />
        </Field>
      )}

      <div className="flex gap-2">
        {form.id && (
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-semibold text-sm" style={{ background: C.cream, color: C.ink, border: `1px solid ${C.border}` }}>
            Bekor qilish
          </button>
        )}
        <PrimaryButton onClick={submit} style={{ background: C.teal }}>
          Saqlash
        </PrimaryButton>
      </div>
    </Card>
  );
}

function DokonView({ products, onSave, onDelete }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => type === "all" || p.type === type)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || String(p.barcode || "").includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, query, type]);

  if (adding || editing) {
    return (
      <ProductForm
        initial={editing}
        onSave={(p) => {
          onSave(p);
          setAdding(false);
          setEditing(null);
        }}
        onCancel={() => {
          setAdding(false);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: 13, color: C.inkMuted }} />
        <TextInput placeholder="Mahsulot nomini qidirish..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 34 }} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", ...TYPES].map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>
            {t === "all" ? "Barchasi" : t}
          </Chip>
        ))}
      </div>
      <PrimaryButton onClick={() => setAdding(true)} style={{ background: C.teal }}>
        + Yangi mahsulot qo'shish
      </PrimaryButton>
      <div className="text-xs" style={{ color: C.inkMuted }}>
        Jami {filtered.length} ta mahsulot
      </div>
      {filtered.length === 0 && (
        <div className="text-sm text-center py-8" style={{ color: C.inkMuted }}>
          Hech narsa topilmadi.
        </div>
      )}
      {filtered.map((p) => (
        <Card key={p.id} className="mb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold truncate" style={{ color: C.ink }}>
                  {p.name}
                </span>
                <TypeBadge type={p.type} />
                <StockBadge stock={p.stock} />
              </div>
              <div className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                {p.manufacturer} · {money(p.pricePerUnit ?? p.pricePerM2)}/{unitLabel(p.type)}
                {p.type === "Gilam" && p.dona ? ` · ${fmt(p.dona)} dona (${p.eni}×${p.boyi})` : ""}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold" style={{ color: C.teal }}>
                {fmt(p.stock)} {unitLabel(p.type)}
              </div>
              <div className="text-[10px]" style={{ color: C.inkMuted }}>
                mavjud
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            {confirmId === p.id ? (
              <>
                <span className="text-xs mr-1" style={{ color: C.bad }}>
                  O'chirilsinmi?
                </span>
                <button
                  onClick={() => {
                    onDelete(p.id);
                    setConfirmId(null);
                  }}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: C.bad, color: "#fff" }}
                >
                  Ha
                </button>
                <button onClick={() => setConfirmId(null)} className="text-xs px-2 py-1 rounded-lg" style={{ background: C.cream, color: C.ink }}>
                  Yo'q
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(p)} className="p-1.5 rounded-lg" style={{ background: C.goldSoft }}>
                  <Pencil size={14} color={C.gold} />
                </button>
                <button onClick={() => setConfirmId(p.id)} className="p-1.5 rounded-lg" style={{ background: C.badSoft }}>
                  <Trash2 size={14} color={C.bad} />
                </button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------- Sale Form (picks from Do'kon catalog) ----------
function emptySaleForm() {
  return { id: null, date: todayISO(), productId: "", meters: "", pieces: "" };
}

function SaleForm({ initial, products, account, presetId, onSave, onCancel, onGoToDokon }) {
  const [form, setForm] = useState(
    initial ? { ...emptySaleForm(), ...initial, pieces: initial.donaCount != null ? String(initial.donaCount) : "" } : { ...emptySaleForm(), productId: presetId || "" }
  );
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  useEffect(
    () =>
      setForm(
        initial ? { ...emptySaleForm(), ...initial, pieces: initial.donaCount != null ? String(initial.donaCount) : "" } : { ...emptySaleForm(), productId: presetId || "" }
      ),
    [initial]
  );

  const selected = products.find((p) => p.id === form.productId) || null;
  const isGilamSale = selected?.type === "Gilam";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && typeFilter === "all") return [];
    return products
      .filter((p) => typeFilter === "all" || p.type === typeFilter)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || String(p.barcode || "").includes(q))
      .slice(0, 20);
  }, [products, query, typeFilter]);

  const piecesSold = parseFloat(form.pieces) || 0;
  const metersDirect = parseFloat(form.meters) || 0;
  const eniSel = selected?.eni || 0;
  const boyiSel = selected?.boyi || 0;
  const qty = isGilamSale ? piecesSold * eniSel * boyiSel : metersDirect;
  const price = selected ? selected.pricePerUnit ?? selected.pricePerM2 ?? 0 : 0;
  const cost = selected ? selected.costPerUnit ?? 0 : 0;
  const totalPrice = qty * price;
  const totalCost = qty * cost;
  const profit = totalPrice - totalCost;
  const insufficientStock = selected && (isGilamSale ? piecesSold > (selected.dona || 0) : qty > selected.stock);

  function submit() {
    if (!selected) return;
    if (isGilamSale ? piecesSold <= 0 : qty <= 0) return;
    onSave({
      id: form.id || uid(),
      date: form.date,
      productId: selected.id,
      type: selected.type,
      name: selected.name,
      manufacturer: selected.manufacturer,
      meters: qty,
      donaCount: isGilamSale ? piecesSold : undefined,
      eniAtSale: isGilamSale ? eniSel : undefined,
      boyiAtSale: isGilamSale ? boyiSel : undefined,
      pricePerM2: price,
      totalPrice,
      costPerM2: cost,
      cost: totalCost,
      grandTotal: totalPrice,
    });
  }

  return (
    <Card>
      <h2 className="text-lg font-bold mb-3" style={{ color: C.primaryDark, fontFamily: "'Playfair Display', serif" }}>
        {form.id ? "Sotuvni tahrirlash" : "Yangi sotuv"}
      </h2>
      <div className="text-xs mb-3" style={{ color: C.inkMuted }}>
        Sotuvchi: <b style={{ color: C.primary }}>{form.id && initial?.owner ? initial.owner : account}</b>
      </div>
      <Field label="Sana">
        <TextInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
      </Field>

      {selected ? (
        <div className="rounded-xl p-3 mb-3" style={{ background: C.tealSoft }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-bold" style={{ color: C.teal }}>
                {selected.name}
              </div>
              <div className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                {selected.type} · {selected.manufacturer} · {money(price)}/{unitLabel(selected.type)} ·{" "}
                {isGilamSale
                  ? `do'konda ${fmt(selected.dona || 0)} dona (${fmt(selected.stock)} m²)`
                  : `do'konda ${fmt(selected.stock)} ${unitLabel(selected.type)}`}
              </div>
            </div>
            <button onClick={() => setForm((f) => ({ ...f, productId: "" }))}>
              <X size={16} color={C.inkMuted} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <Field label="Mahsulotni qidirish">
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: 13, color: C.inkMuted }} />
              <TextInput
                placeholder="Nomi yoki shtrix kod..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const hit = products.find((p) => p.barcode && String(p.barcode) === query.trim());
                  if (hit) setForm((f) => ({ ...f, productId: hit.id }));
                }}
                style={{ paddingLeft: 34 }}
              />
            </div>
          </Field>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["all", ...TYPES].map((t) => (
              <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
                {t === "all" ? "Barchasi" : t}
              </Chip>
            ))}
          </div>
          {results.length === 0 && (query || typeFilter !== "all") && (
            <div className="text-sm text-center py-4" style={{ color: C.inkMuted }}>
              Hech narsa topilmadi.
            </div>
          )}
          <div className="space-y-2 mb-3" style={{ maxHeight: 260, overflowY: "auto" }}>
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => setForm((f) => ({ ...f, productId: p.id }))}
                className="w-full text-left rounded-xl p-2.5"
                style={{ background: C.cream, border: `1px solid ${C.border}` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold truncate" style={{ color: C.ink }}>
                    {p.name}
                  </span>
                  <TypeBadge type={p.type} />
                </div>
                <div className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                  {money(p.pricePerUnit ?? p.pricePerM2)}/{unitLabel(p.type)} ·{" "}
                  {p.type === "Gilam" ? `qoldiq ${fmt(p.dona || 0)} dona (${fmt(p.stock)} m²)` : `qoldiq ${fmt(p.stock)} ${unitLabel(p.type)}`}
                </div>
              </button>
            ))}
          </div>
          <button onClick={onGoToDokon} className="text-sm mb-4" style={{ color: C.primary, fontWeight: 600 }}>
            + Do'konda topilmadi, yangi mahsulot qo'shish
          </button>
        </>
      )}

      {selected && (
        <>
          {isGilamSale ? (
            <>
              <Field label="Nechta dona sotildi">
                <TextInput
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.pieces}
                  onChange={(e) => setForm((f) => ({ ...f, pieces: e.target.value }))}
                />
              </Field>
              <div className="rounded-xl px-3 py-2 mb-3 flex justify-between items-center" style={{ background: C.goldSoft }}>
                <span className="text-sm" style={{ color: C.inkMuted }}>
                  Sotilgan maydon ({fmt(eniSel)}×{fmt(boyiSel)}, avtomatik)
                </span>
                <span className="font-bold" style={{ color: C.gold }}>
                  {fmt(qty)} m²
                </span>
              </div>
            </>
          ) : (
            <Field label="Sotilgan uzunligi (metr)">
              <TextInput type="number" inputMode="decimal" placeholder="0" value={form.meters} onChange={(e) => setForm((f) => ({ ...f, meters: e.target.value }))} />
            </Field>
          )}
          {insufficientStock && (
            <div className="text-xs mb-3" style={{ color: C.bad }}>
              {isGilamSale
                ? `Diqqat: do'konda ${fmt(selected.dona || 0)} dona qoldi, siz ${fmt(piecesSold)} dona kiritdingiz.`
                : `Diqqat: do'konda ${fmt(selected.stock)} ${unitLabel(selected.type)} qoldi, siz ${fmt(qty)} kiritdingiz.`}
            </div>
          )}
          <div className="rounded-xl px-3 py-3 mb-4 space-y-1" style={{ background: C.goldSoft }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: C.inkMuted }}>Umumiy summa</span>
              <span style={{ color: C.gold, fontWeight: 700 }}>{money(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: C.inkMuted }}>Tan narxi</span>
              <span style={{ color: C.ink, fontWeight: 700 }}>{money(totalCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: C.inkMuted }}>Taxminiy foyda</span>
              <span style={{ color: profit >= 0 ? C.good : C.bad, fontWeight: 700 }}>{money(profit)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {form.id && (
              <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-semibold text-sm" style={{ background: C.cream, color: C.ink, border: `1px solid ${C.border}` }}>
                Bekor qilish
              </button>
            )}
            <PrimaryButton onClick={submit}>Saqlash</PrimaryButton>
          </div>
        </>
      )}
    </Card>
  );
}

// ---------- Dashboard ----------
function StatCard({ label, value, sub, color }) {
  return (
    <Card>
      <div className="text-xs mb-1" style={{ color: C.inkMuted, fontWeight: 600 }}>
        {label}
      </div>
      <div className="text-lg font-bold" style={{ color: color || C.ink }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
          {sub}
        </div>
      )}
    </Card>
  );
}

function Dashboard({ sales, products, expenses, period, setPeriod, type, setType }) {
  const filteredSales = useMemo(
    () => sales.filter((s) => inPeriod(s.date, period) && (type === "all" || s.type === type)),
    [sales, period, type]
  );
  const periodSales = useMemo(() => sales.filter((s) => inPeriod(s.date, period)), [sales, period]);

  const totalMeters = filteredSales.reduce((s, x) => s + x.meters, 0);
  const totalRevenue = filteredSales.reduce((s, x) => s + x.grandTotal, 0);
  const totalCost = filteredSales.reduce((s, x) => s + x.cost, 0);
  const grossProfit = totalRevenue - totalCost;
  const periodExpenses = expenses.filter((e) => inPeriod(e.date, period)).reduce((s, e) => s + e.amount, 0);
  const netProfit = grossProfit - periodExpenses;

  const countByType = TYPES.reduce((acc, t) => {
    acc[t] = periodSales.filter((s) => s.type === t).length;
    return acc;
  }, {});

  const topModels = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      map[s.name] = (map[s.name] || 0) + s.meters;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredSales]);
  const maxTop = topModels.length ? topModels[0][1] : 1;

  const lowStock = useMemo(() => products.filter((p) => p.stock < LOW_STOCK).sort((a, b) => a.stock - b.stock).slice(0, 6), [products]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          ["day", "Bugun"],
          ["week", "Bu hafta"],
          ["month", "Bu oy"],
          ["year", "Bu yil"],
          ["all", "Barchasi"],
        ].map(([k, l]) => (
          <Chip key={k} active={period === k} onClick={() => setPeriod(k)}>
            {l}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", ...TYPES].map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>
            {t === "all" ? "Barcha turlar" : t}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Jami sotilgan miqdor" value={`${fmt(totalMeters)}`} sub="m² / metr" />
        <StatCard label="Jami tushum" value={money(totalRevenue)} color={C.teal} />
        <StatCard label="Mahsulot tan narxi" value={money(totalCost)} color={C.bad} />
        <StatCard label="Harajatlar" value={money(periodExpenses)} color={C.bad} sub="shu davrdagi jami" />
        <div className="col-span-2">
          <StatCard
            label={type === "all" ? "Sof foyda" : `Foyda (${type}, harajatsiz)`}
            value={money(type === "all" ? netProfit : grossProfit)}
            color={(type === "all" ? netProfit : grossProfit) >= 0 ? C.good : C.bad}
            sub={type === "all" ? "tushum − tan narxi − harajatlar" : "harajatlar turlarga bo'linmaydi"}
          />
        </div>
      </div>

      <Card>
        <div className="text-xs mb-3" style={{ color: C.inkMuted, fontWeight: 600 }}>
          Turlar bo'yicha sotuvlar soni
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {TYPES.map((t) => (
            <div key={t} className="rounded-xl py-2" style={{ background: C.cream }}>
              <div className="text-lg font-bold" style={{ color: C.primary }}>
                {countByType[t]}
              </div>
              <div className="text-xs" style={{ color: C.inkMuted }}>
                {t}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-xs mb-3" style={{ color: C.inkMuted, fontWeight: 600 }}>
          Eng ko'p sotilgan nomlar
        </div>
        {topModels.length === 0 && (
          <div className="text-sm" style={{ color: C.inkMuted }}>
            Bu davrda sotuvlar yo'q.
          </div>
        )}
        <div className="space-y-2">
          {topModels.map(([name, meters], i) => (
            <div key={name}>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: C.ink, fontWeight: 600 }}>
                  {i + 1}. {name}
                </span>
                <span style={{ color: C.inkMuted }}>{fmt(meters)}</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: C.cream }}>
                <div style={{ height: 6, borderRadius: 4, width: `${(meters / maxTop) * 100}%`, background: C.gold }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {lowStock.length > 0 && (
        <Card style={{ borderColor: C.bad }}>
          <div className="flex items-center gap-2 mb-3">
            <PackageMinus size={16} color={C.bad} />
            <span className="text-xs" style={{ color: C.bad, fontWeight: 700 }}>
              Do'konda kam qolgan / tugagan mahsulotlar
            </span>
          </div>
          <div className="space-y-1">
            {lowStock.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span style={{ color: C.ink }}>{p.name}</span>
                <span style={{ color: p.stock <= 0 ? C.bad : C.gold, fontWeight: 700 }}>
                  {fmt(p.stock)} {unitLabel(p.type)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------- Table view ----------
function TableView({ sales, onEditSale, onDeleteSale }) {
  const [confirmId, setConfirmId] = useState(null);
  const sorted = [...sales].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div>
      {sorted.length === 0 ? (
        <div className="text-sm text-center py-8" style={{ color: C.inkMuted }}>
          Hali sotuvlar kiritilmagan.
        </div>
      ) : (
        sorted.map((s) => (
          <Card key={s.id} className="mb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold truncate" style={{ color: C.ink }}>
                    {s.name}
                  </span>
                  <TypeBadge type={s.type} />
                </div>
                <div className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                  {s.date} · {s.owner ? `${s.owner} sotdi` : "sotuvchi noma'lum"} · {s.manufacturer} ·{" "}
                  {s.donaCount != null ? `${fmt(s.donaCount)} dona (${fmt(s.meters)} m²)` : `${fmt(s.meters)} ${unitLabel(s.type)}`}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold" style={{ color: C.teal }}>
                  {money(s.grandTotal)}
                </div>
                <div className="text-[10px]" style={{ color: C.inkMuted }}>
                  tushum
                </div>
                <div className="text-xs font-bold mt-1" style={{ color: s.grandTotal - s.cost >= 0 ? C.good : C.bad }}>
                  foyda {money(s.grandTotal - s.cost)}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              {confirmId === s.id ? (
                <>
                  <span className="text-xs mr-1" style={{ color: C.bad }}>
                    O'chirilsinmi?
                  </span>
                  <button
                    onClick={() => {
                      onDeleteSale(s.id);
                      setConfirmId(null);
                    }}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: C.bad, color: "#fff" }}
                  >
                    Ha
                  </button>
                  <button onClick={() => setConfirmId(null)} className="text-xs px-2 py-1 rounded-lg" style={{ background: C.cream, color: C.ink }}>
                    Yo'q
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => onEditSale(s)} className="p-1.5 rounded-lg" style={{ background: C.goldSoft }}>
                    <Pencil size={14} color={C.gold} />
                  </button>
                  <button onClick={() => setConfirmId(s.id)} className="p-1.5 rounded-lg" style={{ background: C.badSoft }}>
                    <Trash2 size={14} color={C.bad} />
                  </button>
                </>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

// ---------- Chart view ----------
function ChartView({ sales, expenses }) {
  const [chartType, setChartType] = useState("all");
  const filteredSales = useMemo(() => sales.filter((s) => chartType === "all" || s.type === chartType), [sales, chartType]);

  const data = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_NAMES[d.getMonth()], revenue: 0, cost: 0, profit: 0, expense: 0, net: 0 });
    }
    const idx = {};
    months.forEach((m, i) => (idx[m.key] = i));
    filteredSales.forEach((s) => {
      const d = new Date(s.date + "T00:00:00");
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key in idx) {
        months[idx[key]].revenue += s.grandTotal;
        months[idx[key]].cost += s.cost;
      }
    });
    if (chartType === "all") {
      expenses.forEach((e) => {
        const d = new Date(e.date + "T00:00:00");
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (key in idx) months[idx[key]].expense += e.amount;
      });
    }
    months.forEach((m) => {
      m.profit = m.revenue - m.cost;
      m.net = m.profit - m.expense;
    });
    return months;
  }, [filteredSales, expenses, chartType]);

  return (
    <Card>
      <div className="text-sm font-bold mb-3" style={{ color: C.primaryDark, fontFamily: "'Playfair Display', serif" }}>
        Oylik foyda dinamikasi (so'nggi 12 oy)
      </div>
      <div className="flex gap-2 overflow-x-auto pb-3">
        {["all", ...TYPES].map((t) => (
          <Chip key={t} active={chartType === t} onClick={() => setChartType(t)}>
            {t === "all" ? "Barcha turlar" : t}
          </Chip>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.inkMuted }} axisLine={{ stroke: C.border }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.inkMuted }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip formatter={(v, n) => [money(v), n]} contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12, background: C.paper, color: C.ink }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" name={chartType === "all" ? "Sof foyda" : "Foyda (harajatsiz)"} dataKey={chartType === "all" ? "net" : "profit"} stroke={C.primary} strokeWidth={2.5} dot={{ r: 3, fill: C.primary }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="text-[11px] mt-2" style={{ color: C.inkMuted }}>
        Sof foyda = tushum − tan narxi − harajatlar. Tur tanlansa, harajatsiz foyda ko'rsatiladi.
      </div>
    </Card>
  );
}

// ---------- Harajatlar ----------
function ExpensesView({ expenses, onAdd, onDelete }) {
  const [period, setPeriod] = useState("month");
  const [form, setForm] = useState({ date: todayISO(), category: EXP_CATS[0], amount: "", note: "" });
  const [confirmId, setConfirmId] = useState(null);
  const list = useMemo(() => expenses.filter((e) => inPeriod(e.date, period)).sort((a, b) => (a.date < b.date ? 1 : -1)), [expenses, period]);
  const total = list.reduce((s, e) => s + e.amount, 0);
  const byCat = EXP_CATS.map((c) => [c, list.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0)]).filter(([, v]) => v > 0);
  const allTotal = expenses.reduce((s, e) => s + e.amount, 0);

  function submit() {
    const amount = parseFloat(form.amount) || 0;
    if (amount <= 0) return;
    onAdd({ id: uid(), date: form.date, category: form.category, amount, note: form.note.trim() });
    setForm((f) => ({ ...f, amount: "", note: "" }));
  }

  return (
    <div className="space-y-3">
      <Card>
        <h2 className="text-lg font-bold mb-3" style={{ color: C.primaryDark, fontFamily: "'Playfair Display', serif" }}>
          Yangi harajat
        </h2>
        <Field label="Sana">
          <TextInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Turi">
            <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} options={EXP_CATS} />
          </Field>
          <Field label="Summa ($)">
            <TextInput type="number" inputMode="decimal" placeholder="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </Field>
        </div>
        <Field label="Izoh (ixtiyoriy)">
          <TextInput placeholder="Masalan: tushlik, oylik arenda..." value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
        </Field>
        <PrimaryButton onClick={submit}>Harajatni saqlash</PrimaryButton>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[["day", "Bugun"], ["week", "Bu hafta"], ["month", "Bu oy"], ["year", "Bu yil"], ["all", "Barchasi"]].map(([k, l]) => (
          <Chip key={k} active={period === k} onClick={() => setPeriod(k)}>
            {l}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Shu davr harajati" value={money(total)} color={C.bad} />
        <StatCard label="Umumiy harajat (hammasi)" value={money(allTotal)} color={C.ink} />
      </div>

      {byCat.length > 0 && (
        <Card>
          <div className="text-xs mb-2" style={{ color: C.inkMuted, fontWeight: 600 }}>
            Turlar bo'yicha
          </div>
          <div className="space-y-1">
            {byCat.map(([c, v]) => (
              <div key={c} className="flex justify-between text-sm">
                <span style={{ color: C.ink }}>{c}</span>
                <span style={{ color: C.bad, fontWeight: 700 }}>{money(v)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {list.length === 0 && (
        <div className="text-sm text-center py-6" style={{ color: C.inkMuted }}>
          Bu davrda harajat yo'q.
        </div>
      )}
      {list.map((e) => (
        <Card key={e.id} className="mb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold" style={{ color: C.ink }}>
                {e.category}
              </div>
              <div className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                {e.date}
                {e.owner ? ` · ${e.owner}` : ""}
                {e.note ? ` · ${e.note}` : ""}
              </div>
            </div>
            <div className="text-sm font-bold shrink-0" style={{ color: C.bad }}>
              {money(e.amount)}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            {confirmId === e.id ? (
              <>
                <span className="text-xs mr-1" style={{ color: C.bad }}>
                  O'chirilsinmi?
                </span>
                <button
                  onClick={() => {
                    onDelete(e.id);
                    setConfirmId(null);
                  }}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: C.bad, color: "#fff" }}
                >
                  Ha
                </button>
                <button onClick={() => setConfirmId(null)} className="text-xs px-2 py-1 rounded-lg" style={{ background: C.cream, color: C.ink }}>
                  Yo'q
                </button>
              </>
            ) : (
              <button onClick={() => setConfirmId(e.id)} className="p-1.5 rounded-lg" style={{ background: C.badSoft }}>
                <Trash2 size={14} color={C.bad} />
              </button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------- Shtrix kod ----------
async function makeBarcodeReader() {
  const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] = await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR,
    BarcodeFormat.QR_CODE,
    BarcodeFormat.DATA_MATRIX,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
}

function cameraErrorText(e) {
  const n = (e && e.name) || "";
  if (n === "NotAllowedError" || n === "PermissionDeniedError" || n === "SecurityError")
    return "Kameraga ruxsat berilmadi. Brauzer sozlamalarida (manzil satridagi qulf belgisi) kameraga ruxsat bering va \"Qayta urinish\" ni bosing.";
  if (n === "NotFoundError" || n === "DevicesNotFoundError" || n === "OverconstrainedError")
    return "Bu qurilmada kamera topilmadi.";
  if (n === "NotReadableError" || n === "TrackStartError" || n === "AbortError")
    return "Kamera boshqa dastur yoki boshqa oyna tomonidan band. Ularni yopib, qayta urinib ko'ring.";
  return "Kamerani ochib bo'lmadi.";
}

function CameraScanner({ onDetect, onClose }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const doneRef = useRef(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [starting, setStarting] = useState(true);
  const [attempt, setAttempt] = useState(0);

  function finish(text) {
    if (doneRef.current) return;
    doneRef.current = true;
    try {
      if (navigator.vibrate) navigator.vibrate(60);
    } catch (e) {}
    try {
      if (controlsRef.current) controlsRef.current.stop();
    } catch (e) {}
    onDetect(text);
  }

  useEffect(() => {
    let cancelled = false;
    doneRef.current = false;
    setErr("");
    setStarting(true);
    (async () => {
      try {
        if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setErr(
            window.isSecureContext === false
              ? "Kamera faqat xavfsiz (https) sahifada ishlaydi. Vercel'dagi sayt orqali oching yoki shtrix kodni qo'lda yozing / rasmdan o'qing."
              : "Bu brauzer kamerani qo'llamaydi. Shtrix kodni qo'lda yozing yoki rasmdan o'qing."
          );
          setStarting(false);
          return;
        }
        const reader = await makeBarcodeReader();
        if (cancelled) return;
        const controls = await reader.decodeFromConstraints(
          { audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
          videoRef.current,
          (result) => {
            if (result) finish(result.getText());
          }
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStarting(false);
      } catch (e) {
        if (!cancelled) {
          setErr(cameraErrorText(e));
          setStarting(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      try {
        if (controlsRef.current) controlsRef.current.stop();
      } catch (e) {}
      controlsRef.current = null;
      try {
        const v = videoRef.current;
        if (v && v.srcObject) v.srcObject.getTracks().forEach((t) => t.stop());
      } catch (e) {}
    };
  }, [attempt]);

  async function readPhoto(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setInfo("Rasm o'qilmoqda...");
    const url = URL.createObjectURL(file);
    try {
      const reader = await makeBarcodeReader();
      const result = await reader.decodeFromImageUrl(url);
      setInfo("");
      finish(result.getText());
    } catch (er) {
      setInfo("Rasmda shtrix kod topilmadi. Kodni yaqinroq va yorug'da suratga oling.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return (
    <Card>
      <div style={{ position: "relative", display: err ? "none" : "block" }}>
        <video ref={videoRef} muted playsInline autoPlay style={{ width: "100%", borderRadius: 12, background: "#000", minHeight: 180, objectFit: "cover" }} />
        <div style={{ position: "absolute", left: "10%", right: "10%", top: "50%", height: 2, background: "rgba(255,60,60,0.8)", pointerEvents: "none" }} />
        {starting && (
          <div className="text-xs" style={{ position: "absolute", left: 0, right: 0, top: 8, textAlign: "center", color: "#fff" }}>
            Kamera ochilmoqda...
          </div>
        )}
      </div>
      {err && (
        <div className="text-sm mb-2" style={{ color: C.bad }}>
          {err}
        </div>
      )}
      {info && (
        <div className="text-xs mt-2" style={{ color: C.inkMuted }}>
          {info}
        </div>
      )}
      <div className="flex gap-2 mt-2">
        {err && (
          <button onClick={() => setAttempt((a) => a + 1)} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: C.primary, color: "#fff" }}>
            Qayta urinish
          </button>
        )}
        <label className="flex-1 py-2 rounded-xl text-sm font-semibold text-center cursor-pointer" style={{ background: C.tealSoft, color: C.teal }}>
          Rasmdan o'qish
          <input type="file" accept="image/*" capture="environment" onChange={readPhoto} style={{ display: "none" }} />
        </label>
        <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: C.cream, color: C.ink, border: `1px solid ${C.border}` }}>
          Yopish
        </button>
      </div>
    </Card>
  );
}

function BarcodeView({ products, sales, account, onSave, onSell }) {
  const [code, setCode] = useState("");
  const [scanned, setScanned] = useState("");
  const [mode, setMode] = useState(null); // null | "new" | "attach"
  const [query, setQuery] = useState("");
  const [camera, setCamera] = useState(false);
  const newInit = useMemo(() => ({ type: TYPES[0], name: "", manufacturer: MANUFACTURERS[0], barcode: scanned, stock: 0 }), [scanned]);

  const found = scanned ? products.filter((p) => p.barcode && String(p.barcode) === scanned) : [];
  const attachResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 15);
  }, [products, query]);

  function doScan(v) {
    const c = String(v || "").trim();
    if (!c) return;
    setScanned(c);
    setCode(c);
    setMode(null);
    setQuery("");
    setCamera(false);
  }

  const cardFor = (p) => {
    const isG = p.type === "Gilam";
    const area = isG ? (p.eni || 0) * (p.boyi || 0) : 1;
    const sell = p.pricePerUnit ?? p.pricePerM2 ?? 0;
    const cost = p.costPerUnit ?? 0;
    const pSales = sales.filter((s) => s.productId === p.id).sort((a, b) => (a.date < b.date ? 1 : -1));
    const bySeller = {};
    pSales.forEach((s) => {
      const k = s.owner || "Noma'lum";
      bySeller[k] = (bySeller[k] || 0) + (s.donaCount != null ? s.donaCount : s.meters);
    });
    const qtyUnit = isG ? "dona" : unitLabel(p.type);
    return (
      <Card key={p.id}>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-base font-bold" style={{ color: C.ink }}>
            {p.name}
          </span>
          <TypeBadge type={p.type} />
          <StockBadge stock={p.stock} />
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span style={{ color: C.inkMuted }}>Razmeri</span>
            <span style={{ fontWeight: 700 }}>{isG && p.eni && p.boyi ? `${fmt(p.eni)}×${fmt(p.boyi)} (${fmt(area)} m²)` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: C.inkMuted }}>Zavod narxi</span>
            <span style={{ fontWeight: 700, color: C.bad }}>
              {isG && area ? `${money(cost * area)} · ` : ""}
              {money(cost)}/{unitLabel(p.type)}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: C.inkMuted }}>Kassa narxi</span>
            <span style={{ fontWeight: 700, color: C.teal }}>
              {isG && area ? `${money(sell * area)} · ` : ""}
              {money(sell)}/{unitLabel(p.type)}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: C.inkMuted }}>Mavjud</span>
            <span style={{ fontWeight: 700 }}>{isG ? `${fmt(p.dona || 0)} dona` : `${fmt(p.stock)} ${unitLabel(p.type)}`}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: C.inkMuted }}>Shtrix kod</span>
            <span style={{ fontWeight: 600 }}>{p.barcode}</span>
          </div>
          {p.addedBy && (
            <div className="flex justify-between">
              <span style={{ color: C.inkMuted }}>Kiritgan</span>
              <span style={{ fontWeight: 600 }}>{p.addedBy}</span>
            </div>
          )}
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="text-xs mb-1" style={{ color: C.inkMuted, fontWeight: 600 }}>
            Kim sotgan
          </div>
          {pSales.length === 0 ? (
            <div className="text-xs" style={{ color: C.inkMuted }}>
              Hali sotilmagan.
            </div>
          ) : (
            <>
              <div className="flex gap-2 flex-wrap mb-2">
                {Object.entries(bySeller).map(([k, v]) => (
                  <span key={k} className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: C.primarySoft, color: C.primary }}>
                    {k}: {fmt(v)} {qtyUnit}
                  </span>
                ))}
              </div>
              <div className="space-y-1">
                {pSales.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex justify-between text-xs" style={{ color: C.ink }}>
                    <span>
                      {s.date} · {s.owner || "noma'lum"}
                    </span>
                    <span style={{ fontWeight: 600 }}>{s.donaCount != null ? `${fmt(s.donaCount)} dona` : `${fmt(s.meters)} ${unitLabel(s.type)}`}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <PrimaryButton onClick={() => onSell(p.id)} style={{ marginTop: 12 }}>
          Sotuvga qo'shish ({account})
        </PrimaryButton>
      </Card>
    );
  };

  return (
    <div className="space-y-3">
      <Card>
        <div className="text-xs mb-1" style={{ color: C.inkMuted, fontWeight: 600 }}>
          Shtrix kodni skaner qiling (yoki yozib Enter bosing)
        </div>
        <div className="flex gap-2">
          <TextInput
            autoFocus
            inputMode="numeric"
            placeholder="Shtrix kod..."
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              const v = e.target.value.trim();
              if (v && products.some((p) => p.barcode && String(p.barcode) === v)) doScan(v);
            }}
            onKeyDown={(e) => e.key === "Enter" && doScan(code)}
          />
          <button onClick={() => doScan(code)} className="px-3 rounded-xl" style={{ background: C.primary }}>
            <Search size={18} color="#fff" />
          </button>
          <button onClick={() => setCamera((v) => !v)} className="px-3 rounded-xl" style={{ background: C.teal }}>
            <Camera size={18} color="#fff" />
          </button>
        </div>
      </Card>

      {camera && <CameraScanner onDetect={doScan} onClose={() => setCamera(false)} />}

      {scanned && found.map(cardFor)}

      {scanned && found.length === 0 && mode === null && (
        <Card>
          <div className="text-sm mb-3" style={{ color: C.ink }}>
            <b>{scanned}</b> kodi topilmadi. Yangi shtrix kod sifatida qo'shasizmi?
          </div>
          <div className="space-y-2">
            <PrimaryButton onClick={() => setMode("new")} style={{ background: C.teal }}>
              Yangi mahsulot sifatida qo'shish
            </PrimaryButton>
            <PrimaryButton onClick={() => setMode("attach")}>Mavjud mahsulotga biriktirish</PrimaryButton>
          </div>
        </Card>
      )}

      {scanned && found.length === 0 && mode === "new" && (
        <>
          <ProductForm
            initial={newInit}
            onSave={(p) => {
              onSave(p);
              setMode(null);
            }}
            onCancel={() => setMode(null)}
          />
          <button onClick={() => setMode(null)} className="w-full py-2 rounded-xl text-sm font-semibold" style={{ background: C.cream, color: C.ink, border: `1px solid ${C.border}` }}>
            Bekor qilish
          </button>
        </>
      )}

      {scanned && found.length === 0 && mode === "attach" && (
        <Card>
          <div className="text-sm mb-2" style={{ color: C.ink }}>
            <b>{scanned}</b> kodini qaysi mahsulotga biriktiramiz?
          </div>
          <TextInput placeholder="Mahsulot nomini qidiring..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="space-y-2 mt-3" style={{ maxHeight: 280, overflowY: "auto" }}>
            {attachResults.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSave({ ...p, barcode: scanned });
                  setMode(null);
                }}
                className="w-full text-left rounded-xl p-2.5"
                style={{ background: C.cream, border: `1px solid ${C.border}` }}
              >
                <div className="text-sm font-semibold" style={{ color: C.ink }}>
                  {p.name} {p.barcode ? <span style={{ color: C.bad, fontWeight: 500 }}>(kodi bor: {p.barcode})</span> : null}
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setMode(null)} className="w-full py-2 mt-3 rounded-xl text-sm font-semibold" style={{ background: C.cream, color: C.ink, border: `1px solid ${C.border}` }}>
            Bekor qilish
          </button>
        </Card>
      )}
    </div>
  );
}

// ---------- Akkaunt almashtirish ----------
function AccountSwitcher({ account, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold" style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
        <User size={14} />
        {account}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: 40, zIndex: 50, background: C.paper, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 6px 20px rgba(42,32,24,0.18)", minWidth: 150, overflow: "hidden" }}>
          {ACCOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => {
                onChange(a);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm"
              style={{ color: a === account ? C.primary : C.ink, fontWeight: a === account ? 700 : 500, background: a === account ? C.primarySoft : "transparent" }}
            >
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- App ----------
export default function KassaApp() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [editingSale, setEditingSale] = useState(null);
  const [period, setPeriod] = useState("month");
  const [type, setType] = useState("all");
  const [saveError, setSaveError] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [account, setAccount] = useState("Ibrohim");
  const [view, setView] = useState("Umumiy");
  const [presetId, setPresetId] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    try {
      const t = localStorage.getItem("korkam:theme");
      if (t === "dark" || t === "light") setTheme(t);
      else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
    } catch (e) {}
  }, []);
  useEffect(() => {
    document.body.style.background = THEMES[theme].cream;
  }, [theme]);
  function toggleTheme() {
    const n = theme === "dark" ? "light" : "dark";
    setTheme(n);
    try {
      localStorage.setItem("korkam:theme", n);
    } catch (e) {}
  }

  useEffect(() => {
    try {
      const a = localStorage.getItem("korkam:account");
      if (ACCOUNTS.includes(a)) setAccount(a);
    } catch (e) {}
  }, []);

  function changeAccount(a) {
    setAccount(a);
    setView("Umumiy");
    try {
      localStorage.setItem("korkam:account", a);
    } catch (e) {}
  }

  const restricted = RESTRICTED.includes(account);
  const effView = restricted ? account : view;
  const visSales = useMemo(() => (effView === "Umumiy" ? sales : sales.filter((x) => x.owner === effView)), [sales, effView]);
  const visExpenses = useMemo(() => (effView === "Umumiy" ? expenses : expenses.filter((x) => x.owner === effView)), [expenses, effView]);

  useEffect(() => {
    (async () => {
      try {
        const [salesRes, productsRes, expRes] = await Promise.all([fetch("/api/sales"), fetch("/api/products"), fetch("/api/expenses")]);
        setSales(salesRes.ok ? await salesRes.json() : []);
        setExpenses(expRes.ok ? await expRes.json() : []);
        setProducts(productsRes.ok ? await productsRes.json() : []);
      } catch (e) {
        setSaveError(true);
      }
      setLoading(false);
    })();
  }, []);

  async function persist(url, value, setter) {
    setter(value);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
      if (!res.ok) setSaveError(true);
    } catch (e) {
      setSaveError(true);
    }
  }

  function restoreProduct(p, prevSale) {
    if (p.type === "Gilam" && prevSale.donaCount != null) {
      const newDona = (p.dona || 0) + prevSale.donaCount;
      return { ...p, dona: newDona, stock: newDona * (p.eni || 0) * (p.boyi || 0) };
    }
    return { ...p, stock: p.stock + prevSale.meters };
  }

  function applySale(p, sale) {
    if (p.type === "Gilam" && sale.donaCount != null) {
      const newDona = Math.max(0, (p.dona || 0) - sale.donaCount);
      return { ...p, dona: newDona, stock: newDona * (p.eni || 0) * (p.boyi || 0) };
    }
    return { ...p, stock: Math.max(0, p.stock - sale.meters) };
  }

  function saveSale(saleIn) {
    const prevSale = sales.find((s) => s.id === saleIn.id);
    const sale = { ...saleIn, owner: prevSale ? prevSale.owner : account };
    const exists = !!prevSale;
    const nextSales = exists ? sales.map((s) => (s.id === sale.id ? sale : s)) : [...sales, sale];
    persist("/api/sales", nextSales, setSales);

    let nextProducts = products;
    if (exists) {
      nextProducts = nextProducts.map((p) => (p.id === prevSale.productId ? restoreProduct(p, prevSale) : p));
    }
    nextProducts = nextProducts.map((p) => (p.id === sale.productId ? applySale(p, sale) : p));
    persist("/api/products", nextProducts, setProducts);

    setEditingSale(null);
    setPresetId("");
    setTab("dashboard");
  }

  function deleteSale(id) {
    const sale = sales.find((s) => s.id === id);
    persist("/api/sales", sales.filter((s) => s.id !== id), setSales);
    if (sale) {
      const nextProducts = products.map((p) => (p.id === sale.productId ? restoreProduct(p, sale) : p));
      persist("/api/products", nextProducts, setProducts);
    }
  }

  function saveProduct(product) {
    const old = products.find((p) => p.id === product.id);
    const exists = !!old;
    const item = exists ? { ...product, addedBy: old.addedBy } : { ...product, addedBy: product.addedBy || account };
    const next = exists ? products.map((p) => (p.id === product.id ? item : p)) : [...products, item];
    persist("/api/products", next, setProducts);
  }
  function addExpense(e) {
    persist("/api/expenses", [...expenses, { ...e, owner: account }], setExpenses);
  }
  function deleteExpense(id) {
    persist("/api/expenses", expenses.filter((e) => e.id !== id), setExpenses);
  }
  function deleteProduct(id) {
    persist("/api/products", products.filter((p) => p.id !== id), setProducts);
  }

  const tabs = [
    { key: "dashboard", label: "Panel", icon: LayoutDashboard },
    { key: "sale", label: "Sotuv", icon: PlusCircle },
    { key: "dokon", label: "Do'kon", icon: Warehouse },
    { key: "expense", label: "Harajat", icon: Wallet },
    { key: "table", label: "Jadval", icon: Table2 },
    { key: "chart", label: "Grafik", icon: TrendingUp },
    { key: "barcode", label: "Shtrix", icon: ScanBarcode },
  ];

  return (
    <div data-theme={theme} style={{ background: C.cream, minHeight: "100vh", fontFamily: "'Manrope', sans-serif", color: C.ink }}>
      <style>{`
        ${themeCss}
        input:focus, select:focus { border-color: ${C.primary} !important; }
        select option { background: ${C.paper}; color: ${C.ink}; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 88 }}>
        <div style={{ background: C.primary, padding: "20px 16px 0" }}>
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, fontWeight: 700, color: "#fff" }}>Korkam Gilamlari</div>
              <div style={{ fontSize: 12, color: "#F3D9CE", marginTop: 2 }}>Kassa hisob-kitob paneli</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} aria-label="Tema" className="p-2 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }}>
                {theme === "dark" ? <Sun size={16} color="#fff" /> : <Moon size={16} color="#fff" />}
              </button>
              <AccountSwitcher account={account} onChange={changeAccount} />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <KilimStrip color="#F3D9CE" />
          </div>
        </div>

        <div className="px-4 pt-4">
          {!loading &&
            (restricted ? (
              <div className="text-xs mb-3" style={{ color: C.inkMuted }}>
                Faqat <b>{account}</b> profili ko'rinadi.
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-3">
                {["Umumiy", ...ACCOUNTS].map((v) => (
                  <Chip key={v} active={view === v} onClick={() => setView(v)}>
                    {v}
                  </Chip>
                ))}
              </div>
            ))}
          {loading ? (
            <div className="text-center py-16 text-sm" style={{ color: C.inkMuted }}>
              Yuklanmoqda...
            </div>
          ) : (
            <>
              {tab === "dashboard" && <Dashboard sales={visSales} expenses={visExpenses} products={products} period={period} setPeriod={setPeriod} type={type} setType={setType} />}
              {tab === "sale" && (
                <SaleForm
                  initial={editingSale}
                  account={account}
                  presetId={presetId}
                  products={products}
                  onSave={saveSale}
                  onCancel={() => {
                    setEditingSale(null);
                    setTab("table");
                  }}
                  onGoToDokon={() => setTab("dokon")}
                />
              )}
              {tab === "dokon" && <DokonView products={products} onSave={saveProduct} onDelete={deleteProduct} />}
              {tab === "table" && (
                <TableView
                  sales={visSales}
                  onEditSale={(s) => {
                    setEditingSale(s);
                    setTab("sale");
                  }}
                  onDeleteSale={deleteSale}
                />
              )}
              {tab === "expense" && <ExpensesView expenses={visExpenses} onAdd={addExpense} onDelete={deleteExpense} />}
              {tab === "barcode" && <BarcodeView
                  products={products}
                  sales={visSales}
                  account={account}
                  onSave={saveProduct}
                  onSell={(id) => {
                    setEditingSale(null);
                    setPresetId(id);
                    setTab("sale");
                  }}
                />}
              {tab === "chart" && <ChartView sales={visSales} expenses={visExpenses} />}
              {saveError && (
                <div className="text-xs text-center mt-3" style={{ color: C.bad }}>
                  Server bilan bog'lanishda xatolik. Environment o'zgaruvchilarni (Upstash Redis) tekshiring.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0" style={{ background: C.paper, borderTop: `1px solid ${C.border}`, boxShadow: "0 -2px 8px rgba(42,32,24,0.06)" }}>
        <div className="flex mx-auto" style={{ maxWidth: 480 }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  if (t.key === "sale") setEditingSale(null);
                  setPresetId("");
                  setTab(t.key);
                }}
                className="flex-1 flex flex-col items-center py-2.5"
              >
                <Icon size={20} color={active ? C.primary : C.inkMuted} />
                <span className="text-[10px] mt-0.5" style={{ color: active ? C.primary : C.inkMuted, fontWeight: active ? 700 : 500 }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

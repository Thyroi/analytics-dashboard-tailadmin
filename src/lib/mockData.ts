// Datos "quemados": series diarias por tagPath
export type SeriesDict = Record<string, Record<string, number>>;

/** ---------- Configuración del mock ---------- */
const START = "2025-05-01";
const END   = "2025-08-31";

/** 10 tags con ≥4 subtags cada uno */
const TAG_SPECS: Array<{ id: string; subtags: string[] }> = [
  { id: "playa",        subtags: ["limpieza", "ubicacion", "chiringuitos", "accesos", "banderaAzul"] },
  { id: "museos",       subtags: ["horarios", "precios", "entradas", "exposiciones", "ubicacion"] },
  { id: "gastronomia",  subtags: ["tapas", "restaurantes", "reservas", "precios", "horarios"] },
  { id: "alojamiento",  subtags: ["hoteles", "apartamentos", "disponibilidad", "precios", "resenas"] },
  { id: "transporte",   subtags: ["autobuses", "trenes", "taxis", "aparcamiento", "tarifas"] },
  { id: "eventos",      subtags: ["conciertos", "festivales", "ferias", "horarios", "entradas"] },
  { id: "naturaleza",   subtags: ["rutas", "parques", "senderismo", "fauna", "miradores"] },
  { id: "compras",      subtags: ["centros", "mercados", "horarios", "souvenirs", "precios"] },
  { id: "deportes",     subtags: ["surf", "ciclismo", "running", "futbol", "baloncesto"] },
  { id: "seguridad",    subtags: ["policia", "hospitales", "farmacias", "emergencias", "recomendaciones"] },
];

/** ---------- Utilidades deterministas (PRNG) ---------- */
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function dateRangeDays(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const d0 = new Date(startISO + "T00:00:00Z");
  const d1 = new Date(endISO   + "T00:00:00Z");
  for (let d = new Date(d0); d <= d1; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
  }
  return out;
}

/** ---------- Generación de las series ---------- */
function buildMockSeries(): SeriesDict {
  const dates = dateRangeDays(START, END);
  const series: SeriesDict = {};

  for (const { id: tag, subtags } of TAG_SPECS) {
    // Semilla por tag para patrones estables
    const rndTag = mulberry32(hashStr(tag));
    // Media y amplitud base por tag (estables pero distintas)
    const baseMean = Math.round(90 + rndTag() * 110);   // 90–200
    const amplitude = 0.35 + rndTag() * 0.35;           // 0.35–0.70
    const phase = rndTag() * Math.PI * 2;

    // Pesos por subtag que suman ~1 (normalizados)
    const rawW = subtags.map((s) => 0.6 + mulberry32(hashStr(tag + "." + s))() * 1.4);
    const sumW = rawW.reduce((a, b) => a + b, 0);
    const weights = rawW.map((w) => w / sumW);

    // Inicializar contenedores
    series[tag] = {};
    for (const s of subtags) series[`${tag}.${s}`] = {};

    // Para cada día: señal estacional + ruido leve
    dates.forEach((date, idx) => {
      const season = Math.sin((idx / 18) + phase); // ciclo ~36 días
      const dayOfWeek = new Date(date + "T00:00:00Z").getUTCDay(); // 0..6
      const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.12 : 1.0;

      // nivel total del tag para ese día
      const noise = (rndTag() - 0.5) * 0.2; // ±10%
      let total = baseMean * (1 + amplitude * season) * weekendBoost * (1 + noise);
      if (total < 0) total = 0;

      // repartir entre subtags según pesos (más un poquito de ruido)
      let sumSub = 0;
      const parts: number[] = [];
      for (let i = 0; i < subtags.length; i++) {
        const r = mulberry32(hashStr(`${tag}.${subtags[i]}:${date}`))();
        const jitter = 0.85 + r * 0.3; // 0.85–1.15
        const val = Math.max(0, Math.round(total * weights[i] * jitter));
        parts.push(val);
        sumSub += val;
      }

      // guardar subtags
      subtags.forEach((s, i) => {
        series[`${tag}.${s}`][date] = parts[i];
      });

      // el nivel del tag = suma de subtags (consistente)
      series[tag][date] = sumSub;
    });
  }
  return series;
}

/** ---------- Export: SERIES quemado ---------- */
export const SERIES: SeriesDict = buildMockSeries();

/** Sugerencia:
 *  - START/END controlan el rango (día/semana/mes OK).
 *  - TAG_SPECS te permite añadir/quitar tags o subtags rápido.
 *  - Las series son deterministas (misma salida en cada build).
 */

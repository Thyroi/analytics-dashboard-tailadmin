import { SERIES } from "../mockData";
import { Granularity, parse, listDays, bucket } from "./utils";

export type TagCountItem = { tagPath: string; label: string; count: number };
export type TrendPoint = { date: string; value: number };

export type TagsArgs = {
  projectId: string;
  tagPath?: string | null;
  start?: string; end?: string;
};

export type TrendArgs = {
  projectId: string;
  tagPath: string;
  start?: string; end?: string;
  granularity?: Granularity;
};

function sumRange(dict: Record<string, number>, start?: string, end?: string): number {
  const keys = Object.keys(dict);
  if (!start && !end) return keys.reduce((a,k)=>a+(dict[k]||0),0);
  const s = start ? parse(start) : undefined;
  const e = end ? parse(end) : undefined;
  return keys.reduce((a,k)=>{
    const d = parse(k);
    if (s && d < s) return a;
    if (e && d > e) return a;
    return a + (dict[k] || 0);
  },0);
}

export async function tags({ projectId, tagPath, start, end }: TagsArgs): Promise<TagCountItem[]> {
  void projectId; // fijo
  const prefix = tagPath ? tagPath + "." : "";
  const topLevel = !tagPath;
  const agg = new Map<string, number>();

  Object.entries(SERIES).forEach(([path, series]) => {
    if (topLevel && path.includes(".")) return; // sólo primer nivel
    if (!topLevel && !path.startsWith(prefix)) return;
    if (!topLevel && path === tagPath) return; // no incluir el propio nodo
    const rest = topLevel ? path : path.slice(prefix.length);
    const seg = rest.split(".")[0];
    const childPath = topLevel ? seg : `${tagPath}.${seg}`;
    agg.set(childPath, (agg.get(childPath) ?? 0) + sumRange(series, start, end));
  });

  const items = [...agg.entries()]
    .map(([p, c]) => ({ tagPath: p, label: p.split(".").pop() || p, count: c }))
    .sort((a,b)=>b.count-a.count);

  return Promise.resolve(items);
}

export async function trend({ projectId, tagPath, start, end, granularity="day" }: TrendArgs): Promise<TrendPoint[]> {
  void projectId;
  const series = SERIES[tagPath] ?? {};
  const s = start ? parse(start) : parse(Object.keys(series)[0] ?? "2025-08-01");
  const e = end ? parse(end) : new Date();
  const days = listDays(s, e);
  const base = days.map(d => ({ date: d, value: series[d] ?? 0 }));

  if (granularity === "day") return base;

  const buckets = new Map<string, number>();
  base.forEach(p => {
    const key = bucket(parse(p.date), granularity);
    buckets.set(key, (buckets.get(key) ?? 0) + p.value);
  });
  return [...buckets.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>({date,value}));
}

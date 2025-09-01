"use client";

import Header from "@/components/common/Header";
import type { Granularity } from "@/features/chatbot/types/tags";
import { useChildrenOf, useSearchByToken } from "@/hooks/useTags";
import {
  childrenFromOutput,
  flatRows,
  type TagRow,
} from "@/lib/chatbot/tagTree";
import * as React from "react";

// helpers de fechas por granularidad
function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return { y, m, day };
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return { y, m, day };
}
function defaultStartByGranularity(g: Granularity) {
  if (g === "d") {
    const { y, m, day } = daysAgo(60);
    return `${y}${m}${day}`; // yyyymmdd
  }
  if (g === "w") {
    const base = daysAgo(80);
    const date = new Date(`${base.y}-${base.m}-${base.day}T00:00:00`);
    const tmp = new Date(date.getTime());
    tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
    const week1 = new Date(tmp.getFullYear(), 0, 4);
    const week =
      1 +
      Math.round(
        ((tmp.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7
      );
    return `${tmp.getFullYear()}/${String(week).padStart(2, "0")}`;
  }
  if (g === "m") {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}/${m}`;
  }
  const y = new Date().getFullYear() - 3;
  return String(y);
}
function placeholderByGranularity(g: Granularity) {
  if (g === "d") return "yyyymmdd";
  if (g === "w") return "yyyy/ww";
  if (g === "m") return "yyyy/mm";
  return "yyyy";
}
function getErrorMessage(e: unknown): string {
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  if (
    e &&
    typeof e === "object" &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
  )
    return String((e as { message: string }).message);
  return "Unknown error";
}

export default function TestTagsPage() {
  const [granularity, setGranularity] = React.useState<Granularity>("d");
  const [startTime, setStartTime] = React.useState<string>(
    defaultStartByGranularity("d")
  );
  const [endTime, setEndTime] = React.useState<string>(() => {
    const { y, m, day } = today();
    return `${y}${m}${day}`;
  });

  // Navegación por prefijo (drill-down)
  const [prefix, setPrefix] = React.useState<string>("root");

  // Búsqueda transversal
  const [token, setToken] = React.useState<string>("");

  React.useEffect(() => {
    setStartTime(defaultStartByGranularity(granularity));
    if (granularity === "d") {
      const { y, m, day } = today();
      setEndTime(`${y}${m}${day}`);
    } else {
      setEndTime("");
    }
  }, [granularity]);

  const queryBase = {
    granularity,
    startTime: startTime || undefined,
    endTime: endTime || undefined,
  };

  const {
    data: childrenData,
    loading: loadingChildren,
    error: errChildren,
  } = useChildrenOf(prefix, queryBase);

  const { data: searchData, loading: loadingSearch } = useSearchByToken(
    token || null,
    queryBase
  );

  const childItems: TagRow[] = React.useMemo(() => {
    if (!childrenData?.output) return [];
    return childrenFromOutput(prefix, childrenData.output);
  }, [childrenData, prefix]);

  const transversalRows: TagRow[] = React.useMemo(() => {
    if (!searchData?.output) return [];
    return flatRows(searchData.output);
  }, [searchData]);

  const breadcrumb = React.useMemo(() => {
    const parts = prefix.split(".").filter(Boolean);
    const res: { label: string; value: string }[] = [];
    for (let i = 0; i < parts.length; i++) {
      const slice = parts.slice(0, i + 1).join(".");
      res.push({ label: parts[i] as string, value: slice });
    }
    return res;
  }, [prefix]);

  return (
    <main className="p-6 space-y-6">
      <Header
        title="Test de Tags (MindsAIC)"
        subtitle="Explora el árbol real y la búsqueda transversal"
      />

      {/* Controles */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Granularity</label>
          <select
            className="rounded border px-3 py-2"
            value={granularity}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setGranularity(e.target.value as Granularity)
            }
          >
            <option value="d">Daily (d)</option>
            <option value="w">Weekly (w)</option>
            <option value="m">Monthly (m)</option>
            <option value="y">Yearly (y)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Formato fechas: {placeholderByGranularity(granularity)}
          </p>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Start time</label>
          <input
            className="rounded border px-3 py-2"
            placeholder={placeholderByGranularity(granularity)}
            value={startTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setStartTime(e.target.value)
            }
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">
            End time (opcional)
          </label>
          <input
            className="rounded border px-3 py-2"
            placeholder={placeholderByGranularity(granularity)}
            value={endTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEndTime(e.target.value)
            }
          />
          <p className="text-xs text-gray-500 mt-1">
            Si hay startTime y no hay endTime, el server asume hoy.
          </p>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">
            Búsqueda transversal (segmento)
          </label>
          <input
            className="rounded border px-3 py-2"
            placeholder="playas, limpieza, banderas..."
            value={token}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setToken(e.target.value)
            }
          />
          <p className="text-xs text-gray-500 mt-1">
            Usa patrón: root.*.token.*
          </p>
        </div>
      </section>

      {/* Breadcrumb + Drill-down */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          {breadcrumb.map((b, i) => (
            <button
              key={b.value}
              className="text-blue-600 hover:underline"
              onClick={() => setPrefix(b.value)}
            >
              {b.label}
              {i < breadcrumb.length - 1 ? " /" : ""}
            </button>
          ))}
          {prefix !== "root" && (
            <button
              className="ml-2 text-xs px-2 py-1 rounded border"
              onClick={() => setPrefix("root")}
            >
              Reset a root
            </button>
          )}
        </div>

        <div className="rounded border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Hijos de: {prefix}</h2>
            {loadingChildren && (
              <span className="text-xs text-gray-500">Cargando…</span>
            )}
          </div>

          {!!errChildren && (
            <p className="text-red-600 text-sm">
              Error: {getErrorMessage(errChildren)}
            </p>
          )}

          {!loadingChildren && childItems.length === 0 && (
            <p className="text-sm text-gray-500">
              No hay datos para este nivel.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {childItems.map((c: TagRow) => (
              <button
                key={c.key}
                onClick={() => setPrefix(c.key)}
                className="text-left rounded-lg border p-3 hover:shadow-sm transition"
              >
                <div className="text-sm text-gray-500">{c.key}</div>
                <div className="mt-1 text-lg font-semibold">{c.name}</div>
                <div className="mt-2 text-xs">
                  Total en rango: <strong>{c.total}</strong>
                </div>
                <div className="text-xs">
                  Último valor: <strong>{c.latest}</strong>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Transversal */}
      <section className="rounded border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Búsqueda transversal</h2>
          {loadingSearch && token && (
            <span className="text-xs text-gray-500">Buscando “{token}”…</span>
          )}
        </div>

        {token && transversalRows.length === 0 && !loadingSearch && (
          <p className="text-sm text-gray-500">
            Sin resultados para “{token}”.
          </p>
        )}

        {transversalRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Ruta</th>
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Último</th>
                </tr>
              </thead>
              <tbody>
                {transversalRows.map((r: TagRow) => (
                  <tr key={r.key} className="border-b last:border-b-0">
                    <td className="py-2 pr-4">{r.key}</td>
                    <td className="py-2 pr-4">{r.name}</td>
                    <td className="py-2 pr-4">{r.total}</td>
                    <td className="py-2 pr-4">{r.latest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-gray-500">
        Nota: esta página es solo de prueba; no usa mockData y todas las
        consultas van contra la API real mediante el proxy interno.
      </p>
    </main>
  );
}

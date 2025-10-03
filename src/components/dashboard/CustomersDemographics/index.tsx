"use client";

import Header from "@/components/common/Header";
import CityListSkeleton from "@/components/skeletons/CityListSkeleton";
import { MapPinned } from "lucide-react";
import { Fragment } from "react";
import CityRow from "./CityRow";
import CountryRow from "./CountryRow";
import MapPanel from "./MapPanel";
import RegionRow from "./RegionRow";
import type { CustomersDemographicsProps } from "./types";

const isUnknown = (s?: string | null) =>
  !!s && /\b(not set|unknown)\b/i.test(s ?? "");

export default function CustomersDemographics({
  title = "Demografía de clientes",
  markers,
  countries,
  mapHeight = 260,
  onToggleCountry,
  onToggleRegion,
  className = "card",
}: CustomersDemographicsProps) {
  return (
    <div className={className}>
      <div className="card-header">
        <Header title={title} Icon={MapPinned} titleSize="xs" />
      </div>

      <div className="card-body">
        <MapPanel markers={markers} height={mapHeight} />

        <div className="space-y-4">
          {countries.map((country) => {
            const countryDisabled = !country.code || isUnknown(country.name);
            const rowKey =
              country.code ?? `unknown:${country.name ?? "unknown"}`;

            return (
              <Fragment key={rowKey}>
                <CountryRow
                  code={country.code ?? ""}
                  name={country.name}
                  users={country.users}
                  pctNum={country.pctNum}
                  pctLabel={country.pctLabel}
                  isOpen={country.isOpen}
                  disabled={countryDisabled}
                  onToggle={() => {
                    if (!countryDisabled) onToggleCountry(country.code ?? "");
                  }}
                />

                {/* ⬇️ Solo mostramos hijos si está abierto Y NO está deshabilitado */}
                {country.isOpen && !countryDisabled && (
                  <div id={`regions-${country.code}`} className="ml-6 mr-2 mb-2">
                    {country.regionsLoading ? (
                      <CityListSkeleton rows={4} className="py-1" />
                    ) : country.regionsError ? (
                      <div className="text-xs text-red-500 py-2">
                        {country.regionsError}
                      </div>
                    ) : (country.regions?.length ?? 0) === 0 ? (
                      <div className="text-xs text-gray-400 py-2">
                        Sin datos de regiones
                      </div>
                    ) : (
                      <div className="divide-y divide-white dark:divide-white/10">
                        {country.regions!.map((r) => {
                          const regionDisabled = isUnknown(r.name);
                          return (
                            <Fragment key={`${rowKey}-${r.name}`}>
                              <RegionRow
                                region={r.name}
                                users={r.users}
                                pctNum={r.pctNum}
                                pctLabel={r.pctLabel}
                                isOpen={r.isOpen}
                                disabled={regionDisabled}
                                onToggle={() => {
                                  if (!regionDisabled)
                                    onToggleRegion(country.code ?? "", r.name);
                                }}
                              />

                              {/* idem: hijos sólo si abierto y NO deshabilitado */}
                              {r.isOpen && !regionDisabled && (
                                <div
                                  id={`cities-${country.code}-${r.name}`}
                                  className="ml-6 mr-2 mb-2"
                                >
                                  {r.citiesLoading ? (
                                    <CityListSkeleton rows={4} className="py-1" />
                                  ) : r.citiesError ? (
                                    <div className="text-[11px] text-red-500 py-1">
                                      {r.citiesError}
                                    </div>
                                  ) : (r.cities?.length ?? 0) === 0 ? (
                                    <div className="text-[11px] text-gray-400 py-1">
                                      Sin datos de ciudades
                                    </div>
                                  ) : (
                                    <div className="divide-y divide-white dark:divide-white/10">
                                      {r.cities!.map((c) => (
                                        <CityRow
                                          key={`${rowKey}-${r.name}-${c.name}`}
                                          city={c.name}
                                          users={c.users}
                                          pctNum={c.pctNum}
                                          pctLabel={c.pctLabel}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Fragment>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

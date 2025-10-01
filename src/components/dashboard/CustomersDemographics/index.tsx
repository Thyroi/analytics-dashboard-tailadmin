"use client";

import { Fragment } from "react";
import CityRow from "./CityRow";
import CountryRow from "./CountryRow";
import MapPanel from "./MapPanel";
import RegionRow from "./RegionRow";
import type { CustomersDemographicsProps } from "./types";

export default function CustomersDemographics({
  title = "Demografía de clientes",
  subtitle = "Número de usuarios por país",
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
        <div>
          <h3 className="card-title">{title}</h3>
          <p className="card-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="card-body">
        <MapPanel markers={markers} height={mapHeight} />

        <div className="space-y-4">
          {countries.map((country) => (
            <Fragment key={country.code}>
              <CountryRow
                code={country.code}
                name={country.name}
                users={country.users}
                pctNum={country.pctNum}
                pctLabel={country.pctLabel}
                isOpen={country.isOpen}
                onToggle={() => onToggleCountry(country.code)}
              />

              {country.isOpen && (
                <div id={`regions-${country.code}`} className="ml-6 mr-2 mb-2">
                  {country.regionsLoading ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400 py-2">
                      Cargando regiones…
                    </div>
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
                      {country.regions!.map((r) => (
                        <Fragment key={`${country.code}-${r.name}`}>
                          <RegionRow
                            region={r.name}
                            users={r.users}
                            pctNum={r.pctNum}
                            pctLabel={r.pctLabel}
                            isOpen={r.isOpen}
                            onToggle={() =>
                              onToggleRegion(country.code, r.name)
                            }
                          />

                          {r.isOpen && (
                            <div
                              id={`cities-${country.code}-${r.name}`}
                              className="ml-6 mr-2 mb-2"
                            >
                              {r.citiesLoading ? (
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 py-1">
                                  Cargando ciudades…
                                </div>
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
                                      key={`${country.code}-${r.name}-${c.name}`}
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
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

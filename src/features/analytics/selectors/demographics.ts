import type { CitiesPayload } from "@/app/api/analytics/v1/header/countries/[country]/regions/[region]/cities/route";
import type { RegionsPayload } from "@/app/api/analytics/v1/header/countries/[country]/regions/route";
import type { CountriesPayload } from "@/app/api/analytics/v1/header/countries/route";
import type { MapMarker } from "@/components/charts/WorldBubbleMap";
import type {
  CityView,
  CountryView,
  RegionView,
} from "@/components/dashboard/CustomersDemographics/types";

/** Trunca a 1 decimal sin redondear (4.19 -> 4.1) */
export function trunc1(value: number): number {
  return Math.floor((value + 1e-8) * 10) / 10;
}
/** % truncado a 1 decimal + etiqueta "x.x" */
export function pct1(n: number, d: number): { n: number; s: string } {
  if (!d || d <= 0) return { n: 0, s: "0.0" };
  const p = trunc1((n / d) * 100);
  return { n: p, s: p.toFixed(1) };
}

/** Countries -> marcadores del mapa */
export function selectMapMarkers(
  data: CountriesPayload | null,
  centroids: Record<string, { lat: number; lng: number }>
): MapMarker[] {
  if (!data) return [];
  return data.rows.reduce<MapMarker[]>((acc, r) => {
    // code puede ser null para Unknown/(not set) → no ponemos marcador
    if (!r.code) return acc;
    const c = centroids[r.code];
    if (!c) return acc;
    acc.push({
      id: r.code,
      lat: c.lat,
      lng: c.lng,
      color: "#465FFF",
      size: Math.max(4, Math.min(10, Math.sqrt(r.customers))),
    });
    return acc;
  }, []);
}

/** Construye el árbol presentacional Country→Regions→Cities */
export function selectCountriesView(args: {
  countriesData: CountriesPayload | null;
  regionsData: RegionsPayload | null;
  citiesData: CitiesPayload | null;
  expandedCountry: string | null;
  expandedRegion: string | null;
}): CountryView[] {
  const {
    countriesData,
    regionsData,
    citiesData,
    expandedCountry,
    expandedRegion,
  } = args;
  if (!countriesData) return [];

  const totalCountry = countriesData.total;

  // Top 6 países
  const top = [...countriesData.rows]
    .sort((a, b) => b.customers - a.customers)
    .slice(0, 6);

  return top.map<CountryView>((c) => {
    // Normalizamos code a string para cuadrar con CountryView
    // "" indica "Unknown/(not set)" y además lo hace fácil de marcar como disabled desde el componente
    const code = c.code ?? "";
    const openCountry = code !== "" && expandedCountry === code;
    const pCountry = pct1(c.customers, totalCountry);

    let regions: RegionView[] | undefined;
    let regionsLoading = false;
    let regionsError: string | null = null;

    if (openCountry) {
      const rt = regionsData?.total ?? 0;
      // Nota: si tu hook usa undefined cuando está deshabilitado, puedes ajustar este flag
      regionsLoading = regionsData === null;
      regionsError = null;

      if (regionsData && rt >= 0) {
        regions = regionsData.rows.map<RegionView>((r) => {
          const openRegion = expandedRegion === r.region;
          const pRegion = pct1(r.customers, rt);

          let cities: CityView[] | undefined;
          let citiesLoading = false;
          let citiesError: string | null = null;

          if (openRegion) {
            const ct = citiesData?.total ?? 0;
            citiesLoading = citiesData === null;
            citiesError = null;

            if (citiesData && ct >= 0) {
              cities = citiesData.rows.map<CityView>((ci) => {
                const pCity = pct1(ci.customers, ct);
                return {
                  name: ci.city,
                  users: ci.customers,
                  pctNum: pCity.n,
                  pctLabel: pCity.s,
                };
              });
            }
          }

          return {
            name: r.region,
            users: r.customers,
            pctNum: pRegion.n,
            pctLabel: pRegion.s,
            isOpen: openRegion,
            citiesLoading,
            citiesError,
            cities,
          };
        });
      }
    }

    return {
      code, // ← siempre string ("" para Unknown)
      name: c.country,
      users: c.customers,
      pctNum: pCountry.n,
      pctLabel: pCountry.s,
      isOpen: openCountry,
      regionsLoading,
      regionsError,
      regions,
    };
  });
}

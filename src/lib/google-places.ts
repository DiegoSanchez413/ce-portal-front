type AddressComponent = { long_name: string; short_name: string; types: string[] };
type Autocomplete = { addListener: (event: "place_changed", handler: () => void) => void; getPlace: () => { address_components?: AddressComponent[] } };
type Places = { Autocomplete: new (input: HTMLInputElement, options: object) => Autocomplete };

export type PlaceAddress = { street: string; unit: string; city: string; state: string; zip: string };

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
let loading: Promise<Places | null> | null = null;
const attached = new WeakSet<HTMLInputElement>();

// Carga una sola vez la librería Places de Google; sin clave o si falla devuelve null y el campo queda manual.
export function loadPlaces(): Promise<Places | null> {
  if (!KEY || typeof window === "undefined") return Promise.resolve(null);
  loading ??= new Promise((resolve) => {
    const callback = "__cpPlacesReady";
    const w = window as unknown as Record<string, unknown> & { google?: { maps?: { places?: Places } } };
    w[callback] = () => resolve(w.google?.maps?.places ?? null);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&libraries=places&loading=async&callback=${callback}`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      resolve(null);
    };
    document.head.appendChild(script);
    // La lista de sugerencias queda sobre los modales y se puede tocar aunque el modal bloquee el fondo.
    const style = document.createElement("style");
    style.textContent = ".pac-container{z-index:60;pointer-events:auto;border-radius:10px;font-family:inherit}";
    document.head.appendChild(style);
  });
  return loading;
}

// Sugerencias de direcciones de EE. UU. sobre el input; al elegir una devuelve calle, unidad, ciudad, estado y ZIP.
export async function attachAutocomplete(input: HTMLInputElement, onPlace: (address: PlaceAddress) => void): Promise<boolean> {
  const places = await loadPlaces();
  if (!places || attached.has(input)) return Boolean(places);
  attached.add(input);
  const autocomplete = new places.Autocomplete(input, { componentRestrictions: { country: "us" }, fields: ["address_components"], types: ["address"] });
  autocomplete.addListener("place_changed", () => {
    const parts = autocomplete.getPlace().address_components ?? [];
    const get = (type: string, short = false) => {
      const part = parts.find((p) => p.types.includes(type));
      return part ? (short ? part.short_name : part.long_name) : "";
    };
    onPlace({
      street: [get("street_number"), get("route")].filter(Boolean).join(" "),
      unit: get("subpremise"),
      city: get("locality") || get("sublocality") || get("postal_town"),
      state: get("administrative_area_level_1", true),
      zip: get("postal_code"),
    });
  });
  return true;
}

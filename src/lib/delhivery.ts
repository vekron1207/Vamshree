import "server-only";

// Delhivery's API, called from the server only: the key never reaches the browser.
const BASE = "https://track.delhivery.com";

function headers() {
  const key = process.env.DELHIVERY_API_KEY;
  return key ? { Authorization: `Token ${key}`, Accept: "application/json" } : null;
}

export const delhiveryConfigured = () => Boolean(process.env.DELHIVERY_API_KEY);

type Cached<T> = { at: number; value: T };
const pinCache = new Map<string, Cached<PincodeResult>>();
const trackCache = new Map<string, Cached<TrackingResult>>();
const PIN_TTL = 6 * 60 * 60 * 1000;
const TRACK_TTL = 5 * 60 * 1000;

async function getJson(url: string): Promise<unknown> {
  const h = headers();
  if (!h) throw new Error("Delhivery is not configured");
  const res = await fetch(url, { headers: h, cache: "no-store", signal: AbortSignal.timeout(8000) });
  // Tracking answers 4xx with a JSON body for unknown waybills; let the caller read it
  if (!res.ok && res.status >= 500) throw new Error(`Delhivery ${res.status}`);
  return res.json();
}

export type PincodeResult =
  | { status: "serviceable"; city?: string; state?: string }
  | { status: "unserviceable" }
  // Delhivery couldn't be reached: never block a sale because of that
  | { status: "unknown" };

export async function checkPincode(pin: string): Promise<PincodeResult> {
  if (!/^[1-9]\d{5}$/.test(pin) || !delhiveryConfigured()) return { status: "unknown" };
  const hit = pinCache.get(pin);
  if (hit && Date.now() - hit.at < PIN_TTL) return hit.value;
  try {
    const data = (await getJson(`${BASE}/c/api/pin-codes/json/?filter_codes=${pin}`)) as {
      delivery_codes?: { postal_code?: { pre_paid?: string; district?: string; state_code?: string } }[];
    };
    const entry = data.delivery_codes?.[0]?.postal_code;
    const value: PincodeResult =
      entry && entry.pre_paid === "Y"
        ? { status: "serviceable", city: entry.district }
        : { status: "unserviceable" };
    pinCache.set(pin, { at: Date.now(), value });
    return value;
  } catch (err) {
    console.error("Delhivery pincode check failed:", err);
    return { status: "unknown" };
  }
}

export type TrackingResult =
  | {
      ok: true;
      status: string;
      location: string;
      updatedAt: string | null;
      expectedDelivery: string | null;
      events: { status: string; location: string; at: string | null }[];
    }
  | { ok: false };

export function isDelhivery(courier: string | null | undefined) {
  return /delhivery/i.test(courier ?? "");
}

export async function trackShipment(waybill: string): Promise<TrackingResult> {
  const awb = waybill.trim();
  if (!/^[\w-]{6,30}$/.test(awb) || !delhiveryConfigured()) return { ok: false };
  const hit = trackCache.get(awb);
  if (hit && Date.now() - hit.at < TRACK_TTL) return hit.value;
  try {
    const data = (await getJson(`${BASE}/api/v1/packages/json/?waybill=${encodeURIComponent(awb)}`)) as {
      ShipmentData?: {
        Shipment?: {
          Status?: { Status?: string; StatusLocation?: string; StatusDateTime?: string };
          ExpectedDeliveryDate?: string | null;
          Scans?: { ScanDetail?: { Scan?: string; ScannedLocation?: string; ScanDateTime?: string } }[];
        };
      }[];
    };
    const shipment = data.ShipmentData?.[0]?.Shipment;
    if (!shipment?.Status?.Status) {
      const value: TrackingResult = { ok: false };
      trackCache.set(awb, { at: Date.now(), value });
      return value;
    }
    const events = (shipment.Scans ?? [])
      .map((s) => s.ScanDetail)
      .filter((s): s is NonNullable<typeof s> => Boolean(s?.Scan))
      .map((s) => ({ status: s.Scan ?? "", location: s.ScannedLocation ?? "", at: s.ScanDateTime ?? null }))
      .reverse()
      .slice(0, 8);
    const value: TrackingResult = {
      ok: true,
      status: shipment.Status.Status,
      location: shipment.Status.StatusLocation ?? "",
      updatedAt: shipment.Status.StatusDateTime ?? null,
      expectedDelivery: shipment.ExpectedDeliveryDate ?? null,
      events,
    };
    trackCache.set(awb, { at: Date.now(), value });
    return value;
  } catch (err) {
    console.error("Delhivery tracking failed:", err);
    return { ok: false };
  }
}

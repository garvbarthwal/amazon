// Recurrence config for replenishable staples.
// Keys are *substrings* matched (case-insensitive) against
// product.id + name + brand + tags to decide if a product is recurring,
// and how many days between repeat purchases.
//
// Production schema would put `recurring: boolean` and
// `defaultIntervalDays: int` on Product directly. This client-side map
// is the prototype substitute.
export const RECURRING_CONFIG: Array<{ keys: string[]; days: number }> = [
  { keys: ["milk"], days: 2 },
  { keys: ["bisleri", "mineral water", "packaged drinking water"], days: 2 },
  { keys: ["bread"], days: 3 },
  { keys: ["badam", "kool badam", "amul kool"], days: 3 },
  { keys: ["egg"], days: 4 },
  { keys: ["maggi", "noodle"], days: 5 },
  { keys: ["butter"], days: 7 },
  { keys: ["corn flakes", "cornflakes", "kellogg"], days: 10 },
];

export type RecurrenceMatch = { intervalDays: number };

export function recurrenceFor(p: {
  id?: string;
  name?: string;
  brand?: string;
  tags?: string[] | null;
}): RecurrenceMatch | null {
  const hay = (
    (p.id ?? "") + " " + (p.name ?? "") + " " + (p.brand ?? "") + " " + (p.tags ?? []).join(" ")
  ).toLowerCase();
  for (const r of RECURRING_CONFIG) {
    for (const k of r.keys) {
      if (hay.includes(k)) return { intervalDays: r.days };
    }
  }
  return null;
}

export const isRecurring = (p: {
  id?: string;
  name?: string;
  brand?: string;
  tags?: string[] | null;
}): boolean => recurrenceFor(p) !== null;

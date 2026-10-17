"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  /** Size/variant, for products sold in sizes */
  variantId?: string | null;
  variantLabel?: string | null;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
};

export const cartKey = (i: { productId: string; variantId?: string | null }) =>
  `${i.productId}:${i.variantId ?? ""}`;

const STORAGE_KEY = "vaamshri_cart";
const EMPTY_CART: CartItem[] = [];

let cachedItems: CartItem[] = EMPTY_CART;
let cachedRaw: string | null = null;
const listeners = new Set<() => void>();

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedItems;
    cachedRaw = raw;
    cachedItems = raw ? JSON.parse(raw) : EMPTY_CART;
  } catch {
    cachedItems = EMPTY_CART;
  }
  return cachedItems;
}

function writeStorage(items: CartItem[]) {
  cachedItems = items;
  try {
    cachedRaw = JSON.stringify(items);
    localStorage.setItem(STORAGE_KEY, cachedRaw);
  } catch {
    // storage unavailable (private mode, etc.) - in-memory state still updates
  }
  listeners.forEach((listener) => listener());
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getServerSnapshot() {
  return EMPTY_CART;
}

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  syncPrices: (quote: { productId: string; variantId?: string | null; price: number | null; available: boolean }[]) => void;
  subtotal: number;
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, readStorage, getServerSnapshot);

  const addItem = useCallback<CartContextValue["addItem"]>(
    (item, quantity = 1) => {
      const current = readStorage();
      const key = cartKey(item);
      const existing = current.find((i) => cartKey(i) === key);
      const next = existing
        ? current.map((i) =>
            cartKey(i) === key
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        : [...current, { ...item, quantity }];
      writeStorage(next);
    },
    []
  );

  const removeItem = useCallback((key: string) => {
    writeStorage(readStorage().filter((i) => cartKey(i) !== key));
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    const current = readStorage();
    writeStorage(
      quantity <= 0
        ? current.filter((i) => cartKey(i) !== key)
        : current.map((i) => (cartKey(i) === key ? { ...i, quantity } : i))
    );
  }, []);

  const clear = useCallback(() => writeStorage(EMPTY_CART), []);

  const syncPrices = useCallback<CartContextValue["syncPrices"]>((quote) => {
    const byId = new Map(quote.map((q) => [cartKey(q), q]));
    const current = readStorage();
    let changed = false;
    const next = current.flatMap((item) => {
      const q = byId.get(cartKey(item));
      if (!q) return [item];
      if (!q.available || q.price === null) {
        changed = true;
        return [];
      }
      if (q.price !== item.price) {
        changed = true;
        return [{ ...item, price: q.price }];
      }
      return [item];
    });
    if (changed) writeStorage(next);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, setQuantity, clear, syncPrices, subtotal, itemCount }),
    [items, addItem, removeItem, setQuantity, clear, syncPrices, subtotal, itemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SHIPPING, type ShippingRule } from "@/lib/shipping";
import { getCheckoutConfig } from "./checkout/actions";

export function useShippingRule() {
  const [rule, setRule] = useState<ShippingRule>(DEFAULT_SHIPPING);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getCheckoutConfig()
      .then((c) => !cancelled && setRule(c.shipping))
      .catch(() => {})
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);
  return { rule, loaded };
}

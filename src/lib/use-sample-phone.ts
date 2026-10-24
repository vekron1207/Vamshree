"use client";

import { useEffect, useState } from "react";

const FALLBACK = "98765 43210";

// A made-up Indian mobile number for a field's placeholder. It starts as a fixed
// value so the server and browser agree, then switches to a random one on screen.
export function useSamplePhone() {
  const [sample, setSample] = useState(FALLBACK);
  useEffect(() => {
    const first = 6 + Math.floor(Math.random() * 4);
    let rest = "";
    for (let i = 0; i < 9; i++) rest += Math.floor(Math.random() * 10);
    const digits = `${first}${rest}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSample(`${digits.slice(0, 5)} ${digits.slice(5)}`);
  }, []);
  return sample;
}

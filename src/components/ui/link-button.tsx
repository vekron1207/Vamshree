"use client";

import NextLink from "next/link";
import Button, { type ButtonProps } from "@mui/material/Button";

// A Material button that is really a link (usable from server components)
export function LinkButton(props: Omit<ButtonProps<typeof NextLink>, "component">) {
  return <Button component={NextLink} {...props} />;
}

import { clsx, type ClassValue } from "clsx"
import { lazy } from "react";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const lazyImport = <P extends object>(
  factory: () => Promise<{ default: React.ComponentType<P> }>
) => lazy(factory);

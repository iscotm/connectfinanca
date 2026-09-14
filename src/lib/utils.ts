import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAppBaseUrl(): string {
  const envUrl = import.meta.env.VITE_SITE_URL || import.meta.env.VITE_APP_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return window.location.origin;
}

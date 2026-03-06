/**
 * Thin Strapi REST API client.
 */

import { config } from "./config.js";

export async function strapiGet<T = unknown>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${config.strapi.url}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Strapi ${path} → ${res.status} ${res.statusText}: ${body}`);
  }

  const json = (await res.json()) as { data?: T } & T;
  return (json as { data?: T }).data ?? (json as T);
}

import { Request } from "express";

type Lang = "en" | "el";

const SUPPORTED: Set<string> = new Set(["en", "el"]);

export function getLang(req: Request): Lang {
  // 1. ?lang= query param
  const qLang = req.query.lang;
  if (typeof qLang === "string" && SUPPORTED.has(qLang)) {
    return qLang as Lang;
  }

  // 2. Accept-Language header — first match of en or el
  const accept = req.headers["accept-language"];
  if (accept) {
    const match = accept.match(/\b(en|el)\b/);
    if (match) {
      return match[1] as Lang;
    }
  }

  // 3. Default
  return "en";
}

/**
 * Project bilingual fields on an object: strips the _en/_el suffix fields
 * that don't match the resolved language and returns clean field names.
 * e.g. { nameEn: "X", nameEl: "Y" } with lang="en" => { name: "X" }
 */
export function projectLang<T extends Record<string, unknown>>(obj: T, lang: Lang): Record<string, unknown> {
  const keep = lang === "en" ? "En" : "El";
  const drop = lang === "en" ? "El" : "En";

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key.endsWith(drop)) {
      // Drop the non-matching language field
      continue;
    }
    if (key.endsWith(keep)) {
      // Rename: strip the suffix
      const cleanKey = key.slice(0, -2);
      result[cleanKey] = value;
    } else {
      result[key] = value;
    }
  }

  return result;
}

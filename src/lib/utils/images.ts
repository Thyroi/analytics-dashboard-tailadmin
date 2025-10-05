import { isStaticImageImport, StaticImageImport } from "@/lib/types";

/**
 * Normaliza cualquier asset a un string con el src.
 * Retorna undefined si no es válido.
 */
export function normalizeImgSrc(asset: unknown): string | undefined {
  if (typeof asset === "string") return asset;
  if (isStaticImageImport(asset)) return (asset as StaticImageImport).src;
  return undefined;
}

type StaticImage = { src: string };

export function getImgSrc(img?: string | StaticImage): string | undefined {
  if (!img) return undefined;
  return typeof img === "string" ? img : img.src;
}

// Type guards para props
export function isWithImage<P extends { imgSrc?: unknown }>(
  p: P
): p is P & { imgSrc: string | StaticImage } {
  return "imgSrc" in p && p.imgSrc != null;
}
export function isWithIcon<P extends { Icon?: unknown }>(
  p: P
): p is P & { Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> } {
  return "Icon" in p && typeof p.Icon === "function";
}

/** Componente SVG como icono (estricto) */
export type SvgIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/** Soporte de media: o icono SVG o imagen estática (Next) */
export type HasIcon = { Icon: SvgIcon; imgSrc?: never };
export type HasImage = { imgSrc: string | { src: string }; Icon?: never };
export type IconOrImage = HasIcon | HasImage;

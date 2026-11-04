import { notFound } from "next/navigation";

// Cualquier ruta que no existe cae aquí para mostrar la 404 del portal en su idioma.
export default function CatchAllPage() {
  notFound();
}

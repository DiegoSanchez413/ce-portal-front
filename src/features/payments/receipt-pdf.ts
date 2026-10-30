import { jsPDF } from "jspdf";
import { formatMoney } from "@/lib/format";

const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];
const ACCENT: [number, number, number] = [234, 88, 12];
const INK: [number, number, number] = [15, 23, 42];
// Ancho fijo tipo recibo (≈ 400 px); el alto se ajusta al contenido.
const WIDTH = 300;
const MARGIN = 24;
const LOGO = "/creditexperts-logo.png";

export type ReceiptPdfData = {
  title: string;
  brand: string;
  amount: number;
  rows: { label: string; value: string }[];
  contact: string;
  footer: string;
  fileName: string;
};

// jsPDF necesita la imagen como data URL; si no carga, el recibo sale sin logo.
function logoDataUrl(src: string, px: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = px;
      canvas.height = px;
      canvas.getContext("2d")?.drawImage(img, 0, 0, px, px);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Dibuja el recibo y devuelve la altura usada: logo y marca, título, monto, filas y contacto.
function draw(doc: jsPDF, data: ReceiptPdfData, logo: string | null): number {
  const left = MARGIN;
  const right = WIDTH - MARGIN;
  let y = MARGIN + 8;

  const logoSize = 22;
  if (logo) doc.addImage(logo, "PNG", left, y - 16, logoSize, logoSize);
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...ACCENT).text(data.brand, logo ? left + logoSize + 8 : left, y);
  y += 22;
  doc.setDrawColor(...LINE).line(left, y, right, y);
  y += 22;

  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...MUTED).text(data.title, left, y);
  y += 26;
  doc.setFont("helvetica", "bold").setFontSize(26).setTextColor(...INK).text(formatMoney(data.amount), left, y);
  y += 20;
  doc.setDrawColor(...LINE).line(left, y, right, y);
  y += 16;

  for (const row of data.rows) {
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...MUTED).text(row.label, left, y);
    const lines = doc.splitTextToSize(row.value, 150) as string[];
    doc.setTextColor(...INK).text(lines, right, y, { align: "right" });
    y += 16 + (lines.length - 1) * 11;
  }

  y += 4;
  doc.setDrawColor(...LINE).line(left, y, right, y);
  y += 16;
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...MUTED).text(data.contact, left, y);
  y += 12;
  doc.text(data.footer, left, y);

  return y + MARGIN;
}

// Recibo compacto en PDF (ancho fijo, alto al contenido), descargado desde el navegador.
export async function downloadReceiptPdf(data: ReceiptPdfData): Promise<void> {
  const logo = await logoDataUrl(LOGO, 120);
  const height = draw(new jsPDF({ unit: "pt", format: [WIDTH, 2000] }), data, logo);
  const doc = new jsPDF({ unit: "pt", format: [WIDTH, height] });
  draw(doc, data, logo);

  const url = URL.createObjectURL(doc.output("blob"));
  const link = document.createElement("a");
  link.href = url;
  link.download = data.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

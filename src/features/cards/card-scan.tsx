"use client";

import { Camera, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { CardCamera, liveCameraSupported } from "./card-camera";

const MAX_SIDE = 1280;

export type ScannedCard = { cardholdername?: string | null; cardnumber?: string | null; exp_month?: number | null; exp_year?: number | null };

// Foto elegida o tomada con la cámara del teléfono, redimensionada a JPEG en el navegador.
function toJpeg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

// Scan card: abre la cámara (o la del teléfono / una foto), manda la imagen y devuelve los datos leídos.
export function CardScan({
  onStart,
  onResult,
  onError,
  onManual,
}: {
  onStart?: () => void;
  onResult: (card: ScannedCard) => void;
  onError: () => void;
  onManual: () => void;
}) {
  const t = useTranslations("Cards");
  const native = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState(false);
  const [scanning, setScanning] = useState(false);

  const submit = async (image: string) => {
    onStart?.();
    setScanning(true);
    try {
      const { data } = await api.POST("/cards/scan", { body: { image } });
      if (data && (data.cardnumber || data.cardholdername)) onResult(data);
      else onError();
    } catch {
      onError();
    } finally {
      setScanning(false);
    }
  };

  const fromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setCamera(false);
    if (!file) return;
    toJpeg(file).then(submit, onError);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" size="xs" disabled={scanning} onClick={() => (liveCameraSupported() ? setCamera(true) : native.current?.click())}>
        {scanning ? <LoaderCircle className="size-[18px] animate-spin" aria-hidden /> : <Camera className="size-[18px]" aria-hidden />}
        {scanning ? t("scanning") : t("scan")}
      </Button>
      <span className="flex-[1_1_220px] text-xs text-ink-muted">{t("scanHint")}</span>
      <input ref={native} type="file" accept="image/*" capture="environment" hidden onChange={fromFile} />
      <input ref={gallery} type="file" accept="image/*" hidden onChange={fromFile} />
      {camera && (
        <CardCamera
          onCapture={(image) => void submit(image)}
          onGallery={() => gallery.current?.click()}
          onManual={() => {
            setCamera(false);
            onManual();
          }}
          onClose={() => setCamera(false)}
        />
      )}
    </div>
  );
}

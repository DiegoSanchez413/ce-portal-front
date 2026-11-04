"use client";

import { Camera, Check, Image as ImageIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const CARD_RATIO = 85.6 / 53.98;
const MAX_SIDE = 1280;
const MARGIN = 0.06;

export const liveCameraSupported = () =>
  typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && window.isSecureContext;

// Recorta del video el área del marco, con un margen, y la devuelve como JPEG.
function cropFrame(video: HTMLVideoElement, frame: HTMLElement): string {
  const view = video.getBoundingClientRect();
  const box = frame.getBoundingClientRect();
  const scale = Math.min(view.width / video.videoWidth, view.height / video.videoHeight);
  const offsetX = (video.videoWidth * scale - view.width) / 2;
  const offsetY = (video.videoHeight * scale - view.height) / 2;
  const padX = box.width * MARGIN;
  const padY = box.height * MARGIN;
  const sx = Math.max(0, (box.left - view.left - padX + offsetX) / scale);
  const sy = Math.max(0, (box.top - view.top - padY + offsetY) / scale);
  const sw = Math.min(video.videoWidth - sx, (box.width + padX * 2) / scale);
  const sh = Math.min(video.videoHeight - sy, (box.height + padY * 2) / scale);
  const out = Math.min(1, MAX_SIDE / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * out);
  canvas.height = Math.round(sh * out);
  canvas.getContext("2d")?.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

// Cámara trasera en vivo con un marco del tamaño de una tarjeta; sin permiso, ofrece elegir una foto.
export function CardCamera({ onCapture, onGallery, onManual, onClose }: { onCapture: (image: string) => void; onGallery: () => void; onManual: () => void; onClose: () => void }) {
  const t = useTranslations("Cards");
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"starting" | "live" | "denied" | "unavailable">("starting");
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then(async (media) => {
        if (cancelled) return media.getTracks().forEach((track) => track.stop());
        stream.current = media;
        if (video.current) {
          video.current.srcObject = media;
          await video.current.play().catch(() => undefined);
        }
        setStatus("live");
      })
      .catch((e: { name?: string }) => {
        if (!cancelled) setStatus(e?.name === "NotAllowedError" || e?.name === "SecurityError" ? "denied" : "unavailable");
      });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      cancelled = true;
      stream.current?.getTracks().forEach((track) => track.stop());
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const capture = () => {
    if (status !== "live" || !video.current?.videoWidth || !frame.current) return;
    const image = cropFrame(video.current, frame.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    setCaptured(true);
    onCapture(image);
    setTimeout(onClose, 400);
  };

  const blocked = status === "denied" || status === "unavailable";

  return (
    <div role="dialog" aria-modal="true" aria-label={t("cameraTitle")} className="fixed inset-0 z-[70] flex flex-col bg-black text-white">
      <video ref={video} className="absolute inset-0 size-full object-contain" playsInline muted autoPlay />
      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 bg-black/35 px-6">
        <p className="text-center text-base font-bold">{blocked ? "" : t("cameraHint")}</p>
        <div
          ref={frame}
          className="relative w-full max-w-[420px] rounded-2xl border-[3px] border-white/90 shadow-[0_0_0_9999px_color-mix(in_srgb,black_45%,transparent)]"
          style={{ aspectRatio: String(CARD_RATIO) }}
        >
          {captured && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-success-accent">
                <Check className="size-7" strokeWidth={3} aria-hidden />
              </span>
            </span>
          )}
        </div>
        {blocked && (
          <div role="alert" className="flex max-w-sm flex-col items-center gap-3 rounded-2xl bg-white p-5 text-center text-navy">
            <p className="text-sm font-semibold">{t(status === "denied" ? "cameraDenied" : "cameraUnavailable")}</p>
            <Button size="sm" onClick={onGallery}>
              {t("cameraGallery")}
            </Button>
          </div>
        )}
        <button type="button" onClick={onManual} className="min-h-11 rounded-full px-4 text-sm font-extrabold underline">
          {t("cameraManual")}
        </button>
      </div>
      <button type="button" aria-label={t("cameraClose")} onClick={onClose} className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-black/50">
        <X className="size-6" aria-hidden />
      </button>
      <div className="relative flex items-center justify-around bg-black px-6 pt-4 pb-8">
        <button type="button" onClick={onGallery} className="flex min-h-11 flex-col items-center gap-1 text-xs font-bold">
          <ImageIcon className="size-6" aria-hidden />
          {t("cameraGallery")}
        </button>
        <button
          type="button"
          aria-label={t("cameraCapture")}
          disabled={status !== "live"}
          onClick={capture}
          className="flex size-[72px] items-center justify-center rounded-full border-4 border-white disabled:opacity-40"
        >
          <span className="size-[58px] rounded-full bg-white" />
        </button>
        <span className="flex w-14 justify-center">
          <Camera className="size-6 opacity-0" aria-hidden />
        </span>
      </div>
    </div>
  );
}

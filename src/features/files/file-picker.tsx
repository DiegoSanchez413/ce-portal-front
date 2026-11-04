"use client";

import { Camera, FileText, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { InlineMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ACCEPT_ATTR, ACCEPTED_TYPES, checkFiles, MAX_FILE_BYTES, type FileProblem } from "./documents";

// Take a photo / Choose files con miniaturas; descarta lo que no cumple tipo, tamaño o cantidad.
export function FilePicker({
  files,
  onChange,
  max,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  max: number;
}) {
  const t = useTranslations("Files");
  const cameraRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<FileProblem | null>(null);

  const add = (list: FileList | null) => {
    if (!list?.length) return;
    const incoming = Array.from(list);
    const valid = incoming.filter((f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_BYTES);
    const merged = [...files, ...valid];
    const next = merged.slice(0, max);
    setProblem(checkFiles(incoming, Number.POSITIVE_INFINITY) ?? (merged.length > max ? "count" : null));
    onChange(next);
  };

  const remove = (index: number) => {
    setProblem(null);
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5">
        <Button block onClick={() => cameraRef.current?.click()} disabled={files.length >= max}>
          <Camera className="size-5" aria-hidden />
          {t("takePhoto")}
        </Button>
        <Button variant="outline" block onClick={() => pickerRef.current?.click()} disabled={files.length >= max}>
          <Upload className="size-5" aria-hidden />
          {t("chooseFiles")}
        </Button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={pickerRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-3 pt-1" aria-label={t("selectedFiles")}>
          {files.map((file, i) => (
            <Thumb key={`${file.name}-${i}`} file={file} onRemove={() => remove(i)} />
          ))}
        </ul>
      )}
      <span className="text-xs font-semibold text-ink-muted">{t("hint", { max })}</span>
      {problem && <InlineMessage>{t(`problems.${problem}`, { max })}</InlineMessage>}
    </div>
  );
}

function Thumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const t = useTranslations("Files");
  const isImage = file.type.startsWith("image/");
  const url = useMemo(() => (isImage ? URL.createObjectURL(file) : null), [file, isImage]);

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  return (
    <li className="relative flex size-[72px] items-center justify-center rounded-xl border border-line bg-gradient-to-br from-line to-line-cool">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="size-full rounded-xl object-cover" />
      ) : (
        <span className="flex flex-col items-center gap-1 px-1 text-center text-[10px] font-extrabold text-ink-muted">
          <FileText className="size-5" aria-hidden />
          <span className="line-clamp-1 break-all">{file.name}</span>
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("remove", { name: file.name })}
        className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border-2 border-white bg-navy text-white"
      >
        <X className="size-3.5" strokeWidth={3} aria-hidden />
      </button>
    </li>
  );
}

"use client";

import { useRef, useState } from "react";
import {
  Camera,
  X,
  RotateCcw,
  Send,
  SkipForward,
  Loader2,
  ImagePlus,
  CheckCircle2,
  Trash2,
} from "lucide-react";

type Props = {
  tokenId: string;
  patientName: string;
  clinicId: string;
  createdBy: string;
  onDone: () => void; // called after send OR skip
  onClose: () => void;
};

export function PrescriptionModal({
  tokenId,
  patientName,
  clinicId,
  createdBy,
  onDone,
  onClose,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    Array.from(files).forEach((file) => {
      if (photos.length >= 3) return; // max 3 photos
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPhotos((prev) => [...prev.slice(0, 2), result]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (photos.length === 0) return;
    setSending(true);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId,
          tokenId,
          patientName,
          photos,
          createdBy,
        }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(() => {
          onDone();
        }, 1200);
      } else {
        alert("Failed to send prescription");
        setSending(false);
      }
    } catch {
      alert("Network error — prescription not sent");
      setSending(false);
    }
  };

  const handleSkip = () => {
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)] backdrop-blur-sm px-4">
      <div className="card card-elevated w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-[var(--accent-soft)] px-5 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
              प्रिस्क्रिप्शन फोटो
            </p>
            <p className="mt-0.5 text-sm font-bold text-[var(--accent-strong)]">
              {tokenId} — {patientName}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Success State */}
          {sent ? (
            <div className="flex flex-col items-center py-6 text-center fade-up">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-soft)]">
                <CheckCircle2 className="h-8 w-8 text-[var(--success)]" />
              </div>
              <p className="mt-3 text-base font-bold text-[var(--success)]">
                फार्मेसी को भेज दिया! ✓
              </p>
              <p className="mt-1 text-xs text-[rgba(19,49,58,0.5)]">
                {photos.length} फोटो · {tokenId}
              </p>
            </div>
          ) : (
            <>
              {/* Photo Preview Grid */}
              {photos.length > 0 && (
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={photo}
                        alt={`Prescription ${i + 1}`}
                        className="h-24 w-full rounded-lg object-cover border border-[var(--line)]"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--danger)] text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Camera Input */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapture}
                className="hidden"
              />

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {photos.length < 3 && (
                  <button
                    type="button"
                    className="btn btn-outline w-full"
                    onClick={() => fileRef.current?.click()}
                  >
                    {photos.length === 0 ? (
                      <><Camera className="h-4 w-4" /> 📷 फोटो लें</>
                    ) : (
                      <><ImagePlus className="h-4 w-4" /> और फोटो जोड़ें ({photos.length}/3)</>
                    )}
                  </button>
                )}

                {photos.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary w-full"
                    onClick={handleSend}
                    disabled={sending}
                  >
                    {sending ? (
                      <><Loader2 className="h-4 w-4 animate-spin-slow" /> भेज रहे हैं...</>
                    ) : (
                      <><Send className="h-4 w-4" /> फार्मेसी को भेजें</>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-ghost w-full text-[rgba(19,49,58,0.5)]"
                  onClick={handleSkip}
                  disabled={sending}
                >
                  <SkipForward className="h-4 w-4" /> स्किप करें
                </button>
              </div>

              <p className="mt-3 text-center text-[10px] text-[rgba(19,49,58,0.35)]">
                फोटो सीधे फार्मेसी डैशबोर्ड पर दिखेगी
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

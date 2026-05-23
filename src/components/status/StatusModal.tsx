import { useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { postStatus } from "../../features/status/statusSlice";
import { colors, radius, shadow } from "../../styles";
import { X, Image, Type } from "lucide-react";
import toast from "react-hot-toast";

const BG_COLORS = [
  "#005c4b", "#1a3a4a", "#2d1b69", "#4a1942",
  "#1a4a2e", "#4a3000", "#1a1a4a", "#3a1a1a",
];

interface Props {
  onClose: () => void;
}

export default function StatusModal({ onClose }: Props) {
  const dispatch = useAppDispatch();
  const posting = useAppSelector((s) => s.status.posting);
  const [mode, setMode] = useState<"text" | "image">("text");
  const [caption, setCaption] = useState("");
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (mode === "text" && !caption.trim()) {
      toast.error("Please enter some text");
      return;
    }
    if (mode === "image" && !imageFile) {
      toast.error("Please select an image");
      return;
    }

    const fd = new FormData();
    if (caption.trim()) fd.append("caption", caption.trim());
    if (mode === "text") fd.append("backgroundColor", bgColor);
    if (imageFile) fd.append("media", imageFile);

    const result = await dispatch(postStatus(fd));
    if (postStatus.fulfilled.match(result)) {
      toast.success("Status posted!");
      onClose();
    } else {
      toast.error("Failed to post status");
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(420px, 100vw)",
          background: colors.bgModal,
          borderRadius: radius.xl,
          boxShadow: shadow.lg,
          overflow: "hidden",
          margin: "0 12px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>
            Add Status
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, display: "flex" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", padding: "12px 20px", gap: 8 }}>
          {(["text", "image"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: "8px 0",
                borderRadius: radius.full,
                border: `1px solid ${mode === m ? colors.primary : colors.border}`,
                background: mode === m ? colors.primaryLight : "transparent",
                color: mode === m ? colors.primary : colors.textMuted,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {m === "text" ? <Type size={14} /> : <Image size={14} />}
              {m === "text" ? "Text" : "Photo"}
            </button>
          ))}
        </div>

        {/* Preview area */}
        <div style={{ padding: "0 20px 16px" }}>
          {mode === "text" ? (
            <div style={{
              borderRadius: radius.lg,
              background: bgColor,
              minHeight: 200,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20,
              position: "relative",
            }}>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Type your status..."
                maxLength={280}
                style={{
                  width: "100%", background: "transparent", border: "none",
                  outline: "none", resize: "none", textAlign: "center",
                  fontSize: 20, fontWeight: 600, color: "#fff",
                  lineHeight: 1.4, minHeight: 120,
                  fontFamily: "inherit",
                }}
              />
              <span style={{
                position: "absolute", bottom: 8, right: 12,
                fontSize: 11, color: "rgba(255,255,255,0.5)",
              }}>
                {caption.length}/280
              </span>
            </div>
          ) : (
            <div
              style={{
                borderRadius: radius.lg,
                background: colors.bgInput,
                minHeight: 200,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                cursor: "pointer", overflow: "hidden",
                position: "relative",
              }}
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="preview"
                    style={{ width: "100%", maxHeight: 260, objectFit: "cover" }}
                  />
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    padding: "8px 12px",
                    background: "rgba(0,0,0,0.5)",
                  }}>
                    <input
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Add a caption..."
                      maxLength={280}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: "100%", background: "transparent", border: "none",
                        outline: "none", color: "#fff", fontSize: 13,
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Image size={36} color={colors.textDim} />
                  <span style={{ fontSize: 13, color: colors.textDim, marginTop: 8 }}>
                    Click to select a photo
                  </span>
                </>
              )}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageChange}
          />

          {/* Background color picker (text mode only) */}
          {mode === "text" && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: c, border: `3px solid ${bgColor === c ? colors.primary : "transparent"}`,
                    cursor: "pointer", padding: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 20px 20px",
          display: "flex", gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "10px 0",
              borderRadius: radius.full,
              border: `1px solid ${colors.border}`,
              background: "transparent",
              color: colors.textMuted, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={posting}
            style={{
              flex: 2, padding: "10px 0",
              borderRadius: radius.full,
              border: "none",
              background: posting ? colors.primaryLight : colors.primary,
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: posting ? "not-allowed" : "pointer",
            }}
          >
            {posting ? "Posting..." : "Post Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

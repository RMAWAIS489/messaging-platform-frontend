import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "../../app/hooks";
import { deleteStatus } from "../../features/status/statusSlice";
import { colors, radius } from "../../styles";
import { X, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { getAvatarUrl, getMediaUrl } from "../../utils/fileHelpers";
import { useRelativeTime } from "../../hooks/useRelativeTime";
import type { StatusGroup, Status } from "../../types";
import toast from "react-hot-toast";

const STATUS_DURATION = 5000; // 5 s per status

interface Props {
  group: StatusGroup;
  isOwn: boolean;
  onClose: () => void;
}

export default function StatusViewerModal({ group, isOwn, onClose }: Props) {
  const dispatch = useAppDispatch();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const elapsed = useRef<number>(0);

  const current = group.statuses[index];
  const total = group.statuses.length;

  const goNext = () => {
    if (index < total - 1) {
      setIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setProgress(0);
    }
  };

  // Auto-advance timer
  useEffect(() => {
    elapsed.current = 0;
    setProgress(0);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      if (paused) return;
      const now = Date.now();
      const delta = now - startTimeRef.current;
      const pct = Math.min((delta / STATUS_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current!);
        goNext();
      }
    }, 50);

    return () => clearInterval(intervalRef.current!);
  }, [index, paused]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this status?")) return;
    const result = await dispatch(deleteStatus(current.id));
    if (deleteStatus.fulfilled.match(result)) {
      toast.success("Status deleted");
      if (total === 1) {
        onClose();
      } else if (index >= total - 1) {
        setIndex(total - 2);
      }
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "rgba(0,0,0,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(380px, 100vw)",
          height: "min(600px, 100dvh)",
          borderRadius: window.innerWidth <= 768 ? 0 : radius.xl,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Progress bars */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
          display: "flex", gap: 3, padding: "10px 10px 0",
        }}>
          {group.statuses.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 3, borderRadius: 2,
                background: "rgba(255,255,255,0.3)",
                overflow: "hidden",
              }}
            >
              <div style={{
                height: "100%",
                background: "#fff",
                width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
                transition: i === index ? "none" : undefined,
              }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{
          position: "absolute", top: 20, left: 0, right: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={getAvatarUrl(group.user.avatar, group.user.username)}
              alt={group.user.username}
              style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {group.user.username}
              </div>
              <StatusTime dateStr={current.createdAt} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {isOwn && (
              <button
                onClick={handleDelete}
                style={{
                  background: "rgba(0,0,0,0.4)", border: "none",
                  borderRadius: "50%", width: 34, height: 34,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#fff",
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: "rgba(0,0,0,0.4)", border: "none",
                borderRadius: "50%", width: 34, height: 34,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#fff",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status content */}
        <StatusContent status={current} />

        {/* Tap zones */}
        <button
          onClick={goPrev}
          style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: "35%",
            background: "transparent", border: "none", cursor: index > 0 ? "pointer" : "default",
            display: "flex", alignItems: "center", paddingLeft: 8,
          }}
        >
          {index > 0 && <ChevronLeft size={28} color="rgba(255,255,255,0.7)" />}
        </button>
        <button
          onClick={goNext}
          style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: "35%",
            background: "transparent", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8,
          }}
        >
          <ChevronRight size={28} color="rgba(255,255,255,0.7)" />
        </button>
      </div>
    </div>
  );
}

function StatusContent({ status }: { status: Status }) {
  if (status.type === "image" && status.mediaUrl) {
    return (
      <div style={{ position: "relative", minHeight: 480, background: "#000" }}>
        <img
          src={getMediaUrl(status.mediaUrl)}
          alt="status"
          style={{ width: "100%", maxHeight: 480, objectFit: "contain", display: "block" }}
        />
        {status.caption && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "16px 16px 20px",
            background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
            fontSize: 15, color: "#fff", fontWeight: 500,
          }}>
            {status.caption}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 480,
      background: status.backgroundColor ?? "#005c4b",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 32,
    }}>
      <p style={{
        fontSize: 22, fontWeight: 700, color: "#fff",
        textAlign: "center", lineHeight: 1.5,
        wordBreak: "break-word",
      }}>
        {status.caption}
      </p>
    </div>
  );
}

function StatusTime({ dateStr }: { dateStr: string }) {
  const label = useRelativeTime(dateStr);
  return (
    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
      {label}
    </div>
  );
}

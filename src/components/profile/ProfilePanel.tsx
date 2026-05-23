import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { updateProfile } from "../../features/auth/authSlice";
import { colors, radius, shadow } from "../../styles";
import { X, Camera, Check, Pencil } from "lucide-react";
import { getAvatarUrl } from "../../utils/fileHelpers";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfilePanel({ isOpen, onClose }: Props) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const loading = useAppSelector((s) => s.auth.loading);

  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync when user changes
  useEffect(() => {
    setUsername(user?.username ?? "");
    setBio(user?.bio ?? "");
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const fd = new FormData();
    if (username.trim() && username !== user?.username) fd.append("username", username.trim());
    if (bio !== (user?.bio ?? "")) fd.append("bio", bio);
    if (avatarFile) fd.append("avatar", avatarFile);

    if (!fd.has("username") && !fd.has("bio") && !fd.has("avatar")) {
      toast("Nothing to save");
      return;
    }

    const result = await dispatch(updateProfile(fd));
    if (updateProfile.fulfilled.match(result)) {
      toast.success("Profile updated");
      setAvatarFile(null);
      setAvatarPreview(null);
      setEditingName(false);
      setEditingBio(false);
    } else {
      toast.error("Failed to update profile");
    }
  };

  const hasChanges =
    username !== (user?.username ?? "") ||
    bio !== (user?.bio ?? "") ||
    !!avatarFile;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0, left: 0, bottom: 0,
        width: 360,
        background: colors.bgPanel,
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        boxShadow: shadow.lg,
        borderRight: `1px solid ${colors.border}`,
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "16px 20px",
        background: colors.primary,
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#fff", display: "flex", padding: 4,
          }}
        >
          <X size={20} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
          Profile
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Avatar section */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "32px 20px 24px",
          background: colors.bgCard,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <div style={{ position: "relative" }}>
            <img
              src={avatarPreview ?? getAvatarUrl(user?.avatar ?? null, user?.username ?? "")}
              alt={user?.username}
              style={{
                width: 120, height: 120, borderRadius: "50%",
                objectFit: "cover",
                border: `3px solid ${colors.border}`,
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                position: "absolute", bottom: 4, right: 4,
                width: 36, height: 36, borderRadius: "50%",
                background: colors.primary, border: `2px solid ${colors.bgCard}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#fff",
              }}
              title="Change photo"
            >
              <Camera size={16} />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
          <p style={{ fontSize: 12, color: colors.textDim, marginTop: 10 }}>
            Click the camera to change your photo
          </p>
        </div>

        {/* Name */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <p style={{ fontSize: 12, color: colors.primary, fontWeight: 600, marginBottom: 8 }}>
            Your name
          </p>
          {editingName ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                maxLength={30}
                style={{
                  flex: 1, background: "transparent", border: "none",
                  borderBottom: `2px solid ${colors.primary}`,
                  outline: "none", color: colors.text, fontSize: 16,
                  padding: "4px 0", fontFamily: "inherit",
                }}
              />
              <button
                onClick={() => setEditingName(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: colors.primary, display: "flex" }}
              >
                <Check size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 16, color: colors.text }}>{username}</span>
              <button
                onClick={() => setEditingName(true)}
                style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, display: "flex" }}
              >
                <Pencil size={16} />
              </button>
            </div>
          )}
          <p style={{ fontSize: 11, color: colors.textDim, marginTop: 6 }}>
            This is not your username. This name is visible to your contacts.
          </p>
        </div>

        {/* Bio */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <p style={{ fontSize: 12, color: colors.primary, fontWeight: 600, marginBottom: 8 }}>
            About
          </p>
          {editingBio ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                autoFocus
                maxLength={139}
                rows={3}
                style={{
                  flex: 1, background: "transparent", border: "none",
                  borderBottom: `2px solid ${colors.primary}`,
                  outline: "none", color: colors.text, fontSize: 15,
                  padding: "4px 0", fontFamily: "inherit", resize: "none",
                }}
              />
              <button
                onClick={() => setEditingBio(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: colors.primary, display: "flex", marginTop: 4 }}
              >
                <Check size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 15, color: bio ? colors.text : colors.textDim, lineHeight: 1.5 }}>
                {bio || "Hey there! I am using this app."}
              </span>
              <button
                onClick={() => setEditingBio(true)}
                style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, display: "flex", flexShrink: 0 }}
              >
                <Pencil size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Email (read-only) */}
        <div style={{ padding: "20px 20px 16px" }}>
          <p style={{ fontSize: 12, color: colors.primary, fontWeight: 600, marginBottom: 8 }}>
            Email
          </p>
          <span style={{ fontSize: 15, color: colors.textMuted }}>{user?.email}</span>
        </div>
      </div>

      {/* Save button */}
      {hasChanges && (
        <div style={{
          padding: "12px 20px 20px",
          borderTop: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              width: "100%", padding: "12px 0",
              borderRadius: radius.full,
              border: "none",
              background: loading ? colors.primaryLight : colors.primary,
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

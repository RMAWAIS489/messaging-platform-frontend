import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { searchUsers, clearSearch } from "../../features/users/userSlice";
import { createDirectConversation, createGroupConversation } from "../../features/conversations/conversationSlice";
import type { User } from "../../types";
import { colors, radius, shadow } from "../../styles";
import toast from "react-hot-toast";

interface Props { isOpen: boolean; onClose: () => void; }

export default function NewChatModal({ isOpen, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { searchResults, searchLoading } = useAppSelector((s) => s.users);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"direct" | "group">("direct");
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!isOpen) { setQuery(""); setGroupName(""); setSelectedUsers([]); setMode("direct"); dispatch(clearSearch()); }
  }, [isOpen, dispatch]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length >= 2) dispatch(searchUsers(query.trim()));
      else dispatch(clearSearch());
    }, 300);
    return () => clearTimeout(t);
  }, [query, dispatch]);

  const handleSelectUser = (user: User) => {
    if (mode === "direct") { dispatch(createDirectConversation(user.id)); onClose(); return; }
    if (!selectedUsers.find((u) => u.id === user.id)) setSelectedUsers((p) => [...p, user]);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) { toast.error("Group name required"); return; }
    if (selectedUsers.length < 2) { toast.error("Add at least 2 members"); return; }
    await dispatch(createGroupConversation({ name: groupName, memberIds: selectedUsers.map((u) => u.id) }));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
      <div style={{
        position: "relative", width: "100%", maxWidth: 420,
        margin: "0 12px",
        background: colors.bgModal, borderRadius: radius.xl,
        boxShadow: shadow.lg, overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", background: colors.bgPanel,
        }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>New conversation</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Mode tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: 16, background: colors.bgInput, borderRadius: radius.md, padding: 3 }}>
            {(["direct", "group"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "7px 0", borderRadius: radius.sm, fontSize: 13, fontWeight: 600,
                border: "none", cursor: "pointer", transition: "all 0.15s",
                background: mode === m ? colors.primary : "transparent",
                color: mode === m ? "#fff" : colors.textMuted,
              }}>
                {m === "direct" ? "Direct" : "Group"}
              </button>
            ))}
          </div>

          {/* Group name */}
          {mode === "group" && (
            <div style={{ marginBottom: 12 }}>
              <input
                placeholder="Group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={{
                  width: "100%", background: colors.bgInput, border: "none",
                  borderRadius: radius.md, padding: "10px 14px",
                  fontSize: 14, color: colors.text, outline: "none",
                }}
              />
              {selectedUsers.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {selectedUsers.map((u) => (
                    <div key={u.id} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      background: colors.primaryLight, borderRadius: radius.full,
                      padding: "3px 10px 3px 8px", fontSize: 12, color: colors.primary,
                    }}>
                      {u.username}
                      <button onClick={() => setSelectedUsers((p) => p.filter((x) => x.id !== u.id))}
                        style={{ background: "none", border: "none", color: colors.primary, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill={colors.textDim} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%", background: colors.bgInput, border: "none",
                borderRadius: radius.md, padding: "10px 14px 10px 32px",
                fontSize: 14, color: colors.text, outline: "none",
              }}
            />
          </div>

          {/* Results */}
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {searchLoading && <div style={{ textAlign: "center", padding: 16, fontSize: 13, color: colors.textMuted }}>Searching...</div>}
            {!searchLoading && searchResults.length === 0 && query.length >= 2 && (
              <div style={{ textAlign: "center", padding: 16, fontSize: 13, color: colors.textDim }}>No users found</div>
            )}
            {searchResults.map((user) => {
              const isSelected = selectedUsers.some((u) => u.id === user.id);
              return (
                <UserRow key={user.id} user={user} isSelected={isSelected} onClick={() => handleSelectUser(user)} />
              );
            })}
          </div>

          {mode === "group" && (
            <button
              onClick={handleCreateGroup}
              style={{
                width: "100%", marginTop: 14, padding: "11px",
                background: colors.primary, color: "#fff",
                border: "none", borderRadius: radius.md,
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Create Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UserRow({ user, isSelected, onClick }: { user: User; isSelected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const initials = user.username.slice(0, 2).toUpperCase();
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12,
        padding: "10px 8px", borderRadius: radius.md, border: "none",
        background: isSelected ? colors.primaryLight : hovered ? colors.bgInput : "transparent",
        cursor: "pointer", textAlign: "left", transition: "background 0.1s",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
        background: colors.primary, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 700, color: "#fff",
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>{user.username}</div>
        <div style={{ fontSize: 12, color: colors.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
      </div>
      {isSelected && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill={colors.primary}>
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      )}
    </button>
  );
}

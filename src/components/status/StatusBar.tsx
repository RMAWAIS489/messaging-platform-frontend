import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchStatuses } from "../../features/status/statusSlice";
import { colors, radius } from "../../styles";
import { getAvatarUrl } from "../../utils/fileHelpers";
import type { StatusGroup } from "../../types";
import StatusModal from "./StatusModal";
import StatusViewerModal from "./StatusViewerModal";

export default function StatusBar() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);
  const { groups } = useAppSelector((s) => s.status);
  const [postOpen, setPostOpen] = useState(false);
  const [viewGroup, setViewGroup] = useState<StatusGroup | null>(null);

  useEffect(() => {
    dispatch(fetchStatuses());
  }, [dispatch]);

  const myGroup = groups.find((g) => g.user.id === currentUser?.id);
  const contactGroups = groups.filter((g) => g.user.id !== currentUser?.id);

  return (
    <>
      <div
        style={{
          borderBottom: `1px solid ${colors.border}`,
          padding: "10px 0 10px 12px",
          background: colors.bgPanel,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 14,
            overflowX: "auto",
            paddingRight: 12,
            scrollbarWidth: "none",
          }}
        >
          {/* My status bubble */}
          <StatusBubble
            label="My status"
            avatar={currentUser?.avatar ?? null}
            username={currentUser?.username ?? ""}
            hasStatus={!!myGroup && myGroup.statuses.length > 0}
            isOwn
            onClick={() => {
              if (myGroup && myGroup.statuses.length > 0) {
                setViewGroup(myGroup);
              } else {
                setPostOpen(true);
              }
            }}
            onAdd={() => setPostOpen(true)}
          />

          {/* Contact statuses */}
          {contactGroups.map((g) => (
            <StatusBubble
              key={g.user.id}
              label={g.user.username}
              avatar={g.user.avatar}
              username={g.user.username}
              hasStatus
              onClick={() => setViewGroup(g)}
            />
          ))}
        </div>
      </div>

      {postOpen && (
        <StatusModal onClose={() => setPostOpen(false)} />
      )}

      {viewGroup && (
        <StatusViewerModal
          group={viewGroup}
          isOwn={viewGroup.user.id === currentUser?.id}
          onClose={() => setViewGroup(null)}
        />
      )}
    </>
  );
}

function StatusBubble({
  label,
  avatar,
  username,
  hasStatus,
  isOwn,
  onClick,
  onAdd,
}: {
  label: string;
  avatar: string | null;
  username: string;
  hasStatus: boolean;
  isOwn?: boolean;
  onClick: () => void;
  onAdd?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      <div
        style={{ position: "relative" }}
        onClick={onClick}
      >
        {/* Ring */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            padding: 2,
            background: hasStatus
              ? `conic-gradient(${colors.primary} 0%, ${colors.primary} 100%)`
              : colors.border,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              border: `2px solid ${colors.bgPanel}`,
              overflow: "hidden",
              background: colors.bgInput,
            }}
          >
            <img
              src={getAvatarUrl(avatar, username)}
              alt={username}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>

        {/* Add button for own status */}
        {isOwn && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd?.();
            }}
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: colors.primary,
              border: `2px solid ${colors.bgPanel}`,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              lineHeight: 1,
              padding: 0,
            }}
            title="Add status"
          >
            +
          </button>
        )}
      </div>

      <span
        style={{
          fontSize: 11,
          color: colors.textMuted,
          maxWidth: 52,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textAlign: "center",
        }}
      >
        {label}
      </span>
    </div>
  );
}

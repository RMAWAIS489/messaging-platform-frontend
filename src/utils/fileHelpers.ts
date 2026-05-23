export function getFileIcon(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const icons: Record<string, string> = {
    pdf: "📄", doc: "📝", docx: "📝", txt: "📃",
    zip: "🗜️", rar: "🗜️",
    mp3: "🎵", wav: "🎵", ogg: "🎵",
    mp4: "🎬", webm: "🎬",
  };
  return icons[ext || ""] || "📎";
}

export function isImageFile(type: string): boolean {
  return type === "image";
}

export function getAvatarUrl(avatar: string | null, username: string): string {
  if (avatar) {
    // avatar is like /uploads/filename.jpg — serve via Vite proxy
    return avatar.startsWith("http") ? avatar : avatar;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366f1&color=fff&bold=true&size=128`;
}

export function getMediaUrl(url: string): string {
  // Already relative (/uploads/...) — Vite proxy handles it
  return url.startsWith("http") ? url : url;
}

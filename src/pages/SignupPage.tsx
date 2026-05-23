import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { signup, clearError } from "../features/auth/authSlice";
import { colors, radius, shadow } from "../styles";
import toast from "react-hot-toast";

export default function SignupPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => { if (token) navigate("/"); }, [token, navigate]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) { toast.error("Fill in all fields"); return; }
    if (form.password !== form.confirm) { toast.error("Passwords don't match"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    dispatch(signup({ username: form.username, email: form.email, password: form.password }));
  };

  const fields = [
    { key: "username", label: "Username", type: "text", placeholder: "Your name" },
    { key: "email", label: "Email address", type: "email", placeholder: "you@example.com" },
    { key: "password", label: "Password", type: "password", placeholder: "Min. 6 characters" },
    { key: "confirm", label: "Confirm password", type: "password", placeholder: "Repeat password" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: colors.bg,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div className="fade-in" style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: colors.primary,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
          }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="white">
              <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896.002-3.176-1.24-6.165-3.48-8.45z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: colors.text, marginBottom: 4 }}>Create account</h1>
          <p style={{ fontSize: 13, color: colors.textMuted }}>Join and start messaging</p>
        </div>

        <div style={{ background: colors.bgPanel, borderRadius: radius.xl, padding: 28, boxShadow: shadow.lg }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {fields.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: focused === key ? colors.primary : colors.textMuted, marginBottom: 6, transition: "color 0.15s" }}>
                  {label}
                </label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onFocus={() => setFocused(key)}
                  onBlur={() => setFocused(null)}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={{
                    width: "100%",
                    background: colors.bgInput,
                    border: `1.5px solid ${focused === key ? colors.primary : colors.border}`,
                    borderRadius: radius.md,
                    padding: "10px 14px",
                    fontSize: 14, color: colors.text, outline: "none",
                    transition: "border-color 0.15s",
                  }}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6, padding: "12px",
                background: loading ? colors.textDim : colors.primary,
                color: "#fff", border: "none", borderRadius: radius.lg,
                fontSize: 15, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading && <svg className="spin" width={16} height={16} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity={0.3}/><path fill="white" d="M4 12a8 8 0 018-8v8z"/></svg>}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p style={{ textAlign: "center", fontSize: 13, color: colors.textMuted, marginTop: 20 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: colors.primary, fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

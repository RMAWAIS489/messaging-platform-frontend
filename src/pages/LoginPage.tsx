import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { login, clearError } from "../features/auth/authSlice";
import { colors, radius, shadow } from "../styles";
import toast from "react-hot-toast";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => { if (token) navigate("/"); }, [token, navigate]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error("Fill in all fields"); return; }
    dispatch(login(form));
  };

  return (
    <div style={{
      minHeight: "100vh", background: colors.bg,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div className="fade-in" style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
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
          <h1 style={{ fontSize: 22, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
            WhatsApp
          </h1>
          <p style={{ fontSize: 13, color: colors.textMuted }}>Sign in to your account</p>
        </div>

        {/* Form */}
        <div style={{
          background: colors.bgPanel,
          borderRadius: radius.xl,
          padding: 28,
          boxShadow: shadow.lg,
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              focused={focused === "email"}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            />
            <Field
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              focused={focused === "password"}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: "12px",
                background: loading ? colors.textDim : colors.primary,
                color: "#fff",
                border: "none",
                borderRadius: radius.lg,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.15s",
              }}
            >
              {loading && <svg className="spin" width={16} height={16} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity={0.3}/><path fill="white" d="M4 12a8 8 0 018-8v8z"/></svg>}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 13, color: colors.textMuted, marginTop: 20 }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: colors.primary, fontWeight: 600 }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, placeholder, value, focused, onFocus, onBlur, onChange }: {
  label: string; type: string; placeholder: string; value: string;
  focused: boolean; onFocus: () => void; onBlur: () => void; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: focused ? colors.primary : colors.textMuted, marginBottom: 6, transition: "color 0.15s" }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: colors.bgInput,
          border: `1.5px solid ${focused ? colors.primary : colors.border}`,
          borderRadius: radius.md,
          padding: "10px 14px",
          fontSize: 14,
          color: colors.text,
          outline: "none",
          transition: "border-color 0.15s",
        }}
      />
    </div>
  );
}

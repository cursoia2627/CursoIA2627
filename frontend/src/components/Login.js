import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import "./login.css";
import { authApi } from "../services/authApi";

function PasswordField({ id, label, value, onChange, visible, onToggle, autoComplete, placeholder }) {
  return (
    <label className="login-field" htmlFor={id}>
      <span>{label}</span>
      <div className="login-control login-password-control">
        <LockKeyhole size={17} aria-hidden="true" />
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
        <button
          className="password-visibility"
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}

function UserField({ identifier, onChange }) {
  return (
    <label className="login-field" htmlFor="login-email">
      <span>Usuario · apodo o correo electrónico</span>
      <div className="login-control">
        <Mail size={17} aria-hidden="true" />
        <input
          id="login-email"
          type="text"
          autoComplete="username"
          required
          maxLength={254}
          value={identifier}
          onChange={(event) => onChange(event.target.value)}
          placeholder="nombre.apellido@email.com"
        />
      </div>
    </label>
  );
}

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmacion, setPasswordConfirmacion] = useState("");
  const [visible, setVisible] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  function toggle(field) {
    setVisible((current) => ({ ...current, [field]: !current[field] }));
  }

  function switchMode(next) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (mode === "login") {
        const result = await authApi.login(identifier.trim(), password);
        onLogin(result.user);
      } else {
        if (passwordNueva !== passwordConfirmacion) {
          setError("La confirmación no coincide con la contraseña nueva.");
          return;
        }
        if (passwordNueva.trim().length < 4) {
          setError("La contraseña nueva debe tener al menos 4 caracteres.");
          return;
        }
        const result = await authApi.changePassword(identifier.trim(), passwordActual, passwordNueva);
        setPassword("");
        setPasswordActual("");
        setPasswordNueva("");
        setPasswordConfirmacion("");
        setNotice(result?.message || "Contraseña actualizada. Ya puedes iniciar sesión.");
        setMode("login");
      }
    } catch (e) {
      setError(e.message || "No se pudo completar la operación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-orb login-orb-one" aria-hidden="true" />
      <div className="login-orb login-orb-two" aria-hidden="true" />
      <div className="login-layout">
        <section className="login-story" aria-label="IA para Todos">
          <div className="story-brand">
            <span className="story-brand-mark"><Sparkles size={21} /></span>
            <span>IA <b>para Todos</b></span>
          </div>
          <div className="story-content">
            <span className="story-kicker"><span /> ATENCIÓN MÁS HUMANA, CON IA</span>
            <h1>Todo lo que necesitas para <em>atender mejor.</em></h1>
            <p>Un espacio seguro para gestionar clientes, conversaciones y avatares desde un único lugar.</p>
            <div className="story-feature">
              <span><ShieldCheck size={20} /></span>
              <div><b>Tu espacio, protegido</b><small>Acceso personal con sesión segura.</small></div>
            </div>
          </div>
          <div className="story-footer"><span className="story-footer-dot" /> Plataforma de atención al cliente</div>
        </section>

        <section className="login-panel" aria-labelledby="login-heading">
          <div className="login-panel-top">
            <span className="login-panel-icon">{mode === "login" ? <LockKeyhole size={22} /> : <KeyRound size={22} />}</span>
            <span className="login-panel-tag">ACCESO A LA PLATAFORMA</span>
          </div>
          <h2 id="login-heading">{mode === "login" ? "Bienvenido de nuevo" : "Actualiza tu contraseña"}</h2>
          <p className="login-copy">
            {mode === "login" ? "Escribe tu apodo o correo y tu contraseña." : "Confirma tu identidad y elige una contraseña nueva."}
          </p>

          {notice && <p className="login-notice" role="status"><CheckCircle2 size={17} />{notice}</p>}

          <form className="login-form" onSubmit={submit}>
            <UserField identifier={identifier} onChange={setIdentifier} />

            {mode === "login" ? (
              <PasswordField
                id="login-password"
                label="Contraseña"
                value={password}
                onChange={setPassword}
                visible={!!visible.login}
                onToggle={() => toggle("login")}
                autoComplete="current-password"
                placeholder="Introduce tu contraseña"
              />
            ) : (
              <>
                <PasswordField
                  id="old-password"
                  label="Contraseña antigua"
                  value={passwordActual}
                  onChange={setPasswordActual}
                  visible={!!visible.current}
                  onToggle={() => toggle("current")}
                  autoComplete="current-password"
                  placeholder="Tu contraseña actual"
                />
                <PasswordField
                  id="new-password"
                  label="Contraseña nueva"
                  value={passwordNueva}
                  onChange={setPasswordNueva}
                  visible={!!visible.new}
                  onToggle={() => toggle("new")}
                  autoComplete="new-password"
                  placeholder="Mínimo 4 caracteres"
                />
                <PasswordField
                  id="confirm-password"
                  label="Confirma la contraseña nueva"
                  value={passwordConfirmacion}
                  onChange={setPasswordConfirmacion}
                  visible={!!visible.confirm}
                  onToggle={() => toggle("confirm")}
                  autoComplete="new-password"
                  placeholder="Repite la contraseña nueva"
                />
              </>
            )}

            {error && <p className="login-error" role="alert">{error}</p>}
            <button className="login-submit" disabled={loading}>
              {loading ? "Procesando…" : mode === "login" ? <>Entrar <LogIn size={17} /></> : <>Guardar contraseña <KeyRound size={17} /></>}
            </button>
          </form>

          <button className="login-switch" type="button" onClick={() => switchMode(mode === "login" ? "change" : "login")}>
            {mode === "login" ? "¿Has olvidado o quieres cambiar tu contraseña?" : <><ArrowLeft size={15} /> Volver al inicio de sesión</>}
          </button>
          {mode === "login" && <p className="login-help">La primera vez, utiliza la contraseña inicial que te indicó el administrador.</p>}
          <div className="login-panel-foot"><ShieldCheck size={14} /> Acceso personal · Sesión cifrada</div>
        </section>
      </div>
    </main>
  );
}




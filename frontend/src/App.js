import React, { useEffect, useState } from "react";
import {
  Users,
  MessageSquare,
  UserRound,
  Sun,
  Moon,
  Menu,
  X,
  Info,
  CircleUserRound,
  LogOut,
} from "lucide-react";
import Brand from "./components/Brand";
import Clientes from "./components/Clientes";
import ChatBot from "./components/ChatBot";
import Avatar from "./components/Avatar";
import CookieConsent from "./components/CookieConsent";
import Login from "./components/Login";
import { conversacionesIniciales } from "./data/demo";
import { authApi } from "./services/authApi";
import { API_BASE, API_ROOT } from "./api/url";
import "./styles.css";
const tabs = [
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "chat", label: "Chat Bot", icon: MessageSquare },
  { id: "avatar", label: "Avatar", icon: UserRound },
];
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}
export default function App() {
  const [user, setUser] = useState(null),
    [checking, setChecking] = useState(true),
    [tab, setTab] = useState("clientes"),
    [menu, setMenu] = useState(false),
    [dark, setDark] = useState(false),
    [avatarThumb, setAvatarThumb] = useState(""),
    [conversaciones, setConversaciones] = useLocalStorage(
      "iat-conversaciones",
      conversacionesIniciales,
    );
  useEffect(() => {
    let active = true;
    authApi
      .session()
      .then((r) => {
        if (active) setUser(r.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    const expire = () => setUser(null);
    window.addEventListener("auth:expired", expire);
    return () => {
      active = false;
      window.removeEventListener("auth:expired", expire);
    };
  }, []);
  useEffect(() => {
    const clientId = user?.id_cliente;
    if (!clientId) {
      setAvatarThumb("");
      return undefined;
    }
    let active = true;
    let latestRequest = 0;
    let objectUrl = "";
    async function loadAvatar() {
      const requestId = ++latestRequest;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = "";
      }
      if (active) setAvatarThumb("");
      try {
        const response = await fetch(`${API_BASE}/clientes/${clientId}/avatar`, {
          credentials: "include",
          cache: "no-store",
        });
        const body = await response.json().catch(() => ({}));
        if (response.status === 401) {
          window.dispatchEvent(new Event("auth:expired"));
          return;
        }
        if (!response.ok) return;
        const avatar = body.data ?? body;
        if (!avatar.tieneImagen || !avatar.imagenUrl) return;
        const imageResponse = await fetch(`${API_ROOT}${avatar.imagenUrl}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (imageResponse.status === 401) {
          window.dispatchEvent(new Event("auth:expired"));
          return;
        }
        if (!imageResponse.ok) return;
        const image = await imageResponse.blob();
        if (!image.type.startsWith("image/")) return;
        const nextUrl = URL.createObjectURL(image);
        if (active && requestId === latestRequest) {
          objectUrl = nextUrl;
          setAvatarThumb(nextUrl);
        } else {
          URL.revokeObjectURL(nextUrl);
        }
      } catch {}
    }
    const onAvatarUpdated = (event) => {
      if (!event.detail?.id || String(event.detail.id) === String(clientId))
        loadAvatar();
    };
    loadAvatar();
    window.addEventListener("avatar:updated", onAvatarUpdated);
    return () => {
      active = false;
      window.removeEventListener("avatar:updated", onAvatarUpdated);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [user?.id_cliente]);
  async function logout() {
    try {
      await authApi.logout();
    } catch {}
    setUser(null);
    setTab("clientes");
  }
  function canAccess(section) {
    return section !== "dashboard" || user?.Rol === "Administrador";
  }
  function changeTab(next) {
    if (!canAccess(next)) return;
    setTab(next);
    setMenu(false);
  }
  if (checking)
    return (
      <main className="login-page">
        <p role="status">Comprobando sesión…</p>
      </main>
    );
  if (!user) return <Login onLogin={setUser} />;
  const visibleTabs = tabs.filter((t) => canAccess(t.id));
  return (
    <div className={"site " + tab + "-theme " + (dark ? "dark" : "")}>
      <div className="app-shell">
        <aside className={"sidebar " + (menu ? "open" : "")}>
          <Brand />
          <nav aria-label="Menú principal">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                className={"side-link " + (tab === t.id ? "active" : "")}
                onClick={() => changeTab(t.id)}
              >
                <t.icon size={19} />
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="side-footer">
            <Info size={19} />
            <span>
              IA para Todos
              <br />
              v1.0
            </span>
          </div>
        </aside>
        <main className="main">
          <header className="hero">
            <div className="mobile-bar">
              <Brand small />
              <button
                onClick={() => setMenu(!menu)}
                aria-label={menu ? "Cerrar menú" : "Abrir menú"}
              >
                {menu ? <X /> : <Menu />}
              </button>
            </div>
            <div className="hero-copy">
              <h1>
                <span>IA</span> para Todos
              </h1>
              <p>
                Explora el poder de la inteligencia artificial
                <br className="desktop-break" /> en una sola plataforma.
              </p>
            </div>
            <img
              className="hero-hand"
              src="/assets/mano-boceto.png"
              alt="Ilustración de mano robótica dibujada a lápiz"
            />
            <div className="hero-wave wave-one" />
            <div className="hero-wave wave-two" />
            <div className="hero-actions">
              <span className="auth-user">
                {avatarThumb ? (
                  <img
                    className="auth-user-avatar"
                    src={avatarThumb}
                    alt={"Avatar de " + user.nombre}
                  />
                ) : (
                  <CircleUserRound
                    className="auth-user-fallback"
                    size={20}
                  />
                )}
                {user.nombre} · {user.Rol}
              </span>
              <button
                onClick={() => setDark(!dark)}
                aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
                title="Cambiar tema"
              >
                {dark ? <Moon /> : <Sun />}
              </button>
              <button
                onClick={logout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut />
              </button>
            </div>
          </header>
          <div className="content">
            <div className="tabs" role="tablist" aria-label="Secciones">
              {visibleTabs.map((t) => (
                <button
                  role="tab"
                  aria-selected={tab === t.id}
                  key={t.id}
                  className={
                    "tab tab-" + t.id + " " + (tab === t.id ? "active" : "")
                  }
                  onClick={() => changeTab(t.id)}
                >
                  <t.icon size={22} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
            {tab === "clientes" && (
              <Clientes isAdmin={user.Rol === "Administrador"} />
            )}
            {tab === "chat" && (
              <ChatBot
                conversaciones={conversaciones}
                setConversaciones={setConversaciones}
              />
            )}
            {tab === "avatar" && <Avatar />}
          </div>
        </main>
      </div>
      <CookieConsent />
    </div>
  );
}




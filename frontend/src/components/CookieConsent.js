import React, { useEffect, useState } from 'react';
import { Cookie, Settings, X } from 'lucide-react';

const STORAGE_KEY = 'iat-cookie-consent';

export default function CookieConsent() {
  const [choice, setChoice] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });
  const [open, setOpen] = useState(!choice);

  useEffect(() => {
    if (choice) {
      try {
        localStorage.setItem(STORAGE_KEY, choice);
        localStorage.setItem(STORAGE_KEY + '-date', new Date().toISOString());
      } catch {}
    }
  }, [choice]);

  const select = (value) => {
    setChoice(value);
    setOpen(false);
  };

  return (
    <>
      {!open && (
        <button className="cookie-preferences" onClick={() => setOpen(true)} aria-label="Configurar cookies">
          <Settings size={17} /> Cookies
        </button>
      )}
      {open && (
        <div className="cookie-overlay" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
          <section className="cookie-panel">
            <button className="cookie-close" onClick={() => setOpen(false)} aria-label="Cerrar" title="Cerrar"><X size={18}/></button>
            <div className="cookie-heading"><span className="cookie-icon"><Cookie size={23}/></span><div>
              <h2 id="cookie-title">Tu privacidad importa</h2>
              <p>Configuración de cookies</p>
            </div></div>
            <p className="cookie-description">
              Utilizamos cookies y almacenamiento local esenciales para que la aplicación funcione y recuerde tus preferencias.
              Puedes rechazar las cookies no esenciales o aceptar todas. Tu elección se guardará y podrás cambiarla cuando quieras.
            </p>
            <div className="cookie-details">
              <div><strong>Esenciales</strong><span>Necesarias para el funcionamiento básico de la aplicación.</span><b>Siempre activas</b></div>
              <div><strong>Preferencias y mejora</strong><span>Permiten recordar opciones y mejorar la experiencia. Actualmente no se activan servicios publicitarios ni analíticos adicionales.</span></div>
            </div>
            <div className="cookie-actions">
              <button className="cookie-reject" onClick={() => select('rejected')}>Rechazar</button>
              <button className="cookie-essential" onClick={() => select('essential')}>Solo esenciales</button>
              <button className="cookie-accept" onClick={() => select('all')}>Aceptar todo</button>
            </div>
            <small className="cookie-footnote">Puedes modificar tu elección desde el botón «Cookies».</small>
          </section>
        </div>
      )}
    </>
  );
}

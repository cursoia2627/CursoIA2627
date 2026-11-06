import React, { useEffect, useState } from 'react';
import { UserRound, Sparkles, RefreshCw, ImagePlus, Check } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

async function leerRespuesta(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || body.error || `Error HTTP ${response.status}`);
  return body.data ?? body;
}

export default function Avatar() {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [tieneImagen, setTieneImagen] = useState(false);
  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [cargandoAvatar, setCargandoAvatar] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [tipoAviso, setTipoAviso] = useState('success');
  const [versionImagen, setVersionImagen] = useState(Date.now());

  useEffect(() => {
    let activo = true;
    async function cargarClientes() {
      try {
        const result = await leerRespuesta(await fetch(`${API_URL}/clientes?limit=100&offset=0`));
        const lista = result.items || [];
        if (!activo) return;
        setClientes(lista);
        if (lista.length) setClienteId(String(lista[0].id_cliente || lista[0].id));
      } catch (error) {
        if (activo) { setAviso(`No se pudieron cargar los usuarios desde MySQL: ${error.message}`); setTipoAviso('error'); }
      } finally {
        if (activo) setCargandoClientes(false);
      }
    }
    cargarClientes();
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    let activo = true;
    async function cargarAvatar() {
      if (!clienteId) {
        setDescripcion(''); setTieneImagen(false); setImagenUrl(''); return;
      }
      setCargandoAvatar(true); setAviso('');
      try {
        const avatar = await leerRespuesta(await fetch(`${API_URL}/clientes/${clienteId}/avatar`, { cache: 'no-store' }));
        if (!activo) return;
        setDescripcion(avatar.descripcion || '');
        setTieneImagen(Boolean(avatar.tieneImagen));
        setImagenUrl(avatar.imagenUrl ? `${API_URL.replace(/\/api$/, '')}${avatar.imagenUrl}` : '');
        setVersionImagen(Date.now());
      } catch (error) {
        if (activo) { setDescripcion(''); setTieneImagen(false); setImagenUrl(''); setAviso(error.message); setTipoAviso('error'); }
      } finally {
        if (activo) setCargandoAvatar(false);
      }
    }
    cargarAvatar();
    return () => { activo = false; };
  }, [clienteId]);

  async function generar(e) {
    e.preventDefault();
    if (!clienteId || !descripcion.trim()) return;
    setGenerando(true); setAviso('La IA está generando la imagen. Puede tardar unos segundos.'); setTipoAviso('info');
    try {
      const result = await leerRespuesta(await fetch(`${API_URL}/clientes/${clienteId}/avatar/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: descripcion.trim() })
      }));
      setDescripcion(result.descripcion || descripcion.trim());
      setTieneImagen(true);
      setImagenUrl(`${API_URL}/clientes/${clienteId}/avatar/imagen`);
      setVersionImagen(Date.now());
      setAviso(result.mensaje || 'Avatar generado y guardado correctamente en MySQL.');
      setTipoAviso('success');
    } catch (error) {
      setAviso(error.message || 'No se pudo generar el avatar.');
      setTipoAviso('error');
    } finally { setGenerando(false); }
  }

  const clienteActual = clientes.find(c => String(c.id_cliente || c.id) === String(clienteId));

  return (
    <section className="panel avatar-panel">
      <div className="panel-heading">
        <div className="heading-title">
          <UserRound className="heading-icon" size={38}/>
          <div><h2>Avatar – Generador con IA</h2><p>Crea y guarda un avatar personalizado para cada usuario.</p></div>
        </div>
      </div>
      <div className="avatar-layout avatar-ai-layout">
        <form className="avatar-form" onSubmit={generar}>
          <label>Usuario / cliente
            <select value={clienteId} onChange={e => setClienteId(e.target.value)} disabled={cargandoClientes || generando}>
              <option value="">Selecciona un usuario</option>
              {clientes.map(c => {
                const id = c.id_cliente || c.id;
                return <option key={id} value={id}>{[c.nombre, c.apellido].filter(Boolean).join(' ') || c.nombre}</option>;
              })}
            </select>
          </label>
          <label>Descripción del avatar <span className="required">*</span>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows="7" maxLength="2000"
              placeholder="Ejemplo: Avatar profesional, pelo castaño, gafas discretas, camisa azul, expresión amable, estilo 3D realista y fondo neutro..."
              disabled={!clienteId || generando}/>
          </label>
          <small className="avatar-counter">{descripcion.length}/2000 caracteres</small>
          <button className="action-button avatar-save" type="submit" disabled={!clienteId || !descripcion.trim() || generando || cargandoAvatar}>
            {generando ? <><RefreshCw size={18} className="avatar-spin"/> Generando imagen...</> : <><Sparkles size={18}/> {tieneImagen ? 'Actualizar avatar con IA' : 'Generar avatar con IA'}</>}
          </button>
          {aviso && <p className={`avatar-message ${tipoAviso}`}><Check size={15}/>{aviso}</p>}
          <p className="avatar-help">La descripción y la imagen JPG se guardan en el registro del usuario seleccionado. Si la generación falla, se conserva su imagen anterior.</p>
        </form>

        <div className="avatar-preview avatar-ai-preview">
          {generando ? (
            <div className="avatar-empty"><RefreshCw size={34} className="avatar-spin"/><strong>Generando avatar...</strong><small>Cloudflare Workers AI está creando la imagen.</small></div>
          ) : cargandoAvatar || cargandoClientes ? (
            <div className="avatar-empty"><RefreshCw size={28} className="avatar-spin"/><strong>Cargando datos...</strong></div>
          ) : tieneImagen && imagenUrl ? (
            <img key={`${clienteId}-${versionImagen}`} src={`${imagenUrl}?v=${versionImagen}`} alt={`Avatar de ${clienteActual?.nombre || 'usuario'}`}/>
          ) : (
            <div className="avatar-empty"><ImagePlus size={42}/><strong>Sin imagen todavía</strong><small>La imagen generada aparecerá aquí.</small></div>
          )}
          <strong>{clienteActual ? [clienteActual.nombre, clienteActual.apellido].filter(Boolean).join(' ') : 'Selecciona un usuario'}</strong>
          <small>{tieneImagen ? 'Imagen JPG almacenada en MySQL' : 'Pendiente de generar'}</small>
        </div>

        <aside className="avatar-gallery avatar-db-info">
          <div className="gallery-head"><h3>Almacenamiento</h3><Check size={17}/></div>
          <div className="avatar-db-card"><strong>avatar_descripcion</strong><small>TEXT · Descripción del usuario</small></div>
          <div className="avatar-db-card"><strong>avatar_imagen</strong><small>LONGBLOB · Imagen JPG</small></div>
          <div className="avatar-db-card"><strong>avatar_formato</strong><small>VARCHAR · image/jpeg</small></div>
          <p>Los campos se añaden automáticamente al iniciar el backend si todavía no existen.</p>
        </aside>
      </div>
    </section>
  );
}

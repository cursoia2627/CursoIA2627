import React, { useEffect, useRef, useState } from 'react';
import { Bot, Mic, MicOff, RefreshCw, Send, Volume2, Square } from 'lucide-react';
import { createConsulta, listClientes, listConsultas, getAiStatus } from '../services/chatApi';
import useChatVoice from '../hooks/useChatVoice';
import './chatbot.css';
const estados = { pendiente: 'Pendiente de respuesta', procesando: 'Preparando respuesta', respondida: 'Respondida', error: 'Error al responder' };
export default function ChatBot() {
  const [clientes, setClientes] = useState([]), [clienteId, setClienteId] = useState('');
  const [consultas, setConsultas] = useState([]), [mensaje, setMensaje] = useState('');
  const [errorClientes, setErrorClientes] = useState(''), [errorHistorial, setErrorHistorial] = useState(''), [errorEnvio, setErrorEnvio] = useState('');
  const [cargandoClientes, setCargandoClientes] = useState(true), [cargando, setCargando] = useState(false), [enviando, setEnviando] = useState(false);
  const [recargaClientes, setRecargaClientes] = useState(0), [recarga, setRecarga] = useState(0);
  const [ai, setAi] = useState(null), [errorAi, setErrorAi] = useState('');
  const envio = useRef(null), bloqueoEnvio = useRef(false), fin = useRef(null);
  const voice = useChatVoice(text => setMensaje(prev => [prev, text].filter(Boolean).join(' ')));
  const { stop: stopVoice } = voice;
  useEffect(() => {
    const controller = new AbortController();
    async function refreshStatus() {
      try {
        const status = await getAiStatus(controller.signal);
        if (!controller.signal.aborted) { setAi(status); setErrorAi(''); }
      } catch (error) { if (!controller.signal.aborted) { setAi(null); setErrorAi(error.message); } }
    }
    refreshStatus();
    const timer = setInterval(refreshStatus, 15000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [recarga]);
  useEffect(() => {
    const controller = new AbortController();
    setCargandoClientes(true); setErrorClientes('');
    listClientes(controller.signal).then(items => { if (!controller.signal.aborted) setClientes(items); }).catch(error => {
      if (!controller.signal.aborted) setErrorClientes(error.message);
    }).finally(() => { if (!controller.signal.aborted) setCargandoClientes(false); });
    return () => controller.abort();
  }, [recargaClientes]);
  useEffect(() => {
    if (!clienteId) return undefined;
    const controller = new AbortController();
    let timer;
    setCargando(true); setErrorHistorial('');
    async function cargar(initial) {
      try {
        const items = await listConsultas(clienteId, controller.signal);
        if (controller.signal.aborted) return;
        setConsultas(items); setErrorHistorial('');
        if (items.some(item => ['pendiente', 'procesando'].includes(item.estado_respuesta))) timer = setTimeout(() => cargar(false), 5000);
      } catch (error) { if (!controller.signal.aborted) setErrorHistorial(error.message); }
      finally { if (initial && !controller.signal.aborted) setCargando(false); }
    }
    cargar(true);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [clienteId, recarga]);
  useEffect(() => () => envio.current?.abort(), []);
  useEffect(() => { fin.current?.scrollIntoView?.({ block: 'nearest' }); }, [consultas, enviando]);
  function seleccionar(event) {
    envio.current?.abort(); envio.current = null; bloqueoEnvio.current = false; stopVoice();
    setClienteId(event.target.value); setConsultas([]); setMensaje(''); setErrorEnvio(''); setErrorHistorial(''); setEnviando(false); setCargando(Boolean(event.target.value));
  }
  async function enviar(event) {
    event.preventDefault();
    const texto = mensaje.trim();
    if (!texto || !clienteId || bloqueoEnvio.current || cargando || errorHistorial || !ai?.enabled) return;
    stopVoice();
    const controller = new AbortController();
    envio.current = controller; bloqueoEnvio.current = true; setEnviando(true); setErrorEnvio('');
    try {
      const item = await createConsulta(clienteId, texto, controller.signal);
      if (controller.signal.aborted) return;
      setConsultas(prev => [...prev.filter(c => c.id_consulta !== item.id_consulta), item]);
      setMensaje(''); setRecarga(value => value + 1);
    } catch (error) {
      if (!controller.signal.aborted) setErrorEnvio(error.message + ' El borrador se conserva. Antes de reenviar, actualiza el historial para comprobar si se guardó.');
    } finally {
      if (envio.current === controller) { bloqueoEnvio.current = false; setEnviando(false); envio.current = null; }
    }
  }
  const cliente = clientes.find(item => String(item.id_cliente ?? item.id) === clienteId);
  const disabled = !cliente || cargando || enviando || Boolean(errorHistorial) || !ai?.enabled;
  const respondidas = consultas.filter(item => item.estado_respuesta === 'respondida').length;
  function fecha(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('es-ES');
  }
  return <section className="panel chat-panel customer-chat" aria-labelledby="chat-title">
    <div className="panel-heading"><div className="heading-title"><Bot className="heading-icon" size={36} /><div><h2 id="chat-title">SofíaIA · Atención al cliente</h2><p>Conversaciones e historial de consultas de tus clientes.</p></div></div><span className={'chat-connection ' + (ai?.enabled ? 'ready' : '')} role="status">{ai?.enabled ? 'Asistente activado' : errorAi ? 'Sin conexión con el asistente' : ai ? 'Asistente desactivado' : 'Comprobando asistente…'}</span></div>
    <div className="chat-customer-toolbar">
      <label htmlFor="chat-cliente">Cliente<select id="chat-cliente" value={clienteId} onChange={seleccionar} disabled={cargandoClientes}><option value="">{cargandoClientes ? 'Cargando clientes…' : 'Selecciona un cliente'}</option>{clientes.map(item => <option key={item.id_cliente ?? item.id} value={item.id_cliente ?? item.id}>{item.nombre} · #{item.id_cliente ?? item.id}</option>)}</select></label>
      <button type="button" className="chat-secondary" disabled={cargandoClientes} onClick={() => setRecargaClientes(v => v + 1)}><RefreshCw size={16} /> Recargar clientes</button>
      <button type="button" className="chat-secondary" disabled={!clienteId || cargando || enviando} onClick={() => setRecarga(v => v + 1)}><RefreshCw size={16} /> Actualizar historial</button>
    </div>
    {errorClientes && <p role="alert" className="chat-error">{errorClientes}</p>}
    {errorAi && <p role="alert" className="chat-error">{errorAi} Puedes consultar el historial y volver a comprobar con «Actualizar historial».</p>}
    {ai && !ai.enabled && <p role="alert" className="chat-error">El asistente está desactivado en el servidor. Puedes consultar el historial, pero no enviar nuevas preguntas hasta que se active.</p>}
    {!cargandoClientes && !errorClientes && !clientes.length && <p className="chat-info">No hay clientes registrados en la base de datos.</p>}
    {cliente && <div className="chat-customer-card"><div><h3 className="chat-customer-title">{cliente.nombre}</h3><span>Cliente #{cliente.id_cliente ?? cliente.id}</span></div><div className="chat-counts"><strong>{consultas.length} consultas</strong><span>{respondidas} respondidas · {consultas.length - respondidas} por resolver</span></div></div>}
    <p role="status" className="chat-status">{cargando ? 'Cargando historial…' : enviando ? 'Guardando consulta…' : voice.listening ? 'Escuchando. Pulsa detener cuando termines.' : ''}</p>
    {errorHistorial && <p role="alert" className="chat-error">{errorHistorial} Pulsa «Actualizar historial» para reintentar.</p>}
    <div className="messages chat-history" aria-label="Historial de consultas" aria-busy={cargando}>
      {!clienteId && <p className="empty">Selecciona un cliente para ver únicamente sus consultas.</p>}
      {clienteId && !cargando && !errorHistorial && !consultas.length && <p className="empty">Este cliente todavía no tiene consultas. Escribe la primera.</p>}
      {consultas.map(item => <article className="chat-query" key={item.id_consulta}>
        <div className="chat-query-meta"><span>Consulta #{item.id_consulta} {fecha(item.fecha_creacion) && '· ' + fecha(item.fecha_creacion)}</span><span className={'chat-query-state state-' + item.estado_respuesta}>{estados[item.estado_respuesta] || 'Estado desconocido'}</span></div>
        <div className="message-line user"><div className="bubble">{item.Consulta}</div></div>
        {item.Respuesta ? <div className="message-line bot"><span className="message-avatar"><Bot size={22} /></span><div className="chat-answer"><div className="bubble">{item.Respuesta}</div><button type="button" className="chat-secondary" disabled={!voice.canSpeak} onClick={() => voice.speak(item.Respuesta)} aria-label={'Escuchar respuesta a consulta ' + item.id_consulta}><Volume2 size={16} /> Escuchar respuesta</button>{item.estado_respuesta !== 'respondida' && <small>Respuesta guardada; consulta aún no marcada como respondida.</small>}</div></div> : <p className="chat-pending">{item.estado_respuesta === 'error' ? 'No se pudo generar una respuesta. Requiere revisión del equipo responsable.' : item.estado_respuesta === 'respondida' ? 'Consulta marcada como respondida, sin texto de respuesta.' : 'Todavía no hay respuesta guardada.'}</p>}
      </article>)}<div ref={fin} />
    </div>
    <form className="chat-composer" onSubmit={enviar}>
      <button type="button" className="round-tool" disabled={disabled || !voice.canRecognize} onClick={voice.listening ? voice.finishListening : voice.listen} aria-label={voice.listening ? 'Detener dictado' : 'Dictar mensaje'} title={voice.canRecognize ? 'Dictar en español' : 'Dictado no disponible'}>{voice.listening ? <MicOff size={19} /> : <Mic size={19} />}</button>
      <input disabled={disabled} maxLength={8000} value={mensaje} onChange={event => setMensaje(event.target.value)} placeholder={cliente ? 'Escribe la consulta de ' + cliente.nombre + '…' : 'Selecciona un cliente para empezar'} aria-label="Nueva consulta del cliente" />
      <button type="submit" className="send-button" disabled={disabled || !mensaje.trim()} aria-label="Guardar y enviar consulta"><Send size={18} /></button>
    </form>
    <div className="chat-voice-controls"><button type="button" className="chat-secondary" onClick={stopVoice}><Square size={15} /> Detener voz</button><span>{voice.canSpeak ? 'Pulsa «Escuchar respuesta» para iniciar la lectura.' : 'Lectura por voz no disponible.'} {!voice.canRecognize && 'Puedes escribir tus consultas.'}</span></div>
    {voice.notice && <p role="status" className="inline-notice">{voice.notice}</p>}
    {errorEnvio && <p role="alert" className="chat-error">{errorEnvio}</p>}
    <p className="chat-footnote">Las consultas y respuestas se guardan en el historial del cliente. Las respuestas pendientes aparecen automáticamente cuando están listas.</p>
  </section>;
}


import React, {useCallback, useEffect, useState} from 'react';
import {Users, Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, X, Save, RefreshCw, ClipboardList} from 'lucide-react';
import {clientesApi, consultasApi} from '../api/client';

const vacio = {nombre:'', apellido:'', correo:'', telefono:'', descripcion:''};
const consultaVacia = {id:'', Consulta:'', Respuesta:'', estado_respuesta:'pendiente'};
const PER_PAGE = 5;
const nombreCompleto = c => { const n=(c.nombre||'').trim(); const a=(c.apellido||'').trim(); return a && !n.toLowerCase().endsWith((' '+a).toLowerCase()) ? `${n} ${a}` : n; };
const nombreBase = c => { const n=(c.nombre||'').trim(); const a=(c.apellido||'').trim(); return a && n.toLowerCase().endsWith((' '+a).toLowerCase()) ? n.slice(0,-a.length).trim() : n; };

export default function Clientes(){
  const [vista,setVista]=useState('clientes');
  const [clientes,setClientes]=useState([]);
  const [consultas,setConsultas]=useState([]);
  const [busqueda,setBusqueda]=useState('');
  const [pagina,setPagina]=useState(1);
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [form,setForm]=useState(vacio);
  const [cargando,setCargando]=useState(true);
  const [guardando,setGuardando]=useState(false);
  const [error,setError]=useState('');
  const [exito,setExito]=useState('');

  const cargar = useCallback(async () => {
    setCargando(true);setError('');
    try {
      // Se leen hasta 1000 registros en lotes de 100: la API limita cada lote a 100.
      const leerTodos = async fn => {
        const first=await fn(100,0);
        let items=first.items || [];
        const max=Math.min(Number(first.total)||items.length,1000);
        for(let offset=100;offset<max;offset+=100){const next=await fn(100,offset);items=items.concat(next.items||[]);}
        return items;
      };
      const [c, q]=await Promise.all([leerTodos(clientesApi.listar),leerTodos(consultasApi.listar)]);
      setClientes(c);setConsultas(q);
    } catch(e){setError(e.message);} finally {setCargando(false);}
  },[]);
  useEffect(()=>{cargar();},[cargar]);

  const datos=vista==='clientes'?clientes:consultas;
  const filtrados=datos.filter(c => (vista==='clientes'
    ? `${nombreCompleto(c)} ${c.correo||c.email||''} ${c.telefono||''}`
    : `${c.Consulta||''} ${c.Respuesta||''} ${nombreCompleto(c)} ${c.estado_respuesta||''}`)
    .toLowerCase().includes(busqueda.trim().toLowerCase()));
  const totalPaginas=Math.max(1,Math.ceil(filtrados.length/PER_PAGE));
  const paginaActual=Math.min(pagina,totalPaginas);
  const visibles=filtrados.slice((paginaActual-1)*PER_PAGE,paginaActual*PER_PAGE);
  const cambiarVista=v=>{setVista(v);setPagina(1);setBusqueda('');setError('');setExito('');};
  function nuevo(){setEditando(null);setForm(vista==='clientes'?{...vacio}:{...consultaVacia,id:clientes[0]?.id_cliente||clientes[0]?.id||''});setModal(true);setError('');}
  function editar(c){setEditando(vista==='clientes'?c.id_cliente:c.id_consulta);setForm(vista==='clientes'?{
    nombre:nombreBase(c),apellido:c.apellido||'',correo:c.email||c.correo||'',telefono:c.telefono||'',descripcion:c.descripcion||''
  }:{id:c.id,Consulta:c.Consulta||'',Respuesta:c.Respuesta||'',estado_respuesta:c.estado_respuesta||'pendiente'});setModal(true);setError('');}
  async function guardar(e){
    e.preventDefault();setGuardando(true);setError('');setExito('');
    try{
      if(vista==='clientes'){
        const payload={nombre:form.nombre.trim(),apellido:form.apellido.trim(),email:form.correo.trim()||null,telefono:form.telefono.trim()||null,descripcion:form.descripcion.trim()||null};
        if(editando!==null) await clientesApi.editar(editando,payload);else await clientesApi.crear(payload);
      }else if(editando!==null){
        await consultasApi.editar(editando,{Consulta:form.Consulta.trim(),Respuesta:form.Respuesta.trim()||null,estado_respuesta:form.estado_respuesta});
      }else{
        await consultasApi.crear({id:Number(form.id),Consulta:form.Consulta.trim()});
      }
      setModal(false);setPagina(1);setExito(`${vista==='clientes'?'Cliente':'Consulta'} ${editando!==null?'actualizado/a':'creado/a'} correctamente.`);
      await cargar();
    }catch(err){setError(err.message);}finally{setGuardando(false);}
  }
  async function borrar(c){
    const id=vista==='clientes'?c.id_cliente:c.id_consulta;
    const titulo=vista==='clientes'?nombreCompleto(c):`consulta #${id}`;
    const warning=vista==='clientes'?' También se eliminarán las consultas asociadas a este cliente.':'';
    if(!window.confirm(`¿Eliminar ${titulo}?${warning} Esta acción no se puede deshacer.`))return;
    setGuardando(true);setError('');setExito('');
    try{
      if(vista==='clientes')await clientesApi.eliminar(id);else await consultasApi.eliminar(id);
      setExito('Registro eliminado correctamente.');await cargar();
    }catch(e){setError(e.message);}finally{setGuardando(false);}
  }
  return <section className="panel clients-panel">
    <div className="panel-heading"><div className="heading-title"><Users className="heading-icon" size={35}/><div><h2>Gestión de Clientes</h2><p>Altas, consultas, modificaciones y bajas conectadas a MySQL.</p></div></div>
    <button className="action-button" onClick={nuevo} disabled={cargando||guardando||(vista==='consultas'&&!clientes.length)}><Plus size={18}/> {vista==='clientes'?'Nuevo Cliente':'Nueva Consulta'}</button></div>
    <div className="crud-view-switch" aria-label="Tipo de registro"><button className={vista==='clientes'?'selected':''} onClick={()=>cambiarVista('clientes')}><Users size={16}/> Clientes</button><button className={vista==='consultas'?'selected':''} onClick={()=>cambiarVista('consultas')}><ClipboardList size={16}/> Consultas</button><button className="crud-refresh" onClick={cargar} title="Actualizar registros" disabled={cargando}><RefreshCw size={16}/> Actualizar</button></div>
    {error&&<div className="crud-alert crud-error" role="alert">{error}</div>}{exito&&<div className="crud-alert crud-success" role="status">{exito}</div>}
    <div className="search-field"><Search size={19}/><input value={busqueda} onChange={e=>{setBusqueda(e.target.value);setPagina(1);}} placeholder={vista==='clientes'?'Buscar cliente...':'Buscar consulta...'} aria-label="Buscar"/></div>
    <div className="table-wrap"><table><thead>{vista==='clientes'?<tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Acciones</th></tr>:<tr><th>ID</th><th>Cliente</th><th>Consulta</th><th>Estado</th><th>Acciones</th></tr>}</thead><tbody>{visibles.map(c=>vista==='clientes'?<tr key={c.id_cliente}><td>{c.id_cliente}</td><td>{nombreCompleto(c)}</td><td>{c.email||'—'}</td><td>{c.telefono||'—'}</td><td><div className="table-actions"><button aria-label={'Editar '+nombreCompleto(c)} title="Editar" disabled={guardando} onClick={()=>editar(c)} className="icon-btn"><Pencil size={16}/></button><button aria-label={'Eliminar '+nombreCompleto(c)} title="Eliminar" disabled={guardando} onClick={()=>borrar(c)} className="icon-btn danger"><Trash2 size={16}/></button></div></td></tr>:<tr key={c.id_consulta}><td>{c.id_consulta}</td><td>{nombreCompleto(c)}</td><td title={c.Consulta}>{c.Consulta}</td><td>{c.estado_respuesta}</td><td><div className="table-actions"><button aria-label={'Editar consulta '+c.id_consulta} disabled={guardando} onClick={()=>editar(c)} className="icon-btn"><Pencil size={16}/></button><button aria-label={'Eliminar consulta '+c.id_consulta} disabled={guardando} onClick={()=>borrar(c)} className="icon-btn danger"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table>{cargando?<p className="empty">Cargando registros de MySQL...</p>:visibles.length===0&&<p className="empty">No se encontraron {vista}.</p>}</div>
    <div className="table-footer"><span>Mostrando {filtrados.length===0?0:(paginaActual-1)*PER_PAGE+1} – {Math.min(paginaActual*PER_PAGE,filtrados.length)} de {filtrados.length} {vista}</span><div className="pagination"><button disabled={paginaActual===1} onClick={()=>setPagina(p=>p-1)} aria-label="Página anterior"><ChevronLeft size={18}/></button><span>{paginaActual}</span><button disabled={paginaActual===totalPaginas} onClick={()=>setPagina(p=>p+1)} aria-label="Página siguiente"><ChevronRight size={18}/></button></div></div>
    {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!guardando)setModal(false);}}><form className="modal" onSubmit={guardar}><div className="modal-heading"><h3>{editando!==null?'Editar':'Nuevo'} {vista==='clientes'?'cliente':'consulta'}</h3><button type="button" disabled={guardando} onClick={()=>setModal(false)} aria-label="Cerrar"><X/></button></div>
      {vista==='clientes'?<><label>Nombre *<input required maxLength={50} value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></label><label>Apellidos<input maxLength={50} value={form.apellido} onChange={e=>setForm({...form,apellido:e.target.value})}/></label><label>Correo<input type="email" maxLength={100} value={form.correo} onChange={e=>setForm({...form,correo:e.target.value})}/></label><label>Teléfono<input maxLength={20} value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})}/></label><label>Descripción<textarea rows={3} value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})}/></label></>:
      <><label>Cliente *<select required value={form.id} disabled={editando!==null} onChange={e=>setForm({...form,id:e.target.value})}><option value="">Elige un cliente</option>{clientes.map(c=><option key={c.id_cliente} value={c.id_cliente}>{nombreCompleto(c)} (#{c.id_cliente})</option>)}</select></label><label>Consulta *<textarea required rows={3} value={form.Consulta} onChange={e=>setForm({...form,Consulta:e.target.value})}/></label>{editando!==null&&<><label>Respuesta<textarea rows={3} value={form.Respuesta} onChange={e=>setForm({...form,Respuesta:e.target.value})}/></label><label>Estado<select value={form.estado_respuesta} onChange={e=>setForm({...form,estado_respuesta:e.target.value})}>{['pendiente','procesando','respondida','error'].map(s=><option key={s} value={s}>{s}</option>)}</select></label></>}</>}
      {error&&<div className="crud-alert crud-error" role="alert">{error}</div>}
      <button className="action-button modal-save" type="submit" disabled={guardando}><Save size={18}/>{guardando?'Guardando...':'Guardar'}</button></form></div>}
  </section>;
}
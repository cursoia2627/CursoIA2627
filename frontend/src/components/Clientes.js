import React, {useState} from 'react';
import {Users, Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, X, Save} from 'lucide-react';
const vacio = {nombre:'', correo:'', telefono:''};
export default function Clientes({clientes,setClientes}) {
  const [busqueda,setBusqueda]=useState('');
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [form,setForm]=useState(vacio);
  const [pagina,setPagina]=useState(1);
  const porPagina=5;
  const filtrados=clientes.filter(c=>`${c.nombre} ${c.correo} ${c.telefono}`.toLowerCase().includes(busqueda.toLowerCase()));
  const totalPaginas=Math.max(1,Math.ceil(filtrados.length/porPagina));
  const paginaActual=Math.min(pagina,totalPaginas);
  const visibles=filtrados.slice((paginaActual-1)*porPagina,paginaActual*porPagina);
  function nuevo(){setEditando(null);setForm(vacio);setModal(true);}
  function editar(c){setEditando(c.id);setForm({nombre:c.nombre,correo:c.correo,telefono:c.telefono});setModal(true);}
  function guardar(e){e.preventDefault();if(editando!==null){setClientes(prev=>prev.map(c=>c.id===editando?{...c,...form}:c));}else{setClientes(prev=>[...prev,{...form,id:Date.now()}]);}setModal(false);}
  function borrar(c){if(window.confirm(`¿Eliminar a ${c.nombre}?`))setClientes(prev=>prev.filter(x=>x.id!==c.id));}
  return <section className="panel clients-panel">
    <div className="panel-heading"><div className="heading-title"><Users className="heading-icon" size={35}/><div><h2>Gestión de Clientes</h2><p>Administra la información de tus clientes.</p></div></div><button className="action-button" onClick={nuevo}><Plus size={18}/> Nuevo Cliente</button></div>
    <div className="search-field"><Search size={19}/><input value={busqueda} onChange={e=>{setBusqueda(e.target.value);setPagina(1);}} placeholder="Buscar cliente..." aria-label="Buscar cliente" /></div>
    <div className="table-wrap"><table><thead><tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Acciones</th></tr></thead><tbody>{visibles.map((c,i)=><tr key={c.id}><td>{(paginaActual-1)*porPagina+i+1}</td><td>{c.nombre}</td><td>{c.correo}</td><td>{c.telefono}</td><td><div className="table-actions"><button aria-label={'Editar '+c.nombre} title="Editar" onClick={()=>editar(c)} className="icon-btn"><Pencil size={16}/></button><button aria-label={'Eliminar '+c.nombre} title="Eliminar" onClick={()=>borrar(c)} className="icon-btn danger"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table>{visibles.length===0&&<p className="empty">No se encontraron clientes.</p>}</div>
    <div className="table-footer"><span>Mostrando {filtrados.length===0?0:(paginaActual-1)*porPagina+1} – {Math.min(paginaActual*porPagina,filtrados.length)} de {filtrados.length} clientes</span><div className="pagination"><button disabled={paginaActual===1} onClick={()=>setPagina(p=>p-1)} aria-label="Página anterior"><ChevronLeft size={18}/></button><span>{paginaActual}</span><button disabled={paginaActual===totalPaginas} onClick={()=>setPagina(p=>p+1)} aria-label="Página siguiente"><ChevronRight size={18}/></button></div></div>
    {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false);}}><form className="modal" onSubmit={guardar}><div className="modal-heading"><h3>{editando!==null?'Editar cliente':'Nuevo cliente'}</h3><button type="button" onClick={()=>setModal(false)} aria-label="Cerrar"><X/></button></div><label>Nombre<input required maxLength="100" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></label><label>Correo<input required type="email" value={form.correo} onChange={e=>setForm({...form,correo:e.target.value})}/></label><label>Teléfono<input value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})}/></label><button className="action-button modal-save" type="submit"><Save size={18}/> Guardar cliente</button></form></div>}
  </section>;
}

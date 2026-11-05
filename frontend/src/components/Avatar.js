import React,{useState} from 'react';
import {UserRound, Sparkles, Pencil, Plus, Check} from 'lucide-react';
export default function Avatar({avatares,setAvatares}){
  const [seleccionado,setSeleccionado]=useState(1);
  const activo=avatares.find(a=>a.id===seleccionado)||avatares[0];
  const [nombre,setNombre]=useState(activo?.nombre||'');
  const [genero,setGenero]=useState(activo?.genero||'Femenino');
  const [estilo,setEstilo]=useState(activo?.estilo||'Profesional');
  const [descripcion,setDescripcion]=useState(activo?.descripcion||'');
  const [confirmacion,setConfirmacion]=useState('');
  function elegir(a){setSeleccionado(a.id);setNombre(a.nombre);setGenero(a.genero);setEstilo(a.estilo);setDescripcion(a.descripcion);setConfirmacion('');}
  function nuevo(){setSeleccionado(null);setNombre('');setGenero('Femenino');setEstilo('Profesional');setDescripcion('');setConfirmacion('');}
  function guardar(e){e.preventDefault();const data={nombre:nombre.trim(),genero,estilo,descripcion,rol:descripcion.slice(0,32)||'Asistente virtual'};if(seleccionado===null){const id=Date.now();setAvatares(prev=>[...prev,{...data,id,imagen:'/assets/avatar-sofia.png'}]);setSeleccionado(id);}else{setAvatares(prev=>prev.map(a=>a.id===seleccionado?{...a,...data}:a));}setConfirmacion('Configuración del avatar guardada. La generación de nuevas imágenes necesita un servicio de IA.');}
  return <section className="panel avatar-panel"><div className="panel-heading"><div className="heading-title"><UserRound className="heading-icon" size={38}/><div><h2>Avatar – Crea tu asistente</h2><p>Personaliza un avatar con IA para representar tu marca o proyecto.</p></div></div></div>
    <div className="avatar-layout"><form className="avatar-form" onSubmit={guardar}><label>Nombre del avatar <span className="required">*</span><input required value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="SofíaIA"/></label><label>Estilo<select value={estilo} onChange={e=>setEstilo(e.target.value)}><option>Profesional</option><option>Moderno</option><option>Creativo</option><option>Amigable</option></select></label><label>Género<select value={genero} onChange={e=>setGenero(e.target.value)}><option>Femenino</option><option>Masculino</option><option>Neutro</option></select></label><label>Descripción / Rol<textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} rows="3" placeholder="Describe la función de tu avatar"/></label><button className="action-button avatar-save" type="submit"><Sparkles size={18}/> {seleccionado===null?'Crear avatar':'Guardar avatar'}</button>{confirmacion&&<p className="success-msg"><Check size={16}/>{confirmacion}</p>}</form>
    <div className="avatar-preview"><img src={activo?.imagen||'/assets/avatar-sofia.png'} alt={'Vista previa del avatar '+(nombre||'nuevo')}/><strong>{nombre||'Nuevo avatar'}</strong><small>{descripcion.slice(0,55)||'Personaliza tu asistente'}</small></div>
    <aside className="avatar-gallery"><div className="gallery-head"><h3>Mis Avatares</h3><button onClick={nuevo} title="Nuevo avatar" aria-label="Crear otro avatar"><Plus size={19}/></button></div>{avatares.map(a=><button key={a.id} onClick={()=>elegir(a)} className={'avatar-item '+(a.id===seleccionado?'selected':'')}><img src={a.imagen} alt=""/><span><strong>{a.nombre}</strong><small>{a.rol}</small></span>{a.id===seleccionado&&<Pencil size={14}/>}</button>)}</aside></div>
  </section>;
}

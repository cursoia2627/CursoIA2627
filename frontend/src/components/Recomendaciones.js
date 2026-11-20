import React,{useEffect,useState} from 'react';
import {Lightbulb,Sparkles,RefreshCw} from 'lucide-react';
import {API_BASE} from '../api/url';
async function solicitar(path,options={}){
 const response=await fetch(`${API_BASE}${path}`,{
  ...options,
  credentials:'include',
  cache:'no-store',
  headers:{'Content-Type':'application/json',...options.headers}
 });
 const body=await response.json().catch(()=>({}));
 if(response.status===401){
  window.dispatchEvent(new Event('auth:expired'));
  throw new Error('La sesión ha caducado. Vuelve a iniciar sesión.');
 }
 if(!response.ok)throw new Error(body.message||body.error||`Error HTTP ${response.status}`);
 return body.data??body;
}
function obtenerLista(datos){
 if(Array.isArray(datos))return datos;
 if(Array.isArray(datos?.items))return datos.items;
 if(Array.isArray(datos?.clientes))return datos.clientes;
 if(Array.isArray(datos?.recomendaciones))return datos.recomendaciones;
 return [];
}
export default function Recomendaciones(){
 const [clientes,setClientes]=useState([]);
 const [clienteId,setClienteId]=useState('');
 const [necesidad,setNecesidad]=useState('');
 const [recomendaciones,setRecomendaciones]=useState([]);
 const [cargando,setCargando]=useState(false);
 const [error,setError]=useState('');
 const [aviso,setAviso]=useState('');
 useEffect(()=>{
  let activo=true;
  solicitar('/clientes?limit=100&offset=0').then(datos=>{
   if(activo)setClientes(obtenerLista(datos));
  }).catch(e=>{
   if(activo)setError('No se pudieron cargar los clientes: '+e.message);
  });
  solicitar('/recomendaciones').then(datos=>{
   if(activo)setRecomendaciones(obtenerLista(datos));
  }).catch(e=>{
   if(activo)setAviso('No se pudo consultar el historial: '+e.message);
  });
  return ()=>{activo=false;};
 },[]);
 async function generar(e){
  e.preventDefault();
  if(!clienteId||!necesidad.trim())return;
  setCargando(true);
  setError('');
  setAviso('');
  try{
   const resultado=await solicitar('/recomendaciones/generar',{
    method:'POST',
    body:JSON.stringify({cliente_id:Number(clienteId),necesidad:necesidad.trim()})
   });
   if(resultado)setRecomendaciones(prev=>[resultado,...prev]);
   setNecesidad('');
   setAviso('Recomendación generada y guardada correctamente.');
  }catch(e){
   setError('No se pudo generar la recomendación: '+e.message);
  }finally{
   setCargando(false);
  }
 }
 return <div className="dash-subcontent recomendaciones">
  <h3><Lightbulb size={21}/> Recomendaciones con IA</h3>
  <p>Genera recomendaciones personalizadas según las necesidades de cada cliente.</p>
  <form className="recom-form" onSubmit={generar}>
   <label>Seleccionar cliente
    <select value={clienteId} onChange={e=>setClienteId(e.target.value)} required>
     <option value="">Selecciona un cliente</option>
     {clientes.map(c=><option key={c.id_cliente} value={c.id_cliente}>
      {c.nombre} {c.apellido||''}
     </option>)}
    </select>
   </label>
   <label>Necesidad del cliente
    <textarea rows="4" maxLength={2000} value={necesidad}
     onChange={e=>setNecesidad(e.target.value)}
     placeholder="Describe qué necesita el cliente..." required/>
   </label>
   <button className="recom-button" type="submit" disabled={cargando}>
    {cargando?<RefreshCw size={18}/>:<Sparkles size={18}/>}
    {cargando?'Generando...':'Generar recomendación con IA'}
   </button>
  </form>
  {error&&<p className="recom-error">{error}</p>}
  {aviso&&<p className="recom-aviso">{aviso}</p>}
  <h3>Historial de recomendaciones</h3>
  <div className="dash-table-scroll">
   <table className="dash-detail-table">
    <thead><tr><th>ID</th><th>Cliente</th><th>Necesidad</th><th>Recomendación</th></tr></thead>
    <tbody>
     {recomendaciones.map((r,i)=><tr key={r.id||i}>
      <td>{r.id||'-'}</td>
      <td>{r.cliente_nombre||r.cliente_id||'-'}</td>
      <td>{r.necesidad||'-'}</td>
      <td>{r.recomendacion||r.descripcion||'-'}</td>
     </tr>)}
     {!recomendaciones.length&&<tr>
      <td colSpan="4">Todavía no hay recomendaciones disponibles.</td>
     </tr>}
    </tbody>
   </table>
  </div>
 </div>;
}
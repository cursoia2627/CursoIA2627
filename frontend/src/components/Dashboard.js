import React,{useState} from 'react';
import {LayoutDashboard,Users,MessageSquare,CheckCircle2,Clock3,Eye,BarChart3,PieChart,Tags,AlertCircle,Lightbulb} from 'lucide-react';
import Recomendaciones from './Recomendaciones';
const dias=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const valores=[20,31,26,33,36,46,39];
const puntos=valores.map((v,i)=>`${30+i*90},${195-v*3}`).join(' ');
const tipos=[
 {nombre:'Estado de pedido',porcentaje:38,clase:'pedido'},
 {nombre:'Horarios',porcentaje:20,clase:'horarios'},
 {nombre:'Devoluciones',porcentaje:15,clase:'devoluciones'},
 {nombre:'Cambios de entrega',porcentaje:12,clase:'entregas'},
 {nombre:'Otras',porcentaje:15,clase:'otras'}
];
const urgencias=[
 {nivel:'Alta',cantidad:12,clase:'alta'},
 {nivel:'Media',cantidad:36,clase:'media'},
 {nivel:'Baja',cantidad:80,clase:'baja'}
];
const actividades=[
 {hora:'10:24',descripcion:'¿Dónde está mi pedido?',resultado:'Resuelta'},
 {hora:'10:17',descripcion:'Quiero devolver un producto',resultado:'Resuelta'},
 {hora:'10:05',descripcion:'¿A qué hora abrís?',resultado:'Resuelta'},
 {hora:'09:58',descripcion:'Quiero hablar con una persona',resultado:'Derivada a humano'}
];
const secciones=[
 {id:'categorias',nombre:'Conversaciones por categoría',icono:Tags},
 {id:'urgencias',nombre:'Conversaciones por urgencia',icono:AlertCircle},
 {id:'graficas',nombre:'Gráficas',icono:BarChart3},
 {id:'recomendaciones',nombre:'Recomendaciones',icono:Lightbulb}
];
export default function Dashboard({visitas=0}){
 const [seccion,setSeccion]=useState('graficas');
 const indicadores=[
  {nombre:'Clientes',valor:'24',detalle:'Datos de ejemplo',icono:Users,clase:'clientes'},
  {nombre:'Conversaciones',valor:'128',detalle:'Datos de ejemplo',icono:MessageSquare,clase:'chat'},
  {nombre:'Consultas resueltas',valor:'92 %',detalle:'Datos de ejemplo',icono:CheckCircle2,clase:'resueltas'},
  {nombre:'Tiempo medio de respuesta',valor:'3,4 s',detalle:'Datos de ejemplo',icono:Clock3,clase:'tiempo'},
  {nombre:'Visitas al Dashboard',valor:visitas,detalle:'En este navegador',icono:Eye,clase:'visitas'}
 ];
 return <section className="dashboard">
  <div className="dash-heading">
   <LayoutDashboard size={27}/>
   <div><h2>Dashboard</h2><p>Resumen de actividad, estadísticas y recomendaciones con IA</p></div>
  </div>
  <div className="dash-stats">
   {indicadores.map(item=><article className={'dash-stat dash-stat-'+item.clase} key={item.nombre}>
    <span className="dash-stat-icon"><item.icono size={26}/></span>
    <div><h3>{item.nombre}</h3><strong>{item.valor}</strong><small>{item.detalle}</small></div>
   </article>)}
  </div>
  <div className="dash-contenedor">
   <div className="dash-subtabs">
    {secciones.map(item=><button key={item.id} type="button" className={'dash-subtab '+(seccion===item.id?'active':'')} onClick={()=>setSeccion(item.id)}>
     <item.icono size={17}/><span>{item.nombre}</span>
    </button>)}
   </div>
   {seccion==='categorias'&&<div className="dash-subcontent">
    <h3><Tags size={21}/> Conversaciones por categoría</h3>
    <p>Distribución de las conversaciones por categoría. Datos ilustrativos.</p>
    <div className="dash-table-scroll">
     <table className="dash-detail-table">
      <thead><tr><th>Categoría</th><th>Porcentaje</th></tr></thead>
      <tbody>{tipos.map(tipo=><tr key={tipo.nombre}>
       <td><span className={'dash-dot dash-dot-'+tipo.clase}/>{tipo.nombre}</td>
       <td>{tipo.porcentaje} %</td>
      </tr>)}</tbody>
     </table>
    </div>
   </div>}
   {seccion==='urgencias'&&<div className="dash-subcontent">
    <h3><AlertCircle size={21}/> Conversaciones por urgencia</h3>
    <p>Clasificación de conversaciones según su prioridad. Datos ilustrativos.</p>
    <div className="dash-table-scroll">
     <table className="dash-detail-table">
      <thead><tr><th>Urgencia</th><th>Conversaciones</th></tr></thead>
      <tbody>{urgencias.map(item=><tr key={item.nivel}>
       <td><span className={'dash-urgencia '+item.clase}>{item.nivel}</span></td>
       <td>{item.cantidad}</td>
      </tr>)}</tbody>
     </table>
    </div>
   </div>}
   {seccion==='graficas'&&<div className="dash-graphs">
    <article className="dash-card">
     <h3><BarChart3 size={22}/> Conversaciones por día</h3>
     <svg className="dash-line-chart" viewBox="0 0 600 220" role="img" aria-label="Gráfico de conversaciones por día con datos de ejemplo">
      {[0,10,20,30,40,50].map(n=><g key={n}>
       <line x1="30" x2="570" y1={195-n*3} y2={195-n*3} stroke="#e6e8ed"/>
       <text x="4" y={199-n*3} fontSize="12" fill="#697386">{n}</text>
      </g>)}
      <polygon points={`30,195 ${puntos} 570,195`} fill="#f0ba1930"/>
      <polyline points={puntos} fill="none" stroke="#dea400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {valores.map((v,i)=><circle key={i} cx={30+i*90} cy={195-v*3} r="5" fill="white" stroke="#dea400" strokeWidth="3"/>)}
     </svg>
     <div className="dash-days">{dias.map(dia=><span key={dia}>{dia}</span>)}</div>
    </article>
    <article className="dash-card">
     <h3><PieChart size={22}/> Tipos de consulta</h3>
     <div className="dash-types">
      <div className="dash-donut"><div><strong>128</strong><span>consultas</span></div></div>
      <div className="dash-legend">
       {tipos.map(tipo=><div key={tipo.nombre}>
        <span className={'dash-dot dash-dot-'+tipo.clase}/>
        <span>{tipo.nombre}</span>
        <strong>{tipo.porcentaje} %</strong>
       </div>)}
      </div>
     </div>
    </article>
   </div>}
   {seccion==='recomendaciones'&&<Recomendaciones/>}
  </div>
  <article className="dash-card dash-activity">
   <h3><MessageSquare size={22}/> Últimas actividades (ejemplo)</h3>
   <div className="dash-table-scroll">
    <table>
     <thead><tr><th>Hora</th><th>Descripción</th><th>Resultado</th></tr></thead>
     <tbody>{actividades.map((a,i)=><tr key={i}>
      <td>{a.hora}</td>
      <td>{a.descripcion}</td>
      <td><span className={a.resultado==='Resuelta'?'dash-ok':'dash-human'}>{a.resultado}</span></td>
     </tr>)}</tbody>
    </table>
   </div>
  </article>
 </section>;
}
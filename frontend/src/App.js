import React,{useEffect,useState} from 'react';
import {Users, MessageSquare, UserRound, Sun, Moon, Menu, X, Info, CircleUserRound} from 'lucide-react';
import Brand from './components/Brand';
import Clientes from './components/Clientes';
import ChatBot from './components/ChatBot';
import Avatar from './components/Avatar';
import CookieConsent from './components/CookieConsent';
import {conversacionesIniciales} from './data/demo';

const tabs=[{id:'clientes',label:'Clientes',icon:Users},{id:'chat',label:'Chat Bot',icon:MessageSquare},{id:'avatar',label:'Avatar',icon:UserRound}];
function useLocalStorage(key,initial){const [value,setValue]=useState(()=>{try{const saved=localStorage.getItem(key);return saved?JSON.parse(saved):initial;}catch{return initial;}});useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}},[key,value]);return [value,setValue];}
export default function App(){
 const [tab,setTab]=useState('clientes');
 const [menu,setMenu]=useState(false);
 const [dark,setDark]=useState(false);
 const [conversaciones,setConversaciones]=useLocalStorage('iat-conversaciones',conversacionesIniciales);
 function changeTab(next){setTab(next);setMenu(false);}
 return <div className={'site '+tab+'-theme '+(dark?'dark':'')}><div className="app-shell">
 <aside className={'sidebar '+(menu?'open':'')}><Brand/><nav aria-label="Menú principal">{tabs.map(t=><button key={t.id} className={'side-link '+(tab===t.id?'active':'')} onClick={()=>changeTab(t.id)}><t.icon size={19}/><span>{t.label}</span></button>)}</nav><div className="side-footer"><Info size={19}/><span>IA para Todos<br/>v1.0</span></div></aside>
 <main className="main"><header className="hero"><div className="mobile-bar"><Brand small/><button onClick={()=>setMenu(!menu)} aria-label={menu?'Cerrar menú':'Abrir menú'}>{menu?<X/>:<Menu/>}</button></div><div className="hero-copy"><h1><span>IA</span> para Todos</h1><p>Explora el poder de la inteligencia artificial<br className="desktop-break"/> en una sola plataforma.</p></div><img className="hero-hand" src="/assets/mano-boceto.png" alt="Ilustración de mano robótica dibujada a lápiz"/><div className="hero-wave wave-one"/><div className="hero-wave wave-two"/><div className="hero-actions"><button onClick={()=>setDark(!dark)} aria-label={dark?'Activar modo claro':'Activar modo oscuro'} title="Cambiar tema">{dark?<Moon/>:<Sun/>}</button><button title="Perfil de demostración" aria-label="Perfil"><CircleUserRound/></button></div></header>
 <div className="content"><div className="tabs" role="tablist" aria-label="Secciones">{tabs.map(t=><button role="tab" aria-selected={tab===t.id} key={t.id} className={'tab tab-'+t.id+' '+(tab===t.id?'active':'')} onClick={()=>changeTab(t.id)}><t.icon size={22}/><span>{t.label}</span></button>)}</div>
 {tab==='clientes'&&<Clientes/>}
 {tab==='chat'&&<ChatBot conversaciones={conversaciones} setConversaciones={setConversaciones}/>}
 {tab==='avatar'&&<Avatar/>}
 </div></main></div><CookieConsent/></div>;
}

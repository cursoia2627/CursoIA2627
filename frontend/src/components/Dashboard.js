import React, { useEffect, useState } from 'react';

import { LayoutDashboard, Users, MessageSquare, CheckCircle2, Clock3, Eye, BarChart3, PieChart, Tags, AlertCircle, Lightbulb } from 'lucide-react';

import Recomendaciones from './Recomendaciones';
import TablaCategorias from './TablaCategorias';
import TablaUrgencias from './TablaUrgencias';
import Graficas from './Graficas';

import { clientesApi, consultasApi } from '../api/client';

const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const valores = [20, 31, 26, 33, 36, 46, 39];
const puntos = valores.map((v, i) => `${30 + i * 90},${195 - v * 3}`).join(' ');
const tipos = [
    { nombre: 'Estado de pedido', porcentaje: 38, clase: 'pedido' },
    { nombre: 'Horarios', porcentaje: 20, clase: 'horarios' },
    { nombre: 'Devoluciones', porcentaje: 15, clase: 'devoluciones' },
    { nombre: 'Cambios de entrega', porcentaje: 12, clase: 'entregas' },
    { nombre: 'Otras', porcentaje: 15, clase: 'otras' }
];
const urgencias = [
    { nivel: 'Alta', cantidad: 12, clase: 'alta' },
    { nivel: 'Media', cantidad: 36, clase: 'media' },
    { nivel: 'Baja', cantidad: 80, clase: 'baja' }
];
const actividades = [
    { hora: '10:24', descripcion: '¿Dónde está mi pedido?', resultado: 'Resuelta' },
    { hora: '10:17', descripcion: 'Quiero devolver un producto', resultado: 'Resuelta' },
    { hora: '10:05', descripcion: '¿A qué hora abrís?', resultado: 'Resuelta' },
    { hora: '09:58', descripcion: 'Quiero hablar con una persona', resultado: 'Derivada a humano' }
];
const secciones = [
    { id: 'categorias', nombre: 'Conversaciones por categoría', icono: Tags },
    { id: 'urgencias', nombre: 'Conversaciones por urgencia', icono: AlertCircle },
    { id: 'graficas', nombre: 'Gráficas', icono: BarChart3 },
    { id: 'recomendaciones', nombre: 'Recomendaciones', icono: Lightbulb }
];
export default function Dashboard({ visitas = 0 }) {
    const [seccion, setSeccion] = useState('graficas');


    const [totales, setTotales] = useState({
        clientes: null,
        conversaciones: null
    });

    const [errorTotales, setErrorTotales] = useState(false);

    useEffect(() => {
        let activo = true;

        async function cargarTotales() {
            try {
                const [datosClientes, datosConsultas] = await Promise.all([
                    clientesApi.listar(1, 0),
                    consultasApi.listar(1, 0)
                ]);

                if (activo) {
                    setTotales({
                        clientes: datosClientes.total,
                        conversaciones: datosConsultas.total
                    });
                    setErrorTotales(false);
                }
            } catch (error) {
                if (activo) {
                    setErrorTotales(true);
                }
            }
        }

        cargarTotales();

        return () => {
            activo = false;
        };
    }, []);


    const indicadores = [

        {
            nombre: 'Clientes',
            valor: errorTotales ? '—' : totales.clientes ?? '...',
            detalle: errorTotales ? 'Error al cargar' : 'Registrados en MySQL',
            icono: Users,
            clase: 'clientes'
        },
        {
            nombre: 'Conversaciones',
            valor: errorTotales ? '—' : totales.conversaciones ?? '...',
            detalle: errorTotales ? 'Error al cargar' : 'Registradas en MySQL',
            icono: MessageSquare,
            clase: 'chat'
        },

        { nombre: 'Consultas resueltas', valor: '92 %', detalle: 'Datos de ejemplo', icono: CheckCircle2, clase: 'resueltas' },
        { nombre: 'Tiempo medio de respuesta', valor: '3,4 s', detalle: 'Datos de ejemplo', icono: Clock3, clase: 'tiempo' },
        { nombre: 'Visitas al Dashboard', valor: visitas, detalle: 'En este navegador', icono: Eye, clase: 'visitas' }
    ];
    return <section className="dashboard">
        <div className="dash-heading">
            <LayoutDashboard size={27} />
            <div><h2>Dashboard</h2><p>Resumen de actividad, estadísticas y recomendaciones con IA</p></div>
        </div>
        <div className="dash-stats">
            {indicadores.map(item => <article className={'dash-stat dash-stat-' + item.clase} key={item.nombre}>
                <span className="dash-stat-icon"><item.icono size={26} /></span>
                <div><h3>{item.nombre}</h3><strong>{item.valor}</strong><small>{item.detalle}</small></div>
            </article>)}
        </div>
        <div className="dash-contenedor">
            <div className="dash-subtabs">
                {secciones.map(item => <button key={item.id} type="button" className={'dash-subtab ' + (seccion === item.id ? 'active' : '')} onClick={() => setSeccion(item.id)}>
                    <item.icono size={17} /><span>{item.nombre}</span>
                </button>)}
            </div>


            {seccion === 'categorias' && (
                <div className="dash-subcontent">
                    <TablaCategorias />
                </div>
            )}




            {seccion === 'urgencias' && (
                <div className="dash-subcontent">
                    <TablaUrgencias />
                </div>
            )}






            {seccion === 'graficas' && <Graficas />}

            {seccion === 'recomendaciones' && <Recomendaciones />}
        </div>
        <article className="dash-card dash-activity">
            <h3><MessageSquare size={22} /> Últimas actividades (ejemplo)</h3>
            <div className="dash-table-scroll">
                <table>
                    <thead><tr><th>Hora</th><th>Descripción</th><th>Resultado</th></tr></thead>
                    <tbody>{actividades.map((a, i) => <tr key={i}>
                        <td>{a.hora}</td>
                        <td>{a.descripcion}</td>
                        <td><span className={a.resultado === 'Resuelta' ? 'dash-ok' : 'dash-human'}>{a.resultado}</span></td>
                    </tr>)}</tbody>
                </table>
            </div>
        </article>
    </section>;
}
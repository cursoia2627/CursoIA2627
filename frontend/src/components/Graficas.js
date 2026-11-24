import React, { useEffect, useState } from 'react';
import { BarChart3, PieChart } from 'lucide-react';
import { API_BASE } from '../api/url';

const COLORES_CATEGORIA = [
    '#ff870d',
    '#2874ed',
    '#43c17e',
    '#f0ba19',
    '#8b5cf6',
    '#ec4899',
    '#94a3b8'
];

const COLORES_URGENCIA = {
    alta: '#e5484d',
    media: '#f0ba19',
    baja: '#43c17e',
    'sin clasificar': '#94a3b8'
};

const PALETA_URGENCIA_FALLBACK = ['#e5484d', '#f0ba19', '#43c17e', '#94a3b8'];

function capitalizar(texto) {
    const str = String(texto || '').trim();
    if (!str) return 'Sin clasificar';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function solicitar(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) {
        window.dispatchEvent(new Event('auth:expired'));
        throw new Error('La sesión ha caducado. Vuelve a iniciar sesión.');
    }
    if (!response.ok) {
        throw new Error(body?.error?.message || body?.message || body?.error || `Error HTTP ${response.status}`);
    }
    return body.data ?? body;
}

export default function Graficas() {
    const [categorias, setCategorias] = useState([]);
    const [urgencias, setUrgencias] = useState([]);
    const [satisfaccion, setSatisfaccion] = useState({ categorias: [], urgencias: [] });
    const [errorSatisfaccion, setErrorSatisfaccion] = useState('');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let activo = true;
        setCargando(true);
        setError('');

        solicitar('/consultas/resumen/satisfaccion')
            .then((datos) => {
                if (!activo) return;
                setSatisfaccion({
                    categorias: Array.isArray(datos?.categorias) ? datos.categorias : [],
                    urgencias: Array.isArray(datos?.urgencias) ? datos.urgencias : []
                });
            })
            .catch((err) => {
                if (activo) setErrorSatisfaccion(err.message || 'No se pudo cargar la satisfacción.');
            });

        Promise.all([
            solicitar('/consultas/resumen/categoria'),
            solicitar('/consultas/resumen/urgencia')
        ])
            .then(([resCat, resUrg]) => {
                if (!activo) return;
                const listaCat = Array.isArray(resCat) ? resCat : [];
                const listaUrg = Array.isArray(resUrg) ? resUrg : [];

                setCategorias(
                    listaCat.map((item, idx) => ({
                        id: item.id ?? idx,
                        nombre: capitalizar(item.nombre),
                        total: Number(item.total) || 0,
                        color: COLORES_CATEGORIA[idx % COLORES_CATEGORIA.length]
                    }))
                );

                setUrgencias(
                    listaUrg.map((item, idx) => {
                        const nombre = capitalizar(item.nombre);
                        const clave = nombre.toLowerCase();
                        return {
                            id: item.id ?? idx,
                            nombre,
                            total: Number(item.total) || 0,
                            color: COLORES_URGENCIA[clave] || PALETA_URGENCIA_FALLBACK[idx % PALETA_URGENCIA_FALLBACK.length]
                        };
                    })
                );
            })
            .catch((err) => {
                if (activo) setError(err.message || 'No se pudieron cargar las gráficas.');
            })
            .finally(() => {
                if (activo) setCargando(false);
            });

        return () => {
            activo = false;
        };
    }, []);

    const totalCategorias = categorias.reduce((acc, item) => acc + item.total, 0);
    const totalUrgencias = urgencias.reduce((acc, item) => acc + item.total, 0);
    const sinDatos = totalCategorias === 0 && totalUrgencias === 0;

    if (cargando) {
        return (
            <div className="dash-subcontent">
                <p>Cargando gráficas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dash-subcontent">
                <p className="recom-error">{error}</p>
            </div>
        );
    }

    if (sinDatos) {
        return (
            <div className="dash-subcontent">
                <p className="empty">no hay conversaciones todavía</p>
            </div>
        );
    }

    const maxCategoria = Math.max(...categorias.map((c) => c.total), 1);
    const urgenciasConDatos = urgencias.filter((u) => u.total > 0);

    let acumuladoPct = 0;
    const tramosCircular = urgenciasConDatos.map((item) => {
        const pct = totalUrgencias > 0 ? (item.total / totalUrgencias) * 100 : 0;
        const inicio = acumuladoPct;
        acumuladoPct += pct;
        return {
            ...item,
            porcentaje: Math.round(pct),
            tramo: `${item.color} ${inicio.toFixed(2)}% ${acumuladoPct.toFixed(2)}%`
        };
    });

    const fondoCircular = tramosCircular.length
        ? `conic-gradient(${tramosCircular.map((t) => t.tramo).join(', ')})`
        : '#e3e6ec';

    return (
        <>
            <div className="dash-graphs">
                <article className="dash-card">
                    <h3>
                        <BarChart3 size={21} /> Conversaciones por categoría
                    </h3>
                    {totalCategorias === 0 ? (
                        <p className="empty">no hay conversaciones todavía</p>
                    ) : (
                        <>
                            <div className="grafica-barras" role="img" aria-label="Gráfico de barras de conversaciones por categoría">
                                {categorias.map((cat) => {
                                    const alturaPct = Math.round((cat.total / maxCategoria) * 100);
                                    return (
                                        <div className="grafica-barra-col" key={cat.id}>
                                            <span className="grafica-barra-valor">{cat.total}</span>
                                            <div className="grafica-barra-pista">
                                                <div
                                                    className="grafica-barra-relleno"
                                                    style={{
                                                        height: `${cat.total > 0 ? Math.max(alturaPct, 6) : 0}%`,
                                                        backgroundColor: cat.color
                                                    }}
                                                    title={`${cat.nombre}: ${cat.total}`}
                                                />
                                            </div>
                                            <span className="grafica-barra-etiqueta">{cat.nombre}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="grafica-leyenda-horizontal">
                                {categorias.map((cat) => (
                                    <div className="grafica-leyenda-item" key={cat.id}>
                                        <span className="dash-dot" style={{ backgroundColor: cat.color }} />
                                        <span>{cat.nombre}</span>
                                        <strong>{cat.total}</strong>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </article>

                <article className="dash-card">
                    <h3>
                        <PieChart size={21} /> Conversaciones por urgencia
                    </h3>
                    {totalUrgencias === 0 ? (
                        <p className="empty">no hay conversaciones todavía</p>
                    ) : (
                        <div className="dash-types">
                            <div
                                className="grafica-circular"
                                style={{ background: fondoCircular }}
                                role="img"
                                aria-label="Gráfico circular de conversaciones por urgencia"
                            />
                            <div className="dash-legend">
                                {urgencias.map((urg) => {
                                    const pct = totalUrgencias > 0 ? Math.round((urg.total / totalUrgencias) * 100) : 0;
                                    return (
                                        <div key={urg.id}>
                                            <span className="dash-dot" style={{ backgroundColor: urg.color }} />
                                            <span>{urg.nombre}</span>
                                            <strong>
                                                {urg.total} ({pct}%)
                                            </strong>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </article>
            </div>

            <div className="dash-graphs dash-satisfaccion">
                <article className="dash-card">
                    <h3>Satisfacción por categoría</h3>
                    <p className="satisfaccion-subtitulo">% de valoraciones positivas · solo consultas resueltas y valoradas</p>
                    {errorSatisfaccion ? (
                        <p className="recom-error">{errorSatisfaccion}</p>
                    ) : (
                        <div className="satisfaccion-categorias">
                            {satisfaccion.categorias.map((item) => (
                                <div className="satisfaccion-fila" key={item.id}>
                                    <span className="satisfaccion-nombre">{capitalizar(item.nombre)}</span>
                                    <div className="satisfaccion-pista">
                                        <div
                                            className="satisfaccion-relleno"
                                            style={{ width: `${item.porcentaje ?? 0}%` }}
                                        />
                                    </div>
                                    <strong className="satisfaccion-porcentaje">
                                        {item.porcentaje == null ? '—' : `${item.porcentaje} %`}
                                    </strong>
                                    <span className="satisfaccion-total">
                                        {item.valoradas} valoradas
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </article>

                <article className="dash-card">
                    <h3>Satisfacción por urgencia</h3>
                    {errorSatisfaccion ? (
                        <p className="recom-error">{errorSatisfaccion}</p>
                    ) : (
                        <div className="dash-table-scroll">
                            <table className="satisfaccion-tabla">
                                <thead>
                                    <tr><th>Urgencia</th><th>Valoradas</th><th>% positivas</th></tr>
                                </thead>
                                <tbody>
                                    {satisfaccion.urgencias.map((item) => (
                                        <tr key={item.id}>
                                            <td>{capitalizar(item.nombre)}</td>
                                            <td>{item.valoradas}</td>
                                            <td><strong>{item.porcentaje == null ? 'sin valoraciones' : `${item.porcentaje} %`}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </article>
            </div>
        </>
    );
}
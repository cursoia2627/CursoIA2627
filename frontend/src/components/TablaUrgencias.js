
import { useEffect, useRef, useState } from "react";
import { dashboardTablasApi } from "../api/client";

export default function TablaUrgencias() {
    const [urgencias, setUrgencias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [urgenciaSeleccionada, setUrgenciaSeleccionada] = useState(null);
    const [conversaciones, setConversaciones] = useState([]);
    const [cargandoConversaciones, setCargandoConversaciones] = useState(false);
    const [errorConversaciones, setErrorConversaciones] = useState("");
    const peticionActual = useRef(0);

    useEffect(() => {
        let activo = true;

        async function cargarUrgencias() {
            try {
                const datos = await dashboardTablasApi.urgencias();

                if (activo) {
                    setUrgencias(datos);
                }
            } catch (err) {
                if (activo) {
                    setError(err.message);
                }
            } finally {
                if (activo) {
                    setCargando(false);
                }
            }
        }

        cargarUrgencias();

        return () => {
            activo = false;
        };
    }, []);



    async function seleccionarUrgencia(urgencia) {
        const numeroPeticion = ++peticionActual.current;

        if (urgenciaSeleccionada?.id === urgencia.id) {
            setUrgenciaSeleccionada(null);
            setConversaciones([]);
            setCargandoConversaciones(false);
            setErrorConversaciones("");
            return;
        }

        setUrgenciaSeleccionada(urgencia);
        setConversaciones([]);
        setCargandoConversaciones(true);
        setErrorConversaciones("");

        try {
            const resultado = await dashboardTablasApi.conversaciones({
                id_urgencia: urgencia.id,
                limit: 20,
                offset: 0
            });

            if (numeroPeticion === peticionActual.current) {
                setConversaciones(resultado.items ?? []);
            }
        } catch (err) {
            if (numeroPeticion === peticionActual.current) {
                setErrorConversaciones(err.message);
            }
        } finally {
            if (numeroPeticion === peticionActual.current) {
                setCargandoConversaciones(false);
            }
        }
    }



    if (cargando) {
        return <p>Cargando urgencias...</p>;
    }

    if (error) {
        return <p role="alert">Error: {error}</p>;
    }

    return (
        <section>
            <h2>Conversaciones por urgencia</h2>

            <div className="dash-table-scroll">
                <table className="dash-detail-table">
                    <thead>
                        <tr>
                            <th scope="col">Urgencia</th>
                            <th scope="col">Conversaciones</th>
                        </tr>
                    </thead>


                    <tbody>
                        {urgencias.map((urgencia) => (
                            <tr key={urgencia.id}>
                                <td>
                                    <button
                                        type="button"
                                        onClick={() => seleccionarUrgencia(urgencia)}
                                        aria-expanded={
                                            urgenciaSeleccionada?.id === urgencia.id
                                        }
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            padding: 0,
                                            cursor: "pointer",
                                            font: "inherit",
                                            color: "inherit",
                                            textAlign: "left",
                                            textDecoration: "underline"
                                        }}
                                    >
                                        {urgencia.nombre}
                                    </button>
                                </td>
                                <td>{urgencia.total}</td>
                            </tr>
                        ))}
                    </tbody>




                </table>
            </div>

            {urgenciaSeleccionada && (
                <div className="dash-table-scroll" style={{ marginTop: "24px" }}>
                    <h3>
                        Conversaciones: urgencia {urgenciaSeleccionada.nombre}
                    </h3>

                    {cargandoConversaciones && (
                        <p>Cargando conversaciones...</p>
                    )}

                    {errorConversaciones && (
                        <p role="alert">Error: {errorConversaciones}</p>
                    )}

                    {!cargandoConversaciones &&
                        !errorConversaciones &&
                        conversaciones.length === 0 && (
                            <p>No hay conversaciones con esta urgencia.</p>
                        )}

                    {!cargandoConversaciones &&
                        !errorConversaciones &&
                        conversaciones.length > 0 && (
                            <table className="dash-detail-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Consulta</th>
                                        <th scope="col">Respuesta</th>
                                        <th scope="col">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {conversaciones.map((conversacion) => (
                                        <tr key={conversacion.id_consulta}>
                                            <td>{conversacion.Consulta}</td>
                                            <td>{conversacion.Respuesta || "Sin respuesta"}</td>
                                            <td>{conversacion.estado_respuesta}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                </div>
            )}

        </section>
    );
}

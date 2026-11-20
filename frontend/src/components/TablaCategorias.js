
import { useEffect, useRef, useState } from "react";
import { dashboardTablasApi } from "../api/client";

export default function TablaCategorias() {
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
    const [conversaciones, setConversaciones] = useState([]);
    const [cargandoConversaciones, setCargandoConversaciones] = useState(false);
    const [errorConversaciones, setErrorConversaciones] = useState("");
    const peticionActual = useRef(0);

    useEffect(() => {
        let activo = true;

        async function cargarCategorias() {
            try {
                const datos = await dashboardTablasApi.categorias();

                if (activo) {
                    setCategorias(datos);
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

        cargarCategorias();

        return () => {
            activo = false;
        };
    }, []);



    async function seleccionarCategoria(categoria) {
        const numeroPeticion = ++peticionActual.current;

        if (categoriaSeleccionada?.id === categoria.id) {
            setCategoriaSeleccionada(null);
            setConversaciones([]);
            setCargandoConversaciones(false);
            setErrorConversaciones("");
            return;
        }

        setCategoriaSeleccionada(categoria);
        setConversaciones([]);
        setCargandoConversaciones(true);
        setErrorConversaciones("");

        try {
            const resultado = await dashboardTablasApi.conversaciones({
                id_categoria: categoria.id,
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


    return (
        <section>
            <h2>Conversaciones por categoría</h2>

            <div className="dash-table-scroll">
                <table className="dash-detail-table">
                    <thead>
                        <tr>
                            <th scope="col">Categoría</th>
                            <th scope="col">Conversaciones</th>
                        </tr>
                    </thead>


                    <tbody>
                        {categorias.map((categoria) => (
                            <tr key={categoria.id}>
                                <td>
                                    <button
                                        type="button"
                                        onClick={() => seleccionarCategoria(categoria)}
                                        aria-expanded={categoriaSeleccionada?.id === categoria.id}
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
                                        {categoria.nombre}
                                    </button>
                                </td>
                                <td>{categoria.total}</td>
                            </tr>
                        ))}
                    </tbody>




                </table>
            </div>


            {categoriaSeleccionada && (
                <div className="dash-table-scroll" style={{ marginTop: "24px" }}>
                    <h3>
                        Conversaciones: {categoriaSeleccionada.nombre}
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
                            <p>No hay conversaciones en esta categoría.</p>
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

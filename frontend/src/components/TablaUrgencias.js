
import { useEffect, useState } from "react";
import { dashboardTablasApi } from "../api/client";

export default function TablaUrgencias() {
    const [urgencias, setUrgencias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

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

    if (cargando) {
        return <p>Cargando urgencias...</p>;
    }

    if (error) {
        return <p role="alert">Error: {error}</p>;
    }

    return (
        <section>
            <h2>Conversaciones por urgencia</h2>

            <table>
                <thead>
                    <tr>
                        <th scope="col">Urgencia</th>
                        <th scope="col">Conversaciones</th>
                    </tr>
                </thead>

                <tbody>
                    {urgencias.map((urgencia) => (
                        <tr key={urgencia.id}>
                            <td>{urgencia.nombre}</td>
                            <td>{urgencia.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

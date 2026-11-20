
import { useEffect, useState } from "react";
import { dashboardTablasApi } from "../api/client";

export default function TablaCategorias() {
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

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

    if (cargando) {
        return <p>Cargando categorías...</p>;
    }

    if (error) {
        return <p role="alert">Error: {error}</p>;
    }

    return (
        <section>
            <h2>Conversaciones por categoría</h2>

            <table>
                <thead>
                    <tr>
                        <th scope="col">Categoría</th>
                        <th scope="col">Conversaciones</th>
                    </tr>
                </thead>

                <tbody>
                    {categorias.map((categoria) => (
                        <tr key={categoria.id}>
                            <td>{categoria.nombre}</td>
                            <td>{categoria.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}


import React, { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { consultasApi } from "../api/client";

export default function MisConsultas() {
    const [consultas, setConsultas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [guardandoId, setGuardandoId] = useState(null);
    const [errorValoracion, setErrorValoracion] = useState("");

    useEffect(() => {
        let activo = true;

        async function cargarConsultas() {
            try {
                const resultado = await consultasApi.listar(100, 0);

                if (activo) {
                    setConsultas(resultado.items || []);
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

        cargarConsultas();

        return () => {
            activo = false;
        };
    }, []);


    async function valorar(idConsulta, valoracion) {
        setGuardandoId(idConsulta);
        setErrorValoracion("");

        try {
            const actualizada = await consultasApi.valorar(
                idConsulta,
                valoracion
            );

            setConsultas((anteriores) =>
                anteriores.map((consulta) =>
                    consulta.id_consulta === idConsulta
                        ? { ...consulta, valoracion: actualizada.valoracion }
                        : consulta
                )
            );
        } catch (err) {
            setErrorValoracion(err.message);
        } finally {
            setGuardandoId(null);
        }
    }


    if (cargando) {
        return <p>Cargando tus consultas...</p>;
    }

    if (error) {
        return <p role="alert">Error al cargar consultas: {error}</p>;
    }

    return (
        <section>
            <h2>Mis consultas</h2>
            <p>
                Aquí puedes consultar las respuestas recibidas de la IA.
            </p>

            {errorValoracion && (
                <p role="alert">
                    No se pudo guardar la valoración: {errorValoracion}
                </p>
            )}

            {consultas.length === 0 ? (
                <p>Todavía no tienes consultas registradas.</p>
            ) : (
                consultas.map((consulta) => (
                    <article
                        key={consulta.id_consulta}
                        style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            padding: "16px",
                            marginBottom: "12px"
                        }}
                    >
                        <h3>{consulta.Consulta}</h3>

                        <p>
                            {consulta.Respuesta || "Pendiente de respuesta"}
                        </p>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "12px"
                            }}
                        >
                            <span>
                                {consulta.valoracion === 1
                                    ? "Valorada: buena"
                                    : consulta.valoracion === 0
                                        ? "Valorada: mala"
                                        : "Sin valorar"}
                            </span>

                            <
                                div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => valorar(consulta.id_consulta, 1)}
                                    disabled={
                                        guardandoId !== null ||
                                        consulta.estado_respuesta !== "respondida" ||
                                        !consulta.Respuesta?.trim()
                                    }
                                    aria-label="Valorar positivamente"
                                    aria-pressed={consulta.valoracion === 1}
                                    title="Respuesta útil"
                                    style={{
                                        color: consulta.valoracion === 1 ? "green" : "inherit"
                                    }}
                                >
                                    <ThumbsUp size={19} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => valorar(consulta.id_consulta, 0)}
                                    disabled={
                                        guardandoId !== null ||
                                        consulta.estado_respuesta !== "respondida" ||
                                        !consulta.Respuesta?.trim()
                                    }
                                    aria-label="Valorar negativamente"
                                    aria-pressed={consulta.valoracion === 0}
                                    title="Respuesta poco útil"
                                    style={{
                                        color: consulta.valoracion === 0 ? "red" : "inherit"
                                    }}
                                >
                                    <ThumbsDown size={19} />
                                </button>
                            </div>

                        </div>
                    </article>
                ))
            )}
        </section>
    );
}

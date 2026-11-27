-- Exporta solo consultas reales, respondidas y valoradas positivamente.
-- Revisa manualmente cada fila y elimina datos personales, duplicados o respuestas no verificadas.
SELECT id_consulta, Consulta AS pregunta, Respuesta AS respuesta
FROM atencion_cliente
WHERE origen = 'real'
  AND estado_respuesta = 'respondida'
  AND valoracion = 1
  AND Respuesta IS NOT NULL
  AND TRIM(Respuesta) <> ''
ORDER BY id_consulta;

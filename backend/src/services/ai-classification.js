
function resolveClassification(resultado, catalogos) {
    if (!resultado || typeof resultado !== "object" || Array.isArray(resultado)) {
        throw new Error("La respuesta de IA debe ser un objeto.");
    }

    if (
        typeof resultado.respuesta !== "string" ||
        !resultado.respuesta.trim()
    ) {
        throw new Error("La respuesta de IA no contiene texto válido.");
    }

    const buscar = (lista, nombre, campoId) => {
        const encontrado = lista.find(
            (item) =>
                item.nombre.toLocaleLowerCase("es-ES") ===
                String(nombre || "").trim().toLocaleLowerCase("es-ES")
        );

        const sinClasificar = lista.find(
            (item) => item.nombre.toLocaleLowerCase("es-ES") === "sin clasificar"
        );

        if (!sinClasificar) {
            throw new Error("Falta el valor Sin clasificar en el catálogo.");
        }

        return (encontrado || sinClasificar)[campoId];
    };

    return {
        respuesta: resultado.respuesta.trim(),
        id_categoria: buscar(
            catalogos.categorias,
            resultado.categoria,
            "id_categoria"
        ),
        id_urgencia: buscar(
            catalogos.urgencias,
            resultado.urgencia,
            "id_urgencia"
        )
    };
}


module.exports = { resolveClassification };


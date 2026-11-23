import { useEffect, useState } from 'react';
import { consultasApi } from '../api/client';

function formatFechaHora(value) {
    if (!value) return { fecha: '—', hora: '—' };

    // MySQL puede devolver timestamps como "YYYY-MM-DD HH:mm:ss".
    const fechaISO = typeof value === 'string' && !value.includes('T')
        ? value.replace(' ', 'T')
        : value;
    const fecha = new Date(fechaISO);

    if (Number.isNaN(fecha.getTime())) return { fecha: '—', hora: '—' };

    return {
        fecha: fecha.toLocaleDateString('es-ES'),
        hora: fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
}

function resultadoConsulta(estado) {
    switch (String(estado || '').toLowerCase()) {
        case 'respondida':
            return 'Resuelta';
        case 'error':
            return 'Error';
        case 'pendiente':
        case 'procesando':
        default:
            return 'Pendiente';
    }
}

export default function useDashboardActivities() {
    const [actividades, setActividades] = useState([]);
    const [error, setError] = useState(false);

    useEffect(() => {
        let activo = true;

        consultasApi.listar(10, 0)
            .then((datos) => {
                if (!activo) return;
                const consultas = Array.isArray(datos?.items) ? datos.items : [];
                setActividades(consultas.map((consulta) => {
                    const { fecha, hora } = formatFechaHora(consulta.fecha_creacion);
                    return {
                        id: consulta.id_consulta,
                        fecha,
                        hora,
                        descripcion: consulta.Consulta || 'Consulta sin descripción',
                        resultado: resultadoConsulta(consulta.estado_respuesta)
                    };
                }));
                setError(false);
            })
            .catch(() => {
                if (activo) setError(true);
            });

        return () => {
            activo = false;
        };
    }, []);

    return { actividades, error };
}

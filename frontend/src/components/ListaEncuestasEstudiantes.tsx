import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firebaseDashboardService } from '../services/firebaseDashboardService';
import { toast } from 'sonner';

export function ListaEncuestasEstudiantes() {
    const queryClient = useQueryClient();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: encuestas, isLoading, error } = useQuery({
        queryKey: ['encuestas', 'detalladas'],
        queryFn: () => firebaseDashboardService.obtenerEncuestasConUsuario()
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => firebaseDashboardService.eliminarEncuesta(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['encuestas'] });
            queryClient.invalidateQueries({ queryKey: ['metricas'] });
            toast.success('Encuesta eliminada correctamente');
            setDeleteId(null);
        },
        onError: () => {
            toast.error('Error al eliminar la encuesta');
            setDeleteId(null);
        }
    });

    const handleDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !encuestas) {
        return (
            <div className="text-center text-red-500 py-8">
                Error al cargar la lista de encuestas.
            </div>
        );
    }

    if (encuestas.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No hay encuestas registradas.
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ranking
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Carrera / Cargo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Correo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Puntaje
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {encuestas.map((encuesta, index) => {
                            let badgeColor = 'bg-gray-100 text-gray-800';
                            let estadoText = 'Desconocido';

                            if (encuesta.puntaje <= 50) {
                                badgeColor = 'bg-red-100 text-red-800';
                                estadoText = 'Bajo';
                            } else if (encuesta.puntaje <= 75) {
                                badgeColor = 'bg-yellow-100 text-yellow-800';
                                estadoText = 'Medio';
                            } else {
                                badgeColor = 'bg-green-100 text-green-800';
                                estadoText = 'Alto';
                            }

                            return (
                                <tr key={encuesta.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        #{index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {encuesta.usuario.nombres} {encuesta.usuario.apellidos}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {(encuesta as any).carreraOCargo ?? '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {encuesta.usuarioEmail}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                        {encuesta.puntaje}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeColor}`}>
                                            {estadoText}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => setDeleteId(String(encuesta.id))}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal de Confirmación */}
            {
                deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmar Eliminación</h3>
                            <p className="text-gray-600 mb-6">
                                ¿Estás seguro de que deseas eliminar esta encuesta? Esta acción no se puede deshacer.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

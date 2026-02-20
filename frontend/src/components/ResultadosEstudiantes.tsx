import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { firebaseDashboardService } from '../services/firebaseDashboardService';



const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export function ResultadosEstudiantes() {
    const { data: distribucion, isLoading, error } = useQuery({
        queryKey: ['metricas', 'distribucion'],
        queryFn: () => firebaseDashboardService.obtenerDistribucionGlobal()
    });

    const { data: statsPreguntas } = useQuery({
        queryKey: ['metricas', 'preguntas'],
        queryFn: () => firebaseDashboardService.obtenerEstadisticasPreguntas()
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !distribucion) {
        return (
            <div className="text-center text-red-500 py-8">
                Error al cargar los resultados. Por favor intente más tarde.
            </div>
        );
    }

    const total = distribucion.alerta_0_12 + distribucion.bajo_13_50 + distribucion.medio_51_75 + distribucion.alto_76_100;
    const buenBienestar = distribucion.alto_76_100;
    const porcentajeBueno = total > 0 ? Math.round((buenBienestar / total) * 100) : 0;

    const redValue = distribucion.alerta_0_12 + distribucion.bajo_13_50;
    const yellowValue = distribucion.medio_51_75;
    const greenValue = distribucion.alto_76_100;

    const data = [
        { name: 'Bajo Bienestar', value: redValue },
        { name: 'Bienestar Moderado', value: yellowValue },
        { name: 'Buen Bienestar', value: greenValue },
    ].filter(item => item.value > 0);



    if (total === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                Aún no hay suficientes datos para mostrar estadísticas.
            </div>
        );
    }

    const arrStats = statsPreguntas ? Object.entries(statsPreguntas).map(([k, v]) => ({
        numero: parseInt(k),
        promedio: v.promedio,
        porcentaje: v.porcentaje
    })) : [];

    return (
        <div className="w-full flex flex-col items-center p-4 bg-white rounded-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
                Resultados Globales de Estudiantes
            </h3>

            <div className="w-full grid md:grid-cols-2 gap-8 items-start">
                {/* Lado del Gráfico */}
                <div className="flex flex-col items-center w-full">
                    <div className="w-full max-w-sm mb-6 flex rounded-lg overflow-hidden shadow-sm">
                        <div className="flex-1 bg-red-100 p-2 flex flex-col items-center justify-center border-r border-white">
                            <span className="text-red-700 font-bold text-lg">{Math.round((redValue / total) * 100)}%</span>
                            <span className="text-red-600 text-xs font-medium uppercase text-center">Bajo</span>
                        </div>
                        <div className="flex-1 bg-yellow-100 p-2 flex flex-col items-center justify-center border-r border-white">
                            <span className="text-yellow-700 font-bold text-lg">{Math.round((yellowValue / total) * 100)}%</span>
                            <span className="text-yellow-600 text-xs font-medium uppercase text-center">Medio</span>
                        </div>
                        <div className="flex-1 bg-green-100 p-2 flex flex-col items-center justify-center">
                            <span className="text-green-700 font-bold text-lg">{Math.round((greenValue / total) * 100)}%</span>
                            <span className="text-green-600 text-xs font-medium uppercase text-center">Alto</span>
                        </div>
                    </div>

                    <div className="w-full h-64 max-w-sm">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => {
                                        let color = '#ccc';
                                        if (entry.name === 'Bajo Bienestar') color = '#ef4444';
                                        if (entry.name === 'Bienestar Moderado') color = '#eab308';
                                        if (entry.name === 'Buen Bienestar') color = '#22c55e';
                                        return <Cell key={`cell-${index}`} fill={color} />;
                                    })}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 text-center w-full max-w-sm">
                        <p className="text-green-800 font-medium text-lg">
                            {porcentajeBueno}% de los estudiantes
                        </p>
                        <p className="text-green-700">
                            presentan un nivel de bienestar bueno o alto.
                        </p>
                    </div>
                </div>

                {/* Lado de Estadísticas por Pregunta */}
                <div className="w-full flex flex-col bg-gray-50 rounded-xl p-6 border border-gray-100 h-full">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                        Promedio de Respuestas
                    </h4>
                    <p className="text-sm text-gray-500 mb-6">
                        Porcentaje promedio (basado en el máximo de 5 puntos posibles). Un valor cercano a 100% indica que responden &quot;Todo el tiempo&quot;.
                    </p>

                    <div className="space-y-5">
                        {arrStats.map(stat => {
                            const textos = [
                                "Me he sentido alegre y de buen humor",
                                "Me he sentido tranquilo y relajado",
                                "Me he sentido activo y enérgico",
                                "Me he despertado fresco y descansado",
                                "Mi vida ha estado llena de cosas que me interesan"
                            ];
                            const textoPregunta = textos[stat.numero - 1] || "Pregunta";

                            // Determinar color de la barra (ej. verde oscuro para alto, naranja/rojo para bajo)
                            let barColor = "bg-green-500";
                            if (stat.porcentaje < 40) barColor = "bg-red-500";
                            else if (stat.porcentaje < 70) barColor = "bg-yellow-400";

                            return (
                                <div key={stat.numero} className="w-full">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-700 font-medium truncate pr-4" title={textoPregunta}>
                                            {stat.numero}. {textoPregunta}
                                        </span>
                                        <span className="text-gray-900 font-bold">{stat.porcentaje}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className={`${barColor} h-2.5 rounded-full transition-all duration-500`}
                                            style={{ width: `${stat.porcentaje}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}

                        {arrStats.length === 0 && (
                            <div className="text-sm text-gray-400 text-center py-4">
                                No hay suficientes datos para las preguntas.
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}

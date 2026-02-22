import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { firebaseEncuestaService } from '../services/firebaseEncuestaService';
import { firebaseDashboardService } from '../services/firebaseDashboardService';
import { ResultadosEstudiantes } from '../components/ResultadosEstudiantes';
import { ListaEncuestasEstudiantes } from '../components/ListaEncuestasEstudiantes';

export function Landing() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [showList, setShowList] = useState(false);

  const { data: misEncuestas = [] } = useQuery({
    queryKey: ['misEncuestas', user?.id],
    queryFn: firebaseEncuestaService.obtenerMisEncuestas,
    enabled: isAuthenticated
  });

  const hasCompletedSurvey = misEncuestas.length > 0;
  const latestSurveyId = misEncuestas[0]?.id;

  const showEstudiante = !isAuthenticated || user?.tipo_usuario === 'estudiante';
  const showPersonal = !isAuthenticated || user?.tipo_usuario === 'personal';
  const showColaborador = !isAuthenticated || user?.tipo_usuario === 'colaborador';

  const exportarEncuestasExcel = async () => {
    const encuestas = await firebaseDashboardService.obtenerEncuestasConUsuario();
    if (!encuestas || encuestas.length === 0) return;

    // Importar xlsx dinámicamente
    const XLSX = await import('xlsx');

    const filas = encuestas.map((enc, index) => {
      let estado = 'Desconocido';
      if (enc.puntaje <= 50) estado = 'Bajo';
      else if (enc.puntaje <= 75) estado = 'Medio';
      else estado = 'Alto';
      const fecha = enc.fecha_alerta ? new Date(enc.fecha_alerta).toLocaleDateString('es-CO') : 'N/A';
      return {
        Ranking: `#${index + 1}`,
        Nombres: enc.usuario.nombres,
        Apellidos: enc.usuario.apellidos,
        Correo: (enc as any).usuarioEmail ?? '',
        Puntaje: enc.puntaje,
        Estado: estado,
        Fecha: fecha,
      };
    });

    const hoja = XLSX.utils.json_to_sheet(filas);

    // Anchos de columna en Excel (unidades de carácter ≈ pixels / 7)
    // Ranking(A): auto, Nombres(B): 342px≈49, Apellidos(C): 342px≈49, Correo(D): 622px≈89
    hoja['!cols'] = [
      { wpx: 70 },   // A - Ranking
      { wpx: 342 },  // B - Nombres
      { wpx: 342 },  // C - Apellidos
      { wpx: 622 },  // D - Correo
      { wpx: 80 },   // E - Puntaje
      { wpx: 80 },   // F - Estado
      { wpx: 100 },  // G - Fecha
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Encuestas');

    const nombreArchivo = `encuestas_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(libro, nombreArchivo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header para usuarios autenticados */}
      {isAuthenticated && user && (
        <div className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="text-gray-700 font-medium">
              Hola, {user.nombres} {user.apellidos}
            </div>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800 font-medium hover:underline"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Sistema de Bienestar Universitario
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Índice WHO-5 - Evaluación de Bienestar Emocional
          </p>
        </div>

        <div className={`mx-auto grid gap-8 mb-12 ${!isAuthenticated ? 'lg:grid-cols-3 md:grid-cols-2 max-w-6xl' : 'max-w-xl'}`}>
          {showEstudiante && (
            <div className={`bg-white rounded-2xl shadow-lg p-8 w-full`}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Soy Estudiante</h2>
              <p className="text-gray-600 mb-6">
                Accede al sistema para completar tu evaluación de bienestar emocional
              </p>
              {!isAuthenticated ? (
                <div className="space-y-3">
                  <Link
                    to="/registro/estudiante"
                    className="block w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-center"
                  >
                    Registrarse como Estudiante
                  </Link>
                  <Link
                    to="/login"
                    className="block w-full py-3 px-4 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 text-center"
                  >
                    Ya tengo cuenta
                  </Link>
                </div>
              ) : (
                <>
                  {hasCompletedSurvey ? (
                    <Link
                      to={`/resultado/${latestSurveyId}`}
                      className="block w-full py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 text-center"
                    >
                      Ver Resultados de mi Encuesta
                    </Link>
                  ) : (
                    <Link
                      to="/encuesta"
                      className="block w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-center"
                    >
                      Comenzar Encuesta
                    </Link>
                  )}
                </>
              )}
              {isAuthenticated && (
                <button
                  onClick={logout}
                  className="block w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-4 underline"
                >
                  Cerrar Sesión
                </button>
              )}
            </div>
          )}

          {showPersonal && (
            <div className={`bg-white rounded-2xl shadow-lg p-8 w-full`}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Soy Administrativo</h2>
              <p className="text-gray-600 mb-6">
                Accede al sistema para completar tu evaluación de bienestar emocional
              </p>
              {!isAuthenticated ? (
                <div className="space-y-3">
                  <Link
                    to="/registro/personal"
                    className="block w-full py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 text-center"
                  >
                    Registrarse como Administrativo
                  </Link>
                  <Link
                    to="/login"
                    className="block w-full py-3 px-4 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 text-center"
                  >
                    Ya tengo cuenta
                  </Link>
                </div>
              ) : (
                <>
                  {!showList ? (
                    <>
                      <ResultadosEstudiantes />
                      <button
                        onClick={() => setShowList(true)}
                        className="block w-full py-3 px-6 mt-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 text-center"
                      >
                        Ver Lista Detallada
                      </button>
                    </>
                  ) : (
                    <>
                      <ListaEncuestasEstudiantes />
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={exportarEncuestasExcel}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 text-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Descargar Excel
                        </button>
                        <button
                          onClick={() => setShowList(false)}
                          className="flex-1 py-3 px-6 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 text-center"
                        >
                          Volver al Gráfico
                        </button>
                      </div>
                    </>
                  )}

                  <button
                    onClick={logout}
                    className="block w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-4 underline"
                  >
                    Cerrar Sesión
                  </button>
                </>
              )}
            </div>
          )}

          {showColaborador && (
            <div className={`bg-white rounded-2xl shadow-lg p-8 w-full`}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Soy Colaborador</h2>
              <p className="text-gray-600 mb-6">
                Accede al sistema para completar tu evaluación de bienestar emocional
              </p>
              {!isAuthenticated ? (
                <div className="space-y-3">
                  <Link
                    to="/registro/colaborador"
                    className="block w-full py-3 px-6 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 text-center"
                  >
                    Registrarse como Colaborador
                  </Link>
                  <Link
                    to="/login"
                    className="block w-full py-3 px-4 border border-teal-600 text-teal-600 rounded-lg font-medium hover:bg-teal-50 text-center"
                  >
                    Ya tengo cuenta
                  </Link>
                </div>
              ) : (
                <>
                  {hasCompletedSurvey ? (
                    <Link
                      to={`/resultado/${latestSurveyId}`}
                      className="block w-full py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 text-center"
                    >
                      Ver Resultados de mi Encuesta
                    </Link>
                  ) : (
                    <Link
                      to="/encuesta"
                      className="block w-full py-3 px-6 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 text-center"
                    >
                      Comenzar Encuesta
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="block w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-4 underline"
                  >
                    Cerrar Sesión
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">¿Qué es el WHO-5?</h3>
          <p className="text-gray-600 mb-4">
            El Índice de Bienestar WHO-5 es un instrumento breve desarrollado por la
            Organización Mundial de la Salud para evaluar el bienestar emocional durante
            las últimas dos semanas.
          </p>
          <p className="text-gray-600">
            La evaluación toma solo 2-3 minutos y ayuda a identificar áreas de apoyo
            necesarias para mantener tu bienestar emocional.
          </p>
        </div>
      </div>
    </div>
  );
}

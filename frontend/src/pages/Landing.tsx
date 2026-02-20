import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { firebaseEncuestaService } from '../services/firebaseEncuestaService';

export function Landing() {
  const { isAuthenticated, user, logout } = useAuthStore();

  const { data: misEncuestas = [] } = useQuery({
    queryKey: ['misEncuestas', user?.id],
    queryFn: firebaseEncuestaService.obtenerMisEncuestas,
    enabled: isAuthenticated
  });

  const hasCompletedSurvey = misEncuestas.length > 0;
  const latestSurveyId = misEncuestas[0]?.id;

  const showEstudiante = !isAuthenticated || user?.tipo_usuario === 'estudiante';
  const showPersonal = !isAuthenticated || user?.tipo_usuario === 'personal';

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

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          {showEstudiante && (
            <div className={`bg-white rounded-2xl shadow-lg p-8 ${!showPersonal ? 'col-span-2 max-w-lg mx-auto w-full' : ''}`}>
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
            <div className={`bg-white rounded-2xl shadow-lg p-8 ${!showEstudiante ? 'col-span-2 max-w-lg mx-auto w-full' : ''}`}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Soy Personal</h2>
              <p className="text-gray-600 mb-6">
                Accede al sistema para completar tu evaluación de bienestar emocional
              </p>
              {!isAuthenticated ? (
                <div className="space-y-3">
                  <Link
                    to="/registro/personal"
                    className="block w-full py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 text-center"
                  >
                    Registrarse como Personal
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
                      className="block w-full py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 text-center"
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


import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { encuestaService } from '../services/encuestaService';

export function ResultadoPage() {
  const { id } = useParams<{ id: string }>();
  const encuestaId = id ?? '';

  const { data: resultado, isLoading } = useQuery({
    queryKey: ['resultado', encuestaId],
    queryFn: () => encuestaService.obtenerResultado(encuestaId),
    enabled: !!encuestaId,
  });

  if (isLoading) {
    return (
      <div className="resultado-cargando">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando resultado...</p>
        </div>
      </div>
    );
  }

  if (!resultado) {
    return (
      <div className="resultado-cargando">
        <div className="text-center">
          <p className="text-gray-600">No se pudo cargar el resultado</p>
          <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const { clasificacion, puntaje_raw } = resultado;

  return (
    <div className="resultado-pagina">
      {/* Logo Uniempresarial — esquina superior izquierda */}
      <div className="logo-barra">
        <img src="/logo-uniempresarial.png" alt="Logo Uniempresarial" className="logo-img" />
      </div>
      <div className="resultado-contenedor">
        <div className="resultado-tarjeta">
          <div className="resultado-encabezado">
            <h1 className="resultado-titulo">✓ Encuesta Completada</h1>
            <p className="resultado-subtitulo">Gracias por participar</p>
          </div>

          <div className="resultado-puntaje-seccion">
            <div className="inline-block">
              <div className="resultado-puntaje-numero" style={{ color: clasificacion.color }}>
                {puntaje_raw}/25
              </div>
              <div className="resultado-barra-fondo">
                <div
                  className="resultado-barra-relleno"
                  style={{
                    width: `${(puntaje_raw / 25) * 100}%`,
                    backgroundColor: clasificacion.color
                  }}
                />
              </div>
            </div>
          </div>

          <div className="resultado-clasificacion" style={{ backgroundColor: `${clasificacion.color}15` }}>
            <h2 className="resultado-clasificacion-nivel" style={{ color: clasificacion.color }}>
              {clasificacion.nivel}
            </h2>
            <p className="resultado-clasificacion-mensaje">{clasificacion.mensaje}</p>
          </div>

          {resultado.cambio_significativo && (
            <div className="resultado-cambio-significativo">
              <h3 className="resultado-cambio-titulo">Cambio Significativo Detectado</h3>
              <p className="text-gray-700">
                Tu puntaje ha cambiado {Math.abs(resultado.cambio_significativo.diferencia)} puntos
                ({resultado.cambio_significativo.tipo === 'mejora' ? 'mejora' : 'empeoramiento'})
                respecto a tu última evaluación.
              </p>
            </div>
          )}

          <div className="resultado-acciones">
            <Link to="/" className="resultado-boton-volver">
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

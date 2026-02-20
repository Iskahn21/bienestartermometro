// Tipos de usuario
export type TipoUsuario = 'estudiante' | 'personal' | 'admin' | 'psicologo' | 'colaborador';
export type TipoDocumento = 'CC' | 'TI';
export type Rol = 'user' | 'admin' | 'psicologo' | 'analista';

// Usuario (id puede ser number para backend o string UID para Firebase)
export interface Usuario {
  id: number | string;
  tipo_usuario: TipoUsuario;
  nombres: string;
  apellidos: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  correo_institucional: string;
  rol: Rol;
  programa?: string;
  promocion?: string;
  cargo?: string;
  consent_accepted: boolean;
  consent_date?: string;
  can_contact: boolean;
  created_at: string;
  last_login?: string;
}

// Registro
export interface RegistroEstudiante {
  nombres: string;
  apellidos: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  correo_institucional: string;
  password: string;
  programa: string;
  promocion: string;
}

export interface RegistroPersonal {
  nombres: string;
  apellidos: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  correo_institucional: string;
  password: string;
  cargo: string;
}

export interface RegistroColaborador {
  nombres: string;
  apellidos: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  correo_institucional: string;
  password: string;
  programa: string;
  promocion: string;
}

// WHO-5
export interface RespuestaWHO5 {
  pregunta_numero: number;
  valor: number; // 0-5
}

export interface EncuestaWHO5 {
  respuestas: RespuestaWHO5[];
  comentario?: string;
  can_contact: boolean;
}

export interface Encuesta {
  id: number | string;
  usuario_id: number | string;
  created_at: string;
  completed_at?: string;
  puntaje_raw: number;
  puntaje_final: number;
  es_alerta: boolean;
  comentario?: string;
  estado: string;
}

export interface ResultadoEncuesta {
  encuesta_id: number | string;
  fecha: string;
  puntaje_raw: number;
  puntaje_final: number;
  clasificacion: {
    nivel: string;
    categoria: string;
    color: string;
    mensaje: string;
  };
  es_alerta: boolean;
  cambio_significativo?: {
    hay_cambio: boolean;
    diferencia: number;
    tipo: 'mejora' | 'empeoramiento';
    puntaje_anterior: number;
  };
  comentario?: string;
}

// Pregunta WHO-5
export interface PreguntaWHO5 {
  numero: number;
  texto: string;
  opciones: {
    valor: number;
    label: string;
  }[];
}

// Dashboard
export interface Metricas {
  total_usuarios: number;
  total_encuestas: number;
  tasa_participacion: number;
  puntaje_promedio: number;
  alertas: {
    activas: number;
    pendientes: number;
    resueltas: number;
  };
  distribucion_puntajes: {
    alerta_0_12: number;
    bajo_13_50: number;
    medio_51_75: number;
    alto_76_100: number;
  };
}

export interface Alerta {
  id: number | string;
  encuesta_id: number | string;
  puntaje: number;
  prioridad: 'alta' | 'media';
  estado: 'pendiente' | 'en_atencion' | 'resuelta';
  usuario: {
    id: number | string;
    nombres: string;
    apellidos: string;
    tipo_documento: string;
    numero_documento: string;
    tipo_usuario: string;
    programa?: string;
    cargo?: string;
  };
  fecha_alerta: string;
  atendida_por?: number;
  fecha_atencion?: string;
  accion_tomada?: string;
}

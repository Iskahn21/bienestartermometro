import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from '../lib/firebase';
import { WHO5_PREGUNTAS, calcularPuntajeRaw, calcularPuntajeFinal, esAlerta } from '../constants/who5';
import type { EncuestaWHO5, Encuesta, ResultadoEncuesta, PreguntaWHO5 } from '../types';

const ENCUESTAS = 'encuestas';
const RESPUESTAS = 'respuestas';
const USUARIOS = 'usuarios';
const ALERTAS = 'alertas';

function encuestaDocToEncuesta(id: string, data: Record<string, unknown>): Encuesta {
  const createdAt = data.created_at instanceof Timestamp ? (data.created_at as Timestamp).toDate?.()?.toISOString() : String(data.created_at);
  const completedAt = data.completed_at != null
    ? (data.completed_at instanceof Timestamp ? (data.completed_at as Timestamp).toDate?.()?.toISOString() : String(data.completed_at))
    : undefined;
  return {
    id,
    usuario_id: data.usuario_id as string,
    created_at: createdAt ?? new Date().toISOString(),
    completed_at: completedAt,
    puntaje_raw: (data.puntaje_raw as number) ?? 0,
    puntaje_final: (data.puntaje_final as number) ?? 0,
    es_alerta: (data.es_alerta as boolean) ?? false,
    comentario: data.comentario as string | undefined,
    estado: (data.estado as string) ?? 'completada',
  };
}

function clasificarBienestar(puntajeFinal: number) {
  if (puntajeFinal < 13) return { nivel: 'Bajo bienestar', categoria: 'alerta', color: '#E53E3E', mensaje: 'Tu nivel de bienestar puede requerir atención. Te invitamos a contactar al área de Bienestar Universitario.' };
  if (puntajeFinal < 51) return { nivel: 'Bienestar bajo', categoria: 'bajo', color: '#DD6B20', mensaje: 'Tu bienestar puede mejorar. Considera actividades que te ayuden a sentirte mejor.' };
  if (puntajeFinal < 76) return { nivel: 'Bienestar bueno', categoria: 'medio', color: '#4A90E2', mensaje: 'Tu nivel de bienestar es bueno. Continúa cuidando tu salud emocional.' };
  return { nivel: 'Excelente bienestar', categoria: 'alto', color: '#38A169', mensaje: 'Tu nivel de bienestar es excelente. ¡Sigue así!' };
}

export const firebaseEncuestaService = {
  async aceptarConsentimiento(canContact: boolean): Promise<void> {
    const auth = getFirebaseAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('No hay usuario autenticado');
    const db = getFirestoreDb();
    const now = new Date().toISOString();
    await updateDoc(doc(db, USUARIOS, uid), {
      consent_accepted: true,
      consent_date: now,
      can_contact: canContact,
      updated_at: now,
    });
  },

  async obtenerPreguntas(): Promise<{ preguntas: PreguntaWHO5[] }> {
    return { preguntas: WHO5_PREGUNTAS };
  },

  async enviarEncuesta(data: EncuestaWHO5): Promise<Encuesta> {
    const auth = getFirebaseAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('No hay usuario autenticado');
    const valores = data.respuestas.sort((a, b) => a.pregunta_numero - b.pregunta_numero).map((r) => r.valor);
    const puntaje_raw = calcularPuntajeRaw(valores);
    const puntaje_final = calcularPuntajeFinal(puntaje_raw);
    const es_alerta = esAlerta(puntaje_final);
    const db = getFirestoreDb();
    const now = new Date();
    const encuestaRef = await addDoc(collection(db, ENCUESTAS), {
      usuario_id: uid,
      created_at: now.toISOString(),
      started_at: now.toISOString(),
      completed_at: now.toISOString(),
      puntaje_raw,
      puntaje_final,
      es_alerta,
      comentario: data.comentario ?? null,
      estado: 'completada',
    });
    const batch = writeBatch(db);
    for (const r of data.respuestas) {
      const respRef = doc(db, ENCUESTAS, encuestaRef.id, RESPUESTAS, `p${r.pregunta_numero}`);
      batch.set(respRef, { pregunta_numero: r.pregunta_numero, valor: r.valor });
    }
    await batch.commit();
    if (es_alerta) {
      await addDoc(collection(db, ALERTAS), {
        encuesta_id: encuestaRef.id,
        usuario_id: uid,
        puntaje_obtenido: puntaje_final,
        prioridad: puntaje_final < 8 ? 'alta' : 'media',
        estado: 'pendiente',
        created_at: now.toISOString(),
      });
    }
    return encuestaDocToEncuesta(encuestaRef.id, {
      usuario_id: uid,
      created_at: now.toISOString(),
      completed_at: now.toISOString(),
      puntaje_raw,
      puntaje_final,
      es_alerta,
      comentario: data.comentario,
      estado: 'completada',
    });
  },

  async obtenerMisEncuestas(): Promise<Encuesta[]> {
    const auth = getFirebaseAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    const db = getFirestoreDb();
    const q = query(
      collection(db, ENCUESTAS),
      where('usuario_id', '==', uid),
      orderBy('created_at', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => encuestaDocToEncuesta(d.id, d.data() as Record<string, unknown>));
  },

  async obtenerResultado(encuestaId: number | string): Promise<ResultadoEncuesta> {
    const db = getFirestoreDb();
    const id = String(encuestaId);
    const encSnap = await getDoc(doc(db, ENCUESTAS, id));
    if (!encSnap.exists()) throw new Error('Encuesta no encontrada');
    const enc = encSnap.data() as Record<string, unknown>;
    const puntaje_raw = (enc.puntaje_raw as number) ?? 0;
    const puntaje_final = (enc.puntaje_final as number) ?? 0;
    const es_alerta = (enc.es_alerta as boolean) ?? false;
    const completedAt = enc.completed_at != null ? String(enc.completed_at) : new Date().toISOString();
    const clasificacion = clasificarBienestar(puntaje_final);
    return {
      encuesta_id: encuestaId as number,
      fecha: completedAt,
      puntaje_raw,
      puntaje_final,
      clasificacion: {
        nivel: clasificacion.nivel,
        categoria: clasificacion.categoria,
        color: clasificacion.color,
        mensaje: clasificacion.mensaje,
      },
      es_alerta,
      comentario: enc.comentario as string | undefined,
    };
  },
};

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from '../lib/firebase';
import type { Metricas, Alerta } from '../types';

const ENCUESTAS = 'encuestas';
const ALERTAS = 'alertas';
const USUARIOS = 'usuarios';

const usuarioVacio: Alerta['usuario'] = {
  id: '',
  nombres: '',
  apellidos: '',
  tipo_documento: '',
  numero_documento: '',
  tipo_usuario: '',
};

function alertaDocToAlerta(id: string, data: Record<string, unknown>, usuario?: Alerta['usuario']): Alerta {
  const created = data.created_at != null ? String(data.created_at) : new Date().toISOString();
  return {
    id,
    encuesta_id: (data.encuesta_id as string) ?? '',
    puntaje: (data.puntaje_obtenido as number) ?? 0,
    prioridad: ((data.prioridad as string) ?? 'media') as 'alta' | 'media',
    estado: ((data.estado as string) ?? 'pendiente') as 'pendiente' | 'en_atencion' | 'resuelta',
    usuario: usuario ?? usuarioVacio,
    fecha_alerta: created,
    atendida_por: data.atendida_por as number | undefined,
    fecha_atencion: data.fecha_atencion != null ? String(data.fecha_atencion) : undefined,
    accion_tomada: data.accion_tomada as string | undefined,
  };
}

export const firebaseDashboardService = {
  async obtenerMetricas(_periodo?: string, _tipoUsuario?: string, _programa?: string): Promise<Metricas> {
    const db = getFirestoreDb();
    const [usuariosSnap, encuestasSnap, alertasSnap] = await Promise.all([
      getDocs(collection(db, USUARIOS)),
      getDocs(collection(db, ENCUESTAS)),
      getDocs(collection(db, ALERTAS)),
    ]);
    const total_usuarios = usuariosSnap.size;
    const total_encuestas = encuestasSnap.size;
    const tasa_participacion = total_usuarios > 0 ? Math.round((total_encuestas / total_usuarios) * 100) : 0;
    let sumaPuntaje = 0;
    let countPuntaje = 0;
    const distribucion = { alerta_0_12: 0, bajo_13_50: 0, medio_51_75: 0, alto_76_100: 0 };
    encuestasSnap.docs.forEach((d) => {
      const data = d.data();
      const pf = (data.puntaje_final as number) ?? 0;
      sumaPuntaje += pf;
      countPuntaje += 1;
      if (pf < 13) distribucion.alerta_0_12 += 1;
      else if (pf < 51) distribucion.bajo_13_50 += 1;
      else if (pf < 76) distribucion.medio_51_75 += 1;
      else distribucion.alto_76_100 += 1;
    });
    const puntaje_promedio = countPuntaje > 0 ? Math.round(sumaPuntaje / countPuntaje) : 0;
    let pendientes = 0, en_atencion = 0, resueltas = 0;
    alertasSnap.docs.forEach((d) => {
      const est = (d.data().estado as string) ?? 'pendiente';
      if (est === 'pendiente') pendientes += 1;
      else if (est === 'en_atencion') en_atencion += 1;
      else resueltas += 1;
    });
    return {
      total_usuarios,
      total_encuestas,
      tasa_participacion,
      puntaje_promedio,
      alertas: { activas: pendientes + en_atencion, pendientes, resueltas },
      distribucion_puntajes: distribucion,
    };
  },

  async obtenerAlertas(estado: string = 'all'): Promise<Alerta[]> {
    const db = getFirestoreDb();
    let q = query(collection(db, ALERTAS), orderBy('created_at', 'desc'));
    if (estado !== 'all') {
      q = query(collection(db, ALERTAS), where('estado', '==', estado), orderBy('created_at', 'desc'));
    }
    const snap = await getDocs(q);
    const alertas: Alerta[] = [];
    for (const d of snap.docs) {
      const data = d.data() as Record<string, unknown>;
      const uid = data.usuario_id as string;
      let usuario: Alerta['usuario'];
      try {
        const userSnap = await getDoc(doc(db, USUARIOS, uid));
        const u = userSnap.data();
        usuario = {
          id: userSnap.id,
          nombres: (u?.nombres as string) ?? '',
          apellidos: (u?.apellidos as string) ?? '',
          tipo_documento: (u?.tipo_documento as string) ?? '',
          numero_documento: (u?.numero_documento as string) ?? '',
          tipo_usuario: (u?.tipo_usuario as string) ?? '',
          programa: u?.programa as string | undefined,
          cargo: u?.cargo as string | undefined,
        };
      } catch {
        usuario = usuarioVacio;
      }
      alertas.push(alertaDocToAlerta(d.id, data, usuario));
    }
    return alertas;
  },

  async resolverAlerta(alertaId: number | string, accionTomada: string, notas?: string): Promise<void> {
    const db = getFirestoreDb();
    const id = String(alertaId);
    const now = new Date().toISOString();
    const uid = getFirebaseAuth().currentUser?.uid ?? null;
    await updateDoc(doc(db, ALERTAS, id), {
      estado: 'resuelta',
      fecha_atencion: now,
      accion_tomada: accionTomada,
      notas_psicologo: notas ?? null,
      atendida_por: uid,
    });
  },

  async exportarExcel(_tipoUsuario?: string, _programa?: string, _esAlerta?: boolean): Promise<Blob> {
    return new Blob([''], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },
};

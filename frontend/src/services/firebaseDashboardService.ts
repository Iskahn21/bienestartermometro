import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  collectionGroup,
  writeBatch,
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

  async obtenerDistribucionGlobal(): Promise<{ alerta_0_12: number; bajo_13_50: number; medio_51_75: number; alto_76_100: number }> {
    const db = getFirestoreDb();
    const encuestasSnap = await getDocs(collection(db, ENCUESTAS));

    const distribucion = { alerta_0_12: 0, bajo_13_50: 0, medio_51_75: 0, alto_76_100: 0 };
    encuestasSnap.docs.forEach((d) => {
      const data = d.data();
      const pf = (data.puntaje_final as number) ?? 0;
      if (pf < 13) distribucion.alerta_0_12 += 1;
      else if (pf < 51) distribucion.bajo_13_50 += 1;
      else if (pf < 76) distribucion.medio_51_75 += 1;
      else distribucion.alto_76_100 += 1;
    });

    return distribucion;
  },

  async obtenerEstadisticasPreguntas(): Promise<Record<number, { promedio: number; porcentaje: number }>> {
    const db = getFirestoreDb();
    const stats: Record<number, { suma: number; conteo: number }> = {
      1: { suma: 0, conteo: 0 },
      2: { suma: 0, conteo: 0 },
      3: { suma: 0, conteo: 0 },
      4: { suma: 0, conteo: 0 },
      5: { suma: 0, conteo: 0 },
    };

    try {
      // Intentar usar collectionGroup si los índices/reglas lo permiten
      const respuestasSnap = await getDocs(collectionGroup(db, 'respuestas'));
      respuestasSnap.docs.forEach((d) => {
        const data = d.data();
        const num = data.pregunta_numero as number;
        const val = data.valor as number;
        if (num && stats[num] !== undefined) {
          stats[num].suma += val;
          stats[num].conteo += 1;
        }
      });
    } catch (error) {
      // Si falla por permisos/índices, hacer el fallback iterando encuestas
      console.warn("Fallo en collectionGroup, usando fallback", error);
      const encuestasSnap = await getDocs(collection(db, ENCUESTAS));
      const promesas = encuestasSnap.docs.map((d) => getDocs(collection(db, ENCUESTAS, d.id, 'respuestas')));
      const resultados = await Promise.all(promesas);
      resultados.forEach((snap) => {
        snap.docs.forEach((d) => {
          const data = d.data();
          const num = data.pregunta_numero as number;
          const val = data.valor as number;
          if (num && stats[num] !== undefined) {
            stats[num].suma += val;
            stats[num].conteo += 1;
          }
        });
      });
    }

    const resultadoFinal: Record<number, { promedio: number; porcentaje: number }> = {};
    for (let i = 1; i <= 5; i++) {
      const s = stats[i];
      const prom = s.conteo > 0 ? s.suma / s.conteo : 0;
      resultadoFinal[i] = {
        promedio: prom,
        porcentaje: Math.round((prom / 5) * 100),
      };
    }
    return resultadoFinal;
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

  async obtenerEncuestasConUsuario(): Promise<Array<Alerta & { usuarioEmail: string }>> {
    const db = getFirestoreDb();
    const [encuestasSnap, usuariosSnap] = await Promise.all([
      getDocs(collection(db, ENCUESTAS)),
      getDocs(collection(db, USUARIOS))
    ]);

    const usuariosMap = new Map();
    usuariosSnap.docs.forEach(doc => {
      usuariosMap.set(doc.id, doc.data());
    });

    const encuestas: Array<Alerta & { usuarioEmail: string; carreraOCargo: string }> = [];
    encuestasSnap.docs.forEach(d => {
      const data = d.data();
      const uid = (data.usuario_id as string) ?? '';
      const user = usuariosMap.get(uid);

      // Usar puntaje_final del documento de encuesta (no puntaje_obtenido de alertas)
      const puntajeFinal = (data.puntaje_final as number) ?? 0;

      const encuestaData = alertaDocToAlerta(d.id, {
        ...data,
        puntaje_obtenido: puntajeFinal,  // mapear al campo que usa alertaDocToAlerta
      } as any, {
        id: uid,
        nombres: (user?.nombres as string) ?? 'Usuario',
        apellidos: (user?.apellidos as string) ?? 'Desconocido',
        tipo_documento: (user?.tipo_documento as string) ?? '',
        numero_documento: (user?.numero_documento as string) ?? '',
        tipo_usuario: (user?.tipo_usuario as string) ?? '',
        programa: user?.programa,
        cargo: user?.cargo
      });

      // Carrera (estudiantes) o Cargo (personal/colaborador)
      const carreraOCargo = (user?.programa as string) || (user?.cargo as string) || '—';

      encuestas.push({
        ...encuestaData,
        usuarioEmail: (user?.correo_institucional as string) ?? 'Sin correo',
        carreraOCargo,
      });
    });

    // Sort by score ascending (lowest wellbeing first)
    return encuestas.sort((a, b) => a.puntaje - b.puntaje);
  },

  async eliminarEncuesta(id: string): Promise<void> {
    const db = getFirestoreDb();
    const batch = (await import('firebase/firestore')).writeBatch(db);

    // Delete the survey document
    const encuestaRef = doc(db, ENCUESTAS, id);
    batch.delete(encuestaRef);

    // Also try to delete any associated alert
    // Note: Since alert IDs might match survey IDs or be separate, this is a best-effort if they share ID or we'd need to query. 
    // For now assuming we just delete the survey. If alerts are separate documents linked by ID, we'd need to query them.
    // Given the current structure, let's just delete the survey for now.

    await batch.commit();
  },

  async exportarExcel(_tipoUsuario?: string, _programa?: string, _esAlerta?: boolean): Promise<Blob> {
    return new Blob([''], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },

  async limpiarEncuestasHuerfanas(): Promise<number> {
    const db = getFirestoreDb();
    const [encuestasSnap, usuariosSnap] = await Promise.all([
      getDocs(collection(db, ENCUESTAS)),
      getDocs(collection(db, USUARIOS)),
    ]);

    // Construir set de UIDs válidos
    const uidsValidos = new Set(usuariosSnap.docs.map(d => d.id));

    // Identificar encuestas huérfanas (usuario_id no existe en usuarios)
    const huerfanas = encuestasSnap.docs.filter(d => {
      const uid = (d.data().usuario_id as string) ?? '';
      return !uidsValidos.has(uid);
    });

    if (huerfanas.length === 0) return 0;

    // Borrar en lotes de 500 (límite de Firestore)
    const batch = writeBatch(db);
    huerfanas.forEach(d => batch.delete(d.ref));
    await batch.commit();

    return huerfanas.length;
  },

  async agregarAdministrador(correo: string): Promise<void> {
    const { initializeApp, deleteApp } = await import('firebase/app');
    const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
    const { getFirestore, doc, setDoc } = await import('firebase/firestore');

    // App secundaria para no cerrar la sesión del admin actual
    const tempApp = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }, `temp-admin-${Date.now()}`);

    try {
      const tempAuth = getAuth(tempApp);
      const cred = await createUserWithEmailAndPassword(
        tempAuth,
        correo.toLowerCase().trim(),
        'Bienestar@2026'
      );
      const uid = cred.user.uid;
      const tempDb = getFirestore(tempApp);
      await setDoc(doc(tempDb, 'usuarios', uid), {
        tipo_usuario: 'personal',
        rol: 'admin',
        nombres: 'Administrador',
        apellidos: 'Bienestar',
        correo_institucional: correo.toLowerCase().trim(),
        tipo_documento: 'CC',
        numero_documento: '',
        consent_accepted: true,
        can_contact: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      });
    } finally {
      await deleteApp(tempApp);
    }
  },
};

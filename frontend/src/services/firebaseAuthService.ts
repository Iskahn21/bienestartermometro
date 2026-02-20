import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from '../lib/firebase';
import type { Usuario } from '../types';
import type { RegistroEstudiante, RegistroPersonal, RegistroColaborador } from '../types';
import { DEFAULT_PROGRAMAS, DEFAULT_CARGOS } from '../constants/programasCargos';

const USUARIOS_COLLECTION = 'usuarios';

function mapFirestoreUserToUsuario(uid: string, data: Record<string, unknown>): Usuario {
  return {
    id: uid,
    tipo_usuario: (data.tipo_usuario as Usuario['tipo_usuario']) ?? 'estudiante',
    nombres: (data.nombres as string) ?? '',
    apellidos: (data.apellidos as string) ?? '',
    tipo_documento: (data.tipo_documento as Usuario['tipo_documento']) ?? 'CC',
    numero_documento: (data.numero_documento as string) ?? '',
    correo_institucional: (data.correo_institucional as string) ?? '',
    rol: (data.rol as Usuario['rol']) ?? 'user',
    programa: data.programa as string | undefined,
    promocion: data.promocion as string | undefined,
    cargo: data.cargo as string | undefined,
    consent_accepted: (data.consent_accepted as boolean) ?? false,
    consent_date: data.consent_date != null ? String(data.consent_date) : undefined,
    can_contact: (data.can_contact as boolean) ?? false,
    created_at: data.created_at != null ? String(data.created_at) : new Date().toISOString(),
    last_login: data.last_login != null ? String(data.last_login) : undefined,
  };
}

export const firebaseAuthService = {
  async login(correo: string, password: string): Promise<{ access_token: string; usuario: Usuario }> {
    const auth = getFirebaseAuth();
    const userCredential = await signInWithEmailAndPassword(auth, correo, password);
    const firebaseUser: FirebaseUser = userCredential.user;
    const idToken = await firebaseUser.getIdToken();

    const db = getFirestoreDb();
    const userDoc = await getDoc(doc(db, USUARIOS_COLLECTION, firebaseUser.uid));

    if (!userDoc.exists()) {
      throw new Error(
        'No existe un perfil de usuario en la base de datos para este correo. Contacta al administrador.'
      );
    }

    const usuario = mapFirestoreUserToUsuario(firebaseUser.uid, userDoc.data() ?? {});

    const isActive = userDoc.data()?.is_active;
    if (isActive === false) {
      throw new Error('Usuario inactivo.');
    }

    return {
      access_token: idToken,
      usuario,
    };
  },

  async registrarEstudiante(data: RegistroEstudiante): Promise<Usuario> {
    const auth = getFirebaseAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, data.correo_institucional, data.password);
    const uid = userCredential.user.uid;
    const now = new Date().toISOString();
    const db = getFirestoreDb();
    const userData = {
      tipo_usuario: 'estudiante',
      nombres: data.nombres,
      apellidos: data.apellidos,
      tipo_documento: data.tipo_documento,
      numero_documento: data.numero_documento,
      correo_institucional: data.correo_institucional,
      rol: 'user',
      programa: data.programa,
      promocion: data.promocion,
      cargo: null,
      consent_accepted: false,
      consent_date: null,
      can_contact: false,
      created_at: now,
      updated_at: now,
      last_login: null,
      is_active: true,
    };
    await setDoc(doc(db, USUARIOS_COLLECTION, uid), userData);
    return mapFirestoreUserToUsuario(uid, userData as Record<string, unknown>);
  },

  async registrarPersonal(data: RegistroPersonal): Promise<Usuario> {
    const auth = getFirebaseAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, data.correo_institucional, data.password);
    const uid = userCredential.user.uid;
    const now = new Date().toISOString();
    const db = getFirestoreDb();
    const userData = {
      tipo_usuario: 'personal',
      nombres: data.nombres,
      apellidos: data.apellidos,
      tipo_documento: data.tipo_documento,
      numero_documento: data.numero_documento,
      correo_institucional: data.correo_institucional,
      rol: 'user',
      programa: null,
      promocion: null,
      cargo: data.cargo,
      consent_accepted: false,
      consent_date: null,
      can_contact: false,
      created_at: now,
      updated_at: now,
      last_login: null,
      is_active: true,
    };
    await setDoc(doc(db, USUARIOS_COLLECTION, uid), userData);
    return mapFirestoreUserToUsuario(uid, userData as Record<string, unknown>);
  },

  async registrarColaborador(data: RegistroColaborador): Promise<Usuario> {
    const auth = getFirebaseAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, data.correo_institucional, data.password);
    const uid = userCredential.user.uid;
    const now = new Date().toISOString();
    const db = getFirestoreDb();
    const userData = {
      tipo_usuario: 'colaborador',
      nombres: data.nombres,
      apellidos: data.apellidos,
      tipo_documento: data.tipo_documento,
      numero_documento: data.numero_documento,
      correo_institucional: data.correo_institucional,
      rol: 'user',
      programa: data.programa,
      promocion: data.promocion,
      cargo: null,
      consent_accepted: false,
      consent_date: null,
      can_contact: false,
      created_at: now,
      updated_at: now,
      last_login: null,
      is_active: true,
    };
    await setDoc(doc(db, USUARIOS_COLLECTION, uid), userData);
    return mapFirestoreUserToUsuario(uid, userData as Record<string, unknown>);
  },

  async obtenerProgramas(): Promise<string[]> {
    try {
      const db = getFirestoreDb();
      const snap = await getDoc(doc(db, 'config', 'programas'));
      const data = snap.data();
      const items = Array.isArray(data?.items) ? data.items : [];
      return items.length > 0 ? items : DEFAULT_PROGRAMAS;
    } catch (error) {
      console.warn('No se pudieron obtener programas de Firestore, usando defaults:', error);
      return DEFAULT_PROGRAMAS;
    }
  },

  async obtenerCargos(): Promise<string[]> {
    try {
      const db = getFirestoreDb();
      const snap = await getDoc(doc(db, 'config', 'cargos'));
      const data = snap.data();
      const items = Array.isArray(data?.items) ? data.items : [];
      return items.length > 0 ? items : DEFAULT_CARGOS;
    } catch (error) {
      console.warn('No se pudieron obtener cargos de Firestore, usando defaults:', error);
      return DEFAULT_CARGOS;
    }
  },
};

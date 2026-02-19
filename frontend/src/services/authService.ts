import { apiClient } from '../lib/api';
import { isFirebaseConfigured } from '../lib/firebase';
import { firebaseAuthService } from './firebaseAuthService';
import type { RegistroEstudiante, RegistroPersonal, Usuario } from '../types';

export const authService = {
  async registrarEstudiante(data: RegistroEstudiante): Promise<Usuario> {
    if (isFirebaseConfigured()) {
      return firebaseAuthService.registrarEstudiante(data);
    }
    const response = await apiClient.post('/auth/registro/estudiante', data);
    return response.data;
  },
  
  async registrarPersonal(data: RegistroPersonal): Promise<Usuario> {
    if (isFirebaseConfigured()) {
      return firebaseAuthService.registrarPersonal(data);
    }
    const response = await apiClient.post('/auth/registro/personal', data);
    return response.data;
  },
  
  async login(correo: string, password: string): Promise<{ access_token: string; usuario: Usuario }> {
    if (isFirebaseConfigured()) {
      return firebaseAuthService.login(correo, password);
    }
    const formData = new FormData();
    formData.append('username', correo);
    formData.append('password', password);
    const response = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  async obtenerProgramas(): Promise<string[]> {
    if (isFirebaseConfigured()) {
      return firebaseAuthService.obtenerProgramas();
    }
    const response = await apiClient.get('/auth/programas');
    return response.data.programas;
  },
  
  async obtenerCargos(): Promise<string[]> {
    if (isFirebaseConfigured()) {
      return firebaseAuthService.obtenerCargos();
    }
    const response = await apiClient.get('/auth/cargos');
    return response.data.cargos;
  }
};

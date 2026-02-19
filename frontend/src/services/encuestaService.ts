import { apiClient } from '../lib/api';
import { isFirebaseConfigured } from '../lib/firebase';
import { firebaseEncuestaService } from './firebaseEncuestaService';
import type { EncuestaWHO5, Encuesta, ResultadoEncuesta, PreguntaWHO5 } from '../types';

export const encuestaService = {
  async aceptarConsentimiento(canContact: boolean) {
    if (isFirebaseConfigured()) {
      await firebaseEncuestaService.aceptarConsentimiento(canContact);
      return { message: 'OK', consent_date: new Date().toISOString() };
    }
    const response = await apiClient.post('/encuestas/consentimiento', null, {
      params: { can_contact: canContact }
    });
    return response.data;
  },
  
  async obtenerPreguntas(): Promise<{ preguntas: PreguntaWHO5[] }> {
    if (isFirebaseConfigured()) {
      return firebaseEncuestaService.obtenerPreguntas();
    }
    const response = await apiClient.get('/encuestas/preguntas');
    return response.data;
  },
  
  async enviarEncuesta(data: EncuestaWHO5): Promise<Encuesta> {
    if (isFirebaseConfigured()) {
      return firebaseEncuestaService.enviarEncuesta(data);
    }
    const response = await apiClient.post('/encuestas/', data);
    return response.data;
  },
  
  async obtenerMisEncuestas(): Promise<Encuesta[]> {
    if (isFirebaseConfigured()) {
      return firebaseEncuestaService.obtenerMisEncuestas();
    }
    const response = await apiClient.get('/encuestas/mis-encuestas');
    return response.data;
  },
  
  async obtenerResultado(encuestaId: number | string): Promise<ResultadoEncuesta> {
    if (isFirebaseConfigured()) {
      return firebaseEncuestaService.obtenerResultado(encuestaId);
    }
    const response = await apiClient.get(`/encuestas/${encuestaId}/resultado`);
    return response.data;
  }
};

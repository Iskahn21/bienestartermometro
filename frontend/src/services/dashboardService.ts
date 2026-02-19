import { apiClient } from '../lib/api';
import { isFirebaseConfigured } from '../lib/firebase';
import { firebaseDashboardService } from './firebaseDashboardService';
import type { Metricas, Alerta } from '../types';

export const dashboardService = {
  async obtenerMetricas(periodo: string = '30d', tipoUsuario?: string, programa?: string): Promise<Metricas> {
    if (isFirebaseConfigured()) {
      return firebaseDashboardService.obtenerMetricas(periodo, tipoUsuario, programa);
    }
    const params = new URLSearchParams({ periodo });
    if (tipoUsuario) params.append('tipo_usuario', tipoUsuario);
    if (programa) params.append('programa', programa);
    const response = await apiClient.get(`/dashboard/metricas?${params.toString()}`);
    return response.data;
  },
  
  async obtenerAlertas(estado: string = 'all'): Promise<Alerta[]> {
    if (isFirebaseConfigured()) {
      return firebaseDashboardService.obtenerAlertas(estado);
    }
    const response = await apiClient.get(`/dashboard/alertas?estado=${estado}`);
    return response.data;
  },
  
  async resolverAlerta(alertaId: number | string, accionTomada: string, notas?: string) {
    if (isFirebaseConfigured()) {
      await firebaseDashboardService.resolverAlerta(alertaId, accionTomada, notas);
      return {};
    }
    const response = await apiClient.patch(`/dashboard/alertas/${alertaId}/resolver`, null, {
      params: { accion_tomada: accionTomada, notas }
    });
    return response.data;
  },
  
  async exportarExcel(tipoUsuario?: string, programa?: string, esAlerta?: boolean): Promise<Blob> {
    if (isFirebaseConfigured()) {
      return firebaseDashboardService.exportarExcel(tipoUsuario, programa, esAlerta);
    }
    const params = new URLSearchParams();
    if (tipoUsuario) params.append('tipo_usuario', tipoUsuario);
    if (programa) params.append('programa', programa);
    if (esAlerta !== undefined) params.append('es_alerta', esAlerta.toString());
    const response = await apiClient.get(`/dashboard/export/excel?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

import type { PreguntaWHO5 } from '../types';

export const WHO5_UMBRAL_ALERTA = 13;
export const WHO5_CAMBIO_SIGNIFICATIVO = 10;

export const WHO5_PREGUNTAS: PreguntaWHO5[] = [
  { numero: 1, texto: 'Me he sentido alegre y de buen humor', opciones: [{ valor: 5, label: 'Todo el tiempo' }, { valor: 4, label: 'La mayor parte del tiempo' }, { valor: 3, label: 'Más de la mitad del tiempo' }, { valor: 2, label: 'Menos de la mitad del tiempo' }, { valor: 1, label: 'De vez en cuando' }, { valor: 0, label: 'Nunca' }] },
  { numero: 2, texto: 'Me he sentido tranquilo y relajado', opciones: [{ valor: 5, label: 'Todo el tiempo' }, { valor: 4, label: 'La mayor parte del tiempo' }, { valor: 3, label: 'Más de la mitad del tiempo' }, { valor: 2, label: 'Menos de la mitad del tiempo' }, { valor: 1, label: 'De vez en cuando' }, { valor: 0, label: 'Nunca' }] },
  { numero: 3, texto: 'Me he sentido activo y enérgico', opciones: [{ valor: 5, label: 'Todo el tiempo' }, { valor: 4, label: 'La mayor parte del tiempo' }, { valor: 3, label: 'Más de la mitad del tiempo' }, { valor: 2, label: 'Menos de la mitad del tiempo' }, { valor: 1, label: 'De vez en cuando' }, { valor: 0, label: 'Nunca' }] },
  { numero: 4, texto: 'Me he despertado fresco y descansado', opciones: [{ valor: 5, label: 'Todo el tiempo' }, { valor: 4, label: 'La mayor parte del tiempo' }, { valor: 3, label: 'Más de la mitad del tiempo' }, { valor: 2, label: 'Menos de la mitad del tiempo' }, { valor: 1, label: 'De vez en cuando' }, { valor: 0, label: 'Nunca' }] },
  { numero: 5, texto: 'Mi vida cotidiana ha estado llena de cosas que me interesan', opciones: [{ valor: 5, label: 'Todo el tiempo' }, { valor: 4, label: 'La mayor parte del tiempo' }, { valor: 3, label: 'Más de la mitad del tiempo' }, { valor: 2, label: 'Menos de la mitad del tiempo' }, { valor: 1, label: 'De vez en cuando' }, { valor: 0, label: 'Nunca' }] },
];

export function calcularPuntajeRaw(valores: number[]): number {
  if (valores.length !== 5 || !valores.every((v) => v >= 0 && v <= 5)) throw new Error('Deben ser 5 valores entre 0 y 5');
  return valores.reduce((a, b) => a + b, 0);
}

export function calcularPuntajeFinal(puntajeRaw: number): number {
  return puntajeRaw * 4;
}

export function esAlerta(puntajeFinal: number): boolean {
  return puntajeFinal < WHO5_UMBRAL_ALERTA;
}

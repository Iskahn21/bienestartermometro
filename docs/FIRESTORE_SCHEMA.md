# Esquema Firestore (equivalente a la base de datos PostgreSQL)

Este documento describe las colecciones de Firestore que reemplazan las tablas del esquema relacional (usuarios, encuestas, alertas, respuestas).

## Relaciones

- **usuarios** → uno a muchos → **encuestas**
- **encuestas** → uno a muchos → **respuestas** (subcolección)
- **encuestas** → uno a uno (opcional) → **alertas**
- **usuarios** → uno a muchos → **alertas**

El identificador del usuario en Firebase es el **UID** de Firebase Authentication (no un número autoincremental).

---

## 1. Colección `usuarios`

**Ruta:** `usuarios/{uid}`  
**Document ID:** `uid` = UID de Firebase Auth (string).

| Campo               | Tipo     | Descripción |
|---------------------|----------|-------------|
| tipo_usuario        | string   | `"estudiante"` \| `"personal"` \| `"admin"` \| `"psicologo"` |
| nombres             | string   | Nombres |
| apellidos           | string   | Apellidos |
| tipo_documento      | string   | `"CC"` \| `"TI"` |
| numero_documento    | string   | Número de documento |
| correo_institucional| string   | Email (debe coincidir con el de Firebase Auth) |
| rol                 | string   | `"user"` \| `"admin"` \| `"psicologo"` \| `"analista"` |
| programa            | string?  | Solo estudiantes |
| promocion           | string?  | Solo estudiantes (ej: "2024-1") |
| cargo               | string?  | Solo personal |
| consent_accepted    | boolean  | Consentimiento aceptado |
| consent_date       | timestamp? | Fecha de consentimiento |
| can_contact         | boolean  | Permite contacto |
| created_at          | timestamp | Alta del usuario |
| updated_at          | timestamp | Última actualización |
| last_login          | timestamp? | Último acceso |
| is_active           | boolean  | Cuenta activa |

**Nota:** No se guarda `password_hash`; Firebase Authentication gestiona la contraseña.

---

## 2. Colección `encuestas`

**Ruta:** `encuestas/{encuestaId}`  
**Document ID:** Auto-ID generado por Firestore.

| Campo        | Tipo      | Descripción |
|--------------|-----------|-------------|
| usuario_id   | string    | UID del usuario (referencia a `usuarios/{uid}`) |
| created_at   | timestamp | Creación del registro |
| started_at   | timestamp | Inicio de la encuesta |
| completed_at| timestamp? | Fin de la encuesta |
| puntaje_raw  | number    | Puntaje 0-25 |
| puntaje_final| number    | Puntaje 0-100 |
| es_alerta    | boolean   | true si puntaje bajo (ej. &lt; 13) |
| comentario   | string?   | Comentario opcional |
| estado       | string    | `"completada"` \| `"en_revision"` |

---

## 3. Subcolección `respuestas` (dentro de `encuestas`)

**Ruta:** `encuestas/{encuestaId}/respuestas/{respuestaId}`

| Campo           | Tipo   | Descripción |
|-----------------|--------|-------------|
| pregunta_numero | number | 1-5 (WHO-5) |
| valor           | number | 0-5 |

Cada encuesta tiene hasta 5 documentos en esta subcolección (una por pregunta).

---

## 4. Colección `alertas`

**Ruta:** `alertas/{alertaId}`  
**Document ID:** Auto-ID.

| Campo           | Tipo      | Descripción |
|-----------------|-----------|-------------|
| encuesta_id     | string    | ID del documento en `encuestas` |
| usuario_id      | string    | UID del usuario |
| puntaje_obtenido| number    | Puntaje que generó la alerta |
| prioridad       | string    | `"alta"` \| `"media"` |
| estado          | string    | `"pendiente"` \| `"en_atencion"` \| `"resuelta"` |
| atendida_por    | string?   | UID del psicólogo/admin que atiende |
| fecha_atencion  | timestamp?| Fecha de atención |
| accion_tomada   | string?   | Descripción de la acción |
| notas_psicologo | string?   | Notas del psicólogo |
| created_at      | timestamp | Creación de la alerta |

---

## Índices recomendados en Firestore

En la consola de Firebase → Firestore → Índices, crear compuestos si haces consultas como:

- **encuestas:** `usuario_id` (Ascending) + `created_at` (Descending)
- **alertas:** `estado` (Ascending) + `created_at` (Descending)
- **alertas:** `usuario_id` (Ascending) + `created_at` (Descending)

Los índices simples se crean automáticamente.

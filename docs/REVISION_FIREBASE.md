# Revisión: Conexión del proyecto a Firebase

## ✅ Qué está conectado a Firebase

Cuando el archivo **`frontend/.env`** tiene las variables `VITE_FIREBASE_*` configuradas, **todo el flujo usa Firebase** (Auth + Firestore) en lugar del backend:

| Funcionalidad | Firebase | Detalle |
|---------------|----------|---------|
| **Login** | ✅ | Firebase Auth + documento en `usuarios/{uid}` |
| **Registro (estudiante y personal)** | ✅ | `createUserWithEmailAndPassword` + `setDoc(usuarios/{uid})` |
| **Programas y cargos (listas para registro)** | ✅ | Lectura desde Firestore `config/programas` y `config/cargos` (ver más abajo) |
| **Consentimiento** | ✅ | `updateDoc` en `usuarios/{uid}` |
| **Preguntas WHO-5** | ✅ | Constantes en frontend (no llama al backend) |
| **Enviar encuesta** | ✅ | `addDoc` en `encuestas` + subcolección `respuestas` + `alertas` si aplica |
| **Mis encuestas** | ✅ | Query `encuestas` por `usuario_id` |
| **Resultado de encuesta** | ✅ | `getDoc(encuestas/{id})` |
| **Dashboard – métricas** | ✅ | Agregación sobre colecciones `usuarios`, `encuestas`, `alertas` |
| **Dashboard – alertas** | ✅ | Query `alertas` (con datos de usuario desde `usuarios`) |
| **Resolver alerta** | ✅ | `updateDoc(alertas/{id})` |
| **Exportar Excel** | ⚠️ | Con Firebase devuelve un blob vacío (no implementada la exportación desde Firestore) |

---

## Dónde poner datos en Firestore

1. **`usuarios/{uid}`**  
   Se crean al registrarse (estudiante o personal). No hace falta crearlos a mano si usas el registro de la app.

2. **`config/programas`** (opcional)  
   Para personalizar los programas en el registro de **estudiante**, crea en Firestore:
   - **Colección:** `config`
   - **ID del documento:** `programas`
   - **Campo:** `items` (tipo **array**) con strings, ej.: `["Administración de Empresas", "Psicología", ...]`  
   Si no existe o `items` está vacío, la app usa la lista por defecto (ver `frontend/src/constants/programasCargos.ts`).

3. **`config/cargos`** (opcional)  
   Para personalizar los cargos en el registro de **personal**:
   - **Colección:** `config`
   - **ID del documento:** `cargos`
   - **Campo:** `items` (tipo **array**) con strings, ej.: `["Docente Tiempo Completo", "Coordinador Académico", ...]`  
   Si no existe o `items` está vacío, la app usa la lista por defecto.

---

## Índices compuestos en Firestore

Si Firestore pide índices al usar la app, créalos desde el enlace del error o en **Firestore → Índices**:

- **Colección `encuestas`:** `usuario_id` (Ascending) + `created_at` (Descending)
- **Colección `alertas`:** `estado` (Ascending) + `created_at` (Descending)
- **Colección `alertas`:** solo `created_at` (Descending) si consultas sin filtrar por estado

---

## Cómo comprobar que todo usa Firebase

1. Tener **`frontend/.env`** con todas las `VITE_FIREBASE_*` del proyecto **termometro-2717f**.
2. En Firebase Console: Authentication con **Correo/Contraseña** activado y Firestore creado.
3. Registrar un usuario desde la app → debe crearse en Auth y el documento en `usuarios/{uid}`.
4. Iniciar sesión → debe entrar con Firebase y cargar el perfil desde Firestore.
5. Aceptar consentimiento, hacer una encuesta, ver resultado y (con rol admin/psicólogo) entrar al dashboard y resolver una alerta → todo sin llamar al backend.

Si quitas las variables de Firebase del `.env` o las dejas vacías, la app vuelve a usar el backend (FastAPI) para todo.

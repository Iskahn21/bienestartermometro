# Configuración de Firebase (Auth + Firestore)

## 1. Dónde poner los datos de Firebase

### En el frontend (obligatorio para login)

Crea o edita el archivo **`frontend/.env`** en la raíz de la carpeta `frontend` y agrega las variables que te da la consola de Firebase:

```env
# Firebase (obtener en https://console.firebase.google.com → Tu proyecto → Configuración del proyecto → Tus apps)
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**Cómo obtener estos valores:**

1. Entra en [Firebase Console](https://console.firebase.google.com).
2. Crea un proyecto (o elige uno existente).
3. Ve a **Configuración del proyecto** (icono de engranaje) → **General**.
4. En “Tus apps”, añade una app **Web** (</>).
5. Copia el objeto `firebaseConfig` que te muestra; cada propiedad corresponde a una variable `VITE_FIREBASE_*` (con el prefijo `VITE_` para que Vite las exponga al frontend).

**Importante:** No subas el archivo `.env` a Git (debe estar en `.gitignore`). Para que otros desarrolladores sepan qué variables usar, puedes tener un **`frontend/.env.example`** con las claves vacías:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## 2. Habilitar Authentication (inicio de sesión)

1. En Firebase Console → **Compilación** → **Authentication**.
2. Pulsa **Comenzar**.
3. En la pestaña **Sign-in method**, habilita **Correo electrónico/Contraseña** (y, si quieres, “Enlace de correo” para verificación).
4. Guarda.

Con esto ya puedes usar inicio de sesión con email y contraseña en la app.

---

## 3. Firestore (base de datos)

1. En Firebase Console → **Compilación** → **Firestore Database**.
2. **Crear base de datos** (modo producción o prueba; en desarrollo puedes usar “prueba” con reglas permisivas).
3. Elige una ubicación y confirma.

Las colecciones a crear son las descritas en **`docs/FIRESTORE_SCHEMA.md`** (usuarios, encuestas, alertas, respuestas).

---

## 4. Crear el documento del usuario al registrarse

Cuando un usuario se registre con Firebase Auth (email/contraseña), debes crear (o actualizar) su perfil en Firestore en la ruta:

- **`usuarios/{uid}`**

donde `uid` es el UID que devuelve Firebase Auth. Así la app puede leer rol, programa, consentimiento, etc. desde Firestore después del login.

---

## 5. Resumen de dónde poner datos

| Dónde | Qué poner |
|-------|-----------|
| **`frontend/.env`** | Todas las variables `VITE_FIREBASE_*` del paso 1. |
| **Firebase Console → Authentication** | Activar proveedor “Correo/Contraseña”. |
| **Firebase Console → Firestore** | Crear la base de datos y, según la app, las colecciones del esquema. |
| **Código (registro)** | Después de `createUserWithEmailAndPassword`, escribir el perfil en `usuarios/{uid}` con los campos del esquema. |

Una vez tengas el `.env` con los valores de Firebase y Authentication y Firestore configurados, el inicio de sesión con Firebase en la app debería funcionar usando la integración que está en el frontend.

---

## 6. Reglas de Firestore

En el proyecto hay un archivo **`firebase/firestore.rules`** con reglas básicas. Para aplicarlas:

1. Instala Firebase CLI: `npm install -g firebase-tools`
2. Inicia sesión: `firebase login`
3. En la raíz del proyecto: `firebase init firestore` y elige el proyecto; usa el archivo `firebase/firestore.rules` como reglas.
4. Despliega: `firebase deploy --only firestore:rules`

En desarrollo puedes usar temporalmente reglas en modo “prueba” desde la consola (lectura/escritura permitidas durante 30 días).

---

## 7. Uso con el backend actual

Si mantienes el backend (FastAPI) para encuestas y dashboard: al iniciar sesión con Firebase, el token que se guarda es el **Firebase ID token**. Las peticiones a tu API seguirán enviando ese token en `Authorization: Bearer ...`. Para que el backend acepte ese token, tendrías que instalar **Firebase Admin SDK** en el backend y verificar el token en cada petición protegida. Mientras no lo hagas, el login con Firebase funcionará y verás al usuario en la app, pero las rutas que llaman al backend (encuesta, dashboard, etc.) pueden devolver 401 hasta que el backend valide tokens de Firebase.

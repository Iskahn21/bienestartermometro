# Documentos de listado en Firestore (config)

La app lee las listas de **programas** y **cargos** desde Firestore cuando usas Firebase. La ruta y el formato deben ser exactamente los siguientes.

---

## Estructura del documento de listado

| Dónde en Firestore | Uso en la app |
|--------------------|----------------|
| Colección **`config`** → documento **`programas`** | Desplegable "Selecciona un programa" (registro estudiante) |
| Colección **`config`** → documento **`cargos`** | Desplegable de cargo (registro personal) |

Cada documento debe tener **un solo campo**:

- **Nombre del campo:** `items`
- **Tipo:** array (matriz)
- **Contenido:** lista de strings

---

## Cómo crearlos en la consola de Firebase

1. Ve a **Firestore Database** → **Iniciar colección** (o añade a la colección existente).
2. **ID de la colección:** `config` → Siguiente.
3. **ID del documento:** `programas` (o `cargos`).
4. Añade el campo:
   - **Campo:** `items`
   - **Tipo:** array
   - Añade los elementos (strings) que quieras, uno por uno.

Ejemplo para **programas**:

- Campo `items` (array): `"Administración de Empresas"`, `"Psicología"`, `"Ingeniería de Sistemas"`, etc.

Ejemplo para **cargos**:

- Campo `items` (array): `"Docente Tiempo Completo"`, `"Coordinador Académico"`, etc.

---

## Si no creas estos documentos

La app usa las listas por defecto definidas en **`frontend/src/constants/programasCargos.ts`** (misma lista que el backend). Los desplegables se ven igual; solo necesitas crear `config/programas` y `config/cargos` si quieres listas distintas a las por defecto.

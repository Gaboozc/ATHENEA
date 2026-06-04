# Plantilla WebApp con React JS

> 🎥 Esta plantilla es propiedad de AlphaDev.

Creada por AlphaDev, esta plantilla es software propietario diseñado exclusivamente para uso de AlphaDev. Ayuda a iniciar aplicaciones web multi-página integrándose con la última versión de React, React-Router, despliegues en Vercel y Vite para el empaquetado.

### Empezando:

> 📦 Asegúrate de usar al menos la versión 18 de Node.

1. Instala las dependencias del paquete node escribiendo: `$ npm install`

2. Crea un archivo .env basado en el .env.example escribiendo `$ cp .env.example .env`

3. ¡Comienza a programar! y el servidor de desarrollo de vite con recarga en vivo escribiendo: `$ npm run start`

### Estilos

Puedes actualizar el archivo `./index.css` o crear nuevos archivos `.css` e importarlos en tus archivos css o js actuales según tus necesidades.

### Componentes

Agrega más archivos en tu carpeta `./src/components` según los necesites e impórtalos en tus paginas actuales según sea necesario.

### Páginas

Agrega más archivos en tu carpeta `./js/pages` e impórtalos en `./routes.jsx`.
Cada página debe coincidir con al menos una ruta dentro de `routes.jsx`

### Almacenamiento Centralizado con useReducer

Esta plantilla viene con un estado general y centralizado que se comparte con todas las páginas y componentes, lo llamamos "store".

El archivo `./src/store.js` tiene una estructura predeterminada para el store, te animamos a cambiarla y adaptarla a tus necesidades de datos (por ejemplo, si estás haciendo una `Lista de tareas` probablemente tendrás un arreglo de tareas aquí).

💡Nota: Hay un ejemplo usando el store y dispatcher de useReducer en el archivo `pages/demo.js`;

+ Entiende como funciona el `useReducer`
+ Lee más sobre implementar un estado global con API de Contexto
+ Lee más sobre hooks de react

El `Proveedor` del store para este contexto ya está configurado en `./src/main.jsx`. Puedes acceder al store desde cualquier componente usando el hook `useGlobalReducer` para obtener el `store` y el `despachador`. Consulta `/views/demo.js` para ver una demostración. Aquí tienes un ejemplo más pequeño:

```jsx
import useGlobalReducer from "./src/hooks/useGlobalReducer";

const MyComponentSuper = () => {
  //aquí usas el hook para obtener el despachador y el almacén
  import { dispatch, store } = useGlobalReducer();

  return <div>{/* puedes usar tus acciones o el almacén dentro del html */}</div>
}
```

## ¡Publica tu sitio web!

1. **Vercel:** El proveedor de alojamiento GRATUITO recomendado es [vercel.com](https://vercel.com/), puedes desplegar en 1 minuto escribiendo los siguientes 2 comandos:

Iniciar sesión (necesitas tener una cuenta):
```sh
$ npm i vercel -g && vercel login
```
Desplegar:
```sh
$ vercel --prod
```
✎ Nota: Si no tienes una cuenta, simplemente ve a vercel.com, crea una cuenta y regresa aquí.

## Contribuidores

Esta plantilla fue construida por AlphaDev y Gabriel Zavarse. Este software es propietario de AlphaDev y está destinado exclusivamente para uso de AlphaDev.

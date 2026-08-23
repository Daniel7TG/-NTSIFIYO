<div align="center">

# 🌿 Mazahua Connect

### Plataforma educativa interactiva para el aprendizaje de la lengua mazahua

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/Licencia-Académica-orange?style=for-the-badge)](#)

---

*Preservando y promoviendo la lengua mazahua a través de la tecnología educativa*

</div>

---

## 📋 Descripción

**Mazahua Connect** es una plataforma web educativa desarrollada como proyecto del **Tecnológico Nacional de México (TECNM)** con el objetivo de facilitar el aprendizaje de la **lengua mazahua** mediante actividades interactivas y gamificación.

El sistema permite a **docentes** crear actividades personalizadas y a **estudiantes** aprender vocabulario a través de juegos como **Memoria Rápida** y **Quizzes**, ganando experiencia (XP) y estrellas por su desempeño.

---

## ✨ Características Principales

| Funcionalidad | Descripción |
|---|---|
| 🎓 **Roles diferenciados** | Vistas y permisos separados para docentes y estudiantes |
| ⚡ **Memoria Rápida** | Juego de ritmo: asocia palabras mazahua con imágenes deslizando tarjetas en 60 segundos |
| 📝 **Quizzes** | Evaluaciones de opción múltiple sobre vocabulario mazahua |
| ⭐ **Sistema de XP** | Puntuación basada en precisión, combos y velocidad |
| 🔐 **Autenticación** | Login con JWT, roles de maestro y estudiante |
| 📊 **Dashboard** | Panel personalizado para cada rol con estadísticas |
| 🎨 **Diseño Responsivo** | Interfaz moderna con gradientes verdes/amarillos y tipografía Poppins |

---

## 🛠️ Stack Tecnológico

<div align="center">

| Capa | Tecnología | Versión |
|:---:|:---:|:---:|
| **Frontend** | React + React Router | 18.2 / 6.20 |
| **Backend** | Node.js + Express | 4.18 |
| **Base de datos** | MySQL | 8.x |
| **Autenticación** | JWT + bcrypt | — |
| **Estilos** | CSS3 (Vanilla) | — |
| **Fuentes** | Poppins, Public Sans | Google Fonts |

</div>

---

## 🚀 Instalación y Ejecución

### Prerrequisitos

- **Node.js** v16 o superior
- **npm** v8 o superior
- **MySQL** 8.x (opcional, se usan mock data por defecto)

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/Migeru71/J-atrjo.git
cd mazahua-connect
```

### 2️⃣ Instalar dependencias

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3️⃣ Configurar variables de entorno

Crear un archivo `.env` en la carpeta `server/`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=mazahua_connect
JWT_SECRET=tu_clave_secreta
```

### 4️⃣ Ejecutar el proyecto

Abrir **dos terminales** simultáneamente:

```bash
# Terminal 1 — Backend
cd server
node server.js
# → Servidor corriendo en http://localhost:5000
```

```bash
# Terminal 2 — Frontend
cd client
npm start
# → Aplicación en http://localhost:3000
```

---

## 👥 Roles del Sistema

### 🧑‍🏫 Docente
- Crear y gestionar actividades de vocabulario
- Configurar dificultad y categorías
- Ver resultados de los estudiantes
- Acceder al panel de administración

### 🧑‍🎓 Estudiante
- Jugar **Memoria Rápida** y **Quizzes**
- Ganar XP y estrellas según desempeño
- Ver progreso personal en el dashboard
- Acceder a actividades asignadas

---

## 📐 Casos de Uso

| ID | Caso de Uso | Actor |
|:---:|---|:---:|
| CU-013 | Crear actividad educativa | Docente |
| CU-014 | Jugar y guardar resultado | Estudiante |

---

## 🎨 Paleta de Colores

```
🟠 Primary Orange   #E65100   — Acentos, botones principales
🔵 Primary Blue     #1E3A8A   — Títulos, encabezados
🟢 Background Start #A8E6CF   — Gradiente verde (inicio)
🟡 Background End   #FFF9C4   — Gradiente amarillo (fin)
✅ Success          #10B981   — Correcto, éxito
❌ Error            #EF4444   — Incorrecto, error
```

---

## 📄 Documentación

La carpeta `docs/` contiene documentación adicional del proyecto:
- DTOs de referencia
- Diagramas de casos de uso
- Especificaciones de la API

---

## 🤝 Contribuidores

<div align="center">

Proyecto desarrollado para el **Tecnológico Nacional de México (TECNM)** — 2025

</div>

---

<div align="center">

**Mazahua Connect** · Preservando la lengua mazahua 🌿


</div>

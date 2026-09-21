# 📐 Transformaciones Geométricas Interactivas (2D / 3D)

> **Visualizador matemático interactivo para exploración y análisis de transformaciones lineales, homotecias, rotaciones y traslaciones matriciales en tiempo real.**

![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)
![HTML5 Canvas](https://img.shields.io/badge/Render-HTML5%20Canvas%20%2F%20WebGL-E34F26?style=flat-square&logo=html5&logoColor=white)
![Mathematics](https://img.shields.io/badge/Domain-Educación%20Matemática-10B981?style=flat-square)

---

## 🎯 Propósito del Proyecto

En la enseñanza del Álgebra Lineal y la Geometría Analítica, los estudiantes suelen memorizar matrices de transformación sin comprender su significado geométrico intrínseco. 

Este proyecto nace de la intersección entre la **Educación Matemática** y el **Desarrollo de Software**, proporcionando un laboratorio visual donde los parámetros algebraicos modifican vectores, polígonos y planos en tiempo real con respuesta fluida a 60 FPS.

---

## ✨ Características Técnicas

- 🔄 **Transformaciones Lineales Básicas**:
  - **Rotación**: Matriz $R(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}$ con control angular continuo.
  - **Escalamiento / Homotecia**: Factores independientes en los ejes $X$ e $Y$.
  - **Cizallamiento (Shear)**: Deformación angular respecto a los ejes principales.
  - **Reflexión**: Simetría respecto al origen, ejes coordenados o rectas arbitrarias $y = mx$.
- 🧮 **Composición de Transformaciones**: Demostración visual de la **no conmutatividad** del producto matricial ($A \cdot B \neq B \cdot A$).
- ⚡ **Renderizado de Alto Rendimiento**: Canvas 2D optimizado con cálculo vectorial puro en TypeScript sin librerías externas pesadas.
- 🎨 **Controles Reactivos**: Deslizadores paramétricos, cuadrícula cartesiana con zoom y coordenadas cartesianas flotantes al cursor.

---

## 🏗️ Arquitectura del Código

```text
src/
├── math/
│   ├── Vector2D.ts         # Operaciones vectoriales (suma, producto punto, norma)
│   ├── Matrix2x2.ts        # Operaciones matriciales (determinante, inversa, multiplicación)
│   └── TransformEngine.ts  # Aplicación de transformaciones afines
├── renderer/
│   ├── CanvasRenderer.ts   # Renderizado de grilla, ejes y polígonos
│   └── Viewport.ts         # Mapeo espacio de mundo <-> espacio de pantalla
└── main.ts                 # Controlador de eventos y ciclo de animación
```

---

## 🚀 Ejecución Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/juanxaviercasa/transformaciones_geometricas.git
cd transformaciones_geometricas

# 2. Instalar dependencias
npm install

# 3. Iniciar entorno de desarrollo
npm run dev
```

---

## 👨‍💻 Autor

Desarrollado por **Juan Xavier Cabello** — Educador Matemático & Full-Stack Software Engineer.  
[LinkedIn](https://www.linkedin.com/in/xaviercabello/) · [GitHub](https://github.com/juanxaviercasa)

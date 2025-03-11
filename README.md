## Counter Chuleta

Una aplicación web para gestionar contadores personalizados, organizada por grupos temáticos y con estadísticas.

## Características

- Autenticación de usuarios: Registro e inicio de sesión seguros
- Grupos temáticos: Organiza tus contadores en grupos personalizables
- Contadores personalizables: 
  - Asigna colores a cada contador
  - Establece valores iniciales
  - Minimiza contadores que no estás usando
- Estadísticas: Visualiza el uso de tus contadores con gráficos
- Modo oscuro: Interfaz adaptable para uso diurno y nocturno
- Diseño responsive: Funciona en dispositivos móviles y de escritorio

## Estructura del proyecto

/
├── css/                    # Estilos CSS organizados por componentes
│   ├── animations.css      # Animaciones y transiciones
│   ├── auth.css            # Estilos para la autenticación
│   ├── buttons.css         # Estilos de botones
│   ├── counter.css         # Estilos específicos de contadores
│   ├── general.css         # Estilos generales
│   ├── groups.css          # Estilos para grupos de contadores
│   ├── layout.css          # Estructura y disposición
│   ├── main.css            # Archivo principal que importa todos los CSS
│   ├── modals.css          # Estilos para ventanas modales
│   ├── responsive.css      # Ajustes para diferentes dispositivos
│   ├── statistics.css      # Estilos para la sección de estadísticas
│   ├── styles.css          # Estilos adicionales
│   ├── templates.css       # Estilos para plantillas de grupos
│   ├── theme.css           # Estilos para temas claro/oscuro
│   └── variables.css       # Variables CSS para personalización
│
├── js/                     # Scripts JavaScript
│   ├── app.js              # Lógica principal de la aplicación
│   ├── auth.js             # Gestión de autenticación
│   ├── counter.js          # Funcionalidad de contadores
│   ├── firebase-config.js  # Configuración de Firebase
│   ├── statistics.js       # Generación de gráficos y estadísticas
│   ├── templates.js        # Plantillas predefinidas
│   └── ui.js               # Interacciones de interfaz
│
├── +.png                   # Logo de la aplicación
├── index.html              # Página principal
└── README.md               # Este archivo


## Tecnologías utilizadas

- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Frameworks/Librerías:
  - Bootstrap 5.3.0 - Framework CSS para diseño responsive
  - Font Awesome 6.0.0 - Iconos vectoriales
  - Chart.js - Visualización de datos con gráficos
- Backend/Almacenamiento:
  - Firebase Authentication - Gestión de usuarios
  - Firebase Firestore - Base de datos NoSQL en la nube
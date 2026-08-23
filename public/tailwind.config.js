// client/public/tailwind.config.js
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#E65100",           // Naranja Primario
                "primary-dark": "#1E3A8A",      // Azul Primario
                "background-start": "#A8E6CF",  // Menta
                "background-end": "#FFF9C4",    // Amarillo Crema
                "surface-light": "#FFFFFF",
                "text-main-light": "#374151",   // Gris de la guía
                "accent-pink": "#D81B60",       // Rosa de realce
            },
            fontFamily: {
                "display": ["Poppins", "sans-serif"],
                "sans": ["Public Sans", "sans-serif"]
            },
            borderRadius: {
                "card-lg": "20px",
                "card-md": "15px",
                "img": "12px"
            }
        },
    },
};
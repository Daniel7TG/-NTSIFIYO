from pathlib import Path
from PIL import Image

# Constante para indicar el porcentaje de calidad (0 a 100)
CALIDAD_WEBP = 60

# Breakpoints de ancho en píxeles para diferentes dispositivos
# Ordenados de mayor a menor para priorizar la imagen más pesada primero
BREAKPOINTS = [2729, 1920, 1440, 1024, 768, 640, 480]

# Nombres descriptivos para cada breakpoint
BREAKPOINT_NAMES = {
    2729: "desktop-xl",
    1920: "desktop",
    1440: "desktop-sm",
    1024: "tablet",
    768: "mobile-landscape",
    640: "mobile",
    480: "mobile-sm",
}


def convertir_imagenes_a_webp_responsive(ruta_carpeta):
    """
    Busca todas las imágenes PNG, JPG y JPEG en el directorio especificado
    y genera versiones WebP para cada breakpoint definido.
    Las imágenes se escalan manteniendo la proporción original basándose
    en el ancho máximo de cada breakpoint.
    """
    carpeta = Path(ruta_carpeta)

    # Validación del directorio
    if not carpeta.is_dir():
        print(f"Error: La ruta '{ruta_carpeta}' no existe o no es una carpeta.")
        return

    # Extensiones compatibles
    extensiones = ('.png', '.jpg', '.jpeg')

    archivos_procesados = 0
    total_versiones = 0

    # Iteración sobre los archivos en la carpeta
    for archivo in carpeta.iterdir():
        if archivo.suffix.lower() in extensiones:
            try:
                with Image.open(archivo) as img:
                    original_width, original_height = img.size
                    print(f"\nProcesando: {archivo.name} ({original_width}x{original_height})")

                    for breakpoint in BREAKPOINTS:
                        # Solo generar versiones si la imagen original es más grande que el breakpoint
                        if original_width <= breakpoint:
                            if breakpoint == BREAKPOINTS[0]:
                                # Si la imagen es más pequeña que el breakpoint más grande,
                                # generar al menos una versión con su tamaño original
                                new_width = original_width
                                new_height = original_height
                                img_resized = img.copy()
                            else:
                                continue
                        else:
                            # Escalar manteniendo la proporción
                            new_width = breakpoint
                            new_height = int((breakpoint / original_width) * original_height)
                            img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

                        # Generar nombre del archivo con sufijo del breakpoint
                        nombre_base = archivo.stem
                        sufijo = BREAKPOINT_NAMES.get(breakpoint, breakpoint)
                        nombre_salida = f"{nombre_base}-{sufijo}.webp"
                        ruta_salida = carpeta / nombre_salida

                        # Guardar imagen WebP
                        img_resized.save(ruta_salida, format="webp", quality=CALIDAD_WEBP)
                        print(f"  -> {nombre_salida} ({new_width}x{new_height})")
                        total_versiones += 1

                archivos_procesados += 1

            except Exception as e:
                print(f"Fallo al procesar {archivo.name}: {e}")

    print(f"\n{'='*50}")
    print(f"Proceso finalizado.")
    print(f"Imágenes originales procesadas: {archivos_procesados}")
    print(f"Total de versiones generadas: {total_versiones}")
    print(f"{'='*50}")


if __name__ == "__main__":
    # Sustituye el valor por la ruta absoluta o relativa de tu carpeta
    directorio_imagenes = "./client/src/assets/map/"

    convertir_imagenes_a_webp_responsive(directorio_imagenes)

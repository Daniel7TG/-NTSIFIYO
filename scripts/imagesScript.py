from pathlib import Path
from PIL import Image

# Constante para indicar el porcentaje de calidad (0 a 100)
CALIDAD_WEBP = 60
# Opciones: "full", 1080, 720, 480 (se refiere a la altura máxima)
RESOLUCION = 720

def convertir_imagenes_a_webp(ruta_carpeta):
    """
    Busca todas las imágenes PNG, JPG y JPEG en el directorio especificado 
    y genera una copia en formato WebP con la calidad definida y la resolución ajustada.
    """
    carpeta = Path(ruta_carpeta)
    
    # Validación del directorio
    if not carpeta.is_dir():
        print(f"Error: La ruta '{ruta_carpeta}' no existe o no es una carpeta.")
        return

    # Extensiones compatibles
    extensiones = ('.png', '.jpg', '.jpeg')
    
    archivos_procesados = 0
    # Iteración sobre los archivos en la carpeta
    for archivo in carpeta.iterdir():
        if archivo.suffix.lower() in extensiones:
            ruta_webp = archivo.with_suffix('.webp')
            
            try:
                with Image.open(archivo) as img:
                    # Ajuste de resolución si no es "full"
                    if RESOLUCION != "full":
                        width, height = img.size
                        if height > RESOLUCION:
                            new_height = RESOLUCION
                            new_width = int((new_height / height) * width)
                            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                            print(f"Redimensionado: {archivo.name} a {new_width}x{new_height}")

                    # Se guarda la imagen aplicando la constante de calidad
                    img.save(ruta_webp, format="webp", quality=CALIDAD_WEBP)
                print(f"Éxito: {archivo.name} -> {ruta_webp.name}")
                archivos_procesados += 1
                
            except Exception as e:
                print(f"Fallo al procesar {archivo.name}: {e}")

    print(f"\nProceso finalizado. Total de imágenes convertidas: {archivos_procesados}")

# Ejecución del código
if __name__ == "__main__":
    # Sustituye el valor por la ruta absoluta o relativa de tu carpeta
    directorio_imagenes = "./client/src/assets/map/" 
    
    convertir_imagenes_a_webp(directorio_imagenes)
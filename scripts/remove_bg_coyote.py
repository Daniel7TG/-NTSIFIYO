import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

def remove_white_background(
    image_path, 
    output_path, 
    threshold=240, 
    feather_radius=1
):
    """
    Removes the white background from an image.
    Uses border-based floodfill to preserve white areas inside the subject.
    """
    try:
        # Load the image and ensure it's in RGB
        with Image.open(image_path) as img:
            orig_format = img.format or "PNG"
            width, height = img.size
            rgb_img = img.convert("RGB")
            rgb_pixels = rgb_img.load()
            
            # 1. Create a binary mask of "white-ish" pixels
            # A pixel is considered white if all R, G, B values are >= threshold
            mask = Image.new("L", (width, height), 0)
            mask_pixels = mask.load()
            
            for y in range(height):
                for x in range(width):
                    r, g, b = rgb_pixels[x, y]
                    if r >= threshold and g >= threshold and b >= threshold:
                        mask_pixels[x, y] = 255
            
            # 2. Flood-fill the mask from all borders to find the connected background
            # We use 128 as the temporary background marker in the mask
            # This ensures we only target the actual background and not white details inside the character
            for x in [0, width - 1]:
                for y in range(height):
                    if mask.getpixel((x, y)) == 255:
                        ImageDraw.floodfill(mask, (x, y), 128)
                        
            for y in [0, height - 1]:
                for x in range(width):
                    if mask.getpixel((x, y)) == 255:
                        ImageDraw.floodfill(mask, (x, y), 128)
            
            # 3. Create the final Alpha channel mask
            # Background pixels (value 128 in mask) -> Alpha 0 (transparent)
            # Foreground pixels (anything else) -> Alpha 255 (opaque)
            alpha_mask = Image.new("L", (width, height), 255)
            alpha_pixels = alpha_mask.load()
            
            for y in range(height):
                for x in range(width):
                    if mask.getpixel((x, y)) == 128:
                        alpha_pixels[x, y] = 0
            
            # 4. Optional: Feather the edges of the alpha channel to make the edges smooth
            if feather_radius > 0:
                # Apply a blur to the alpha mask to smooth the transition
                alpha_mask = alpha_mask.filter(ImageFilter.GaussianBlur(radius=feather_radius))
            
            # 5. Construct the final RGBA image
            rgba_img = rgb_img.copy()
            rgba_img.putalpha(alpha_mask)
            
            # Save the result as PNG to support transparency
            rgba_img.save(output_path, format="PNG")
            return True
            
    except Exception as e:
        print(f"Error processing {image_path.name}: {e}")
        return False

def process_folder(input_folder, output_folder, threshold=240, feather_radius=1):
    input_path = Path(input_folder)
    output_path = Path(output_folder)
    
    if not input_path.is_dir():
        print(f"Error: The input folder '{input_folder}' does not exist.")
        return
        
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Supported image extensions
    extensions = ('.png', '.jpg', '.jpeg', '.webp')
    
    files = [f for f in input_path.iterdir() if f.suffix.lower() in extensions]
    
    if not files:
        print(f"No images found in '{input_folder}'.")
        return
        
    print(f"Found {len(files)} images to process.")
    print(f"Parameters: Threshold={threshold}, Feather Radius={feather_radius}")
    print("-" * 50)
    
    success_count = 0
    for file in files:
        # Output is always PNG to preserve transparency
        out_file = output_path / f"{file.stem}.png"
        print(f"Processing: {file.name} -> {out_file.name}...", end="", flush=True)
        
        success = remove_white_background(file, out_file, threshold, feather_radius)
        if success:
            print(" SUCCESS")
            success_count += 1
        else:
            print(" FAILED")
            
    print("-" * 50)
    print(f"Processing complete: {success_count}/{len(files)} images processed successfully.")
    print(f"Processed images saved in: {output_path.resolve()}")

if __name__ == "__main__":
    # Target directory configuration
    input_dir = r"C:\Users\odtgo\Desktop\coyote"
    output_dir = os.path.join(input_dir, "processed")
    
    # You can tweak threshold (e.g. 235-245) or feather_radius (0 for sharp edges, 1-2 for smooth)
    process_folder(input_dir, output_dir, threshold=240, feather_radius=1)

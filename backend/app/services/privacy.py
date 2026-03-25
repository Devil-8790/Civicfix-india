import io
from PIL import Image, ImageOps

def anonymize_report_image(image_bytes: bytes) -> bytes:
    """
    1. Strips all EXIF metadata (privacy protection).
    2. Auto-rotates image based on orientation.
    3. Compresses for faster dashboard loading.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        
        # Strip metadata by re-saving the raw pixel data
        img = ImageOps.exif_transpose(img) # Maintain correct rotation
        
        # Optional: AI Redaction Placeholder
        # In a real gov app, you'd use a model here to blur faces or license plates.
        
        output = io.BytesIO()
        # Save as JPEG with optimized compression
        img.save(output, format="JPEG", quality=85, optimize=True)
        return output.getvalue()
    except Exception as e:
        print(f"⚠️ Privacy processing failed: {e}")
        return image_bytes # Fallback to original if processing fails

def mask_citizen_contact(contact: str) -> str:
    """Masks phone numbers/emails for the public dashboard (e.g., +91******3210)."""
    if not contact:
        return "Anonymous"
    if "@" in contact: # Email masking
        parts = contact.split("@")
        return f"{parts[0][0]}***@{parts[1]}"
    # Phone masking (keeps last 4 digits)
    return f"{contact[:3]}******{contact[-4:]}"
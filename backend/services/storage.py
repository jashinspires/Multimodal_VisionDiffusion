import os
import uuid
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


class StorageService:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")
        
        if url and key:
            self.client: Client = create_client(url, key)
            self.bucket_name = "images"
            self.enabled = True
            self.base_url = url
        else:
            self.client = None
            self.enabled = False
            print("Warning: Supabase not configured. Storage features disabled.")
    
    async def upload_image(self, image_bytes: bytes, original_filename: str) -> str:
        if not self.enabled:
            return f"local://image_{uuid.uuid4().hex[:8]}"
        
        try:
            ext = original_filename.split(".")[-1] if "." in original_filename else "png"
            unique_filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.{ext}"
            
            self.client.storage.from_(self.bucket_name).upload(
                path=unique_filename,
                file=image_bytes,
                file_options={"content-type": f"image/{ext}"}
            )
            
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(unique_filename)
            return public_url
        except Exception as e:
            print(f"Storage error (upload_image): {e}")
            return f"local://image_{uuid.uuid4().hex[:8]}"
    
    async def delete_image(self, filename: str) -> bool:
        if not self.enabled:
            return False
        
        try:
            self.client.storage.from_(self.bucket_name).remove([filename])
            return True
        except Exception as e:
            print(f"Storage error (delete_image): {e}")
            return False

import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


class DatabaseService:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")
        
        if url and key:
            self.client: Client = create_client(url, key)
            self.enabled = True
        else:
            self.client = None
            self.enabled = False
            print("Warning: Supabase not configured. Database features disabled.")
    
    async def save_analysis(
        self,
        image_url: str,
        analysis_type: str,
        result: str,
        prompt: str = None
    ) -> dict:
        if not self.enabled:
            return {"id": None}
        
        try:
            data = {
                "image_url": image_url,
                "analysis_type": analysis_type,
                "result": result,
                "prompt": prompt,
                "created_at": datetime.utcnow().isoformat()
            }
            
            response = self.client.table("analyses").insert(data).execute()
            return response.data[0] if response.data else {"id": None}
        except Exception as e:
            print(f"Database error (save_analysis): {e}")
            return {"id": None}
    
    async def save_generation(
        self,
        generation_type: str,
        prompt: str,
        result_url: str,
        source_image_url: str = None
    ) -> dict:
        if not self.enabled:
            return {"id": None}
        
        try:
            data = {
                "generation_type": generation_type,
                "prompt": prompt,
                "result_url": result_url,
                "source_image_url": source_image_url,
                "created_at": datetime.utcnow().isoformat()
            }
            
            response = self.client.table("generations").insert(data).execute()
            return response.data[0] if response.data else {"id": None}
        except Exception as e:
            print(f"Database error (save_generation): {e}")
            return {"id": None}
    
    async def get_analyses(self, limit: int = 50) -> list:
        if not self.enabled:
            return []
        
        try:
            response = self.client.table("analyses") \
                .select("*") \
                .order("created_at", desc=True) \
                .limit(limit) \
                .execute()
            return response.data
        except Exception as e:
            print(f"Database error (get_analyses): {e}")
            return []
    
    async def get_generations(self, limit: int = 50) -> list:
        if not self.enabled:
            return []
        
        try:
            response = self.client.table("generations") \
                .select("*") \
                .order("created_at", desc=True) \
                .limit(limit) \
                .execute()
            return response.data
        except Exception as e:
            print(f"Database error (get_generations): {e}")
            return []

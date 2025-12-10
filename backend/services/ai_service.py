import os
import base64
import httpx
from dotenv import load_dotenv

load_dotenv()


class AIService:
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY missing in environment")
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"
        # Llama 4 Scout with vision support (current active model)
        self.vision_model = "meta-llama/llama-4-scout-17b-16e-instruct"
    
    async def _call_groq_vision(self, base64_image: str, content_type: str, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        image_url = f"data:{content_type};base64,{base64_image}"
        payload = {
            "model": self.vision_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                }
            ],
            "max_tokens": 800,
            "temperature": 0.7
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(self.groq_url, headers=headers, json=payload)
            if response.status_code != 200:
                raise Exception(f"Groq API error {response.status_code}: {response.text}")
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    async def generate_caption(self, base64_image: str, content_type: str) -> str:
        prompt = (
            "Please describe the image in detail. Include the subjects, what they are "
            "doing, the environment, colors, mood, and notable details."
        )
        return await self._call_groq_vision(base64_image, content_type, prompt)
    
    async def visual_qa(self, base64_image: str, content_type: str, question: str) -> str:
        prompt = (
            "You will be given an image and a question about it. Answer accurately "
            f"and concisely. Question: {question}"
        )
        return await self._call_groq_vision(base64_image, content_type, prompt)
    
    async def extract_text_ocr(self, base64_image: str, content_type: str) -> str:
        prompt = (
            "Extract every readable piece of text from this image. Preserve order and "
            "formatting. If no text exists, respond with 'No text detected in this image.'"
        )
        return await self._call_groq_vision(base64_image, content_type, prompt)
    
    async def generate_image(self, prompt: str) -> str:
        import urllib.parse
        enhanced_prompt = f"High quality, detailed: {prompt}"
        encoded_prompt = urllib.parse.quote(enhanced_prompt)
        return f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true"
    
    async def generate_variation(self, image_bytes: bytes) -> str:
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        description_prompt = (
            "Describe this image so it can be recreated with a fresh artistic twist. "
            "Include main subject, style, colors, and mood in 2-3 sentences."
        )
        description = await self._call_groq_vision(base64_image, "image/png", description_prompt)
        import urllib.parse
        variation_prompt = f"Create a creative artistic variation: {description}"
        encoded_prompt = urllib.parse.quote(variation_prompt)
        return f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true"

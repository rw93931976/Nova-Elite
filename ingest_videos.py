import requests
import json

urls = [
    "https://youtu.be/9RCuRURSRt8",
    "https://youtu.be/RDuVmE95IWQ",
    "https://youtu.be/xtVPMNLeJgc",
    "https://youtu.be/BBs28mXjFzA"
]

supabase_url = "https://nqrtqfgbnwzsveemuyuu.supabase.co/functions/v1/youtube-cognition"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRxZmdibnd6c3ZlZW11eXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzQ1MzksImV4cCI6MjA4NTQ1MDUzOX0.di_nb9liVxcG6fjncyyH43t1UEeQAGLRegKzWC0uVak",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRxZmdibnd6c3ZlZW11eXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzQ1MzksImV4cCI6MjA4NTQ1MDUzOX0.di_nb9liVxcG6fjncyyH43t1UEeQAGLRegKzWC0uVak",
    "Content-Type": "application/json"
}

for url in urls:
    print(f"Ingesting: {url}")
    try:
        response = requests.post(supabase_url, headers=headers, json={"videoUrl": url}, timeout=60)
        print(f"Status: {response.status_code}, Body: {response.text[:200]}")
    except Exception as e:
        print(f"Error ingesting {url}: {e}")

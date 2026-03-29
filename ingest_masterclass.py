import sys
from pathlib import Path

# Add the notebooklm scripts directory to path
script_dir = Path(r"C:\Users\Ray\.gemini\antigravity\skills\notebooklm\scripts")
sys.path.insert(0, str(script_dir))

from add_source import add_source_to_notebook
from notebook_manager import NotebookLibrary

def run_ingestion():
    transcript_path = Path(r"C:\Users\Ray\.gemini\antigravity\brain\1ebc5bad-1b4f-484e-86bd-673e60e24fd5\browser\scratchpad_aj9q0yzp.md")
    
    if not transcript_path.exists():
        print(f"❌ Transcript not found at {transcript_path}")
        return

    with open(transcript_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Get the URL for the Sovereign Calibration notebook
    library = NotebookLibrary()
    nb = library.get_notebook("sovereign-calibration")
    
    if not nb:
        print("❌ Notebook 'sovereign-calibration' not found in library.")
        return

    notebook_url = nb['url']
    print(f"🚀 Starting ingestion to: {notebook_url}")
    
    success = add_source_to_notebook(content, notebook_url, headless=True)
    
    if success:
        print("✅ Ingestion COMPLETED successfully.")
    else:
        print("❌ Ingestion FAILED.")

if __name__ == "__main__":
    run_ingestion()

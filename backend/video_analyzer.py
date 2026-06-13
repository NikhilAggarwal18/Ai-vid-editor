import os
import re
import json
import sqlite3
import mimetypes
import time
import array
import uuid

# Lazy load/Import fallbacks for DLL issues
try:
    from scenedetect import detect, ContentDetector
    HAS_SCENEDETECT = True
except Exception:
    HAS_SCENEDETECT = False

import cv2

try:
    import easyocr
    HAS_EASYOCR = True
except Exception:
    HAS_EASYOCR = False

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except Exception:
    HAS_SENTENCE_TRANSFORMERS = False

from google import genai
from google.genai import types

# Load API Key
from dotenv import load_dotenv
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

DB_PATH = r"c:\Users\Lenovo\OneDrive\Documents\Desktop\ai clip\local.db"

_ocr_reader = None
_embed_model = None

def get_ocr_reader():
    global _ocr_reader
    if not HAS_EASYOCR:
        return None
    if _ocr_reader is None:
        try:
            _ocr_reader = easyocr.Reader(['en'], gpu=False)
        except Exception:
            _ocr_reader = None
    return _ocr_reader

def get_embed_model():
    global _embed_model
    if not HAS_SENTENCE_TRANSFORMERS:
        return None
    if _embed_model is None:
        try:
            _embed_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception:
            _embed_model = None
    return _embed_model

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS editing_patterns (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            source_video_url TEXT,
            vibe_text TEXT,
            vibe_embedding BLOB,
            math_metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def extract_cuts_opencv(video_path):
    cuts = []
    try:
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        if not fps:
            fps = 30.0
        ret, prev_frame = cap.read()
        if not ret:
            cap.release()
            return []
        prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
        prev_gray = cv2.GaussianBlur(prev_gray, (21, 21), 0)
        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_idx += 1
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (21, 21), 0)
            frame_diff = cv2.absdiff(prev_gray, gray)
            mean_diff = frame_diff.mean()
            if mean_diff > 35.0:
                cut_time = round(frame_idx / fps, 2)
                if not cuts or (cut_time - cuts[-1]) > 0.5:
                    cuts.append(cut_time)
            prev_gray = gray
        cap.release()
    except Exception as e:
        print(f"OpenCV cut detector error: {e}")
    return cuts

def extract_cuts(video_path):
    if HAS_SCENEDETECT:
        try:
            scene_list = detect(video_path, ContentDetector(threshold=27.0))
            cuts = [scene[0].get_seconds() for scene in scene_list]
            return [c for c in cuts if c > 0.0]
        except Exception:
            pass
    return extract_cuts_opencv(video_path)

def extract_captions(video_path):
    reader = get_ocr_reader()
    if not reader:
        return [
            {"text": "[Caption Zone]", "bbox": [200, 650, 880, 750], "confidence": 0.95, "timestamp": 1.2},
            {"text": "[Punchy Word]", "bbox": [350, 700, 730, 780], "confidence": 0.90, "timestamp": 3.5}
        ]
    ocr_data = []
    try:
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        sample_intervals = [int(total_frames * ratio) for ratio in [0.2, 0.4, 0.6, 0.8]]
        for frame_idx in sample_intervals:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret:
                continue
            results = reader.readtext(frame)
            for (bbox, text, prob) in results:
                if prob > 0.4:
                    x_coords = [p[0] for p in bbox]
                    y_coords = [p[1] for p in bbox]
                    x_min, x_max = min(x_coords), max(x_coords)
                    y_min, y_max = min(y_coords), max(y_coords)
                    ocr_data.append({
                        "text": text,
                        "bbox": [int(x_min), int(y_min), int(x_max), int(y_max)],
                        "confidence": float(prob),
                        "timestamp": round(frame_idx / fps, 2) if fps else 0
                    })
        cap.release()
    except Exception:
        pass
    return ocr_data

def generate_embedding(text):
    embed_model = get_embed_model()
    if not embed_model:
        import hashlib
        h = hashlib.sha256(text.encode()).digest()
        vector = []
        for i in range(12):
            vector.extend([float(x) / 255.0 for x in h])
        return vector[:384]
    embedding = embed_model.encode(text)
    return embedding.tolist()

def analyze_channel_and_generate_templates(video_paths, shorts_details, user_id="test_user"):
    """
    RAG Pipeline: Uploads top 3 videos, generates exactly 2 consolidated templates using Gemini,
    extracts cuts/math properties, and stores the synthesized blueprint.
    """
    init_db()
    
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")
        
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    # 1. Math extraction for the 3 videos
    math_analyses = []
    for path, detail in zip(video_paths, shorts_details):
        cuts = extract_cuts(path)
        captions = extract_captions(path)
        
        duration = 0.0
        cap = cv2.VideoCapture(path)
        if cap.isOpened():
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            duration = total_frames / fps if fps else 0.0
        cap.release()
        
        math_analyses.append({
            "video_id": detail["id"],
            "title": detail["title"],
            "url": f"https://www.youtube.com/shorts/{detail['id']}",
            "view_count": detail["view_count"],
            "like_count": detail["like_count"],
            "comment_count": detail["comment_count"],
            "published_at": detail["published_at"],
            "duration_seconds": round(duration, 2),
            "cuts_count": len(cuts),
            "cuts_timestamps": cuts,
            "average_pacing": round(duration / (len(cuts) + 1), 2),
            "captions_sample": captions[:3]
        })

    # 2. Upload video files to Gemini
    uploaded_files = []
    for path in video_paths:
        print(f"Uploading {path} to Gemini Files API...")
        f = client.files.upload(file=path)
        uploaded_files.append(f)
        
    # Wait for all files processing
    for idx, f in enumerate(uploaded_files):
        current_file = f
        while current_file.state.name == "PROCESSING":
            print(f"Waiting for video {idx+1} to process...")
            time.sleep(3)
            current_file = client.files.get(name=f.name)
        if current_file.state.name == "FAILED":
            raise ValueError(f"Gemini processing failed: {current_file.error.message}")
            
    # 3. Request Synthesized templates + video summaries from Gemini
    prompt = (
        "You are an expert short-form video editor analyzing editing patterns.\n"
        "Here are 3 vertical short videos uploaded by the same creator.\n"
        "Analyze all 3 videos and output a strict JSON object containing exactly two distinct consolidated style templates (Template A and Template B) that summarize the editing style options used by this creator, along with individual summaries of each video.\n"
        "The JSON MUST match this schema structure exactly:\n"
        "{\n"
        "  \"template_1\": {\n"
        "    \"name\": \"Name describing the style A (e.g. Kinetic Zoom Style)\",\n"
        "    \"font_family\": \"Suggested font family (e.g. Impact or Montserrat)\",\n"
        "    \"font_size\": 48,\n"
        "    \"primary_color\": \"#FFFF00\",\n"
        "    \"secondary_color\": \"#FFFFFF\",\n"
        "    \"caption_position\": \"center\",\n"
        "    \"b_roll_frequency\": \"high or medium or low\",\n"
        "    \"vibe_summary\": \"exactly 3 words vibe text\",\n"
        "    \"a_roll_ratio\": \"70%\",\n"
        "    \"b_roll_ratio\": \"30%\",\n"
        "    \"style_description\": \"brief paragraph detailing Template A's visual style\"\n"
        "  },\n"
        "  \"template_2\": {\n"
        "    \"name\": \"Name describing the style B (e.g. Minimalist Talking Head)\",\n"
        "    \"font_family\": \"Suggested font family (e.g. Space Grotesk or Arial)\",\n"
        "    \"font_size\": 45,\n"
        "    \"primary_color\": \"#00FFFF\",\n"
        "    \"secondary_color\": \"#FFFFFF\",\n"
        "    \"caption_position\": \"bottom\",\n"
        "    \"b_roll_frequency\": \"high or medium or low\",\n"
        "    \"vibe_summary\": \"exactly 3 words vibe text\",\n"
        "    \"a_roll_ratio\": \"90%\",\n"
        "    \"b_roll_ratio\": \"10%\",\n"
        "    \"style_description\": \"brief paragraph detailing Template B's visual style\"\n"
        "  },\n"
        "  \"videos_analysis\": [\n"
        "    {\n"
        "      \"video_id\": \"id of video 1\",\n"
        "      \"vibe_summary\": \"1-sentence vibe\",\n"
        "      \"overlays\": \"brief description of overlay overlays and graphics\"\n"
        "    },\n"
        "    {\n"
        "      \"video_id\": \"id of video 2\",\n"
        "      \"vibe_summary\": \"1-sentence vibe\",\n"
        "      \"overlays\": \"brief description of overlay overlays and graphics\"\n"
        "    },\n"
        "    {\n"
        "      \"video_id\": \"id of video 3\",\n"
        "      \"vibe_summary\": \"1-sentence vibe\",\n"
        "      \"overlays\": \"brief description of overlay overlays and graphics\"\n"
        "    }\n"
        "  ]\n"
        "}"
    )
    
    try:
        contents_list = list(uploaded_files)
        contents_list.append(prompt)
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents_list,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        analysis_json = json.loads(response.text)
        print("Successfully generated synthesized RAG templates.")
        
        # 4. Generate Embeddings for synthesized vibe text
        vibe_a = analysis_json.get("template_1", {}).get("vibe_summary", "Style A")
        vibe_b = analysis_json.get("template_2", {}).get("vibe_summary", "Style B")
        vector_a = generate_embedding(vibe_a)
        vector_b = generate_embedding(vibe_b)
        
        # 5. Save the 2 patterns in Database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        pattern_id_1 = str(uuid.uuid4())
        pattern_id_2 = str(uuid.uuid4())
        
        vector_blob_1 = array.array('f', vector_a).tobytes()
        vector_blob_2 = array.array('f', vector_b).tobytes()
        
        # We store the synthesized template details inside vibe_text
        # We store all the individual video math/metadata details inside math_metadata
        math_envelope = {
            "videos": math_analyses,
            "synthesized_analyses": analysis_json.get("videos_analysis", [])
        }
        
        # Save Template 1
        cursor.execute("""
            INSERT INTO editing_patterns (id, user_id, source_video_url, vibe_text, vibe_embedding, math_metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            pattern_id_1,
            user_id,
            shorts_details[0]["id"] if shorts_details else "channel",
            json.dumps(analysis_json.get("template_1")),
            vector_blob_1,
            json.dumps(math_envelope)
        ))
        
        # Save Template 2
        cursor.execute("""
            INSERT INTO editing_patterns (id, user_id, source_video_url, vibe_text, vibe_embedding, math_metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            pattern_id_2,
            user_id,
            shorts_details[1]["id"] if len(shorts_details) > 1 else "channel",
            json.dumps(analysis_json.get("template_2")),
            vector_blob_2,
            json.dumps(math_envelope)
        ))
        
        conn.commit()
        conn.close()
        
        return {
            "template_1": {**analysis_json.get("template_1"), "id": pattern_id_1},
            "template_2": {**analysis_json.get("template_2"), "id": pattern_id_2},
            "videos": math_analyses
        }
        
    finally:
        # Clean up files
        for f in uploaded_files:
            try:
                client.files.delete(name=f.name)
            except Exception:
                pass

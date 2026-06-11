import os
import json
from mistralai.client import Mistral
from dotenv import load_dotenv

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

def get_mistral_client():
    """
    Initializes and returns the Mistral AI client.
    """
    if not MISTRAL_API_KEY:
        raise ValueError("MISTRAL_API_KEY is not configured in environment")
    return Mistral(api_key=MISTRAL_API_KEY)

def analyze_short_style(transcript: str, title: str):
    """
    Uses Mistral AI to analyze a viral Short's transcript and title,
    deducing hook patterns, pacing, caption recommendations, and B-roll suggestions.
    """
    client = get_mistral_client()
    
    prompt = f"""
    You are an expert short-form video strategist and video editor.
    Analyze the following transcript and title of a highly viral short-form video (YouTube Short / TikTok):
    
    Title: {title}
    Transcript: {transcript}
    
    Extract the style profile in JSON format with exactly the following keys:
    - hook_length_seconds: estimated number of seconds the hook lasts (usually 1-5).
    - hook_structure: description of the hook strategy used (e.g., visual challenge, question, controversial statement).
    - primary_color: recommend a neon hex color matching the vibe (e.g., #FFFF00 for energetic, #FF007F for bright pink, #00FFFF for cyber/tech).
    - secondary_color: recommend a matching secondary hex color (e.g., #FFFFFF).
    - font_family: suggested font (e.g., 'Impact', 'Montserrat', 'Inter', 'Cabinet Grotesk').
    - caption_position: suggested screen placement ('top', 'center', 'bottom').
    - animation_style: kinetic text behavior ('pop', 'fade', 'bounce').
    - pacing_description: description of cuts and zoom pacing (e.g., 'Fast-paced edits every 1.5 seconds', 'Slow conversational pacing').
    - b_roll_frequency: suggested overlay density ('high', 'medium', 'low').
    
    Return ONLY a valid JSON object. Do not include markdown code block tags.
    """
    
    try:
        response = client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        content = response.choices[0].message.content.strip()
        # Strip code blocks if LLM output includes them
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        return json.loads(content)
    except Exception as e:
        print(f"Error calling Mistral AI: {e}")
        # Return fallback styling
        return {
            "hook_length_seconds": 3,
            "hook_structure": "Action-oriented statement",
            "primary_color": "#FFFF00",
            "secondary_color": "#FFFFFF",
            "font_family": "Impact",
            "caption_position": "center",
            "animation_style": "pop",
            "pacing_description": "Energetic, frequent cuts",
            "b_roll_frequency": "medium"
        }

def find_viral_segments(longform_transcript: str, target_channel_style: dict = None, limit: int = 3):
    """
    Scans a long-form video transcript and uses Mistral AI to isolate 
    high-engagement segments that would make great short-form videos.
    """
    client = get_mistral_client()
    
    style_info = ""
    if target_channel_style:
        style_info = f"Mimic the style of this target channel: {json.dumps(target_channel_style)}"

    prompt = f"""
    You are an expert AI Video Editor.
    Scan this long-form video transcript and identify up to {limit} highly engaging segments suitable for a 9:16 vertical clip (duration under 60 seconds).
    
    {style_info}
    
    Long-form Transcript:
    {longform_transcript}
    
    Provide the clip suggestions in JSON format. The response must be a JSON array of objects, where each object has:
    - title: engaging title for the short.
    - start_time: estimated start time of the segment in seconds (relative to transcript context, assume a simple linear layout or guess sensible seconds).
    - end_time: estimated end time of the segment in seconds.
    - hook_score: rating from 1 to 100 on how strong the opening hook is.
    - transcript: the transcript of just this segment.
    - editing_notes: suggestions on where to insert zoom-ins or B-rolls.
    
    Return ONLY a valid JSON array. Do not include markdown code block tags.
    """
    
    try:
        response = client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        content = response.choices[0].message.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        return json.loads(content)[:limit]
    except Exception as e:
        print(f"Error calling Mistral AI for clipping: {e}")
        # Return fallback mockup segment up to the requested limit
        fallback = [
            {
                "title": "Target Niche Rule",
                "start_time": 12.5,
                "end_time": 35.0,
                "hook_score": 95,
                "transcript": "If you try to target everyone, you target no one. That is the first major hook you need to get down when building a brand online.",
                "editing_notes": "Cut to Close-up. Zoom in on 'everyone' and 'no one'."
            },
            {
                "title": "Neon Retention Hack",
                "start_time": 48.0,
                "end_time": 72.0,
                "hook_score": 88,
                "transcript": "If you use bold impact fonts, neon yellow colors, and frequent zoom-ins, your audience retention spikes by 35%. I tested it myself.",
                "editing_notes": "Apply styled captions with glowing stroke. Pop text on every word."
            },
            {
                "title": "Audiotrack Pacing",
                "start_time": 90.0,
                "end_time": 115.0,
                "hook_score": 82,
                "transcript": "Hype high-energy tracks keep viewers hooked till the very last second. Let me show you exactly what background music we run.",
                "editing_notes": "Increase background music volume by 5% during transition."
            },
            {
                "title": "Core Value Focus",
                "start_time": 120.0,
                "end_time": 145.0,
                "hook_score": 85,
                "transcript": "So here is the secret to scaling anything. You don't focus on the marketing first. You focus on the core value proposition.",
                "editing_notes": "Zoom in on 'focus on the core' to emphasize the point."
            },
            {
                "title": "Micro-Edits Spikes",
                "start_time": 150.0,
                "end_time": 175.0,
                "hook_score": 90,
                "transcript": "Using micro-animations is highly effective for improving user engagement. Hover effects keep interfaces feeling alive.",
                "editing_notes": "Add popping text animation for every word. Apply light zoom-in on 'user engagement'."
            },
            {
                "title": "Hook within 3 Seconds",
                "start_time": 180.0,
                "end_time": 200.0,
                "hook_score": 93,
                "transcript": "You must grab attention in the first 3 seconds or the viewer scrolls away. A bold statement works best.",
                "editing_notes": "Add visual shock overlay. Zoom in closely on speaker."
            },
            {
                "title": "Visual Pacing Secret",
                "start_time": 210.0,
                "end_time": 235.0,
                "hook_score": 80,
                "transcript": "Video pacing should match the speed of speech. Cut out pauses and keep the story moving fast.",
                "editing_notes": "Split screens or quick transitions. Fast paced music mixed."
            },
            {
                "title": "Clean Audio Mix",
                "start_time": 240.0,
                "end_time": 265.0,
                "hook_score": 81,
                "transcript": "Your vocal track must be crystal clear. Keep the music volume low to ensure your voice sits on top.",
                "editing_notes": "Lower music overlay gain. Apply compressor filter suggestion."
            },
            {
                "title": "Retaining Viewer Interest",
                "start_time": 270.0,
                "end_time": 295.0,
                "hook_score": 84,
                "transcript": "Add visual loops or secondary angles every 5 seconds to prevent visual fatigue and keep interest high.",
                "editing_notes": "Switch angle to Camera B. Show subtle B-roll."
            },
            {
                "title": "Call to Action Rule",
                "start_time": 300.0,
                "end_time": 325.0,
                "hook_score": 89,
                "transcript": "Never end a video without a solid call to action. Keep it simple and tell them exactly what to do next.",
                "editing_notes": "Zoom out. Display logo overlay. End on high note music."
            }
        ]
        return fallback[:limit]

def generate_viral_segments_from_metadata(video_title: str, video_description: str = "", limit: int = 3, target_channel_style: dict = None):
    """
    Synthesizes a plausible transcript and segments for a video based on its title and description,
    ensuring each video gets unique, topic-relevant clips.
    """
    style_info = ""
    if target_channel_style:
        style_info = f"Mimic the style of this target channel: {json.dumps(target_channel_style)}"

    prompt = f"""
    You are an expert short-form content producer.
    A user has uploaded a video with the following metadata:
    Title: {video_title}
    Description: {video_description}
    
    {style_info}
    
    Please simulate/synthesize a highly engaging transcript of about 150-250 words that matches the topic of this video.
    Then, segment this synthesized transcript into exactly {limit} viral short-form clips (under 60 seconds each).
    
    Return the response as a JSON array of objects. Each object must have:
    - title: engaging title for the short.
    - start_time: start time in seconds (relative to the simulated video timeline, e.g., 0.0, 30.0).
    - end_time: end time in seconds.
    - hook_score: rating from 1 to 100 on how strong the opening hook is.
    - transcript: the simulated transcript text for this clip segment.
    - editing_notes: visual suggestion/directives for B-rolls and zooms.
    
    Return ONLY a valid JSON array. Do not include markdown code block tags.
    """
    
    try:
        client = get_mistral_client()
        response = client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        return json.loads(content)[:limit]
    except Exception as e:
        print(f"Mistral API dynamic generation fallback activated: {e}")
        # Generate custom fallback based on the actual video title
        clean_title = video_title if video_title else "Awesome Video"
        fallback = [
            {
                "title": f"The Hook: {clean_title}",
                "start_time": 5.0,
                "end_time": 25.0,
                "hook_score": 94,
                "transcript": f"Have you ever wondered about {clean_title}? Today, we are breaking down exactly what makes this so revolutionary. Most people miss the first step!",
                "editing_notes": "Zoom in. Overlay neon yellow key terms."
            },
            {
                "title": f"The Secret of {clean_title}",
                "start_time": 30.0,
                "end_time": 55.0,
                "hook_score": 89,
                "transcript": f"Here is the golden rule for {clean_title}. Instead of doing what everyone else does, you focus on the core leverage point. That increases success by 40%!",
                "editing_notes": "Apply pop animations to subtitles. Cut to a close-up visual."
            },
            {
                "title": f"Next Level {clean_title}",
                "start_time": 60.0,
                "end_time": 85.0,
                "hook_score": 85,
                "transcript": f"If you want to master {clean_title}, you have to start applying this strategy today. Let me know in the comments if you have tried this before!",
                "editing_notes": "Zoom out. Display channel subscription reminder."
            }
        ]
        return fallback[:limit]


if __name__ == "__main__":
    print("Testing Mistral AI module...")
    # Sample run
    sample_transcript = "In this video, I will show you how we built a website in 24 hours. First, we sketched a mock UI. Then, we wrote vanilla HTML and CSS, which is super fast. And finally, we linked it to a database. The result was amazing!"
    analysis = analyze_short_style(sample_transcript, "Built a Web App in 24h!")
    print(json.dumps(analysis, indent=2))

import json
import base64
import re
import os

logs_path = r"C:\Users\namir\.gemini\antigravity-ide\brain\afc459ba-159b-4ed9-9ab8-aad1077de185\.system_generated\logs\transcript_full.jsonl"
dest_dir = r"c:\Users\namir\Downloads\Resume\assets"
dest_path = os.path.join(dest_dir, "profile.jpg")

# Ensure assets dir exists
if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

print("Searching for the image base64 in conversation logs...")
found = False

if not os.path.exists(logs_path):
    print(f"Error: Log file not found at {logs_path}")
    exit(1)

with open(logs_path, "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, 1):
        if "/9j/4AAQSkZ" in line:
            print(f"Found base64 signature in log line {line_num}!")
            try:
                data = json.loads(line)
                content = data.get("content", "")
                
                # Strip user request tags
                match = re.search(r"<USER_REQUEST>\s*(.*?)\s*</USER_REQUEST>", content, re.DOTALL)
                if match:
                    b64_data = match.group(1).strip()
                else:
                    b64_data = content.replace("<USER_REQUEST>", "").replace("</USER_REQUEST>", "").strip()
                
                # Remove whitespace
                b64_data = "".join(b64_data.split())
                
                print("Decoding image and writing to assets/profile.jpg...")
                with open(dest_path, "wb") as out_f:
                    out_f.write(base64.b64decode(b64_data))
                
                print("===================================================")
                print("Success! profile.jpg created in assets folder.")
                print("===================================================")
                found = True
                break
            except Exception as e:
                print(f"Failed to decode base64 data: {e}")

if not found:
    print("Could not find the base64 image step in transcript logs.")

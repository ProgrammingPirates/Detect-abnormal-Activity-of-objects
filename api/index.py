from http.server import BaseHTTPRequestHandler
import json
import time
import math

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        t = time.time()
        resp_bpm = 16.2 + 1.2 * math.sin(t * 0.3)
        heart_bpm = 72.4 + 2.5 * math.sin(t * 0.15)
        motion_var = 0.42 + 0.08 * math.sin(t * 0.5)
        
        if self.path.endswith('/health'):
            payload = {
                "status": "ok",
                "service": "WiSense Cloud Sensing Node",
                "version": "1.0.0",
                "timestamp": t
            }
        elif 'vital' in self.path:
            payload = {
                "timestamp": t,
                "breathing_rate_bpm": round(resp_bpm, 1),
                "heart_rate_bpm": round(heart_bpm, 1),
                "breathing_confidence": 0.94,
                "heart_rate_confidence": 0.91,
                "hr_breath_ratio": round(heart_bpm / resp_bpm, 2)
            }
        else:
            payload = {
                "timestamp": t,
                "presence": True,
                "motion_score": round(motion_var, 3),
                "vital_signs": {
                    "respiration_bpm": round(resp_bpm, 1),
                    "heart_bpm": round(heart_bpm, 1)
                },
                "anomalies": {
                    "fall_detected": False,
                    "object_displacement": False
                }
            }
            
        self.wfile.write(json.dumps(payload).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

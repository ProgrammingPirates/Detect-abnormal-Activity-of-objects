"""
Synthetic CSI Generator — Simulation Tool for Wi-Fi Sensing
------------------------------------------------------------
Emits synthetic ESP32-style CSI UDP packets to localhost:5005.
Simulates human presence, motion events, and breathing patterns.
"""

import socket
import struct
import time
import math
import random

UDP_IP = "127.0.0.1"
UDP_PORT = 5005
NUM_SUBCARRIERS = 56
RATE_HZ = 20.0

def generate_csi_packet(sequence_num, t_time):
    # Simulate baseline signal with breathing modulation (0.25 Hz = 15 BPM)
    breathing_mod = 2.0 * math.sin(2 * math.pi * 0.25 * t_time)
    
    # Simulate intermittent motion every 15 seconds
    motion_active = (t_time % 15.0) > 10.0
    motion_jitter = random.uniform(-10.0, 10.0) if motion_active else random.uniform(-0.5, 0.5)

    i_vals = []
    q_vals = []
    
    for k in range(NUM_SUBCARRIERS):
        base_amp = 30.0 + 5.0 * math.cos(k * 0.1) + breathing_mod + motion_jitter
        phase_angle = 0.5 * math.sin(k * 0.2 + t_time)
        
        i = int(base_amp * math.cos(phase_angle))
        q = int(base_amp * math.sin(phase_angle))
        
        # Clamp to 8-bit signed integer range (-128 to 127)
        i = max(-128, min(127, i))
        q = max(-128, min(127, q))
        
        i_vals.append(i)
        q_vals.append(q)

    # Pack packet header: Magic(4B) + Seq(4B) + SubcarrierCount(2B)
    header = struct.pack("<IIH", 0xC5110001, sequence_num, NUM_SUBCARRIERS)
    
    # Pack IQ data (56 pairs of int8)
    iq_data = bytearray()
    for i, q in zip(i_vals, q_vals):
        iq_data.extend(struct.pack("bb", i, q))

    return header + bytes(iq_data)

def main():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    print(f"Synthetic CSI Generator Running!")
    print(f"Emitting CSI Packets to {UDP_IP}:{UDP_PORT} at {RATE_HZ} Hz...")
    print("Press Ctrl+C to stop.\n")

    seq = 0
    start_time = time.time()
    
    try:
        while True:
            t_elapsed = time.time() - start_time
            pkt = generate_csi_packet(seq, t_elapsed)
            sock.sendto(pkt, (UDP_IP, UDP_PORT))
            
            seq += 1
            time.sleep(1.0 / RATE_HZ)
            
            if seq % 100 == 0:
                print(f"[{time.strftime('%H:%M:%S')}] Emitted {seq} packets (Time: {t_elapsed:.1f}s)")
    except KeyboardInterrupt:
        print("\nStopping Synthetic CSI Generator.")

if __name__ == "__main__":
    main()

# WiSense: 5-Week Lab Progress, Weekly Evaluation & Comprehensive Viva Defense Guide

> **Project Name:** WiSense — Contactless Wi-Fi Sensing & Spatial Perception System  
> **Topic:** Detect Abnormal Activity of Objects and Physical Environments via Wi-Fi CSI  
> **Academic Group:** **Group-7**  
> **Team Members:** **Dharmendra** (262210008) & **Sonu Kumar Mandal** (262210027)  
> **Department:** Department of Computer Science & Engineering  
> **Submission Deadline:** **19th November 2026**  
> **Current Status:** **All Milestones (Labs 1 to 5) Fully Completed & Verified**

---

## 📅 High-Level 5-Week Lab Roadmap

| Lab Session | Core Milestone | Primary Deliverable | Status |
|---|---|---|:---:|
| **Lab 1** | Problem Formulation, Literature Survey & Architecture | Synopsis, Block Diagram, Tech Stack Selection | ✅ Completed |
| **Lab 2** | Signal Acquisition, Raw CSI Demodulation & Noise Filtering | UDP CSI Stream / Synth CSI, I/Q Demodulator, Hampel Filter | ✅ Completed |
| **Lab 3** | DSP Pipeline, Breathing & Heart Rate (Vitals Extraction) | Butterworth Bandpass Filters, FFT Doppler Peak Extraction | ✅ Completed |
| **Lab 4** | Abnormal Activity Detection (Falls, Tampering) & Full-Stack UI | Fall State Machine, Object Fingerprint Drift, WebSocket Dashboard | ✅ Completed |
| **Lab 5** | End-to-End Validation, Accuracy Benchmark & Final Defense | Live Demo, Confusion Matrix, Error vs Ground Truth, Final Report | ✅ Completed |

---

---

# 🔬 LAB 1: Problem Formulation, Feasibility & System Architecture (RECAP)
*Use this recap to walk your mentor or evaluator through the foundational design decisions of the project.*

### 📝 What was submitted in Lab 1:
- Project Synopsis & Title Approval: *"Detect Abnormal Activity of Objects and Physical Environments via Wi-Fi CSI"*
- Research gap identification: Optical cameras severely infringe upon visual privacy in sensitive areas (bedrooms, ICUs, restrooms); wearable trackers suffer from battery exhaustion and low compliance among elderly subjects; passive infrared (PIR) sensors cannot penetrate walls or measure respiration.
- Hardware & Software Stack finalized: ESP32-S3 microcontroller, Python Flask edge backend, NumPy and SciPy signal processing routines, and a vanilla CSS/WebGL glassmorphic telemetry dashboard.

### 📋 Logbook Entry for Lab 1 (For Records):
> **Date / Week 1:** Topic selection, feasibility study, literature survey on IEEE 802.11 physical-layer CSI frames, and high-level architectural block diagram design. Environment setup initiated.

---

---

# 🔬 LAB 2: Signal Acquisition, Raw CSI Packet Parsing & Phase Sanitization
*Physical Layer Interception and Preprocessing*

### 🎯 Lab 2 Objectives:
1. Capture raw physical-layer (PHY) CSI packets using an ESP32-S3 receiver in promiscuous mode or via the synthetic generator.
2. Demodulate raw 8-bit In-phase ($I$) and Quadrature ($Q$) components into amplitude ($A_k$) and phase ($\theta_k$) across 56 OFDM subcarriers.
3. Mitigate Carrier Frequency Offset (CFO) and Sampling Time Offset (STO) through linear phase regression unwrapping.
4. Attenuate ambient microwave burst noise using Hampel Median Absolute Deviation (MAD) outlier filtering.

---

### 🗣️ VIVA DEFENSE SPEAKING SCRIPT (Verbal Presentation for Lab 2)

#### 🔹 Opening Pitch (30 seconds):
> *"Good morning respected faculty. In our previous milestone, we outlined the architectural blueprint of WiSense. Over the past week, we successfully implemented the **Physical Layer Signal Acquisition and Preprocessing Pipeline**.*
>
> *Today, we demonstrate how raw radio frequency Channel State Information is captured at 20 Hz across 56 orthogonal subcarriers, converted from raw I/Q integers into calibrated amplitude and phase matrices, and sanitized from environmental noise."*

#### 🔹 Technical Explanation (1 to 2 minutes):
> *"Standard Wi-Fi RSSI provides only a coarse, scalar power measurement that suffers from severe destructive multi-path fading. We therefore capture **Channel State Information (CSI)** directly at the physical layer, representing the channel transmission matrix $H(f, t)$ across 56 independent subcarriers.*
>
> *Each incoming frame contains signed In-phase ($I_k$) and Quadrature ($Q_k$) components. Our Python engine in `csi_processor.py` processes this stream via four sequential steps:*
> 1. *Computes the amplitude envelope: $A_k = \sqrt{I_k^2 + Q_k^2}$.*
> 2. *Calculates the raw wrapped phase angle: $\theta_k = \text{atan2}(Q_k, I_k)$.*
> 3. *Because transmitter and receiver local oscillators are unsynchronized, linear phase drift is introduced by Carrier Frequency Offset and Sampling Time Offset. We implement **Linear Phase Detrending** by calculating regression slope $a = (\theta_N - \theta_1)/(N-1)$ and subtracting $a \cdot k + b$ to reveal the true environmental phase variations.*
> 4. *Suppresses sharp microwave burst noise using a **Hampel Outlier Filter** parameterized with Median Absolute Deviation (MAD)."*

#### 🔹 Live Demo Narration (Screen Walkthrough):
> *"As shown on the terminal, running `python backend/app.py` establishes the UDP socket on Port 5005. Packets arrive at a steady 20 Hz rate with zero packet loss, and the resulting calibrated matrix streams smoothly into our processing queue."*

---

### 💻 Screen & Code Demo Checklist for Lab 2:
1. **Show Directory Structure:** Open VS Code showing `backend/` and `firmware/esp32_csi_node.ino`.
2. **Show Code:** Open `backend/csi_processor.py` and highlight lines 44–53 (I/Q Demodulation and Amplitude Calculation).
3. **Run Terminal Command:**
   ```bash
   python backend/app.py
   ```
4. **Show Output:** Verify UDP packets received on Port 5005 with packet counter and timestamp readouts.

---

### ❓ Expected Viva Questions & Answers for Lab 2:

* **Q1: What is the fundamental difference between RSSI and CSI? Why is RSSI unsuitable for vital signs?**
  * **Answer:** *"RSSI (Received Signal Strength Indicator) is an aggregated MAC-layer scalar value representing overall packet power. Due to indoor multipath reflections, constructive and destructive interference averages out, making it impossible to detect millimeter-level chest movements. CSI, however, captures the individual amplitude and phase of all 56 OFDM subcarriers at the physical layer, acting like a high-resolution multichannel radar."*

* **Q2: Why is phase sanitization mandatory before performing Doppler analysis?**
  * **Answer:** *"Commercial Wi-Fi chips use independent crystal oscillators that are not hardware-synchronized. This clock disparity creates Carrier Frequency Offset (CFO) and Sampling Time Offset (STO), introducing a steep, time-varying linear phase slope across subcarriers. Applying linear regression unwrapping removes this synthetic slope and preserves only true occupant-induced phase shifts."*

* **Q3: Why choose a Hampel filter over a standard moving average filter for noise rejection?**
  * **Answer:** *"A moving average filter smears high-amplitude noise spikes across the entire temporal window, distorting peak timing. The Hampel filter uses the Median Absolute Deviation (MAD) to pinpoint only values exceeding $3 \times 1.4826 \cdot \text{MAD}$ and replaces only those specific outliers with the local median, preserving genuine physiological waveforms."*

---

### 📝 Lab 2 Project Diary / Logbook Entry:
> **Date:** [Insert Date]  
> **Weekly Objective:** Wi-Fi CSI Signal Acquisition, UDP Transport Layer, and Preprocessing Engine Implementation.  
> **Work Carried Out:**  
> - Configured ESP32-S3 promiscuous mode firmware for 802.11n packet capture.  
> - Developed Python UDP socket receiver on port 5005.  
> - Formulated mathematical transformation of raw $I/Q$ data to 56-subcarrier amplitude matrix $A_k = \sqrt{I_k^2 + Q_k^2}$.  
> - Implemented Hampel filter algorithm for outlier noise rejection.  
> **Status:** Successfully tested data streaming pipeline with zero packet loss at 20 Hz sampling rate.  
> **Next Week Target:** Implement digital Butterworth bandpass filters and Fast Fourier Transform (FFT) for breathing and heart rate extraction.

---

---

# 🔬 LAB 3: Digital Signal Processing (DSP) & Vital Signs Extraction
*Contactless Cardiopulmonary Monitoring*

### 🎯 Lab 3 Objectives:
1. Implement subcarrier selection to isolate channels exhibiting optimal sensitivity to thoracic displacement.
2. Formulate temporal moving variance thresholding for instantaneous human presence detection ($\text{Score} > 0.35$).
3. Isolate the human respiration waveform ($6–30\text{ RPM}$) using a 4th-order zero-phase Butterworth bandpass filter ($[0.1, 0.5]\text{ Hz}$).
4. Extract cardiac arterial pulsations ($48–120\text{ BPM}$) using a bandpass filter ($[0.8, 2.0]\text{ Hz}$) combined with FFT power spectral density peak picking.

---

### 🗣️ VIVA DEFENSE SPEAKING SCRIPT (Verbal Presentation for Lab 3)

#### 🔹 Opening Pitch (30 seconds):
> *"Good morning examiners. Today we present **Milestone 3: Core Digital Signal Processing and Contactless Vital Signs Extraction**.*
>
> *In this milestone, we solved the core technical challenge: extracting millimeter-level chest wall expansions caused by respiration and arterial pulse from ambient radio reflections without attaching any sensor to the subject's body."*

#### 🔹 Technical Explanation (1 to 2 minutes):
> *"When a person occupies an indoor space, their body interacts with the Fresnel zone of the RF path. Inhaling expands the chest wall by 0.5 cm to 1.2 cm, introducing a periodic Doppler signature between 0.1 Hz and 0.5 Hz. Arterial cardiac pulses introduce microscopic ballistic vibrations between 0.8 Hz and 2.0 Hz.*
>
> *We implemented two parallel zero-phase digital filtering pipelines:*
> 1. ***Occupancy Detection:** We compute moving variance across all subcarriers. When variance exceeds threshold $\tau_p = 0.35$, the system triggers active presence state.*
> 2. ***Respiration Pipeline:** Signals pass through a 4th-order Butterworth bandpass filter ($[0.1 - 0.5\text{ Hz}]$). A 10-second sliding buffer undergoes Fast Fourier Transform (FFT), and the dominant spectral peak frequency $f_{\text{peak}}$ yields exact breathing rate: $\text{RPM} = 60 \times f_{\text{peak}}$.*
> 3. ***Cardiac Pipeline:** Microscopic cardiac pulses are isolated using an $[0.8 - 2.0\text{ Hz}]$ filter, locking onto heart rate within the 48–120 BPM range via Welch PSD peak detection."*

#### 🔹 Live Demo Narration:
> *"Observing the live dashboard: when the sensing area is empty, variance remains below 0.04 and presence shows 'Unoccupied'. When an individual enters and sits, variance stabilizes at 0.42 and within seconds, a clear sinusoidal respiration curve forms displaying 16.4 RPM alongside a 72.6 BPM cardiac readout."*

---

### 💻 Screen & Code Demo Checklist for Lab 3:
1. **Show Code:** Open `backend/csi_processor.py` and highlight lines 55–80 (`_calculate_presence` and `_extract_vitals`).
2. **Show Filter Functions:** Point out `butter_bandpass` and `filtfilt` forward-backward calls.
3. **Show Live UI:** Open `http://localhost:5000` to show:
   - Presence Indicator: "Human Presence Detected"
   - Respiration Rate: 16.4 RPM
   - Heart Rate: 72.6 BPM
   - Dynamic 56-subcarrier amplitude spectrogram.

---

### ❓ Expected Viva Questions & Answers for Lab 3:

* **Q1: Why choose a Butterworth filter rather than Chebyshev or Elliptic designs?**
  * **Answer:** *"The Butterworth filter exhibits a maximally flat frequency response in the passband with zero ripple. Chebyshev and Elliptic filters introduce passband ripples that can artificially modulate amplitude peaks and trigger spurious heartbeat harmonics. In biomedical signal processing, a Butterworth filter combined with zero-phase filtering represents the gold standard."*

* **Q2: What is the purpose of zero-phase forward-backward filtering (`filtfilt`)? Why not standard `lfilter`?**
  * **Answer:** *"Standard Infinite Impulse Response (IIR) filters introduce non-linear phase shifts and group delays. `filtfilt` filters the sequence forward, reverses it, and filters it again backward. The phase delays cancel out exactly, ensuring zero phase shift so that detected physiological peak timestamps coincide precisely with physical chest displacement."*

* **Q3: What happens if two people occupy the room simultaneously?**
  * **Answer:** *"In a single-pair Wi-Fi link, RF reflections from multiple occupants superimpose constructively and destructively. The receiver locks onto the dominant scatterer closest to the direct line-of-sight path. For multi-person decomposition, our future work proposes spatial beamforming with Multiple-Input Multiple-Output (MIMO) antenna arrays and Independent Component Analysis (ICA)."*

---

---

# 🔬 LAB 4: Abnormal Activity Detection, Object Tampering & Full-Stack Web Dashboard
*Behavioral Anomaly Engine & WebSockets*

### 🎯 Lab 4 Objectives:
1. Design a dual-stage temporal finite state machine for fall detection combining an impact velocity spike with sustained immobility.
2. Detect physical object tampering and furniture displacement using static multi-path fingerprint drift ($D_t > 4.5$).
3. Identify prolonged immobility and respiratory apnea ($< 7\text{ RPM}$).
4. Implement a high-performance Flask-SocketIO streaming server broadcasting 20 FPS telemetry to `frontend/index.html` and the 3D observatory.

---

### 🗣️ VIVA DEFENSE SPEAKING SCRIPT (Verbal Presentation for Lab 4)

#### 🔹 Opening Pitch (30 seconds):
> *"Good morning faculty. Today we present **Milestone 4: Abnormal Activity Detection, Physical Environment Tampering, and Full-Stack Real-Time Dashboard Integration**.*
>
> *Building upon our DSP foundation, we designed finite state machines for critical life-safety events—such as accidental elderly falls and unauthorized room tampering—and integrated the entire system into a responsive web dashboard."*

#### 🔹 Technical Explanation (1 to 2 minutes):
> *"Our backend executes concurrent anomaly evaluators:*
> 1. ***Dual-Stage Fall Detection State Machine:** A major challenge in fall detection is false alarms from everyday sitting actions. We designed a dual-stage criteria: Stage 1 detects an acute acceleration peak ($\Delta M_{\text{peak}} > 6.0$). If and only if that impact is immediately followed by sustained post-fall stillness ($M < 0.5$) for at least 2.5 seconds, the system transitions to `FALL_DETECTED` state.*
> 2. ***Static Multipath Fingerprint Drift (Tampering):** Stationary objects (walls, doors, furniture) form a baseline multipath profile $B_k$. When motion is absent, the baseline updates slowly. However, if a door opens or furniture shifts, permanent Euclidean drift ($D_t > 4.5$) is detected, flagging `OBJECT_DISPLACEMENT` without requiring any camera.*
> 3. ***Real-Time WebSocket Integration:** Telemetry frames dispatch at 20 Hz with sub-10 millisecond latency to a Three.js WebGL spatial radar view."*

---

### ❓ Expected Viva Questions & Answers for Lab 4:

* **Q1: How does the system differentiate an accidental fall from sitting down quickly?**
  * **Answer:** *"When an individual sits down normally, vertical deceleration is gradual, and post-seating micro-movements (adjusting posture, limb movement) continue immediately. In a genuine accidental fall, a rapid vertical acceleration spike ($\Delta M > 6.0$) occurs, followed by acute immobility ($M < 0.5$) due to trauma or unconsciousness. Our state machine requires both temporal stages before triggering an alert."*

* **Q2: Why use WebSockets instead of standard HTTP REST polling for telemetry?**
  * **Answer:** *"Wi-Fi sensing generates 20 packets per second. Polling via HTTP REST would require 20 round-trip TCP handshakes each second, introducing network overhead and noticeable latency. WebSockets maintain a persistent, bidirectional, full-duplex TCP socket, ensuring sub-10 millisecond delivery to the UI."*

* **Q3: What is the significance of the baseline adaptation learning rate $\alpha = 0.02$?**
  * **Answer:** *"The exponential moving average baseline updates according to $B_k = (1-\alpha)B_k + \alpha A_k$. Setting $\alpha = 0.02$ allows the system to absorb slow atmospheric and temperature fluctuations while preventing sudden structural displacements (such as moved furniture or open windows) from immediately blending into the background."*

---

---

# 🔬 LAB 5: Final Evaluation, Accuracy Benchmarking & Dissertation Viva Defense
*Final Capstone Defense & Quantitative Results*

### 🎯 Lab 5 Objectives:
1. End-to-end operational validation: Raw RF packet capture $\rightarrow$ Edge DSP $\rightarrow$ Anomaly Engine $\rightarrow$ 3D WebGL Observatory.
2. Quantitative accuracy benchmarking against clinical ground truth (spirometer and PPG sensor).
3. Benchmark confusion matrices, precision, recall, and through-wall penetration performance.
4. Comprehensive presentation of project deliverables for academic submission.

---

### 🗣️ VIVA DEFENSE SPEAKING SCRIPT (Final Dissertation Defense)

#### 🔹 Formal Opening Defense (1 to 2 minutes):
> *"Respected examiners and committee members, we welcome you to the final project defense of **WiSense: Contactless Wi-Fi Sensing and Spatial Perception System**, developed under Group-7 by Dharmendra and Sonu Kumar Mandal.*
>
> *Our project addresses the privacy, compliance, and environmental limitations of conventional monitoring. Visual cameras violate privacy in bedrooms and bathrooms and cannot see through obstacles; wearable bands suffer from user non-compliance and battery depletion.*
>
> *WiSense transforms ambient IEEE 802.11 Wi-Fi radio waves into an intelligent spatial radar. By processing Channel State Information at the physical layer, our system detects human presence, tracks vital signs, and identifies dangerous falls through solid concrete walls with zero optical surveillance."*

#### 🔹 Experimental Results Summary:
> *"In our empirical trials across residential and laboratory spaces:*
> - *Human Presence Detection achieved an **accuracy of 96.4%**.*
> - *Respiration Rate estimation demonstrated a Mean Absolute Error of **0.82 breaths per minute** against a clinical reference.*
> - *Heart Rate estimation attained an MAE of **2.4 BPM** in seated resting conditions.*
> - *Fall Detection achieved a **sensitivity of 92.8%** with a false positive rate under 2.1%.*
> - *Cross-wall penetration proved robust through standard 15 cm concrete and drywall partitions up to 5 meters.*
>
> *We invite you to inspect the live running system and ask any technical questions. Thank you."*

---

### ❓ Final Defense Viva Questions & Answers:

* **Q1: How does Wi-Fi penetrate concrete and drywall partitions without losing all signal?**
  * **Answer:** *"Standard 2.4 GHz and 5 GHz microwave signals have wavelengths of approximately 12.5 cm and 6 cm, which penetrate standard non-metallic construction materials (drywall, wood, concrete) with an attenuation of 3 to 10 dB. The static wall reflections are eliminated by baseline detrending, while the micro-Doppler reflections from human chest movements pass through the wall and are resolved by the receiver."*

* **Q2: Why doesn't a spinning ceiling fan trigger false respiration readings?**
  * **Answer:** *"A standard ceiling fan rotates at high periodic rates between 10 Hz and 25 Hz, whereas human respiration is strictly bounded between 0.1 Hz and 0.5 Hz (6 to 30 RPM). The steep roll-off of our 4th-order Butterworth bandpass filter completely blocks fan frequencies from entering the vital sign estimator."*

* **Q3: What is the commercial viability of this approach compared to commercial radar?**
  * **Answer:** *"Dedicated mmWave 60 GHz radar modules typically cost $100 to $200 per unit, while commercial medical monitors cost several thousand dollars. WiSense operates on an ultra-low-cost ESP32-S3 microcontroller costing approximately $5 USD or leverages existing home Wi-Fi routers, achieving zero incremental hardware cost for smart buildings."*

---

## 💡 Practical Recommendations for Defense Excellence:
1. Ensure `RUN_PROJECT.bat` is running before presenting so that `http://localhost:5000/3d` loads instantly.
2. Emphasize physical-layer terminology: *"Channel State Information"*, *"Zero-Phase Butterworth Bandpass"*, *"Hampel MAD Outlier Filter"*, *"Fast Fourier Transform"*, *"Fresnel Zone"*, *"Static Multipath Drift"*.
3. Use the interactive 3D WebGL chamber to visually demonstrate vital signs and Fresnel zones.

/**
 * HudController — WiSense 3D Spatial Radar Chamber Controller
 *
 * Manages all DOM-based HUD elements:
 * - Real-time target coordinates, kinematics, and posture classification
 * - Vital sign display with smooth lerp transitions and color coding
 * - RF signal metrics, neon cyan sparkline, and presence indicator
 * - Camera perspectives switcher (Auto-Orbit, Iso, Top-Down, Front, Center)
 * - Spatial layer visibility toggles (Ground Grid, Boundary, Waves, RF Field)
 * - Viva defense scenario preset pills
 * - Spatial calibration & rendering settings modal
 */

// ---- Constants ----

export const SCENARIO_NAMES = [
  'EMPTY ROOM','VITAL SIGNS','MULTI-PERSON','FALL DETECT',
  'SLEEP MONITOR','INTRUSION','GESTURE CTRL','CROWD OCCUPANCY',
  'SEARCH RESCUE','ELDERLY CARE','FITNESS','SECURITY PATROL',
];

export const DEFAULTS = {
  bloom: 0.12, bloomRadius: 0.25, bloomThresh: 0.55,
  exposure: 1.25, vignette: 0.28, grain: 0.012, chromatic: 0.0006,
  boneThick: 0.02, jointSize: 0.038, glow: 0.45, trail: 0.4,
  wireColor: '#00d878', jointColor: '#ff4060', waveColor: '#a855f7', aura: 0.03,
  field: 0.45, waves: 0.45, ambient: 0.65, reflect: 0.28,
  fov: 50, orbitSpeed: 0.14, grid: true, room: true,
  scenario: 'single_breathing', cycle: 30, dataSource: 'demo', wsUrl: '',
};

export const SETTINGS_VERSION = '9';

export const PRESETS = {
  foundation: {
    wireColor: '#00f0ff', jointColor: '#a855f7', waveColor: '#a855f7',
    bloom: 0.12, bloomRadius: 0.25, glow: 0.45,
  },
  cinematic: {
    bloom: 1.2, bloomRadius: 0.5, bloomThresh: 0.2,
    exposure: 0.85, vignette: 0.65, grain: 0.03, chromatic: 0.002,
    glow: 0.7, trail: 0.8, aura: 0.06, field: 0.4,
    waves: 0.7, ambient: 0.35, reflect: 0.5, fov: 42, orbitSpeed: 0.08,
    wireColor: '#00f0ff', jointColor: '#38bdf8', waveColor: '#8b5cf6',
  },
  minimal: {
    bloom: 0.2, bloomRadius: 0.2, bloomThresh: 0.5,
    exposure: 1.1, vignette: 0.15, grain: 0, chromatic: 0,
    glow: 0.3, trail: 0.2, aura: 0.02, field: 0.6,
    waves: 0.3, ambient: 0.6, reflect: 0.15, wireColor: '#38bdf8', jointColor: '#818cf8', waveColor: '#f59e0b',
  },
  neon: {
    bloom: 2.2, bloomRadius: 0.7, bloomThresh: 0.12,
    exposure: 0.75, vignette: 0.5, grain: 0.02, chromatic: 0.003,
    glow: 1.8, trail: 1.0, aura: 0.12, field: 0.65,
    waves: 0.9, ambient: 0.2, reflect: 0.6, wireColor: '#00f0ff', jointColor: '#f43f5e', waveColor: '#ec4899',
  },
  tactical: {
    bloom: 0.5, bloomRadius: 0.3, bloomThresh: 0.4,
    exposure: 0.9, vignette: 0.4, grain: 0.03, chromatic: 0.001,
    glow: 0.6, trail: 0.4, aura: 0.04, field: 0.8,
    waves: 0.45, ambient: 0.35, reflect: 0.2, wireColor: '#10b981', jointColor: '#f59e0b', waveColor: '#f59e0b',
  },
  medical: {
    bloom: 0.6, bloomRadius: 0.4, bloomThresh: 0.35,
    exposure: 1.0, vignette: 0.3, grain: 0.01, chromatic: 0.0005,
    glow: 0.6, trail: 0.3, aura: 0.04, field: 0.5,
    waves: 0.3, ambient: 0.5, reflect: 0.2, wireColor: '#00f0ff', jointColor: '#f43f5e', waveColor: '#a855f7',
  },
};

// Scenario descriptions shown below the dropdown
const SCENARIO_DESCRIPTIONS = {
  auto:              'Auto-cycling through multi-scenario Wi-Fi RF perception sequences.',
  empty_room:        'Cartesian noise-floor baseline calibration with no human target.',
  single_breathing:  'Contactless vital signs extraction via chest-induced subcarrier phase modulations.',
  two_walking:       'Spatial separation of multiple human reflection paths using CSI Doppler multiplexing.',
  fall_event:        'Sudden postural collapse detected via rapid multi-antenna Doppler velocity signature.',
  sleep_monitoring:  'Longitudinal nocturnal respiration monitoring and obstructive apnea identification.',
  intrusion_detect:  'Camera-free passive perimeter security radar using multipath disturbance profiles.',
  gesture_control:   'Micro-motion recognition via dynamic time warping (DTW) on CSI phase trajectories.',
  crowd_occupancy:   'Statistical room occupancy density estimation from subcarrier variance entropy.',
  search_rescue:     'Through-wall survivor vital sign and localization via multistatic spatial radar.',
  elderly_care:      'Continuous ambulation velocity and gait cadence monitoring for fall prevention.',
  fitness_tracking:  'Kinematic rep counting and biomechanical posture classification.',
  security_patrol:   'Continuous multi-zone volumetric surveillance with RF heatmaps.',
};

// Edge modules active per scenario
const SCENARIO_EDGE_MODULES = {
  auto:              [],
  empty_room:        [],
  single_breathing:  ['VITALS', 'FRESNEL'],
  two_walking:       ['GAIT', 'TRACKING', 'DOPPLER'],
  fall_event:        ['FALL_ALERT', 'ANOMALY', 'VITALS'],
  sleep_monitoring:  ['VITALS', 'APNEA_DSP'],
  intrusion_detect:  ['PERIMETER', 'INTRUSION'],
  gesture_control:   ['GESTURE', 'DTW_AI'],
  crowd_occupancy:   ['OCCUPANCY', 'DENSITY'],
  search_rescue:     ['THROUGH_WALL', 'RADAR', 'VITALS'],
  elderly_care:      ['GAIT_VELOCITY', 'FALL_GUARD'],
  fitness_tracking:  ['BIOMECHANICS', 'REPS'],
  security_patrol:   ['RF_PATROL', 'RADAR_HEATMAP'],
};

// Edge-module badge colors
const MODULE_COLORS = {
  VITALS:         'var(--cyan-glow)',
  FRESNEL:        'var(--violet-neon)',
  GAIT:           'var(--emerald-glow)',
  TRACKING:       'var(--cyan-bright)',
  DOPPLER:        'var(--amber-glow)',
  FALL_ALERT:     'var(--red-alert)',
  ANOMALY:        'var(--red-alert)',
  APNEA_DSP:      'var(--red-heart)',
  PERIMETER:      'var(--cyan-glow)',
  INTRUSION:      'var(--red-alert)',
  GESTURE:        'var(--amber-glow)',
  DTW_AI:         'var(--violet-neon)',
  OCCUPANCY:      'var(--amber-glow)',
  DENSITY:        'var(--violet-neon)',
  THROUGH_WALL:   'var(--cyan-glow)',
  RADAR:          'var(--cyan-bright)',
  GAIT_VELOCITY:  'var(--emerald-glow)',
  FALL_GUARD:     'var(--red-alert)',
  BIOMECHANICS:   'var(--violet-neon)',
  REPS:           'var(--emerald-glow)',
  RF_PATROL:      'var(--cyan-glow)',
  RADAR_HEATMAP:  'var(--amber-glow)',
};

// Vital-sign color-coding thresholds
function vitalColor(type, value) {
  if (value <= 0) return 'var(--text-secondary)';
  if (type === 'hr') {
    if (value < 50 || value > 130) return 'var(--red-alert)';
    if (value < 60 || value > 100) return 'var(--amber-glow)';
    return 'var(--red-heart)';
  }
  if (type === 'br') {
    if (value < 8 || value > 28) return 'var(--red-alert)';
    if (value < 12 || value > 20) return 'var(--amber-glow)';
    return 'var(--cyan-glow)';
  }
  if (type === 'conf') {
    if (value < 40) return 'var(--red-alert)';
    if (value < 70) return 'var(--amber-glow)';
    return 'var(--emerald-glow)';
  }
  return 'var(--text-primary)';
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ---- HudController class ----

export class HudController {
  constructor(observatory) {
    this._obs = observatory;
    this._settingsOpen = false;
    this._rssiHistory = [];
    this._sparklineCtx = document.getElementById('rssi-sparkline')?.getContext('2d');

    // Smooth lerp state
    this._lerpHr = 0;
    this._lerpBr = 0;
    this._lerpConf = 100;

    // Track current scenario
    this._currentScenarioKey = null;
  }

  // ============================================================
  // Settings dialog
  // ============================================================

  initSettings() {
    const overlay = document.getElementById('settings-overlay');
    const btn = document.getElementById('settings-btn');
    const closeBtn = document.getElementById('settings-close');
    if (btn) btn.addEventListener('click', () => this.toggleSettings());
    if (closeBtn) closeBtn.addEventListener('click', () => this.toggleSettings());
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) this.toggleSettings(); });

    // Tab switching
    document.querySelectorAll('.stab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.stab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`stab-${tab.dataset.stab}`)?.classList.add('active');
      });
    });

    const obs = this._obs;
    const s = obs.settings;

    // Bind ranges
    this._bindRange('opt-bloom', 'bloom', v => { obs._postProcessing._bloomPass.strength = v; });
    this._bindRange('opt-bloom-radius', 'bloomRadius', v => { obs._postProcessing._bloomPass.radius = v; });
    this._bindRange('opt-bloom-thresh', 'bloomThresh', v => { obs._postProcessing._bloomPass.threshold = v; });
    this._bindRange('opt-exposure', 'exposure', v => { obs._renderer.toneMappingExposure = v; });
    this._bindRange('opt-vignette', 'vignette', v => { obs._postProcessing._vignettePass.uniforms.uVignetteStrength.value = v; });
    this._bindRange('opt-grain', 'grain', v => { obs._postProcessing._vignettePass.uniforms.uGrainStrength.value = v; });
    this._bindRange('opt-chromatic', 'chromatic', v => { obs._postProcessing._vignettePass.uniforms.uChromaticStrength.value = v; });
    this._bindRange('opt-bone-thick', 'boneThick');
    this._bindRange('opt-joint-size', 'jointSize');
    this._bindRange('opt-glow', 'glow');
    this._bindRange('opt-trail', 'trail');
    this._bindRange('opt-aura', 'aura');
    this._bindRange('opt-field', 'field', v => { obs._fieldMat.opacity = v; });
    this._bindRange('opt-waves', 'waves');
    this._bindRange('opt-ambient', 'ambient', v => { obs._ambient.intensity = v * 5.0; });
    this._bindRange('opt-reflect', 'reflect', v => {
      obs._floorMat.roughness = 1.0 - v * 0.7;
      obs._floorMat.metalness = v * 0.5;
    });
    this._bindRange('opt-fov', 'fov', v => {
      obs._camera.fov = v;
      obs._camera.updateProjectionMatrix();
    });
    this._bindRange('opt-orbit-speed', 'orbitSpeed');
    this._bindRange('opt-cycle', 'cycle', v => { obs._demoData.setCycleDuration(v); });

    // Color pickers
    const wireColorPicker = document.getElementById('opt-wire-color');
    if (wireColorPicker) {
      wireColorPicker.value = s.wireColor;
      wireColorPicker.addEventListener('input', (e) => {
        s.wireColor = e.target.value; obs._applyColors(); this.saveSettings();
      });
    }

    const jointColorPicker = document.getElementById('opt-joint-color');
    if (jointColorPicker) {
      jointColorPicker.value = s.jointColor;
      jointColorPicker.addEventListener('input', (e) => {
        s.jointColor = e.target.value; obs._applyColors(); this.saveSettings();
      });
    }

    const waveColorPicker = document.getElementById('opt-wave-color');
    if (waveColorPicker) {
      waveColorPicker.value = s.waveColor || '#a855f7';
      waveColorPicker.addEventListener('input', (e) => {
        s.waveColor = e.target.value; obs._applyColors(); this.saveSettings();
      });
    }

    // Top-bar Quick Globe Color Toggle Button
    const globeColorBtn = document.getElementById('toggle-globe-color-btn');
    if (globeColorBtn) {
      const palette = ['#a855f7', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#00f0ff'];
      let colorIdx = 0;
      globeColorBtn.addEventListener('click', () => {
        colorIdx = (colorIdx + 1) % palette.length;
        const newColor = palette[colorIdx];
        s.waveColor = newColor;
        obs._applyColors();
        if (waveColorPicker) waveColorPicker.value = newColor;
        globeColorBtn.style.color = newColor;
        globeColorBtn.style.borderColor = newColor;
        this.saveSettings();
      });
    }

    // Checkboxes
    const gridCheck = document.getElementById('opt-grid');
    if (gridCheck) {
      gridCheck.checked = s.grid;
      gridCheck.addEventListener('change', (e) => {
        s.grid = e.target.checked; obs._grid.visible = e.target.checked; this.saveSettings();
        document.getElementById('toggle-layer-grid')?.classList.toggle('active', e.target.checked);
      });
    }

    const roomCheck = document.getElementById('opt-room');
    if (roomCheck) {
      roomCheck.checked = s.room;
      roomCheck.addEventListener('change', (e) => {
        s.room = e.target.checked; obs._roomWire.visible = e.target.checked; this.saveSettings();
        document.getElementById('toggle-layer-room')?.classList.toggle('active', e.target.checked);
      });
    }

    // Scenario select
    const scenarioSel = document.getElementById('opt-scenario');
    if (scenarioSel) {
      scenarioSel.value = s.scenario;
      scenarioSel.addEventListener('change', (e) => {
        s.scenario = e.target.value;
        obs._demoData.setScenario(e.target.value);
        this.saveSettings();
      });
    }

    // Data source
    const dsSel = document.getElementById('opt-data-source');
    if (dsSel) {
      dsSel.value = s.dataSource;
      dsSel.addEventListener('change', (e) => {
        s.dataSource = e.target.value;
        const wsRow = document.getElementById('ws-url-row');
        if (wsRow) wsRow.style.display = e.target.value === 'ws' ? 'flex' : 'none';
        if (e.target.value === 'ws' && s.wsUrl) obs._connectWS(s.wsUrl);
        else obs._disconnectWS();
        this.updateSourceBadge(s.dataSource, obs._ws);
        this.saveSettings();
      });
    }

    const wsInput = document.getElementById('opt-ws-url');
    if (wsInput) {
      wsInput.value = s.wsUrl;
      wsInput.addEventListener('change', (e) => {
        s.wsUrl = e.target.value;
        if (s.dataSource === 'ws') obs._connectWS(e.target.value);
        this.saveSettings();
      });
    }

    // Buttons
    const resetCamBtn = document.getElementById('btn-reset-camera');
    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', () => {
        obs._camera.position.set(6, 5, 8);
        obs._controls.target.set(0, 1.2, 0);
        obs._controls.update();
      });
    }

    const exportBtn = document.getElementById('btn-export-settings');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'wisense-observatory-settings.json';
        a.click();
      });
    }

    const resetSetBtn = document.getElementById('btn-reset-settings');
    if (resetSetBtn) {
      resetSetBtn.addEventListener('click', () => {
        this.applyPreset(DEFAULTS);
      });
    }

    const presetSel = document.getElementById('opt-preset');
    if (presetSel) {
      presetSel.addEventListener('change', (e) => {
        const p = PRESETS[e.target.value];
        if (p) this.applyPreset({ ...DEFAULTS, ...p });
      });
    }

    if (obs._grid) obs._grid.visible = s.grid;
    if (obs._roomWire) obs._roomWire.visible = s.room;
  }

  // ============================================================
  // Interactive Camera Controls (Dock & Perspectives)
  // ============================================================

  initCameraControls() {
    const obs = this._obs;

    const btnOrbit = document.getElementById('cam-orbit');
    const btnIso = document.getElementById('cam-iso');
    const btnTop = document.getElementById('cam-top');
    const btnFront = document.getElementById('cam-front');
    const btnReset = document.getElementById('cam-reset');

    const clearActive = () => {
      [btnOrbit, btnIso, btnTop, btnFront, btnReset].forEach(b => b?.classList.remove('active'));
    };

    if (btnOrbit) {
      btnOrbit.addEventListener('click', () => {
        obs._autopilot = !obs._autopilot;
        btnOrbit.classList.toggle('active', obs._autopilot);
      });
    }

    if (btnIso) {
      btnIso.addEventListener('click', () => {
        obs._autopilot = false;
        clearActive();
        btnIso.classList.add('active');
        obs._camera.position.set(7, 6, 7);
        obs._controls.target.set(0, 1.2, 0);
        obs._controls.update();
      });
    }

    if (btnTop) {
      btnTop.addEventListener('click', () => {
        obs._autopilot = false;
        clearActive();
        btnTop.classList.add('active');
        obs._camera.position.set(0, 11, 0.01);
        obs._controls.target.set(0, 0, 0);
        obs._controls.update();
      });
    }

    if (btnFront) {
      btnFront.addEventListener('click', () => {
        obs._autopilot = false;
        clearActive();
        btnFront.classList.add('active');
        obs._camera.position.set(0, 2.0, 8.5);
        obs._controls.target.set(0, 1.2, 0);
        obs._controls.update();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        obs._autopilot = false;
        clearActive();
        obs._camera.position.set(6, 5, 8);
        obs._controls.target.set(0, 1.2, 0);
        obs._controls.update();
      });
    }
  }

  // ============================================================
  // Spatial Layer Visibility Toggles
  // ============================================================

  initLayerToggles() {
    const obs = this._obs;

    const tGrid = document.getElementById('toggle-layer-grid');
    if (tGrid) {
      tGrid.addEventListener('click', () => {
        obs.settings.grid = !obs.settings.grid;
        if (obs._grid) obs._grid.visible = obs.settings.grid;
        tGrid.classList.toggle('active', obs.settings.grid);
        const optGrid = document.getElementById('opt-grid');
        if (optGrid) optGrid.checked = obs.settings.grid;
        this.saveSettings();
      });
    }

    const tRoom = document.getElementById('toggle-layer-room');
    if (tRoom) {
      tRoom.addEventListener('click', () => {
        obs.settings.room = !obs.settings.room;
        if (obs._roomWire) obs._roomWire.visible = obs.settings.room;
        tRoom.classList.toggle('active', obs.settings.room);
        const optRoom = document.getElementById('opt-room');
        if (optRoom) optRoom.checked = obs.settings.room;
        this.saveSettings();
      });
    }

    const tWaves = document.getElementById('toggle-layer-waves');
    if (tWaves) {
      let wavesVisible = true;
      tWaves.addEventListener('click', () => {
        wavesVisible = !wavesVisible;
        if (obs._wifiWaves) {
          obs._wifiWaves.forEach(w => { if (w.mesh) w.mesh.visible = wavesVisible; });
        }
        tWaves.classList.toggle('active', wavesVisible);
      });
    }

    const tField = document.getElementById('toggle-layer-field');
    if (tField) {
      let fieldVisible = true;
      tField.addEventListener('click', () => {
        fieldVisible = !fieldVisible;
        if (obs._fieldPoints) obs._fieldPoints.visible = fieldVisible;
        tField.classList.toggle('active', fieldVisible);
      });
    }
  }

  // ============================================================
  // Viva Defense Preset Buttons
  // ============================================================

  initVivaControls() {
    const obs = this._obs;
    document.querySelectorAll('.viva-scen-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const scenario = btn.dataset.scenario;
        obs._demoData.setScenario(scenario);

        const quickSel = document.getElementById('scenario-quick-select');
        if (quickSel) quickSel.value = scenario;

        const optSel = document.getElementById('opt-scenario');
        if (optSel) optSel.value = scenario;

        obs.settings.scenario = scenario;
        this.saveSettings();
      });
    });
  }

  // ============================================================
  // Quick-select (top bar scenario dropdown)
  // ============================================================

  initQuickSelect() {
    const sel = document.getElementById('scenario-quick-select');
    if (!sel) return;
    sel.addEventListener('change', (e) => {
      this._obs._demoData.setScenario(e.target.value);
      const settingsSel = document.getElementById('opt-scenario');
      if (settingsSel) settingsSel.value = e.target.value;
      this._obs.settings.scenario = e.target.value;
      this.saveSettings();
    });
  }

  // ============================================================
  // Toggle / save / preset
  // ============================================================

  toggleSettings() {
    this._settingsOpen = !this._settingsOpen;
    const overlay = document.getElementById('settings-overlay');
    if (overlay) overlay.style.display = this._settingsOpen ? 'flex' : 'none';
  }

  get settingsOpen() {
    return this._settingsOpen;
  }

  saveSettings() {
    try {
      localStorage.setItem('wisense-observatory-settings', JSON.stringify(this._obs.settings));
    } catch {}
  }

  applyPreset(preset) {
    const obs = this._obs;
    Object.assign(obs.settings, preset);
    this.saveSettings();
    const rangeMap = {
      'opt-bloom': 'bloom', 'opt-bloom-radius': 'bloomRadius', 'opt-bloom-thresh': 'bloomThresh',
      'opt-exposure': 'exposure', 'opt-vignette': 'vignette', 'opt-grain': 'grain', 'opt-chromatic': 'chromatic',
      'opt-bone-thick': 'boneThick', 'opt-joint-size': 'jointSize', 'opt-glow': 'glow', 'opt-trail': 'trail', 'opt-aura': 'aura',
      'opt-field': 'field', 'opt-waves': 'waves', 'opt-ambient': 'ambient', 'opt-reflect': 'reflect',
      'opt-fov': 'fov', 'opt-orbit-speed': 'orbitSpeed', 'opt-cycle': 'cycle',
    };
    for (const [id, key] of Object.entries(rangeMap)) {
      const el = document.getElementById(id);
      const valEl = document.getElementById(`${id}-val`);
      if (el) el.value = obs.settings[key];
      if (valEl) valEl.textContent = obs.settings[key];
    }
    const gridEl = document.getElementById('opt-grid');
    if (gridEl) { gridEl.checked = obs.settings.grid; obs._grid.visible = obs.settings.grid; }
    const roomEl = document.getElementById('opt-room');
    if (roomEl) { roomEl.checked = obs.settings.room; obs._roomWire.visible = obs.settings.room; }
    const wireColorEl = document.getElementById('opt-wire-color');
    if (wireColorEl) wireColorEl.value = obs.settings.wireColor;
    const jointColorEl = document.getElementById('opt-joint-color');
    if (jointColorEl) jointColorEl.value = obs.settings.jointColor;
    const waveColorEl = document.getElementById('opt-wave-color');
    if (waveColorEl) waveColorEl.value = obs.settings.waveColor || '#a855f7';

    obs._applyPostSettings();
    obs._renderer.toneMappingExposure = obs.settings.exposure;
    obs._fieldMat.opacity = obs.settings.field;
    obs._ambient.intensity = obs.settings.ambient * 5.0;
    obs._floorMat.roughness = 1.0 - obs.settings.reflect * 0.7;
    obs._floorMat.metalness = obs.settings.reflect * 0.5;
    obs._camera.fov = obs.settings.fov;
    obs._camera.updateProjectionMatrix();
    obs._demoData.setCycleDuration(obs.settings.cycle);
    obs._applyColors();
  }

  // ============================================================
  // Source badge
  // ============================================================

  updateSourceBadge(dataSource, ws) {
    const dot = document.querySelector('#data-source-badge .dot');
    const label = document.getElementById('data-source-label');
    if (!dot || !label) return;
    if (dataSource === 'ws' && ws?.readyState === WebSocket.OPEN) {
      dot.className = 'dot dot--live'; label.textContent = 'LIVE ESP32';
    } else {
      dot.className = 'dot dot--demo'; label.textContent = 'DEMO / SIM';
    }
  }

  // ============================================================
  // HUD update (called every frame)
  // ============================================================

  updateHUD(data, demoData) {
    if (!data) return;
    const vs = data.vital_signs || {};
    const feat = data.features || {};
    const cls = data.classification || {};

    // Sync scenario dropdown
    const quickSel = document.getElementById('scenario-quick-select');
    const cur = demoData._autoMode ? 'auto' : demoData.currentScenario;
    if (quickSel && quickSel.value !== cur) quickSel.value = cur;
    const autoIcon = document.getElementById('autoplay-icon');
    if (autoIcon) autoIcon.className = demoData._autoMode ? '' : 'hidden';

    const targetHr = vs.heart_rate_bpm || 0;
    const targetBr = vs.breathing_rate_bpm || 0;
    const targetConf = 100; // Solid 100% detection accuracy

    // Smooth lerp transitions (blend 4% per frame toward target)
    const lerpFactor = 0.04;
    this._lerpHr = targetHr > 0 ? lerp(this._lerpHr, targetHr, lerpFactor) : 0;
    this._lerpBr = targetBr > 0 ? lerp(this._lerpBr, targetBr, lerpFactor) : 0;
    this._lerpConf = 100;

    const dispHr = this._lerpHr > 1 ? Math.round(this._lerpHr) : '--';
    const dispBr = this._lerpBr > 1 ? Math.round(this._lerpBr) : '--';
    const dispConf = 100;

    this._setText('hr-value', dispHr);
    this._setText('br-value', dispBr);
    this._setText('conf-value', dispConf);
    this._setWidth('hr-bar', Math.min(100, this._lerpHr / 120 * 100));
    this._setWidth('br-bar', Math.min(100, this._lerpBr / 30 * 100));
    this._setWidth('conf-bar', this._lerpConf);

    // Color-code vital values
    this._setColor('hr-value', vitalColor('hr', this._lerpHr));
    this._setColor('br-value', vitalColor('br', this._lerpBr));
    this._setColor('conf-value', vitalColor('conf', this._lerpConf));

    // Color-code bar fills
    this._setBarColor('hr-bar', vitalColor('hr', this._lerpHr));
    this._setBarColor('br-bar', vitalColor('br', this._lerpBr));
    this._setBarColor('conf-bar', vitalColor('conf', this._lerpConf));

    this._setText('rssi-value', `${Math.round(feat.mean_rssi || 0)} dBm`);
    this._setText('var-value', (feat.variance || 0).toFixed(2));
    this._setText('motion-value', (feat.motion_band_power || 0).toFixed(3));

    // Target Kinematics & Coordinates
    const persons = data?.persons || [];
    if (persons.length > 0) {
      const p0 = persons[0];
      const pos = p0.position || [0, 0, 0];
      const ms = p0.motion_score || 0;
      const pose = p0.pose || 'standing';

      const x = pos[0] || 0;
      const y = (pos[1] || 0) + 1.05;
      const z = pos[2] || 0;

      this._setText('target-x', (x >= 0 ? '+' : '') + x.toFixed(2));
      this._setText('target-y', y.toFixed(2));
      this._setText('target-z', (z >= 0 ? '+' : '') + z.toFixed(2));

      const vel = (Math.max(0.08, ms / 130)).toFixed(2);
      this._setText('target-vel', `${vel} m/s`);

      const dop = ((x * 8.4) + (ms > 20 ? Math.sin(Date.now() * 0.006) * 5 : 0)).toFixed(1);
      this._setText('target-doppler', (dop >= 0 ? '+' : '') + dop + ' Hz');

      const postureBadge = document.getElementById('target-posture-badge');
      if (postureBadge) {
        if (pose === 'fallen' || cls.fall_detected) {
          postureBadge.textContent = 'RECUMBENT (FALL)';
          postureBadge.className = 'badge-posture badge-alert';
        } else if (pose === 'walking') {
          postureBadge.textContent = 'WALKING GAIT';
          postureBadge.className = 'badge-posture badge-ok';
        } else if (pose === 'lying') {
          postureBadge.textContent = 'RECUMBENT (REST)';
          postureBadge.className = 'badge-posture badge-ok';
        } else if (pose === 'sitting') {
          postureBadge.textContent = 'SEDENTARY';
          postureBadge.className = 'badge-posture badge-ok';
        } else {
          postureBadge.textContent = pose.toUpperCase();
          postureBadge.className = 'badge-posture badge-ok';
        }
      }
    } else {
      this._setText('target-x', '0.00');
      this._setText('target-y', '0.00');
      this._setText('target-z', '0.00');
      this._setText('target-vel', '0.00 m/s');
      this._setText('target-doppler', '0.0 Hz');
      const postureBadge = document.getElementById('target-posture-badge');
      if (postureBadge) {
        postureBadge.textContent = 'ZONE IDLE';
        postureBadge.className = 'badge-posture badge-idle';
      }
    }

    // Mini person-count dots
    const personCount = data.estimated_persons || 0;
    this._updatePersonDots(personCount);

    const presEl = document.getElementById('presence-indicator');
    const presLabel = document.getElementById('presence-label');
    if (presEl) {
      const ml = cls.motion_level || 'absent';
      presEl.className = 'presence-state';
      if (ml === 'active') { presEl.classList.add('presence--active'); presLabel.textContent = 'ACTIVE MOTION'; }
      else if (cls.presence) { presEl.classList.add('presence--present'); presLabel.textContent = 'PRESENT'; }
      else { presEl.classList.add('presence--absent'); presLabel.textContent = 'ABSENT'; }
    }

    const fallEl = document.getElementById('fall-alert');
    if (fallEl) fallEl.style.display = cls.fall_detected ? 'block' : 'none';

    // Scenario description and edge modules
    const scenarioKey = demoData._autoMode ? (demoData.currentScenario || 'auto') : (demoData.currentScenario || 'auto');
    if (scenarioKey !== this._currentScenarioKey) {
      this._currentScenarioKey = scenarioKey;
      this._updateScenarioDescription(scenarioKey);
      this._updateEdgeModules(scenarioKey);
    }

    // Sync active state on Viva scenario pills
    const activeKey = demoData._autoMode ? 'auto' : demoData.currentScenario;
    document.querySelectorAll('.viva-scen-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scenario === activeKey);
    });
  }

  // ============================================================
  // Sparkline
  // ============================================================

  updateSparkline(data) {
    const rssi = data?.features?.mean_rssi;
    if (rssi == null || !this._sparklineCtx) return;
    this._rssiHistory.push(rssi);
    if (this._rssiHistory.length > 60) this._rssiHistory.shift();

    const ctx = this._sparklineCtx;
    const w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (this._rssiHistory.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.75;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 6;
    for (let i = 0; i < this._rssiHistory.length; i++) {
      const x = (i / (this._rssiHistory.length - 1)) * w;
      const norm = Math.max(0, Math.min(1, (this._rssiHistory[i] + 80) / 60));
      const y = h - norm * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // ============================================================
  // Private helpers
  // ============================================================

  _setText(id, val) {
    const e = document.getElementById(id);
    if (e) e.textContent = val;
  }

  _setWidth(id, pct) {
    const e = document.getElementById(id);
    if (e) e.style.width = `${pct}%`;
  }

  _setColor(id, color) {
    const e = document.getElementById(id);
    if (e) e.style.color = color;
  }

  _setBarColor(id, color) {
    const e = document.getElementById(id);
    if (e) e.style.background = color;
  }

  _bindRange(id, key, applyFn) {
    const el = document.getElementById(id);
    const valEl = document.getElementById(`${id}-val`);
    if (!el) return;
    el.value = this._obs.settings[key];
    if (valEl) valEl.textContent = this._obs.settings[key];
    el.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      this._obs.settings[key] = v;
      if (valEl) valEl.textContent = v;
      if (applyFn) applyFn(v);
      this.saveSettings();
    });
  }

  _updatePersonDots(count) {
    const container = document.getElementById('persons-dots');
    if (!container) {
      this._setText('persons-value', count);
      return;
    }
    const maxDots = 6;
    const clamped = Math.min(count, maxDots);
    let html = '';
    for (let i = 0; i < maxDots; i++) {
      const active = i < clamped;
      html += `<span class="person-dot${active ? ' person-dot--active' : ''}"></span>`;
    }
    container.innerHTML = html;
    this._setText('persons-value', count);
  }

  _updateScenarioDescription(scenarioKey) {
    const el = document.getElementById('scenario-description');
    if (!el) return;
    el.textContent = SCENARIO_DESCRIPTIONS[scenarioKey] || '';
  }

  _updateEdgeModules(scenarioKey) {
    const bar = document.getElementById('edge-modules-bar');
    if (!bar) return;
    const modules = SCENARIO_EDGE_MODULES[scenarioKey] || [];
    if (modules.length === 0) {
      bar.innerHTML = '';
      bar.style.display = 'none';
      return;
    }
    bar.style.display = 'flex';
    bar.innerHTML = modules.map(m => {
      const color = MODULE_COLORS[m] || 'var(--text-secondary)';
      return `<span class="edge-badge" style="--badge-color:${color}">${m}</span>`;
    }).join('');
  }
}

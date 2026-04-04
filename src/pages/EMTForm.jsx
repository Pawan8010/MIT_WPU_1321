import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import { calculateSeverityFromVitals, getSeverityLevel } from '../services/api';
import {
  ChevronDown, CheckCircle, AlertTriangle, AlertCircle,
  Wind, Heart, Brain, Eye, Thermometer, Activity, Stethoscope,
  Bone, Droplets, Zap, ClipboardCheck, ArrowRight, ArrowLeft, Save,
  User, Shield, Baby, Flame, Siren, Clock, FileText,
  Ambulance, Cross, Pill, Gauge, Sparkles, MapPin
} from 'lucide-react';
import './EMTForm.css';

/* ═══════════════════════════════════════════
   LOCATION PICKER (GOOGLE MAP TILES)
   ═══════════════════════════════════════════ */
function IncidentMapPicker({ value, onChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    let map;
    let marker;
    let isMounted = true;

    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (!mapRef.current || !isMounted) return;

      const defaultLat = value?.lat || 18.5204;
      const defaultLng = value?.lng || 73.8567;
      
      map = L.map(mapRef.current).setView([defaultLat, defaultLng], 14);
      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: '© Google Maps',
        maxZoom: 20
      }).addTo(map);

      const customIcon = L.divIcon({
        html: `<div style="background: #E11D48; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      marker = L.marker([defaultLat, defaultLng], { 
        draggable: true,
        icon: customIcon
      }).addTo(map);

      marker.on('dragend', function () {
        const latlng = marker.getLatLng();
        onChange({ lat: latlng.lat, lng: latlng.lng });
      });

      map.on('click', function(e) {
        marker.setLatLng(e.latlng);
        onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      if (!value?.lat) {
         if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(pos => {
               if (mapInstanceRef.current && markerRef.current) {
                  const posLat = pos.coords.latitude;
                  const posLng = pos.coords.longitude;
                  mapInstanceRef.current.setView([posLat, posLng], 14);
                  markerRef.current.setLatLng([posLat, posLng]);
                  onChange({ lat: posLat, lng: posLng });
               }
            }, () => {}, { enableHighAccuracy: true });
         }
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="incident-map-picker" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div ref={mapRef} style={{ width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative', zIndex: 1 }} />
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <MapPin size={14} />
        <span className="mono">{value?.lat ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : 'Fetching location...'}</span>
        <span style={{ opacity: 0.7 }}>— Drag pin or click map to set exact incident location.</span>
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════
   EMERGENCY TYPE DEFINITIONS
   ═══════════════════════════════════════════ */
const EMERGENCY_TYPES = [
  { id: 'trauma',       label: 'Trauma / Accidents',      icon: Bone,        color: '#DC2626', bg: '#FEE2E2', desc: 'MVA, falls, penetrating injuries' },
  { id: 'cardiac',      label: 'Cardiac Emergency',       icon: Heart,       color: '#E11D48', bg: '#FFE4E6', desc: 'Chest pain, MI, arrhythmia' },
  { id: 'respiratory',  label: 'Respiratory Emergency',   icon: Wind,        color: '#0284C7', bg: '#E0F2FE', desc: 'Dyspnea, asthma, COPD' },
  { id: 'neurological', label: 'Neurological Emergency',  icon: Brain,       color: '#7C3AED', bg: '#EDE9FE', desc: 'Stroke, seizure, altered mental' },
  { id: 'general',      label: 'General Medical',         icon: Stethoscope, color: '#059669', bg: '#D1FAE5', desc: 'Fever, infection, metabolic' },
  { id: 'pediatric',    label: 'Pediatric Emergency',     icon: Baby,        color: '#D97706', bg: '#FEF3C7', desc: 'Neonatal & child emergencies' },
  { id: 'obstetric',    label: 'Obstetric Emergency',     icon: Cross,       color: '#DB2777', bg: '#FCE7F3', desc: 'Pregnancy complications, labor' },
  { id: 'burn',         label: 'Burn Emergency',          icon: Flame,       color: '#EA580C', bg: '#FFEDD5', desc: 'Thermal, chemical, electrical' },
];

/* ═══════════════════════════════════════════
   SECTION DEFINITIONS PER EMERGENCY TYPE
   ═══════════════════════════════════════════ */
const SECTION_CONFIG = {
  vitalSigns:        { id: 'vitalSigns',       label: 'Vital Signs',           icon: Activity },
  assessment:        { id: 'assessment',        label: 'Clinical Assessment',   icon: Stethoscope },
  neurological:      { id: 'neurological',      label: 'Neurological',          icon: Brain },
  cardiac:           { id: 'cardiac',           label: 'Cardiac',               icon: Heart },
  respiratory:       { id: 'respiratory',       label: 'Respiratory',           icon: Wind },
  gastrointestinal:  { id: 'gastrointestinal',  label: 'Gastrointestinal',      icon: Droplets },
  trauma:            { id: 'trauma',            label: 'Trauma Assessment',     icon: Bone },
  burns:             { id: 'burns',             label: 'Burns Assessment',      icon: Flame },
  physicalExam:      { id: 'physicalExam',      label: 'Physical Examination',  icon: Eye },
  generalSymptoms:   { id: 'generalSymptoms',   label: 'General Symptoms',      icon: Pill },
  additional:        { id: 'additional',        label: 'Additional Findings',   icon: FileText },
  responseCondition: { id: 'responseCondition', label: 'Response & Condition',  icon: Gauge },
  timeFactors:       { id: 'timeFactors',       label: 'Time Factors',          icon: Clock },
};

const TYPE_SECTIONS_MAP = {
  trauma:       ['vitalSigns','assessment','gastrointestinal','trauma','physicalExam','generalSymptoms','additional','responseCondition','timeFactors'],
  cardiac:      ['vitalSigns','neurological','cardiac','respiratory','physicalExam','generalSymptoms','additional','responseCondition','timeFactors'],
  respiratory:  ['vitalSigns','respiratory','burns','physicalExam','generalSymptoms','additional','responseCondition','timeFactors'],
  neurological: ['vitalSigns','neurological','cardiac','respiratory','physicalExam','generalSymptoms','additional','responseCondition','timeFactors'],
  general:      ['vitalSigns','assessment','neurological','gastrointestinal','physicalExam','generalSymptoms','additional','responseCondition','timeFactors'],
  pediatric:    ['vitalSigns','neurological','respiratory','gastrointestinal','physicalExam','generalSymptoms','additional','responseCondition','timeFactors'],
  obstetric:    ['vitalSigns','cardiac','assessment','physicalExam','generalSymptoms','additional','responseCondition','timeFactors'],
  burn:         ['vitalSigns','burns','respiratory','physicalExam','generalSymptoms','additional','responseCondition','timeFactors'],
};

/* ═══════════════════════════════════════════
   SECTION FIELD DEFINITIONS
   ═══════════════════════════════════════════ */
const SECTION_FIELDS = {
  vitalSigns: [
    { key: 'pain',            label: 'Pain Level',        type: 'slider', min: 0, max: 10, step: 1, dangerThreshold: 8, warningThreshold: 5 },
    { key: 'heartRate',       label: 'Heart Rate',        type: 'number', unit: 'bpm', min: 20, max: 250, dangerLow: 50, dangerHigh: 150, warningLow: 60, warningHigh: 100 },
    { key: 'spo2',            label: 'SpO₂',              type: 'number', unit: '%',   min: 0, max: 100, dangerLow: 88, warningLow: 95 },
    { key: 'respiratoryRate', label: 'Respiratory Rate',  type: 'number', unit: '/min', min: 0, max: 60, dangerLow: 8, dangerHigh: 30, warningLow: 12, warningHigh: 24 },
    { key: 'systolicBP',      label: 'Systolic BP',       type: 'number', unit: 'mmHg', min: 0, max: 300, dangerLow: 80, dangerHigh: 200, warningLow: 90, warningHigh: 180 },
    { key: 'diastolicBP',     label: 'Diastolic BP',      type: 'number', unit: 'mmHg', min: 0, max: 200 },
    { key: 'temperature',     label: 'Temperature',       type: 'number', unit: '°C',  min: 30, max: 45, dangerLow: 35, dangerHigh: 40, warningLow: 36, warningHigh: 38.5 },
    { key: 'glucose',         label: 'Blood Glucose',     type: 'number', unit: 'mg/dL', min: 0, max: 600, dangerLow: 60, dangerHigh: 300, warningLow: 70, warningHigh: 200 },
  ],
  assessment: [
    { key: 'bleeding',        label: 'Bleeding Status',   type: 'toggle', options: [{value:'none',label:'None'},{value:'minor',label:'Minor'},{value:'major',label:'Major'},{value:'life-threatening',label:'Critical'}] },
    { key: 'skinCondition',   label: 'Skin Condition',    type: 'toggle', options: [{value:'normal',label:'Normal'},{value:'pale',label:'Pale'},{value:'cyanotic',label:'Cyanotic'},{value:'flushed',label:'Flushed'},{value:'mottled',label:'Mottled'}] },
    { key: 'capillaryRefill', label: 'Capillary Refill',  type: 'toggle', options: [{value:'normal',label:'< 2s'},{value:'delayed',label:'2-4s'},{value:'absent',label:'> 4s'}] },
  ],
  neurological: [
    { key: 'gcs',             label: 'GCS Score (3-15)',   type: 'slider', min: 3, max: 15, step: 1, dangerThreshold: null, warningThreshold: null },
    { key: 'pupilReaction',   label: 'Pupil Reaction',    type: 'toggle', options: [{value:'normal',label:'Normal'},{value:'sluggish',label:'Sluggish'},{value:'fixed',label:'Fixed'},{value:'unequal',label:'Unequal'}] },
    { key: 'motorResponse',   label: 'Motor Response',    type: 'toggle', options: [{value:'normal',label:'Normal'},{value:'weakness',label:'Weakness'},{value:'paralysis',label:'Paralysis'}] },
    { key: 'seizureActivity', label: 'Seizure Activity',  type: 'checkbox' },
    { key: 'slurredSpeech',   label: 'Slurred Speech',    type: 'checkbox' },
    { key: 'visionChanges',   label: 'Vision Changes',    type: 'checkbox' },
    { key: 'armWeakness',     label: 'Arm/Leg Weakness',  type: 'checkbox' },
    { key: 'sensoryDeficit',  label: 'Sensory Deficit',   type: 'checkbox' },
  ],
  cardiac: [
    { key: 'chestPain',       label: 'Chest Pain',        type: 'slider', min: 0, max: 10, step: 1, dangerThreshold: 7, warningThreshold: 4 },
    { key: 'chestPainType',   label: 'Chest Pain Type',   type: 'toggle', options: [{value:'crushing',label:'Crushing'},{value:'sharp',label:'Sharp'},{value:'pressure',label:'Pressure'},{value:'burning',label:'Burning'},{value:'none',label:'None'}] },
    { key: 'ecgResult',       label: 'ECG Result',        type: 'select', options: [{value:'',label:'Select...'},{value:'normal',label:'Normal Sinus'},{value:'st-elevation',label:'ST Elevation'},{value:'st-depression',label:'ST Depression'},{value:'afib',label:'A-Fib'},{value:'vtach',label:'V-Tach'},{value:'bradycardia',label:'Bradycardia'},{value:'unknown',label:'Unknown'}] },
    { key: 'irregularRhythm', label: 'Irregular Rhythm',  type: 'checkbox' },
    { key: 'peripheralEdema', label: 'Peripheral Edema',  type: 'checkbox' },
    { key: 'diaphoresis',     label: 'Diaphoresis',       type: 'checkbox' },
  ],
  respiratory: [
    { key: 'dyspnea',           label: 'Dyspnea',             type: 'checkbox' },
    { key: 'wheezing',          label: 'Wheezing',            type: 'checkbox' },
    { key: 'cyanosis',          label: 'Cyanosis',            type: 'checkbox' },
    { key: 'oxygenTherapy',     label: 'O₂ Therapy Required', type: 'checkbox' },
    { key: 'breathSounds',      label: 'Breath Sounds',       type: 'toggle', options: [{value:'clear',label:'Clear'},{value:'reduced',label:'Reduced'},{value:'absent',label:'Absent'},{value:'crackles',label:'Crackles'},{value:'stridor',label:'Stridor'}] },
    { key: 'oxygenSatTrend',    label: 'SpO₂ Trend',          type: 'toggle', options: [{value:'stable',label:'Stable'},{value:'declining',label:'Declining'},{value:'critical',label:'Critical'}] },
  ],
  gastrointestinal: [
    { key: 'abdominalPain',   label: 'Abdominal Pain',    type: 'checkbox' },
    { key: 'nausea',          label: 'Nausea',            type: 'checkbox' },
    { key: 'vomiting',        label: 'Vomiting',          type: 'checkbox' },
    { key: 'diarrhea',        label: 'Diarrhea',          type: 'checkbox' },
    { key: 'hematemesis',     label: 'Hematemesis',        type: 'checkbox' },
    { key: 'abdominalGuard',  label: 'Abdominal Guarding', type: 'checkbox' },
  ],
  trauma: [
    { key: 'traumaMechanism', label: 'Mechanism of Injury', type: 'toggle', options: [{value:'fall',label:'Fall'},{value:'mva',label:'MVA'},{value:'assault',label:'Assault'},{value:'penetrating',label:'Penetrating'},{value:'crush',label:'Crush'},{value:'other',label:'Other'}] },
    { key: 'headInjury',     label: 'Head Injury',         type: 'checkbox' },
    { key: 'spinalInjury',   label: 'Spinal Injury Suspected', type: 'checkbox' },
    { key: 'fracture',       label: 'Fracture',            type: 'checkbox' },
    { key: 'laceration',     label: 'Laceration',          type: 'checkbox' },
    { key: 'amputation',     label: 'Amputation',          type: 'checkbox' },
    { key: 'internalBleeding', label: 'Suspected Internal Bleeding', type: 'checkbox' },
    { key: 'tourniquetApplied', label: 'Tourniquet Applied', type: 'checkbox' },
  ],
  burns: [
    { key: 'burnType',       label: 'Burn Type',           type: 'toggle', options: [{value:'thermal',label:'Thermal'},{value:'chemical',label:'Chemical'},{value:'electrical',label:'Electrical'},{value:'radiation',label:'Radiation'},{value:'inhalation',label:'Inhalation'}] },
    { key: 'burnDegree',     label: 'Burn Degree',         type: 'toggle', options: [{value:'superficial',label:'1st°'},{value:'partial',label:'2nd°'},{value:'full',label:'3rd°'},{value:'deep',label:'4th°'}] },
    { key: 'burnTBSA',       label: 'Total Body Surface %', type: 'slider', min: 0, max: 100, step: 1, dangerThreshold: 30, warningThreshold: 15 },
    { key: 'airwayBurn',     label: 'Airway Involvement',   type: 'checkbox' },
    { key: 'circumferential', label: 'Circumferential',     type: 'checkbox' },
  ],
  physicalExam: [
    { key: 'consciousLevel', label: 'Consciousness Level', type: 'toggle', options: [{value:'alert',label:'Alert'},{value:'voice',label:'Voice'},{value:'pain',label:'Pain'},{value:'unresponsive',label:'Unresponsive'}] },
    { key: 'airwayStatus',   label: 'Airway Status',       type: 'toggle', options: [{value:'patent',label:'Patent'},{value:'partially',label:'Partially Blocked'},{value:'obstructed',label:'Obstructed'}] },
    { key: 'skinTurgor',     label: 'Skin Turgor',         type: 'toggle', options: [{value:'normal',label:'Normal'},{value:'reduced',label:'Reduced'},{value:'tenting',label:'Tenting'}] },
    { key: 'edema',          label: 'Edema Present',       type: 'checkbox' },
    { key: 'deformity',      label: 'Visible Deformity',   type: 'checkbox' },
  ],
  generalSymptoms: [
    { key: 'fever',          label: 'Fever',               type: 'checkbox' },
    { key: 'fatigue',        label: 'Fatigue / Weakness',  type: 'checkbox' },
    { key: 'dizziness',      label: 'Dizziness',           type: 'checkbox' },
    { key: 'syncope',        label: 'Syncope (Fainting)',  type: 'checkbox' },
    { key: 'confusion',      label: 'Confusion',           type: 'checkbox' },
    { key: 'painRadiation',  label: 'Pain Radiation',      type: 'checkbox' },
  ],
  additional: [
    { key: 'allergies',       label: 'Known Allergies',     type: 'text', placeholder: 'List known allergies...' },
    { key: 'medications',     label: 'Current Medications', type: 'text', placeholder: 'List current medications...' },
    { key: 'medicalHistory',  label: 'Medical History',     type: 'text', placeholder: 'Relevant medical history...' },
    { key: 'lastMeal',        label: 'Last Oral Intake',    type: 'text', placeholder: 'Time and content of last meal...' },
  ],
  responseCondition: [
    { key: 'ivAccess',        label: 'IV Access Established', type: 'checkbox' },
    { key: 'intubated',       label: 'Intubated',             type: 'checkbox' },
    { key: 'cprPerformed',    label: 'CPR Performed',         type: 'checkbox' },
    { key: 'immobilized',     label: 'Spinal Immobilization', type: 'checkbox' },
    { key: 'medicationGiven', label: 'Medication Administered', type: 'text', placeholder: 'Medications given on scene...' },
    { key: 'responseToTreatment', label: 'Response to Treatment', type: 'toggle', options: [{value:'improving',label:'Improving'},{value:'stable',label:'Stable'},{value:'deteriorating',label:'Deteriorating'},{value:'none',label:'No Response'}] },
  ],
  timeFactors: [
    { key: 'symptomOnset',     label: 'Symptom Onset',       type: 'text', placeholder: 'When did symptoms begin?' },
    { key: 'sceneArrivalTime', label: 'Scene Arrival Time',  type: 'text', placeholder: 'HH:MM' },
    { key: 'etaToHospital',    label: 'ETA to Hospital',     type: 'number', unit: 'min', min: 0, max: 120 },
    { key: 'goldenHourUsed',   label: 'Golden Hour Used %',  type: 'slider', min: 0, max: 100, step: 5, dangerThreshold: 80, warningThreshold: 50 },
  ],
};

/* ═══════════════════════════════════════════
   FIELD INPUT COMPONENTS
   ═══════════════════════════════════════════ */
function SliderField({ label, value, onChange, min = 0, max = 10, step = 1, unit = '', dangerThreshold, warningThreshold }) {
  const pct = ((value - min) / (max - min)) * 100;
  const isDanger = dangerThreshold !== undefined && dangerThreshold !== null && value >= dangerThreshold;
  const isWarning = warningThreshold !== undefined && warningThreshold !== null && value >= warningThreshold && !isDanger;

  return (
    <div className={`slider-field ${isDanger ? 'danger' : isWarning ? 'warning' : ''}`}>
      <div className="slider-header">
        <label>{label}</label>
        <span className="slider-value mono">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider-input"
        style={{ background: `linear-gradient(to right, ${isDanger ? '#DC2626' : isWarning ? '#D97706' : '#3B82F6'} ${pct}%, #E2E8F0 ${pct}%)` }}
      />
      <div className="slider-labels"><span>{min}{unit}</span><span>{max}{unit}</span></div>
    </div>
  );
}

function NumberInput({ label, value, onChange, unit = '', min, max, dangerLow, dangerHigh, warningLow, warningHigh }) {
  const numVal = parseFloat(value) || 0;
  const isDanger = (dangerLow !== undefined && numVal < dangerLow) || (dangerHigh !== undefined && numVal > dangerHigh);
  const isWarning = !isDanger && ((warningLow !== undefined && numVal < warningLow) || (warningHigh !== undefined && numVal > warningHigh));

  return (
    <div className={`number-input-field ${isDanger ? 'danger' : isWarning ? 'warning' : ''}`}>
      <label>{label}</label>
      <div className="number-input-wrap">
        <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} min={min} max={max} className="input mono" />
        {unit && <span className="number-unit">{unit}</span>}
      </div>
      {isDanger && <span className="field-alert danger-alert"><AlertTriangle size={11} /> Critical range</span>}
      {isWarning && <span className="field-alert warning-alert"><AlertCircle size={11} /> Abnormal</span>}
    </div>
  );
}

function ToggleGroup({ label, options, value, onChange }) {
  return (
    <div className="toggle-group">
      <label>{label}</label>
      <div className="toggle-buttons">
        {options.map(opt => (
          <button key={opt.value} className={`toggle-btn ${value === opt.value ? 'active' : ''}`} onClick={() => onChange(opt.value)} type="button">
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CheckboxField({ label, checked, onChange }) {
  return (
    <label className={`checkbox-field ${checked ? 'checked' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="checkbox-custom" />
      <span className="checkbox-label">{label}</span>
    </label>
  );
}

function SelectField({ label, options, value, onChange }) {
  return (
    <div className="select-field">
      <label>{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <div className="text-input-field">
      <label>{label}</label>
      <input type="text" className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   DYNAMIC FIELD RENDERER
   ═══════════════════════════════════════════ */
function DynamicField({ field, value, onChange }) {
  switch (field.type) {
    case 'slider':
      return <SliderField label={field.label} value={value ?? field.min ?? 0} onChange={onChange}
        min={field.min} max={field.max} step={field.step} unit={field.unit}
        dangerThreshold={field.dangerThreshold} warningThreshold={field.warningThreshold} />;
    case 'number':
      return <NumberInput label={field.label} value={value ?? ''} onChange={onChange}
        unit={field.unit} min={field.min} max={field.max}
        dangerLow={field.dangerLow} dangerHigh={field.dangerHigh}
        warningLow={field.warningLow} warningHigh={field.warningHigh} />;
    case 'toggle':
      return <ToggleGroup label={field.label} options={field.options} value={value ?? ''} onChange={onChange} />;
    case 'checkbox':
      return <CheckboxField label={field.label} checked={!!value} onChange={onChange} />;
    case 'select':
      return <SelectField label={field.label} options={field.options} value={value ?? ''} onChange={onChange} />;
    case 'text':
      return <TextField label={field.label} value={value} onChange={onChange} placeholder={field.placeholder} />;
    default:
      return null;
  }
}

/* ═══════════════════════════════════════════
   COLLAPSIBLE FORM SECTION
   ═══════════════════════════════════════════ */
function FormSection({ section, expanded, onToggle, completion, filledCount, totalCount, children }) {
  const Icon = section.icon;

  return (
    <div className={`form-section card ${expanded ? 'expanded' : ''}`} style={{ animationDelay: `${Math.random() * 0.15}s` }}>
      <button className="section-header" onClick={onToggle} type="button">
        <div className="section-header-left">
          <div className="section-icon"><Icon size={18} /></div>
          <div className="section-title-group">
            <h3>{section.label}</h3>
            <span className="section-field-count">{filledCount}/{totalCount} fields</span>
          </div>
          {completion === 100 && <span className="badge badge-success"><CheckCircle size={10} /> Complete</span>}
          {completion > 0 && completion < 100 && <span className="badge badge-warning">{completion}%</span>}
        </div>
        <div className={`section-chevron ${expanded ? 'rotated' : ''}`}>
          <ChevronDown size={18} />
        </div>
      </button>
      <div className={`section-content ${expanded ? 'open' : ''}`}>
        <div className="section-body">{children}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STEP INDICATOR
   ═══════════════════════════════════════════ */
function StepIndicator({ currentStep, totalSteps, stepLabels }) {
  return (
    <div className="step-indicator">
      {stepLabels.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        return (
          <div key={i} className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
            <div className="step-circle">
              {isCompleted ? <CheckCircle size={16} /> : <span>{stepNum}</span>}
            </div>
            <span className="step-label">{label}</span>
            {i < stepLabels.length - 1 && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EMT FORM COMPONENT
   ═══════════════════════════════════════════ */
export default function EMTForm() {
  const navigate = useNavigate();
  const { patientData, setPatientField, runPrediction, predictionLoading, triggerAutoSave } = useStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [emergencyType, setEmergencyType] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [localData, setLocalData] = useState({});
  const [liveScore, setLiveScore] = useState(0);
  const [liveSeverity, setLiveSeverity] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const STEP_LABELS = ['Personal Details', 'Emergency Type', 'Medical Assessment', 'Review & Submit'];

  // Calculate live severity from combined data
  useEffect(() => {
    const merged = { ...patientData, ...localData };
    const score = calculateSeverityFromVitals(merged);
    setLiveScore(score);
    setLiveSeverity(getSeverityLevel(score));
  }, [patientData, localData]);

  // Get active sections based on emergency type
  const activeSections = useMemo(() => {
    if (!emergencyType) return [];
    return (TYPE_SECTIONS_MAP[emergencyType] || []).map(key => SECTION_CONFIG[key]).filter(Boolean);
  }, [emergencyType]);

  // Toggle individual section
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // Update field value
  const updateField = useCallback((key, value) => {
    setLocalData(prev => ({ ...prev, [key]: value }));
    setPatientField(key, value);
  }, [setPatientField]);

  // Calculate section completion
  const getSectionCompletion = useCallback((sectionId) => {
    const fields = SECTION_FIELDS[sectionId] || [];
    if (fields.length === 0) return { pct: 0, filled: 0, total: 0 };
    const merged = { ...patientData, ...localData };
    let filled = 0;
    fields.forEach(f => {
      const v = merged[f.key];
      if (v !== undefined && v !== null && v !== '' && v !== false) filled++;
    });
    return { pct: Math.round((filled / fields.length) * 100), filled, total: fields.length };
  }, [patientData, localData]);

  // Overall progress
  const overallProgress = useMemo(() => {
    let stepProgress = 0;
    if (currentStep >= 2) stepProgress += 25; // Step 1 done
    if (currentStep >= 3) stepProgress += 25; // Step 2 done
    if (currentStep >= 3 && activeSections.length > 0) {
      const sectionAvg = activeSections.reduce((acc, s) => acc + getSectionCompletion(s.id).pct, 0) / activeSections.length;
      stepProgress += (sectionAvg / 100) * 25;
    }
    if (currentStep === 4) stepProgress = 100;
    return Math.round(stepProgress);
  }, [currentStep, activeSections, getSectionCompletion]);

  // Validate step before proceeding
  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      const merged = { ...patientData, ...localData };
      if (!merged.age || merged.age <= 0) errors.age = 'Age is required';
      if (!merged.gender) errors.gender = 'Gender is required';
    }
    if (step === 2) {
      if (!emergencyType) errors.emergencyType = 'Select an emergency type';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2) {
        // Auto-expand first section
        const firstSection = TYPE_SECTIONS_MAP[emergencyType]?.[0];
        if (firstSection) setExpandedSections({ [firstSection]: true });
      }
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast.error('Please complete all required fields');
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    try {
      // Sync all local data to store
      Object.entries(localData).forEach(([key, value]) => setPatientField(key, value));
      setPatientField('emergencyType', emergencyType);
      await runPrediction();
      triggerAutoSave();
      toast.success('Triage assessment completed!');
      navigate('/app/prediction');
    } catch {
      toast.error('Prediction failed. Please try again.');
    }
  };

  return (
    <div className="emt-form-page">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="page-header">
        <div>
          <h2>EMT Triage Form</h2>
          <p className="page-subtitle">Complete patient assessment for severity prediction</p>
        </div>
        <div className="form-actions-top">
          <div className="live-severity-badge" style={{ borderColor: liveSeverity?.color || '#E2E8F0', color: liveSeverity?.color }}>
            <Activity size={14} />
            <span className="mono">{liveScore}</span>
            <span>{liveSeverity?.label || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* ═══════════════ STEP INDICATOR ═══════════════ */}
      <StepIndicator currentStep={currentStep} totalSteps={4} stepLabels={STEP_LABELS} />

      {/* ═══════════════ PROGRESS BAR ═══════════════ */}
      <div className="form-progress">
        <div className="form-progress-header">
          <span>Overall Progress</span>
          <span className="mono">{overallProgress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
        </div>
      </div>

      {/* ═══════════════ STEP CONTENT ═══════════════ */}
      <div className="step-content">

        {/* ─── STEP 1: PERSONAL DETAILS ─── */}
        {currentStep === 1 && (
          <div className="step-panel animate-fade-in">
            <div className="step-panel-header">
              <div className="step-panel-icon"><User size={22} /></div>
              <div>
                <h3>Personal Details & Location</h3>
                <p>Patient demographics and incident location</p>
              </div>
            </div>
            <div className="step-panel-body">
              <div className="form-grid cols-2">
                <div className={`number-input-field ${validationErrors.age ? 'error' : ''}`}>
                  <label>Age <span className="required">*</span></label>
                  <div className="number-input-wrap">
                    <input type="number" value={patientData.age || localData.age || ''} onChange={(e) => updateField('age', parseFloat(e.target.value) || '')} min={0} max={120} className="input mono" placeholder="Enter age" />
                    <span className="number-unit">yrs</span>
                  </div>
                  {validationErrors.age && <span className="field-alert danger-alert"><AlertTriangle size={11} /> {validationErrors.age}</span>}
                </div>

                <div className={`toggle-group ${validationErrors.gender ? 'error' : ''}`}>
                  <label>Gender <span className="required">*</span></label>
                  <div className="toggle-buttons">
                    {[{value:'male',label:'Male',icon:'♂'},{value:'female',label:'Female',icon:'♀'},{value:'other',label:'Other',icon:'⚧'}].map(opt => (
                      <button key={opt.value} type="button"
                        className={`toggle-btn gender-btn ${(patientData.gender || localData.gender) === opt.value ? 'active' : ''}`}
                        onClick={() => updateField('gender', opt.value)}>
                        <span className="gender-icon">{opt.icon}</span> {opt.label}
                      </button>
                    ))}
                  </div>
                  {validationErrors.gender && <span className="field-alert danger-alert"><AlertTriangle size={11} /> {validationErrors.gender}</span>}
                </div>
              </div>

              {(patientData.gender === 'female' || localData.gender === 'female') && (
                <div className="form-grid cols-1 pregnancy-section animate-fade-in" style={{ marginTop: 16 }}>
                  <CheckboxField label="Patient is Pregnant" checked={patientData.pregnancy || localData.pregnancy || false} onChange={(v) => updateField('pregnancy', v)} />
                </div>
              )}

              <div className="form-grid cols-1" style={{ marginTop: 16 }}>
                <div className="text-input-field">
                  <label>Chief Complaint</label>
                  <textarea className="input" rows={3} value={patientData.chiefComplaint || localData.chiefComplaint || ''}
                    onChange={(e) => updateField('chiefComplaint', e.target.value)}
                    placeholder="Describe the primary complaint or reason for emergency..." />
                </div>
              </div>

              <div className="form-grid cols-1" style={{ marginTop: 24, marginBottom: 8 }}>
                <div className="text-input-field">
                  <label>Incident Location <span className="required">*</span></label>
                  <IncidentMapPicker 
                    value={localData.location || patientData.location} 
                    onChange={(loc) => updateField('location', loc)} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 2: EMERGENCY TYPE SELECTION ─── */}
        {currentStep === 2 && (
          <div className="step-panel animate-fade-in">
            <div className="step-panel-header">
              <div className="step-panel-icon" style={{ background: 'linear-gradient(135deg, #DC2626, #E11D48)' }}><Siren size={22} /></div>
              <div>
                <h3>Emergency Type</h3>
                <p>Select the primary type of emergency</p>
              </div>
            </div>
            {validationErrors.emergencyType && (
              <div className="validation-banner"><AlertTriangle size={14} /> {validationErrors.emergencyType}</div>
            )}
            <div className="emergency-type-grid">
              {EMERGENCY_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = emergencyType === type.id;
                return (
                  <button key={type.id} type="button"
                    className={`emergency-type-card ${isSelected ? 'selected' : ''}`}
                    style={{ '--type-color': type.color, '--type-bg': type.bg }}
                    onClick={() => setEmergencyType(type.id)}>
                    <div className="type-card-icon" style={{ background: type.bg, color: type.color }}>
                      <Icon size={24} />
                    </div>
                    <div className="type-card-content">
                      <h4>{type.label}</h4>
                      <p>{type.desc}</p>
                    </div>
                    {isSelected && <div className="type-card-check"><CheckCircle size={20} /></div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── STEP 3: DYNAMIC MEDICAL ASSESSMENT ─── */}
        {currentStep === 3 && (
          <div className="step-panel animate-fade-in">
            <div className="step-panel-header">
              <div className="step-panel-icon" style={{ background: `linear-gradient(135deg, ${EMERGENCY_TYPES.find(t => t.id === emergencyType)?.color || '#3B82F6'}, ${EMERGENCY_TYPES.find(t => t.id === emergencyType)?.color || '#3B82F6'}dd)` }}>
                {(() => { const T = EMERGENCY_TYPES.find(t => t.id === emergencyType); return T ? <T.icon size={22} /> : <Stethoscope size={22} />; })()}
              </div>
              <div>
                <h3>Medical Assessment — {EMERGENCY_TYPES.find(t => t.id === emergencyType)?.label}</h3>
                <p>Complete the relevant clinical sections below</p>
              </div>
            </div>

            {/* Section Pills */}
            <div className="section-badges" style={{ margin: '0 0 16px' }}>
              {activeSections.map(s => {
                const { pct } = getSectionCompletion(s.id);
                return (
                  <button key={s.id} type="button"
                    className={`section-badge clickable ${pct === 100 ? 'complete' : pct > 0 ? 'partial' : ''} ${expandedSections[s.id] ? 'active-badge' : ''}`}
                    onClick={() => toggleSection(s.id)}>
                    {pct === 100 && <CheckCircle size={10} />}
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Sections */}
            <div className="form-sections">
              {activeSections.map(section => {
                const fields = SECTION_FIELDS[section.id] || [];
                const { pct, filled, total } = getSectionCompletion(section.id);
                const merged = { ...patientData, ...localData };

                return (
                  <FormSection key={section.id} section={section}
                    expanded={!!expandedSections[section.id]}
                    onToggle={() => toggleSection(section.id)}
                    completion={pct} filledCount={filled} totalCount={total}>
                    <div className={`form-grid ${fields.length <= 3 ? 'cols-1' : fields.some(f => f.type === 'text') ? 'cols-1' : 'cols-2'}`}>
                      {fields.map(field => (
                        <DynamicField key={field.key} field={field} value={merged[field.key]} onChange={(v) => updateField(field.key, v)} />
                      ))}
                    </div>
                  </FormSection>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── STEP 4: REVIEW & SUBMIT ─── */}
        {currentStep === 4 && (
          <div className="step-panel animate-fade-in">
            <div className="step-panel-header">
              <div className="step-panel-icon" style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}><ClipboardCheck size={22} /></div>
              <div>
                <h3>Review & Submit</h3>
                <p>Verify assessment data and run triage prediction</p>
              </div>
            </div>

            <div className="review-grid">
              {/* Patient Summary */}
              <div className="review-card">
                <h4><User size={16} /> Patient Summary</h4>
                <div className="review-items">
                  <div className="review-item"><span>Age</span><strong>{patientData.age || localData.age || 'N/A'} yrs</strong></div>
                  <div className="review-item"><span>Gender</span><strong style={{ textTransform: 'capitalize' }}>{patientData.gender || localData.gender || 'N/A'}</strong></div>
                  {(patientData.pregnancy || localData.pregnancy) && <div className="review-item"><span>Pregnancy</span><strong>Yes</strong></div>}
                  <div className="review-item"><span>Complaint</span><strong>{patientData.chiefComplaint || localData.chiefComplaint || 'N/A'}</strong></div>
                </div>
              </div>

              {/* Emergency Type */}
              <div className="review-card" style={{ borderLeftColor: EMERGENCY_TYPES.find(t => t.id === emergencyType)?.color }}>
                <h4><Siren size={16} /> Emergency Type</h4>
                <div className="review-type-badge" style={{ background: EMERGENCY_TYPES.find(t => t.id === emergencyType)?.bg, color: EMERGENCY_TYPES.find(t => t.id === emergencyType)?.color }}>
                  {(() => { const T = EMERGENCY_TYPES.find(t => t.id === emergencyType); return T ? <><T.icon size={18} /> {T.label}</> : 'N/A'; })()}
                </div>
              </div>

              {/* Live Severity */}
              <div className="review-card severity-review-card" style={{ borderLeftColor: liveSeverity?.color }}>
                <h4><Activity size={16} /> Live Severity Estimate</h4>
                <div className="severity-display">
                  <div className="severity-score-large mono" style={{ color: liveSeverity?.color }}>{liveScore}</div>
                  <div className="severity-label-large" style={{ color: liveSeverity?.color }}>{liveSeverity?.label || 'Calculating...'}</div>
                </div>
              </div>

              {/* Section Completion */}
              <div className="review-card full-width">
                <h4><Shield size={16} /> Assessment Completion</h4>
                <div className="review-sections-grid">
                  {activeSections.map(s => {
                    const { pct, filled, total } = getSectionCompletion(s.id);
                    const Icon = s.icon;
                    return (
                      <div key={s.id} className={`review-section-item ${pct === 100 ? 'complete' : ''}`}>
                        <Icon size={14} />
                        <span>{s.label}</span>
                        <div className="review-mini-bar"><div style={{ width: `${pct}%` }} /></div>
                        <span className="mono">{filled}/{total}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════ NAVIGATION BUTTONS ═══════════════ */}
      <div className="form-navigation">
        {currentStep > 1 && (
          <button className="btn btn-outline" onClick={prevStep} type="button">
            <ArrowLeft size={16} /> Back
          </button>
        )}
        <div className="nav-spacer" />
        <button className="btn btn-outline" onClick={() => { triggerAutoSave(); toast.success('Draft saved'); }} type="button">
          <Save size={16} /> Save Draft
        </button>
        {currentStep < 4 ? (
          <button className="btn btn-primary btn-lg" onClick={nextStep} type="button">
            Continue <ArrowRight size={16} />
          </button>
        ) : (
          <button className="btn btn-primary btn-lg submit-pulse" onClick={handleSubmit} disabled={predictionLoading} type="button">
            {predictionLoading ? (
              <><span className="btn-spinner" /> Running Prediction...</>
            ) : (
              <><Sparkles size={18} /> Run Triage Prediction <ArrowRight size={16} /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

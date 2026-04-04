import { create } from 'zustand';
import { predictPatient, routePatient, notifyHospital } from '../services/api';
import { buildFeatures } from '../utils/featureBuilder';

const defaultPatientData = {
  // Patient Info
  age: '',
  gender: '',
  pregnancy: false,
  chiefComplaint: '',
  
  // ABCDE
  airway: 5,
  breathing: 5,
  circulation: 5,
  gcs: 15,
  exposureHypothermia: false,
  exposureBurns: false,
  exposureRash: false,
  
  // Vitals
  pain: 3,
  heartRate: 80,
  spo2: 98,
  respiratoryRate: 16,
  systolicBP: 120,
  diastolicBP: 80,
  temperature: 37.0,
  glucose: 100,
  
  // Assessment
  bleeding: 'none',
  skinCondition: 'normal',
  capillaryRefill: 'normal',
  
  // Neurological
  pupilReaction: 'normal',
  motorResponse: 'normal',
  sensoryDeficit: false,
  seizureActivity: false,
  
  // Cardiac
  chestPain: false,
  chestPainType: '',
  irregularRhythm: false,
  peripheralEdema: false,
  
  // Respiratory
  dyspnea: false,
  wheezing: false,
  cyanosis: false,
  oxygenTherapy: false,
  
  // GI
  abdominalPain: false,
  nausea: false,
  vomiting: false,
  diarrhea: false,
  
  // Trauma
  traumaMechanism: '',
  headInjury: false,
  spinalInjury: false,
  fracture: false,
  laceration: false,
  burnInjury: false,
};

const demoRecentCases = [
  { id: 'PT-2741', severity: 'RED', status: 'In Transit', hospital: 'City General', time: '2 min ago', age: 67, complaint: 'Chest pain, dyspnea' },
  { id: 'PT-2740', severity: 'YELLOW', status: 'Triaged', hospital: 'St. Mary\'s', time: '8 min ago', age: 34, complaint: 'Ankle fracture' },
  { id: 'PT-2739', severity: 'ORANGE', status: 'En Route', hospital: 'Apollo EC', time: '14 min ago', age: 52, complaint: 'Severe bleeding' },
  { id: 'PT-2738', severity: 'GREEN', status: 'Discharged', hospital: 'Metro District', time: '22 min ago', age: 28, complaint: 'Minor laceration' },
  { id: 'PT-2737', severity: 'RED', status: 'In ICU', hospital: 'NIEM', time: '35 min ago', age: 71, complaint: 'Stroke symptoms' },
  { id: 'PT-2736', severity: 'YELLOW', status: 'Treated', hospital: 'City General', time: '45 min ago', age: 19, complaint: 'Allergic reaction' },
];

const demoAlerts = [
  { id: 1, type: 'critical', message: 'Critical patient incoming — cardiac arrest suspected', time: '1 min ago', icon: '🔴' },
  { id: 2, type: 'warning', message: 'Metro District Hospital at 88% capacity', time: '5 min ago', icon: '🟠' },
  { id: 3, type: 'info', message: 'New EMT unit dispatched to Sector 7', time: '12 min ago', icon: '🔵' },
  { id: 4, type: 'critical', message: 'Mass casualty alert — multi-vehicle collision reported', time: '18 min ago', icon: '🔴' },
  { id: 5, type: 'success', message: 'Patient PT-2738 successfully discharged', time: '22 min ago', icon: '🟢' },
];

const useStore = create((set, get) => ({
  // Navigation
  currentPage: 'dashboard',
  sidebarCollapsed: false,
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Patient Data
  patientData: { ...defaultPatientData },
  setPatientField: (field, value) => set((s) => ({
    patientData: { ...s.patientData, [field]: value },
    lastSaved: null,
  })),
  resetPatientData: () => set({ patientData: { ...defaultPatientData }, prediction: null, routing: null, booking: null }),

  // Form Sections
  expandedSections: { abcde: true, patientInfo: true, vitals: false, assessment: false, neurological: false, cardiac: false, respiratory: false, gi: false, trauma: false },
  toggleSection: (section) => set((s) => ({
    expandedSections: { ...s.expandedSections, [section]: !s.expandedSections[section] }
  })),

  // Auto-save
  lastSaved: null,
  autoSaveEnabled: true,
  triggerAutoSave: () => set({ lastSaved: new Date().toISOString() }),

  // Prediction
  prediction: null,
  predictionLoading: false,
  runPrediction: async () => {
    set({ predictionLoading: true });
    try {
      const pData = get().patientData;
      // map pData to match formData keys used by featureBuilder
      const formData = {
         pain: pData.pain,
         spo2: pData.spo2,
         bp: pData.systolicBP,
         heartRate: pData.heartRate,
         consciousness: pData.gcs,
         bleeding: pData.bleeding === 'none' ? 0 : 5,
         injury: pData.traumaMechanism ? 5 : 0,
         overall: 5
      };
      const features = buildFeatures(formData);
      const mlResult = await predictPatient(features);
      
      const COLOR_DETAILS = {
        GREEN:  { level: 0, label: 'GREEN',  name: 'Minor',             color: '#059669' },
        YELLOW: { level: 1, label: 'YELLOW', name: 'Delayed',            color: '#EAB308' },
        ORANGE: { level: 2, label: 'ORANGE', name: 'Urgent',             color: '#D97706' },
        RED:    { level: 3, label: 'RED',    name: 'Immediate',          color: '#DC2626' },
        BLACK:  { level: 4, label: 'BLACK',  name: 'Deceased/Expectant', color: '#1F2937' }
      };
      
      const PRIORITY_TO_COLOR = {
        LOW:      'GREEN',
        MODERATE: 'YELLOW',
        HIGH:     'ORANGE',
        EMERGENCY:'RED',
        CRITICAL: 'BLACK'
      };
      
      const colorKey = PRIORITY_TO_COLOR[mlResult.priority] || 'ORANGE';
      const severity = COLOR_DETAILS[colorKey];
      
      const adaptedResult = {
        severityScore: severity.level * 25,
        severity: severity,
        icuNeeded: mlResult.needs_icu,
        ventilatorNeeded: mlResult.needs_ventilator,
        featureImportance: [],
        timestamp: new Date().toISOString()
      };
      
      set({ prediction: adaptedResult, predictionLoading: false });
      return adaptedResult;
    } catch (error) {
      set({ predictionLoading: false });
      throw error;
    }
  },

  // Routing
  routing: null,
  routingLoading: false,
  runRouting: async () => {
    set({ routingLoading: true });
    try {
      let prediction = get().prediction;
      if (!prediction) {
        prediction = await get().runPrediction();
      }
      const result = await routePatient(prediction);
      set({ routing: result, routingLoading: false });
      return result;
    } catch (error) {
      set({ routingLoading: false });
      throw error;
    }
  },

  // Booking
  booking: null,
  bookingLoading: false,
  confirmBooking: async (hospital) => {
    set({ bookingLoading: true });
    try {
      const result = await notifyHospital(hospital.id, get().patientData, {
        hospitalName: hospital.name,
        eta: hospital.eta,
      });
      set({
        booking: { ...result, hospital },
        bookingLoading: false,
      });
      return result;
    } catch (error) {
      set({ bookingLoading: false });
      throw error;
    }
  },

  // Dashboard data
  recentCases: demoRecentCases,
  alerts: demoAlerts,
  stats: {
    totalPatients: 2741,
    criticalCases: 23,
    availableHospitals: 4,
    avgResponseTime: 8.4,
    activeMCIs: 1,
    emtUnits: 12,
  },

  // Mass Casualty
  massCasualtyMode: false,
  massCasualtyPatients: [],
  toggleMassCasualty: () => set((s) => ({ massCasualtyMode: !s.massCasualtyMode })),
  addMassCasualtyPatient: (patient) => set((s) => ({
    massCasualtyPatients: [...s.massCasualtyPatients, { ...patient, id: 'MCI-' + (s.massCasualtyPatients.length + 1) }]
  })),

  // Notifications
  notifications: [],
  addNotification: (notification) => set((s) => ({
    notifications: [{ id: Date.now(), timestamp: new Date().toISOString(), ...notification }, ...s.notifications]
  })),

  // Settings
  settings: {
    darkMode: false,
    autoPredict: true,
    soundAlerts: true,
    apiEndpoint: 'https://api.goldenhour.health/v2',
    firebaseConnected: false,
  },
  updateSetting: (key, value) => set((s) => ({
    settings: { ...s.settings, [key]: value }
  })),
}));

export default useStore;

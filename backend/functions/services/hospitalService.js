/**
 * Hospital Service — queries and manages hospital data in Firestore.
 */
const admin = require("firebase-admin");

const DEFAULT_HOSPITALS = [
  {
    id: "h1",
    name: "City General Hospital",
    distance: 2.3,
    load: 45,
    icuAvailable: 5,
    icuTotal: 12,
    ventilatorAvailable: 3,
    ventilatorTotal: 8,
    specialties: ["Cardiology", "Neurology", "Trauma"],
    rating: 4.5,
    lat: 18.5275,
    lng: 73.857,
    address: "123 Medical Center Drive",
    eta: 8,
    hasHelipad: true,
    traumaLevel: 1,
  },
  {
    id: "h2",
    name: "St. Mary's Medical Center",
    distance: 4.1,
    load: 72,
    icuAvailable: 2,
    icuTotal: 8,
    ventilatorAvailable: 1,
    ventilatorTotal: 6,
    specialties: ["Orthopedics", "General Surgery"],
    rating: 4.2,
    lat: 18.535,
    lng: 73.865,
    address: "456 Healthcare Blvd",
    eta: 14,
    hasHelipad: false,
    traumaLevel: 2,
  },
  {
    id: "h3",
    name: "Apollo Emergency Care",
    distance: 5.8,
    load: 35,
    icuAvailable: 8,
    icuTotal: 15,
    ventilatorAvailable: 6,
    ventilatorTotal: 10,
    specialties: ["Cardiology", "Neurology", "Pulmonology", "Trauma"],
    rating: 4.8,
    lat: 18.54,
    lng: 73.85,
    address: "789 Emergency Lane",
    eta: 18,
    hasHelipad: true,
    traumaLevel: 1,
  },
  {
    id: "h4",
    name: "Metro District Hospital",
    distance: 3.5,
    load: 88,
    icuAvailable: 0,
    icuTotal: 6,
    ventilatorAvailable: 0,
    ventilatorTotal: 4,
    specialties: ["General Medicine"],
    rating: 3.8,
    lat: 18.52,
    lng: 73.87,
    address: "321 District Road",
    eta: 12,
    hasHelipad: false,
    traumaLevel: 3,
  },
  {
    id: "h5",
    name: "National Institute of Emergency Medicine",
    distance: 7.2,
    load: 52,
    icuAvailable: 10,
    icuTotal: 20,
    ventilatorAvailable: 8,
    ventilatorTotal: 15,
    specialties: ["Cardiology", "Neurology", "Trauma", "Burns", "Pediatrics"],
    rating: 4.9,
    lat: 18.55,
    lng: 73.84,
    address: "100 National Medical Complex",
    eta: 22,
    hasHelipad: true,
    traumaLevel: 1,
  },
];

/**
 * Fetch hospitals from Firestore. If the collection is empty,
 * return the default demo hospitals instead.
 */
async function getHospitals() {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection("hospitals").get();

    if (snapshot.empty) {
      return DEFAULT_HOSPITALS;
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.warn("Firestore unavailable, using default hospitals:", error.message);
    return DEFAULT_HOSPITALS;
  }
}

/**
 * Seed the hospitals collection with default data.
 */
async function seedHospitals() {
  try {
    const db = admin.firestore();
    const batch = db.batch();

    for (const hospital of DEFAULT_HOSPITALS) {
      const ref = db.collection("hospitals").doc(hospital.id);
      batch.set(ref, { ...hospital, updatedAt: new Date().toISOString() });
    }

    await batch.commit();
    return { success: true, count: DEFAULT_HOSPITALS.length };
  } catch (error) {
    console.error("Error seeding hospitals:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { getHospitals, seedHospitals, DEFAULT_HOSPITALS };

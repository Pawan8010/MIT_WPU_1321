export const buildFeatures = (formData) => {
    return [
        Number(formData.pain),
        Number(formData.spo2),
        Number(formData.bp),
        Number(formData.heartRate),
        Number(formData.consciousness),
        Number(formData.bleeding),
        Number(formData.injury),
        Number(formData.overall)
    ];
};

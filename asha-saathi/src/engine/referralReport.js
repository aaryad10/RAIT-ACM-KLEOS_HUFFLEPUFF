/**
 * Generates an NHM-format PHC referral report from a patient record.
 * Pure data transform — no rendering here, just structures the content.
 */
export function generateReferralReport(patient) {
  const dateStr = new Date(patient.timestamp).toLocaleDateString("en-IN");
  const timeStr = new Date(patient.timestamp).toLocaleTimeString("en-IN");

  return {
    reportTitle: "PHC REFERRAL NOTE",
    formatNote: "NHM-format community-level referral record",
    patientSummary: `${patient.meta?.sex || "Patient"}${patient.meta?.age ? ", " + patient.meta.age : ""}`,
    dateOfAssessment: dateStr,
    timeOfAssessment: timeStr,
    classification: patient.tier,
    classificationLabel: patient.label,
    referralTimeframe: patient.referralTimeframe,
    observedDangerSigns: patient.citedSigns.map((s) => s.label),
    protocolBasis: "WHO IMNCI Danger Sign Protocol / MoHFW ASHA Training Module",
    disclaimer:
      "This record reflects observed danger signs only. No medical diagnosis or medication is implied. Assessment performed by ASHA/ANM frontline worker within scope of practice.",
  };
}
/**
 * Generates an NHM-format PHC referral report from a patient record.
 * Pure data transform — no rendering here, just structures the content.
 *
 * Now accepts unmatchedNote: symptoms the ASHA worker observed that didn't
 * match the IMNCI checklist. These are passed through to the doctor as
 * "Additional Observations" — strictly informational, no triage weight.
 */
export function generateReferralReport(patient) {
  const dateStr = new Date(patient.timestamp).toLocaleDateString("en-IN");
  const timeStr = new Date(patient.timestamp).toLocaleTimeString("en-IN");

  return {
    reportTitle: "PHC REFERRAL NOTE",
    formatNote: "NHM-format community-level referral record",
    patientSummary: [
      patient.meta?.name,
      patient.meta?.sex,
      patient.meta?.age,
    ].filter(Boolean).join(" · ") || "Patient",
    dateOfAssessment: dateStr,
    timeOfAssessment: timeStr,
    classification: patient.tier,
    classificationLabel: patient.label,
    referralTimeframe: patient.referralTimeframe,
    observedDangerSigns: patient.citedSigns.map((s) => s.label),
    // Symptoms noted by the worker that don't map to IMNCI danger signs.
    // Included for the doctor's awareness — NOT used for triage classification.
    additionalObservations: patient.meta?.unmatchedNote || null,
    protocolBasis: "WHO IMNCI Danger Sign Protocol / MoHFW ASHA Training Module",
    disclaimer:
      "This record reflects observed danger signs only. No medical diagnosis or medication is implied. Assessment performed by ASHA/ANM frontline worker within scope of practice.",
  };
}
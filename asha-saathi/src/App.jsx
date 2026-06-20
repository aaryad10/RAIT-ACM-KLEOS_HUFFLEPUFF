/**
 * App.jsx — Root component
 *
 * Added: language selection screen on first load.
 * Once the worker selects a language, it's stored in state and passed
 * down to every screen via props. No global state library needed.
 */
import { useState } from "react";
import LanguageSelect     from "./components/LanguageSelect";
import HomeScreen         from "./components/HomeScreen";
import PatientInfoScreen  from "./components/PatientInfoScreen";
import ChecklistScreen    from "./components/ChecklistScreen";
import CaptureGuide       from "./components/CaptureGuide";
import ResultScreen       from "./components/ResultScreen";
import FamilyScreen       from "./components/FamilyScreen";
import QueueScreen        from "./components/QueueScreen";
import ReferralReport     from "./components/ReferralReport";
import { runTriage }      from "./engine/triageEngine";
import { createPatientRecord } from "./engine/priorityQueue";
import { generateReferralReport } from "./engine/referralReport";
import ReferralRouter     from "./components/ReferralRouter";
import { getLang }        from "./engine/languageConfig";
import { getJaundiceSign, combineWithJaundiceSignal } from "./engine/jaundiceSignal";
import jaundiceModelData  from "./assets/jaundice_model.json";

export default function App() {
  // ── Language ─────────────────────────────────────────────────────────────────
  const [langKey, setLangKey] = useState(null); // null = language not yet chosen

  // ── Navigation ───────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState("home");
  // screens: home | patient-info | checklist | eye-screening | result | family | queue | report

  // ── Patient data ─────────────────────────────────────────────────────────────
  const [patientMeta, setPatientMeta] = useState({ name: "", age: "", sex: "" });
  const [imnciResult, setImnciResult] = useState(null); // raw IMNCI checklist result, held until eye screening completes
  const [triageResult, setTriageResult] = useState(null); // final combined result shown on ResultScreen
  const [queue, setQueue] = useState([]);
  const [reportPatient, setReportPatient] = useState(null);

  // Jaundice model is a static ~1.3KB JSON asset, trained offline — loading it
  // is synchronous, no network call, works fully offline.
  const jaundiceModel = jaundiceModelData;

  // ── Derived stats for HomeScreen ─────────────────────────────────────────────
  const redCount      = queue.filter((p) => p.tier === "RED").length;
  const yellowCount   = queue.filter((p) => p.tier === "YELLOW").length;
  const greenCount    = queue.filter((p) => p.tier === "GREEN").length;
  const referredCount = queue.filter((p) => p.referred).length;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleNewAssessment() {
    setPatientMeta({ name: "", age: "", sex: "" });
    setImnciResult(null);
    setTriageResult(null);
    setScreen("patient-info");
  }

  function handleChecklistSubmit(selectedSignIds, unmatchedNote) {
    const result = runTriage(selectedSignIds);
    if (unmatchedNote) setPatientMeta((prev) => ({ ...prev, unmatchedNote }));
    // Eye screening is an OPTIONAL additional step — worker can skip it
    // (CaptureGuide's onSkip) and the IMNCI result is used as-is.
    setImnciResult(result);
    setScreen("eye-screening");
  }

  function handleEyeCapture(captureResult) {
    const jaundiceResult = getJaundiceSign(jaundiceModel, captureResult, langKey);
    const combined = combineWithJaundiceSignal(imnciResult, jaundiceResult);
    setTriageResult(combined);
    setScreen("result");
  }

  function handleAddToQueue() {
    const record = createPatientRecord(triageResult, patientMeta);
    setQueue((prev) => [...prev, record]);
    setScreen("referral-router");
  }

  function handleToggleRepeatVisit(patientId) {
    setQueue((prev) =>
      prev.map((p) => p.id === patientId
        ? { ...p, meta: { ...p.meta, isRepeatVisit: !p.meta?.isRepeatVisit } }
        : p
      )
    );
  }

  function handleMarkReferred(patientId) {
    setQueue((prev) =>
      prev.map((p) => p.id === patientId ? { ...p, referred: true } : p)
    );
  }

  function handleViewReport(patient) {
    setReportPatient(patient);
    setScreen("report");
  }

  // ── Language not selected yet → show picker ──────────────────────────────────
  if (!langKey) {
    return <LanguageSelect onSelect={(key) => { setLangKey(key); setScreen("home"); }} />;
  }

  const ui = getLang(langKey).ui;

  // ── Screen router ─────────────────────────────────────────────────────────────
  if (screen === "home") {
    return (
      <HomeScreen
        langKey={langKey}
        onNewAssessment={handleNewAssessment}
        onViewQueue={() => setScreen("queue")}
        queueCount={queue.filter((p) => !p.referred).length}
        redCount={redCount}
        yellowCount={yellowCount}
        greenCount={greenCount}
        referredCount={referredCount}
      />
    );
  }

  if (screen === "patient-info") {
    return (
      <PatientInfoScreen
        langKey={langKey}
        patientMeta={patientMeta}
        setPatientMeta={setPatientMeta}
        onBack={() => setScreen("home")}
        onStartVoice={() => setScreen("checklist")}
        onSkipToChecklist={() => setScreen("checklist")}
      />
    );
  }

  if (screen === "checklist") {
    return (
      <ChecklistScreen
        langKey={langKey}
        onBack={() => setScreen("patient-info")}
        onSubmit={handleChecklistSubmit}
        showVoice={true}
      />
    );
  }

  if (screen === "eye-screening") {
    return (
      <CaptureGuide
        langKey={langKey}
        onCapture={handleEyeCapture}
        onBack={() => setScreen("checklist")}
        onSkip={() => { setTriageResult(imnciResult); setScreen("result"); }}
      />
    );
  }

  if (screen === "result") {
    return (
      <ResultScreen
        langKey={langKey}
        result={triageResult}
        patientMeta={patientMeta}
        onAddToQueue={handleAddToQueue}
        onBack={() => setScreen("checklist")}
      />
    );
  }

  if (screen === "family") {
    return (
      <FamilyScreen
        langKey={langKey}
        result={triageResult}
        patientMeta={patientMeta}
        onContinue={() => setScreen("queue")}
        onBack={() => setScreen("result")}
      />
    );
  }

  if (screen === "queue") {
    return (
      <QueueScreen
        langKey={langKey}
        queue={queue}
        onBack={() => setScreen("home")}
        onViewReport={handleViewReport}
        onAddNext={handleNewAssessment}
        onMarkReferred={handleMarkReferred}
        onToggleRepeatVisit={handleToggleRepeatVisit}
      />
    );
  }

  if (screen === "referral-router") {
    return (
      <ReferralRouter
        tier={triageResult?.tier}
        patientMeta={patientMeta}
        onBack={() => setScreen("result")}
        onConfirm={(facility) => {
          const record = createPatientRecord(triageResult, { ...patientMeta, recommendedFacility: facility.name });
          setQueue((prev) => [...prev, record]);
          setScreen("family");
        }}
      />
    );
  }

  if (screen === "report") {
    return (
      <ReferralReport
        langKey={langKey}
        report={generateReferralReport(reportPatient)}
        patientMeta={reportPatient?.meta}
        onBack={() => setScreen("queue")}
      />
    );
  }

  return null;
}
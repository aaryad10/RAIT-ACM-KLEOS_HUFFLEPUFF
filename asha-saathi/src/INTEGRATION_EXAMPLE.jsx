/**
 * INTEGRATION_EXAMPLE.jsx
 * NOT a component to import — this is a reference showing exactly how to wire
 * the eye-screening pathway into your existing app flow at the App.jsx level
 * (the file that currently calls runTriage() and owns the screen-routing state,
 * based on the onSubmit(selected, unmatchedNote) contract in ChecklistScreen.jsx
 * and the view-switching pattern visible in TriageScreen.jsx / QueueScreen.jsx).
 *
 * Copy the relevant pieces into your actual App.jsx — adjust to match your real
 * state/view names, this is illustrative of the WIRING, not a drop-in replacement.
 */
import { useState, useEffect } from "react";
import { runTriage } from "./engine/triageEngine";
import { getJaundiceSign, combineWithJaundiceSignal } from "./engine/jaundiceSignal";
import jaundiceModelData from "./assets/jaundice_model.json";
import ChecklistScreen from "./components/ChecklistScreen";
import CaptureGuide from "./components/CaptureGuide";
import ResultScreen from "./components/ResultScreen";

export default function AppIntegrationExample() {
  const [langKey] = useState("hi");
  const [view, setView] = useState("checklist"); // checklist -> eyeScreen -> result
  const [imnciResult, setImnciResult] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [patientMeta, setPatientMeta] = useState({});

  // Model is a static ~1.3KB JSON asset, trained once offline (see
  // src/engine/scleraSynth.js + generate-model script) — NOT retrained at
  // runtime. Loading it is synchronous, no network call, works fully offline.
  const jaundiceModel = jaundiceModelData;

  // ---- Step 1: worker completes the IMNCI checklist, same as today ----
  function handleChecklistSubmit(selectedSignIds, unmatchedNote) {
    const result = runTriage(selectedSignIds);
    setImnciResult({ ...result, unmatchedNote });
    // Eye screening is offered as an ADDITIONAL optional step, not a blocker —
    // worker can skip it (CaptureGuide's onSkip) and the flow still completes
    // using the IMNCI result alone, same as the app behaves today.
    setView("eyeScreen");
  }

  // ---- Step 2: optional eye screening ----
  function handleEyeCapture(captureResult) {
    const jaundiceResult = getJaundiceSign(jaundiceModel, captureResult, langKey);
    const combined = combineWithJaundiceSignal(imnciResult, jaundiceResult);
    setFinalResult(combined);
    setView("result");
  }

  function handleSkipEyeScreen() {
    // No eye data — pass IMNCI result through unchanged (combineWithJaundiceSignal
    // handles a null/failed jaundiceResult gracefully too, but skipping outright
    // is cleaner when the worker explicitly declines rather than attempted-and-failed)
    setFinalResult(imnciResult);
    setView("result");
  }

  if (view === "checklist") {
    return (
      <ChecklistScreen
        langKey={langKey}
        onSubmit={handleChecklistSubmit}
        onBack={() => {}}
      />
    );
  }

  if (view === "eyeScreen") {
    return (
      <CaptureGuide
        langKey={langKey}
        onCapture={handleEyeCapture}
        onSkip={handleSkipEyeScreen}
        onBack={() => setView("checklist")}
      />
    );
  }

  if (view === "result") {
    return (
      <ResultScreen
        langKey={langKey}
        result={finalResult}
        patientMeta={patientMeta}
        onAddToQueue={() => {/* existing createPatientRecord(finalResult, patientMeta) flow */}}
        onBack={() => setView("checklist")}
      />
    );
  }

  return null;
}

/**
 * NOTES FOR WIRING INTO YOUR REAL App.jsx:
 *
 * 1. Find wherever runTriage(selectedSigns) is currently called (likely in
 *    App.jsx's handleSubmit, based on TriageScreen.jsx's local version of this
 *    pattern). Insert the eyeScreen view BETWEEN checklist submission and
 *    showing ResultScreen.
 *
 * 2. ResultScreen.jsx, FamilyScreen.jsx, ReferralReport.jsx, priorityQueue.js
 *    all need ZERO changes — combineWithJaundiceSignal() returns an object
 *    shaped exactly like runTriage()'s output ({tier, label, citedSigns,
 *    referralTimeframe}), just with one extra `eyeScreening` field they can
 *    ignore. This was a deliberate design constraint while building
 *    jaundiceSignal.js, verified against ResultScreen.jsx's actual field usage.
 *
 * 3. If you want eye screening to be MANDATORY rather than optional, remove
 *    the onSkip path — but optional is recommended: the PS's own constraint
 *    says the tool "must not suggest diagnoses," and framing the eye signal
 *    as one optional input among several (alongside the IMNCI checklist)
 *    keeps it positioned as supporting context, not a required diagnostic step.
 *
 * 4. createPatientRecord() (priorityQueue.js) already accepts any triageResult
 *    shape with {tier, label, referralTimeframe, citedSigns} — finalResult
 *    passes through unchanged, no changes needed there either.
 */
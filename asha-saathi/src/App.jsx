// import TriageScreen from "./components/TriageScreen";

// function App() {
//   return <TriageScreen />;
// }

// export default App;
import FamilyScreen from "./components/FamilyScreen";
import { useState } from "react";
import HomeScreen from "./components/HomeScreen";
import PatientInfoScreen from "./components/PatientInfoScreen";
import ChecklistScreen from "./components/ChecklistScreen";
import ResultScreen from "./components/ResultScreen";
import QueueScreen from "./components/QueueScreen";
import ReferralReport from "./components/ReferralReport";
import { runTriage } from "./engine/triageEngine";
import { createPatientRecord, rankQueue } from "./engine/priorityQueue";
import { generateReferralReport } from "./engine/referralReport";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [patientMeta, setPatientMeta] = useState({ name: "", age: "", sex: "" });
  const [triageResult, setTriageResult] = useState(null);
  const [queue, setQueue] = useState([]);
  const [reportPatient, setReportPatient] = useState(null);
  const [showVoice, setShowVoice] = useState(true);

  function handleSubmitChecklist(selectedSignIds) {
    const result = runTriage(selectedSignIds);
    setTriageResult(result);
    setScreen("result");
  }

  function handleAddToQueue() {
    const record = createPatientRecord(triageResult, patientMeta);
    setQueue((prev) => [...prev, record]);
    setScreen("queue");
  }

  function handleMarkReferred(patientId) {
    setQueue((prev) =>
      prev.map((p) => p.id === patientId ? { ...p, referred: true } : p)
    );
  }

  function handleAddNextPatient() {
    setPatientMeta({ name: "", age: "", sex: "" });
    setTriageResult(null);
    setScreen("patientInfo");
  }

  function handleViewReport(patient) {
    setReportPatient(patient);
    setScreen("report");
  }

  if (screen === "home") return (
    <HomeScreen
      queueCount={queue.length}
      redCount={queue.filter(p => p.tier === "RED").length}
      yellowCount={queue.filter(p => p.tier === "YELLOW").length}
      greenCount={queue.filter(p => p.tier === "GREEN").length}
      referredCount={queue.filter(p => p.referred).length}
      onNewAssessment={() => setScreen("patientInfo")}
      onViewQueue={() => setScreen("queue")}
    />
  );

  if (screen === "patientInfo") return (
    <PatientInfoScreen
      onBack={() => setScreen("home")}
      onStartVoice={() => { setShowVoice(true); setScreen("checklist"); }}
      onSkipToChecklist={() => { setShowVoice(false); setScreen("checklist"); }}
      patientMeta={patientMeta}
      setPatientMeta={setPatientMeta}
    />
  );

  if (screen === "checklist") return (
    <ChecklistScreen
      onBack={() => setScreen("patientInfo")}
      onSubmit={handleSubmitChecklist}
      showVoice={showVoice}
    />
  );

    if (screen === "result") return (
      <ResultScreen
        result={triageResult}
        patientMeta={patientMeta}
        onAddToQueue={() => setScreen("family")}
        onBack={() => setScreen("checklist")}
      />
    );

    if (screen === "family") return (
      <FamilyScreen
        result={triageResult}
        patientMeta={patientMeta}
        onContinue={handleAddToQueue}
        onBack={() => setScreen("result")}
      />
    );

    if (screen === "queue") return (
      <QueueScreen
        queue={queue}
        onBack={() => setScreen("home")}
        onViewReport={handleViewReport}
        onAddNext={handleAddNextPatient}
        onMarkReferred={handleMarkReferred}
      />
    );

  if (screen === "report") return (
    <ReferralReport
      report={generateReferralReport(reportPatient)}
      onBack={() => setScreen("queue")}
    />
  );
}
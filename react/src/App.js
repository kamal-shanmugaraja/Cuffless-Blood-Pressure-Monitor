import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import PatientRegistration from './PatientRegistration';
import MeasurementComponent from './MeasurementComponent';
import SelectPatient from './SelectPatient';
import ECGData from './ECGData';
import PPGData from './PPGData';
import BPData from './BPData';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<PatientRegistration />} />
        <Route path="/select-patient" element={<SelectPatient />} />
        <Route path="/measurement/:patientId" element={<MeasurementComponent />} />
        <Route path="/ecg-data/:patientId" element={<ECGData />} />
        <Route path="/ppg-data/:patientId" element={<PPGData />} />
        <Route path="/bp-data/:patientId" element={<BPData />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;

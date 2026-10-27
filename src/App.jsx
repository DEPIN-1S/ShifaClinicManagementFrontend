import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import Swal from 'sweetalert2';
import Login from './Common-Pages/Login'
import AdminDashboard from './Admin/pages/AdminDashboard'
import ReceptionistDashboard from './Receptionist/pages/ReceptionistDashboard'
import DoctorDashboard from './Doctor/pages/DoctorDashboard'
import PharmacistDashboard from './Pharmacist/pages/PharmacistDashboard'
import PatientRegistration from './Receptionist/pages/PatientRegistration'
import ReceptionistDocuments from './Receptionist/pages/ReceptionistDocuments'
import AllPatients from './Receptionist/pages/AllPatients'
import Prescriptions from './Pharmacist/pages/Prescriptions'
import PharmacistPatients from './Pharmacist/pages/PharmacistPatients'
import PharmacistQuickPrescription from './Pharmacist/pages/QuickPrescription';
import AdminUsers from './Admin/pages/AdminUsers'
import PharmacyRevenue from './Admin/pages/PharmacyRevenue';
import LabRevenue from './Admin/pages/LabRevenue';
import Consultations from './Doctor/pages/Consultations'
import DoctorDocuments from './Doctor/pages/Documents'
import DoctorPatients from './Doctor/pages/DoctorPatients'
import ConsultationDetails from './Doctor/pages/ConsultationDetails'
import QuickPrescription from './Doctor/pages/QuickPrescription'
import ConsultationHistory from './Doctor/pages/ConsultationHistory'; // [NEW]
import LabDashboard from './Lab/pages/LabDashboard'
import DoctorReferrals from './Lab/pages/DoctorReferrals'
import ProcessReferral from './Lab/pages/ProcessReferral'

import ProtectedRoutes from './Common-Components/ProtectedRoutes';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Routes>
        <Route path='/' element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoutes />}>
          <Route path='/admin-dashboard' element={<AdminDashboard />} />
          <Route path='/receptionist-dashboard' element={<ReceptionistDashboard />} />
          <Route path='/doctor-dashboard' element={<DoctorDashboard />} />
          <Route path='/pharmacist-dashboard' element={<PharmacistDashboard />} />
          <Route path='/receptionist/patient-registration' element={<PatientRegistration />} />
          <Route path='/receptionist/all-patients' element={<AllPatients />} />
          <Route path='/receptionist/documents' element={<ReceptionistDocuments />} />
          <Route path='/pharmacist/prescriptions' element={<Prescriptions />} />
          <Route path='/pharmacist/patients' element={<PharmacistPatients />} />
          <Route path='/pharmacist/quick-prescription' element={<PharmacistQuickPrescription />} />
          <Route path='/admin/users' element={<AdminUsers />} />
          <Route path='/admin/pharmacy-revenue' element={<PharmacyRevenue />} />
          <Route path='/admin/lab-revenue' element={<LabRevenue />} />
          <Route path='/doctor/consultations' element={<Consultations />} />
          <Route path='/doctor/all-patients' element={<DoctorPatients />} />
          <Route path='/doctor/consultation-details/:id' element={<ConsultationDetails />} />
          <Route path='/doctor/documents' element={<DoctorDocuments />} />
          <Route path='/doctor/quick-prescription' element={<QuickPrescription />} />
          <Route path='/doctor/consultation-history/:patientId' element={<ConsultationHistory />} />{/* [NEW] */}
          <Route path='/lab-dashboard' element={<LabDashboard />} />
          <Route path='/lab/doctor-referrals' element={<DoctorReferrals />} />
          <Route path='/lab/process-referral/:requestId' element={<ProcessReferral />} />
        </Route>
      </Routes>
    </>
  )
}

export default App

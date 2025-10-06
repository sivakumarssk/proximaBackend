import { Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Home from './screens/Home'
import Navbar from './components/Navbar'
import Login from './screens/Login'
import ProtectedRoute from './components/ProtectedRoute'
import AboutUs from './screens/ABoutUS'
import AdminServices from './screens/AdminServices'
import AdminGallery from './screens/AdminGallery'
import AdminUpcoming from './screens/AdminUpcoming'
import AdminContacts from './screens/AdminContacts'
import AdminNewsletter from './screens/AdminNewsletter'
import ConferenceAdmin from './screens/ConferenceAdmin'
import SponsorsList from './screens/SponsorsList'

function App() {

  const location = useLocation();

  return (
    <div className='appMain'>

      {location.pathname !== "/login" && <Navbar />}

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path='/' element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path='/aboutus' element={<ProtectedRoute><AboutUs /></ProtectedRoute>} />
        <Route path='/services' element={<ProtectedRoute><AdminServices /></ProtectedRoute>} />
        <Route path='/gallery' element={<ProtectedRoute><AdminGallery /></ProtectedRoute>} />
        <Route path='/upcomingEvents' element={<ProtectedRoute><AdminUpcoming /></ProtectedRoute>} />
        <Route path='/sponsorConferences' element={<ProtectedRoute><ConferenceAdmin /></ProtectedRoute>} />
        <Route path='/sponsorList' element={<ProtectedRoute><SponsorsList /></ProtectedRoute>} />
        <Route path='/adminContact' element={<ProtectedRoute><AdminContacts /></ProtectedRoute>} />
        <Route path='/newsletterList' element={<ProtectedRoute><AdminNewsletter /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default App

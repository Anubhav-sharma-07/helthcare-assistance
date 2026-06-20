import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { 
  Activity, FileText, Calendar, ShieldCheck, Heart, User as UserIcon, 
  ChevronRight, Upload, LogOut, Loader2, Sparkles, Plus, CheckCircle2, AlertTriangle, Info, Clock
} from 'lucide-react';

const MainApp = () => {
  const { user, logout, token, API_URL, fetchUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard & History States
  const [predictionsHistory, setPredictionsHistory] = useState([]);
  const [reportsHistory, setReportsHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Prediction states
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [predictResult, setPredictResult] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);

  // File Upload states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // New Vitals state
  const [vitalHeartRate, setVitalHeartRate] = useState('');
  const [vitalBloodPressure, setVitalBloodPressure] = useState('');
  const [vitalBloodSugar, setVitalBloodSugar] = useState('');
  const [vitalBmi, setVitalBmi] = useState('');
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [vitalsMsg, setVitalsMsg] = useState('');

  // Fetch histories on mount
  useEffect(() => {
    if (token) {
      loadUserData();
    }
  }, [token, activeTab]);

  const loadUserData = async () => {
    setLoadingHistory(true);
    try {
      // Predictions
      const predRes = await fetch(`${API_URL}/predict/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (predRes.ok) {
        const predData = await predRes.json();
        setPredictionsHistory(predData);
      }

      // Reports
      const repRes = await fetch(`${API_URL}/reports/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (repRes.ok) {
        const repData = await repRes.json();
        setReportsHistory(repData);
      }

      // Recommendations
      const recRes = await fetch(`${API_URL}/recommendations/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommendations(recData);
      }
    } catch (err) {
      console.error("Error loading user histories:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Symptoms catalog
  const symptomList = [
    { id: "itching", label: "Itching" },
    { id: "skin_rash", label: "Skin Rash" },
    { id: "nodal_skin_eruptions", label: "Nodal Skin Eruptions" },
    { id: "continuous_sneezing", label: "Continuous Sneezing" },
    { id: "shivering", label: "Shivering" },
    { id: "chills", label: "Chills" },
    { id: "stomach_pain", label: "Stomach Pain" },
    { id: "acidity", label: "Acidity" },
    { id: "ulcers_on_tongue", label: "Ulcers on Tongue" },
    { id: "vomiting", label: "Vomiting" },
    { id: "cough", label: "Cough" },
    { id: "high_fever", label: "High Fever" },
    { id: "sweating", label: "Sweating" },
    { id: "headache", label: "Headache" },
    { id: "yellowish_skin", label: "Yellowish Skin" },
    { id: "abdominal_pain", label: "Abdominal Pain" },
    { id: "loss_of_appetite", label: "Loss of Appetite" },
    { id: "joint_pain", label: "Joint Pain" },
    { id: "muscle_weakness", label: "Muscle Weakness" }
  ];

  const handleSymptomToggle = (id) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) return;
    setPredictLoading(true);
    setPredictResult(null);
    try {
      const res = await fetch(`${API_URL}/predict/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ symptoms: selectedSymptoms })
      });
      if (res.ok) {
        const data = await res.json();
        setPredictResult(data);
        // Refresh profile to update prediction stats
        loadUserData();
      } else {
        alert("Failed to evaluate predictions");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPredictLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploadLoading(true);
    setUploadResult(null);
    
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const res = await fetch(`${API_URL}/reports/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setUploadResult(data);
        loadUserData();
      } else {
        const errText = await res.text();
        alert(`Upload failed: ${errText || 'Invalid format'}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleVitalsSubmit = async (e) => {
    e.preventDefault();
    setVitalsLoading(true);
    setVitalsMsg('');
    try {
      const res = await fetch(`${API_URL}/user/vitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          heart_rate: parseInt(vitalHeartRate),
          blood_pressure: vitalBloodPressure,
          blood_sugar: parseInt(vitalBloodSugar),
          bmi: parseFloat(vitalBmi)
        })
      });
      if (res.ok) {
        setVitalsMsg('Vitals successfully updated.');
        setVitalHeartRate('');
        setVitalBloodPressure('');
        setVitalBloodSugar('');
        setVitalBmi('');
        fetchUserProfile();
        loadUserData();
      } else {
        const data = await res.json();
        setVitalsMsg(`Error: ${data.detail || 'Failed submission'}`);
      }
    } catch (err) {
      setVitalsMsg('Could not connect to service.');
    } finally {
      setVitalsLoading(false);
    }
  };

  // Vitals retrieval helper
  const getLatestVitals = () => {
    if (user && user.vitals_history && user.vitals_history.length > 0) {
      return user.vitals_history[user.vitals_history.length - 1];
    }
    return { heart_rate: 'N/A', blood_pressure: 'N/A', blood_sugar: 'N/A', bmi: 'N/A' };
  };

  const latestVitals = getLatestVitals();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-lg leading-tight block">SmartCare</span>
              <span className="text-xs text-slate-400 font-medium">Assistant Hub</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              <Activity className="h-4 w-4" />
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('predictor')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === 'predictor' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              <Sparkles className="h-4 w-4" />
              Symptom Checker
            </button>
            <button 
              onClick={() => setActiveTab('uploader')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === 'uploader' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              <Upload className="h-4 w-4" />
              Upload Report
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              <FileText className="h-4 w-4" />
              Medical History
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              <UserIcon className="h-4 w-4" />
              Log Vitals / Profile
            </button>
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-6">
          {user && (
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">
                {user.username ? user.username.substring(0, 2).toUpperCase() : 'PT'}
              </div>
              <div className="overflow-hidden">
                <span className="font-semibold text-slate-800 text-sm block truncate">{user.username}</span>
                <span className="text-xs text-slate-400 block truncate">{user.email}</span>
              </div>
            </div>
          )}
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-rose-500 hover:bg-rose-50 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Good morning, {user?.username || 'User'} 👋
            </h1>
            <p className="text-sm text-slate-400 mt-1">Your health summary for today · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-200 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 block animate-pulse"></span>
              Live Sync Active
            </span>
          </div>
        </header>

        {/* Tab content rendering */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            
            {/* KPI metrics cards */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Total Predictions</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-800">{predictionsHistory.length}</span>
                    <span className="text-xs font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded">↑ 2 new</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Reports Uploaded</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-800">{reportsHistory.length}</span>
                    <span className="text-xs font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded">↑ 1 new</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Appointments</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-800">3</span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">This week</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Health Score</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-800">87/100</span>
                    <span className="text-xs font-bold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">↑ 4%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vitals Overview */}
            <section className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Vitals Overview</h2>
              <div className="grid grid-cols-4 gap-6">
                
                {/* Heart Rate */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Heart Rate</span>
                    <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Normal</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-slate-800">{latestVitals.heart_rate}</span>
                    <span className="text-xs text-slate-400 font-medium">bpm</span>
                  </div>
                  {/* Subtle Vector Sparkline */}
                  <svg className="w-full h-8 text-indigo-500" viewBox="0 0 100 20" fill="none">
                    <path d="M0,10 L10,10 L15,10 L20,3 L25,17 L30,10 L45,10 L50,5 L55,15 L60,10 L75,10 L80,0 L85,20 L90,10 L100,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Blood Pressure */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood Pressure</span>
                    <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Optimal</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-slate-800">{latestVitals.blood_pressure}</span>
                    <span className="text-xs text-slate-400 font-medium">mmHg</span>
                  </div>
                  <svg className="w-full h-8 text-teal-500" viewBox="0 0 100 20" fill="none">
                    <path d="M0,10 L20,10 L25,9 L30,11 L35,10 L55,10 L60,8 L65,12 L70,10 L85,10 L90,9 L95,11 L100,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Blood Sugar */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood Sugar</span>
                    <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Borderline</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-slate-800">{latestVitals.blood_sugar}</span>
                    <span className="text-xs text-slate-400 font-medium">mg/dL</span>
                  </div>
                  <svg className="w-full h-8 text-amber-500" viewBox="0 0 100 20" fill="none">
                    <path d="M0,15 L20,13 L40,16 L60,14 L80,17 L100,14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* BMI */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">BMI</span>
                    <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Healthy</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-slate-800">{latestVitals.bmi}</span>
                  </div>
                  <svg className="w-full h-8 text-emerald-500" viewBox="0 0 100 20" fill="none">
                    <path d="M0,10 L100,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

              </div>

              {/* Weekly Activity mini graph */}
              <div className="mt-8 pt-8 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">Weekly Prediction Activity</span>
                <div className="flex justify-between items-end h-16 w-full max-w-lg">
                  {[
                    { day: 'Mon', h: 'h-6' },
                    { day: 'Tue', h: 'h-14 bg-indigo-500' },
                    { day: 'Wed', h: 'h-8' },
                    { day: 'Thu', h: 'h-10' },
                    { day: 'Fri', h: 'h-4' },
                    { day: 'Sat', h: 'h-7' },
                    { day: 'Sun', h: 'h-12 bg-indigo-500' }
                  ].map((bar, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className={`w-12 rounded-lg bg-indigo-200 transition-all ${bar.h}`}></div>
                      <span className="text-[10px] font-semibold text-slate-400">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Appointments & AI Recommendations */}
            <div className="grid grid-cols-3 gap-8">
              
              {/* Appointments */}
              <div className="col-span-1 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Appointments</h3>
                  <button className="text-xs font-semibold text-slate-400 hover:text-slate-600">Schedule</button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: 'Dr. Rajesh Kumar', spec: 'General Physician', time: '10:30 AM Tomorrow', dot: 'bg-green-500', init: 'RK', bg: 'bg-blue-100 text-blue-600' },
                    { name: 'Dr. Sneha Patil', spec: 'Cardiologist', time: '2:00 PM Jun 25', dot: 'bg-amber-500', init: 'SP', bg: 'bg-purple-100 text-purple-600' },
                    { name: 'Dr. Arun Mehta', spec: 'Endocrinologist', time: '11:00 AM Jun 28', dot: 'bg-indigo-500', init: 'AM', bg: 'bg-pink-100 text-pink-600' }
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs ${doc.bg}`}>
                          {doc.init}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800 text-xs block">{doc.name}</span>
                          <span className="text-[10px] text-slate-400 block">{doc.spec}</span>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500">{doc.time}</span>
                        <span className={`h-2 w-2 rounded-full ${doc.dot}`}></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <h3 className="font-bold text-slate-800">AI Recommendations</h3>
                
                <div className="space-y-4">
                  {recommendations.length > 0 ? (
                    recommendations.slice(0, 3).map((rec, i) => (
                      <div key={i} className="space-y-2">
                        {rec.content.map((item, idx) => (
                          <div key={idx} className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/30 flex gap-3.5 items-start">
                            <span className="h-2 w-2 rounded-full bg-indigo-600 mt-2 block shrink-0"></span>
                            <div>
                              <span className="text-xs font-bold text-indigo-700 block uppercase tracking-wider mb-0.5">{item.category}</span>
                              <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.advice}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50 flex gap-3 items-start">
                        <Info className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-rose-700 block mb-0.5">Medication Reminder</span>
                          <p className="text-xs text-slate-600 font-medium">Take Metformin 500mg with dinner. Next dose in 4 hours.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex gap-3 items-start">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-amber-700 block mb-0.5">Monitor Blood Sugar</span>
                          <p className="text-xs text-slate-600 font-medium">Your fasting glucose was borderline. Avoid refined carbs today.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex gap-3 items-start">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-emerald-700 block mb-0.5">Activity Goal</span>
                          <p className="text-xs text-slate-600 font-medium">7,240 of 10,000 steps today. A 20-min walk will close the gap.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {activeTab === 'predictor' && (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm max-w-3xl space-y-8">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Symptom Checker & Diagnosis</h2>
              <p className="text-xs text-slate-400 mt-1">Select symptoms from the catalog below to compile an evaluation report.</p>
            </div>

            <form onSubmit={handlePredict} className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {symptomList.map((sym) => {
                  const selected = selectedSymptoms.includes(sym.id);
                  return (
                    <button
                      key={sym.id}
                      type="button"
                      onClick={() => handleSymptomToggle(sym.id)}
                      className={`p-3 text-left rounded-xl border text-xs font-semibold transition-all duration-150 ${selected ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {sym.label}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                <span className="text-xs text-slate-400 font-medium">{selectedSymptoms.length} symptoms active</span>
                <button
                  type="submit"
                  disabled={selectedSymptoms.length === 0 || predictLoading}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-100 hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {predictLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Run Prediction
                </button>
              </div>
            </form>

            {predictResult && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                <h3 className="font-bold text-slate-800 text-sm">Prediction Findings</h3>
                
                <div className="space-y-4">
                  {predictResult.prediction_results.map((res, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>{res.disease}</span>
                        <span>{(res.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${res.confidence * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/30">
                  <span className="text-xs font-bold text-indigo-700 block uppercase tracking-wider mb-1">Care Guidance</span>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{predictResult.care_guidance}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'uploader' && (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm max-w-2xl space-y-8">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Upload Lab Report</h2>
              <p className="text-xs text-slate-400 mt-1">Upload blood panel reports (PDF/JPEG) to parse metrics and check anomalies.</p>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-6">
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 transition-colors flex flex-col items-center justify-center gap-4 bg-slate-50/50">
                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-700 block mb-1">Choose a report document</span>
                  <span className="text-[10px] text-slate-400">PDF, PNG, JPG, or JPEG (Max 10MB)</span>
                </div>
                <input 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg" 
                  onChange={(e) => setUploadFile(e.target.files[0])} 
                  className="text-xs font-semibold text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              {uploadFile && (
                <div className="flex justify-between items-center text-xs font-semibold bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-700 truncate max-w-sm">{uploadFile.name}</span>
                  <span className="text-slate-400 font-medium">{(uploadFile.size / 1024).toFixed(0)} KB</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!uploadFile || uploadLoading}
                className="w-full py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Analyze Document
              </button>
            </form>

            {uploadResult && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Report Summary</span>
                  <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">{uploadResult.summary}</p>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Parsed Panel Biomarkers</span>
                  <div className="overflow-hidden border border-slate-200/60 rounded-xl bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-400 font-bold">
                          <th className="p-3">Biomarker</th>
                          <th className="p-3">Measured Value</th>
                          <th className="p-3">Reference Range</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {uploadResult.markers_flagged.map((marker, i) => (
                          <tr key={i}>
                            <td className="p-3 font-bold">{marker.name}</td>
                            <td className="p-3">{marker.value} {marker.unit}</td>
                            <td className="p-3 font-medium text-slate-400">{marker.reference_range}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${marker.status === 'high' ? 'bg-red-50 text-red-600 border border-red-200' : marker.status === 'low' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                                {marker.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Medical Logs History</h2>
              <p className="text-xs text-slate-400 mt-1">Review past evaluations and lab report metrics recorded under your profile.</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Predictions Logs */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  Symptom Checks Log
                </h3>

                {predictionsHistory.length > 0 ? (
                  predictionsHistory.map((pred) => (
                    <div key={pred.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">{new Date(pred.created_at).toLocaleDateString()}</span>
                        <span className="text-indigo-600 font-bold uppercase text-[10px] tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full">{pred.prediction_results[0].disease}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {pred.symptoms.map((s, idx) => (
                          <span key={idx} className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/60">
                            {s.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium pt-1 border-t border-slate-50">{pred.care_guidance}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs font-semibold bg-white rounded-2xl border border-slate-100">
                    No symptom checks recorded yet.
                  </div>
                )}
              </div>

              {/* Reports Logs */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  Uploaded Lab Panels
                </h3>

                {reportsHistory.length > 0 ? (
                  reportsHistory.map((rep) => (
                    <div key={rep.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">{new Date(rep.created_at).toLocaleDateString()}</span>
                        <span className="text-slate-800 font-bold truncate max-w-[150px]">{rep.file_name}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">{rep.summary}</p>
                      
                      {rep.markers_flagged && rep.markers_flagged.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-50">
                          {rep.markers_flagged.map((m, idx) => (
                            <span key={idx} className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${m.status === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                              {m.name}: {m.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs font-semibold bg-white rounded-2xl border border-slate-100">
                    No medical reports uploaded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-2 gap-8 max-w-4xl">
            
            {/* Vitals Form */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Update Daily Vitals</h2>
                <p className="text-xs text-slate-400 mt-1">Record today's metrics to update history and analysis graphs.</p>
              </div>

              <form onSubmit={handleVitalsSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={vitalHeartRate}
                    onChange={(e) => setVitalHeartRate(e.target.value)}
                    required
                    placeholder="e.g. 72"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    value={vitalBloodPressure}
                    onChange={(e) => setVitalBloodPressure(e.target.value)}
                    required
                    placeholder="e.g. 120/80"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Blood Sugar (mg/dL)</label>
                  <input
                    type="number"
                    value={vitalBloodSugar}
                    onChange={(e) => setVitalBloodSugar(e.target.value)}
                    required
                    placeholder="e.g. 95"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">BMI</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalBmi}
                    onChange={(e) => setVitalBmi(e.target.value)}
                    required
                    placeholder="e.g. 21.8"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {vitalsMsg && (
                  <div className="p-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs border border-slate-200 text-center">
                    {vitalsMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={vitalsLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {vitalsLoading ? 'Saving...' : 'Record Metrics'}
                </button>
              </form>
            </div>

            {/* Profile Info */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-800">Profile Information</h2>
              
              <div className="space-y-4 text-xs font-semibold text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span>Username</span>
                  <span className="text-slate-800 font-bold">{user?.username}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span>Email address</span>
                  <span className="text-slate-800 font-bold">{user?.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span>Age</span>
                  <span className="text-slate-800 font-bold">{user?.age} years</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span>Gender</span>
                  <span className="text-slate-800 font-bold uppercase">{user?.gender}</span>
                </div>
                <div className="flex justify-between pb-3">
                  <span>Member Since</span>
                  <span className="text-slate-400 font-bold">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

const AuthPage = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password, age, gender);
        // Automatically switch to login on success
        setIsLogin(true);
        setErrorMsg('Registration successful. Please log in.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">
            {isLogin ? 'Sign In to SmartCare' : 'Create Patient Account'}
          </h1>
          <p className="text-xs text-slate-400">AI-Powered Smart Healthcare Assistant</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. JohnDoe"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    placeholder="34"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="patient@example.com"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs border border-red-200 text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            {isLogin ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
            }}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return token ? <MainApp /> : <AuthPage />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

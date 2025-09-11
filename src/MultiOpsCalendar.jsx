import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyAys4MLdLiFGYVsRozzu_4Mahod2DYvk_s",
  authDomain: "multi-ops-calendar.firebaseapp.com",
  projectId: "multi-ops-calendar",
  storageBucket: "multi-ops-calendar.firebasestorage.app",
  messagingSenderId: "560636373329",
  appId: "1:560636373329:web:ddb142dfef1491a98f8b70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const operationsList = [
  { name: "Vels University", color: "#3B82F6", bgColor: "linear-gradient(135deg, #3B82F6, #1D4ED8)", user: "vels@example.com" },
  { name: "Bharath University", color: "#10B981", bgColor: "linear-gradient(135deg, #10B981, #047857)", user: "bharath@example.com" },
  { name: "Jamal Mohammad College", color: "#F59E0B", bgColor: "linear-gradient(135deg, #F59E0B, #D97706)", user: "jamal@example.com" },
  { name: "Crescent University", color: "#8B5CF6", bgColor: "linear-gradient(135deg, #8B5CF6, #7C3AED)", user: "crescent@example.com" },
  { name: "Bishop Herber College", color: "#EC4899", bgColor: "linear-gradient(135deg, #EC4899, #DB2777)", user: "bishop@example.com" },
  { name: "Malla Reddy University", color: "#EF4444", bgColor: "linear-gradient(135deg, #EF4444, #DC2626)", user: "malla@example.com" },
];

// Utility functions
const addMonths = (date, months) => { const d = new Date(date); d.setMonth(d.getMonth() + months); return d; };
const subMonths = (date, months) => { const d = new Date(date); d.setMonth(d.getMonth() - months); return d; };
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const startOfWeek = (date) => { const d = new Date(date); d.setDate(d.getDate() - d.getDay()); return d; };
const endOfWeek = (date) => { const d = new Date(date); d.setDate(d.getDate() + (6 - d.getDay())); return d; };
const format = (date, fmt) => {
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  if (fmt === "MMMM yyyy") return `${months[date.getMonth()]} ${date.getFullYear()}`;
  if (fmt === "MMMM dd, yyyy") return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  return date.toLocaleDateString();
};
const isSameMonth = (d1,d2) => d1.getMonth()===d2.getMonth() && d1.getFullYear()===d2.getFullYear();
const isSameDay = (d1,d2) => d1.getDate()===d2.getDate() && isSameMonth(d1,d2);

export default function MultiOpsCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 8));
  const [selectedOps, setSelectedOps] = useState(operationsList.map(op => op.name));
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventOp, setNewEventOp] = useState(operationsList[0].name);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        loadEvents();
      } else {
        setCurrentUser(null);
        setEvents([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load events from Firebase
  const loadEvents = () => {
    const eventsRef = collection(db, "events");
    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      const eventsData = [];
      snapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsData);
    });

    return unsubscribe;
  };

  // Login function
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (error) {
      setLoginError(error.message);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleOperation = (opName) => {
    setSelectedOps(prev => prev.includes(opName) ? prev.filter(o=>o!==opName) : [...prev, opName]);
  };
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth,1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth,1));
  const goToday = () => setCurrentMonth(new Date());

  const startMonth = startOfMonth(currentMonth);
  const endMonth = endOfMonth(currentMonth);
  const startDate = startOfWeek(startMonth);
  const endDate = endOfWeek(endMonth);

  const eventsByDate = events.reduce((acc, ev) => { acc[ev.date] = acc[ev.date] ? [...acc[ev.date], ev] : [ev]; return acc; }, {});
  const dates = [];
  let day = startDate;
  while(day <= endDate){dates.push(day); day = new Date(day.getTime()+24*60*60*1000);}
  const isToday = date => isSameDay(date,new Date());
  
  // Check if current user can edit/delete an event
  const canEditEvent = (event) => {
    if (!currentUser) return false;
    
    // Admin can edit all events
    if (currentUser.email === "admin@example.com") {
      return true;
    }
    
    // Users can only edit their own operation's events
    const operation = operationsList.find(op => op.name === event.op);
    return operation && operation.user === currentUser.email;
  };
  
  const deleteEvent = async (id, e) => { 
    e.stopPropagation(); 
    const eventToDelete = events.find(ev => ev.id === id);
    if (eventToDelete && canEditEvent(eventToDelete)) {
      try {
        await deleteDoc(doc(db, "events", id));
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Error deleting event. Please try again.");
      }
    }
  };

  // Add new event
  const openModal = (date) => { 
    if (!currentUser) {
      alert("Please log in to add events.");
      return;
    }
    
    // Check if user has permission to add events to any operation
    const userOperations = operationsList.filter(op => 
      currentUser.email === "admin@example.com" ? true : op.user === currentUser.email
    );
    
    if (userOperations.length === 0) {
      alert("You don't have permission to add events to any operation");
      return;
    }
    
    setNewEventDate(date); 
    setNewEventTitle(""); 
    setNewEventOp(userOperations[0].name); 
    setModalOpen(true); 
  };
  
  const saveEvent = async () => {
    if (!newEventTitle) return alert("Enter event title");
    
    // Check if user has permission to add events to the selected operation
    const selectedOperation = operationsList.find(op => op.name === newEventOp);
    
    if (currentUser.email !== "admin@example.com") {
      if (!selectedOperation || selectedOperation.user !== currentUser.email) {
        alert("You don't have permission to add events to this operation");
        return;
      }
    }
    
    try {
      await addDoc(collection(db, "events"), { 
        date: newEventDate.toISOString().split('T')[0], 
        op: newEventOp, 
        title: newEventTitle,
        user: currentUser.email,
        createdAt: new Date()
      });
      setModalOpen(false);
    } catch (error) {
      console.error("Error adding event:", error);
      alert("Error adding event. Please try again.");
    }
  };

  // Get operations available for the current user to add events to
  const getUserOperations = () => {
    if (!currentUser) return [];
    if (currentUser.email === "admin@example.com") {
      return operationsList;
    }
    return operationsList.filter(op => op.user === currentUser.email);
  };

  // Check if user can add events
  const userCanAddEvents = () => {
    return currentUser && getUserOperations().length > 0;
  };

  // Get events for the selected date
  const getEventsForSelectedDate = () => {
    if (!newEventDate) return [];
    const isoDate = newEventDate.toISOString().split('T')[0];
    return eventsByDate[isoDate] || [];
  };

  // Show login screen if not authenticated
  if (!currentUser) {
    return (
      <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#f8fafc,#e0f2fe,#e8eaf6)',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(10px)',borderRadius:'16px',boxShadow:'0 25px 50px rgba(0,0,0,0.1)',border:'1px solid rgba(255,255,255,0.2)',padding:'32px',width:'100%',maxWidth:'400px'}}>
          <div style={{textAlign:'center',marginBottom:'32px'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
              <div style={{width:'48px',height:'48px',background:'linear-gradient(135deg,#3B82F6,#8B5CF6)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>📅</div>
              <h1 style={{fontSize:'32px',fontWeight:'bold',background:'linear-gradient(135deg,#1f2937,#4b5563)',backgroundClip:'text',WebkitBackgroundClip:'text',color:'transparent',margin:0}}>Multi-Operation Calendar</h1>
            </div>
            <p style={{color:'#6b7280',fontSize:'16px',margin:0}}>Please login to continue</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{marginBottom:'20px'}}>
              <label style={{display:'block',marginBottom:'8px',fontWeight:'500',color:'#374151'}}>Email</label>
              <input 
                type="email" 
                value={loginEmail} 
                onChange={e => setLoginEmail(e.target.value)} 
                style={{width:'100%',padding:'12px 16px',borderRadius:'8px',border:'1px solid #d1d5db', fontSize: '16px'}} 
                required 
              />
            </div>
            
            <div style={{marginBottom:'24px'}}>
              <label style={{display:'block',marginBottom:'8px',fontWeight:'500',color:'#374151'}}>Password</label>
              <input 
                type="password" 
                value={loginPassword} 
                onChange={e => setLoginPassword(e.target.value)} 
                style={{width:'100%',padding:'12px 16px',borderRadius:'8px',border:'1px solid #d1d5db', fontSize: '16px'}} 
                required 
              />
            </div>
            
            {loginError && (
              <div style={{color: '#EF4444', marginBottom: '16px', textAlign: 'center'}}>
                {loginError}
              </div>
            )}
            
            <button 
              type="submit" 
              style={{width:'100%',padding:'12px 16px',borderRadius:'8px',background:'#3B82F6',color:'white',border:'none', fontSize: '16px', fontWeight: '500', cursor: 'pointer'}}
            >
              Login
            </button>
          </form>
          
          <div style={{marginTop: '24px', padding: '16px', background: '#F3F4F6', borderRadius: '8px'}}>
            <p style={{margin: '0 0 12px 0', fontSize: '14px', color: '#4B5563'}}>Demo credentials:</p>
            <div style={{fontSize: '12px', color: '#6B7280'}}>
              <div>Admin: admin@example.com / admin123</div>
              <div>Vels: vels@example.com / vels123</div>
              <div>Bharath: bharath@example.com / bharath123</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#f8fafc,#e0f2fe,#e8eaf6)',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'24px'}}>
        {/* Header */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{width:'48px',height:'48px',background:'linear-gradient(135deg,#3B82F6,#8B5CF6)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>📅</div>
            <h1 style={{fontSize:'36px',fontWeight:'bold',background:'linear-gradient(135deg,#1f2937,#4b5563)',backgroundClip:'text',WebkitBackgroundClip:'text',color:'transparent',margin:0}}>Multi-Operation Calendar</h1>
          </div>
          
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <div style={{fontSize:'16px',color:'#6b7280'}}>Welcome, <span style={{fontWeight:'bold',color:'#1f2937'}}>{currentUser.email}</span></div>
            <button onClick={handleLogout} style={{padding:'8px 16px',borderRadius:'8px',border:'1px solid #d1d5db', background: 'white', cursor: 'pointer'}}>
              Logout
            </button>
          </div>
        </div>

        {/* Controls */}
        <div style={{background:'rgba(255,255,255,0.8)',backdropFilter:'blur(10px)',borderRadius:'16px',boxShadow:'0 25px 50px rgba(0,0,0,0.1)',border:'1px solid rgba(255,255,255,0.2)',padding:'24px',marginBottom:'32px'}}>
          <div style={{display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:'24px',flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
              <div style={{display:'flex',alignItems:'center',background:'white',borderRadius:'12px',boxShadow:'0 4px 6px rgba(0,0,0,0.05)',border:'1px solid #e5e7eb'}}>
                <button onClick={prevMonth} style={{padding:'12px',border:'none',cursor:'pointer',borderRadius:'12px 0 0 12px'}}>‹</button>
                <button onClick={goToday} style={{padding:'12px 24px',borderLeft:'1px solid #e5e7eb',borderRight:'1px solid #e5e7eb',fontWeight:'500'}}>Today</button>
                <button onClick={nextMonth} style={{padding:'12px',border:'none',cursor:'pointer',borderRadius:'0 12px 12px 0'}}>›</button>
              </div>
              <div style={{fontSize:'24px',fontWeight:'bold',color:'1f2937'}}>{format(currentMonth,"MMMM yyyy")}</div>
            </div>

            <div style={{display:'flex',flexWrap:'wrap',gap:'12px',justifyContent:'center'}}>
              {operationsList.map(op=>(
                <button key={op.name} onClick={()=>toggleOperation(op.name)} style={{
                  padding:'10px 20px',borderRadius:'25px',border:selectedOps.includes(op.name)?'none':`2px solid ${op.color}`,
                  background:selectedOps.includes(op.name)?op.bgColor:'white',color:selectedOps.includes(op.name)?'white':op.color,fontSize:'14px',fontWeight:'500',cursor:'pointer',transition:'all 0.3s',
                  opacity: (currentUser.email === "admin@example.com" || op.user === currentUser.email) ? 1 : 0.6,
                  position: 'relative'
                }}>
                  {op.name}
                  {op.user === currentUser.email && (
                    <span style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      width: '12px',
                      height: '12px',
                      background: '#10B981',
                      borderRadius: '50%',
                      border: '2px solid white'
                    }}></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div style={{background:'rgba(255,255,255,0.8)',backdropFilter:'blur(10px)',borderRadius:'16px',boxShadow:'0 25px 50px rgba(0,0,0,0.1)',border:'1px solid rgba(255,255,255,0.2)',padding:'24px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'16px'}}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=><div key={day} style={{textAlign:'center',padding:'16px',fontWeight:'bold',color:'#374151',fontSize:'14px'}}>{day}</div>)}
            {dates.map(dateObj=>{
              const iso = dateObj.toISOString().split('T')[0];
              const inMonth = isSameMonth(dateObj,currentMonth);
              const dayEvents = (eventsByDate[iso]||[]).filter(ev=>selectedOps.includes(ev.op));
              const today = isToday(dateObj);
              
              return (
                <div key={iso} onClick={()=>inMonth && userCanAddEvents() && openModal(dateObj)} style={{
                  minHeight:'120px',padding:'12px',borderRadius:'12px',border:`2px solid ${today?'#3B82F6':'#e5e7eb'}`,
                  background:inMonth?'white':'#f9fafb',color:inMonth?'#1f2937':'#9ca3af',
                  cursor: inMonth && userCanAddEvents() ? 'pointer' : 'default',
                  position:'relative',
                  opacity: inMonth ? 1 : 0.5
                }}>
                  <div style={{fontSize:'14px',fontWeight:'bold',marginBottom:'8px',color:today?'#3B82F6':(inMonth?'#1f2937':'#9ca3af')}}>{dateObj.getDate()}</div>
                  {today && <div style={{position:'absolute',top:'8px',right:'8px',width:'8px',height:'8px',background:'#3B82F6',borderRadius:'50%',animation:'pulse 2s infinite'}}/>}
                  <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                    {dayEvents.slice(0,3).map(ev=>{
                      const op = operationsList.find(o=>o.name===ev.op);
                      const canEdit = canEditEvent(ev);
                      return (
                        <div key={ev.id} onClick={(e) => canEdit && deleteEvent(ev.id, e)} style={{
                          background: op.bgColor,
                          borderRadius:'8px',
                          padding:'6px 12px',
                          color:'white',
                          fontSize:'12px',
                          fontWeight:'500',
                          cursor: canEdit ? 'pointer' : 'default',
                          display:'flex',
                          alignItems:'center',
                          justifyContent:'space-between',
                          opacity: canEdit ? 1 : 0.8
                        }}>
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',paddingRight:'8px'}}>{ev.title}</span>
                          {canEdit && <span style={{fontSize:'10px',opacity:0.8}}>🗑️</span>}
                          {!canEdit && currentUser.email === "admin@example.com" && (
                            <span style={{fontSize:'10px',opacity:0.8}}>👁️</span>
                          )}
                        </div>
                      )
                    })}
                    {dayEvents.length>3 && <div style={{fontSize:'12px',color:'#6b7280',fontWeight:'500',padding:'4px 8px',background:'#e5e7eb',borderRadius:'6px'}}>+{dayEvents.length-3} more</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{marginTop:'32px',textAlign:'center'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'24px',padding:'12px 24px',background:'rgba(255,255,255,0.8)',backdropFilter:'blur(10px)',borderRadius:'50px',boxShadow:'0 10px 25px rgba(0,0,0,0.1)',border:'1px solid rgba(255,255,255,0.2)'}}>
            <div style={{fontSize:'14px',color:'#6b7280'}}><span style={{fontWeight:'bold',color:'#1f2937'}}>{events.length}</span> Total Events</div>
            <div style={{width:'4px',height:'16px',background:'#d1d5db',borderRadius:'2px'}}/>
            <div style={{fontSize:'14px',color:'#6b7280'}}><span style={{fontWeight:'bold',color:'#1f2937'}}>{selectedOps.length}</span> Active Operations</div>
            <div style={{width:'4px',height:'16px',background:'#d1d5db',borderRadius:'2px'}}/>
            <div style={{fontSize:'14px',color:'#6b7280'}}>User: <span style={{fontWeight:'bold',color:'#1f2937'}}>
              {currentUser.email}
            </span></div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{
          position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(0,0,0,0.5)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000
        }}>
          <div style={{background:'white',borderRadius:'16px',padding:'32px',minWidth:'400px',maxWidth:'500px',position:'relative', maxHeight: '80vh', overflowY: 'auto'}}>
            <h2 style={{marginTop:0}}>Add New Event</h2>
            <p style={{marginBottom:'8px', fontWeight: 'bold', color: '#374151'}}>{format(newEventDate,'MMMM dd, yyyy')}</p>
            
            {/* Existing events for the selected day */}
            <div style={{marginBottom: '20px'}}>
              <h3 style={{marginBottom: '12px', fontSize: '16px', color: '#4B5563'}}>Existing Events:</h3>
              {getEventsForSelectedDate().length > 0 ? (
                <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px'}}>
                  {getEventsForSelectedDate().map(ev => {
                    const op = operationsList.find(o => o.name === ev.op);
                    return (
                      <div key={ev.id} style={{
                        background: op.bgColor,
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '500',
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{fontWeight: 'bold', fontSize: '14px'}}>{ev.title}</div>
                          <div style={{fontSize: '11px', opacity: 0.9}}>{ev.op}</div>
                        </div>
                        <div style={{fontSize: '11px', opacity: 0.9}}>
                          {ev.user}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{padding: '12px', background: '#F9FAFB', borderRadius: '8px', color: '#6B7280', textAlign: 'center'}}>
                  No events scheduled for this day
                </div>
              )}
            </div>
            
            {/* Add new event form */}
            <div style={{borderTop: '1px solid #E5E7EB', paddingTop: '20px'}}>
              <h3 style={{marginBottom: '12px', fontSize: '16px', color: '#4B5563'}}>Add New Event:</h3>
              <input 
                type="text" 
                placeholder="Event Title" 
                value={newEventTitle} 
                onChange={e=>setNewEventTitle(e.target.value)} 
                style={{width:'100%',padding:'10px 14px',marginBottom:'16px',borderRadius:'8px',border:'1px solid #d1d5db', fontSize: '14px'}} 
              />
              <select 
                value={newEventOp} 
                onChange={e=>setNewEventOp(e.target.value)} 
                style={{width:'100%',padding:'10px 14px',marginBottom:'24px',borderRadius:'8px',border:'1px solid #d1d5db', fontSize: '14px'}}
              >
                {getUserOperations().map(op=><option key={op.name} value={op.name}>{op.name}</option>)}
              </select>
              <div style={{display:'flex',justifyContent:'flex-end',gap:'12px'}}>
                <button 
                  onClick={()=>setModalOpen(false)} 
                  style={{padding:'10px 18px',borderRadius:'8px',border:'1px solid #d1d5db', background: 'white', cursor: 'pointer'}}
                >
                  Cancel
                </button>
                <button 
                  onClick={saveEvent} 
                  style={{padding:'10px 18px',borderRadius:'8px',background:'#3B82F6',color:'white',border:'none', cursor: 'pointer'}}
                >
                  Save Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
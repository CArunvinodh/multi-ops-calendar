import { useState } from "react";

const operationsList = [
  { name: "Vels University", color: "#3B82F6", bgColor: "linear-gradient(135deg, #3B82F6, #1D4ED8)" },
  { name: "Bharath University", color: "#10B981", bgColor: "linear-gradient(135deg, #10B981, #047857)" },
  { name: "Jamal Mohammad College", color: "#F59E0B", bgColor: "linear-gradient(135deg, #F59E0B, #D97706)" },
  { name: "Crescent University", color: "#8B5CF6", bgColor: "linear-gradient(135deg, #8B5CF6, #7C3AED)" },
  { name: "Bishop Herber College", color: "#EC4899", bgColor: "linear-gradient(135deg, #EC4899, #DB2777)" },
  { name: "Malla Reddy University", color: "#EF4444", bgColor: "linear-gradient(135deg, #EF4444, #DC2626)" },
];

const initialEvents = [
  { id: 1, op: "Vels University", date: "2025-09-11", title: "Orientation Program" },
  { id: 2, op: "Bharath University", date: "2025-09-12", title: "Faculty Interview" },
  { id: 3, op: "Malla Reddy University", date: "2025-09-13", title: "Board Meeting" },
  { id: 4, op: "Jamal Mohammad College", date: "2025-09-13", title: "Research Workshop" },
  { id: 5, op: "Crescent University", date: "2025-09-17", title: "Campus Site Visit" },
  { id: 6, op: "Bishop Herber College", date: "2025-09-20", title: "Academic Review" },
  { id: 7, op: "Vels University", date: "2025-09-25", title: "Graduation Ceremony" },
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
  return date.toLocaleDateString();
};
const isSameMonth = (d1,d2) => d1.getMonth()===d2.getMonth() && d1.getFullYear()===d2.getFullYear();
const isSameDay = (d1,d2) => d1.getDate()===d2.getDate() && isSameMonth(d1,d2);

export default function MultiOpsCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 8));
  const [selectedOps, setSelectedOps] = useState(operationsList.map(op => op.name));
  const [events, setEvents] = useState(initialEvents);
  const [modalOpen, setModalOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventOp, setNewEventOp] = useState(operationsList[0].name);

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
  const deleteEvent = (id,e) => { e.stopPropagation(); setEvents(prev => prev.filter(ev=>ev.id!==id)); };

  // Add new event
  const openModal = (date) => { setNewEventDate(date); setNewEventTitle(""); setNewEventOp(operationsList[0].name); setModalOpen(true); };
  const saveEvent = () => {
    if (!newEventTitle) return alert("Enter event title");
    const newEv = { id: Date.now(), date: newEventDate.toISOString().split('T')[0], op: newEventOp, title: newEventTitle };
    setEvents(prev => [...prev,newEv]);
    setModalOpen(false);
  };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#f8fafc,#e0f2fe,#e8eaf6)',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'24px'}}>
        {/* Header */}
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
            <div style={{width:'48px',height:'48px',background:'linear-gradient(135deg,#3B82F6,#8B5CF6)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>📅</div>
            <h1 style={{fontSize:'48px',fontWeight:'bold',background:'linear-gradient(135deg,#1f2937,#4b5563)',backgroundClip:'text',WebkitBackgroundClip:'text',color:'transparent',margin:0}}>Multi-Operation Calendar</h1>
          </div>
          <p style={{color:'#6b7280',fontSize:'18px',margin:0}}>Manage all university operations and events</p>
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
              <div style={{fontSize:'24px',fontWeight:'bold',color:'#1f2937'}}>{format(currentMonth,"MMMM yyyy")}</div>
            </div>

            <div style={{display:'flex',flexWrap:'wrap',gap:'12px',justifyContent:'center'}}>
              {operationsList.map(op=>(
                <button key={op.name} onClick={()=>toggleOperation(op.name)} style={{
                  padding:'10px 20px',borderRadius:'25px',border:selectedOps.includes(op.name)?'none':`2px solid ${op.color}`,
                  background:selectedOps.includes(op.name)?op.bgColor:'white',color:selectedOps.includes(op.name)?'white':op.color,fontSize:'14px',fontWeight:'500',cursor:'pointer',transition:'all 0.3s'
                }}>{op.name}</button>
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
                <div key={iso} onClick={()=>inMonth && openModal(dateObj)} style={{
                  minHeight:'120px',padding:'12px',borderRadius:'12px',border:`2px solid ${today?'#3B82F6':'#e5e7eb'}`,
                  background:inMonth?'white':'#f9fafb',color:inMonth?'#1f2937':'#9ca3af',cursor:'pointer',position:'relative'
                }}>
                  <div style={{fontSize:'14px',fontWeight:'bold',marginBottom:'8px',color:today?'#3B82F6':(inMonth?'#1f2937':'#9ca3af')}}>{dateObj.getDate()}</div>
                  {today && <div style={{position:'absolute',top:'8px',right:'8px',width:'8px',height:'8px',background:'#3B82F6',borderRadius:'50%',animation:'pulse 2s infinite'}}/>}
                  <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                    {dayEvents.slice(0,3).map(ev=>{
                      const op = operationsList.find(o=>o.name===ev.op);
                      return (
                        <div key={ev.id} onClick={(e)=>deleteEvent(ev.id,e)} style={{background:op.bgColor,borderRadius:'8px',padding:'6px 12px',color:'white',fontSize:'12px',fontWeight:'500',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',paddingRight:'8px'}}>{ev.title}</span>
                          <span style={{fontSize:'10px',opacity:0.8}}>🗑️</span>
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
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{
          position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(0,0,0,0.5)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000
        }}>
          <div style={{background:'white',borderRadius:'16px',padding:'32px',minWidth:'320px',maxWidth:'400px',position:'relative'}}>
            <h2 style={{marginTop:0}}>Add New Event</h2>
            <p style={{marginBottom:'8px'}}>{format(newEventDate,'MMMM dd, yyyy')}</p>
            <input type="text" placeholder="Event Title" value={newEventTitle} onChange={e=>setNewEventTitle(e.target.value)} style={{width:'100%',padding:'8px 12px',marginBottom:'16px',borderRadius:'8px',border:'1px solid #d1d5db'}} />
            <select value={newEventOp} onChange={e=>setNewEventOp(e.target.value)} style={{width:'100%',padding:'8px 12px',marginBottom:'24px',borderRadius:'8px',border:'1px solid #d1d5db'}}>
              {operationsList.map(op=><option key={op.name} value={op.name}>{op.name}</option>)}
            </select>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'12px'}}>
              <button onClick={()=>setModalOpen(false)} style={{padding:'8px 16px',borderRadius:'8px',border:'1px solid #d1d5db'}}>Cancel</button>
              <button onClick={saveEvent} style={{padding:'8px 16px',borderRadius:'8px',background:'#3B82F6',color:'white',border:'none'}}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}

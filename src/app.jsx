function OnboardingScreen({onComplete}){
const[step,setStep]=useState(0);
const[prefs,setPrefs]=useState({goals:[],duration:3,audio:"arabic",reminder:"",school:""});
const[busy,setBusy]=useState(false);
const[error,setError]=useState("");
const goals=["A calmer daily rhythm","Understanding the words","Returning after salah","A private practice with family"];
const update=(key,value)=>setPrefs(current=>({...current,[key]:value}));
const finish=async()=>{
 setBusy(true);setError("");
 try{const client=await getSupabase();const{error:rpcError}=await client.rpc("save_dhikr_preferences",{p_preferences:{...prefs,onboardingCompleted:true}});if(rpcError)throw rpcError;onComplete({onboardingCompleted:true,preferences:prefs,reflections:[],savedItems:[]});}
 catch(err){setError(err.message||"Your preferences could not be saved. Please try again.");}
 finally{setBusy(false);}
};
return <main className="onboarding-shell">
 <section className="onboarding-card anim-up" aria-labelledby="welcome-title">
  <div className="eyebrow">A private daily practice</div><div className="ornament" aria-hidden="true">✦</div>
  <div className="step-count">0{step+1} / 03</div>
  {step===0&&<><h1 id="welcome-title">Begin at your own pace.</h1><p>Choose what you hope remembrance makes room for. These preferences are private and can be changed later.</p><div className="choice-list">{goals.map(goal=><label className={`choice ${prefs.goals.includes(goal)?"selected":""}`} key={goal}><input type="checkbox" checked={prefs.goals.includes(goal)} onChange={()=>update("goals",prefs.goals.includes(goal)?prefs.goals.filter(item=>item!==goal):[...prefs.goals,goal])}/><span>{goal}</span></label>)}</div></>}
  {step===1&&<><h1>A practice that fits today.</h1><p>Small and consistent is enough. You can always linger when the moment allows.</p><div className="duration-grid">{[1,3,5].map(minutes=><button className={`duration ${prefs.duration===minutes?"selected":""}`} onClick={()=>update("duration",minutes)} key={minutes}><strong>{minutes}</strong><span>minute{minutes>1?"s":""}</span></button>)}</div><label className="field-label">Recitation preference<select value={prefs.audio} onChange={e=>update("audio",e.target.value)}><option value="arabic">Arabic recitation</option><option value="both">Arabic with English meaning</option><option value="english">English meaning</option></select></label></>}
  {step===2&&<><h1>Set a gentle invitation.</h1><p>A reminder is optional. The purpose is to make returning easier, never to make you feel behind.</p><label className="field-label">Preferred reminder time<input type="time" value={prefs.reminder} onChange={e=>update("reminder",e.target.value)}/></label><label className="field-label">School of thought <small>(optional)</small><select value={prefs.school} onChange={e=>update("school",e.target.value)}><option value="">No preference</option><option>Hanafi</option><option>Maliki</option><option>Shafi'i</option><option>Hanbali</option><option>Other / prefer not to say</option></select></label><div className="boundary-note">The Dhikr Challenge supports practice and learning. It does not give personal religious rulings.</div></>}
  {error&&<div role="alert" className="form-error">{error}</div>}
  <div className="onboard-actions">{step>0&&<button className="quiet-button" onClick={()=>setStep(step-1)}>Back</button>}<button className="primary-button" disabled={busy} onClick={step===2?finish:()=>setStep(step+1)}>{busy?"Saving…":step===2?"Enter today’s practice":"Continue"}</button></div>
 </section>
</main>;
}
function App({user,onLogout}){
const[page,setPage]=useState("home");
const[data,setData]=useState(freshData);
const[loadingProgress,setLoadingProgress]=useState(true);
const[progressError,setProgressError]=useState("");
const[circles,setCircles]=useState([]);
const[selectedCircle,setSelectedCircle]=useState(null);
const[circleMembers,setCircleMembers]=useState([]);
const[circleToday,setCircleToday]=useState(null);
const[circleIntention,setCircleIntention]=useState("");
const[intentionBusy,setIntentionBusy]=useState(false);
const[circleName,setCircleName]=useState("");
const[inviteCode,setInviteCode]=useState("");
const[circleBusy,setCircleBusy]=useState(false);
const[circleError,setCircleError]=useState("");
const[activeTasbih,setActiveTasbih]=useState(null);
const[showDetail,setShowDetail]=useState(null);
const[experience,setExperience]=useState(null);
const[experienceError,setExperienceError]=useState("");
const[showSettings,setShowSettings]=useState(false);
const[arabicSize,setArabicSize]=useState(()=>Number(localStorage.getItem("dhikr-arabic-size")||32));
const[showTransliteration,setShowTransliteration]=useState(true);
const[pendingReflection,setPendingReflection]=useState(null);
const[reflectionMood,setReflectionMood]=useState("reflective");
const[reflectionNote,setReflectionNote]=useState("");
const[reflectionBusy,setReflectionBusy]=useState(false);
const userName=(user.user_metadata?.display_name||user.email?.split("@")[0]||"Friend").split(" ")[0];
useEffect(()=>{
let active=true;
 Promise.allSettled([
loadUserData(),
 getSupabase().then(client=>client.rpc("my_dhikr_circles")),
 getSupabase().then(client=>client.rpc("my_dhikr_experience"))
])
.then(results=>{if(!active)return;
 const[progressResult,circleResult,experienceResult]=results;
if(progressResult.status==="fulfilled")setData(progressResult.value);
else setProgressError("Your progress could not be loaded. Your account is safe — try refreshing.");
if(circleResult.status==="fulfilled"&&!circleResult.value.error){
const nextCircles=Array.isArray(circleResult.value.data)?circleResult.value.data:[];
setCircles(nextCircles);
setSelectedCircle(current=>current||nextCircles[0]||null);
}else setCircleError("Your circles are temporarily unavailable.");
 if(experienceResult.status==="fulfilled"&&!experienceResult.value.error)setExperience(experienceResult.value.data||{});
 else {setExperience({onboardingCompleted:true});setExperienceError("Preferences are temporarily unavailable.");}
})
.finally(()=>{if(active)setLoadingProgress(false);});
return()=>{active=false;};
},[user.id]);
useEffect(()=>{
 const preferred=experience?.preferences?.audio;
 if(preferred)try{localStorage.setItem("dhikr-recitation-mode",preferred);}catch(error){}
},[experience?.preferences?.audio]);
if(experience===null)return <div className="app-loading"><div className="loading-line"/><span>Preparing your practice</span></div>;
if(!experience.onboardingCompleted)return <OnboardingScreen onComplete={setExperience}/>;
const completedDhikr=data.completedToday;
const totalCompletions=data.totalCompletions;
const releasedDhikr=useMemo(dailyDhikr,[]);
const currentDhikr=releasedDhikr[0];
const refreshExperience=async(clientArg)=>{
 const client=clientArg||await getSupabase();
 const{data:next,error}=await client.rpc("my_dhikr_experience");
 if(error)throw error;
 setExperience(next||{});
 return next||{};
};
const savedKeys=new Set((experience.savedItems||[]).map(item=>`${item.itemType||item.item_type||item.type}:${item.itemId||item.item_id||item.id}`));
const toggleSavedItem=async(type,id)=>{
 try{
  const client=await getSupabase();
  const{error}=await client.rpc("toggle_saved_item",{p_item_type:type,p_item_id:id});
  if(error)throw error;
  await refreshExperience(client);
 }catch(error){setProgressError(error.message||"This item could not be saved.");}
};
const completeDhikr=async(dhikr)=>{
try{
const client=await getSupabase();
const{data:next,error}=await client.rpc("complete_daily_dhikr",{p_dhikr_id:dhikr.id});
if(error)throw error;
setData(await loadUserData());
setActiveTasbih(null);
setReflectionMood("reflective");
setReflectionNote("");
setPendingReflection(dhikr);
}catch(error){
setProgressError(error.message||"Completion could not be saved.");
}
};
const saveReflection=async()=>{
 if(!pendingReflection)return;
 setReflectionBusy(true);
 try{
  const client=await getSupabase();
  const{error}=await client.rpc("save_dhikr_reflection",{p_dhikr_id:pendingReflection.id,p_mood:reflectionMood,p_note:reflectionNote.trim()});
  if(error)throw error;
  await refreshExperience(client);
  setPendingReflection(null);
 }catch(error){setProgressError(error.message||"Your reflection could not be saved.");}
 finally{setReflectionBusy(false);}
};
useEffect(()=>{
if(!selectedCircle||page!=="circles")return;
let active=true;
 getSupabase().then(async client=>{
 const today=await client.rpc("circle_today",{p_circle_id:selectedCircle.id});
 if(today.error)throw today.error;
 if(active){setCircleMembers(today.data?.members||[]);setCircleToday(today.data||{});setCircleIntention(today.data?.intention||"");}
 })
.catch(error=>{if(active)setCircleError(error.message||"Could not load circle activity.");});
return()=>{active=false;};
},[selectedCircle?.id,page]);
const saveCircleIntention=async()=>{
 if(!selectedCircle)return;setIntentionBusy(true);setCircleError("");
 try{const client=await getSupabase();const{error}=await client.rpc("set_circle_intention",{p_circle_id:selectedCircle.id,p_intention:circleIntention.trim()});if(error)throw error;setCircleToday(current=>({...current,intention:circleIntention.trim()}));}
 catch(error){setCircleError(error.message||"Could not save the circle intention.");}finally{setIntentionBusy(false);}
};
const refreshCircles=async()=>{
const client=await getSupabase();
const{data,error}=await client.rpc("my_dhikr_circles");
if(error)throw error;
const next=Array.isArray(data)?data:[];
setCircles(next);
setSelectedCircle(current=>next.find(c=>c.id===current?.id)||next[0]||null);
return next;
};
const createCircle=async()=>{
if(!circleName.trim())return;
setCircleBusy(true);setCircleError("");
try{
const client=await getSupabase();
const{data,error}=await client.rpc("create_dhikr_circle",{p_name:circleName.trim()});
if(error)throw error;
setCircleName("");
const next=await refreshCircles();
setSelectedCircle(next.find(c=>c.id===data?.id)||next[0]||null);
}catch(error){setCircleError(error.message||"Could not create circle.");}
finally{setCircleBusy(false);}
};
const joinCircle=async()=>{
if(!inviteCode.trim())return;
setCircleBusy(true);setCircleError("");
try{
const client=await getSupabase();
const{data,error}=await client.rpc("join_dhikr_circle",{p_invite_code:inviteCode.trim()});
if(error)throw error;
setInviteCode("");
const next=await refreshCircles();
setSelectedCircle(next.find(c=>c.id===data?.id)||next[0]||null);
}catch(error){setCircleError(error.message||"Could not join circle.");}
finally{setCircleBusy(false);}
};
const savePreferences=async(next)=>{
 const client=await getSupabase();const{error}=await client.rpc("save_dhikr_preferences",{p_preferences:next});
 if(error)throw error;await refreshExperience(client);
};
function SettingsPanel(){
 const prefs=experience.preferences||{};
 const[form,setForm]=useState({...prefs});
 const[saving,setSaving]=useState(false);
 const goals=["A calmer daily rhythm","Understanding the words","Returning after salah","A private practice with family"];
 const toggleGoal=goal=>setForm(current=>({...current,goals:(current.goals||[]).includes(goal)?current.goals.filter(item=>item!==goal):[...(current.goals||[]),goal]}));
 const submit=async()=>{setSaving(true);try{await savePreferences({...form,onboardingCompleted:true});setShowSettings(false);}catch(error){setProgressError(error.message||"Preferences could not be saved.");}finally{setSaving(false);}};
 return <div className="settings-overlay" onClick={()=>setShowSettings(false)}><section className="settings-panel" onClick={event=>event.stopPropagation()}><div className="eyebrow">Your practice</div><h2>Preferences</h2><p className="panel-copy">Adjust the shape of your daily return. Nothing here is public.</p><div className="field-label">Practice intentions<div className="choice-list compact">{goals.map(goal=><label className={`choice ${(form.goals||[]).includes(goal)?"selected":""}`} key={goal}><input type="checkbox" checked={(form.goals||[]).includes(goal)} onChange={()=>toggleGoal(goal)}/><span>{goal}</span></label>)}</div></div><label className="field-label">Practice duration<select value={form.duration||3} onChange={e=>setForm({...form,duration:Number(e.target.value)})}>{[1,3,5].map(value=><option key={value} value={value}>{value} minutes</option>)}</select></label><label className="field-label">Audio preference<select value={form.audio||"arabic"} onChange={e=>setForm({...form,audio:e.target.value})}><option value="arabic">Arabic recitation</option><option value="both">Arabic with English meaning</option><option value="english">English meaning</option></select></label><label className="field-label">Reminder time<input type="time" value={form.reminder||""} onChange={e=>setForm({...form,reminder:e.target.value})}/></label><label className="field-label">School of thought <small>(optional)</small><select value={form.school||""} onChange={e=>setForm({...form,school:e.target.value})}><option value="">No preference</option><option>Hanafi</option><option>Maliki</option><option>Shafi'i</option><option>Hanbali</option><option>Other / prefer not to say</option></select></label><div className="onboard-actions"><button className="quiet-button" onClick={()=>setShowSettings(false)}>Cancel</button><button className="primary-button" onClick={submit} disabled={saving}>{saving?"Saving…":"Save preferences"}</button></div></section></div>;
}
function HomePage(){
const challengeCompleted=completedDhikr.includes(currentDhikr.id);
const window=practiceWindow();
const todaysHadith=dailyHadith();
const practiceDhikr=releasedDhikr.slice(0,(experience.preferences?.duration||3)===1?1:2);
const completedReleases=practiceDhikr.filter(d=>completedDhikr.includes(d.id)).length;
const journeyProgress=completedReleases/practiceDhikr.length;
return(
<div style={{height:"100%",overflowY:"auto",padding:"16px 16px 100px"}}>
<div className="anim-up" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<div>
<div style={{fontFamily:"var(--arabic)",fontSize:14,color:"var(--amber)",marginBottom:2,direction:"rtl"}}>بِسْمِ ٱللَّهِ</div>
<div style={{fontFamily:"var(--serif)",fontSize:22,fontWeight:400,letterSpacing:"-0.02em"}}>The Dhikr Challenge</div>
<div style={{fontSize:12,color:"var(--text2)",marginTop:2,fontFamily:"var(--body)"}}>Welcome back, {userName}</div>
</div>
<button className="quiet-button" onClick={()=>setShowSettings(true)}>Preferences</button>
</div>
<div className="ritual-plan anim-up d1"><div><div className="eyebrow">Today’s intention</div><div className="ritual-intention">{(experience.preferences?.goals||[])[0]||"Return to remembrance with presence"}</div><div className="ritual-meta">{experience.preferences?.duration||3} minute practice · Learn → Listen → Count → Reflect</div></div><button className="quiet-button" onClick={()=>setShowSettings(true)}>Adjust</button></div>
<div className="anim-up d1" style={{background:"linear-gradient(135deg,var(--surface),var(--bg2))",borderRadius:18,padding:20,border:"1px solid var(--green-mid)",marginBottom:16,position:"relative",overflow:"hidden"}}>
<div style={{position:"absolute",right:-26,top:-26,width:120,height:120,borderRadius:"50%",background:"radial-gradient(circle,var(--green-dim),transparent 70%)",pointerEvents:"none"}}/>
<div style={{position:"relative",zIndex:1}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
<div>
<div style={{fontSize:10,color:"var(--green2)",fontFamily:"var(--font)",fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",marginBottom:6}}>Today’s daily challenge</div>
<div style={{fontFamily:"var(--serif)",fontSize:21,color:"var(--text)"}}>{window.label}</div>
<div style={{fontSize:12,color:"var(--text2)",marginTop:4,lineHeight:1.5}}>{window.note}</div>
</div>
<div style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--green2)",whiteSpace:"nowrap"}}>{completedReleases}/{practiceDhikr.length}</div>
</div>
<div style={{height:6,background:"var(--raised)",borderRadius:4,overflow:"hidden",marginTop:16}}>
<div style={{height:"100%",width:`${journeyProgress*100}%`,background:"linear-gradient(90deg,var(--green),var(--amber))",borderRadius:4,transition:"width .5s var(--ease)"}}/>
</div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,fontSize:11,color:"var(--text3)"}}>
<span>{completedReleases===practiceDhikr.length?"Today’s practice is complete — carry the calm with you.":practiceDhikr.length===1?"One focused release. No pressure, just return.":"Two focused releases. No pressure, just return."}</span>
<span style={{color:"var(--green2)",fontWeight:600}}>{completedReleases===practiceDhikr.length?"Complete":"Begin"}</span>
</div>
</div>
</div>
<div className="anim-up d2" style={{background:"linear-gradient(135deg,var(--surface),var(--bg2))",borderRadius:20,padding:24,border:"1px solid var(--amber-mid)",marginBottom:16,position:"relative",overflow:"hidden"}}>
<div className="geo-pattern" style={{position:"absolute",inset:0,opacity:0.5,pointerEvents:"none"}}/>
<div style={{position:"absolute",top:-40,right:-40,width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle,var(--amber-dim),transparent 70%)",animation:"breathe 6s ease-in-out infinite",pointerEvents:"none"}}/>
<div style={{position:"relative",zIndex:2}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
<div>
<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Today's Challenge · Day {dailyChallengeNumber()}</div>
<div style={{fontFamily:"var(--arabic)",fontSize:30,color:"var(--amber2)",direction:"rtl",lineHeight:1.3}}>{currentDhikr.arabic}</div>
</div>
<span style={{fontSize:28}}>{currentDhikr.icon}</span>
</div>
<div style={{fontFamily:"var(--serif)",fontSize:15,fontStyle:"italic",color:"var(--text)",marginBottom:4}}>{currentDhikr.transliteration}</div>
<div style={{fontSize:13,color:"var(--text2)",marginBottom:16}}>{currentDhikr.meaning} — {currentDhikr.target}×</div>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:16}}>
<span style={{fontSize:10,color:"var(--text3)"}}>Arabic-only recitation available</span>
<RecitationControls dhikr={currentDhikr} compact/>
</div>
{!challengeCompleted?(
<button onClick={()=>setActiveTasbih(currentDhikr)} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:"var(--amber)",color:"var(--bg)",fontSize:14,fontWeight:600,fontFamily:"var(--font)",letterSpacing:"0.02em"}}>
Begin Dhikr · {currentDhikr.target}×
</button>
):(
<div style={{background:"var(--green-dim)",border:"1px solid rgba(92,184,112,0.2)",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
<div>
<div style={{fontSize:13,color:"var(--green)",fontWeight:500}}>Challenge completed — MashaAllah!</div>
<div style={{fontSize:11,color:"var(--text3)"}}>Your reflection can stay private to you.</div>
</div>
</div>
)}
</div>
</div>
{practiceDhikr[1]&&(()=>{
const d=practiceDhikr[1],done=completedDhikr.includes(d.id);
return <div className="anim-up d2" style={{background:"var(--surface)",borderRadius:16,padding:18,border:"1px solid var(--border2)",marginBottom:16}}>
<div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
<div style={{fontSize:24}}>{d.icon}</div>
<div style={{flex:1}}>
<div style={{fontSize:10,color:"var(--green)",textTransform:"uppercase",letterSpacing:".1em"}}>Today's second release</div>
<div style={{fontFamily:"var(--arabic)",fontSize:22,color:"var(--text)",direction:"rtl",textAlign:"left"}}>{d.arabic}</div>
<div style={{fontSize:12,color:"var(--text2)"}}>{d.transliteration} · {d.target}{d.unit?" "+d.unit:"×"}</div>
</div>
<RecitationControls dhikr={d} compact/>
</div>
{!done?<button onClick={()=>setActiveTasbih(d)} style={{width:"100%",padding:12,borderRadius:9,border:"1px solid var(--green-mid)",background:"var(--green-dim)",color:"var(--green2)",fontWeight:600}}>Begin Dhikr · {d.target}{d.unit?" "+d.unit:"×"}</button>
:<div style={{padding:11,borderRadius:9,background:"var(--green-dim)",color:"var(--green)",textAlign:"center",fontSize:12}}>Completed today — MashaAllah</div>}
</div>;
})()}
<div className="anim-up d3" style={{background:"var(--surface)",borderRadius:16,padding:20,border:"1px solid var(--border)",marginBottom:16}}>
<div style={{fontSize:12,color:"var(--amber)",fontWeight:600,marginBottom:12}}>Practice, held privately</div>
<div style={{fontSize:12,color:"var(--text3)",lineHeight:1.6}}>Your remembrance is not a public score. If you would like company, a private circle offers a gentle view of shared participation.</div>
</div>
<div className="anim-up d3" style={{background:"var(--surface)",borderRadius:16,padding:20,border:"1px solid var(--border)",marginBottom:16}}>
<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Why This Dhikr Matters</div>
<p style={{fontFamily:"var(--body)",fontSize:14,lineHeight:1.75,color:"var(--text)",marginBottom:16}}>{currentDhikr.significance}</p>
<div style={{borderTop:"1px solid var(--border2)",paddingTop:14}}>
<div style={{fontSize:10,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6}}>A reflection for practice</div>
<p style={{fontFamily:"var(--serif)",fontSize:14,fontStyle:"italic",lineHeight:1.7,color:"var(--text2)"}}>{currentDhikr.practiceReflection}</p>
<div style={{fontSize:10,color:"var(--text3)",lineHeight:1.5,marginTop:8}}>A meditation, not a hadith or fatwa. For rulings or personal guidance, ask a qualified scholar.</div>
</div>
</div>
<div className="anim-up d3" style={{background:"linear-gradient(135deg,var(--bg2),var(--surface))",borderRadius:16,padding:20,border:"1px solid var(--green-mid)",marginBottom:16}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10}}>
<div style={{fontSize:11,color:"var(--green2)",fontFamily:"var(--font)",fontWeight:600,textTransform:"uppercase",letterSpacing:".1em"}}>A hadith to carry</div>
<div style={{fontSize:10,color:"var(--text3)"}}>{todaysHadith.theme}</div>
</div>
<div style={{fontFamily:"var(--serif)",fontSize:15,lineHeight:1.7,color:"var(--text)"}}>{todaysHadith.text}</div>
<div style={{marginTop:12}}>
<div style={{fontSize:10,color:"var(--text3)"}}>Paraphrase · {todaysHadith.reference}</div>
</div>
</div>
<div className="anim-up d4" style={{marginBottom:16}}>
<div style={{fontSize:13,fontWeight:500,color:"var(--text)",marginBottom:10}}>Today's Released Adhkar</div>
{releasedDhikr.map(d=>{
const done=completedDhikr.includes(d.id);
return(
<div key={d.id} onClick={()=>setShowDetail(d)}
style={{display:"flex",alignItems:"center",gap:14,padding:"14px 0",borderBottom:"1px solid var(--border)",cursor:"pointer"}}>
<div style={{width:42,height:42,borderRadius:12,background:done?"var(--amber-dim)":"var(--raised)",border:`1px solid ${done?"var(--amber-mid)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
{d.icon}
</div>
<div style={{flex:1,minWidth:0}}>
<div style={{display:"flex",alignItems:"center",gap:6}}>
<span style={{fontSize:14,fontWeight:500,color:done?"var(--amber2)":"var(--text)"}}>{d.transliteration}</span>
{done&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"var(--green-dim)",color:"var(--green)",fontWeight:600}}>Done</span>}
</div>
<div style={{fontSize:12,color:"var(--text3)"}}>
{d.meaning} · {d.target}{d.unit?" "+d.unit:"×"}
</div>
</div>
<div style={{fontSize:11,color:"var(--amber)",fontWeight:500}}>{done?"Complete":"Open"}</div>
</div>
);
})}
</div>
</div>
);
}
function CirclesPage(){
const[copied,setCopied]=useState(false);
const[shared,setShared]=useState(false);
const copyInvite=async()=>{
if(!selectedCircle?.inviteCode)return;
try{
await navigator.clipboard.writeText(selectedCircle.inviteCode);
setCopied(true);
setTimeout(()=>setCopied(false),1800);
}catch(error){setCopied(false);}
};
const shareInvite=async()=>{
if(!selectedCircle?.inviteCode)return;
const text=`Join my private Dhikr Challenge circle “${selectedCircle.name}” with invite code ${selectedCircle.inviteCode}.`;
try{
if(navigator.share){
await navigator.share({title:"Join my Dhikr Challenge circle",text});
setShared(true);
setTimeout(()=>setShared(false),1800);
}else{
await navigator.clipboard.writeText(text);
setShared(true);
setTimeout(()=>setShared(false),1800);
}
}catch(error){}
};
return(
<div style={{height:"100%",overflowY:"auto",padding:"24px 20px 110px",maxWidth:720,margin:"0 auto"}}>
<div className="anim-up" style={{marginBottom:24}}>
<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",marginBottom:7}}>Practice together</div>
<div style={{fontFamily:"var(--serif)",fontSize:30}}>Your circles</div>
<div style={{fontSize:13,color:"var(--text2)",lineHeight:1.65,marginTop:6}}>Invite the people you love. See who has shown up for today’s challenge without turning worship into a competition.</div>
</div>
<div className="anim-up d1" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,marginBottom:18}}>
<div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:14,padding:16}}>
<div style={{fontSize:11,color:"var(--green2)",fontWeight:600,marginBottom:10}}>Create a circle</div>
<div style={{display:"flex",gap:7}}>
<input value={circleName} onChange={e=>setCircleName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createCircle()} placeholder="Family, friends, halaqah"
style={{flex:1,minWidth:0,padding:"10px 11px",borderRadius:8,border:"1px solid var(--border2)",background:"var(--bg2)",color:"var(--text)",fontFamily:"var(--font)",fontSize:12,outline:"none"}}/>
<button onClick={createCircle} disabled={circleBusy||!circleName.trim()} style={{padding:"10px 12px",borderRadius:8,border:"none",background:"var(--amber)",color:"var(--bg)",fontWeight:600,fontSize:11,opacity:(circleBusy||!circleName.trim())?.6:1}}>Create</button>
</div>
</div>
<div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:14,padding:16}}>
<div style={{fontSize:11,color:"var(--green2)",fontWeight:600,marginBottom:10}}>Join with an invite code</div>
<div style={{display:"flex",gap:7}}>
<input value={inviteCode} onChange={e=>setInviteCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g,""))} onKeyDown={e=>e.key==="Enter"&&joinCircle()} placeholder="Invite code" maxLength={32}
style={{flex:1,minWidth:0,padding:"10px 11px",borderRadius:8,border:"1px solid var(--border2)",background:"var(--bg2)",color:"var(--text)",fontFamily:"var(--mono)",fontSize:12,letterSpacing:".12em",outline:"none"}}/>
<button onClick={joinCircle} disabled={circleBusy||![8,32].includes(inviteCode.trim().length)} style={{padding:"10px 12px",borderRadius:8,border:"1px solid var(--green-mid)",background:"var(--green-dim)",color:"var(--green2)",fontWeight:600,fontSize:11,opacity:(circleBusy||![8,32].includes(inviteCode.trim().length))?.6:1}}>Join</button>
</div>
</div>
</div>
{circleError&&<div style={{background:"var(--rose-dim)",border:"1px solid rgba(196,122,122,.25)",color:"var(--rose)",borderRadius:10,padding:"10px 12px",fontSize:12,marginBottom:14}}>{circleError}</div>}
{circles.length===0?(
<div className="anim-up d2" style={{background:"linear-gradient(135deg,var(--surface),var(--bg2))",border:"1px dashed var(--border2)",borderRadius:18,padding:"34px 22px",textAlign:"center"}}>
<div style={{fontFamily:"var(--serif)",fontSize:22,marginBottom:6}}>Make remembrance a shared habit</div>
<div style={{fontSize:12,color:"var(--text2)",lineHeight:1.6,maxWidth:360,margin:"0 auto"}}>Create a circle for your household or join one with an invite code. Your circle will appear here after the first person joins.</div>
</div>
):(
<>
<div className="anim-up d2" style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:12}}>
{circles.map(circle=>(
<button key={circle.id} onClick={()=>{setSelectedCircle(circle);setCircleError("");}}
style={{whiteSpace:"nowrap",padding:"9px 13px",borderRadius:18,border:`1px solid ${selectedCircle?.id===circle.id?"var(--amber-mid)":"var(--border2)"}`,background:selectedCircle?.id===circle.id?"var(--amber-dim)":"var(--surface)",color:selectedCircle?.id===circle.id?"var(--amber2)":"var(--text2)",fontSize:12,fontFamily:"var(--font)",fontWeight:selectedCircle?.id===circle.id?600:400}}>
{circle.name} · {circle.memberCount}
</button>
))}
</div>
{selectedCircle&&(
<div className="anim-up d3" style={{background:"var(--surface)",border:"1px solid var(--amber-mid)",borderRadius:18,padding:20}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:18}}>
<div>
<div style={{fontSize:10,color:"var(--amber)",fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",marginBottom:6}}>Today in</div>
<div style={{fontFamily:"var(--serif)",fontSize:25}}>{selectedCircle.name}</div>
<div style={{fontSize:11,color:"var(--text3)",marginTop:4}}>{selectedCircle.memberCount} {selectedCircle.memberCount===1?"member":"members"} · private circle</div>
</div>
<div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
<button onClick={copyInvite} aria-label="Copy circle invite code" style={{padding:"8px 10px",borderRadius:8,border:"1px solid var(--border2)",background:"var(--bg2)",color:"var(--text2)",fontSize:10,fontFamily:"var(--mono)"}}>
{copied?"Copied!":"Invite "+selectedCircle.inviteCode}
</button>
<button onClick={shareInvite} aria-label="Share circle invite" style={{padding:"8px 10px",borderRadius:8,border:"1px solid var(--green-mid)",background:"var(--green-dim)",color:"var(--green2)",fontSize:10,fontFamily:"var(--mono)"}}>
{shared?"Shared!":"Share"}
</button>
</div>
</div>
<div style={{fontSize:11,color:"var(--text3)",lineHeight:1.5,marginBottom:14}}>A gentle view of who has engaged with today’s Daily Challenge. No counts, streaks, scores, or personal details are shared.</div>
<div style={{margin:"0 0 16px",padding:"14px",background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:10}}>
<div style={{fontSize:10,color:"var(--amber)",fontWeight:600,textTransform:"uppercase",letterSpacing:".1em",marginBottom:7}}>Today’s shared intention</div>
{selectedCircle.ownerId===user.id?<div style={{display:"flex",gap:8}}><input aria-label="Circle intention" value={circleIntention} onChange={e=>setCircleIntention(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveCircleIntention()} placeholder="A small intention for the circle" style={{flex:1,minWidth:0,padding:"10px",background:"var(--surface)",border:"1px solid var(--border2)",color:"var(--text)",fontFamily:"var(--font)"}}/><button onClick={saveCircleIntention} disabled={intentionBusy} style={{padding:"9px 12px",background:"var(--amber-dim)",border:"1px solid var(--amber-mid)",color:"var(--amber2)",fontWeight:600,fontSize:11}}>{intentionBusy?"Saving":"Save"}</button></div>:<div style={{fontFamily:"var(--body)",fontSize:13,color:"var(--text2)"}}>{circleToday?.intention||"The circle has not set an intention yet."}</div>}
{circleToday?.intention&&<div style={{fontFamily:"var(--body)",fontSize:12,color:"var(--text2)",marginTop:9}}>Held by the circle: {circleToday.intention}</div>}
</div>
<div style={{borderTop:"1px solid var(--border)",paddingTop:4}}>
{circleMembers.length?circleMembers.map((member,i)=>(
<div key={`${member.name}-${i}`} style={{display:"flex",alignItems:"center",gap:11,padding:"12px 0",borderBottom:i<circleMembers.length-1?"1px solid var(--border)":"none"}}>
<div style={{width:32,height:32,borderRadius:"50%",background:member.completedToday?"var(--green-dim)":"var(--raised)",border:`1px solid ${member.completedToday?"var(--green-mid)":"var(--border2)"}`,display:"grid",placeItems:"center",fontSize:13}}>{member.completedToday?"✓":"·"}</div>
<div style={{flex:1,minWidth:0}}>
<div style={{fontSize:13,color:member.currentUser?"var(--amber2)":"var(--text)",fontWeight:member.currentUser?600:400}}>{member.name}{member.currentUser?" · you":""}</div>
<div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{member.completedToday?"Joined today’s practice":"Not yet today"}</div>
</div>
</div>
)):<div style={{padding:"22px 0",textAlign:"center",fontSize:12,color:"var(--text3)"}}>Loading your circle…</div>}
</div>
</div>
)}
</>
)}
</div>
);
}
function ProgressPage(){
const series=useMemo(()=>{
const map={};
data.history.forEach(h=>{map[h.date]=h;});
const out=[];
for(let i=13;i>=0;i--){
const ds=dateNDaysAgo(i);
out.push({date:ds,completions:map[ds]?map[ds].completions:0});
}
return out;
},[data.history]);
const maxC=Math.max(1,...series.map(s=>s.completions));
const activeDays=data.history.filter(h=>h.completions>0).length;
return(
<div style={{height:"100%",overflowY:"auto",padding:"16px 16px 100px"}}>
<div className="anim-up" style={{marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
<div>
<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6}}>Spiritual Journey</div>
<div style={{fontFamily:"var(--serif)",fontSize:26,fontWeight:400}}>A quiet record of returning</div>
<div style={{fontSize:12,color:"var(--text2)",marginTop:2}}>{userName}</div>
</div>
<button onClick={onLogout}
style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:8,padding:"8px 14px",color:"var(--text2)",fontSize:11,fontFamily:"var(--mono)",letterSpacing:"0.04em",textTransform:"uppercase"}}>
Sign Out
</button>
</div>
<div className="anim-up d1" style={{background:"var(--surface)",borderRadius:20,padding:22,border:"1px solid var(--border)",marginBottom:16,position:"relative",overflow:"hidden"}}>
<div className="geo-pattern" style={{position:"absolute",inset:0,opacity:0.4,pointerEvents:"none"}}/>
<div style={{position:"relative",zIndex:2}}>
<div className="eyebrow">Your week in practice</div><div className="journey-big">{data.practiceMinutes||0}<span> minutes</span></div><div style={{fontSize:12,color:"var(--text2)"}}>A record of time given, not a measure of faith.</div>
</div>
</div>
<div className="anim-up d2" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
{[
{v:data.weekActiveDays||0,l:"active days"},
{v:data.exploredDhikr||0,l:"phrases explored"},
{v:(experience.reflections||[]).length,l:"saved reflections"},
].map((s,i)=>(
<div key={i} style={{background:"var(--surface)",borderRadius:12,padding:"16px 10px",border:"1px solid var(--border)",textAlign:"center"}}>
<div style={{fontSize:18,marginBottom:4}}>{s.i}</div>
<div style={{fontSize:20,fontWeight:600,color:"var(--amber)",fontFamily:"var(--serif)"}}>{s.v}</div>
<div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{s.l}</div>
</div>
))}
</div>
<div className="anim-up d3" style={{background:"var(--surface)",borderRadius:16,padding:20,border:"1px solid var(--border)",marginBottom:16}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em"}}>Last 14 Days</div>
<div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--font)"}}>{activeDays} active {activeDays===1?"day":"days"}</div>
</div>
{data.history.length===0?(
<div style={{textAlign:"center",padding:"20px 0",fontSize:12,color:"var(--text3)",fontFamily:"var(--body)",lineHeight:1.6}}>
Your journey starts today.<br/>Complete a dhikr to begin tracking your practice over time.
</div>
):(
<div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:4,height:110}}>
{series.map((s,i)=>{
const h=s.completions>0?Math.max(8,Math.round((s.completions/maxC)*90)):3;
const today=s.date===todayStr();
const dayNum=parseInt(s.date.slice(8),10);
return(
<div key={s.date} title={`${s.date} — ${s.completions} dhikr`} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5,height:"100%",justifyContent:"flex-end"}}>
{s.completions>0&&<div style={{fontSize:9,color:today?"var(--amber2)":"var(--text3)",fontFamily:"var(--mono)"}}>{s.completions}</div>}
<div style={{width:"100%",maxWidth:14,height:h,borderRadius:4,
background:s.completions>0?(today?"var(--amber)":"var(--green)"):"var(--raised)",
boxShadow:s.completions>0?`0 0 8px ${today?"var(--amber-glow)":"var(--green-glow)"}`:"none",
transition:"height 0.5s var(--ease)"}}/>
<div style={{fontSize:8,color:today?"var(--amber)":"var(--text3)",fontFamily:"var(--mono)"}}>{dayNum}</div>
</div>
);
})}
</div>
)}
</div>
{(experience.reflections||[]).length>0&&<div className="anim-up d3" style={{background:"var(--surface)",borderRadius:16,padding:20,border:"1px solid var(--border)",marginBottom:16}}>
<div className="eyebrow" style={{marginBottom:12}}>Recent reflections</div>
{experience.reflections.slice(0,4).map(item=><div key={`${item.dhikrId}-${item.date}`} className="reflection-row"><div><strong>{ADHKAR.find(d=>d.id===item.dhikrId)?.transliteration||"Daily practice"}</strong><span>{item.date} · {item.mood}</span></div>{item.note&&<p>{item.note}</p>}</div>)}
</div>}
<div className="anim-up d4" style={{background:"linear-gradient(135deg,var(--bg2),var(--surface))",borderRadius:16,padding:24,border:"1px solid var(--amber-dim)",textAlign:"center"}}>
<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--mono)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12}}>A quiet reminder</div>
<p style={{fontFamily:"var(--serif)",fontSize:16,fontStyle:"italic",lineHeight:1.7,color:"var(--text)",fontWeight:300}}>
Return gently to remembrance, and let it shape how you meet the next moment.
</p>
<div style={{fontSize:11,color:"var(--text3)",marginTop:10}}>A reflection from The Dhikr Challenge · not a historical quotation</div>
</div>
</div>
);
}
function LearnPage(){
const[section,setSection]=useState("adhkar");
const[category,setCategory]=useState("All");
const[savedOnly,setSavedOnly]=useState(false);
const categories=["All",...new Set(ADHKAR.map(d=>d.category))];
const savedFor=(type,id)=>savedKeys.has(`${type}:${id}`);
const librarySavedCount=[...savedKeys].filter(key=>/^(dhikr|quran|hadith):/.test(key)).length;
const visibleDhikr=(category==="All"?ADHKAR:ADHKAR.filter(d=>d.category===category)).filter(item=>!savedOnly||savedFor("dhikr",item.id));
const sections=[
{id:"adhkar",label:"Adhkar"},
{id:"quran",label:"Qur’an"},
{id:"hadith",label:"Hadith"},
{id:"arabic",label:"Arabic"},
{id:"guidance",label:"Guidance"},
{id:"tools",label:"Tools"},
];
return(
<div style={{height:"100%",overflowY:"auto",padding:"16px 16px 100px"}}>
<div className="anim-up" style={{marginBottom:24}}>
<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6}}>Knowledge</div>
<div style={{fontFamily:"var(--serif)",fontSize:26,fontWeight:400}}>A living practice</div>
<div style={{fontSize:13,color:"var(--text2)",marginTop:6,lineHeight:1.6}}>Learn the meaning, source, and moment behind each remembrance before you begin.</div>
<div style={{marginTop:12,padding:"11px 13px",borderRadius:10,background:"var(--amber-dim)",border:"1px solid var(--amber-mid)",fontSize:11,color:"var(--text2)",lineHeight:1.55}}>Sources are starting points for learning, not a substitute for a qualified scholar. Where a passage is a reflection, it is labeled as such.</div>
</div>
<div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:12,marginBottom:8,scrollbarWidth:"none"}}>
{sections.map(item=>(
<button key={item.id} onClick={()=>setSection(item.id)}
style={{whiteSpace:"nowrap",padding:"8px 13px",borderRadius:16,border:`1px solid ${section===item.id?"var(--amber-mid)":"var(--border2)"}`,background:section===item.id?"var(--amber-dim)":"var(--surface)",color:section===item.id?"var(--amber2)":"var(--text3)",fontSize:11,fontFamily:"var(--font)",fontWeight:section===item.id?600:400}}>
{item.label}
</button>
))}
</div>
<button className={`library-saved-toggle ${savedOnly?"active":""}`} onClick={()=>setSavedOnly(!savedOnly)}>{savedOnly?"Showing saved items":"Show saved items"} · {librarySavedCount}</button>
{section==="adhkar"&&<div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:12,marginBottom:8,scrollbarWidth:"none"}}>
{categories.map(item=>(
<button key={item} onClick={()=>setCategory(item)}
style={{whiteSpace:"nowrap",padding:"7px 11px",borderRadius:16,border:`1px solid ${category===item?"var(--green-mid)":"var(--border2)"}`,background:category===item?"var(--green-dim)":"var(--surface)",color:category===item?"var(--green2)":"var(--text3)",fontSize:11,fontFamily:"var(--font)",fontWeight:category===item?600:400}}>
{item}
</button>
))}
</div>}
{section==="adhkar"&&visibleDhikr.map((d,i)=>(
<div key={d.id} className={`anim-up d${Math.min(i+1,5)}`}
onClick={()=>setShowDetail(d)}
style={{background:"var(--surface)",borderRadius:14,padding:18,border:"1px solid var(--border)",marginBottom:10,cursor:"pointer",transition:"border-color 0.2s"}}
onMouseEnter={e=>e.currentTarget.style.borderColor="var(--amber-mid)"}
onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
<div style={{display:"flex",alignItems:"flex-start",gap:14}}>
<div style={{width:44,height:44,borderRadius:12,background:"var(--amber-dim)",border:"1px solid var(--amber-mid)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{d.icon}</div>
<div>
<div style={{fontFamily:"var(--arabic)",fontSize:20,color:"var(--amber2)",direction:"rtl",textAlign:"left",lineHeight:1.3}}>{d.arabic}</div>
<div style={{fontSize:14,fontWeight:500,color:"var(--text)",marginTop:4}}>{d.transliteration}</div>
<div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>{d.meaning}</div>
<div style={{fontSize:10,color:"var(--amber)",marginTop:6,fontFamily:"var(--font)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{d.category} · {d.source}</div>
<button className="save-button" onClick={event=>{event.stopPropagation();toggleSavedItem("dhikr",d.id);}}>{savedFor("dhikr",d.id)?"Saved":"Save for later"}</button>
</div>
</div>
</div>
))}
{section==="quran"&&(
<div>
<div style={{fontSize:12,color:"var(--text2)",lineHeight:1.6,marginBottom:14}}>Study Qur’an references inside Dhikr Challenge by the themes that meet daily life. These concise notes point to the passage; they are not translations or tafsir.</div>
<div className="reading-paths">
<div className="section-kicker">Three-passage reading paths</div>
{QURAN_READING_PATHS.map(path=><div className="reading-path" key={path.title}><strong>{path.title}</strong><p>{path.description}</p><div>{path.items.map(id=>{const passage=QURAN_REFERENCES.find(item=>item.id===id);return <button key={id} onClick={()=>toggleSavedItem("quran",id)} className={savedFor("quran",id)?"saved":""}>{passage.reference}{savedFor("quran",id)?" · saved":""}</button>;})}</div></div>)}
</div>
{QURAN_REFERENCES.filter(item=>!savedOnly||savedFor("quran",item.id)).map((item,i)=>(
<div key={item.id} className={`anim-up d${Math.min(i+1,5)}`} style={{background:"var(--surface)",borderRadius:14,padding:18,border:"1px solid var(--border)",marginBottom:10}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:9}}>
<div style={{fontFamily:"var(--serif)",fontSize:18,color:"var(--green2)",fontWeight:500}}>{item.reference}</div>
<div style={{fontSize:10,color:"var(--text3)",textAlign:"right",maxWidth:"48%"}}>{item.theme}</div>
</div>
<div style={{fontSize:13,color:"var(--text2)",lineHeight:1.7}}>{item.meaning}</div>
<div style={{fontSize:10,color:"var(--amber)",marginTop:11,paddingTop:9,borderTop:"1px solid var(--border)"}}>Read the full passage in a trusted Qur’an edition before quoting it.</div>
<button className="save-button" onClick={()=>toggleSavedItem("quran",item.id)}>{savedFor("quran",item.id)?"Saved":"Save for later"}</button>
</div>
))}
</div>
)}
{section==="hadith"&&(
<div>
<div style={{fontSize:12,color:"var(--text2)",lineHeight:1.6,marginBottom:14}}>Short, referenced reminders to study alongside today’s practice. The wording below is a paraphrase; keep the collection and reference with it before sharing.</div>
{HADITHS.filter(item=>!savedOnly||savedFor("hadith",item.id)).map((item,i)=>(
<div key={item.id} className={`anim-up d${Math.min(i+1,5)}`} style={{background:"var(--surface)",borderRadius:14,padding:18,border:"1px solid var(--border)",marginBottom:10}}>
<div style={{display:"flex",justifyContent:"space-between",gap:12,marginBottom:8}}>
<div style={{fontSize:14,fontWeight:600,color:"var(--text)"}}>{item.title}</div>
<div style={{fontSize:10,color:"var(--green2)",whiteSpace:"nowrap"}}>{item.theme}</div>
</div>
<div style={{fontFamily:"var(--serif)",fontSize:14,lineHeight:1.7,color:"var(--text2)"}}>{item.text}</div>
<div style={{marginTop:12}}>
<div style={{fontSize:10,color:"var(--text3)"}}>{item.reference}</div>
<button className="save-button" onClick={()=>toggleSavedItem("hadith",item.id)}>{savedFor("hadith",item.id)?"Saved":"Save for later"}</button>
</div>
</div>
))}
</div>
)}
{section==="arabic"&&(
<div>
<div style={{fontSize:12,color:"var(--text2)",lineHeight:1.6,marginBottom:14}}>Learn the Arabic already used in your daily practice. Open any phrase to hear its recitation, review its meaning, and connect the words to a moment in your day.</div>
{ADHKAR.filter(item=>!savedOnly||savedFor("dhikr",item.id)).map((item,i)=>(
<button key={item.id} onClick={()=>setShowDetail(item)} className={`anim-up d${Math.min(i+1,5)}`} style={{display:"block",width:"100%",textAlign:"left",background:"var(--surface)",borderRadius:14,padding:18,border:"1px solid var(--border)",marginBottom:10,color:"inherit"}}>
<div style={{display:"flex",alignItems:"center",gap:14}}>
<div style={{width:42,height:42,borderRadius:12,background:"var(--green-dim)",border:"1px solid var(--green-mid)",display:"grid",placeItems:"center",fontSize:20,flexShrink:0}}>{item.icon}</div>
<div style={{minWidth:0,flex:1}}>
<div style={{fontFamily:"var(--arabic)",fontSize:21,color:"var(--amber2)",direction:"rtl",textAlign:"left",lineHeight:1.3}}>{item.arabic}</div>
<div style={{fontSize:13,color:"var(--text)",fontWeight:600,marginTop:4}}>{item.transliteration}</div>
<div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{item.meaning}</div>
</div>
<div style={{fontSize:16,color:"var(--green2)"}}>›</div>
</div>
</button>
))}
</div>
)}
{section==="guidance"&&(
<div>
<div style={{fontSize:12,color:"var(--text2)",lineHeight:1.6,marginBottom:14}}>Use the Library with humility and clarity about what the app can—and cannot—do.</div>
{[
{icon:"REF",title:"References before summaries",description:"Keep the Qur’an passage or hadith collection and number attached to anything you learn here. In-app notes are concise study aids, not replacements for the full source."},
{icon:"LAW",title:"Fiqh depends on context",description:"Dhikr Challenge does not issue fatwas or choose between schools. Personal rulings can depend on your madhhab, circumstances, and details that an app cannot responsibly infer."},
{icon:"CARE",title:"Ask a qualified person when it matters",description:"For worship, family, finance, health, or other consequential questions, take the exact situation to a qualified scholar or trusted local teacher."},
{icon:"NOTE",title:"Practice progress is not spiritual rank",description:"Points, milestones, circles, and history describe activity inside this app only. They do not measure sincerity, faith, acceptance, or closeness to Allah."},
].map((item,i)=>(
<div key={item.title} className={`anim-up d${Math.min(i+1,5)}`} style={{background:"var(--surface)",borderRadius:14,padding:18,border:"1px solid var(--border)",marginBottom:10}}>
<div style={{display:"flex",alignItems:"flex-start",gap:14}}>
<div style={{width:42,height:42,borderRadius:12,background:"var(--amber-dim)",border:"1px solid var(--amber-mid)",display:"grid",placeItems:"center",fontSize:20,flexShrink:0}}>{item.icon}</div>
<div><div style={{fontSize:14,fontWeight:600,color:"var(--text)"}}>{item.title}</div><div style={{fontSize:12,color:"var(--text2)",lineHeight:1.6,marginTop:5}}>{item.description}</div></div>
</div>
</div>
))}
</div>
)}
{section==="tools"&&(
<div>
<div style={{fontSize:12,color:"var(--text2)",lineHeight:1.6,marginBottom:14}}>Keep the utility layer close to the purpose: remember, learn, and practice together.</div>
{[
{icon:"COUNT",title:"Tasbih counter",description:"Count either daily release with Arabic audio, calm English, and progress sync.",action:()=>setPage("home"),label:"Open Today"},
{icon:"CIRCLE",title:"Private circles",description:"Invite family, friends, or a halaqah and see gentle daily participation.",action:()=>setPage("circles"),label:"Open Circles"},
{icon:"ASK",title:"Ask the Library",description:"Describe what you are carrying and search the app’s own Qur’an references, hadith context, and dhikr.",action:()=>setPage("ask"),label:"Ask a question"},
{icon:"AR",title:"Arabic practice",description:"Review the Arabic, transliteration, meaning, and recitation for every dhikr in the app.",action:()=>setSection("arabic"),label:"Study Arabic"},
].map((item,i)=>(
<div key={item.title} className={`anim-up d${Math.min(i+1,5)}`} style={{background:"var(--surface)",borderRadius:14,padding:18,border:"1px solid var(--border)",marginBottom:10}}>
<div style={{display:"flex",alignItems:"flex-start",gap:14}}>
<div style={{width:42,height:42,borderRadius:12,background:"var(--green-dim)",border:"1px solid var(--green-mid)",display:"grid",placeItems:"center",fontSize:20,flexShrink:0}}>{item.icon}</div>
<div style={{flex:1}}>
<div style={{fontSize:14,fontWeight:600,color:"var(--text)"}}>{item.title}</div>
<div style={{fontSize:12,color:"var(--text2)",lineHeight:1.55,marginTop:4}}>{item.description}</div>
<button onClick={item.action} style={{marginTop:10,padding:"7px 10px",borderRadius:8,border:"1px solid var(--green-mid)",background:"var(--green-dim)",color:"var(--green2)",fontSize:11,fontWeight:600}}>{item.label}</button>
</div>
</div>
</div>
))}
</div>
)}
</div>
);
}
function AskPage(){
const[prompt,setPrompt]=useState("");
const[answer,setAnswer]=useState(null);
const[typeFilter,setTypeFilter]=useState("All");
const savedQuestions=(experience.savedItems||[]).filter(item=>(item.itemType||item.item_type)==="guidance"&&(item.itemId||item.item_id||"").startsWith("ask:"));
const questionSaveId=`ask:${prompt.trim().slice(0,156)}`;
const visibleAskResults=answer?answer.results.filter(item=>typeFilter==="All"||item.type===typeFilter).slice(0,6):[];
const examples=[
"I feel anxious and need a reminder",
"What does the Qur’an say about hardship?",
"Which dhikr helps me return after a mistake?",
"What should I know before asking a fiqh question?",
];
const submit=(event)=>{
event?.preventDefault();
if(!prompt.trim())return;
setAnswer(searchIslamicLibrary(prompt));
};
const applyExample=(example)=>{
setPrompt(example);
setAnswer(searchIslamicLibrary(example));
};
return(
<div style={{height:"100%",overflowY:"auto",padding:"16px 16px 100px"}}>
<div className="anim-up" style={{marginBottom:22}}>
<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",marginBottom:7}}>Study with care</div>
<div style={{fontFamily:"var(--serif)",fontSize:30}}>Ask the library</div>
<div style={{fontSize:13,color:"var(--text2)",lineHeight:1.65,marginTop:6}}>Describe what you’re carrying or what you want to learn. The library returns nearby Qur’an references, hadith references, and dhikr—not invented answers.</div>
</div>
<form onSubmit={submit} className="anim-up d1" style={{background:"linear-gradient(135deg,var(--surface),var(--bg2))",border:"1px solid var(--amber-mid)",borderRadius:18,padding:16,marginBottom:14}}>
<label htmlFor="ask-library-prompt" style={{display:"block",fontSize:11,color:"var(--amber2)",fontWeight:600,marginBottom:8}}>What would you like to explore?</label>
<textarea id="ask-library-prompt" value={prompt} onChange={event=>setPrompt(event.target.value)} placeholder="Try: “I’m overwhelmed. What can I read and remember?”" rows={4}
style={{width:"100%",boxSizing:"border-box",resize:"vertical",minHeight:94,padding:12,borderRadius:11,border:"1px solid var(--border2)",background:"var(--bg2)",color:"var(--text)",fontFamily:"var(--body)",fontSize:14,lineHeight:1.55,outline:"none"}}/>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginTop:10}}>
<div style={{fontSize:10,color:"var(--text3)"}}>Searches the verified in-app library</div>
<button type="submit" disabled={!prompt.trim()} style={{padding:"10px 14px",borderRadius:9,border:"none",background:"var(--amber)",color:"var(--bg)",fontWeight:600,fontSize:12,opacity:prompt.trim()?.1:0.5}}>Search sources</button>
</div>
<div className="ask-filters"><span>Filter:</span>{["All","Dhikr","Hadith","Qur’an"].map(type=><button type="button" key={type} className={typeFilter===type?"active":""} onClick={()=>setTypeFilter(type)}>{type}</button>)}</div>
</form>
{!answer&&<div className="anim-up d2" style={{marginBottom:18}}>
<div style={{fontSize:11,color:"var(--text3)",marginBottom:8}}>Try a prompt</div>
<div style={{display:"flex",flexWrap:"wrap",gap:7}}>
{examples.map(example=><button key={example} onClick={()=>applyExample(example)} style={{padding:"8px 10px",borderRadius:16,border:"1px solid var(--border2)",background:"var(--surface)",color:"var(--text2)",fontSize:11,textAlign:"left"}}>{example}</button>)}
</div>
</div>}
{!answer&&savedQuestions.length>0&&<div className="saved-questions anim-up d2"><div className="section-kicker">Saved questions</div>{savedQuestions.slice(0,5).map(item=>{const text=(item.itemId||item.item_id).slice(4);return <button key={text} onClick={()=>applyExample(text)}>{text}</button>;})}</div>}
{answer&&<div className="anim-up d2">
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:10}}>
<div style={{fontSize:12,color:"var(--green2)",fontWeight:600}}>Matches from the verified library</div>
<div className="ask-result-actions"><button onClick={()=>toggleSavedItem("guidance",questionSaveId)}>{savedKeys.has(`guidance:${questionSaveId}`)?"Question saved":"Save question"}</button><button onClick={()=>{setAnswer(null);setPrompt("");}}>Clear</button></div>
</div>
{answer.lawPrompt&&<div style={{background:"var(--amber-dim)",border:"1px solid var(--amber-mid)",borderRadius:12,padding:13,marginBottom:10,fontSize:11,color:"var(--text2)",lineHeight:1.55}}>This is a study search, not a fatwa. Fiqh answers can differ by school and depend on personal circumstances; use the Library’s Guidance section and ask a qualified teacher for a ruling.</div>}
{!visibleAskResults.length&&<div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:18,fontSize:13,color:"var(--text2)",lineHeight:1.6}}>I couldn’t find a close match in this source type yet. Try naming a topic such as anxiety, repentance, gratitude, hardship, dhikr, prayer, Qur’an, or fiqh.</div>}
{visibleAskResults.map((item,index)=>{
const isDhikr=item.type==="Dhikr";
const saveType=isDhikr?"dhikr":item.type==="Hadith"?"hadith":item.type==="Guidance"?"guidance":"quran";
const saveKey=`${saveType}:${item.id}`;
return <div key={`${item.type}-${item.id}-${index}`} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:16,marginBottom:9}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:7}}>
<div style={{fontSize:10,color:item.type==="Qur’an"?"var(--green2)":item.type==="Hadith"?"var(--amber)":"var(--text3)",fontFamily:"var(--font)",fontWeight:600,textTransform:"uppercase",letterSpacing:".08em"}}>{item.type}</div>
{item.theme&&<div style={{fontSize:10,color:"var(--text3)",textAlign:"right"}}>{item.theme}</div>}
</div>
<div style={{fontSize:15,fontWeight:600,color:"var(--text)",marginBottom:6}}>{item.title||item.transliteration||item.reference}</div>
<div style={{fontSize:13,color:"var(--text2)",lineHeight:1.65}}>{item.text||item.meaning||item.significance}</div>
<div className="match-reason">Matched because this source is tagged with: {(item.matchedTerms||[]).slice(0,3).join(", ")||item.theme||"a curated source topic"}.</div>
<button onClick={()=>toggleSavedItem(saveType,item.id)} className="save-button">{savedKeys.has(saveKey)?"Saved":"Save for later"}</button>
{isDhikr&&<button onClick={()=>setShowDetail(item)} style={{marginTop:10,padding:"7px 10px",borderRadius:8,border:"1px solid var(--green-mid)",background:"var(--green-dim)",color:"var(--green2)",fontSize:11,fontWeight:600}}>Open dhikr</button>}
<div style={{marginTop:11,paddingTop:9,borderTop:"1px solid var(--border)"}}>
<div style={{fontSize:10,color:"var(--text3)"}}>{item.reference||item.source}</div>
</div>
</div>;
})}
<div className="followups"><div className="section-kicker">Continue exploring</div>{[`Show Qur’an references for ${answer.terms[0]||"remembrance"}`,`Show a dhikr for ${answer.terms[0]||"remembrance"}`,`What hadith relates to ${answer.terms[0]||"remembrance"}?`].map(next=><button key={next} onClick={()=>{setPrompt(next);setAnswer(searchIslamicLibrary(next));}}>{next}</button>)}</div>
<div style={{fontSize:10,color:"var(--text3)",lineHeight:1.5,marginTop:12}}>This page retrieves from a limited, curated index. It is not trained on all Islamic knowledge and it does not replace a qualified scholar.</div>
</div>}
</div>
);
}
function DhikrDetail(){
if(!showDetail)return null;
const d=showDetail;
const done=completedDhikr.includes(d.id);
return(
<div onClick={()=>setShowDetail(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(12px)",zIndex:150,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
<div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:"var(--bg2)",borderRadius:"20px 20px 0 0",padding:"28px 24px env(safe-area-inset-bottom,24px)",maxHeight:"85vh",overflowY:"auto",border:"1px solid var(--border2)",borderBottom:"none",animation:"slideUp 0.35s var(--ease)"}}>
<div style={{width:40,height:4,borderRadius:2,background:"var(--border2)",margin:"0 auto 24px"}}/>
<div style={{textAlign:"center",marginBottom:20}}>
<div style={{fontSize:40,marginBottom:8}}>{d.icon}</div>
<div style={{fontFamily:"var(--arabic)",fontSize:arabicSize,color:"var(--amber2)",direction:"rtl",lineHeight:1.3}}>{d.arabic}</div>
{showTransliteration&&<div style={{fontFamily:"var(--serif)",fontSize:18,color:"var(--text)",marginTop:6,fontStyle:"italic"}}>{d.transliteration}</div>}
<div style={{fontSize:13,color:"var(--text2)",marginTop:4}}>{d.meaning}</div>
<div className="detail-controls"><button onClick={()=>{const next=Math.max(24,arabicSize-4);setArabicSize(next);localStorage.setItem("dhikr-arabic-size",next)}}>A−</button><button onClick={()=>{const next=Math.min(52,arabicSize+4);setArabicSize(next);localStorage.setItem("dhikr-arabic-size",next)}}>A+</button><button onClick={()=>setShowTransliteration(!showTransliteration)}>{showTransliteration?"Hide transliteration":"Show transliteration"}</button></div>
<div style={{display:"flex",justifyContent:"center",marginTop:14}}>
<RecitationControls dhikr={d}/>
</div>
</div>
<div style={{background:"var(--green-dim)",borderRadius:12,padding:16,marginBottom:16,border:"1px solid var(--green-mid)"}}>
<div style={{fontSize:10,color:"var(--green2)",fontFamily:"var(--font)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:7}}>A moment for this dhikr</div>
<p style={{fontFamily:"var(--body)",fontSize:14,lineHeight:1.65,color:"var(--text)"}}>{d.moment}</p>
<p style={{fontFamily:"var(--serif)",fontSize:14,fontStyle:"italic",lineHeight:1.6,color:"var(--text2)",marginTop:9}}>“{d.reflection}”</p>
</div>
<div className="word-study"><div className="section-kicker">Word by word</div><div className="word-grid">{(d.words||[]).map((word,index)=><div className="word-token" key={`${word[0]}-${index}`}><div className="word-arabic">{word[0]}</div><div className="word-translit">{word[1]}</div><div className="word-meaning">{word[2]}</div></div>)}</div><div className="source-note">Arabic tokens and concise glosses are a learning aid, not a translation claim.</div></div>
<div style={{background:"var(--surface)",borderRadius:12,padding:18,marginBottom:16,border:"1px solid var(--border)"}}>
<div style={{fontSize:10,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Source-based explanation</div>
<p style={{fontFamily:"var(--body)",fontSize:14,lineHeight:1.75,color:"var(--text)"}}>{d.significance}</p>
<div style={{fontSize:11,color:"var(--text3)",marginTop:12,paddingTop:10,borderTop:"1px solid var(--border)"}}>
Source / reference: {d.source} · Review status: source supplied in the curated library
</div>
</div>
<div style={{background:"var(--surface)",borderRadius:12,padding:18,marginBottom:20,border:"1px solid var(--amber-dim)"}}>
<div style={{fontSize:10,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>A reflection for practice</div>
<p style={{fontFamily:"var(--serif)",fontSize:14,fontStyle:"italic",lineHeight:1.75,color:"var(--text2)"}}>{d.practiceReflection}</p>
<div style={{fontSize:10,color:"var(--text3)",lineHeight:1.5,marginTop:8}}>This is a meditation, not a hadith or fatwa.</div>
</div>
<div style={{display:"flex",gap:10}}>
{!done&&releasedDhikr.some(item=>item.id===d.id)&&(
<button onClick={()=>{setShowDetail(null);setActiveTasbih(d)}} style={{flex:1,padding:"14px",borderRadius:10,border:"none",background:"var(--amber)",color:"var(--bg)",fontSize:14,fontWeight:600,fontFamily:"var(--font)"}}>
Start Counting · {d.target}{d.unit?" "+d.unit:"×"}
</button>
)}
<button onClick={()=>setShowDetail(null)} style={{flex:done?1:0,minWidth:52,padding:"14px",borderRadius:10,border:"1px solid var(--border2)",background:"var(--surface)",color:"var(--text2)",fontSize:13,fontFamily:"var(--font)"}}>
{done?"Completed today":"Close"}
</button>
</div>
</div>
</div>
);
}
return(
<div style={{height:"100%",display:"flex",flexDirection:"column",background:"var(--bg)",maxWidth:1180,margin:"0 auto",position:"relative",boxShadow:"0 0 80px rgba(0,0,0,.18)"}}>
<div style={{position:"fixed",top:"20%",left:"50%",transform:"translateX(-50%)",width:560,height:380,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(97,212,161,0.05),transparent 70%)",pointerEvents:"none",zIndex:0}}/>
{loadingProgress&&<div style={{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",zIndex:100,background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:20,padding:"7px 14px",fontSize:11,color:"var(--text2)"}}>Syncing your journey…</div>}
{progressError&&<button onClick={()=>setProgressError("")} style={{position:"absolute",top:12,left:16,right:16,zIndex:100,background:"var(--rose-dim)",border:"1px solid rgba(196,122,122,.25)",borderRadius:10,padding:"9px 12px",fontSize:11,color:"var(--rose)"}}>{progressError} · Dismiss</button>}
<div style={{flex:1,overflow:"hidden",position:"relative",zIndex:1}}>
{page==="home"&&<HomePage/>}
{page==="circles"&&<CirclesPage/>}
{page==="progress"&&<ProgressPage/>}
{page==="learn"&&<LearnPage/>}
{page==="ask"&&<AskPage/>}
</div>
{activeTasbih&&<TasbihCounter dhikr={activeTasbih} onComplete={completeDhikr} onClose={()=>setActiveTasbih(null)}/>}
<DhikrDetail/>
{showSettings&&<SettingsPanel/>}
{pendingReflection&&<div className="settings-overlay" onClick={()=>setPendingReflection(null)}><section className="settings-panel reflection-panel" onClick={event=>event.stopPropagation()}><div className="eyebrow">Practice complete</div><h2>Carry one thing forward.</h2><p className="panel-copy">This reflection is private to your account. The note is optional.</p><div className="mood-grid">{[["peaceful","Peaceful"],["reflective","Reflective"],["grateful","Grateful"],["focused","Focused"],["heavy","Heavy"]].map(([value,label])=><button className={reflectionMood===value?"active":""} key={value} onClick={()=>setReflectionMood(value)}>{label}</button>)}</div><label className="field-label">Private note <small>(optional)</small><textarea maxLength="500" value={reflectionNote} onChange={event=>setReflectionNote(event.target.value)} placeholder="One line to remember from this practice…"/></label><div className="onboard-actions"><button className="quiet-button" onClick={()=>setPendingReflection(null)}>Not now</button><button className="primary-button" onClick={saveReflection} disabled={reflectionBusy}>{reflectionBusy?"Saving…":"Save reflection"}</button></div></section></div>}
<nav style={{display:"flex",justifyContent:"center",gap:4,padding:"8px 0 env(safe-area-inset-bottom,8px)",background:"rgba(9,17,31,0.95)",backdropFilter:"blur(20px)",borderTop:"1px solid var(--border2)",position:"relative",zIndex:50}}>
{[
{k:"home",icon:"01",label:"Today"},
{k:"circles",icon:"02",label:"Circles"},
{k:"progress",icon:"03",label:"Journey"},
{k:"learn",icon:"04",label:"Library"},
{k:"ask",icon:"05",label:"Ask"},
].map(n=>(
<button key={n.k} onClick={()=>setPage(n.k)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",padding:"6px 20px",borderRadius:8,
color:page===n.k?"var(--green2)":"var(--text3)",fontFamily:"var(--font)",fontSize:10,fontWeight:page===n.k?600:400,transition:"color 0.2s",minWidth:88}}>
<span style={{fontSize:20,filter:page===n.k?"drop-shadow(0 0 6px var(--green-glow))":"none"}}>{n.icon}</span>
{n.label}
</button>
))}
</nav>
</div>
);
}
function Root(){
const[user,setUser]=useState(null);
const[loading,setLoading]=useState(true);
const[startupError,setStartupError]=useState("");
useEffect(()=>{
let subscription;
getSupabase().then(async client=>{
const{data,error}=await client.auth.getSession();
if(error)throw error;
setUser(data.session?.user||null);
subscription=client.auth.onAuthStateChange((_event,session)=>{
setUser(session?.user||null);
}).data.subscription;
}).catch(error=>setStartupError(error.message||"Authentication is unavailable."))
.finally(()=>setLoading(false));
return()=>subscription?.unsubscribe();
},[]);
const logout=async()=>{
const client=await getSupabase();
await client.auth.signOut();
setUser(null);
};
if(loading)return <div style={{height:"100%",display:"grid",placeItems:"center",color:"var(--text2)"}}>Preparing your journey…</div>;
if(startupError)return <div style={{height:"100%",display:"grid",placeItems:"center",padding:24,textAlign:"center",color:"var(--rose)"}}>{startupError}</div>;
if(!user)return <LoginScreen onAuth={setUser}/>;
return <App key={user.id} user={user} onLogout={logout}/>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
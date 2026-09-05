function IslamicStar({size=120,progress=0,color="var(--amber)",children}){
const points=8;
const outerR=size/2;
const innerR=outerR*0.45;
const cx=size/2,cy=size/2;
let path="";
for(let i=0;i<points;i++){
const outerAngle=(Math.PI*2/points)*i - Math.PI/2;
const innerAngle=outerAngle + Math.PI/points;
const ox=cx+Math.cos(outerAngle)*outerR;
const oy=cy+Math.sin(outerAngle)*outerR;
const ix=cx+Math.cos(innerAngle)*innerR;
const iy=cy+Math.sin(innerAngle)*innerR;
path+=(i===0?"M":"L")+`${ox},${oy} L${ix},${iy} `;
}
path+="Z";
const pathLen=size*8; // approximate
const dashOff=pathLen*(1-progress);
return(
<div style={{position:"relative",width:size,height:size}}>
<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
<path d={path} fill="none" stroke="var(--border2)" strokeWidth="1.5"/>
<path d={path} fill="none" stroke={color} strokeWidth="2"
strokeDasharray={pathLen} strokeDashoffset={dashOff}
strokeLinejoin="round"
style={{transition:"stroke-dashoffset 1s var(--ease)",filter:`drop-shadow(0 0 6px ${color})`}}/>
<path d={path} fill={`${color}`} opacity="0.04"/>
</svg>
<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
{children}
</div>
</div>
);
}
const arabicAudioCache={};
const ARABIC_AUDIO={
astaghfirullah:"/audio/astaghfirullah.mp3",
la_ilaha_illallah:"/audio/la_ilaha_illallah.mp3",
subhanallah:"/audio/subhanallah.mp3",
alhamdulillah:"/audio/alhamdulillah.mp3",
allahu_akbar:"/audio/allahu_akbar.mp3",
quran_reading:"/audio/quran_reading.mp3",
salawat:"/audio/salawat.mp3",
hawqala:"/audio/hawqala.mp3"
};
const ARABIC_AUDIO_CREDIT="Clear human recitation · Hamad Al-Duraim";
async function loadArabicAudio(text){
if(arabicAudioCache[text])return arabicAudioCache[text];
const dhikr=ADHKAR.find(item=>item.arabic===text);
const url=dhikr&&ARABIC_AUDIO[dhikr.id];
if(!url)throw new Error("Arabic audio unavailable");
arabicAudioCache[text]=url;
return url;
}
function RecitationControls({dhikr,compact=false}){
const[mode,setMode]=useState(()=>{try{return localStorage.getItem("dhikr-recitation-mode")||"arabic";}catch(error){return"arabic";}});
const[playing,setPlaying]=useState(false);
const[loading,setLoading]=useState(false);
const[audioError,setAudioError]=useState("");
const audioRef=useRef(null);
const timeoutRef=useRef(null);
const stop=()=>{
if(audioRef.current){audioRef.current.pause();audioRef.current=null;}
if(window.speechSynthesis)window.speechSynthesis.cancel();
if(timeoutRef.current)clearTimeout(timeoutRef.current);
setPlaying(false);
setLoading(false);
};
const speakBrowser=(text,lang,onEnd)=>{
if(!window.speechSynthesis){if(onEnd)onEnd();return;}
window.speechSynthesis.cancel();
const utterance=new SpeechSynthesisUtterance(text);
utterance.lang=lang;
utterance.rate=lang.startsWith("ar")?.78:.78;
utterance.pitch=lang.startsWith("ar")?1:.72;
const voices=window.speechSynthesis.getVoices();
const matching=voices.filter(item=>item.lang.toLowerCase().startsWith(lang.slice(0,2)));
const voice=lang.startsWith("en")
? matching.find(item=>/daniel|alex|fred|david|guy|ryan|google uk english male|microsoft/i.test(item.name))
||matching.find(item=>item.lang.toLowerCase()==="en-gb"&&item.localService)
||matching.find(item=>item.lang.toLowerCase()==="en-us"&&item.localService)
||matching[0]
: matching[0];
if(voice)utterance.voice=voice;
utterance.onend=onEnd;
utterance.onerror=onEnd;
window.speechSynthesis.speak(utterance);
};
const playArabic=(onEnd)=>{
const failed=()=>{
audioRef.current=null;
setAudioError("Arabic audio could not play. Try again.");
if(onEnd)onEnd();
};
loadArabicAudio(dhikr.arabic).then(url=>{
const audio=new Audio(url);
audio.playbackRate=1;
audio.onended=()=>{audioRef.current=null;if(onEnd)onEnd();};
audio.onerror=failed;
audioRef.current=audio;
audio.play().catch(failed);
}).catch(failed);
};
const playEnglish=(onEnd)=>speakBrowser(dhikr.meaning,"en-US",onEnd);
const play=async(ev)=>{
ev.stopPropagation();
if(playing){stop();return;}
setAudioError("");
setLoading(true);
setPlaying(true);
const done=()=>{setPlaying(false);setLoading(false);};
if(mode==="english")playEnglish(done);
else if(mode==="both")playArabic(()=>{timeoutRef.current=setTimeout(()=>playEnglish(done),1200);});
else playArabic(done);
};
useEffect(()=>()=>stop(),[]);
return(
<div onClick={ev=>ev.stopPropagation()} style={{display:"inline-flex",alignItems:"center",gap:6}}>
<select value={mode} onChange={ev=>{stop();setMode(ev.target.value);try{localStorage.setItem("dhikr-recitation-mode",ev.target.value);}catch(error){}}} aria-label="Recitation language"
style={{padding:compact?"6px 7px":"8px 9px",borderRadius:8,border:"1px solid var(--amber-mid)",background:"var(--amber-dim)",color:"var(--amber2)",fontSize:compact?10:11,fontFamily:"var(--font)",fontWeight:600,outline:"none"}}>
<option value="arabic">Arabic</option>
<option value="english">Calm English</option>
<option value="both">Both</option>
</select>
<button onClick={play} aria-label={playing?"Stop recitation":"Play recitation"}
style={{display:"inline-flex",alignItems:"center",gap:6,padding:compact?"7px 9px":"9px 12px",borderRadius:9,border:"1px solid var(--amber-mid)",background:"var(--amber-dim)",color:"var(--amber2)",fontSize:compact?11:12,fontFamily:"var(--font)",fontWeight:600}}>
<span>{loading?"…":playing?"■":"▶"}</span>
<span>{loading?"Loading":playing?"Stop":"Play"}</span>
</button>
{!compact&&<div style={{fontSize:10,color:"var(--text3)",whiteSpace:"nowrap"}}>{ARABIC_AUDIO_CREDIT}</div>}
{audioError&&<div role="status" style={{fontSize:10,color:"var(--rose)",whiteSpace:"nowrap"}}>{audioError}</div>}
</div>
);
}
function TasbihCounter({dhikr,onComplete,onClose}){
const countStorageKey=`dhikr-counter:${new Date().toISOString().slice(0,10)}:${dhikr.id}`;
const[count,setCount]=useState(()=>{try{return Math.min(Number(localStorage.getItem(countStorageKey)||0),Math.max(0,dhikr.target-1));}catch(error){return 0;}});
const[ripples,setRipples]=useState([]);
const[completed,setCompleted]=useState(false);
const[recitationMode,setRecitationMode]=useState("arabic");
const pct=Math.min(count/dhikr.target,1);
const DHIKR_ARABIC={
astaghfirullah:   "أستغفر الله",
la_ilaha_illallah:"لا إله إلا الله",
subhanallah:      "سبحان الله",
alhamdulillah:    "الحمد لله",
allahu_akbar:     "الله أكبر",
salawat:          "اللهم صل على محمد",
hawqala:          "لا حول ولا قوة إلا بالله",
quran_reading:    "بسم الله الرحمن الرحيم",
};
const DHIKR_ENGLISH={
astaghfirullah:   "I seek forgiveness from Allah",
la_ilaha_illallah:"There is no god but Allah",
subhanallah:      "Glory be to Allah",
alhamdulillah:    "All praise is due to Allah",
allahu_akbar:     "Allah is the Greatest",
salawat:          "O Allah, send blessings upon Muhammad",
hawqala:          "There is no power nor strength except with Allah",
quran_reading:    "In the name of Allah, the Most Gracious, the Most Merciful",
};
const audioCache=useRef({});
const activeAudio=useRef(null);
const playTapClick=()=>{
try{
const ctx=new(window.AudioContext||window.webkitAudioContext)();
const osc=ctx.createOscillator();
const gain=ctx.createGain();
const filter=ctx.createBiquadFilter();
filter.type="bandpass"; filter.frequency.value=1100; filter.Q.value=4;
osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
osc.type="triangle"; osc.frequency.value=820;
gain.gain.setValueAtTime(0.10,ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.10);
osc.start(); osc.stop(ctx.currentTime+0.10);
setTimeout(()=>{try{ctx.close();}catch(e){}},300);
}catch(e){}
};
useEffect(()=>{
if(window.speechSynthesis){
window.speechSynthesis.getVoices();
window.speechSynthesis.onvoiceschanged=()=>window.speechSynthesis.getVoices();
}
return()=>{
if(window.speechSynthesis) window.speechSynthesis.cancel();
if(activeAudio.current){ activeAudio.current.pause(); activeAudio.current=null; }
};
},[]);
const fetchArabicAudio=async(dhikrId)=>{
if(audioCache.current[dhikrId]) return audioCache.current[dhikrId];
try{
const url=ARABIC_AUDIO[dhikrId];
if(url)audioCache.current[dhikrId]=url;
return url||null;
}catch(e){ return null; }
};
const playAudio=(url,onEnd)=>{
if(activeAudio.current){ activeAudio.current.pause(); activeAudio.current=null; }
const a=new Audio(url);
a.playbackRate=1;
a.volume=1.0;
a.onended=()=>{ activeAudio.current=null; if(onEnd) onEnd(); };
a.onerror=()=>{ activeAudio.current=null; if(onEnd) onEnd(); };
a.play().catch(()=>{ if(onEnd) onEnd(); });
activeAudio.current=a;
};
const getDeepEnglishVoice=()=>{
const voices=window.speechSynthesis?.getVoices()||[];
return(
voices.find(v=>v.name.includes("Daniel"))||
voices.find(v=>v.name.includes("Alex"))||
voices.find(v=>v.name.includes("Fred"))||
voices.find(v=>v.name.includes("David"))||
voices.find(v=>v.lang==="en-US"&&v.localService)||
voices.find(v=>v.lang.startsWith("en"))||
null
);
};
const speakEnglish=(text,onEnd)=>{
if(!window.speechSynthesis){ if(onEnd) onEnd(); return; }
window.speechSynthesis.cancel();
const utt=new SpeechSynthesisUtterance(text);
utt.lang="en-US"; utt.rate=0.78; utt.pitch=0.7; utt.volume=1.0;
const voice=getDeepEnglishVoice();
if(voice) utt.voice=voice;
let fired=false;
const done=()=>{ if(!fired){fired=true; if(onEnd) onEnd();} };
utt.onend=done; utt.onerror=done;
window.speechSynthesis.speak(utt);
};
useEffect(()=>{
try{
const saved=localStorage.getItem("dhikr-recitation-mode");
if(saved)setRecitationMode(saved);
}catch(error){}
},[]);
const speakArabic=async(dhikrId,onDone)=>{
const arabicUrl=await fetchArabicAudio(dhikrId);
if(arabicUrl){
playAudio(arabicUrl,onDone);
} else {
if(onDone)onDone();
}
};
const speakSelected=(dhikrId,onDone)=>{
if(recitationMode==="english"){
speakEnglish(DHIKR_ENGLISH[dhikrId]||"",onDone);
}else if(recitationMode==="both"){
speakArabic(dhikrId,()=>setTimeout(()=>speakEnglish(DHIKR_ENGLISH[dhikrId]||"",onDone),1200));
}else{
speakArabic(dhikrId,onDone);
}
};
const playTapAudio=()=>{
playTapClick();
setTimeout(()=>speakSelected(dhikr.id,null),80);
};
const playCompletionAudio=(onDone)=>{
speakSelected(dhikr.id,onDone);
};
const tap=()=>{
if(completed)return;
const next=count+1;
setCount(next);
try{localStorage.setItem(countStorageKey,String(next));}catch(error){}
setRipples(prev=>[...prev,Date.now()]);
setTimeout(()=>setRipples(prev=>prev.slice(1)),800);
playTapAudio();
if(next>=dhikr.target){
setCompleted(true);
try{localStorage.removeItem(countStorageKey);}catch(error){}
setTimeout(()=>{
playCompletionAudio(()=>setTimeout(()=>onComplete(dhikr),600));
},200);
}
};
const handleTap=()=>{
if(navigator.vibrate)navigator.vibrate(15);
tap();
};
return(
<div style={{position:"fixed",inset:0,background:"var(--bg)",backgroundImage:"linear-gradient(rgba(52,180,100,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(52,180,100,0.025) 1px,transparent 1px)",backgroundSize:"40px 40px",zIndex:200,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto"}}>
<div style={{padding:"16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<button onClick={onClose} style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:8,padding:"8px 16px",color:"var(--text2)",fontSize:11,fontFamily:"var(--mono)",letterSpacing:"0.04em",textTransform:"uppercase"}}>← BACK</button>
<div style={{display:"flex",alignItems:"center",gap:10}}>
<div style={{fontSize:12,color:"var(--text3)",fontFamily:"var(--font)"}}>{dhikr.category}</div>
<select value={recitationMode} onChange={ev=>{if(window.speechSynthesis)window.speechSynthesis.cancel();setRecitationMode(ev.target.value);try{localStorage.setItem("dhikr-recitation-mode",ev.target.value);}catch(error){}}}
aria-label="Choose recitation language"
style={{background:"var(--amber-dim)",border:"1px solid var(--amber-mid)",borderRadius:8,padding:"7px 8px",fontSize:11,color:"var(--amber2)",fontFamily:"var(--font)",fontWeight:600,outline:"none"}}>
<option value="arabic">Arabic</option>
<option value="english">Calm English</option>
<option value="both">Both</option>
</select>
</div>
</div>
<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px",position:"relative"}}>
<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
<div style={{width:300,height:300,borderRadius:"50%",border:"1px solid var(--green-mid)",opacity:0.2,animation:"rotate 60s linear infinite"}}/>
<div style={{position:"absolute",width:220,height:220,borderRadius:"50%",border:"1px dashed var(--green-dim)",opacity:0.45,animation:"rotate 40s linear infinite reverse"}}/>
</div>
<div className="anim-up" style={{fontFamily:"var(--arabic)",fontSize:38,color:"var(--green2)",textAlign:"center",marginBottom:8,direction:"rtl",lineHeight:1.4,textShadow:"0 0 20px var(--green-glow)"}}>
{dhikr.arabic}
</div>
<div className="anim-up d1" style={{fontFamily:"var(--mono)",fontSize:13,color:"var(--text2)",letterSpacing:"0.06em",marginBottom:4}}>
{dhikr.transliteration}
</div>
<div className="anim-up d2" style={{fontSize:12,color:"var(--text3)",marginBottom:40}}>
{dhikr.meaning}
</div>
<div style={{position:"relative"}}>
{ripples.map(id=>(
<div key={id} style={{position:"absolute",inset:-20,borderRadius:"50%",border:"2px solid var(--green)",animation:"ripple 0.8s ease-out forwards",pointerEvents:"none"}}/>
))}
<div onClick={handleTap} role="button" tabIndex={0} aria-label={`Count ${dhikr.transliteration}`} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();handleTap();}}}
style={{width:180,height:180,borderRadius:"50%",
background:`conic-gradient(var(--green) ${pct*360}deg, var(--surface) ${pct*360}deg)`,
display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
boxShadow:completed?"0 0 40px var(--green-glow)":"0 0 24px rgba(0,0,0,0.4)",
transition:"box-shadow 0.5s",userSelect:"none",WebkitUserSelect:"none",position:"relative"}}>
<div style={{width:160,height:160,borderRadius:"50%",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
{!completed?(
<>
<div style={{fontSize:48,fontWeight:300,color:"var(--green2)",fontFamily:"var(--mono)",lineHeight:1,
animation:count>0?"countPulse 0.3s ease":"none"}}>
{count}
</div>
<div style={{fontSize:11,color:"var(--text3)",marginTop:4,fontFamily:"var(--mono)"}}>/ {dhikr.target}</div>
</>
):(
<div style={{textAlign:"center",animation:"scaleIn 0.5s var(--ease)"}}>
<div style={{fontSize:30,marginBottom:4,color:"var(--amber2)"}}>✓</div>
<div style={{fontSize:13,color:"var(--amber2)",fontWeight:500}}>Completed</div>
</div>
)}
</div>
</div>
</div>
<div style={{marginTop:32,fontSize:11,color:"var(--text3)",textAlign:"center",fontFamily:"var(--mono)",letterSpacing:"0.08em",textTransform:"uppercase"}}>
{completed?"MashaAllah! May Allah accept it.":"Tap the circle to count"}
</div>
{!completed&&<div style={{marginTop:12,fontSize:12,color:"var(--text2)",textAlign:"center",fontFamily:"var(--serif)",fontStyle:"italic",maxWidth:280,lineHeight:1.5}}>
Take a breath. Let the meaning arrive before the number.
</div>}
</div>
<div style={{padding:"16px 24px",textAlign:"center",fontSize:11,color:"var(--text3)"}}>Your count stays on this device if you pause and return today.</div>
</div>
);
}
const todayStr=()=>new Date().toISOString().slice(0,10);
const dateNDaysAgo=(n)=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10);};
let supabaseClient=null;
async function getSupabase(){
if(supabaseClient)return supabaseClient;
const response=await fetch("/api/config");
let config;
try{config=await response.json();}
catch(error){throw new Error("Authentication configuration is unavailable in this environment.");}
if(!response.ok)throw new Error(config.error||"Authentication is unavailable.");
supabaseClient=window.supabase.createClient(config.url,config.publishableKey,{
auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});
return supabaseClient;
}
const freshData=()=>({
streak:0,
lastActiveDate:null,
completedToday:[],
totalCompletions:0,
xp:0,
history:[],   // [{date:'YYYY-MM-DD', completions, xp}] — one entry per active day
});
async function loadUserData(){
const client=await getSupabase();
const{data,error}=await client.rpc("my_dhikr_progress");
if(error)throw error;
const next={...freshData(),...(data||{})};
let cursor=todayStr(),streak=0;
const activeDays=new Set(next.history.map(h=>h.date));
if(!activeDays.has(cursor))cursor=dateNDaysAgo(1);
while(activeDays.has(cursor)){
streak+=1;
const d=new Date(cursor+"T00:00:00Z");d.setUTCDate(d.getUTCDate()-1);
cursor=d.toISOString().slice(0,10);
}
return{...next,streak};
}
function dailyDhikr(){
const day=Math.floor((Date.parse(todayStr()+"T00:00:00Z")-Date.parse("2026-01-01T00:00:00Z"))/86400000);
const first=((day%ADHKAR.length)+ADHKAR.length)%ADHKAR.length;
return[ADHKAR[first],ADHKAR[(first+1)%ADHKAR.length]];
}
function dailyChallengeNumber(){
const day=Math.floor((Date.parse(todayStr()+"T00:00:00Z")-Date.parse("2026-01-01T00:00:00Z"))/86400000);
return((day%ADHKAR.length)+ADHKAR.length)%ADHKAR.length+1;
}
function practiceWindow(){
const hour=new Date().getHours();
if(hour<5)return{label:"Before dawn",note:"A quiet moment before the day begins."};
if(hour<12)return{label:"Morning remembrance",note:"Begin with a heart turned toward Allah."};
if(hour<18)return{label:"Midday reset",note:"Return to presence between the day's demands."};
if(hour<22)return{label:"Evening remembrance",note:"Close the day with calm and gratitude."};
return{label:"Night reflection",note:"A soft landing before rest."};
}
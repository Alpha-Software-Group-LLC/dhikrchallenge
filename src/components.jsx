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
function TasbihCounter({dhikr,onComplete,onClose}){
const[count,setCount]=useState(0);
const[ripples,setRipples]=useState([]);
const[completed,setCompleted]=useState(false);
const[muted,setMuted]=useState(false);
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
la_ilaha_illallah:"There is no god... but Allah",
subhanallah:      "Glory be to Allah",
alhamdulillah:    "All praise is due to Allah",
allahu_akbar:     "Allah... is the Greatest",
salawat:          "O Allah... send blessings upon Muhammad",
hawqala:          "There is no power... nor strength... except with Allah",
quran_reading:    "In the name of Allah... the Most Gracious... the Most Merciful",
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
const fetchArabicAudio=async(text)=>{
if(audioCache.current[text]) return audioCache.current[text];
try{
const url=`https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(text)}`;
const resp=await fetch(url);
if(!resp.ok) return null;
const blob=await resp.blob();
const objUrl=URL.createObjectURL(blob);
audioCache.current[text]=objUrl;
return objUrl;
}catch(e){ return null; }
};
const playAudio=(url,onEnd)=>{
if(activeAudio.current){ activeAudio.current.pause(); activeAudio.current=null; }
const a=new Audio(url);
a.playbackRate=0.82;
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
utt.lang="en-US"; utt.rate=0.82; utt.pitch=0.65; utt.volume=1.0;
const voice=getDeepEnglishVoice();
if(voice) utt.voice=voice;
let fired=false;
const done=()=>{ if(!fired){fired=true; if(onEnd) onEnd();} };
utt.onend=done; utt.onerror=done;
window.speechSynthesis.speak(utt);
};
const speakArabicThenEnglish=async(dhikrId,onDone)=>{
const arabicText=DHIKR_ARABIC[dhikrId]||"";
const englishText=DHIKR_ENGLISH[dhikrId]||"";
const arabicUrl=await fetchArabicAudio(arabicText);
if(arabicUrl){
playAudio(arabicUrl,()=>{
setTimeout(()=>speakEnglish(englishText,onDone),2500);
});
} else {
speakEnglish(englishText,onDone);
}
};
const playTapAudio=()=>{
if(muted)return;
playTapClick();
setTimeout(()=>speakArabicThenEnglish(dhikr.id,null),80);
};
const playCompletionAudio=(onDone)=>{
if(muted){if(onDone)onDone();return;}
speakArabicThenEnglish(dhikr.id,onDone);
};
const tap=()=>{
if(completed)return;
const next=count+1;
setCount(next);
setRipples(prev=>[...prev,Date.now()]);
setTimeout(()=>setRipples(prev=>prev.slice(1)),800);
playTapAudio();
if(next>=dhikr.target){
setCompleted(true);
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
<button
onClick={()=>{
if(!muted&&window.speechSynthesis)window.speechSynthesis.cancel();
setMuted(m=>!m);
}}
title={muted?"Unmute recitation":"Mute — recite yourself"}
style={{background:muted?"var(--amber-dim)":"var(--surface)",border:`1px solid ${muted?"var(--amber-mid)":"var(--border2)"}`,borderRadius:8,padding:"6px 10px",fontSize:16,cursor:"pointer",lineHeight:1,transition:"all 0.2s"}}>
{muted?"🔇":"🔊"}
</button>
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
<div onClick={handleTap}
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
<div style={{fontSize:36,marginBottom:4}}>✨</div>
<div style={{fontSize:13,color:"var(--amber2)",fontWeight:500}}>Completed</div>
</div>
)}
</div>
</div>
</div>
<div style={{marginTop:32,fontSize:11,color:"var(--text3)",textAlign:"center",fontFamily:"var(--mono)",letterSpacing:"0.08em",textTransform:"uppercase"}}>
{completed?"MashaAllah! May Allah accept it.":"Tap the circle to count"}
</div>
</div>
<div style={{padding:"16px 24px",textAlign:"center"}}>
<div style={{fontSize:11,color:"var(--green2)",fontFamily:"var(--mono)",fontWeight:400,letterSpacing:"0.08em"}}>
+{dhikr.xp} XP ON COMPLETION
</div>
</div>
</div>
);
}
const todayStr=()=>new Date().toISOString().slice(0,10);
const dateNDaysAgo=(n)=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10);};
let supabaseClient=null;
async function getSupabase(){
if(supabaseClient)return supabaseClient;
const response=await fetch("/api/config");
const config=await response.json();
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
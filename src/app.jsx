function App({user,onLogout}){
const[page,setPage]=useState("home");
const[data,setData]=useState(freshData);
const[loadingProgress,setLoadingProgress]=useState(true);
const[progressError,setProgressError]=useState("");
const[leaders,setLeaders]=useState([]);
const[activeTasbih,setActiveTasbih]=useState(null);
const[showDetail,setShowDetail]=useState(null);
const userName=(user.user_metadata?.display_name||user.email?.split("@")[0]||"Friend").split(" ")[0];
useEffect(()=>{
let active=true;
Promise.all([
loadUserData(),
getSupabase().then(client=>client.rpc("daily_leaderboard"))
])
.then(([next,board])=>{if(active){setData(next);setLeaders(board.data||[]);}})
.catch(error=>{if(active)setProgressError(error.message||"Could not load progress.");})
.finally(()=>{if(active)setLoadingProgress(false);});
return()=>{active=false;};
},[user.id]);
const completedDhikr=data.completedToday;
const streak=data.streak;
const totalCompletions=data.totalCompletions;
const totalXP=data.xp;
const rank=useMemo(()=>getRank(totalXP),[totalXP]);
const releasedDhikr=useMemo(dailyDhikr,[]);
const currentChallenge=CHALLENGES.find(c=>c.active);
const currentDhikr=releasedDhikr[0];
const completeDhikr=async(dhikr)=>{
try{
const client=await getSupabase();
const{data:next,error}=await client.rpc("complete_daily_dhikr",{p_dhikr_id:dhikr.id});
if(error)throw error;
setData(await loadUserData());
const{data:board}=await client.rpc("daily_leaderboard");
setLeaders(board||[]);
setActiveTasbih(null);
}catch(error){
setProgressError(error.message||"Completion could not be saved.");
}
};
function HomePage(){
const challengeCompleted=completedDhikr.includes(currentDhikr.id);
const window=practiceWindow();
const completedReleases=releasedDhikr.filter(d=>completedDhikr.includes(d.id)).length;
const journeyProgress=completedReleases/releasedDhikr.length;
return(
<div style={{height:"100%",overflowY:"auto",padding:"16px 16px 100px"}}>
<div className="anim-up" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<div>
<div style={{fontFamily:"var(--arabic)",fontSize:14,color:"var(--amber)",marginBottom:2,direction:"rtl"}}>بِسْمِ ٱللَّهِ</div>
<div style={{fontFamily:"var(--serif)",fontSize:22,fontWeight:400,letterSpacing:"-0.02em"}}>The Dhikr Challenge</div>
<div style={{fontSize:12,color:"var(--text2)",marginTop:2,fontFamily:"var(--body)"}}>Welcome back, {userName} 🌙</div>
</div>
<div style={{display:"flex",alignItems:"center",gap:8}}>
{streak>0&&(
<div style={{background:"var(--amber-dim)",border:"1px solid var(--amber-mid)",borderRadius:16,padding:"4px 10px",display:"flex",alignItems:"center",gap:4}}>
<span style={{fontSize:12}}>🔥</span>
<span style={{fontSize:12,fontWeight:600,color:"var(--amber)",fontFamily:"var(--font)"}}>{streak}</span>
</div>
)}
</div>
</div>
<div className="anim-up d1" style={{background:"linear-gradient(135deg,var(--surface),var(--bg2))",borderRadius:18,padding:20,border:"1px solid var(--green-mid)",marginBottom:16,position:"relative",overflow:"hidden"}}>
<div style={{position:"absolute",right:-26,top:-26,width:120,height:120,borderRadius:"50%",background:"radial-gradient(circle,var(--green-dim),transparent 70%)",pointerEvents:"none"}}/>
<div style={{position:"relative",zIndex:1}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
<div>
<div style={{fontSize:10,color:"var(--green2)",fontFamily:"var(--font)",fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",marginBottom:6}}>Today’s daily challenge</div>
<div style={{fontFamily:"var(--serif)",fontSize:21,color:"var(--text)"}}>{window.icon} {window.label}</div>
<div style={{fontSize:12,color:"var(--text2)",marginTop:4,lineHeight:1.5}}>{window.note}</div>
</div>
<div style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--green2)",whiteSpace:"nowrap"}}>{completedReleases}/{releasedDhikr.length}</div>
</div>
<div style={{height:6,background:"var(--raised)",borderRadius:4,overflow:"hidden",marginTop:16}}>
<div style={{height:"100%",width:`${journeyProgress*100}%`,background:"linear-gradient(90deg,var(--green),var(--amber))",borderRadius:4,transition:"width .5s var(--ease)"}}/>
</div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,fontSize:11,color:"var(--text3)"}}>
<span>{completedReleases===releasedDhikr.length?"Both challenge releases complete — carry the calm with you.":"Two focused releases. No pressure, just return."}</span>
<span style={{color:"var(--green2)",fontWeight:600}}>{completedReleases===releasedDhikr.length?"Complete":"Begin"}</span>
</div>
</div>
</div>
<div className="anim-up d2" style={{background:"linear-gradient(135deg,var(--surface),var(--bg2))",borderRadius:20,padding:24,border:"1px solid var(--amber-mid)",marginBottom:16,position:"relative",overflow:"hidden"}}>
<div className="geo-pattern" style={{position:"absolute",inset:0,opacity:0.5,pointerEvents:"none"}}/>
<div style={{position:"absolute",top:-40,right:-40,width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle,var(--amber-dim),transparent 70%)",animation:"breathe 6s ease-in-out infinite",pointerEvents:"none"}}/>
<div style={{position:"relative",zIndex:2}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
<div>
<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Today's Challenge · Day {currentChallenge?.day}</div>
<div style={{fontFamily:"var(--arabic)",fontSize:30,color:"var(--amber2)",direction:"rtl",lineHeight:1.3}}>{currentDhikr.arabic}</div>
</div>
<span style={{fontSize:28}}>{currentDhikr.icon}</span>
</div>
<div style={{fontFamily:"var(--serif)",fontSize:15,fontStyle:"italic",color:"var(--text)",marginBottom:4}}>{currentDhikr.transliteration}</div>
<div style={{fontSize:13,color:"var(--text2)",marginBottom:16}}>{currentDhikr.meaning} — {currentDhikr.target}×</div>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:16}}>
<span style={{fontSize:10,color:"var(--text3)"}}>Arabic-only recitation available</span>
<ArabicAudioButton text={currentDhikr.arabic} compact/>
</div>
{!challengeCompleted?(
<button onClick={()=>setActiveTasbih(currentDhikr)} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:"var(--amber)",color:"var(--bg)",fontSize:14,fontWeight:600,fontFamily:"var(--font)",letterSpacing:"0.02em"}}>
Begin Dhikr · {currentDhikr.target}× 📿
</button>
):(
<div style={{background:"var(--green-dim)",border:"1px solid rgba(92,184,112,0.2)",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
<span style={{fontSize:18}}>✅</span>
<div>
<div style={{fontSize:13,color:"var(--green)",fontWeight:500}}>Challenge completed — MashaAllah!</div>
<div style={{fontSize:11,color:"var(--text3)"}}>+{currentDhikr.xp} XP earned</div>
</div>
</div>
)}
</div>
</div>
{releasedDhikr[1]&&(()=>{
const d=releasedDhikr[1],done=completedDhikr.includes(d.id);
return <div className="anim-up d2" style={{background:"var(--surface)",borderRadius:16,padding:18,border:"1px solid var(--border2)",marginBottom:16}}>
<div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
<div style={{fontSize:24}}>{d.icon}</div>
<div style={{flex:1}}>
<div style={{fontSize:10,color:"var(--green)",textTransform:"uppercase",letterSpacing:".1em"}}>Today's second release</div>
<div style={{fontFamily:"var(--arabic)",fontSize:22,color:"var(--text)",direction:"rtl",textAlign:"left"}}>{d.arabic}</div>
<div style={{fontSize:12,color:"var(--text2)"}}>{d.transliteration} · {d.target}{d.unit?" "+d.unit:"×"}</div>
</div>
<ArabicAudioButton text={d.arabic} compact/>
</div>
{!done?<button onClick={()=>setActiveTasbih(d)} style={{width:"100%",padding:12,borderRadius:9,border:"1px solid var(--green-mid)",background:"var(--green-dim)",color:"var(--green2)",fontWeight:600}}>Begin Dhikr · +{d.xp} XP</button>
:<div style={{padding:11,borderRadius:9,background:"var(--green-dim)",color:"var(--green)",textAlign:"center",fontSize:12}}>Completed — MashaAllah! ✅</div>}
</div>;
})()}
<div className="anim-up d3" style={{background:"var(--surface)",borderRadius:16,padding:20,border:"1px solid var(--border)",marginBottom:16}}>
<div style={{fontSize:12,color:"var(--amber)",fontWeight:600,marginBottom:12}}>🏆 Today's Leaderboard</div>
{leaders.length?leaders.map(row=><div key={`${row.rank}-${row.name}`} style={{display:"grid",gridTemplateColumns:"28px 1fr auto",gap:8,padding:"9px 0",borderBottom:"1px solid var(--border)",fontSize:12}}>
<span style={{color:"var(--text3)"}}>#{row.rank}</span>
<span style={{color:row.current_user?"var(--amber2)":"var(--text)"}}>{row.name}{row.current_user?" (you)":""}</span>
<b style={{color:"var(--green)"}}>{row.xp} XP</b>
</div>):<div style={{fontSize:12,color:"var(--text3)"}}>Be the first to earn XP today.</div>}
</div>
<div className="anim-up d3" style={{background:"var(--surface)",borderRadius:16,padding:20,border:"1px solid var(--border)",marginBottom:16}}>
<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Why This Dhikr Matters</div>
<p style={{fontFamily:"var(--body)",fontSize:14,lineHeight:1.75,color:"var(--text)",marginBottom:16}}>{currentDhikr.significance}</p>
<div style={{borderTop:"1px solid var(--border2)",paddingTop:14}}>
<div style={{fontSize:10,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6}}>From Imam Al-Ghazali</div>
<p style={{fontFamily:"var(--serif)",fontSize:14,fontStyle:"italic",lineHeight:1.7,color:"var(--text2)"}}>{currentDhikr.ghazali}</p>
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
<div style={{fontSize:11,color:"var(--amber)",fontWeight:500}}>+{d.xp}</div>
</div>
);
})}
</div>
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
<div style={{fontFamily:"var(--serif)",fontSize:26,fontWeight:400}}>Your Progress</div>
<div style={{fontSize:12,color:"var(--text2)",marginTop:2}}>{userName}</div>
</div>
<button onClick={onLogout}
style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:8,padding:"8px 14px",color:"var(--text2)",fontSize:11,fontFamily:"var(--mono)",letterSpacing:"0.04em",textTransform:"uppercase"}}>
Sign Out
</button>
</div>
<div className="anim-up d1" style={{background:"var(--surface)",borderRadius:20,padding:28,border:"1px solid var(--border)",marginBottom:16,textAlign:"center",position:"relative",overflow:"hidden"}}>
<div className="geo-pattern" style={{position:"absolute",inset:0,opacity:0.4,pointerEvents:"none"}}/>
<div style={{position:"relative",zIndex:2}}>
<IslamicStar size={100} progress={rank.progress} color="var(--amber)">
<span style={{fontSize:36}}>{rank.icon}</span>
</IslamicStar>
<div style={{fontFamily:"var(--arabic)",fontSize:22,color:"var(--amber2)",marginTop:12}}>{rank.arabic}</div>
<div style={{fontFamily:"var(--serif)",fontSize:18,color:"var(--text)",marginTop:4,fontWeight:400}}>{rank.name}</div>
<div style={{fontSize:12,color:"var(--text2)",marginTop:6}}>
{totalXP} XP{rank.next?` · ${rank.next.min-totalXP} to ${rank.next.name}`:" · Highest Station"}
</div>
</div>
</div>
<div className="anim-up d2" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
{[
{v:totalCompletions,l:"Completions",i:"📿"},
{v:streak,l:"Day Streak",i:"🔥"},
{v:completedDhikr.length,l:"Today",i:"✨"},
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
Your journey starts today.<br/>Complete a dhikr to begin tracking your progress over time. 🌱
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
<div className="anim-up d3" style={{background:"var(--surface)",borderRadius:16,padding:20,border:"1px solid var(--border)",marginBottom:16}}>
<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14}}>Stations of the Soul</div>
{RANKS.map((r,i)=>{
const reached=totalXP>=r.min;
const current=rank.level===r.level;
return(
<div key={r.level} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<RANKS.length-1?"1px solid var(--border)":"none",opacity:reached?1:0.35}}>
<div style={{width:36,height:36,borderRadius:10,background:current?"var(--amber-dim)":"var(--raised)",border:`1px solid ${current?"var(--amber-mid)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{r.icon}</div>
<div style={{flex:1}}>
<div style={{fontSize:13,fontWeight:reached?600:400,color:current?"var(--amber2)":"var(--text)"}}>{r.name}</div>
<div style={{fontFamily:"var(--arabic)",fontSize:13,color:"var(--text3)",direction:"rtl",textAlign:"left"}}>{r.arabic}</div>
</div>
<div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--font)"}}>{r.min} XP</div>
</div>
);
})}
</div>
<div className="anim-up d4" style={{background:"linear-gradient(135deg,var(--bg2),var(--surface))",borderRadius:16,padding:24,border:"1px solid var(--amber-dim)",textAlign:"center"}}>
<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--mono)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12}}>Imam Al-Ghazali</div>
<p style={{fontFamily:"var(--serif)",fontSize:16,fontStyle:"italic",lineHeight:1.7,color:"var(--text)",fontWeight:300}}>
"The heart is like a mirror. When it is polished with dhikr, it reflects the light of the Divine. When it is neglected, it gathers rust until nothing of truth can be seen."
</p>
<div style={{fontSize:11,color:"var(--text3)",marginTop:10}}>— Ihya Ulum al-Din</div>
</div>
</div>
);
}
function LearnPage(){
const[category,setCategory]=useState("All");
const categories=["All",...new Set(ADHKAR.map(d=>d.category))];
const visibleDhikr=category==="All"?ADHKAR:ADHKAR.filter(d=>d.category===category);
return(
<div style={{height:"100%",overflowY:"auto",padding:"16px 16px 100px"}}>
<div className="anim-up" style={{marginBottom:24}}>
<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6}}>Knowledge</div>
<div style={{fontFamily:"var(--serif)",fontSize:26,fontWeight:400}}>A living practice</div>
<div style={{fontSize:13,color:"var(--text2)",marginTop:6,lineHeight:1.6}}>Learn the meaning, source, and moment behind each remembrance before you begin.</div>
</div>
<div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:12,marginBottom:8,scrollbarWidth:"none"}}>
{categories.map(item=>(
<button key={item} onClick={()=>setCategory(item)}
style={{whiteSpace:"nowrap",padding:"7px 11px",borderRadius:16,border:`1px solid ${category===item?"var(--amber-mid)":"var(--border2)"}`,background:category===item?"var(--amber-dim)":"var(--surface)",color:category===item?"var(--amber2)":"var(--text3)",fontSize:11,fontFamily:"var(--font)",fontWeight:category===item?600:400}}>
{item}
</button>
))}
</div>
{visibleDhikr.map((d,i)=>(
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
</div>
</div>
</div>
))}
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
<div style={{fontFamily:"var(--arabic)",fontSize:32,color:"var(--amber2)",direction:"rtl",lineHeight:1.3}}>{d.arabic}</div>
<div style={{fontFamily:"var(--serif)",fontSize:18,color:"var(--text)",marginTop:6,fontStyle:"italic"}}>{d.transliteration}</div>
<div style={{fontSize:13,color:"var(--text2)",marginTop:4}}>{d.meaning}</div>
<div style={{display:"flex",justifyContent:"center",marginTop:14}}>
<ArabicAudioButton text={d.arabic}/>
</div>
</div>
<div style={{background:"var(--green-dim)",borderRadius:12,padding:16,marginBottom:16,border:"1px solid var(--green-mid)"}}>
<div style={{fontSize:10,color:"var(--green2)",fontFamily:"var(--font)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:7}}>A moment for this dhikr</div>
<p style={{fontFamily:"var(--body)",fontSize:14,lineHeight:1.65,color:"var(--text)"}}>{d.moment}</p>
<p style={{fontFamily:"var(--serif)",fontSize:14,fontStyle:"italic",lineHeight:1.6,color:"var(--text2)",marginTop:9}}>“{d.reflection}”</p>
</div>
<div style={{background:"var(--surface)",borderRadius:12,padding:18,marginBottom:16,border:"1px solid var(--border)"}}>
<div style={{fontSize:10,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Significance</div>
<p style={{fontFamily:"var(--body)",fontSize:14,lineHeight:1.75,color:"var(--text)"}}>{d.significance}</p>
<div style={{fontSize:11,color:"var(--text3)",marginTop:12,paddingTop:10,borderTop:"1px solid var(--border)"}}>Source: {d.source}</div>
</div>
<div style={{background:"var(--surface)",borderRadius:12,padding:18,marginBottom:20,border:"1px solid var(--amber-dim)"}}>
<div style={{fontSize:10,color:"var(--amber)",fontFamily:"var(--font)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Imam Al-Ghazali</div>
<p style={{fontFamily:"var(--serif)",fontSize:14,fontStyle:"italic",lineHeight:1.75,color:"var(--text2)"}}>{d.ghazali}</p>
</div>
<div style={{display:"flex",gap:10}}>
{!done&&releasedDhikr.some(item=>item.id===d.id)&&(
<button onClick={()=>{setShowDetail(null);setActiveTasbih(d)}} style={{flex:1,padding:"14px",borderRadius:10,border:"none",background:"var(--amber)",color:"var(--bg)",fontSize:14,fontWeight:600,fontFamily:"var(--font)"}}>
Start Counting · {d.target}{d.unit?" "+d.unit:"×"} 📿
</button>
)}
<button onClick={()=>setShowDetail(null)} style={{flex:done?1:0,minWidth:52,padding:"14px",borderRadius:10,border:"1px solid var(--border2)",background:"var(--surface)",color:"var(--text2)",fontSize:13,fontFamily:"var(--font)"}}>
{done?"MashaAllah ✅":"Close"}
</button>
</div>
</div>
</div>
);
}
return(
<div style={{height:"100%",display:"flex",flexDirection:"column",background:"var(--bg)",maxWidth:480,margin:"0 auto",position:"relative"}}>
<div style={{position:"fixed",top:"20%",left:"50%",transform:"translateX(-50%)",width:400,height:300,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(52,180,100,0.04),transparent 70%)",pointerEvents:"none",zIndex:0}}/>
{loadingProgress&&<div style={{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",zIndex:100,background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:20,padding:"7px 14px",fontSize:11,color:"var(--text2)"}}>Syncing your journey…</div>}
{progressError&&<button onClick={()=>setProgressError("")} style={{position:"absolute",top:12,left:16,right:16,zIndex:100,background:"var(--rose-dim)",border:"1px solid rgba(196,122,122,.25)",borderRadius:10,padding:"9px 12px",fontSize:11,color:"var(--rose)"}}>{progressError} · Dismiss</button>}
<div style={{flex:1,overflow:"hidden",position:"relative",zIndex:1}}>
{page==="home"&&<HomePage/>}
{page==="progress"&&<ProgressPage/>}
{page==="learn"&&<LearnPage/>}
</div>
{activeTasbih&&<TasbihCounter dhikr={activeTasbih} onComplete={completeDhikr} onClose={()=>setActiveTasbih(null)}/>}
<DhikrDetail/>
<nav style={{display:"flex",justifyContent:"space-around",padding:"8px 0 env(safe-area-inset-bottom,8px)",background:"rgba(6,15,10,0.95)",backdropFilter:"blur(20px)",borderTop:"1px solid var(--border2)",position:"relative",zIndex:50}}>
{[
{k:"home",icon:"🕌",label:"Daily Challenge"},
{k:"progress",icon:"📿",label:"Journey"},
{k:"learn",icon:"📖",label:"Learn"},
].map(n=>(
<button key={n.k} onClick={()=>setPage(n.k)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",padding:"6px 20px",borderRadius:8,
color:page===n.k?"var(--green2)":"var(--text3)",fontFamily:"var(--font)",fontSize:10,fontWeight:page===n.k?600:400,transition:"color 0.2s"}}>
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
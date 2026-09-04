function LoginScreen({onAuth}){
const[mode,setMode]=useState("signin");
const[name,setName]=useState("");
const[email,setEmail]=useState("");
const[pass,setPass]=useState("");
const[err,setErr]=useState("");
const[loading,setLoading]=useState(false);
const inputStyle={
width:"100%",padding:"14px 16px",borderRadius:12,
background:"var(--surface)",border:"1px solid var(--border2)",
color:"var(--text)",fontSize:14,fontFamily:"var(--font)",outline:"none",
marginBottom:12,transition:"border-color 0.2s",
};
const submit=async()=>{
setErr("");
const e=email.trim().toLowerCase();
if(!e||!pass){setErr("Please enter your email and password.");return;}
if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)){setErr("Please enter a valid email address.");return;}
if(mode==="signup"&&!name.trim()){setErr("Please enter your name.");return;}
if(pass.length<8){setErr("Password must be at least 8 characters.");return;}
setLoading(true);
try{
const client=await getSupabase();
if(mode==="signup"){
const{data,error}=await client.auth.signUp({
email:e,password:pass,options:{data:{display_name:name.trim()}}
});
if(error)throw error;
if(data.user){
const{error:profileError}=await client.from("dhikr_profiles").upsert({
user_id:data.user.id,display_name:name.trim()
});
if(profileError&&data.session)throw profileError;
}
if(!data.session){
setErr("Check your email to confirm your account, then sign in.");
setMode("signin");
return;
}
onAuth(data.user);
}else{
const{data,error}=await client.auth.signInWithPassword({email:e,password:pass});
if(error)throw error;
const displayName=data.user.user_metadata?.display_name||e.split("@")[0];
const{error:profileError}=await client.from("dhikr_profiles").upsert({
user_id:data.user.id,display_name:displayName
});
if(profileError)throw profileError;
onAuth(data.user);
}
}catch(error){
setErr(error.message||"Unable to sign in. Please try again.");
}finally{
setLoading(false);
}
};
const onKey=(ev)=>{if(ev.key==="Enter")submit();};
return(
<div style={{height:"100%",overflowY:"auto",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:"32px 24px",maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>
<div style={{position:"fixed",top:"12%",left:"50%",transform:"translateX(-50%)",width:360,height:300,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(200,168,75,0.06),transparent 70%)",pointerEvents:"none",zIndex:0}}/>
<div className="anim-up" style={{textAlign:"center",marginBottom:28,position:"relative",zIndex:1}}>
<div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
<IslamicStar size={92} progress={1} color="var(--amber)">
<span style={{fontSize:34}}>📿</span>
</IslamicStar>
</div>
<div style={{fontFamily:"var(--arabic)",fontSize:18,color:"var(--amber)",marginBottom:6,direction:"rtl"}}>بِسْمِ ٱللَّهِ</div>
<div style={{fontFamily:"var(--serif)",fontSize:26,fontWeight:400,letterSpacing:"-0.02em"}}>The Dhikr Challenge</div>
<div style={{fontSize:13,color:"var(--text2)",marginTop:6,fontFamily:"var(--body)"}}>
{mode==="signup"?"Create an account to begin your journey":"Sign in to continue your remembrance"}
</div>
</div>
<div className="anim-up d1" style={{display:"flex",gap:6,background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:12,padding:4,marginBottom:20,width:"100%",maxWidth:340,position:"relative",zIndex:1}}>
{[{k:"signin",l:"Sign In"},{k:"signup",l:"Create Account"}].map(t=>(
<button key={t.k} onClick={()=>{setMode(t.k);setErr("");}}
style={{flex:1,padding:"10px",borderRadius:8,border:"none",fontFamily:"var(--font)",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s",
background:mode===t.k?"var(--amber)":"transparent",
color:mode===t.k?"var(--bg)":"var(--text2)"}}>
{t.l}
</button>
))}
</div>
<div className="anim-up d2" style={{width:"100%",maxWidth:340,position:"relative",zIndex:1}}>
{mode==="signup"&&(
<input value={name} onChange={e=>setName(e.target.value)} onKeyDown={onKey}
placeholder="Your name" autoComplete="name"
onFocus={e=>e.target.style.borderColor="var(--amber-mid)"}
onBlur={e=>e.target.style.borderColor="var(--border2)"}
style={inputStyle}/>
)}
<input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={onKey}
placeholder="Email" type="email" autoComplete="email"
onFocus={e=>e.target.style.borderColor="var(--amber-mid)"}
onBlur={e=>e.target.style.borderColor="var(--border2)"}
style={inputStyle}/>
<input value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={onKey}
placeholder="Password" type="password"
autoComplete={mode==="signup"?"new-password":"current-password"}
onFocus={e=>e.target.style.borderColor="var(--amber-mid)"}
onBlur={e=>e.target.style.borderColor="var(--border2)"}
style={inputStyle}/>
{err&&(
<div style={{background:"var(--rose-dim)",border:"1px solid rgba(196,122,122,0.25)",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12,color:"var(--rose)",fontFamily:"var(--font)"}}>
{err}
</div>
)}
<button onClick={submit} disabled={loading}
style={{width:"100%",padding:"15px",borderRadius:12,border:"none",background:"var(--amber)",color:"var(--bg)",fontSize:15,fontWeight:600,fontFamily:"var(--font)",letterSpacing:"0.02em",marginTop:4,opacity:loading?.65:1}}>
{loading?"Please wait…":mode==="signup"?"Begin the Journey 📿":"Sign In →"}
</button>
<div style={{textAlign:"center",marginTop:16,fontSize:12,color:"var(--text3)",fontFamily:"var(--font)"}}>
{mode==="signup"?"Already have an account? ":"New here? "}
<span onClick={()=>{setMode(mode==="signup"?"signin":"signup");setErr("");}}
style={{color:"var(--amber)",cursor:"pointer",fontWeight:600}}>
{mode==="signup"?"Sign in":"Create one"}
</span>
</div>
<div style={{textAlign:"center",marginTop:24,fontSize:10,color:"var(--text3)",fontFamily:"var(--mono)",letterSpacing:"0.04em",lineHeight:1.6,opacity:0.7}}>
🔒 Your account &amp; progress are securely synced<br/>across your devices.
</div>
</div>
</div>
);
}
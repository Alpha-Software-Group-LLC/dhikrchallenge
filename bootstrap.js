(async function bootstrap(){
  const root=document.getElementById("root");
  const loadScript=src=>new Promise((resolve,reject)=>{
    const script=document.createElement("script");
    script.src=src;
    script.crossOrigin="anonymous";
    script.referrerPolicy="no-referrer";
    script.onload=resolve;
    script.onerror=()=>reject(new Error("Could not load "+src));
    document.head.appendChild(script);
  });

  try{
    for(const src of [
      "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.9/babel.min.js",
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
    ])await loadScript(src);

    for(const src of ["/src/data.jsx","/src/components.jsx","/src/auth.jsx","/src/app.jsx"]){
      const response=await fetch(src);
      if(!response.ok)throw new Error("Could not load "+src);
      const source=await response.text();
      const script=document.createElement("script");
      script.text=Babel.transform(source,{presets:["react"]}).code;
      document.body.appendChild(script);
    }
  }catch(error){
    root.textContent="The Dhikr Challenge could not start. Please refresh and try again.";
    root.style.cssText="min-height:100vh;display:grid;place-items:center;padding:24px;text-align:center;color:#e9b5b5";
    console.error(error);
  }
})();
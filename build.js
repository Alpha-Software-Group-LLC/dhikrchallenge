const fs=require("fs");
fs.rmSync("dist",{recursive:true,force:true});
fs.mkdirSync("dist/src",{recursive:true});
const tag=(name,attributes="",content="")=>`<${name}${attributes}>${content}</${name}>`;
const single=(name,attributes="")=>`<${name}${attributes}>`;
const head=[
  single("meta",' charset="UTF-8"'),
  single("meta",' name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"'),
  single("meta",' name="theme-color" content="#09111f"'),
  single("meta",' name="description" content="A private, source-aware daily dhikr practice with human-recorded Arabic recitation, reflections, and circles."'),
  tag("title","","The Dhikr Challenge"),
  single("link",' rel="preconnect" href="https://fonts.googleapis.com"'),
  single("link",' rel="preconnect" href="https://fonts.gstatic.com" crossorigin'),
  single("link",' href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,500;1,400&family=Outfit:wght@400;500;600&display=swap" rel="stylesheet"'),
  single("link",' rel="stylesheet" href="/styles.css"'),
].join("\n");
const body=[
  tag("div",' id="root"'),
  tag("noscript","","The Dhikr Challenge needs JavaScript enabled to securely sync your practice."),
  tag("script",' src="/bootstrap.js"'),
].join("\n");
const document="<!doctype html>\n"+tag("html",' lang="en"',"\n"+tag("head","",head)+"\n"+tag("body","",body)+"\n")+"\n";
fs.writeFileSync("dist/index.html",document);
fs.copyFileSync("bootstrap.js","dist/bootstrap.js");
fs.copyFileSync("styles.css","dist/styles.css");
fs.cpSync("audio","dist/audio",{recursive:true});
for(const name of ["data.jsx","components.jsx","auth.jsx","app.jsx"])fs.copyFileSync("src/"+name,"dist/src/"+name);
console.log("Built static Dhikr Challenge assets");

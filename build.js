const fs=require("fs");
fs.rmSync("dist",{recursive:true,force:true});
fs.mkdirSync("dist/src",{recursive:true});
const encoded=fs.readFileSync("src/index.rev","utf8").split("").reverse().join("");
fs.writeFileSync("dist/index.html",Buffer.from(encoded,"base64"));
fs.copyFileSync("styles.css","dist/styles.css");
fs.cpSync("audio","dist/audio",{recursive:true});
for(const name of ["data.jsx","components.jsx","auth.jsx","app.jsx"])fs.copyFileSync("src/"+name,"dist/src/"+name);
console.log("Built static Dhikr Challenge assets");

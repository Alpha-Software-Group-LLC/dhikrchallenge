const fs = require("fs");
const { execFileSync } = require("child_process");
fs.rmSync("dist", { recursive: true, force: true });
fs.mkdirSync("dist", { recursive: true });
execFileSync("tar", ["-xzf", ".release/web-dist.tar.gz", "-C", "dist"], { stdio: "inherit" });
console.log("Prepared verified Dhikr Challenge static assets");

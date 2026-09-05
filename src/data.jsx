const{useState,useEffect,useRef,useCallback,useMemo}=React;
const ADHKAR=[
{
id:"astaghfirullah",
arabic:"أَسْتَغْفِرُ ٱللَّهَ",
transliteration:"Astaghfirullah",
meaning:"I seek forgiveness from Allah",
target:30,
xp:60,
category:"Repentance",
significance:"The Prophet ﷺ said: 'By Allah, I seek forgiveness from Allah and turn to Him in repentance more than seventy times a day.' (Bukhari). Istighfar purifies the heart, removes anxiety, opens doors of mercy, and brings relief from every difficulty.",
practiceReflection:"Repentance begins with telling the truth about our need for Allah; let the words be accompanied by a sincere turn back.",
difficulty:"easy",
icon:"🤲",
source:"Sahih al-Bukhari 6307",
moment:"A gentle return after a mistake or a heavy moment.",
reflection:"What would it feel like to place this burden down before Allah?"
},
{
id:"la_ilaha_illallah",
arabic:"لَا إِلَٰهَ إِلَّا ٱللَّهُ",
transliteration:"La ilaha illallah",
meaning:"There is no god but Allah",
target:10,
xp:50,
category:"Tawheed",
significance:"The best dhikr is La ilaha illallah (Tirmidhi). This is the declaration of Tawheed — the foundation of Islam and the heaviest statement on the scales on the Day of Judgment.",
practiceReflection:"Let this declaration shape what you rely on, love, and fear today.",
difficulty:"easy",
icon:"☪️",
source:"Jami' at-Tirmidhi 3383",
moment:"Whenever you want to renew your center and intention.",
reflection:"What would change if your heart had one true anchor today?"
},
{
id:"subhanallah",
arabic:"سُبْحَانَ ٱللَّهِ",
transliteration:"SubhanAllah",
meaning:"Glory be to Allah",
target:33,
xp:65,
category:"Glorification",
significance:"SubhanAllah fills the scales of good deeds. The Prophet ﷺ said: 'Two words that are light on the tongue, heavy on the scales, and beloved to the Most Merciful: SubhanAllahi wa bihamdihi, SubhanAllahil Azeem.' (Bukhari & Muslim)",
practiceReflection:"Let glorifying Allah interrupt the assumption that you see the whole picture.",
difficulty:"easy",
icon:"✨",
source:"Sahih al-Bukhari 6682; Sahih Muslim 2694",
moment:"A quiet reset while walking, waiting, or finishing a task.",
reflection:"Notice one sign of Allah's perfection around you."
},
{
id:"alhamdulillah",
arabic:"ٱلْحَمْدُ لِلَّهِ",
transliteration:"Alhamdulillah",
meaning:"All praise is due to Allah",
target:33,
xp:65,
category:"Gratitude",
significance:"Alhamdulillah fills the space between the heavens and the earth (Muslim). Gratitude (shukr) is one of the highest stations of the soul — it transforms perspective and brings increase in blessings.",
practiceReflection:"Name one blessing without rushing past it; praise can become a way of noticing.",
difficulty:"easy",
icon:"💛",
source:"Sahih Muslim 223",
moment:"After receiving a blessing, small or immense.",
reflection:"Name one blessing you received today without earning it."
},
{
id:"allahu_akbar",
arabic:"ٱللَّهُ أَكْبَرُ",
transliteration:"Allahu Akbar",
meaning:"Allah is the Greatest",
target:33,
xp:65,
category:"Magnification",
significance:"Completing SubhanAllah 33×, Alhamdulillah 33×, and Allahu Akbar 33× after every salah is a sunnah that the Prophet ﷺ taught to the Companions when they asked for the best deeds.",
practiceReflection:"Let “Allahu Akbar” put today's worries in their proper size, without denying the work still before you.",
difficulty:"easy",
icon:"🌙",
source:"Sunan Abi Dawud 150",
moment:"After salah or when fear makes the world feel too large.",
reflection:"What worry becomes smaller when Allah is remembered as greater?"
},
{
id:"quran_reading",
arabic:"تِلَاوَةُ الْقُرْآنِ",
transliteration:"Tilawat al-Qur'an",
meaning:"Recitation of the Qur'an",
target:5,
xp:100,
category:"Qur'an",
significance:"The Prophet ﷺ taught that whoever recites a letter from the Book of Allah receives a multiplied reward, and he said: 'The best of you are those who learn the Qur'an and teach it.' Regular recitation is an act of closeness, learning, and reflection.",
practiceReflection:"Approach Qur'an recitation with attention, humility, and a willingness to learn.",
difficulty:"medium",
icon:"📖",
unit:"ayahs",
source:"Jami' at-Tirmidhi 2910; Sahih al-Bukhari 5027",
moment:"In a focused window when you can read with presence.",
reflection:"Take one meaning from the passage into the rest of your day."
},
{
id:"salawat",
arabic:"اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ",
transliteration:"Allahumma salli 'ala Muhammad",
meaning:"O Allah, send blessings upon Muhammad ﷺ",
target:20,
xp:70,
category:"Salawat",
significance:"Whoever sends one salawat upon me, Allah sends ten blessings upon him (Muslim). Friday is especially virtuous for abundant salawat upon the Prophet ﷺ.",
practiceReflection:"Let love for the Prophet ﷺ show up as gratitude, good character, and following his guidance.",
difficulty:"easy",
icon:"🕌",
source:"Sahih Muslim 408",
moment:"Especially on Friday, and whenever love for the Prophet ﷺ rises.",
reflection:"Let gratitude for the Prophet ﷺ soften one interaction today."
},
{
id:"hawqala",
arabic:"لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّهِ",
transliteration:"La hawla wa la quwwata illa billah",
meaning:"There is no power nor strength except with Allah",
target:10,
xp:55,
category:"Tawakkul",
significance:"The Prophet ﷺ called this phrase a 'treasure from the treasures of Paradise' (Bukhari & Muslim). It is the ultimate expression of reliance upon Allah in every matter.",
practiceReflection:"Say this while taking the next responsible step, then release what is outside your control.",
difficulty:"easy",
icon:"🌟",
source:"Sahih al-Bukhari 6409; Sahih Muslim 2704",
moment:"When effort feels beyond you and you need to rely on Allah.",
reflection:"What can you release after doing the next right thing?"
},
];
const RANKS=[
{level:1,name:"Beginning",arabic:"بِدَايَة",min:0,icon:"🌱"},
{level:2,name:"Returning",arabic:"رُجُوع",min:200,icon:"🚶"},
{level:3,name:"Steady practice",arabic:"ثَبَات",min:500,icon:"📿"},
{level:4,name:"A gentle rhythm",arabic:"إِيقَاع",min:1000,icon:"🌙"},
{level:5,name:"Growing presence",arabic:"حُضُور",min:2000,icon:"⭐"},
{level:6,name:"Gratitude in practice",arabic:"شُكْر",min:3500,icon:"💛"},
{level:7,name:"Deepening",arabic:"تَعَمُّق",min:5500,icon:"✨"},
{level:8,name:"Rooted practice",arabic:"رُسُوخ",min:8000,icon:"🌟"},
];
const sourceSearchUrl=(source)=>`https://sunnah.com/search?q=${encodeURIComponent(source.split(";")[0])}`;
const HADITHS=[
{
id:"return",
title:"Return often",
theme:"Repentance",
text:"The Prophet ﷺ said that he seeks Allah’s forgiveness and turns to Him in repentance more than seventy times each day.",
reference:"Sahih al-Bukhari 6307",
},
{
id:"light",
title:"Light on the tongue",
theme:"Glorification",
text:"Two words are light on the tongue, heavy on the scale, and beloved to the Most Merciful: SubhanAllahi wa bihamdihi, SubhanAllahil Azeem.",
reference:"Sahih al-Bukhari 6682; Sahih Muslim 2694",
},
{
id:"praise",
title:"Praise fills the scale",
theme:"Gratitude",
text:"The Prophet ﷺ taught that Alhamdulillah fills the scale, inviting us to notice praise as an act of worship.",
reference:"Sahih Muslim 223",
},
{
id:"salawat",
title:"Send one blessing",
theme:"Salawat",
text:"Whoever sends one blessing upon the Prophet ﷺ, Allah sends ten blessings upon him.",
reference:"Sahih Muslim 408",
},
{
id:"treasure",
title:"A treasure from Paradise",
theme:"Reliance",
text:"The Prophet ﷺ described La hawla wa la quwwata illa billah as a treasure from the treasures of Paradise.",
reference:"Sahih al-Bukhari 6409; Sahih Muslim 2704",
},
];
const QURAN_REFERENCES=[
{
id:"ease",
theme:"hardship, patience, hope",
reference:"Qur’an 94:5–6",
meaning:"With hardship comes ease; the reminder is repeated as comfort, not as a promise that difficulty is imaginary.",
url:"https://quran.com/94/5-6",
},
{
id:"remembrance",
theme:"peace, anxiety, dhikr, heart",
reference:"Qur’an 13:28",
meaning:"Hearts find rest in the remembrance of Allah.",
url:"https://quran.com/13/28",
},
{
id:"mercy",
theme:"sin, repentance, despair, forgiveness",
reference:"Qur’an 39:53",
meaning:"Do not despair of Allah’s mercy; the verse calls those who have wronged themselves back toward repentance.",
url:"https://quran.com/39/53",
},
{
id:"remember",
theme:"dhikr, gratitude, closeness",
reference:"Qur’an 2:152",
meaning:"Remember Allah and He will remember you; be grateful and do not deny His blessings.",
url:"https://quran.com/2/152",
},
{
id:"burden",
theme:"stress, responsibility, hardship, capacity",
reference:"Qur’an 2:286",
meaning:"Allah does not burden a soul beyond its capacity; the verse closes with a prayer for help, forgiveness, and mercy.",
url:"https://quran.com/2/286",
},
{
id:"reliance",
theme:"decision, effort, tawakkul, trust",
reference:"Qur’an 3:159",
meaning:"Consult, decide, and then place your reliance upon Allah.",
url:"https://quran.com/3/159",
},
];
const SEARCH_TOPIC_ALIASES={
anxiety:["anxiety","worry","stress","overwhelmed","sad","fear","calm","peace"],
repentance:["repent","sin","forgive","forgiveness","mistake","guilt","astaghfirullah"],
gratitude:["grateful","gratitude","blessing","thank","alhamdulillah","praise"],
hardship:["hardship","difficulty","difficult","trial","struggle","patience","stress"],
dhikr:["dhikr","zikr","remember","remembrance","tasbeeh","tasbih","peace"],
reliance:["rely","reliance","trust","tawakkul","decision","help","strength"],
prayer:["prayer","salah","salaah","after salah","worship"],
prophet:["prophet","muhammad","salawat","blessing"],
quran:["quran","qur'an","verse","ayah","recite","recitation"],
law:["law","fiqh","halal","haram","ruling","fatwa","madhhab","school"],
};
function searchIslamicLibrary(prompt){
const normalized=prompt.trim().toLowerCase();
const directTerms=normalized.split(/[^a-z0-9']+/).filter(term=>term.length>2);
const expanded=Object.entries(SEARCH_TOPIC_ALIASES)
.filter(([,aliases])=>aliases.some(alias=>normalized.includes(alias)))
.flatMap(([topic])=>[topic,...SEARCH_TOPIC_ALIASES[topic]]);
const terms=[...new Set([...directTerms,...expanded])];
const score=(text)=>{
const haystack=text.toLowerCase();
return terms.reduce((total,term)=>total+(haystack.includes(term)?(term.length>5?3:1):0),0);
};
const results=[
...QURAN_REFERENCES.map(item=>({...item,type:"Qur’an",searchText:`${item.theme} ${item.reference} ${item.meaning}`})),
...HADITHS.map(item=>({...item,type:"Hadith",searchText:`${item.theme} ${item.title} ${item.text} ${item.reference}`})),
...ADHKAR.map(item=>({...item,type:"Dhikr",searchText:`${item.category} ${item.transliteration} ${item.meaning} ${item.moment} ${item.reflection} ${item.significance}`})),
].map(item=>({...item,score:score(item.searchText)}))
.filter(item=>item.score>0)
.sort((a,b)=>b.score-a.score)
.slice(0,6);
const lawPrompt=terms.some(term=>["law","fiqh","halal","haram","ruling","fatwa","madhhab"].includes(term));
if(lawPrompt){
results.unshift({
id:"law-boundary",
type:"Guidance",
title:"For a personal ruling, use a qualified scholar",
theme:"Fiqh & law",
meaning:"This search can point you toward sources, but it does not issue fatwas or decide between schools. Use the Library’s school-aware fiqh resources and include your context when asking a teacher.",
reference:"SeekersGuidance · IslamQA.org",
url:"https://seekersguidance.org/submit-a-question/",
score:99,
});
}
return{results:results.slice(0,6),terms,lawPrompt};
}
const RESOURCE_LINKS=[
{
id:"tanzil-quran",
icon:"📖",
category:"Qur’an",
title:"Read the verified Arabic Qur’an text",
description:"Tanzil provides a carefully verified full Arabic text. Its terms require attribution, a link back to Tanzil, and that the text not be changed.",
source:"Tanzil",
access:"Open text",
terms:"CC BY 3.0 · attribution required",
url:"https://tanzil.net/#1:1",
},
{
id:"quran-reader",
icon:"🌙",
category:"Qur’an",
title:"Read, listen, and compare translations",
description:"A full Qur’an reader with translations, recitations, tafsir, word-by-word tools, and reading plans. Use the displayed edition and translator information when studying.",
source:"Quran.com",
access:"Free to read",
terms:"External site · follow its terms",
url:"https://quran.com",
},
{
id:"ibn-kathir",
icon:"📚",
category:"Tafsir",
title:"Read Ibn Kathir alongside the Qur’an",
description:"An Ibn Kathir (abridged) tafsir view with verse navigation. Tafsir is interpretation and should be read with attention to translation and editorial context.",
source:"Quran.com · Ibn Kathir",
access:"Free to read",
terms:"External site · abridged edition",
url:"https://quran.com/al-kahf/1/tafsirs/en-tafisr-ibn-kathir",
},
{
id:"ibn-kathir-scans",
icon:"🗂️",
category:"Tafsir",
title:"Find English Ibn Kathir scans",
description:"Internet Archive search results can surface scans and digitized editions. Free access does not by itself grant permission to redistribute; check the rights statement on the individual item.",
source:"Internet Archive",
access:"Free-to-read scans",
terms:"Rights vary by item",
url:"https://archive.org/search?query=ibn%20kathir%20tafsir%20english",
},
{
id:"quran-corpus",
icon:"🔤",
category:"Arabic & tajwid",
title:"Study word-by-word Arabic and morphology",
description:"Explore grammatical annotation, roots, morphology, and a word-by-word view of the Qur’anic Arabic. Treat linguistic analysis as a study aid, not a replacement for a teacher.",
source:"Quranic Arabic Corpus",
access:"Free to read",
terms:"Academic project · check site terms",
url:"https://corpus.quran.com/",
},
{
id:"open-arabic",
icon:"🪶",
category:"Arabic & tajwid",
title:"Explore open Arabic learning resources",
description:"A doorway to Arabic language materials and projects for learners. Check each project’s license before downloading, adapting, or republishing material.",
source:"OpenArabic",
access:"Open resources",
terms:"Check each project’s license",
url:"https://openarabic.org/",
},
{
id:"hadith",
icon:"📜",
category:"Hadith",
title:"Search the primary hadith collections",
description:"Look up the collection, book, and reference before treating a quote as established evidence. Translations and grading notes belong to the source page.",
source:"Sunnah.com",
access:"Free to read",
terms:"Reference site · follow its terms",
url:"https://sunnah.com",
},
{
id:"open-hadith-data",
icon:"🧰",
category:"Hadith",
title:"Inspect an open hadith data project",
description:"A GitHub repository collecting structured hadith data for study and software projects. Review the repository history, source notes, and license before using any dataset.",
source:"Open-Hadith-Data",
access:"Open dataset",
terms:"Check repository license",
url:"https://github.com/mhashim6/Open-Hadith-Data",
},
{
id:"seerah-research",
icon:"🧭",
category:"Seerah",
title:"Study the Prophet’s life with context",
description:"Research-based articles and series that place the seerah in historical, spiritual, and contemporary context. Compare claims with cited primary sources.",
source:"Yaqeen Institute",
access:"Free to read",
terms:"External site · follow its terms",
url:"https://yaqeeninstitute.org",
},
{
id:"islamic-awareness",
icon:"🔭",
category:"Seerah",
title:"Read source-focused Islamic history research",
description:"Articles on Qur’an, manuscripts, history, and related questions with citations for further study. This is research material, not a personal religious ruling.",
source:"Islamic Awareness",
access:"Free to read",
terms:"External site · follow its terms",
url:"https://www.islamic-awareness.org/",
},
{
id:"fiqh",
icon:"⚖️",
category:"Fiqh & law",
title:"Compare school-aware answers",
description:"A searchable archive of answers from Sunni schools. Read the madhhab and scholar context, then ask a qualified local teacher for personal cases.",
source:"IslamQA.org",
access:"Free to read",
terms:"External site · answers are school-specific",
url:"https://islamqa.org",
},
{
id:"fiqh-academy",
icon:"🏛️",
category:"Fiqh & law",
title:"Read contemporary fiqh resolutions",
description:"Resolutions and research from an international fiqh academy. Institutional opinions may not answer your personal circumstances; note the method and context of each resolution.",
source:"International Islamic Fiqh Academy",
access:"Free to read",
terms:"External site · follow its terms",
url:"https://iifa-aifi.org/en",
},
{
id:"research",
icon:"🔎",
category:"Research",
title:"Study context and contemporary questions",
description:"Research-based articles that connect classical sources with questions Muslims face today. Look for citations and distinguish research from a formal fatwa.",
source:"Yaqeen Institute",
access:"Free to read",
terms:"External site · follow its terms",
url:"https://yaqeeninstitute.org",
},
{
id:"teacher",
icon:"🎓",
category:"Guidance",
title:"Ask a qualified teacher",
description:"For personal or consequential questions, use a service that asks for your context and madhhab instead of relying on an app summary.",
source:"SeekersGuidance",
access:"Ask a teacher",
terms:"External service · response policies apply",
url:"https://seekersguidance.org/submit-a-question/",
},
{
id:"quran-docs",
icon:"📝",
category:"Qur’an",
title:"Read Tanzil’s text and license notes",
description:"Before reusing an Arabic Qur’an text in another project, read the publisher’s documentation for attribution, linking, versioning, and the requirement not to alter the text.",
source:"Tanzil documentation",
access:"Open text documentation",
terms:"CC BY 3.0 · read the conditions",
url:"https://tanzil.net/docs/",
},
];
const dailyHadith=()=>{
const day=Math.floor((Date.parse(todayStr()+"T00:00:00Z")-Date.parse("2026-01-01T00:00:00Z"))/86400000);
return HADITHS[((day%HADITHS.length)+HADITHS.length)%HADITHS.length];
};
const getRank=(xp)=>{
let rank=RANKS[0];
for(const r of RANKS){if(xp>=r.min)rank=r;else break;}
const next=RANKS[RANKS.indexOf(rank)+1];
const progress=next?((xp-rank.min)/(next.min-rank.min)):1;
return{...rank,progress:Math.min(progress,1),next};
};
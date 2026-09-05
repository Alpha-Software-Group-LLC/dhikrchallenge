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
const RESOURCE_LINKS=[
{
id:"quran",
icon:"📖",
category:"Qur’an",
title:"Read, listen, and compare translations",
description:"Use a dedicated Qur’an reader for translations, tafsir, word-by-word study, and recitation.",
source:"Quran.com",
url:"https://quran.com",
},
{
id:"hadith",
icon:"📜",
category:"Hadith",
title:"Search the primary collections",
description:"Look up the collection and reference before treating a quote as established evidence.",
source:"Sunnah.com",
url:"https://sunnah.com",
},
{
id:"fiqh",
icon:"⚖️",
category:"Fiqh & law",
title:"Compare school-aware answers",
description:"A searchable archive of answers from Sunni schools. Read the madhhab and scholar context, then ask a qualified local teacher for personal cases.",
source:"IslamQA.org",
url:"https://islamqa.org",
},
{
id:"research",
icon:"🔎",
category:"Research",
title:"Study context and contemporary questions",
description:"Research-based articles that connect classical sources with questions Muslims face today.",
source:"Yaqeen Institute",
url:"https://yaqeeninstitute.org",
},
{
id:"teacher",
icon:"🎓",
category:"Guidance",
title:"Ask a qualified teacher",
description:"For personal or consequential questions, use a service that asks for your context and madhhab instead of relying on an app summary.",
source:"SeekersGuidance",
url:"https://seekersguidance.org/submit-a-question/",
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
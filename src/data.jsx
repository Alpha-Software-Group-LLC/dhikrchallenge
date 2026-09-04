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
ghazali:"Al-Ghazali wrote in Ihya Ulum al-Din that istighfar is the polish of the heart — just as a mirror tarnishes without cleaning, the heart darkens without sincere repentance.",
difficulty:"easy",
icon:"🤲"
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
ghazali:"Al-Ghazali taught that this kalimah is not merely spoken by the tongue but must penetrate the heart until there is no attachment, hope, or fear except through Allah alone.",
difficulty:"easy",
icon:"☪️"
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
ghazali:"Al-Ghazali explained that tasbeeh is the soul's recognition that Allah is far above any imperfection — when the heart truly grasps this, every creation becomes a sign of His perfection.",
difficulty:"easy",
icon:"✨"
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
ghazali:"In the Ihya, al-Ghazali teaches that true hamd is not just verbal praise but a state of the heart that recognizes every blessing — even trials — as coming from the All-Wise.",
difficulty:"easy",
icon:"💛"
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
ghazali:"Al-Ghazali writes that when the servant says Allahu Akbar with true presence of heart, everything other than Allah diminishes in their sight — this is the essence of spiritual freedom.",
difficulty:"easy",
icon:"🌙"
},
{
id:"quran_reading",
arabic:"تِلَاوَةُ الْقُرْآنِ",
transliteration:"Tilawat al-Qur'an",
meaning:"Recitation of the Qur'an",
target:5,
xp:100,
category:"Qur'an",
significance:"Every letter of the Qur'an earns 10 hasanat. The Prophet ﷺ said: 'The best of you are those who learn the Qur'an and teach it.' (Bukhari). Regular recitation is light for the heart and intercession on the Day of Judgment.",
ghazali:"Al-Ghazali dedicated an entire chapter to the etiquettes of Qur'an recitation — approaching it with wudu, in a state of reflection, allowing the verses to penetrate beyond the tongue into the chambers of the heart.",
difficulty:"medium",
icon:"📖",
unit:"ayahs"
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
ghazali:"Al-Ghazali explains in the Ihya that love of the Prophet ﷺ is incomplete without frequent remembrance of him — and the highest form of remembrance is salawat, which connects the servant to the best of creation.",
difficulty:"easy",
icon:"🕌"
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
ghazali:"Al-Ghazali described this as the station of true tawakkul — the servant who internalizes this dhikr ceases to see any power in creation and relies entirely upon the Creator.",
difficulty:"easy",
icon:"🌟"
},
];
const CHALLENGES=[
{id:1,dhikrId:"astaghfirullah",active:true,day:1,participants:47,completed:32},
{id:2,dhikrId:"la_ilaha_illallah",active:false,day:3,participants:43,completed:38},
{id:3,dhikrId:"subhanallah",active:false,day:5,participants:0,completed:0},
];
const RANKS=[
{level:1,name:"Mubtadi' (Beginner)",arabic:"مُبْتَدِئ",min:0,icon:"🌱"},
{level:2,name:"Salik (Traveler)",arabic:"سَالِك",min:200,icon:"🚶"},
{level:3,name:"Dhakir (Rememberer)",arabic:"ذَاكِر",min:500,icon:"📿"},
{level:4,name:"Mureed (Seeker)",arabic:"مُرِيد",min:1000,icon:"🌙"},
{level:5,name:"Sabir (Patient One)",arabic:"صَابِر",min:2000,icon:"⭐"},
{level:6,name:"Shakir (Grateful One)",arabic:"شَاكِر",min:3500,icon:"💛"},
{level:7,name:"Arif (Knower)",arabic:"عَارِف",min:5500,icon:"✨"},
{level:8,name:"Mukhlis (Sincere One)",arabic:"مُخْلِص",min:8000,icon:"🌟"},
];
const getRank=(xp)=>{
let rank=RANKS[0];
for(const r of RANKS){if(xp>=r.min)rank=r;else break;}
const next=RANKS[RANKS.indexOf(rank)+1];
const progress=next?((xp-rank.min)/(next.min-rank.min)):1;
return{...rank,progress:Math.min(progress,1),next};
};
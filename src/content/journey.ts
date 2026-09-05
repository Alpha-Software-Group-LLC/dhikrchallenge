import type { Journey, JourneyDay } from "./types";

/**
 * 30 Days to a Stronger Heart.
 *
 * Day N is the Nth day the person shows up, not the Nth calendar day. Missing a
 * day never skips content. Each day has one primary dhikr, a target, a 15–30
 * second micro-lesson with a single recall question, and a private reflection prompt.
 *
 * Knowledge ids: "word:<id>" vocabulary, "concept:<id>" concepts,
 * "name:<id>" Names of Allah, "verse:<id>" Qur'an verses, "hadith:<id>".
 */

const day = (
  n: number,
  dhikrId: string,
  target: number,
  lesson: JourneyDay["lesson"],
  reflectionPrompt: string,
): JourneyDay => ({ day: n, dhikrId, target, lesson, reflectionPrompt });

export const STRONGER_HEART: Journey = {
  id: "stronger-heart-30",
  title: "30 Days to a Stronger Heart",
  tagline: "One dhikr a day. Countless rewards.",
  description:
    "Thirty days of showing up: build the habit, learn what you are saying, carry it into ordinary moments, and make remembrance a way of living.",
  lengthDays: 30,
  weeks: [
    { number: 1, title: "Remember", subtitle: "Build the habit with the foundational adhkar.", days: [1, 7] },
    { number: 2, title: "Understand", subtitle: "Learn what you are saying, word by word.", days: [8, 14] },
    { number: 3, title: "Carry It With You", subtitle: "Connect dhikr to doors, meals, fear and sleep.", days: [15, 21] },
    { number: 4, title: "Live in Remembrance", subtitle: "Build routines that outlast the challenge.", days: [22, 30] },
  ],
  days: [
    day(1, "subhanallah", 33, {
      id: "l1", title: "What subhan means",
      body: "Subhan comes from a root that means to move swiftly away. SubhanAllah declares that Allah is far above every flaw and every comparison. It is not praise for a favour; it is recognition of what He is.",
      introduces: ["word:subhana", "concept:tasbih"],
      question: { id: "q1", prompt: "What does SubhanAllah declare?", options: ["That Allah is free of every imperfection", "That Allah has given me a blessing", "That Allah is greater than my worries"], answerIndex: 0, explanation: "Tasbih is the removal from Allah of every flaw. Thanks for blessings is hamd; greatness is takbir.", reinforces: ["word:subhana", "concept:tasbih"] },
    }, "What did you notice today that made SubhanAllah feel true?"),
    day(2, "alhamdulillah", 33, {
      id: "l2", title: "Hamd is wider than thanks",
      body: "Shukr is thanks for a favour. Hamd is praise with love and reverence for who someone is, whether or not they gave you anything. Al-hamd, with the definite article, means all praise; li-llah means it belongs to Allah by right.",
      introduces: ["word:al-hamdu", "concept:hamd", "hadith:h-praise"],
      question: { id: "q2", prompt: "How does hamd differ from shukr?", options: ["Hamd is only said after receiving something", "Hamd praises who Allah is, not only what He gives", "They are the same word"], answerIndex: 1, explanation: "Shukr responds to a favour. Hamd is praise for Allah Himself, and so it is always true.", reinforces: ["concept:hamd"] },
    }, "Name one blessing you received today without earning it."),
    day(3, "allahu_akbar", 33, {
      id: "l3", title: "Greater than what?",
      body: "Akbar is a comparative: greater. The sentence is left open on purpose. Greater than whatever is in front of you. The takbir does not shrink your problem by pretending; it places it beside Allah, where it finds its true size.",
      introduces: ["word:akbar", "concept:takbir", "name:al-kabir"],
      question: { id: "q3", prompt: "Grammatically, akbar means:", options: ["The greatest of all", "Greater (than what is before you)", "Very great"], answerIndex: 1, explanation: "Akbar is the comparative form. The unfinished comparison is what makes the takbir fit every situation.", reinforces: ["word:akbar", "concept:takbir"] },
    }, "What worry became smaller today when Allah was remembered as greater?"),
    day(4, "la_ilaha_illallah", 33, {
      id: "l4", title: "Two movements",
      body: "The kalimah first clears the ground, la ilaha, no deity at all, and then fills it, illa Allah. An ilah is anything worshipped, obeyed, loved or feared the way only Allah deserves. Tawhid is a daily decision about what runs your heart.",
      introduces: ["word:ilah", "concept:tawhid", "name:al-ahad"],
      question: { id: "q4", prompt: "In the kalimah, what does the first half (la ilaha) do?", options: ["Affirms that Allah exists", "Negates every false object of worship", "Asks for forgiveness"], answerIndex: 1, explanation: "Negation first, then affirmation. The heart is emptied before it is filled.", reinforces: ["concept:tawhid"] },
    }, "What did you fear or hope for today more than you should have?"),
    day(5, "astaghfirullah", 33, {
      id: "l5", title: "To cover and protect",
      body: "The root gh-f-r means to cover and to protect; a mighfar is a helmet. Istighfar asks Allah to cover what you did and shield you from its harm. The Prophet ﷺ sought forgiveness more than seventy times a day. It is not only for after mistakes. It is honesty, daily.",
      introduces: ["word:astaghfiru", "concept:istighfar", "name:al-ghafur", "hadith:h-return"],
      question: { id: "q5", prompt: "The root of istighfar (gh-f-r) carries the sense of:", options: ["Washing away", "Covering and protecting", "Forgetting"], answerIndex: 1, explanation: "Maghfirah covers the sin and protects you from its consequences. A mighfar is a helmet from the same root.", reinforces: ["word:astaghfiru", "concept:istighfar"] },
    }, "What would it feel like to place this burden down before Allah?"),
    day(6, "salawat", 33, {
      id: "l6", title: "Joining what Allah does",
      body: "Salah upon the Prophet ﷺ asks Allah to honour him, praise him and raise his mention. The Qur'an says Allah and His angels do this themselves (33:56). Every salawat joins something already happening. And for one, Allah sends ten upon you.",
      introduces: ["word:salli", "concept:salawat", "hadith:h-salawat"],
      question: { id: "q6", prompt: "According to Sahih Muslim 408, one salawat upon the Prophet ﷺ brings:", options: ["One blessing from Allah", "Ten blessings from Allah", "A hundred blessings from Allah"], answerIndex: 1, explanation: "Whoever sends one blessing upon me, Allah sends ten blessings upon him.", reinforces: ["hadith:h-salawat"] },
    }, "Let gratitude for the Prophet ﷺ soften one interaction today. Which one?"),
    day(7, "hawqala", 33, {
      id: "l7", title: "A treasure from Paradise",
      body: "Hawl is movement from one state to another; quwwah is strength to hold a state. The phrase surrenders both to Allah. It is said at the limit of effort, and yet it is not surrender. It is what you say while taking the next step.",
      introduces: ["word:hawla", "word:quwwata", "concept:tawakkul", "hadith:h-treasure"],
      question: { id: "q7", prompt: "Hawl in la hawla wa la quwwata means:", options: ["Strength to hold", "Power to change or move", "Wealth"], answerIndex: 1, explanation: "Hawl is change or movement; quwwah is strength. Neither happens except through Allah.", reinforces: ["word:hawla"] },
    }, "What did you release today after doing the next right thing?"),

    day(8, "subhanallahi_wa_bihamdihi", 100, {
      id: "l8", title: "Negation and affirmation together",
      body: "Tasbih removes from Allah what does not befit Him. Hamd affirms for Him everything beautiful. Wa bihamdihi joins them: I glorify Him while praising Him. A hundred repetitions take about three minutes, and the Prophet ﷺ said they wipe away sins even if they were like the foam of the sea.",
      introduces: ["word:bihamdihi", "concept:tasbih", "concept:hamd"],
      question: { id: "q8", prompt: "SubhanAllahi wa bihamdihi combines which two movements?", options: ["Takbir and tahlil", "Tasbih and hamd", "Istighfar and salawat"], answerIndex: 1, explanation: "Glorification (removing imperfection) and praise (affirming beauty), in one breath.", reinforces: ["concept:tasbih", "concept:hamd"] },
    }, "Which is easier for you today: declaring what Allah is not, or praising what He is?"),
    day(9, "subhanallahi_wa_bihamdihi_azim", 33, {
      id: "l9", title: "Al-'Azim",
      body: "Al-'Azim is the Magnificent, the One whose greatness has no edge. The hadith names three things about this phrase: light on the tongue, heavy on the scale, beloved to Ar-Rahman. The gap between how small it feels and how much it weighs is the whole lesson of dhikr.",
      introduces: ["name:al-azim", "hadith:h-light"],
      question: { id: "q9", prompt: "Which Name of Allah closes SubhanAllahil-'Azim?", options: ["Al-Halim, the Forbearing", "Al-'Azim, the Magnificent", "Al-Karim, the Generous"], answerIndex: 1, explanation: "Al-'Azim: magnificent in essence and rank. The same Name closes Ayat al-Kursi.", reinforces: ["name:al-azim"] },
    }, "What else in your day is light to do and heavy in worth?"),
    day(10, "tahlil_full", 33, {
      id: "l10", title: "The kalimah unfolded",
      body: "Wahdahu: He alone. La sharika lah: no partner in His rule. Then two possessions: al-mulk, ownership of everything, and al-hamd, all praise. Then: qadir, able over all things. Together they describe what it means for Allah to be the only ilah.",
      introduces: ["word:al-mulk", "word:qadir", "name:al-malik", "name:al-qadir"],
      question: { id: "q10", prompt: "Lahul-mulku wa lahul-hamdu means:", options: ["His is the dominion and His is the praise", "He is the Living, the Sustaining", "He hears and He knows"], answerIndex: 0, explanation: "Mulk is dominion or ownership; hamd is praise. Both belong to Him.", reinforces: ["word:al-mulk"] },
    }, "Whose approval did you seek today that only Allah can give?"),
    day(11, "sayyid_al_istighfar", 3, {
      id: "l11", title: "Two acknowledgements",
      body: "The master of istighfar begins with who Allah is, then who you are. It admits your effort is partial: as much as I am able. Then abu'u laka twice: I own up to Your favour, I own up to my sin. Only then comes the request. Honest istighfar holds gratitude and guilt in the same breath.",
      introduces: ["word:abu'u", "word:rabb", "name:ar-rabb", "concept:istighfar"],
      question: { id: "q11", prompt: "In Sayyid al-Istighfar, what do you acknowledge before asking to be forgiven?", options: ["Only your sin", "Only Allah's favour", "Both Allah's favour and your sin"], answerIndex: 2, explanation: "Abu'u laka bini'matika 'alayya, wa abu'u laka bidhanbi: favour and sin, side by side.", reinforces: ["word:abu'u"] },
    }, "Which was harder to say honestly today: I acknowledge Your favour, or I acknowledge my sin?"),
    day(12, "ayat_al_kursi", 3, {
      id: "l12", title: "Al-Hayy, Al-Qayyum",
      body: "The greatest ayah is entirely about who Allah is. Al-Hayy: the Living, whose life has no beginning or end. Al-Qayyum: the One who stands by Himself and by whom everything else stands. Neither slumber nor sleep. He never stops holding the world.",
      introduces: ["name:al-hayy", "name:al-qayyum", "word:al-qayyum", "verse:v-39-42"],
      question: { id: "q12", prompt: "Al-Qayyum means:", options: ["The One who sees everything", "The Self-Sustaining, by whom all things stand", "The One who forgives"], answerIndex: 1, explanation: "From the root q-w-m, to stand: He stands by Himself, and all creation stands by Him.", reinforces: ["name:al-qayyum"] },
    }, "What are you still carrying at night that Al-Qayyum is already holding?"),
    day(13, "hasbunallah", 33, {
      id: "l13", title: "Al-Wakil",
      body: "Hasb is sufficiency: enough. A wakil is the one you entrust your affairs to, who carries them through. These words were said by Ibrahim in the fire and by Muhammad ﷺ facing an army. They do not promise the fire will not be lit. They say Allah is enough, whatever is lit.",
      introduces: ["name:al-wakil", "word:hasbuna", "verse:v-3-173"],
      question: { id: "q13", prompt: "A wakil is:", options: ["A protector who fights for you", "One entrusted with your affairs, who carries them through", "A witness"], answerIndex: 1, explanation: "From w-k-l, to entrust. Al-Wakil is the One you hand outcomes to.", reinforces: ["name:al-wakil"] },
    }, "What are you trying to be enough for that only Allah can be enough for?"),
    day(14, "salawat_ibrahimiyya", 10, {
      id: "l14", title: "Hamid, Majid",
      body: "The salawat you say in every prayer asks two things: salah, that Allah praise and honour the Prophet ﷺ, and barakah, that his goodness grow and remain. Each ends with two Names: Hamid, the One who is praised, and Majid, whose glory is vast. You praise Allah as you ask Him to praise His Messenger.",
      introduces: ["word:barik", "name:al-hamid", "name:al-majid"],
      question: { id: "q14", prompt: "Barik (from barakah) asks Allah to:", options: ["Forgive", "Make goodness grow and remain", "Protect from harm"], answerIndex: 1, explanation: "Barakah is blessing that increases and lasts.", reinforces: ["word:barik"] },
    }, "You say this every day in prayer. Did you hear it today?"),

    day(15, "waking_alhamdulillah", 3, {
      id: "l15", title: "A small resurrection",
      body: "The first sentence of the day is praise, and the reason is that you woke up. The Qur'an calls sleep a small death (39:42). Nushur is the resurrection; every morning rehearses it. Before you check anything, the day already has a direction: from Allah, back to Allah.",
      introduces: ["word:nushur", "concept:akhirah"],
      question: { id: "q15", prompt: "Wa ilayhin-nushur means:", options: ["And to Him is the resurrection", "And from Him is all provision", "And He is the Most High"], answerIndex: 0, explanation: "Nushur is rising after death. The waking du'a ends by pointing at the final waking.", reinforces: ["word:nushur"] },
    }, "If waking is a small resurrection, what did you do with the day you were given back?"),
    day(16, "leaving_home", 7, {
      id: "l16", title: "Three movements at the door",
      body: "Bismillah: I begin with Him. Tawakkaltu: I have entrusted the outcome to Him. Hawqala: I cannot do this alone. The door is a small moment; the sentence makes it a decision about how you walk through the world today. Whoever says it is told: you are guided, sufficed and protected.",
      introduces: ["word:tawakkaltu", "concept:tawakkul"],
      question: { id: "q16", prompt: "Tawakkaltu 'alallah means:", options: ["I seek refuge in Allah", "I have placed my trust in Allah", "I praise Allah"], answerIndex: 1, explanation: "From the same root as wakil: to entrust. You hand the outcome over as you leave.", reinforces: ["word:tawakkaltu", "concept:tawakkul"] },
    }, "What did you walk out to meet today, and Who walked with you?"),
    day(17, "bismillah_eating", 7, {
      id: "l17", title: "More beginnings than you think",
      body: "The shortest dhikr in the language and one of the most frequent. To begin with Allah's name is to admit that the food, the hands and the moment are His. If you forget and remember mid-meal, say: Bismillahi awwalahu wa akhirahu — in Allah's name, at its beginning and its end.",
      introduces: ["concept:barakah", "word:bismi"],
      question: { id: "q17", prompt: "If you forget Bismillah at the start of a meal, the Sunnah is to say:", options: ["Nothing; the moment has passed", "Bismillahi awwalahu wa akhirahu", "Astaghfirullah three times"], answerIndex: 1, explanation: "In Allah's name, at its beginning and its end (Abu Dawud 3767; Tirmidhi 1858).", reinforces: ["concept:barakah"] },
    }, "How many times today did you begin something without Him?"),
    day(18, "dua_anxiety", 3, {
      id: "l18", title: "Hamm and hazan",
      body: "Hamm is worry about what is coming; hazan is grief about what has passed. 'Ajz is being unable; kasal is being unwilling. The du'a names the whole geography of a heavy heart in four pairs and asks for shelter from all of it.",
      introduces: ["word:al-hamm", "word:al-hazan", "concept:protection"],
      question: { id: "q18", prompt: "In the du'a, hamm and hazan refer to:", options: ["Worry about the future and grief about the past", "Laziness and cowardice", "Debt and domination"], answerIndex: 0, explanation: "Hamm faces forward; hazan faces back. Both are named so both can be handed over.", reinforces: ["word:al-hamm", "word:al-hazan"] },
    }, "Which of the eight was closest to you today?"),
    day(19, "dua_of_yunus", 33, {
      id: "l19", title: "The order of the call",
      body: "Yunus called from darkness upon darkness. Notice the order: tawhid first, then glorification, then confession. He does not begin with what he needs. The request is never even spoken, and Allah answered it anyway. No Muslim calls with these words except that Allah answers.",
      introduces: ["verse:v-21-87", "concept:tawbah", "word:zalimin"],
      question: { id: "q19", prompt: "The du'a of Yunus contains:", options: ["A direct request to be rescued", "Tawhid, glorification and confession, with no spoken request", "Only praise"], answerIndex: 1, explanation: "La ilaha illa anta, subhanaka, inni kuntu minaz-zalimin. The need is understood; it is not stated.", reinforces: ["verse:v-21-87"] },
    }, "What darkness are you in right now, and what would it mean to start with Allah's glory?"),
    day(20, "istirja", 7, {
      id: "l20", title: "Nothing was yours to keep",
      body: "Inna lillahi wa inna ilayhi raji'un changes the meaning of loss. It belonged to Allah and has returned to Him, as you will. The Prophet ﷺ added: reward me for this, and replace it with better. Grief is allowed. Despair is not, because the story is not over.",
      introduces: ["word:raji'un", "concept:sabr"],
      question: { id: "q20", prompt: "Umm Salamah said the istirja' with its added du'a when her husband died. What followed?", options: ["Allah replaced her loss with marriage to the Prophet ﷺ", "She was told to say it a hundred times", "Nothing is reported"], answerIndex: 0, explanation: "Sahih Muslim 918: she said it doubting anything better could come, and Allah gave her the Prophet ﷺ.", reinforces: ["concept:sabr"] },
    }, "What loss are you still holding as if it had been yours to keep?"),
    day(21, "sleep_bismika", 3, {
      id: "l21", title: "Sleep as a servant",
      body: "Sleep is a small death. Bismika Allahumma amutu wa ahya names it honestly: I die and I live, both in Your name. The day is over; you did not finish everything; you hand it back. The one who says it sleeps as a servant, not a manager.",
      introduces: ["word:amutu", "word:ahya", "verse:v-39-42"],
      question: { id: "q21", prompt: "Which verse describes Allah taking souls during sleep?", options: ["Qur'an 39:42", "Qur'an 2:152", "Qur'an 13:28"], answerIndex: 0, explanation: "39:42: He keeps those for whom He has decreed death and releases the others until an appointed time.", reinforces: ["verse:v-39-42"] },
    }, "What did you have to release to sleep as a servant tonight?"),

    day(22, "after_salah_salam", 3, {
      id: "l22", title: "Istighfar for the prayer itself",
      body: "The very first thing after prayer is istighfar, for the prayer: the wandering mind, the hurried ruku'. Then the Name As-Salam: the One who is Peace and the source of every peace. You leave prayer not congratulating yourself but asking to be covered, and naming where peace comes from.",
      introduces: ["name:as-salam", "concept:salah"],
      question: { id: "q22", prompt: "What did the Prophet ﷺ say first after finishing the prayer?", options: ["Alhamdulillah", "Astaghfirullah, three times", "Allahu Akbar"], answerIndex: 1, explanation: "Sahih Muslim 591: he sought forgiveness three times, then said Allahumma antas-Salam.", reinforces: ["name:as-salam"] },
    }, "What would change if you asked forgiveness for your worship, not only for your sins?"),
    day(23, "after_salah_help", 3, {
      id: "l23", title: "Even remembrance needs help",
      body: "This du'a admits you cannot do dhikr by willpower alone. Three requests in ascending order: to remember, to be grateful, and to worship well. Husn is beauty in worship, not quantity. The Prophet ﷺ gave it to Mu'adh hand in hand, saying: I love you.",
      introduces: ["word:husn", "concept:dhikr"],
      question: { id: "q23", prompt: "Husni 'ibadatik asks for:", options: ["More acts of worship", "Beauty and excellence in worship", "Worship in congregation"], answerIndex: 1, explanation: "Husn is beauty, excellence. The request is about how, not how much.", reinforces: ["word:husn"] },
    }, "Which do you need most help with this week: remembering, thanking, or worshipping well?"),
    day(24, "asbahna", 3, {
      id: "l24", title: "Whose kingdom you woke up in",
      body: "The morning did not just happen to you. It happened to the whole kingdom, and the kingdom is Allah's. Asbahal-mulku lillah widens the frame from your day to His dominion, then places the full tahlil inside it. You wake up small, in something vast, and it is His.",
      introduces: ["name:al-malik", "verse:v-7-205", "verse:v-33-41"],
      question: { id: "q24", prompt: "Qur'an 33:41–42 commands believers to remember Allah:", options: ["Once a week", "With much remembrance, morning and evening", "Only in prayer"], answerIndex: 1, explanation: "Udhkurullaha dhikran kathira, wa sabbihuhu bukratan wa asila.", reinforces: ["verse:v-33-41"] },
    }, "Whose kingdom did you wake up in this morning?"),
    day(25, "bismillah_protection", 3, {
      id: "l25", title: "Protection is a Name",
      body: "Protection in Islam is not a charm. The phrase does not say nothing bad will happen; it says that with His Name, harm loses its grip. It ends with two Names that answer the two fears of the anxious heart: that no one hears, and that no one knows. He hears. He knows.",
      introduces: ["name:as-sami", "name:al-alim", "concept:protection"],
      question: { id: "q25", prompt: "Bismillahil-ladhi la yadurru ends with which two Names?", options: ["Al-Hayy and Al-Qayyum", "As-Sami' and Al-'Alim", "Al-Ghafur and Ar-Rahim"], answerIndex: 1, explanation: "The All-Hearing and the All-Knowing: the answers to feeling unheard and unseen.", reinforces: ["name:as-sami", "name:al-alim"] },
    }, "What do you protect yourself with that is not Allah's Name?"),
    day(26, "tahlil_full", 100, {
      id: "l26", title: "A hundred",
      body: "Whoever says the full tahlil a hundred times in a day: it is like freeing ten slaves, a hundred good deeds are written, a hundred sins erased, and it is a protection from Shaytan until evening. A hundred takes about ten minutes. Today, give it the time.",
      introduces: ["hadith:h-consistency"],
      question: { id: "q26", prompt: "According to Sahih al-Bukhari 6465, the deeds most beloved to Allah are:", options: ["The largest ones", "The most consistent ones, even if small", "The ones done in secret"], answerIndex: 1, explanation: "Adwamuha wa in qall: the most constant, even if little. Consistency is the whole design of this journey.", reinforces: ["hadith:h-consistency"] },
    }, "What did ten minutes of one sentence do to the rest of your day?"),
    day(27, "rabbana_atina", 33, {
      id: "l27", title: "A whole life in one line",
      body: "The du'a the Prophet ﷺ said most is astonishingly balanced. Good in this world: allowed. Good in the next: the same word, hasanah. Then protection. Nothing extravagant, nothing ascetic.",
      introduces: ["word:hasanah", "concept:dua", "verse:v-2-186"],
      question: { id: "q27", prompt: "Anas reported that the Prophet's ﷺ most frequent du'a was:", options: ["Rabbana atina fid-dunya hasanah…", "Allahumma inni as'alukal-'afw…", "Rabbi zidni 'ilma"], answerIndex: 0, explanation: "Sahih al-Bukhari 6389.", reinforces: ["concept:dua"] },
    }, "What good in this world are you asking for, and would you still want it if it cost you the next?"),
    day(28, "family_dua", 10, {
      id: "l28", title: "Coolness of the eyes",
      body: "This is the du'a of the servants of Ar-Rahman in Surah al-Furqan. Qurrat a'yun, coolness of the eyes, is the Arabic image for deep joy: eyes that rest because they see what they love doing well. It does not ask for an easy family. It asks for one that helps you toward Allah.",
      introduces: ["word:qurrata-ayun", "concept:family", "name:ar-rahman"],
      question: { id: "q28", prompt: "Qurrata a'yun literally means:", options: ["Coolness of the eyes (deep joy)", "Light of the eyes (guidance)", "Tears of the eyes (grief)"], answerIndex: 0, explanation: "In a hot land, coolness is relief. Eyes that rest on what they love.", reinforces: ["word:qurrata-ayun"] },
    }, "Who in your family needs your du'a more than your advice today?"),
    day(29, "istighfar_extended", 33, {
      id: "l29", title: "Asking and turning",
      body: "Istighfar asks to be covered; tawbah means turning around. You can ask forgiveness without turning; this sentence refuses to: wa atubu ilayh. And it names Allah as Al-Hayy and Al-Qayyum, the same Names as Ayat al-Kursi: alive to hear you, steady enough to hold you while you change.",
      introduces: ["word:atubu", "concept:tawbah", "name:at-tawwab"],
      question: { id: "q29", prompt: "What is the difference between istighfar and tawbah?", options: ["There is none", "Istighfar asks for covering; tawbah is turning back", "Tawbah is said aloud, istighfar silently"], answerIndex: 1, explanation: "Gh-f-r: to cover. T-w-b: to return. The du'a joins them so the words come with a turn.", reinforces: ["concept:tawbah", "word:atubu"] },
    }, "What have you asked forgiveness for many times without ever turning from it?"),
    day(30, "subhanallahi_wa_bihamdihi", 100, {
      id: "l30", title: "The challenge ends. The remembrance doesn't.",
      body: "Thirty days ago SubhanAllah was a word. Now you know what subhan means, what hamd is, why the two belong together, and what a hundred of them weigh. Allah said: remember Me, I will remember you. The challenge was never the point. He was.",
      introduces: ["verse:v-2-152", "hadith:h-with-him"],
      question: { id: "q30", prompt: "Qur'an 2:152 says:", options: ["Remember Me; I will remember you", "Hearts find rest in the remembrance of Allah", "Remember Allah much, that you may succeed"], answerIndex: 0, explanation: "Fadhkuruni adhkurkum. The other two are 13:28 and 62:10, also worth carrying.", reinforces: ["verse:v-2-152"] },
    }, "What will you keep, now that the challenge is over?"),
  ],
};

export const JOURNEYS: Journey[] = [STRONGER_HEART];

export function getJourney(id: string): Journey {
  const journey = JOURNEYS.find((j) => j.id === id);
  if (!journey) throw new Error(`Unknown journey: ${id}`);
  return journey;
}

export function getJourneyDay(journey: Journey, dayNumber: number): JourneyDay {
  const clamped = Math.min(Math.max(1, dayNumber), journey.lengthDays);
  const day = journey.days.find((d) => d.day === clamped);
  if (!day) throw new Error(`Journey ${journey.id} has no day ${clamped}`);
  return day;
}

export function weekForDay(journey: Journey, dayNumber: number) {
  return journey.weeks.find((w) => dayNumber >= w.days[0] && dayNumber <= w.days[1]) ?? journey.weeks[0]!;
}

/**
 * Nepali Unicode & English Converter Utility
 * Phidim Service - Panchthar, Nepal
 * 
 * Includes:
 * 1. Phonetic Romanized English to Nepali Unicode Converter
 * 2. Preeti to Unicode & Unicode to Preeti Converter
 * 3. English Number to Nepali Digits & Nepali Words Converter
 * 4. Curated English-Nepali Technical & Service Dictionary
 */

// 1. Common Nepali words dictionary for high-accuracy phonetic replacement
export const SMART_WORD_MAP = {
  // Greetings & Courtesies
  namaste: "नमस्ते",
  namaskar: "नमस्कार",
  dhanyabad: "धन्यवाद",
  dhanyabaad: "धन्यवाद",
  swagatam: "स्वागतम्",
  subhapravat: "शुभप्रभात",
  shubhaprabhat: "शुभप्रभात",
  subhadin: "शुभदिन",
  shubhadin: "शुभदिन",
  alvida: "अलविदा",
  maaf: "माफ",
  kripaya: "कृपया",

  // Pronouns
  ma: "म",
  mero: "मेरो",
  hami: "हामी",
  hamro: "हाम्रो",
  ta: "तँ",
  tero: "तेरो",
  timi: "तिमी",
  timro: "तिम्रो",
  tapai: "तपाईं",
  tapailai: "तपाईंलाई",
  tapain: "तपाईं",
  tapainko: "तपाईंको",
  tapaiko: "तपाईंको",
  u: "उ",
  usko: "उसको",
  unko: "उनको",
  uni: "उनी",
  uniharu: "उनीहरू",
  yo: "यो",
  tyo: "त्यो",
  yaha: "यहाँ",
  tyaha: "त्यहाँ",
  kaha: "कहाँ",
  kahile: "कहिल्यै",
  kata: "कता",
  kasari: "कसरी",
  kin: "किन",
  kina: "किन",
  ke: "के",
  ko: "को",
  kasle: "कसले",
  kaslai: "कसलाई",
  kun: "कुन",
  sabai: "सबै",
  jati: "जति",
  teti: "त्यति",
  eti: "यति",
  kohi: "कोही",
  kehi: "केही",

  // Helping verbs & States
  chha: "छ",
  chhan: "छन्",
  chhin: "छिन्",
  chhu: "छु",
  chhau: "छौ",
  chhaina: "छैन",
  chhainan: "छैनन्",
  ho: "हो",
  hoin: "होइन",
  hoina: "होइन",
  haina: "हैन",
  hola: "होला",
  hunchha: "हुन्छ",
  hudaina: "हुँदैन",
  thiyo: "थियो",
  thiye: "थिए",
  thiyen: "थिइन",
  bhayo: "भयो",
  bhayeko: "भएको",
  bhaigo: "भइगो",
  chaheko: "चाहेको",

  // Action verbs
  garnu: "गर्नु",
  garnus: "गर्नुहोस्",
  garnuhos: "गर्नुहोस्",
  garne: "गर्ने",
  gardai: "गर्दै",
  gare: "गरे",
  gareko: "गरेको",
  aunu: "आउनु",
  aunus: "आउनुहोस्",
  aunuhos: "आउनुहोस्",
  janu: "जानु",
  janus: "जानुहोस्",
  dinu: "दिनु",
  dinus: "दिनुहोस्",
  dinuhos: "दिनुहोस्",
  diyo: "दियो",
  linu: "लिनु",
  linus: "लिनुहोस्",
  khannu: "खान्नु",
  khanu: "खानु",
  dekhnu: "देख्नु",
  bolnu: "बोल्नु",
  "bhan nu": "भन्नु",
  bhannu: "भन्नु",
  bhannus: "भन्नुहोस्",
  lekhnu: "लेख्नु",
  padhnu: "पढ्नु",
  sunnu: "सुन्नु",
  bujhnu: "बुझ्नु",
  bujhe: "बुझे",
  bujheko: "बुझेको",

  // Adjectives & Qualifiers
  ramro: "राम्रो",
  naramro: "नराम्रो",
  sanchai: "सञ्चै",
  sanchhai: "सञ्चै",
  asanchai: "असञ्चै",
  thulo: "ठूलो",
  sano: "सानो",
  dherai: "धेरै",
  thorai: "थोरै",
  ali: "अलि",
  alikati: "अलिकति",
  taja: "ताजा",
  purano: "पुरानो",
  naya: "नयाँ",
  mitho: "मीठो",
  chhito: "छिटो",
  dhilo: "ढिलो",
  sasto: "सस्तो",
  mahango: "महँगो",
  safaa: "सफा",
  safa: "सफा",

  // Relationships & Family
  sathi: "साथी",
  bhai: "भाइ",
  dai: "दाइ",
  didi: "दीदी",
  bahini: "बहिनी",
  baba: "बाबा",
  aama: "आमा",
  buwa: "बुवा",
  hajurba: "हजुरबा",
  hajuraama: "हजुरआमा",
  chhora: "छोरा",
  chhori: "छोरी",
  shriman: "श्रीमान्",
  shrimati: "श्रीमती",

  // Time & Days
  aaja: "आज",
  bholi: "भोलि",
  parsi: "पर्सी",
  hijo: "हिजो",
  asti: "अस्ती",
  bihana: "बिहान",
  deuso: "दिउँसो",
  beluka: "बेलुका",
  rati: "राति",
  samaya: "समय",
  ghanta: "घण्टा",
  minute: "मिनेट",
  din: "दिन",
  hapta: "हप्ता",
  mahina: "महिना",
  barsha: "वर्ष",
  aaitabar: "आइतबार",
  sombar: "सोमबार",
  mangalbar: "मंगलबार",
  budhabar: "बुधबार",
  bihibar: "बिहीबार",
  shukrabar: "शुक्रबार",
  shanibar: "शनिबार",

  // Places & Geography
  ghar: "घर",
  bazar: "बजार",
  bajaar: "बजार",
  phidim: "फिदिम",
  panchthar: "पाँचथर",
  nepal: "नेपाल",
  gaun: "गाउँ",
  sahar: "सहर",
  desh: "देश",
  bidesh: "विदेश",
  thado: "ठाडो",
  line: "लाइन",
  gadhi: "गढी",
  salleri: "सल्लेरी",
  pragati: "प्रगति",
  chowk: "चौक",

  // Technical, Repair & Phidim Services
  bijuli: "बिजुली",
  marmat: "मर्मत",
  sewa: "सेवा",
  sewaa: "सेवा",
  kam: "काम",
  kamgar: "कामदार",
  paisa: "पैसा",
  rupiya: "रुपैयाँ",
  khabar: "खबर",
  mistri: "मिस्त्री",
  technician: "प्राविधिक",
  electrician: "इलेक्ट्रिसियन",
  plumber: "प्लम्बर",
  wiring: "वाइरिङ",
  inverter: "इन्भर्टर",
  battery: "ब्याट्री",
  solar: "सौर्य उर्जा",
  motor: "मोटर",
  pump: "पम्प",
  pani: "पानी",
  dhaara: "धारा",
  dhara: "धारा",
  pipe: "पाइप",
  internet: "इन्टरनेट",
  fiber: "फाइबर",
  cctv: "सीसीटीभी",
  camera: "क्यामेरा",
  computer: "कम्प्युटर",
  laptop: "ल्यापटप",
  mobile: "मोबाइल",
  fan: "पंखा",
  light: "बत्ती",
  heater: "हिटर",
  ac: "वातानुकूलक (AC)",
  switch: "स्विच",
  socket: "सकेट",
  meter: "मिटर",
  bill: "बिल",
  karyalaya: "कार्यालय",
  sahayog: "सहयोग",
  samparka: "सम्पर्क",
  phone: "फोन",
  number: "नम्बर",
  khata: "खाता",
  khataha: "खाता",
  login: "लगइन",
  password: "पासवर्ड",
  surakshit: "सुरक्षित",
};

// 2. Phonetic character mappings
const CONJUNCTS = [
  { roman: "kshya", dev: "क्ष्य" },
  { roman: "kshy", dev: "क्ष्य्" },
  { roman: "ksha", dev: "क्ष" },
  { roman: "ksh", dev: "क्ष्" },
  { roman: "gya", dev: "ज्ञ" },
  { roman: "gy", dev: "ज्ञ्" },
  { roman: "jny", dev: "ज्ञ" },
  { roman: "tra", dev: "त्र" },
  { roman: "tr", dev: "त्र्" },
  { roman: "shra", dev: "श्र" },
  { roman: "shr", dev: "श्र्" },
  { roman: "ddha", dev: "द्ध" },
  { roman: "ddh", dev: "द्ध्" },
  { roman: "dhya", dev: "ध्य" },
  { roman: "dhy", dev: "ध्य्" },
  { roman: "tt", dev: "त्त" },
  { roman: "nn", dev: "न्न" },
  { roman: "mm", dev: "म्म" },
  { roman: "chha", dev: "छ" },
  { roman: "chh", dev: "छ्" },
  { roman: "ch", dev: "च" },
  { roman: "c", dev: "च्" },
  { roman: "shha", dev: "ष" },
  { roman: "shh", dev: "ष्" },
  { roman: "sha", dev: "श" },
  { roman: "sh", dev: "श्" },
  { roman: "kha", dev: "ख" },
  { roman: "kh", dev: "ख्" },
  { roman: "gha", dev: "घ" },
  { roman: "gh", dev: "घ्" },
  { roman: "nga", dev: "ङ" },
  { roman: "ng", dev: "ङ्" },
  { roman: "jha", dev: "झ" },
  { roman: "jh", dev: "झ्" },
  { roman: "ttha", dev: "ठ" },
  { roman: "tth", dev: "ठ्" },
  { roman: "tha", dev: "थ" },
  { roman: "th", dev: "थ्" },
  { roman: "ddha", dev: "ढ" },
  { roman: "ddh", dev: "ढ्" },
  { roman: "dha", dev: "ध" },
  { roman: "dh", dev: "ध्" },
  { roman: "pha", dev: "फ" },
  { roman: "ph", dev: "फ्" },
  { roman: "bha", dev: "भ" },
  { roman: "bh", dev: "भ्" },
  { roman: "fa", dev: "फ" },
  { roman: "f", dev: "फ्" },
];

const CONSONANTS_BASE = {
  k: "क",
  g: "ग",
  j: "ज",
  t: "त",
  d: "द",
  n: "न",
  p: "प",
  b: "ब",
  m: "म",
  y: "य",
  r: "र",
  l: "ल",
  w: "व",
  v: "व",
  s: "स",
  h: "ह",
  T: "ट",
  D: "ड",
  N: "ण",
  S: "श",
  R: "ऋ",
};

const VOWEL_INDEPENDENT = {
  a: "अ",
  aa: "आ",
  A: "आ",
  i: "इ",
  ee: "ई",
  I: "ई",
  u: "उ",
  oo: "ऊ",
  U: "ऊ",
  e: "ए",
  ai: "ऐ",
  o: "ओ",
  au: "औ",
  am: "अं",
  ah: "अः",
  ri: "ऋ",
};

const VOWEL_MATRAS = {
  aa: "ा",
  a: "",
  A: "ा",
  i: "ि",
  ee: "ी",
  I: "ी",
  u: "ु",
  oo: "ू",
  U: "ू",
  e: "े",
  ai: "ै",
  o: "ो",
  au: "ौ",
  am: "ं",
  ah: "ः",
  ri: "ृ",
};

const DIGITS = {
  "0": "०",
  "1": "१",
  "2": "२",
  "3": "३",
  "4": "४",
  "5": "५",
  "6": "६",
  "7": "७",
  "8": "८",
  "9": "९",
};

/**
 * Phonetically converts a single Romanized English word into Nepali Unicode
 */
export function convertRomanWordToNepali(word) {
  if (!word) return "";
  const lower = word.toLowerCase();

  // 1. Direct dictionary match for accurate natural Nepali
  if (SMART_WORD_MAP[lower]) {
    return SMART_WORD_MAP[lower];
  }

  // 2. Handle numbers
  if (/^\d+$/.test(word)) {
    return word.split("").map((c) => DIGITS[c] || c).join("");
  }

  let result = "";
  let i = 0;
  const len = word.length;

  while (i < len) {
    // Check digits
    if (DIGITS[word[i]]) {
      result += DIGITS[word[i]];
      i++;
      continue;
    }

    // Check punctuation
    if (word[i] === "." && word[i + 1] !== ".") {
      result += "।";
      i++;
      continue;
    }

    // Match multi-character conjuncts
    let matchedConj = false;
    for (const conj of CONJUNCTS) {
      if (word.substring(i, i + conj.roman.length).toLowerCase() === conj.roman) {
        result += conj.dev;
        i += conj.roman.length;
        matchedConj = true;
        break;
      }
    }
    if (matchedConj) continue;

    // Match independent vowels at start or after a vowel/space
    const twoChars = word.substring(i, i + 2).toLowerCase();
    if (VOWEL_INDEPENDENT[twoChars] && (i === 0 || !CONSONANTS_BASE[word[i - 1]])) {
      result += VOWEL_INDEPENDENT[twoChars];
      i += 2;
      continue;
    }
    if (VOWEL_INDEPENDENT[word[i].toLowerCase()] && (i === 0 || !CONSONANTS_BASE[word[i - 1]])) {
      result += VOWEL_INDEPENDENT[word[i].toLowerCase()];
      i += 1;
      continue;
    }

    // Match consonant + vowel combination
    const char = word[i];
    const baseConsonant = CONSONANTS_BASE[char] || CONSONANTS_BASE[char.toLowerCase()];

    if (baseConsonant) {
      // Lookahead for vowel matra
      let matra = "";
      let advance = 1;

      // Check 2-letter vowel matra (aa, ee, oo, ai, au, am, ah, ri)
      if (i + 2 < len) {
        const nextTwo = word.substring(i + 1, i + 3).toLowerCase();
        if (VOWEL_MATRAS[nextTwo] !== undefined) {
          matra = VOWEL_MATRAS[nextTwo];
          advance = 3;
        }
      }

      // Check 1-letter vowel matra (a, i, u, e, o)
      if (advance === 1 && i + 1 < len) {
        const nextOne = word[i + 1].toLowerCase();
        if (VOWEL_MATRAS[nextOne] !== undefined) {
          matra = VOWEL_MATRAS[nextOne];
          advance = 2;
        }
      }

      if (advance > 1) {
        result += baseConsonant + matra;
        i += advance;
      } else {
        // No following vowel -> Halant (half letter) unless it's the end of word or followed by space
        if (i + 1 < len && /[a-zA-Z]/.test(word[i + 1])) {
          result += baseConsonant + "्";
        } else {
          result += baseConsonant;
        }
        i += 1;
      }
    } else {
      // Pass-through unrecognized character (e.g. symbols, punctuation)
      result += word[i];
      i++;
    }
  }

  return result;
}

/**
 * Converts a full text block (sentences, spaces, paragraphs) from Roman English to Nepali Unicode
 */
export function romanToNepali(text) {
  if (!text) return "";

  // Split preserving spaces, punctuation, and newlines
  const tokens = text.split(/([ \t\n\r,?!;:'"()\[\]{}]+)/);

  return tokens
    .map((token) => {
      if (/^[ \t\n\r,?!;:'"()\[\]{}]+$/.test(token)) {
        return token.replace(/\./g, "।");
      }
      return convertRomanWordToNepali(token);
    })
    .join("");
}

// 3. Preeti to Unicode and Unicode to Preeti Maps
const PREETI_TO_UNICODE_MAP = {
  "~": "र्",
  "`": "ञ",
  "1": "१",
  "2": "२",
  "3": "३",
  "4": "४",
  "5": "५",
  "6": "६",
  "7": "७",
  "8": "८",
  "9": "९",
  "0": "०",
  "-": "(",
  "=": ".",
  "q": "त्र",
  "w": "ध",
  "e": "भ",
  "r": "च",
  "t": "त",
  "y": "थ",
  "u": "ग",
  "i": "श",
  "o": "य",
  "p": "उ",
  "[": "ृ",
  "]": "े",
  "a": "ब",
  "s": "क",
  "d": "म",
  "f": "ा",
  "g": "न",
  "h": "ज",
  "j": "व",
  "k": "प",
  "l": "ि",
  ";": "स",
  "'": "ु",
  "\\": "्",
  "z": "श",
  "x": "ह",
  "c": "अ",
  "v": "ख",
  "b": "द",
  "n": "ल",
  "m": "फ",
  ",": ",",
  ".": "।",
  "/": "र",
  "Q": "त्त",
  "W": "ध्",
  "E": "भ्",
  "R": "च्",
  "T": "त्",
  "Y": "थ्",
  "U": "ग्",
  "I": "क्ष",
  "O": "इ",
  "P": "ए",
  "{": "र्‍",
  "}": "ै",
  "A": "ब्",
  "S": "क्",
  "D": "म्",
  "F": "ँ",
  "G": "न्",
  "H": "झ्",
  "J": "व्",
  "K": "प्",
  "L": "ी",
  ":": "स्",
  "\"": "ू",
  "|": "्र",
  "Z": "श्",
  "X": "ह्",
  "C": "ऋ",
  "V": "ख्",
  "B": "द्",
  "N": "ल्",
  "M": "ं",
  "<": "ठ",
  ">": "ड",
  "?": "रु",
};

/**
 * Preeti to Unicode Converter
 */
export function preetiToUnicode(preetiText) {
  if (!preetiText) return "";
  let out = "";
  for (let i = 0; i < preetiText.length; i++) {
    const char = preetiText[i];
    out += PREETI_TO_UNICODE_MAP[char] !== undefined ? PREETI_TO_UNICODE_MAP[char] : char;
  }
  return out;
}

/**
 * Unicode to Preeti Converter (Inverted map)
 */
const UNICODE_TO_PREETI_MAP = Object.entries(PREETI_TO_UNICODE_MAP).reduce((acc, [k, v]) => {
  if (!acc[v]) acc[v] = k;
  return acc;
}, {});

export function unicodeToPreeti(unicodeText) {
  if (!unicodeText) return "";
  let out = "";
  for (let i = 0; i < unicodeText.length; i++) {
    const char = unicodeText[i];
    out += UNICODE_TO_PREETI_MAP[char] !== undefined ? UNICODE_TO_PREETI_MAP[char] : char;
  }
  return out;
}

// 4. English Number to Nepali Digits & Words
const NEP_ONES = [
  "शून्य", "एक", "दुई", "तीन", "चार", "पाँच", "छ", "सात", "आठ", "नौ",
  "दश", "एघार", "बाह्र", "तेह्र", "चौध", "पन्ध्र", "सोह्र", "सत्र", "अठार", "उन्नाइस",
  "बीस", "एक्काइस", "बाइस", "तेइस", "चौबीस", "पच्चीस", "छब्बीस", "सत्ताइस", "अट्ठाइस", "उनन्तीस",
  "तीस", "एकतीस", "बत्तीस", "तेत्तीस", "चउतीस", "पैंतीस", "छत्तिस", "सरतीस", "अठतीस", "उनन्चालीस",
  "चालीस", "एकचालीस", "बयालीस", "त्रिचालीस", "चवालीस", "पैंतालीस", "छयालीस", "सत्चालीस", "अठचालीस", "उनन्पचास",
  "पचास", "एकाउन्न", "बाउन्न", "त्रिपन्न", "चौवन्न", "पचपन्न", "छपन्न", "सन्ताउन्न", "अन्ठाउन्न", "उनन्साठ्ठी",
  "साठ्ठी", "एकसठ्ठी", "बासठ्ठी", "त्रिसठ्ठी", "चौंसठ्ठी", "पैंसठ्ठी", "छैसठ्ठी", "सतसठ्ठी", "अठसठ्ठी", "उनन्सत्तरी",
  "सत्तरी", "एकहत्तर", "बहत्तर", "त्रिहत्तर", "चौहत्तर", "पचहत्तर", "छयहत्तर", "सतहत्तर", "अठहत्तर", "उनासी",
  "असी", "एकासी", "बयासी", "त्रियासी", "चौरासी", "पचासी", "छयासी", "सतासी", "अठासी", "उनान्नब्बे",
  "नब्बे", "एकान्नब्बे", "बयानब्बे", "त्रियान्नब्बे", "चौरान्नब्बे", "पञ्चानब्बे", "छयान्नब्बे", "सन्तानब्बे", "अन्ठानब्बे", "उनान्सय",
];

export function convertNumberToNepaliWords(num) {
  const n = parseInt(num, 10);
  if (isNaN(n) || n < 0) return "";
  if (n < 100) return NEP_ONES[n];
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    return `${NEP_ONES[hundreds]} सय ${remainder ? NEP_ONES[remainder] : ""}`.trim();
  }
  if (n < 100000) {
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;
    return `${NEP_ONES[thousands]} हजार ${remainder ? convertNumberToNepaliWords(remainder) : ""}`.trim();
  }
  if (n < 10000000) {
    const lakhs = Math.floor(n / 100000);
    const remainder = n % 100000;
    return `${NEP_ONES[lakhs]} लाख ${remainder ? convertNumberToNepaliWords(remainder) : ""}`.trim();
  }
  const crores = Math.floor(n / 10000000);
  const remainder = n % 10000000;
  return `${NEP_ONES[crores]} करोड ${remainder ? convertNumberToNepaliWords(remainder) : ""}`.trim();
}

export function englishNumberToNepali(numStr) {
  if (!numStr) return { digits: "", words: "" };
  const digits = String(numStr).split("").map((c) => DIGITS[c] || c).join("");
  const cleanNumber = parseInt(String(numStr).replace(/[^0-9]/g, ""), 10);
  const words = !isNaN(cleanNumber) ? convertNumberToNepaliWords(cleanNumber) : "";
  return { digits, words };
}

// 5. Rich English to Nepali Dictionary & Service Vocabulary
export const ENGLISH_NEPALI_DICTIONARY = [
  // Technical & Electrical Services
  {
    english: "Electrician",
    nepali: "इलेक्ट्रिसियन / बिजुली मिस्त्री",
    roman: "Electrician / Bijuli Mistri",
    category: "Technical Services",
    example: "Electrician in Phidim: फिदिममा दक्ष बिजुली मिस्त्री",
  },
  {
    english: "Plumber",
    nepali: "प्लम्बर / धारा मिस्त्री",
    roman: "Plumber / Dhara Mistri",
    category: "Technical Services",
    example: "Call a plumber for pipe leak: पाइप चुहावटको लागि प्लम्बर बोलाउनुहोस्",
  },
  {
    english: "Inverter Repair",
    nepali: "इन्भर्टर मर्मत सेवा",
    roman: "Inverter Marmat Sewa",
    category: "Technical Services",
    example: "Solar & Inverter repair in Panchthar: पाँचथरमा सौर्य तथा इन्भर्टर मर्मत",
  },
  {
    english: "Battery Runtime",
    nepali: "ब्याट्री ब्याकअप समय",
    roman: "Battery Backup Samaya",
    category: "Technical Services",
    example: "How much battery runtime do I have: मेरो ब्याट्रीले कति समय ब्याकअप दिन्छ",
  },
  {
    english: "House Wiring",
    nepali: "घरको विद्युतीय वाइरिङ",
    roman: "Ghar ko Bidyutiya Wiring",
    category: "Technical Services",
    example: "Complete building electrical wiring: पूर्ण भवनको बिजुली वाइरिङ",
  },
  {
    english: "CCTV Camera Installation",
    nepali: "सीसीटीभी क्यामेरा जडान",
    roman: "CCTV Camera Jadan",
    category: "Technical Services",
    example: "Security camera setup for shop: पसलको लागि सुरक्षा क्यामेरा जडान",
  },
  {
    english: "FiberNet Internet",
    nepali: "फाइबरनेट इन्टरनेट सेवा",
    roman: "FiberNet Internet Sewa",
    category: "Technical Services",
    example: "High speed optical fiber splicing: उच्च गतिको अप्टिकल फाइबर स्प्लिसिङ",
  },
  {
    english: "DishHome DTH Service",
    nepali: "डिसहोम टिभी सेवा",
    roman: "DishHome TV Sewa",
    category: "Technical Services",
    example: "DishHome dish alignment & recharge: डिसहोम एन्टेना मिलाउने र रिचार्ज",
  },
  {
    english: "Water Pump Repair",
    nepali: "पानी तान्ने मोटर मर्मत",
    roman: "Pani Tanne Motor Marmat",
    category: "Technical Services",
    example: "Submersible pump servicing: सबमर्सिबल पम्प मर्मत",
  },
  {
    english: "Computer & Laptop Repair",
    nepali: "कम्प्युटर तथा ल्यापटप मर्मत",
    roman: "Computer tatha Laptop Marmat",
    category: "Technical Services",
    example: "Windows installation & hardware fix: विन्डोज इन्स्टलेसन र पार्टपुर्जा मर्मत",
  },

  // Everyday Greetings & Conversations
  {
    english: "Hello / Greetings",
    nepali: "नमस्ते / नमस्कार",
    roman: "Namaste / Namaskar",
    category: "Greetings",
    example: "Namaste to all visitors: सबै आगन्तुकहरूमा नमस्ते",
  },
  {
    english: "Thank You",
    nepali: "धन्यवाद",
    roman: "Dhanyabad",
    category: "Greetings",
    example: "Thank you for your service: सेवाको लागि धेरै धेरै धन्यवाद",
  },
  {
    english: "Welcome",
    nepali: "स्वागतम्",
    roman: "Swagatam",
    category: "Greetings",
    example: "Welcome to Phidim Service: फिदिम सेवामा यहाँलाई हार्दिक स्वागत छ",
  },
  {
    english: "How are you?",
    nepali: "तपाईंलाई कस्तो छ?",
    roman: "Tapailai kasto chha?",
    category: "Conversations",
    example: "I am fine, thank you: मलाई सञ्चै छ, धन्यवाद",
  },
  {
    english: "What is your name?",
    nepali: "तपाईंको नाम के हो?",
    roman: "Tapaiko naam ke ho?",
    category: "Conversations",
    example: "My name is Semik: मेरो नाम सेमिक हो",
  },
  {
    english: "Where is the office?",
    nepali: "कार्यालय कहाँ छ?",
    roman: "Karyalaya kaha chha?",
    category: "Conversations",
    example: "Office is at Phidim Bazaar Ward 1: कार्यालय फिदिम बजार १ नम्बर वडामा छ",
  },
  {
    english: "How much does it cost?",
    nepali: "यसको शुल्क कति पर्छ?",
    roman: "Yasko shulka kati parchha?",
    category: "Conversations",
    example: "Inspection fee is free: प्रारम्भिक निरीक्षण निःशुल्क छ",
  },
  {
    english: "Emergency Service",
    nepali: "आपतकालीन सेवा (२४/७)",
    roman: "Aapatkalin Sewa (24/7)",
    category: "Emergency",
    example: "24/7 rapid technician dispatch: चौबीसै घण्टा तत्काल प्राविधिक सेवा",
  },
  {
    english: "Warning / Notice",
    nepali: "चेतावनी / सूचना",
    roman: "Chetawani / Suchana",
    category: "Notice",
    example: "Backend development in progress: ब्याकइन्ड विकास कार्य प्रगतिमा छ",
  },
  {
    english: "Sign In / Login",
    nepali: "लगइन / खाता खोल्ने",
    roman: "Login / Khata Kholne",
    category: "Account",
    example: "Customer account sign in: ग्राहक खाता साइन इन",
  },
  {
    english: "Password",
    nepali: "गोप्य शब्द / पासवर्ड",
    roman: "Gopya Shabda / Password",
    category: "Account",
    example: "Please keep your password secure: कृपया आफ्नो पासवर्ड सुरक्षित राख्नुहोस्",
  },
  {
    english: "Booking Confirmation",
    nepali: "बुकिङ निश्चितता",
    roman: "Booking Nischitata",
    category: "Account",
    example: "Your appointment has been confirmed: तपाईंको सेवा बुकिङ निश्चित भयो",
  },
];

// 6. Interactive Sample Phrases for 1-Click Testing
export const SAMPLE_PHRASES = [
  { label: "Namaste", text: "namaste tapailai phidim service ma swagatam chha" },
  { label: "Electrician Need", text: "mero ghara ma bijuli marmat garnu paryo mistri pathaidinus" },
  { label: "Inverter Repair", text: "inverter ko battery check garnu chha emergency technician chaiyo" },
  { label: "Where is Bazar", text: "phidim bazar ko thado line ma cctv camera jadan garnu chha" },
  { label: "Dev Notice", text: "backend development karya pragati ma chha dhanyabad" },
];

// 7. Visual Keymap Guide for Romanized Typing
export const KEYMAP_GUIDE = [
  { key: "k, kh, g, gh", result: "क, ख, ग, घ", desc: "क वर्गका व्यञ्जन" },
  { key: "ch, chh, j, jh", result: "च, छ, ज, झ", desc: "च वर्गका व्यञ्जन" },
  { key: "T, Th, D, Dh, N", result: "ट, ठ, ड, ढ, ण", desc: "मूर्धन्य व्यञ्जन (ठूलो अक्षर)" },
  { key: "t, th, d, dh, n", result: "त, थ, द, ध, न", desc: "दन्त्य व्यञ्जन" },
  { key: "p, ph/f, b, bh, m", result: "प, फ, ब, भ, म", desc: "ओष्ठ्य व्यञ्जन" },
  { key: "y, r, l, w/v", result: "य, र, ल, व", desc: "अन्तस्थ व्यञ्जन" },
  { key: "sh, shh/S, s, h", result: "श, ष, स, ह", desc: "ऊष्म व्यञ्जन" },
  { key: "ksh, tr, gy, shr", result: "क्ष, त्र, ज्ञ, श्र", desc: "संयुक्त व्यञ्जन" },
  { key: "a, aa, i, ee, u, oo", result: "अ, आ, इ, ई, उ, ऊ", desc: "ह्रस्व-दीर्घ स्वरहरू" },
  { key: "e, ai, o, au, am", result: "ए, ऐ, ओ, औ, अं", desc: "मात्रा र अनुस्वार" },
  { key: "0 1 2 3 4 5 6 7 8 9", result: "० १ २ ३ ४ ५ ६ ७ ८ ९", desc: "नेपाली अंकहरू" },
  { key: ". (dot)", result: "। (पूर्णविराम)", desc: "नेपाली पूर्णविराम" },
];

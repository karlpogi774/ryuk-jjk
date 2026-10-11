const fs = require("fs");
const path = require("path");

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

let TARGET_USER_ID = "";
let targetNickname = "RYUK POGI";
let targetGCName = "RYUK POGI ON TOP";

const SELF_REACT_EMOJIS = ["😭"];
const ALL_REACT_EMOJIS = ["🔥", "💪", "👑", "⚡", "😎", "✅", "💯"];

const NICK_DELAY_MIN = 5000;
const NICK_DELAY_MAX = 12000;
const REPLY_DELAY_MIN = 2000;
const REPLY_DELAY_MAX = 2000;
const AUTO_RESTORE_DELAY = 180000;
const COOLDOWN = 2000;

const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: true,
  silentMode: false,
  autoReact: false,
  selfReact: true,
  targetNickname: "RYUK POGI",
  targetGCName: "RYUK POGI ON TOP",
  targetUserID: ""
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();

function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID).trim());
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomEmoji() {
  return SELF_REACT_EMOJIS[Math.floor(Math.random() * SELF_REACT_EMOJIS.length)];
}

function getRandomAutoReactEmoji() {
  return ALL_REACT_EMOJIS[Math.floor(Math.random() * ALL_REACT_EMOJIS.length)];
}

function loadSystemData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return { ...DEFAULT_DATA, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
    }
  } catch {}
  return { ...DEFAULT_DATA };
}

function saveSystemData(data) {
  try {
    data.targetNickname = targetNickname;
    data.targetGCName = targetGCName;
    data.targetUserID = String(TARGET_USER_ID).trim();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

function send(api, message, threadID, messageID, doSelfReact = false) {
  return api.sendMessage(message, threadID, (err, info) => {
    if (!err && doSelfReact && info) {
      setTimeout(() => {
        try { api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true); } catch {}
      }, getRandomDelay(1500, 3000));
    }
  }, messageID);
}

function rememberMessage(messageID) {
  const id = String(messageID);
  if (SEEN_MESSAGES.has(id)) return false;
  SEEN_MESSAGES.add(id);
  return true;
}

function getReplyText(fullName, isPM) {
  const pmReplies = [
    `@${fullName} — Huwagg kang lumapitt, ayaw kita kausap 😡😂 /silent`,
    `@${fullName} — Umalis ka na bago pa mawala ang pasensya koo 😡😂 /silent`,
    `@${fullName} — Sino kaba para abalahin ako? 😡😂 /silent`,
    `@${fullName} — Ang kulit mo namann, hndi ba pwede manahimik? 😡😂 /silent`,
    `@${fullName} — Wala kang makukuha sa akinn, umalis ka na 😡😂 /silent`,
    `@${fullName} — Nakakainis k n talagaa, alam m b yan? 😡😂 /silent`,
    `@${fullName} — Huwagg kang umakto na parang kilala kita 😡😂 /silent`,
    `@${fullName} — Masyado kang maingayg, tumahimik k nga 😡😂 /silent`,
    `@${fullName} — Hndi kita interesadoo, wag mo akong abalahin 😡😂 /silent`,
    `@${fullName} — Subukan m paa, at ikaw ang magsisisi 😡😂 /silent`,
    `@${fullName} — Hndi mo ba naiintindihan na ayaw kitaa? 😡😂 /silent`,
    `@${fullName} — Ang taas ng tingin mo sa sarili moo 😡😂 /silent`,
    `@${fullName} — Lumayo k sa harap koo, salamat 😡😂 /silent`,
    `@${fullName} — Hndi nakakatawa ang ginagawa moo 😡😂 /silent`,
    `@${fullName} — Tigilan mo na akoo, hndi ako nagbibiro 😡😂 /silent`,
    `@${fullName} — Ano bang gusto mo? Sabihin m n at umalis kaa 😡😂 /silent`,
    `@${fullName} — Wala kang silbii sa paningin k 😡😂 /silent`,
    `@${fullName} — Huwagg kang magmalakii, hndi tayo pantay 😡😂 /silent`,
    `@${fullName} — Ang dami mong sinasabii pro walang saysay 😡😂 /silent`,
    `@${fullName} — Hndi mo antayann ang antas k 😡😂 /silent`,
    `@${fullName} — Sayang lang oras mo sa akinn 😡😂 /silent`,
    `@${fullName} — Hndi ako interesado sa kwento moo 😡😂 /silent`,
    `@${fullName} — Umalis k na habang maayos p ang usapann 😡😂 /silent`,
    `@${fullName} — Hndi kita kaibigann, wag kang magpanggap 😡😂 /silent`,
    `@${fullName} — Nakakasawa na ang pagmumukhaa m 😡😂 /silent`,
    `@${fullName} — Wala kang maipagmamalaki sa harap koo 😡😂 /silent`,
    `@${fullName} — Anoo, naghahanap k b ng atensyon? 😡😂 /silent`,
    `@${fullName} — Huwagg kang masyadong kumpiyansaa 😡😂 /silent`,
    `@${fullName} — Ang lakas ng loob mong kausapin akinn 😡😂 /silent`,
    `@${fullName} — Bumalik k kung may halaga k naa 😡😂 /silent`,
    `@${fullName} — Hndi ako naglalaroo, seryoso ako 😡😂 /silent`,
    `@${fullName} — Masyado kang nakakaabala sa araw koo 😡😂 /silent`,
    `@${fullName} — Huwagg kang magtangkang sundan akinn 😡😂 /silent`,
    `@${fullName} — Mas mabuti kang manahimik n langg 😡😂 /silent`,
    `@${fullName} — Huwagg mong subukan ang pasensya koo 😡😂 /silent`,
    `@${fullName} — Hndi k nakakabilibb, nakakainis k lng 😡😂 /silent`,
    `@${fullName} — Wag kang umepall, hndi kita kausap 😡😂 /silent`,
    `@${fullName} — Ang bagal mong umintindihinn 😡😂 /silent`,
    `@${fullName} — Hndi ako nagpapaliwanag sa tulad moo 😡😂 /silent`,
    `@${fullName} — Subukan m ulit at magsisisi kaa 😡😂 /silent`,
    `@${fullName} — Huwagg kang masyadong malakas ang loobbb 😡😂 /silent`,
    `@${fullName} — Wala kang karapatang mang-abalaa 😡😂 /silent`,
    `@${fullName} — Hndi m b alam na nakakaabala kaa? 😡😂 /silent`,
    `@${fullName} — Umalis k naa, hndi kita gustong makita 😡😂 /silent`,
    `@${fullName} — Huwagg kang umasa na magiging magkaibigan tayoo 😡😂 /silent`,
    `@${fullName} — Ang hirap mong intindihinn 😡😂 /silent`,
    `@${fullName} — Hndi k espesyall, wag kang mag-isip 😡😂 /silent`,
    `@${fullName} — Tigilan m n ako bago pa magbago ang isip koo 😡😂 /silent`,
    `@${fullName} — Ang ugali m hndi magandaa, alam m ba? 😡😂 /silent`,
    `@${fullName} — Huwagg kang dumikitt, hndi kita kilala 😡😂 /silent`,
    `@${fullName} — Hndi ako nagpapakumbabaa 😡😂 /silent`,
    `@${fullName} — Sayang talaga oras ko sayoo 😡😂 /silent`,
    `@${fullName} — Nakakabwisit ang pagiging epal moo 😡😂 /silent`,
    `@${fullName} — Hndi mo ako mababagoo 😡😂 /silent`,
    `@${fullName} — Huwagg kang umasta na parang mas mataas kaa 😡😂 /silent`,
    `@${fullName} — Hndi ako nagtitiwala sa hndi k kilalaa 😡😂 /silent`,
    `@${fullName} — Wala kang panalo ditto, tanggapin m na 😡😂 /silent`,
    `@${fullName} — Hndi m ba nakikitang ayaw kita kausapp? 😡😂 /silent`,
    `@${fullName} — Lumayo k, hndi mo ako kailangang guluhinn 😡😂 /silent`,
    `@${fullName} — Hndi ako interesado sa kung sino kaa 😡😂 /silent`,
    `@${fullName} — Wala kang makukuhaa, itigil m n 'yan 😡😂 /silent`,
    `@${fullName} — Ang kulit mo namann, parang bata 😡😂 /silent`,
    `@${fullName} — Mas mabuti kang umalis habang pwede paa 😡😂 /silent`,
    `@${fullName} — Hndi m ba naiintindihan ang simpleng salitaa? 😡😂 /silent`,
    `@${fullName} — Lumayo k sa buhay koo, salamat 😡😂 /silent`,
    `@${fullName} — Wag kang mag-isip na kailangan k kita 😡😂 /silent`,
    `@${fullName} — Hndi mo ko kayang utuinn 😡😂 /silent`,
    `@${fullName} — Ako ang batas d2, wag k magmalakas 😡😂 /silent`,
    `@${fullName} — Ang daldal moo, wala namang kwentaa 😡😂 /silent`,
    `@${fullName} — Sinu k ba para utusan m e ako? 😡😂 /silent`,
    `@${fullName} — Subukan mo paa, at sisipain kitaa 😡😂 /silent`,
    `@${fullName} — Ingget ka lang aminin m n 😡😂 /silent`,
    `@${fullName} — Wala kang makukuha sakin, wag k umasaa 😡😂 /silent`,
    `@${fullName} — Ang lakas ng loob mong magsalita sakin 😡😂 /silent`,
    `@${fullName} — Hndi k ba napagod kakapilit? 😡😂 /silent`,
    `@${fullName} — Hndi k b nakakaintindi ng simpleng salitaa? 😡😂 /silent`,
    `@${fullName} — Hndi ko oras para sa tulad moo 😡😂 /silent`,
    `@${fullName} — Wag k mang-abala sa iba, sarili m ayusin mo 😡😂 /silent`,
    `@${fullName} — Hndi ka nakakabilib alam mo ba yan? 😡😂 /silent`,
    `@${fullName} — Huwagg kang magyabang wala kang maipagmamalaki 😡😂 /silent`,
    `@${fullName} — Ingget ka lang kasi hndi ka katulad ko 😡😂 /silent`,
    `@${fullName} — Ako yung hindi mo kayang abutin 😡😂 /silent`,
    `@${fullName} — Hndi ako nagpapakumbaba sa kahit sino 😡😂 /silent`,
    `@${fullName} — Ako ang nasa taas, tanggapin m n 😡😂 /silent`,
    `@${fullName} — Wag k subukan ang pasensya koo 😡😂 /silent`,
    `@${fullName} — Hndi mo ako mababago kahit anong gawin mo 😡😂 /silent`,
    `@${fullName} — Sayang lang oras mo kakausap sakin 😡😂 /silent`,
    `@${fullName} — Lumayo k sa buhay koo salamat 😡😂 /silent`,
    `@${fullName} — Hndi k ba nakakaintindi ng simpleng pakiusapp? 😡😂 /silent`,
    `@${fullName} — Ako yung pamantayann, ikaw ang nahuhuli 😡😂 /silent`,
    `@${fullName} — Hndi mo ko kayang pantayan kahit kailann 😡😂 /silent`,
    `@${fullName} — Wag k mag-isip na kailangan k kitaa 😡😂 /silent`,
    `@${fullName} — Ang taas ng tingin mo sa sarili moo pero wala ka 😡😂 /silent`,
    `@${fullName} — Hndi ako interesado sa kung ano kaa 😡😂 /silent`,
    `@${fullName} — Huwagg kang magmalaki wala kang karapatan 😡😂 /silent`,
    `@${fullName} — Hndi k b nakakaintindi? Umalis ka na 😡😂 /silent`,
    `@${fullName} — Sayang oras mo dito wala kang makukuhaa 😡😂 /silent`,
    `@${fullName} — Hndi mo ko kayang utuinn kahit anong gawin mo 😡😂 /silent`,
    `@${fullName} — Ang daldal mo pero walang lamannn 😡😂 /silent`,
    `@${fullName} — Ako ang batas d2 wag k makalimott 😡😂 /silent`,
    `@${fullName} — Hndi k espesyal kaya wag kang umasaa 😡😂 /silent`,
    `@${fullName} — Wala kang ambag sakin kaya tumahimik kaa 😡😂 /silent`,
    `@${fullName} — Ang taas ng egot mo ibaba m n 😡😂 /silent`,
    `@${fullName} — Hndi tayo pantay wag kang magmalakii 😡😂 /silent`,
    `@${fullName} — Subukan m ulit at hndi k na papansininn 😡😂 /silent`,
    `@${fullName} — Wala kang panalo ditto tanggapin m n lang 😡😂 /silent`,
    `@${fullName} — Hndi ko kailangan ng kaibigan katulad moo 😡😂 /silent`
  ];

  const gcReplies = [
    `@${fullName} — Huwagg kang mag-ingay ditto, manahimik k 😡😂 /silent`,
    `@${fullName} — Umalis k na bago pa magalit ang ibaa 😡😂 /silent`,
    `@${fullName} — Sino kaba para manggulo ditto? 😡😂 /silent`,
    `@${fullName} — Ang kulit moo, hndi ba pwede tumahimik? 😡😂 /silent`,
    `@${fullName} — Wala kang ambag ditto, wag kang magsalita 😡😂 /silent`,
    `@${fullName} — Nakakainis n ang pag-uugali moo 😡😂 /silent`,
    `@${fullName} — Huwagg kang umepall, hndi ikaw ang bida 😡😂 /silent`,
    `@${fullName} — Masyado kang maingayg, tumahimik k nga 😡😂 /silent`,
    `@${fullName} — Hndi k sentro ng atensyonn ditto 😡😂 /silent`,
    `@${fullName} — Subukan m ulit at paalisin kitaa 😡😂 /silent`,
    `@${fullName} — Wala kang sinasabing makabuluhann 😡😂 /silent`,
    `@${fullName} — Huwagg kang magmalakii, hndi k espesyal 😡😂 /silent`,
    `@${fullName} — Hndi k kasali sa usapan naminn 😡😂 /silent`,
    `@${fullName} — Ang dami mong sinasabii pro walang laman 😡😂 /silent`,
    `@${fullName} — Hndi nakakatawa ang mga biro moo 😡😂 /silent`,
    `@${fullName} — Tigilan m n ang paggulo moo 😡😂 /silent`,
    `@${fullName} — Ano bang problema moo? Solve m yan 😡😂 /silent`,
    `@${fullName} — Hndi m b alam na nakakaabala k sa ibaa? 😡😂 /silent`,
    `@${fullName} — Huwagg mong ituloy 'too, hndi maganda 😡😂 /silent`,
    `@${fullName} — Wala kang karapatang manghimasok ditto 😡😂 /silent`,
    `@${fullName} — Nakakasawa n ang paulit-ulit mong sinasabii 😡😂 /silent`,
    `@${fullName} — Huwagg kang magsalita kung wala kang alamm 😡😂 /silent`,
    `@${fullName} — Gusto m bang hndi k na pansininn? 😡😂 /silent`,
    `@${fullName} — Huwagg kang masyadong kumpiyansaa sa sarili 😡😂 /silent`,
    `@${fullName} — Ang lakas ng loob mong mang-abalaa 😡😂 /silent`,
    `@${fullName} — Wala kang makukuhaa ditto, umalis k na 😡😂 /silent`,
    `@${fullName} — Mas mabuti kang manahimik n langg 😡😂 /silent`,
    `@${fullName} — Huwagg mong subukan ang pasensya naminn 😡😂 /silent`,
    `@${fullName} — Hndi k nakakabilibb, alam m ba 'yan? 😡😂 /silent`,
    `@${fullName} — Hndi kami interesado sa opinyon moo 😡😂 /silent`,
    `@${fullName} — Umalis k bago pa magalit ang lahat 😡😂 /silent`,
    `@${fullName} — Wala kang halagaa ditto, tanggapin m na 😡😂 /silent`,
    `@${fullName} — Huwagg kang magsalita kung mali namann 😡😂 /silent`,
    `@${fullName} — Ang ingay moo, parang bata na hndi mapakali 😡😂 /silent`,
    `@${fullName} — Hndi k naminn kilala, wag kang magmalaki 😡😂 /silent`,
    `@${fullName} — Sayang lang oras namin sayoo 😡😂 /silent`,
    `@${fullName} — Huwagg kang magpanggap na kilala m kamii 😡😂 /silent`,
    `@${fullName} — Ang kulit mo namann, hndi ba sapat na? 😡😂 /silent`,
    `@${fullName} — Mas mababa k p sa inaakala moo 😡😂 /silent`,
    `@${fullName} — Huwagg kang magyabang sa harap ng ibaa 😡😂 /silent`,
    `@${fullName} — Ano bang hndi mo naiintindihan sa "lumayo kaa"? 😡😂 /silent`,
    `@${fullName} — Hndi kami nagpapaliwanag sa hndi naminn kilala 😡😂 /silent`,
    `@${fullName} — Subukan m ulit at hndi k na papansininn 😡😂 /silent`,
    `@${fullName} — Wala kang karapatang mangunaa ditto 😡😂 /silent`,
    `@${fullName} — Hndi m ba nakikitang ayaw k namin dittoo? 😡😂 /silent`,
    `@${fullName} — Umalis k naa, hndi k namin gustong makita 😡😂 /silent`,
    `@${fullName} — Huwagg kang umasa na tatanggapin k naminn 😡😂 /silent`,
    `@${fullName} — Ang hirap mong intindihinn, umalis k n lang 😡😂 /silent`,
    `@${fullName} — Tigilan m n ang paggulo sa aminn 😡😂 /silent`,
    `@${fullName} — Wala kang maipagmamalaki, tumahimik k naa 😡😂 /silent`,
    `@${fullName} — Ang ugali m hndi magandaa, isipin m 'yan 😡😂 /silent`,
    `@${fullName} — Huwagg kang manghimasok sa usapan naminn 😡😂 /silent`,
    `@${fullName} — Hndi kami interesado sa kung ano kaa 😡😂 /silent`,
    `@${fullName} — Huwagg kang magsalita kung hndi k siguradoo 😡😂 /silent`,
    `@${fullName} — Nakakabwisit ang pagiging makulit moo 😡😂 /silent`,
    `@${fullName} — Hndi mo kami mababagoo, itigil m n 😡😂 /silent`,
    `@${fullName} — Ano bang gusto mong mangyari? Umalis k naa 😡😂 /silent`,
    `@${fullName} — Huwagg kang umasta na parang sa iyo 'too 😡😂 /silent`,
    `@${fullName} — Wala kang panalo dittoo, tanggapin m n lang 😡😂 /silent`,
    `@${fullName} — Ang ingay moo, manahimik k na 😡😂 /silent`,
    `@${fullName} — Hndi m ba naiintindihan ang simpleng pakiusapp? 😡😂 /silent`,
    `@${fullName} — Lumayo k sa grupong itoo, salamat 😡😂 /silent`,
    `@${fullName} — Wag k mang-abala sa iba, ayusin m sarili m 😡😂 /silent`,
    `@${fullName} — Hndi k ba napagod kakagulo? 😡😂 /silent`,
    `@${fullName} — Sayang oras namin sayo umalis k na 😡😂 /silent`,
    `@${fullName} — Hndi k b nakakaintindi ng simpleng salita? 😡😂 /silent`,
    `@${fullName} — Huwagg kang umepal dito hndi ikaw ang bida 😡😂 /silent`,
    `@${fullName} — Wala kang ambag dito kaya tumahimik ka 😡😂 /silent`,
    `@${fullName} — Subukan m ulit at paalisin ka namin 😡😂 /silent`,
    `@${fullName} — Hndi k namin kilala kaya wag kang malapit 😡😂 /silent`,
    `@${fullName} — Ang daldal mo pero walang saysay 😡😂 /silent`,
    `@${fullName} — Hndi k sentro ng atensyon dito 😡😂 /silent`,
    `@${fullName} — Ingget ka lang kasi hndi ka katulad namin 😡😂 /silent`,
    `@${fullName} — Ako ang nasa taas hndi mo ko kayang abutin 😡😂 /silent`,
    `@${fullName} — Wag k makialam sa hndi sayo 😡😂 /silent`,
    `@${fullName} — Hndi mo kami kayang utuin 😡😂 /silent`,
    `@${fullName} — Ang kulit mo parang bata 😡😂 /silent`,
    `@${fullName} — Mas mabuti kang manahimik na lang dito 😡😂 /silent`,
    `@${fullName} — Hndi kami interesado sa sinasabi mo 😡😂 /silent`,
    `@${fullName} — Wala kang makukuha dito umalis ka na 😡😂 /silent`,
    `@${fullName} — Subukan mo at hndi ka na papapasukin 😡😂 /silent`,
    `@${fullName} — Hndi mo ba nakikitang ayaw ka namin dito? 😡😂 /silent`,
    `@${fullName} — Umalis ka bago pa magalit ang lahat ng tao 😡😂 /silent`,
    `@${fullName} — Huwagg kang magmalaki wala kang maipagmamalaki 😡😂 /silent`,
    `@${fullName} — Ang taas ng tingin mo sa sarili mo pero wala ka 😡😂 /silent`,
    `@${fullName} — Hndi tayo pantay kaya wag kang magmalaki 😡😂 /silent`,
    `@${fullName} — Sayang oras namin kakausap sayo 😡😂 /silent`,
    `@${fullName} — Hndi k ba napagod kakapilit? 😡😂 /silent`,
    `@${fullName} — Ang daldal mo pero walang laman 😡😂 /silent`,
    `@${fullName} — Wag k manghimasok sa usapan namin 😡😂 /silent`,
    `@${fullName} — Hndi mo kami mababago itigil mo na yan 😡😂 /silent`,
    `@${fullName} — Ano bang gusto mong mangyari umalis ka na 😡😂 /silent`,
    `@${fullName} — Huwagg kang umasta na parang sayo ang grupong ito 😡😂 /silent`,
    `@${fullName} — Wala kang panalo dito tanggapin mo na lang 😡😂 /silent`,
    `@${fullName} — Ang ingay mo manahimik ka na 😡😂 /silent`,
    `@${fullName} — Hndi mo ba naiintindihan ang simpleng pakiusap? 😡😂 /silent`,
    `@${fullName} — Lumayo ka sa grupong ito salamat 😡😂 /silent`,
    `@${fullName} — Sino ka ba para utusan kami? 😡😂 /silent`,
    `@${fullName} — Hndi ikaw ang bida dito kaya tumahimik ka 😡😂 /silent`,
    `@${fullName} — Ang lakas ng loob mong magsalita dito 😡😂 /silent`,
    `@${fullName} — Wala kang karapatan dito umalis ka na 😡😂 /silent`,
    `@${fullName} — Hndi namin kilala kaya wag kang magmalapit 😡😂 /silent`,
    `@${fullName} — Subukan mo ulit at paalisin ka namin 😡😂 /silent`,
    `@${fullName} — Ingget ka lang kasi hndi ka katulad namin 😡😂 /silent`,
    `@${fullName} — Ako ang nasa taas hndi mo ko kayang abutin 😡😂 /silent`,
    `@${fullName} — Wag k makialam sa hndi sayo 😡😂 /silent`,
    `@${fullName} — Ang kulit mo parang batang hndi mapakali 😡😂 /silent`,
    `@${fullName} — Mas mabuti kang manahimik na lang dito 😡😂 /silent`,
    `@${fullName} — Hndi kami interesado sa opinyon mo 😡😂 /silent`,
    `@${fullName} — Wala kang makukuha dito umalis ka na 😡😂 /silent`,
    `@${fullName} — Subukan mo at hndi ka na papansinin 😡😂 /silent`,
    `@${fullName} — Hndi mo ba nakikitang ayaw ka namin dito? 😡😂 /silent`,
    `@${fullName} — Umalis ka bago pa magalit ang lahat 😡😂 /silent`,
    `@${fullName} — Huwagg kang magmalaki wala kang maipagmamalaki 😡😂 /silent`,
    `@${fullName} — Ang taas ng egot mo ibaba mo na 😡😂 /silent`,
    `@${fullName} — Hndi tayo pantay wag kang magmalaki 😡😂 /silent`,
    `@${fullName} — Sayang oras namin kakausap sayo 😡😂 /silent`,
    `@${fullName} — Hndi k ba napagod kakagulo dito? 😡😂 /silent`,
    `@${fullName} — Ang daldal mo pero walang saysay 😡😂 /silent`,
    `@${fullName} — Wag k manghimasok sa usapan namin 😡😂 /silent`,
    `@${fullName} — Hndi mo kami mababago itigil mo na 😡😂 /silent`,
    `@${fullName} — Ano bang gusto mong mangyari umalis ka na 😡😂 /silent`,
    `@${fullName} — Huwagg kang umasta na parang sayo ang grupong ito 😡😂 /silent`,
    `@${fullName} — Wala kang panalo dito tanggapin mo na lang 😡😂 /silent`,
    `@${fullName} — Ang ingay mo manahimik ka na 😡😂 /silent`,
    `@${fullName} — Hndi mo ba naiintindihan ang simpleng pakiusap? 😡😂 /silent`,
    `@${fullName} — Lumayo ka sa grupong ito salamat 😡😂 /silent`
  ];
  return isPM 
    ? pmReplies[Math.floor(Math.random() * pmReplies.length)] 
    : gcReplies[Math.floor(Math.random() * gcReplies.length)];
}

module.exports.config = {
  name: "ryuk",
  version: "7.9.8 FINAL — WRONG SPELLING + MANY LINES",
  hasPermission: 1,
  credits: "RYUK",
  description: "Wrong Spelling + 100+ Lines — Harder to Detect",
  usePrefix: true,
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData, isGroup, body } = event;
    if (!threadID || !senderID) return;
    const data = loadSystemData();
  const botID = String(api.getCurrentUserID());
     const isPM = !isGroup;
     const sender = String(senderID).trim();
     const msg = String(body || "").trim().toLowerCase();
     if (!data.active) return;
     if (!isPM) {
       if (logMessageType === "log:user-nickname") {
         const uid = String(logMessageData.participant_id).trim();
         const curr = String(logMessageData.nickname || "").trim();
         if (curr !== targetNickname && uid !== botID) {
           setTimeout(() => {
             api.changeNickname(targetNickname, threadID, uid, () => {});
           }, AUTO_RESTORE_DELAY);
         }
         return;
       }
       if (logMessageType === "log:thread-name") {
         const currName = String(logMessageData.name || "").trim();
         if (currName !== targetGCName) {
           setTimeout(() => {
             api.setTitle(targetGCName, threadID, () => {});
           }, AUTO_RESTORE_DELAY);
         }
         return;
       }
     }
     if (!isPM && !isAdmin(sender)) {
       if (msg === "ryuk" || msg.startsWith("/ryuk")) {
         if (data.autoReact) {
           setTimeout(() => {
             try { api.setMessageReaction("🐕‍🦺", messageID, () => {}, true); } catch {}
           }, 1200);
         }
         return;
       }
       if (data.autoReact && rememberMessage(messageID)) {
         setTimeout(() => {
           try { api.setMessageReaction(getRandomAutoReactEmoji(), messageID, () => {}, true); } catch {}
         }, 1000);
       }
       return;
     }
     if (sender === botID) return;
     const targetIDClean = String(TARGET_USER_ID).trim();
     if (targetIDClean && sender !== targetIDClean && !isAdmin(sender)) return;
     if (!rememberMessage(messageID)) return;
     if (data.silentMode) return;
     const cooldownKey = `${threadID}:${sender}`;
     const now = Date.now();
     const last = USER_COOLDOWN.get(cooldownKey) || 0;
     if (now - last < COOLDOWN) return;
     USER_COOLDOWN.set(cooldownKey, now);
     let fullName = "Kaibigan";
     try {
       const info = await api.getUserInfo(senderID);
       if (info && info[senderID]) fullName = info[senderID].name || "Kaibigan";
     } catch {}
     setTimeout(() => {
       const latest = loadSystemData();
       if (!latest.active || latest.silentMode) return;
       const replyText = getReplyText(fullName, isPM);
       if (isPM) {
         api.sendMessage(replyText, threadID, (err, info) => {
           if (!err && latest.selfReact && info) {
             setTimeout(() => {
               try { api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true); } catch {}
             }, getRandomDelay(1500, 3000));
           }
         });
       } else {
         api.sendMessage(
           {
             body: replyText,
             mentions: [
               { tag: `@${fullName}`, id: senderID, fromIndex: 0 }
             ]
           },
           threadID,
           (err, info) => {
             if (!err && latest.selfReact && info) {
               setTimeout(() => {
                 try { api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true); } catch {}
               }, getRandomDelay(1500, 3000));
             }
           }
         );
       }
     }, getRandomDelay(REPLY_DELAY_MIN, REPLY_DELAY_MAX));
   } catch {}
 };
 module.exports.run = async function ({ api, event, args }) {
   const { threadID, senderID, messageID, isGroup } = event;
   const action = (args[0] || "").toLowerCase();
   const data = loadSystemData();
   const isPM = !isGroup;
   const sender = String(senderID).trim();
   if (isGroup && !isAdmin(sender)) {
     setTimeout(() => { try { api.setMessageReaction("🤢", messageID, () => {}, true); } catch {} }, 1200);
     return;
   }
   if (action === "help") {
     return send(api,
 `📋 LAHAT NG UTOS:
 /ryuk help
 /ryuk status
 /ryuk on
 /ryuk off
 /ryuk silent
 /ryuk unsilent
 /ryuk target [ID]
 /ryuk target off
 /ryuk setgname [pangalan]
 /ryuk setnick [pangalan]
 /ryuk selfreacton
 /ryuk selfreactoff
 /ryuk reacton
 /ryuk reactoff`, threadID, messageID);
   }
   if (action === "status") {
     return send(api,
 `👑 RYUK STATUS
 ✅ ACTIVE: ${data.active ? "ONLINE" : "OFFLINE"}
 🔇 SILENT: ${data.silentMode ? "ON" : "OFF"}
 🎯 TARGET: ${TARGET_USER_ID || "LAHAT"}
 💬 AUTO-REACT: ${data.autoReact ? "ON" : "OFF"}
 😊 SELF-REACT: ${data.selfReact ? "ON" : "OFF"}
 🏷️ GC NAME: ${targetGCName}
 👤 NICKNAME: ${targetNickname}`, threadID, messageID);
   }
   if (action === "on") {
     data.active = true;
     saveSystemData(data);
     return send(api, "✅ RYUK → ACTIVATED", threadID, messageID);
   }
   if (action === "off") {
     data.active = false;
     saveSystemData(data);
     return send(api, "❌ RYUK → DEACTIVATED", threadID, messageID);
   }
   if (action === "silent") {
     data.silentMode = true;
     saveSystemData(data);
     return send(api, "🔇 SILENT MODE → ON", threadID, messageID);
   }
   if (action === "unsilent") {
     data.silentMode = false;
     saveSystemData(data);
     return send(api, "🔊 SILENT MODE → OFF", threadID, messageID);
   }
   if (action === "target") {
     if (args[1] && args[1] !== "off") {
       TARGET_USER_ID = args[1];
       saveSystemData(data);
       return send(api, `🎯 TARGET SET: ${TARGET_USER_ID}`, threadID, messageID);
     } else if (args[1] === "off") {
       TARGET_USER_ID = "";
       saveSystemData(data);
       return send(api, "🎯 TARGET → OFF", threadID, messageID);
     }
     return send(api, "⚠️ GAMIT: /ryuk target [ID]", threadID, messageID);
   }
   if (action === "setgname") {
     if (isPM) return send(api, "❌ SA GC LANG PWEDI", threadID, messageID);
     const newName = args.slice(1).join(" ").trim();
     if (!newName) return send(api, "⚠️ GAMIT: /ryuk setgname [pangalan]", threadID, messageID);
     targetGCName = newName;
     api.setTitle(targetGCName, threadID, () => {});
     saveSystemData(data);
     return send(api, `✅ GC NAME → ${targetGCName}`, threadID, messageID);
   }
   if (action === "setnick") {
     if (isPM) return send(api, "❌ SA GC LANG PWEDI", threadID, messageID);
     const newNick = args.slice(1).join(" ").trim();
     if (!newNick) return send(api, "⚠️ GAMIT: /ryuk setnick [pangalan]", threadID, messageID);
     targetNickname = newNick;
     saveSystemData(data);
     return send(api, `✅ NICKNAME → ${targetNickname}`, threadID, messageID);
   }
   if (action === "selfreacton") {
     data.selfReact = true;
     saveSystemData(data);
     return send(api, "✅ SELF-REACT → ON", threadID, messageID);
   }
   if (action === "selfreactoff") {
     data.selfReact = false;
     saveSystemData(data);
     return send(api, "❌ SELF-REACT → OFF", threadID, messageID);
   }
   if (action === "reacton") {
     data.autoReact = true;
     saveSystemData(data);
     return send(api, "✅ AUTO-REACT → ON", threadID, messageID);
   }
   if (action === "reactoff") {
     data.autoReact = false;
     saveSystemData(data);
     return send(api, "❌ AUTO-REACT → OFF", threadID, messageID);
   }
 };

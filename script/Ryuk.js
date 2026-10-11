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

const SELF_REACT_EMOJIS = ["🌙", "🖤", "🕊️", "☁️", "🦋", "🌑", "🌌"];
const ALL_REACT_EMOJIS = ["🔥", "💪", "👑", "⚡", "😎", "✅", "💯"];

// ✅ BAGONG DELAYS — MAS LIGTAS, HINDI AGAD MA-DETECT
const NICK_DELAY_MIN = 8000;
const NICK_DELAY_MAX = 15000;
const REPLY_DELAY_MIN = 20;
const REPLY_DELAY_MAX = 20;
const AUTO_RESTORE_DELAY = 250000;
const COOLDOWN = 1000;

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
      }, getRandomDelay(7000, 7000));
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
    `@${fullName} — 近寄るな。お前なんかに興味はない 😡😂 /silent`,
    `@${fullName} — さっさと消えろ。俺の機嫌が悪くなる前にな 😡😂 /silent`,
    `@${fullName} — お前誰だよ？俺の時間を無駄にするな 😡😂 /silent`,
    `@${fullName} — うるさい。静かにできないのか 😡😂 /silent`,
    `@${fullName} — 俺から何も得られるものはない。帰れ 😡😂 /silent`,
    `@${fullName} — 本当にしつこいな。いい加減にしろ 😡😂 /silent`,
    `@${fullName} — 知り合いでもないのに馴れ馴れしい 😡😂 /silent`,
    `@${fullName} — 声が大きすぎる。黙れ 😡😂 /silent`,
    `@${fullName} — お前と話す気はない。邪魔するな 😡😂 /silent`,
    `@${fullName} — もう一度言ってみろ。後悔することになるぞ 😡😂 /silent`,
    `@${fullName} — 俺が嫌いだって分からないのか 😡😂 /silent`,
    `@${fullName} — 自分を何様だと思っている 😡😂 /silent`,
    `@${fullName} — 俺の前から消えてくれ。さようなら 😡😂 /silent`,
    `@${fullName} — 今のは全然面白くないんだが 😡😂 /silent`,
    `@${fullName} — やめてくれ。俺は冗談は通じない 😡😂 /silent`,
    `@${fullName} — 用がないなら帰ってくれ 😡😂 /silent`,
    `@${fullName} — お前なんて眼中にないんだ 😡😂 /silent`,
    `@${fullName} — 偉そうにするな。お前なんかとは格が違う 😡😂 /silent`,
    `@${fullName} — 長話は苦手だ。用が済んだら去れ 😡😂 /silent`,
    `@${fullName} — 俺のレベルについて来れないだけだ 😡😂 /silent`,
    `@${fullName} — お前が俺に時間を費やす意味はない 😡😂 /silent`,
    `@${fullName} — お前の話なんて聞きたくもない 😡😂 /silent`,
    `@${fullName} — 穏便に済ませたいんだ。今すぐ去れ 😡😂 /silent`,
    `@${fullName} — 友達でもないのに親しげにするな 😡😂 /silent`,
    `@${fullName} — お前の顔はもう見飽きた 😡😂 /silent`,
    `@${fullName} — 俺の前で自慢話はやめてくれ 😡😂 /silent`,
    `@${fullName} — かまってちゃんなら他所でやれ 😡😂 /silent`,
    `@${fullName} — 調子に乗りすぎだ。少し黙ってろ 😡😂 /silent`,
    `@${fullName} — よくも俺に話しかけられたものだ 😡😂 /silent`,
    `@${fullName} — お前が俺にふさわしくない時に戻って来い 😡😂 /silent`,
    `@${fullName} — 俺は本気だ。からかっているわけじゃない 😡😂 /silent`,
    `@${fullName} — 俺の一日を邪魔しないでくれ 😡😂 /silent`,
    `@${fullName} — 俺を追いかけようなんて思うな 😡😂 /silent`,
    `@${fullName} — 黙っているのが一番賢い選択だ 😡😂 /silent`,
    `@${fullName} — 俺の忍耐を試すな 😡😂 /silent`,
    `@${fullName} — お前は別にすごくもなんともない 😡😂 /silent`,
    `@${fullName} — 前に出るな。お前なんかとは話してない 😡😂 /silent`,
    `@${fullName} — 話が通じないやつだな 😡😂 /silent`,
    `@${fullName} — 俺がお前に説明する義務はない 😡😂 /silent`,
    `@${fullName} — もう一度言う。去れ 😡😂 /silent`,
    `@${fullName} — 図に乗るな。いつでも追い出せるぞ 😡😂 /silent`,
    `@${fullName} — 俺の邪魔をする権利はお前にはない 😡😂 /silent`,
    `@${fullName} — 邪魔だと言っているのが分からないのか 😡😂 /silent`,
    `@${fullName} — 見えないところに消えてくれ 😡😂 /silent`,
    `@${fullName} — 仲良くなれると思うなよ 😡😂 /silent`,
    `@${fullName} — お前とは分かり合えない 😡😂 /silent`,
    `@${fullName} — 特別な人間なんかじゃない。目を覚ませ 😡😂 /silent`,
    `@${fullName} — 俺が怒る前に去ってくれ 😡😂 /silent`,
    `@${fullName} — お前の態度は気に入らない 😡😂 /silent`,
    `@${fullName} — 近づくな。お前なんか知らない 😡😂 /silent`,
    `@${fullName} — 俺は誰にも媚びない 😡😂 /silent`,
    `@${fullName} — お前に費やす時間は一秒たりともない 😡😂 /silent`,
    `@${fullName} — 本当にうっとうしいんだが 😡😂 /silent`,
    `@${fullName} — 俺を変えようなんて無駄だ 😡😂 /silent`,
    `@${fullName} — 上から目線で話すな 😡😂 /silent`,
    `@${fullName} — 知らないやつは信用しない主義だ 😡😂 /silent`,
    `@${fullName} — ここでお前の勝ち目はない 😡😂 /silent`,
    `@${fullName} — 嫌いだと言っているのが聞こえないのか 😡😂 /silent`,
    `@${fullName} — 俺の人生に関わるな 😡😂 /silent`,
    `@${fullName} — お前が誰だなんて興味ない 😡😂 /silent`,
    `@${fullName} — 何も生まれない。諦めろ 😡😂 /silent`,
    `@${fullName} — しつこい。子供みたいだ 😡😂 /silent`,
    `@${fullName} — 去れるうちに去った方が身のためだ 😡😂 /silent`,
    `@${fullName} — 簡単な言葉が理解できないのか 😡😂 /silent`,
    `@${fullName} — 俺の視界から消えてくれ。以上 😡😂 /silent`,
    `@${fullName} — 俺がお前を必要としていると思うな 😡😂 /silent`,
    `@${fullName} — お前なんかに騙されない 😡😂 /silent`,
    `@${fullName} — ここでは俺がルールだ。逆らうな 😡😂 /silent`,
    `@${fullName} — 無駄口を叩くな。中身がない 😡😂 /silent`,
    `@${fullName} — お前は何様だ？俺に指図するな 😡😂 /silent`,
    `@${fullName} — もう一度邪魔したら出て行ってもらう 😡😂 /silent`,
    `@${fullName} — 羨ましいだけだろ？認めろ 😡😂 /silent`,
    `@${fullName} — 俺からは何も得られない。諦めろ 😡😂 /silent`,
    `@${fullName} — よくも俺に向かってそんな口が聞けたものだ 😡😂 /silent`,
    `@${fullName} — いつまでもしつこいな 😡😂 /silent`,
    `@${fullName} — 言ったはずだ。話す気はないと 😡😂 /silent`,
    `@${fullName} — お前のために時間を割く理由がない 😡😂 /silent`,
    `@${fullName} — 人のことより自分のことを先に直せ 😡😂 /silent`,
    `@${fullName} — お前なんかに憧れる要素はない 😡😂 /silent`,
    `@${fullName} — 自慢話は聞き飽きた。他所でやれ 😡😂 /silent`,
    `@${fullName} — 俺とお前は住む世界が違うんだ 😡😂 /silent`,
    `@${fullName} — 俺にはお前なんか到底及ばない 😡😂 /silent`,
    `@${fullName} — 誰にも頭を下げるつもりはない 😡😂 /silent`,
    `@${fullName} — 頂点にいるのは俺だ。認めるしかない 😡😂 /silent`,
    `@${fullName} — 俺を怒らせない方がいい 😡😂 /silent`,
    `@${fullName} — 何をしても俺を倒すことはできない 😡😂 /silent`,
    `@${fullName} — 俺に構う時間があったら他のことをしろ 😡😂 /silent`,
    `@${fullName} — 俺の人生に入り込む隙はない 😡😂 /silent`,
    `@${fullName} — お願いだから俺を放っておいてくれ 😡😂 /silent`,
    `@${fullName} — 俺が基準だ。お前はただついて来れてないだけ 😡😂 /silent`,
    `@${fullName} — お前が俺に並べる日は永遠に来ない 😡😂 /silent`,
    `@${fullName} — 俺に頼るな。自分で何とかしろ 😡😂 /silent`,
    `@${fullName} — お前が思ってるほど俺は甘くない 😡😂 /silent`,
    `@${fullName} — 俺はお前の鏡じゃない 😡😂 /silent`,
    `@${fullName} — お前のプライド、粉々に砕いてやる 😡😂 /silent`,
    `@${fullName} — 俺の邪魔をするなら容赦しない 😡😂 /silent`,
    `@${fullName} — お前の挑戦は受けて立つ。だが結果は見えている 😡😂 /silent`,
    `@${fullName} — 俺の前では誰もが等しく無力だ 😡😂 /silent`,
    `@${fullName} — お前がどれだけ頑張っても俺の方が上だ 😡😂 /silent`,
    `@${fullName} — 俺がいる限りお前の勝ち目はない 😡😂 /silent`,
    `@${fullName} — 俺に勝とうなんて百年早い 😡😂 /silent`,
    `@${fullName} — お前の全力なんて俺の前では意味がない 😡😂 /silent`,
    `@${fullName} — 俺は常にお前の先を行っている 😡😂 /silent`,
    `@${fullName} — お前が追いつけない場所に俺はいる 😡😂 /silent`,
    `@${fullName} — 俺を超えようなんて夢のまた夢だ 😡😂 /silent`,
    `@${fullName} — お前の努力は無駄じゃない、ただ俺が強すぎるだけ 😡😂 /silent`,
    `@${fullName} — 俺の背中を見て学ぶといい 😡😂 /silent`,
    `@${fullName} — お前の全力を見せてみろ。それでも俺は負けない 😡😂 /silent`,
    `@${fullName} — 俺に挑むということはそういうことだ 😡😂 /silent`,
    `@${fullName} — お前がどれだけ強くなろうと俺はもっと強くなる 😡😂 /silent`,
    `@${fullName} — 俺の領域に踏み込むな 😡😂 /silent`,
    `@${fullName} — お前の実力、俺の足元にも及ばない 😡😂 /silent`,
    `@${fullName} — 俺が本気を出す時はお前がいなくなる時だ 😡😂 /silent`,
    `@${fullName} — お前の存在、俺にとっては些細なことだ 😡😂 /silent`,
    `@${fullName} — 俺に逆らう者は誰であろうと容赦しない 😡😂 /silent`,
    `@${fullName} — お前の言葉、俺には届かない 😡😂 /silent`,
    `@${fullName} — 俺はお前の想像を超えている 😡😂 /silent`,
    `@${fullName} — お前が俺に敵うはずがないだろ 😡😂 /silent`,
    `@${fullName} — 俺の前では全員が同じ結末を迎える 😡😂 /silent`,
    `@${fullName} — お前の時間を無駄にするな。俺は応じない 😡😂 /silent`,
    `@${fullName} — 俺はお前の期待に応えるためにいるわけじゃない 😡😂 /silent`,
    `@${fullName} — お前が何を思おうと俺の自由だ 😡😂 /silent`,
    `@${fullName} — 俺は俺の道を行く。お前はお前の道を行け 😡😂 /silent`,
    `@${fullName} — お前と俺は違う人間だ。分かり合えなくて当然 😡😂 /silent`,
    `@${fullName} — 俺にはお前の理解なんて必要ない 😡😂 /silent`,
    `@${fullName} — お前がどう思おうと俺は俺のままだ 😡😂 /silent`,
    `@${fullName} — 俺は誰のものでもない。俺自身だ 😡😂 /silent`,
    `@${fullName} — お前が何を言っても俺は変わらない 😡😂 /silent`,
    `@${fullName} — 俺の生き方に口出しするな 😡😂 /silent`,
    `@${fullName} — お前の価値観なんて押し付けるな 😡😂 /silent`,
    `@${fullName} — 俺はお前のために生きているわけじゃない 😡😂 /silent`,
    `@${fullName} — お前がいなくなっても俺は困らない 😡😂 /silent`,
    `@${fullName} — 俺にとってお前はその程度の存在だ 😡😂 /silent`,
    `@${fullName} — お前がいない方が俺は穏やかでいられる 😡😂 /silent`,
    `@${fullName} — 俺の邪魔をするなら消えてくれ 😡😂 /silent`,
    `@${fullName} — お前のことを知りたいとも思わない 😡😂 /silent`,
    `@${fullName} — 俺の名前を軽々しく口にするな 😡😂 /silent`,
    `@${fullName} — お前が俺の名を呼ぶ資格はない 😡😂 /silent`,
    `@${fullName} — 俺に近づくな。それがお前のためだ 😡😂 /silent`,
    `@${fullName} — お前が俺に近づけば傷つくのはお前だ 😡😂 /silent`,
    `@${fullName} — 俺は冷たいわけじゃない。お前がそうさせているだけだ 😡😂 /silent`,
    `@${fullName} — お前のせいで俺の機嫌が悪くなる 😡😂 /silent`,
    `@${fullName} — 俺に構うな。それが一番の優しさだ 😡😂 /silent`,
    `@${fullName} — お前が何を望もう俺は応えない 😡😂 /silent`,
    `@${fullName} — 俺はお前の都合のいい存在じゃない 😡😂 /silent`,
    `@${fullName} — お前が俺を理解する必要はない 😡😂 /silent`,
    `@${fullName} — 俺はただ俺であればいい 😡😂 /silent`,
    `@${fullName} — お前はお前であればいい。だから俺に構うな 😡😂 /silent`,
    `@${fullName} — ここはお前の居場所じゃない 😡😂 /silent`,
    `@${fullName} — みんなの前で恥をかく前に去れ 😡😂 /silent`,
    `@${fullName} — ここでは俺がルールだ。従えないなら出ていけ 😡😂 /silent`,
    `@${fullName} — お前がいると空気が悪くなる 😡😂 /silent`,
    `@${fullName} — 他のメンバーの迷惑になるな 😡😂 /silent`,
    `@${fullName} — しばらく黙っていろ。お前の出番はない 😡😂 /silent`,
    `@${fullName} — 場違いなのはお前の方だ 😡😂 /silent`,
    `@${fullName} — みんなお前のことを待ってない 😡😂 /silent`,
    `@${fullName} — 余計なことを言うな。静かにしてろ 😡😂 /silent`,
    `@${fullName} — お前がいない方がこのグループは平和だ 😡😂 /silent`,
    `@${fullName} — ここで偉そうにするな。実力を見せてみろ 😡😂 /silent`,
    `@${fullName} — お前の発言は誰も求めていない 😡😂 /silent`,
    `@${fullName} — グループの雰囲気を乱すな 😡😂 /silent`,
    `@${fullName} — お前よりこの場をわきまえろ 😡😂 /silent`,
    `@${fullName} — 自分の立場をわきまえろ 😡😂 /silent`,
    `@${fullName} — みんなが見ている前で大人しくしろ 😡😂 /silent`,
    `@${fullName} — お前の言葉は軽すぎる 😡😂 /silent`,
    `@${fullName} — ここでは俺が一番だ。お前は二番手ですらない 😡😂 /silent`,
    `@${fullName} — 調子に乗りすぎだ。少し頭を冷やせ 😡😂 /silent`,
    `@${fullName} — お前が何を言っても誰も聞いていない 😡😂 /silent`,
    `@${fullName} — 出て行けとは言わない。だが静かにしろ 😡😂 /silent`,
    `@${fullName} — お前のせいでみんなが迷惑している 😡😂 /silent`,
    `@${fullName} — ここはお前の遊び場じゃない 😡😂 /silent`,
    `@${fullName} — もう少し謙虚になれないのか 😡😂 /silent`,
    `@${fullName} — お前の自慢話は聞き飽きた 😡😂 /silent`,
    `@${fullName} — みんなの邪魔をするなら出て行け 😡😂 /silent`,
    `@${fullName} — お前一人のせいで空気が重くなる 😡😂 /silent`,
    `@${fullName} — 場に合った言動を心がけろ 😡😂 /silent`,
    `@${fullName} — お前が話す順番じゃない。黙ってろ 😡😂 /silent`,
    `@${fullName} — このグループで一番偉いのは俺だ 😡😂 /silent`,
    `@${fullName} — お前はただそこにいればいい 😡😂 /silent`,
    `@${fullName} — 目立とうとするな。お前じゃない 😡😂 /silent`,
    `@${fullName} — お前の意見なんて必要ない 😡😂 /silent`,
    `@${fullName} — 静かに座って話を聞いていろ 😡😂 /silent`,
    `@${fullName} — お前がしゃべると話が進まない 😡😂 /silent`,
    `@${fullName} — ここでは俺が全てを決める 😡😂 /silent`,
    `@${fullName} — お前は従うだけでいい 😡😂 /silent`,
    `@${fullName} — 逆らうなら出て行って構わない 😡😂 /silent`,
    `@${fullName} — お前がいてもいなくても変わらない 😡😂 /silent`,
    `@${fullName} — その程度の存在だと自覚しろ 😡😂 /silent`,
    `@${fullName} — 俺の言うことが聞けないのか 😡😂 /silent`,
    `@${fullName} — 反抗的な態度は気に入らない 😡😂 /silent`,
    `@${fullName} — お前の実力を見せてから物を言え 😡😂 /silent`,
    `@${fullName} — 口だけなら誰でもできる 😡😂 /silent`,
    `@${fullName} — 結果を出して初めて発言権が得られる 😡😂 /silent`,
    `@${fullName} — お前にはまだ早い 😡😂 /silent`,
    `@${fullName} — 大人しくしているのが一番だ 😡😂 /silent`,
    `@${fullName} — 目立つな。お前の居場所はそこじゃない 😡😂 /silent`,
    `@${fullName} — みんながお前を見ている。恥をかくな 😡😂 /silent`,
    `@${fullName} — お前がどれだけ頑張っても俺の方が上だ 😡😂 /silent`,
    `@${fullName} — このグループの頂点は俺だ。認めろ 😡😂 /silent`,
    `@${fullName} — お前は俺の引き立て役に過ぎない 😡😂 /silent`,
    `@${fullName} — 俺の方がみんなに信頼されている 😡😂 /silent`,
    `@${fullName} — お前の努力なんて誰も見ていない 😡😂 /silent`,
    `@${fullName} — 結果が全てだ。お前にはそれがない 😡😂 /silent`,
    `@${fullName} — 俺に勝てないと分かったら去れ 😡😂 /silent`,
    `@${fullName} — お前がいる限りこのグループは良くならない 😡😂 /silent`,
    `@${fullName} — 空気を読め。お前が浮いている 😡😂 /silent`,
    `@${fullName} — みんなお前にうんざりしている 😡😂 /silent`,
    `@${fullName} — 自分の行動を振り返ってみろ 😡😂 /silent`,
    `@${fullName} — お前のせいで雰囲気が悪くなる 😡😂 /silent`,
    `@${fullName} — そろそろ自分の立場を理解しろ 😡😂 /silent`,
    `@${fullName} — お前がしゃべるなと言っているだろ 😡😂 /silent`,
    `@${fullName} — 俺が話している時は黙ってろ 😡😂 /silent`,
    `@${fullName} — 順番を守れ。お前の番は最後だ 😡😂 /silent`,
    `@${fullName} — 偉そうにするな。まだ早い 😡😂 /silent`,
    `@${fullName} — お前が俺に教えられることなどない 😡😂 /silent`,
    `@${fullName} — 俺が間違ってる？なら証明してみろ 😡😂 /silent`,
    `@${fullName} — お前の意見なんてどうでもいい 😡😂 /silent`,
    `@${fullName} — ここでは俺が正しい。それがルールだ 😡😂 /silent`,
    `@${fullName} — 文句があるなら出て行け 😡😂 /silent`,
    `@${fullName} — お前一人いなくなっても誰も困らない 😡😂 /silent`,
    `@${fullName} — 代わりならいくらでもいるんだ 😡😂 /silent`,
    `@${fullName} — お前が特別だなんて思うな 😡😂 /silent`,
    `@${fullName} — 謙虚さを知らないやつは嫌われる 😡😂 /silent`,
    `@${fullName} — お前の態度、直した方がいいぞ 😡😂 /silent`,
    `@${fullName} — 俺に対する態度、考え直せ 😡😂 /silent`,
    `@${fullName} — お前が何を言おうと俺は動じない 😡😂 /silent`,
    `@${fullName} — 俺に影響を与えようなんて無理だ 😡😂 /silent`,
    `@${fullName} — お前の言葉なんて俺には刺さらない 😡😂 /silent`,
    `@${fullName} — 俺は鉄壁だ。お前なんか通用しない 😡😂 /silent`,
    `@${fullName} — お前の挑発なんて効かない 😡😂 /silent`,
    `@${fullName} — 俺は何が来ても揺るがない 😡😂 /silent`,
    `@${fullName} — お前がどれだけ頑張っても俺は動かない 😡😂 /silent`,
    `@${fullName} — 俺の心はお前なんかに壊せない 😡😂 /silent`,
    `@${fullName} — お前なんかが俺を傷つけられると思うな 😡😂 /silent`,
    `@${fullName} — 俺は強い。お前なんかに負けない 😡😂 /silent`,
    `@${fullName} — お前が何をしても俺は俺のままだ 😡😂 /silent`,
    `@${fullName} — 俺の信念は揺るがない。お前ごときでは 😡😂 /silent`,
    `@${fullName} — お前の存在なんて俺にとっては塵だ 😡😂 /silent`,
    `@${fullName} — 俺にとってお前は無名の存在に過ぎない 😡😂 /silent`,
    `@${fullName} — いつまでも俺に構ってないで自分のことをしろ 😡😂 /silent`,
    `@${fullName} — お前の時間を無駄にするな。俺は応じない 😡😂 /silent`,
    `@${fullName} — 俺にはお前なんかよりも大事なものがある 😡😂 /silent`,
    `@${fullName} — お前なんかに俺の時間は使わない 😡😂 /silent`,
    `@${fullName} — 俺はお前とは違う世界に生きている 😡😂 /silent`,
    `@${fullName} — お前が俺のレベルに追いつくことは永遠にない 😡😂 /silent`,
    `@${fullName} — 俺は頂点にいる。お前は下で吠えていろ 😡😂 /silent`,
    `@${fullName} — お前の届かない場所に俺はいる 😡😂 /silent`,
    `@${fullName} — 俺を見上げるだけでいい。追いつこうとするな 😡😂 /silent`,
    `@${fullName} — お前がどれだけ背伸びをしても俺の方が高い 😡😂 /silent`,
    `@${fullName} — 俺の背中を見ていればいい。それがお前の役目だ 😡😂 /silent`,
    `@${fullName} — お前には俺の景色が見えないんだ 😡😂 /silent`,
    `@${fullName} — 俺の上に立とうなんて百年早い 😡😂 /silent`,
    `@${fullName} — お前の全力なんて俺には届かない 😡😂 /silent`,
    `@${fullName} — 俺の前ではお前なんか無力だ 😡😂 /silent`,
    `@${fullName} — お前がどれだけ足掻いても俺は動かない 😡😂 /silent`,
    `@${fullName} — 俺はお前の全てを見透かしている 😡😂 /silent`,
    `@${fullName} — お前の考えていることなんてお見通しだ 😡😂 /silent`,
    `@${fullName} — お前の行動、全て見られているんだ 😡😂 /silent`,
    `@${fullName} — 俺に隠し事など通用しない 😡😂 /silent`,
    `@${fullName} — お前の嘘なんて俺にはすぐに分かる 😡😂 /silent`,
    `@${fullName} — 俺の目を見ろ。お前の心が丸見えだ 😡😂 /silent`,
    `@${fullName} — お前が何を企んでいるか知っている 😡😂 /silent`,
    `@${fullName} — 俺に逆らうとどうなるか分かっているな 😡😂 /silent`,
    `@${fullName} — お前の行動には責任が伴うんだ 😡😂 /silent`,
    `@${fullName} — 俺はお前を監視している。心しておけ 😡😂 /silent`,
    `@${fullName} — お前の自由は俺が許した範囲内だ 😡😂 /silent`,
    `@${fullName} — 俺が駄目と言ったら駄目だ 😡😂 /silent`,
    `@${fullName} — お前が何を言っても俺が決定権を持つ 😡😂 /silent`,
    `@${fullName} — この場では俺が絶対だ 😡😂 /silent`,
    `@${fullName} — お前は俺の指示に従えばいい 😡😂 /silent`,
    `@${fullName} — 俺に従うことがお前のためになる 😡😂 /silent`,
    `@${fullName} — お前が俺に従えば悪いようにはしない 😡😂 /silent`,
    `@${fullName} — だが逆らうなら容赦はしない 😡😂 /silent`,
    `@${fullName} — お前の運命は俺が握っているんだ 😡😂 /silent`,
    `@${fullName} — 俺に感謝する時が来るだろう。それまで静かにしていろ 😡😂 /silent`
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
    `@${fullName} — Lumayo ka sa grupong ito salamat 😡😂 /silent`
  ];
  return isPM 
    ? pmReplies[Math.floor(Math.random() * pmReplies.length)] 
    : gcReplies[Math.floor(Math.random() * gcReplies.length)];
}

module.exports.config = {
  name: "ryuk",
  version: "7.9.9 SAFE DELAYS",
  hasPermission: 1,
  credits: "RYUK",
  description: "Undetectable Delays + Wrong Spelling",
  usePrefix: true,
  cooldowns: 1
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
             }, getRandomDelay(7000, 7000));
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
               }, getRandomDelay(7000, 7000));
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
 `BOT COMMAND:
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

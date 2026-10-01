const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(
  __dirname,
  "count_data"
);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(
    DATA_DIR,
    { recursive: true }
  );
}

const ADMIN_IDS = new Set([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

const MAX_COUNT = 50;

/*
 * Counting delay.
 * Kept reasonable so the bot does not
 * flood the Messenger API.
 */
const COUNT_DELAY_MIN = 1200;
const COUNT_DELAY_MAX = 1800;

const activeCount = {};
const currentNumber = {};
const running = {};
const offenderNames = {};

const FUNNY_REASONS = [
  "Kasi mukhang nag-loading pa utak niya bago lumaban. 😂",
  "Naubusan yata ng confidence bago pa magsimula. 🤣",
  "Nag-practice muna pero nakalimutan ang actual laban. 😭",
  "Masyadong busy mag-isip kung paano matatalo. 💀",
  "Parang WiFi signal, biglang nawawala ang tapang. 📶😂",
  "Naghanap ng strategy pero sa Google Maps napunta. 🤣",
  "Akala niya easy mode, tutorial pala ang kailangan. 😭",
  "Nag-ready nang todo tapos umatras din. 💀",
  "Masyadong mahaba ang loading screen ng tapang. 😂",
  "Nag-timeout bago pa matapos ang laban. ⏰🤣",
  "Nawala ang confidence kasama ng internet connection. 📡💀",
  "Nag-isip ng comeback pero walang available na comeback. 😂",
  "Parang calculator na walang battery, hindi gumana. 🤣",
  "Naghanda ng speech pero hindi nakapaghanda ng laban. 😭",
  "Sobrang daming plano, zero execution. 💀",
  "Nag-buffer ang tapang. Please wait... 😂",
  "Akala niya may second chance, wala palang save point. 🤣",
  "Naghanap ng kakampi pero lahat naka-AFK. 💀",
  "Masyadong confident sa simula, comedy sa ending. 😂",
  "Nawala ang fighting spirit sa unang minuto. 😭",
  "Nag-update yata ng strategy habang ongoing ang laban. 🤣",
  "Muntik nang manalo, kaso nagising ang alarm. 😂",
  "Nag-login para lumaban, nag-logout din agad. 💀",
  "Hindi natalo sa laban, natalo sa sariling desisyon. 🤣",
  "Parang exam, confident sa una tapos blanko sa dulo. 😭",
  "Naghanap ng shortcut pero dead end pala. 😂",
  "Masyadong seryoso ang laban kaya naging comedy show. 🤣",
  "Nag-charge ng phone pero nakalimutang i-charge ang tapang. 🔋💀",
  "Nawala yata ang manual ng pagiging malakas. 😂",
  "Nag-prepare ng victory pose nang maaga. 🤣",
  "Hindi pa ready ang character niya sa next level. 💀",
  "Nagkaroon ng technical difficulty ang confidence. 😂",
  "Nag-buffer ang utak bago nakapag-react. 🤣",
  "Akala niya boss fight, siya pala ang tutorial character. 😭",
  "Naghanap ng opening pero nagsara agad ang pagkakataon. 😂",
  "Masyadong mabilis ang plano, mabagal ang execution. 🤣",
  "Naka-energy saving mode yata ang tapang. 🔋😂",
  "Nagkaroon ng unexpected maintenance ang confidence. 💀",
  "Nag-restart ng utak pero same result pa rin. 🤣",
  "Akala niya comeback season, cancelled pala. 😂",
  "Nag-practice ng victory speech pero hindi nagamit. 😭",
  "Nawala ang signal ng fighting spirit. 📶💀",
  "Parang loading bar na stuck sa 1%. 😂",
  "Naghanap ng dahilan bago pa hanapin ang panalo. 🤣",
  "Masyadong busy mag-explain kaysa lumaban. 😂",
  "Nagkaroon ng system error ang confidence. 💀",
  "Hindi compatible ang strategy sa situation. 🤣",
  "Nag-update ang game, naiwan ang player. 😂",
  "Nag-expect ng easy win pero surprise ending. 😭",
  "Nag-try hard pero nag-try harder ang kalaban. 🤣",
  "Naghintay ng miracle update pero walang dumating. 💀",
  "Parang group project, may effort pero walang result. 😂",
  "Nagkaroon ng plot twist na hindi niya binasa. 🤣",
  "Nawala ang tapang somewhere between hello at laban. 😂",
  "Nag-ready ang katawan, naiwan ang confidence. 💀",
  "Akala niya final boss, pero siya ang na-finalize. 🤣",
  "Naghanap ng exit button kahit wala namang exit. 😂",
  "Masyadong dramatic ang entrance, short ang performance. 🤣",
  "Nag-save ng energy pero nakalimutang gamitin. 💀",
  "Nagkaroon ng emergency meeting ang utak niya. 😂"
];

function isAdmin(senderID) {
  return ADMIN_IDS.has(
    String(senderID)
  );
}

function getFile(threadID) {
  return path.join(
    DATA_DIR,
    `${threadID}.json`
  );
}

function loadData(threadID) {
  try {
    const file =
      getFile(threadID);

    if (
      fs.existsSync(file)
    ) {
      const data =
        JSON.parse(
          fs.readFileSync(
            file,
            "utf8"
          )
        );

      return {
        active: Boolean(
          data.active
        ),
        num:
          Number(data.num) || 0,
        max:
          Number(data.max) ||
          MAX_COUNT
      };
    }
  } catch (error) {
    console.error(
      "[COUNT] Load error:",
      error.message
    );
  }

  return {
    active: false,
    num: 0,
    max: MAX_COUNT
  };
}

function saveData(
  threadID,
  data
) {
  try {
    fs.writeFileSync(
      getFile(threadID),
      JSON.stringify(
        data,
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      "[COUNT] Save error:",
      error.message
    );
  }
}

function stopCount(
  threadID
) {
  running[threadID] =
    false;

  activeCount[threadID] =
    false;

  const data =
    loadData(threadID);

  data.active = false;

  saveData(
    threadID,
    data
  );
}

function pickReason() {
  return FUNNY_REASONS[
    Math.floor(
      Math.random() *
        FUNNY_REASONS.length
    )
  ];
}

function getRandomDelay() {
  return (
    COUNT_DELAY_MIN +
    Math.floor(
      Math.random() *
        (
          COUNT_DELAY_MAX -
          COUNT_DELAY_MIN +
          1
        )
    )
  );
}

function formatDate() {
  const now =
    new Date();

  const date =
    now.toLocaleDateString(
      "en-PH",
      {
        timeZone:
          "Asia/Manila",
        month: "numeric",
        day: "numeric",
        year: "numeric"
      }
    );

  const time =
    now.toLocaleTimeString(
      "en-PH",
      {
        timeZone:
          "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }
    );

  const month =
    now.toLocaleString(
      "en-PH",
      {
        timeZone:
          "Asia/Manila",
        month: "long"
      }
    );

  const year =
    Number(
      new Intl.DateTimeFormat(
        "en-PH",
        {
          timeZone:
            "Asia/Manila",
          year: "numeric"
        }
      ).format(now)
    );

  return {
    date,
    time,
    month,
    year
  };
}

function getUserName(
  api,
  userID
) {
  return new Promise(
    resolve => {
      try {
        if (
          !api ||
          typeof api.getUserInfo !==
            "function"
        ) {
          return resolve(
            `User ${userID}`
          );
        }

        api.getUserInfo(
          userID,
          (
            error,
            info
          ) => {
            if (
              !error &&
              info &&
              info[userID]
            ) {
              resolve(
                info[userID].name ||
                info[userID].firstName ||
                `User ${userID}`
              );
            } else {
              resolve(
                `User ${userID}`
              );
            }
          }
        );
      } catch (error) {
        resolve(
          `User ${userID}`
        );
      }
    }
  );
}

function sendMessage(
  api,
  message,
  threadID
) {
  return new Promise(
    resolve => {
      try {
        api.sendMessage(
          message,
          threadID,
          error => {
            resolve(
              !error
            );
          }
        );
      } catch (error) {
        console.error(
          "[COUNT] Send error:",
          error.message
        );

        resolve(false);
      }
    }
  );
}

async function sendResult(
  api,
  threadID,
  stopped
) {
  const dt =
    formatDate();

  let loseSection;

  if (
    offenderNames[
      threadID
    ]
  ) {
    const offender =
      offenderNames[
        threadID
      ];

    loseSection =
      `❌ LOSE: ${offender.fullName} (@[${offender.id}])\n\n`;
  } else {
    loseSection =
      "❌ LOSE: WALA — Walang nangahas lumaban! 😂\n\n";
  }

  const title =
    stopped
      ? "🛑 COUNT STOPPED"
      : "🎉 50 REACHED! 🎉";

  const message =
    `${title}\n\n` +
    `🏆 WIN: 50\n\n` +
    loseSection +
    `📝 REASON: ${pickReason()}\n\n` +
    `📅 DATE: ${dt.date}\n` +
    `🌙 MONTH: ${dt.month}\n` +
    `📆 YEAR: ${dt.year}\n` +
    `⏰ TIME: ${dt.time}\n\n` +
    `👑 COUNT COMPLETE!`;

  return sendMessage(
    api,
    message,
    threadID
  );
}

async function countLoop(
  api,
  threadID
) {
  if (
    activeCount[
      threadID
    ]
  ) {
    return;
  }

  activeCount[
    threadID
  ] = true;

  while (
    running[
      threadID
    ] &&
    currentNumber[
      threadID
    ] < MAX_COUNT
  ) {
    currentNumber[
      threadID
    ]++;

    saveData(
      threadID,
      {
        active: true,
        num:
          currentNumber[
            threadID
          ],
        max: MAX_COUNT
      }
    );

    const number =
      currentNumber[
        threadID
      ];

    const sent =
      await sendMessage(
        api,
        `🔢 ${number}`,
        threadID
      );

    if (!sent) {
      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            1000
          )
      );
    }

    if (
      number >=
      MAX_COUNT
    ) {
      stopCount(
        threadID
      );

      await sendResult(
        api,
        threadID,
        false
      );

      activeCount[
        threadID
      ] = false;

      return;
    }

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          getRandomDelay()
        )
    );
  }

  activeCount[
    threadID
  ] = false;
}

function startCounting(
  api,
  threadID
) {
  if (
    running[
      threadID
    ]
  ) {
    return false;
  }

  const data =
    loadData(threadID);

  offenderNames[
    threadID
  ] = null;

  data.active = true;
  data.num = 0;
  data.max =
    MAX_COUNT;

  saveData(
    threadID,
    data
  );

  currentNumber[
    threadID
  ] = 0;

  running[
    threadID
  ] = true;

  countLoop(
    api,
    threadID
  );

  return true;
}

module.exports.config = {
  name: "count",
  version: "1.0.1",
  hasPermission: 1,
  credits: "RYUK",
  description:
    "Fast and stable count 1-50 with funny reasons.",
  usePrefix: true,
  commandCategory:
    "COUNT",
  usages:
    "/count start | /count stop",
  cooldowns: 3
};

module.exports.run =
  async function ({
    api,
    event,
    args
  }) {
    const threadID =
      event.threadID;

    const senderID =
      event.senderID;

    if (
      !isAdmin(senderID)
    ) {
      return;
    }

    const command =
      String(
        args[0] || ""
      ).toLowerCase();

    if (
      command === "start"
    ) {
      if (
        running[
          threadID
        ]
      ) {
        return sendMessage(
          api,
          "⚠️ May tumatakbo nang COUNT sa GC na ito.",
          threadID
        );
      }

      startCounting(
        api,
        threadID
      );

      return sendMessage(
        api,
        "🔢 COUNT STARTED!\n\n" +
        "1 hanggang 50\n" +
        "⚡ Fast counting\n" +
        "🇵🇭 Philippine Time\n" +
        "😂 Maraming funny reasons\n\n" +
        "Use /count stop para huminto.",
        threadID
      );
    }

    if (
      command === "stop"
    ) {
      if (
        !running[
          threadID
        ]
      ) {
        return sendMessage(
          api,
          "⚠️ Walang active COUNT.",
          threadID
        );
      }

      stopCount(
        threadID
      );

      return sendResult(
        api,
        threadID,
        true
      );
    }

    return sendMessage(
      api,
      "👑 COUNT COMMANDS\n\n" +
      "/count start\n" +
      "/count stop\n\n" +
      "🔢 Count: 1-50\n" +
      "😂 Maraming funny reasons\n" +
      "🇵🇭 Philippine Time",
      threadID
    );
  };

module.exports.handleEvent =
  async function ({
    api,
    event
  }) {
    try {
      if (
        !event ||
        !event.threadID
      ) {
        return;
      }

      const threadID =
        event.threadID;

      const data =
        loadData(
          threadID
        );

      if (
        !data.active
      ) {
        return;
      }

      if (
        event.type !==
        "message"
      ) {
        return;
      }

      const botID =
        String(
          api.getCurrentUserID
            ? api.getCurrentUserID()
            : api.userID || ""
        );

      if (
        String(
          event.senderID
        ) === botID
      ) {
        return;
      }

      const body =
        String(
          event.body || ""
        ).toLowerCase();

      if (!body) {
        return;
      }

      const adminNames = [
        "ryuk",
        "gojo",
        "boss",
        "gnm",
        "gojo satoru"
      ];

      const attackWords =
        /talo|baba|mahina|patay|alis|bwisit|gago|tanga|bobo|walang|pangit|bantay|hina|kawawa|iyak|tigil|hinto|alisin|siya|bawal|hindi/;

      let attacking =
        false;

      for (
        const name
        of adminNames
      ) {
        if (
          body.includes(
            name
          ) &&
          attackWords.test(
            body
          )
        ) {
          attacking =
            true;
          break;
        }
      }

      if (
        !attacking ||
        !event.senderID
      ) {
        return;
      }

      const fullName =
        await getUserName(
          api,
          event.senderID
        );

      offenderNames[
        threadID
      ] = {
        id:
          String(
            event.senderID
          ),
        fullName
      };

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            800
          )
      );

      const dt =
        formatDate();

      await sendMessage(
        api,
        `⚠️ NAKITA KO ITO! 👀\n\n` +
        `🏆 WIN: COUNT BOT\n\n` +
        `❌ LOSE: ${fullName} (@[${event.senderID}])\n\n` +
        `📝 REASON: ${pickReason()}\n\n` +
        `📅 DATE: ${dt.date}\n` +
        `🌙 MONTH: ${dt.month}\n` +
        `📆 YEAR: ${dt.year}\n` +
        `⏰ TIME: ${dt.time}`,
        threadID
      );

    } catch (error) {
      console.error(
        "[COUNT] Event error:",
        error.message
      );
    }
  };

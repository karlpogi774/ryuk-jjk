const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ryuk",
  version: "4.0.0",
  hasPermission: 0,
  credits: "RYUK",
  description:
    "RYUK auto reply, auto react, nickname and GC name manager.",
  usePrefix: true,
  commandCategory: "Fun",
  usages:
    "/ryuk on | off | status | lock | unlock | setnick | setgname | target | untarget | replyon | replyoff | reacton | reactoff | help",
  cooldowns: 3
};

const DATA_PATH =
  path.join(
    __dirname,
    "ryuk_data.json"
  );

const TARGET_NICKNAME =
  "RYUK POGI";

const TARGET_GC_NAME =
  "RYUK POGI";

/*
 * Delays are intentionally controlled
 * to avoid unnecessary repeated API calls.
 */
const NICKNAME_DELAY =
  1500;

const RESTORE_DELAY =
  2000;

const REPLY_COOLDOWN =
  4000;

const REACTION_COOLDOWN =
  1500;

const GCNAME_RESTORE_COOLDOWN =
  10000;

const NICKNAME_RESTORE_COOLDOWN =
  5000;

const DEFAULT_DATA = {
  active: false,

  autoReply: true,

  autoReact: true,

  nicknameLock: false,

  gcNameLock: false,

  nickname:
    TARGET_NICKNAME,

  gcName:
    TARGET_GC_NAME,

  target: {},

  replyCount: 0,

  reactionCount: 0,

  nicknameCount: 0,

  restoreCount: 0,

  gcNameRestores: 0,

  errorCount: 0,

  updatedAt: 0
};

const lastReply =
  {};

const lastReaction =
  {};

const nicknameRestoreLock =
  {};

const gcNameRestoreLock =
  {};

const nicknameQueue =
  new Map();

function loadData() {
  try {
    if (
      !fs.existsSync(
        DATA_PATH
      )
    ) {
      return {
        ...DEFAULT_DATA
      };
    }

    const raw =
      fs.readFileSync(
        DATA_PATH,
        "utf8"
      );

    if (!raw.trim()) {
      return {
        ...DEFAULT_DATA
      };
    }

    const saved =
      JSON.parse(raw);

    return {
      ...DEFAULT_DATA,

      ...saved,

      nickname:
        TARGET_NICKNAME,

      gcName:
        TARGET_GC_NAME,

      target:
        saved.target &&
        typeof saved.target ===
          "object"
          ? saved.target
          : {}
    };

  } catch (error) {
    console.error(
      "[RYUK] Load error:",
      error.message ||
        error
    );

    return {
      ...DEFAULT_DATA
    };
  }
}

function saveData(
  data
) {
  try {
    data.updatedAt =
      Date.now();

    const tempPath =
      DATA_PATH +
      ".tmp";

    fs.writeFileSync(
      tempPath,
      JSON.stringify(
        data,
        null,
        2
      ),
      "utf8"
    );

    fs.renameSync(
      tempPath,
      DATA_PATH
    );

    return true;

  } catch (error) {
    console.error(
      "[RYUK] Save error:",
      error.message ||
        error
    );

    return false;
  }
}

function wait(
  ms
) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}

function now() {
  return Date.now();
}

function isCooldown(
  map,
  key,
  duration
) {
  const current =
    now();

  const previous =
    map[key] || 0;

  if (
    current -
      previous <
    duration
  ) {
    return true;
  }

  map[key] =
    current;

  return false;
}

function getThreadKey(
  threadID
) {
  return String(
    threadID
  );
}

function normalizeName(
  value
) {
  return String(
    value || ""
  )
    .trim();
}

function getNickname() {
  return TARGET_NICKNAME;
}

function getGCName() {
  return TARGET_GC_NAME;
}

function ensureData() {
  try {
    const data =
      loadData();

    data.nickname =
      TARGET_NICKNAME;

    data.gcName =
      TARGET_GC_NAME;

    if (
      !data.target ||
      typeof data.target !==
        "object"
    ) {
      data.target = {};
    }

    saveData(
      data
    );

  } catch (error) {
    console.error(
      "[RYUK] Data setup error:",
      error.message ||
        error
    );
  }
}

ensureData();function safeSend(
  api,
  message,
  threadID,
  replyTo
) {
  return new Promise(
    resolve => {
      try {
        if (
          !api ||
          typeof api.sendMessage !==
            "function"
        ) {
          return resolve(
            null
          );
        }

        api.sendMessage(
          message,
          threadID,
          (
            error,
            info
          ) => {
            if (error) {
              console.error(
                "[RYUK] Send error:",
                error.message ||
                  error
              );

              return resolve(
                null
              );
            }

            resolve(
              info || null
            );
          },
          replyTo
        );

      } catch (error) {
        console.error(
          "[RYUK] Send exception:",
          error.message ||
            error
        );

        resolve(
          null
        );
      }
    }
  );
}

function safeReaction(
  api,
  reaction,
  messageID
) {
  return new Promise(
    resolve => {
      try {
        if (
          !api ||
          typeof api.setMessageReaction !==
            "function"
        ) {
          return resolve(
            false
          );
        }

        api.setMessageReaction(
          reaction,
          messageID,
          error => {
            resolve(
              !error
            );
          },
          true
        );

      } catch (error) {
        resolve(
          false
        );
      }
    }
  );
}

function safeNickname(
  api,
  nickname,
  threadID,
  userID
) {
  return new Promise(
    resolve => {
      try {
        if (
          !api ||
          typeof api.changeNickname !==
            "function"
        ) {
          return resolve(
            false
          );
        }

        api.changeNickname(
          nickname,
          threadID,
          userID,
          error => {
            resolve(
              !error
            );
          }
        );

      } catch (error) {
        console.error(
          "[RYUK] Nickname error:",
          error.message ||
            error
        );

        resolve(
          false
        );
      }
    }
  );
}

function safeTitle(
  api,
  title,
  threadID
) {
  return new Promise(
    resolve => {
      try {
        if (
          !api ||
          typeof api.setTitle !==
            "function"
        ) {
          return resolve(
            false
          );
        }

        api.setTitle(
          title,
          threadID,
          error => {
            resolve(
              !error
            );
          }
        );

      } catch (error) {
        console.error(
          "[RYUK] GC name error:",
          error.message ||
            error
        );

        resolve(
          false
        );
      }
    }
  );
}

function getThreadInfo(
  api,
  threadID
) {
  return new Promise(
    resolve => {
      try {
        if (
          !api ||
          typeof api.getThreadInfo !==
            "function"
        ) {
          return resolve(
            null
          );
        }

        api.getThreadInfo(
          threadID,
          (
            error,
            info
          ) => {
            if (
              error ||
              !info
            ) {
              return resolve(
                null
              );
            }

            resolve(
              info
            );
          }
        );

      } catch (error) {
        console.error(
          "[RYUK] Thread info error:",
          error.message ||
            error
        );

        resolve(
          null
        );
      }
    }
  );
}

function getCurrentBotID(
  api
) {
  try {
    if (
      api &&
      typeof api.getCurrentUserID ===
        "function"
    ) {
      return String(
        api.getCurrentUserID()
      );
    }

    if (
      api &&
      api.userID
    ) {
      return String(
        api.userID
      );
    }

  } catch (error) {
    return null;
  }

  return null;
      }const AUTO_REPLIES = [
  "👁️ RYUK: Nakita ko yan.",
  "💀 RYUK: Present.",
  "🔥 RYUK: Ayan na naman.",
  "🤣 RYUK: Grabe ka naman.",
  "😈 RYUK: Narinig kita.",
  "👑 RYUK: RYUK POGI.",
  "⚡ RYUK: Sige, tuloy mo lang.",
  "🥷 RYUK: Chill lang.",
  "💀 RYUK: Interesting yan.",
  "🔥 RYUK: Gets ko na.",
  "👀 RYUK: Binasa ko.",
  "🤣 RYUK: May point ka rin.",
  "😆 RYUK: Ayan ang message.",
  "🛡️ RYUK: Nandito lang ako.",
  "👑 RYUK: Okay, noted.",
  "💀 RYUK: Tahimik pero active.",
  "🔥 RYUK: Continue.",
  "👁️ RYUK: May nakikinig.",
  "😈 RYUK: Hindi ako AFK.",
  "⚡ RYUK: Ayan na nga.",
  "🤣 RYUK: Hahaha.",
  "🥷 RYUK: Relax.",
  "💀 RYUK: Copy.",
  "🔥 RYUK: Received.",
  "👑 RYUK: Present na present.",
  "👀 RYUK: I see you.",
  "😆 RYUK: Okay yan.",
  "🛡️ RYUK: All good.",
  "⚡ RYUK: Noted.",
  "💀 RYUK: Message received.",
  "🔥 RYUK: Uy, may nagsalita.",
  "👀 RYUK: Nakikinig ako.",
  "🤣 RYUK: Ayan ang energy.",
  "🥷 RYUK: Copy that.",
  "💀 RYUK: RYUK checking in.",
  "⚡ RYUK: Active ako.",
  "🔥 RYUK: Sige lang.",
  "👑 RYUK: RYUK POGI reporting.",
  "😆 RYUK: Okay, nakita ko.",
  "👁️ RYUK: Message detected.",
  "💀 RYUK: Walang lusot.",
  "🤣 RYUK: Hahaha gets.",
  "🔥 RYUK: Noted yan.",
  "🥷 RYUK: Nandito lang.",
  "⚡ RYUK: Received loud and clear.",
  "👀 RYUK: May message.",
  "💀 RYUK: Acknowledged.",
  "🔥 RYUK: Tuloy ang usapan.",
  "😈 RYUK: Active pa rin."
];

const AUTO_REACTIONS = [
  "💀",
  "🤣",
  "😆",
  "🔥",
  "🥷",
  "👀",
  "😈"
];

function randomItem(
  list
) {
  if (
    !Array.isArray(list) ||
    list.length === 0
  ) {
    return null;
  }

  return list[
    Math.floor(
      Math.random() *
        list.length
    )
  ];
}

function getAutoReply() {
  return (
    randomItem(
      AUTO_REPLIES
    ) ||
    "💀 RYUK: Present."
  );
}

function getAutoReaction() {
  return (
    randomItem(
      AUTO_REACTIONS
    ) ||
    "👍"
  );
}

function canReply(
  threadID
) {
  const key =
    getThreadKey(
      threadID
    );

  const current =
    now();

  const previous =
    lastReply[key] || 0;

  if (
    current -
      previous <
    REPLY_COOLDOWN
  ) {
    return false;
  }

  lastReply[key] =
    current;

  return true;
}

function canReact(
  threadID
) {
  const key =
    getThreadKey(
      threadID
    );

  const current =
    now();

  const previous =
    lastReaction[key] || 0;

  if (
    current -
      previous <
    REACTION_COOLDOWN
  ) {
    return false;
  }

  lastReaction[key] =
    current;

  return true;
          }function getTarget(
  data,
  threadID
) {
  if (
    !data ||
    !data.target
  ) {
    return null;
  }

  return (
    data.target[
      getThreadKey(
        threadID
      )
    ] || null
  );
}

function setTarget(
  data,
  threadID,
  userID
) {
  if (
    !data.target ||
    typeof data.target !==
      "object"
  ) {
    data.target = {};
  }

  data.target[
    getThreadKey(
      threadID
    )
  ] = String(
    userID
  );

  saveData(
    data
  );
}

function removeTarget(
  data,
  threadID
) {
  if (
    data.target &&
    data.target[
      getThreadKey(
        threadID
      )
    ]
  ) {
    delete data.target[
      getThreadKey(
        threadID
      )
    ];
  }

  saveData(
    data
  );
}

function isTarget(
  data,
  threadID,
  senderID
) {
  const target =
    getTarget(
      data,
      threadID
    );

  if (!target) {
    return true;
  }

  return (
    String(target) ===
    String(senderID)
  );
}

async function applyGroupName(
  api,
  threadID,
  data
) {
  if (
    !data ||
    !data.active
  ) {
    return false;
  }

  const wanted =
    getGCName();

  const key =
    getThreadKey(
      threadID
    );

  if (
    isCooldown(
      gcNameRestoreLock,
      key,
      GCNAME_RESTORE_COOLDOWN
    )
  ) {
    return false;
  }

  try {
    const info =
      await getThreadInfo(
        api,
        threadID
      );

    if (!info) {
      return false;
    }

    const current =
      normalizeName(
        info.threadName
      );

    /*
     * Already correct.
     * No API call and no message.
     */
    if (
      current ===
      normalizeName(
        wanted
      )
    ) {
      return true;
    }

    const success =
      await safeTitle(
        api,
        wanted,
        threadID
      );

    if (success) {
      data.gcNameRestores =
        Number(
          data.gcNameRestores ||
            0
        ) + 1;

      saveData(
        data
      );

      return true;
    }

  } catch (error) {
    console.error(
      "[RYUK] GC name apply error:",
      error.message ||
        error
    );
  }

  return false;
}

async function applyNickname(
  api,
  threadID,
  userID,
  data
) {
  if (
    !data ||
    !data.active
  ) {
    return false;
  }

  if (!userID) {
    return false;
  }

  const key =
    `${threadID}:${userID}`;

  if (
    isCooldown(
      nicknameRestoreLock,
      key,
      NICKNAME_RESTORE_COOLDOWN
    )
  ) {
    return false;
  }

  try {
    const wanted =
      getNickname();

    const success =
      await safeNickname(
        api,
        wanted,
        threadID,
        String(userID)
      );

    if (success) {
      data.nicknameCount =
        Number(
          data.nicknameCount ||
            0
        ) + 1;

      saveData(
        data
      );

      return true;
    }

  } catch (error) {
    console.error(
      "[RYUK] Nickname apply error:",
      error.message ||
        error
    );
  }

  return false;
    }async function setAllNicknames(
  api,
  threadID,
  nickname,
  data
) {
  const info =
    await getThreadInfo(
      api,
      threadID
    );

  if (!info) {
    return {
      total: 0,
      success: 0,
      failed: 0
    };
  }

  const participantIDs =
    Array.isArray(
      info.participantIDs
    )
      ? info.participantIDs
      : [];

  const uniqueIDs = [
    ...new Set(
      participantIDs.map(
        id =>
          String(id)
      )
    )
  ];

  let success = 0;
  let failed = 0;

  for (
    const userID
    of uniqueIDs
  ) {
    try {
      const result =
        await safeNickname(
          api,
          nickname,
          threadID,
          userID
        );

      if (result) {
        success++;

        data.nicknameCount =
          Number(
            data.nicknameCount ||
              0
          ) + 1;
      } else {
        failed++;
      }

    } catch (error) {
      failed++;

      console.error(
        "[RYUK] Setnick error:",
        error.message ||
          error
      );
    }

    /*
     * Small controlled delay between
     * nickname changes.
     */
    await wait(
      NICKNAME_DELAY
    );
  }

  saveData(
    data
  );

  return {
    total:
      uniqueIDs.length,
    success,
    failed
  };
}

async function setNicknameForUser(
  api,
  threadID,
  userID,
  data
) {
  if (
    !userID
  ) {
    return false;
  }

  const nickname =
    getNickname();

  return await applyNickname(
    api,
    threadID,
    userID,
    data
  );
}

async function setNicknameForNewMembers(
  api,
  event,
  data
) {
  if (
    !data ||
    !data.active ||
    !data.nicknameLock
  ) {
    return;
  }

  if (
    event.logMessageType !==
    "log:subscribe"
  ) {
    return;
  }

  const logData =
    event.logMessageData ||
    {};

  const added =
    Array.isArray(
      logData.addedParticipants
    )
      ? logData.addedParticipants
      : [];

  if (
    added.length === 0
  ) {
    return;
  }

  for (
    const participant
    of added
  ) {
    if (
      !participant
    ) {
      continue;
    }

    const userID =
      participant.userFbId ||
      participant.userId ||
      participant.id;

    if (
      !userID
    ) {
      continue;
    }

    await wait(
      RESTORE_DELAY
    );

    await setNicknameForUser(
      api,
      event.threadID,
      String(userID),
      data
    );
  }
}

async function setCurrentGroupName(
  api,
  threadID,
  data
) {
  if (
    !data ||
    !data.active ||
    !data.gcNameLock
  ) {
    return false;
  }

  return await applyGroupName(
    api,
    threadID,
    data
  );
      }async function handleNicknameEvent(
  api,
  event,
  data
) {
  if (
    !data ||
    !data.active ||
    !data.nicknameLock
  ) {
    return false;
  }

  if (
    event.logMessageType !==
    "log:user-nickname"
  ) {
    return false;
  }

  const threadID =
    event.threadID;

  if (!threadID) {
    return true;
  }

  const logData =
    event.logMessageData ||
    {};

  const userID =
    logData.participant_id ||
    logData.user_id;

  if (!userID) {
    return true;
  }

  const currentNickname =
    normalizeName(
      logData.nickname
    );

  const wantedNickname =
    normalizeName(
      getNickname()
    );

  /*
   * Already correct.
   * Do nothing.
   */
  if (
    currentNickname ===
    wantedNickname
  ) {
    return true;
  }

  await wait(
    RESTORE_DELAY
  );

  await setNicknameForUser(
    api,
    threadID,
    String(userID),
    data
  );

  return true;
}

async function handleGCNameEvent(
  api,
  event,
  data
) {
  if (
    !data ||
    !data.active ||
    !data.gcNameLock
  ) {
    return false;
  }

  if (
    event.logMessageType !==
    "log:thread-name"
  ) {
    return false;
  }

  const threadID =
    event.threadID;

  if (!threadID) {
    return true;
  }

  const logData =
    event.logMessageData ||
    {};

  const changedName =
    normalizeName(
      logData.name
    );

  const wantedName =
    normalizeName(
      getGCName()
    );

  /*
   * Messenger may emit the event
   * more than once. Ignore events
   * that already contain the correct name.
   */
  if (
    changedName ===
    wantedName
  ) {
    return true;
  }

  await wait(
    RESTORE_DELAY
  );

  /*
   * applyGroupName() checks the
   * actual thread name again before
   * calling setTitle().
   */
  await setCurrentGroupName(
    api,
    threadID,
    data
  );

  return true;
}

async function handleLockEvents(
  api,
  event,
  data
) {
  if (
    !event ||
    !event.logMessageType
  ) {
    return false;
  }

  const nicknameHandled =
    await handleNicknameEvent(
      api,
      event,
      data
    );

  if (
    nicknameHandled
  ) {
    return true;
  }

  const groupNameHandled =
    await handleGCNameEvent(
      api,
      event,
      data
    );

  if (
    groupNameHandled
  ) {
    return true;
  }

  return false;
      }function getCommandParts(
  input
) {
  if (
    typeof input !==
    "string"
  ) {
    return [];
  }

  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function getCommandName(
  input
) {
  const parts =
    getCommandParts(
      input
    );

  if (
    parts.length === 0
  ) {
    return "";
  }

  return String(
    parts[0]
  )
    .toLowerCase()
    .replace(
      /^[/!]/,
      ""
    );
}

function getCommandArgs(
  input
) {
  const parts =
    getCommandParts(
      input
    );

  if (
    parts.length <= 1
  ) {
    return [];
  }

  return parts
    .slice(1)
    .map(
      item =>
        String(
          item
        ).trim()
    )
    .filter(Boolean);
}

function isRyukCommand(
  input
) {
  return (
    getCommandName(
      input
    ) === "ryuk"
  );
}

function getReplyTarget(
  event
) {
  if (
    !event
  ) {
    return null;
  }

  if (
    event.messageReply &&
    event.messageReply.senderID
  ) {
    return String(
      event.messageReply.senderID
    );
  }

  return null;
}

function getSenderID(
  event
) {
  if (
    !event
  ) {
    return "";
  }

  return String(
    event.senderID ||
      ""
  );
}

function getThreadID(
  event
) {
  if (
    !event
  ) {
    return "";
  }

  return String(
    event.threadID ||
      ""
  );
}

function isCommandMessage(
  event
) {
  const body =
    event &&
    typeof event.body ===
      "string"
      ? event.body.trim()
      : "";

  return (
    body.startsWith(
      "/ryuk"
    ) ||
    body.startsWith(
      "!ryuk"
    )
  );
}

function getCommandUsage() {
  return [
    "/ryuk on",
    "/ryuk off",
    "/ryuk status",
    "/ryuk lock",
    "/ryuk unlock",
    "/ryuk setnick",
    "/ryuk setgname",
    "/ryuk target <UID>",
    "/ryuk untarget",
    "/ryuk replyon",
    "/ryuk replyoff",
    "/ryuk reacton",
    "/ryuk reactoff",
    "/ryuk help"
  ];
}

function buildHelpText() {
  return [
    "🥷 RYUK COMMANDS",
    "",
    "/ryuk on",
    "/ryuk off",
    "/ryuk status",
    "/ryuk lock",
    "/ryuk unlock",
    "/ryuk setnick",
    "/ryuk setgname",
    "/ryuk target <UID>",
    "/ryuk untarget",
    "/ryuk replyon",
    "/ryuk replyoff",
    "/ryuk reacton",
    "/ryuk reactoff",
    "/ryuk help"
  ].join("\n");
}function getStatusText(
  data,
  threadID
) {
  const target =
    getTarget(
      data,
      threadID
    );

  const targetText =
    target
      ? String(target)
      : "WALA";

  return [
    "🥷 RYUK STATUS",
    "",
    `Bot: ${
      data.active
        ? "ON"
        : "OFF"
    }`,
    `Auto Reply: ${
      data.autoReply
        ? "ON"
        : "OFF"
    }`,
    `Auto React: ${
      data.autoReact
        ? "ON"
        : "OFF"
    }`,
    `Nickname Lock: ${
      data.nicknameLock
        ? "ON"
        : "OFF"
    }`,
    `GC Name Lock: ${
      data.gcNameLock
        ? "ON"
        : "OFF"
    }`,
    `Nickname: ${getNickname()}`,
    `GC Name: ${getGCName()}`,
    `Target: ${targetText}`,
    "",
    `Replies: ${
      Number(
        data.replyCount ||
          0
      )
    }`,
    `Reactions: ${
      Number(
        data.reactionCount ||
          0
      )
    }`,
    `Nicknames changed: ${
      Number(
        data.nicknameCount ||
          0
      )
    }`,
    `GC restores: ${
      Number(
        data.gcNameRestores ||
          0
      )
    }`,
    `Errors: ${
      Number(
        data.errorCount ||
          0
      )
    }`
  ].join("\n");
}

function normalizeCommandArg(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

function isOnArg(
  value
) {
  return (
    normalizeCommandArg(
      value
    ) === "on"
  );
}

function isOffArg(
  value
) {
  return (
    normalizeCommandArg(
      value
    ) === "off"
  );
}

function getUIDFromArgs(
  args
) {
  if (
    !Array.isArray(args) ||
    args.length === 0
  ) {
    return null;
  }

  const value =
    String(
      args[0] || ""
    ).trim();

  if (
    !value
  ) {
    return null;
  }

  /*
   * Accept only a numeric
   * Facebook user ID here.
   */
  if (
    !/^\d+$/.test(
      value
    )
  ) {
    return null;
  }

  return value;
}

function resetThreadCooldowns(
  threadID
) {
  const key =
    getThreadKey(
      threadID
    );

  delete lastReply[
    key
  ];

  delete lastReaction[
    key
  ];

  delete gcNameRestoreLock[
    key
  ];
}

function incrementError(
  data
) {
  data.errorCount =
    Number(
      data.errorCount ||
        0
    ) + 1;

  saveData(
    data
  );
}

function incrementReply(
  data
) {
  data.replyCount =
    Number(
      data.replyCount ||
        0
    ) + 1;
}

function incrementReaction(
  data
) {
  data.reactionCount =
    Number(
      data.reactionCount ||
        0
    ) + 1;
}

function isValidThread(
  event
) {
  return Boolean(
    event &&
    event.threadID
  );
}

function isValidMessage(
  event
) {
  return Boolean(
    event &&
    event.messageID
  );
}const handleGroupNameChange = async (api, event) => {
  const threadID = event.threadID;
  if (!threadID) return;

  const data = getThreadData(threadID);
  if (!data || !data.autoGname || !data.savedGname) return;

  if (restoreLock.has(threadID)) return;

  restoreLock.add(threadID);

  try {
    await sleep(1200);

    const threadInfo = await getThreadInfo(api, threadID);
    if (!threadInfo) return;

    const currentName = String(threadInfo.threadName || "").trim();
    const savedName = String(data.savedGname || "").trim();

    if (!savedName || currentName === savedName) return;

    await api.setTitle(savedName, threadID);

    data.lastGnameRestore = Date.now();
    data.gnameRestoreCount = Number(data.gnameRestoreCount || 0) + 1;

    saveData();
  } catch (error) {
    logError("GROUP_NAME_RESTORE", error);
  } finally {
    setTimeout(() => {
      restoreLock.delete(threadID);
    }, 3000);
  }
};

const handleNicknameChange = async (api, event) => {
  const threadID = event.threadID;
  if (!threadID) return;

  const data = getThreadData(threadID);
  if (!data || !data.autoNick || !data.savedNick) return;

  if (nicknameRestoreLock.has(threadID)) return;

  nicknameRestoreLock.add(threadID);

  try {
    await sleep(1200);

    const info = await getThreadInfo(api, threadID);
    if (!info || !Array.isArray(info.nicknames)) return;

    const savedNick = String(data.savedNick || "").trim();
    if (!savedNick) return;

    let changed = false;

    for (const member of info.nicknames) {
      if (!member || !member.id) continue;

      const currentNick = member.nickname || "";

      if (currentNick === savedNick) continue;

      try {
        await api.changeNickname(
          savedNick,
          threadID,
          member.id
        );

        changed = true;
        await sleep(500);
      } catch (error) {
        logError(
          "NICKNAME_RESTORE_" + member.id,
          error
        );
      }
    }

    if (changed) {
      data.lastNickRestore = Date.now();
      data.nickRestoreCount =
        Number(data.nickRestoreCount || 0) + 1;

      saveData();
    }
  } catch (error) {
    logError("NICKNAME_RESTORE", error);
  } finally {
    setTimeout(() => {
      nicknameRestoreLock.delete(threadID);
    }, 3000);
  }
};

const processGroupChange = async (api, event) => {
  if (!event || !event.threadID) return;

  const type = event.logMessageType;

  if (type === "log:thread-name") {
    await handleGroupNameChange(api, event);
    return;
  }

  if (type === "changeNickname") {
    await handleNicknameChange(api, event);
    return;
  }

  if (type === "log:subscribe") {
    const added = event.logMessageData &&
      event.logMessageData.addedParticipants;

    if (Array.isArray(added) && added.length > 0) {
      return;
    }
  }
};

const restoreSavedSettings = async (api, threadID) => {
  if (!threadID) return;

  const data = getThreadData(threadID);
  if (!data) return;

  if (data.autoGname && data.savedGname) {
    await handleGroupNameChange(api, {
      threadID,
      logMessageType: "log:thread-name"
    });
  }

  if (data.autoNick && data.savedNick) {
    await handleNicknameChange(api, {
      threadID,
      logMessageType: "changeNickname"
    });
  }
};

const cleanupThreadLocks = () => {
  const now = Date.now();

  for (const [threadID, timestamp] of processing.entries()) {
    if (now - timestamp > 30000) {
      processing.delete(threadID);
    }
  }

  for (const [threadID, timestamp] of restoreCooldown.entries()) {
    if (now - timestamp > 10000) {
      restoreCooldown.delete(threadID);
    }
  }
};

const cleanupInterval = setInterval(
  cleanupThreadLocks,
  15000
);

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

module.exports.handleEvent = async function({
  api,
  event
}) {
  try {
    if (!event || !event.threadID) return;

    const threadID = event.threadID;

    if (event.logMessageType === "log:thread-name") {
      await processGroupChange(api, event);
      return;
    }

    if (event.logMessageType === "changeNickname") {
      await processGroupChange(api, event);
      return;
    }

    if (
      event.logMessageType === "log:subscribe" &&
      event.logMessageData
    ) {
      const added =
        event.logMessageData.addedParticipants;

      if (Array.isArray(added) && added.length) {
        return;
      }
    }
  } catch (error) {
    logError("HANDLE_EVENT", error);
  }
};

module.exports.run = async function({
  api,
  event,
  args
}) {
  try {
    if (!event || !event.threadID) return;

    const threadID = event.threadID;
    const senderID = event.senderID;

    const data = getThreadData(threadID);

    if (!data) {
      return send(
        api,
        threadID,
        "RYUK settings are not available."
      );
    }

    const command =
      Array.isArray(args) && args[0]
        ? String(args[0]).toLowerCase()
        : "help";

    if (command === "help") {
      return send(
        api,
        threadID,
        [
          "RYUK COMMANDS",
          "",
          "/ryuk on",
          "/ryuk off",
          "/ryuk status",
          "/ryuk reacton",
          "/ryuk reactoff",
          "/ryuk lock",
          "/ryuk help"
        ].join("\n")
      );
    }

    if (!isAdmin(senderID)) {
      return send(
        api,
        threadID,
        "Admin only."
      );
    }

    if (command === "on") {
      data.active = true;
      saveData();

      return send(
        api,
        threadID,
        "RYUK is now ON."
      );
    }

    if (command === "off") {
      data.active = false;
      saveData();

      return send(
        api,
        threadID,
        "RYUK is now OFF."
      );
    }

    if (command === "reacton") {
      data.autoReact = true;
      saveData();

      return send(
        api,
        threadID,
        "Auto reaction is ON."
      );
    }

    if (command === "reactoff") {
      data.autoReact = false;
      saveData();

      return send(
        api,
        threadID,
        "Auto reaction is OFF."
      );
    }

    if (command === "status") {
      return send(
        api,
        threadID,
        [
          "RYUK STATUS",
          "",
          "Active: " + (data.active ? "ON" : "OFF"),
          "Auto React: " +
            (data.autoReact ? "ON" : "OFF"),
          "Auto Nick: " +
            (data.autoNick ? "ON" : "OFF"),
          "Auto GC Name: " +
            (data.autoGname ? "ON" : "OFF"),
          "Saved Nick: " +
            (data.savedNick || "None"),
          "Saved GC Name: " +
            (data.savedGname || "None"),
          "Replies: " +
            Number(data.totalReplies || 0)
        ].join("\n")
      );
    }

    if (command === "lock") {
      data.locked = !data.locked;
      saveData();

      return send(
        api,
        threadID,
        "RYUK lock: " +
          (data.locked ? "ON" : "OFF")
      );
    }
  } catch (error) {
    logError("RUN_COMMAND", error);
  }
};const getThreadDataSafe = (threadID) => {
  if (!threadID) return null;

  try {
    if (!global.ryukData) {
      global.ryukData = {};
    }

    if (!global.ryukData[threadID]) {
      global.ryukData[threadID] = {
        active: true,
        autoReact: true,
        autoNick: false,
        autoGname: false,
        savedNick: "",
        savedGname: "",
        locked: false,
        totalReplies: 0,
        commandCount: 0,
        nickRestoreCount: 0,
        gnameRestoreCount: 0,
        lastNickRestore: 0,
        lastGnameRestore: 0,
        createdAt: Date.now()
      };
    }

    return global.ryukData[threadID];
  } catch (error) {
    logError("GET_THREAD_DATA_SAFE", error);
    return null;
  }
};

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value)
    .replace(/\s+/g, " ")
    .trim();
};

const isSameText = (a, b) => {
  return normalizeText(a) === normalizeText(b);
};

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
};

const updateThreadCounter = (
  threadID,
  field,
  amount = 1
) => {
  try {
    const data = getThreadDataSafe(threadID);

    if (!data) return;

    data[field] =
      safeNumber(data[field], 0) + amount;

    data.updatedAt = Date.now();

    saveData();
  } catch (error) {
    logError(
      "UPDATE_COUNTER_" + field,
      error
    );
  }
};

const canProcessThread = (threadID) => {
  if (!threadID) return false;

  const data = getThreadDataSafe(threadID);

  if (!data) return false;

  if (data.locked) return false;

  return true;
};

const markThreadProcessing = (threadID) => {
  if (!threadID) return;

  processing.set(
    threadID,
    Date.now()
  );
};

const unmarkThreadProcessing = (threadID) => {
  if (!threadID) return;

  processing.delete(threadID);
};

const isThreadProcessing = (threadID) => {
  if (!threadID) return false;

  const started = processing.get(threadID);

  if (!started) return false;

  if (Date.now() - started > 30000) {
    processing.delete(threadID);
    return false;
  }

  return true;
};

const canRestoreNow = (
  threadID,
  type
) => {
  if (!threadID) return false;

  const key =
    String(type || "default") +
    ":" +
    threadID;

  const last =
    restoreCooldown.get(key) || 0;

  const cooldown = 5000;

  if (Date.now() - last < cooldown) {
    return false;
  }

  restoreCooldown.set(
    key,
    Date.now()
  );

  return true;
};

const clearRestoreCooldown = (
  threadID,
  type
) => {
  if (!threadID) return;

  const key =
    String(type || "default") +
    ":" +
    threadID;

  restoreCooldown.delete(key);
};

const safeGetThreadInfo = async (
  api,
  threadID
) => {
  if (!api || !threadID) {
    return null;
  }

  try {
    if (
      typeof api.getThreadInfo !==
      "function"
    ) {
      return null;
    }

    return await api.getThreadInfo(
      threadID
    );
  } catch (error) {
    logError(
      "GET_THREAD_INFO",
      error
    );

    return null;
  }
};

const safeSetTitle = async (
  api,
  threadID,
  title
) => {
  if (!api || !threadID) {
    return false;
  }

  const cleanTitle =
    normalizeText(title);

  if (!cleanTitle) {
    return false;
  }

  try {
    if (
      typeof api.setTitle !==
      "function"
    ) {
      return false;
    }

    await api.setTitle(
      cleanTitle,
      threadID
    );

    return true;
  } catch (error) {
    logError(
      "SET_TITLE",
      error
    );

    return false;
  }
};

const safeChangeNickname = async (
  api,
  nickname,
  threadID,
  userID
) => {
  if (
    !api ||
    !threadID ||
    !userID
  ) {
    return false;
  }

  const cleanNick =
    normalizeText(nickname);

  if (!cleanNick) {
    return false;
  }

  try {
    if (
      typeof api.changeNickname !==
      "function"
    ) {
      return false;
    }

    await api.changeNickname(
      cleanNick,
      threadID,
      userID
    );

    return true;
  } catch (error) {
    logError(
      "CHANGE_NICKNAME_" + userID,
      error
    );

    return false;
  }
};

const getNicknameList = (
  threadInfo
) => {
  if (!threadInfo) {
    return [];
  }

  if (
    Array.isArray(
      threadInfo.nicknames
    )
  ) {
    return threadInfo.nicknames;
  }

  if (
    threadInfo.nicknames &&
    typeof threadInfo.nicknames ===
      "object"
  ) {
    return Object.keys(
      threadInfo.nicknames
    ).map((id) => ({
      id,
      nickname:
        threadInfo.nicknames[id]
    }));
  }

  return [];
};

const restoreGroupNameOnce = async (
  api,
  threadID
) => {
  const data =
    getThreadDataSafe(threadID);

  if (
    !data ||
    !data.autoGname ||
    !data.savedGname
  ) {
    return false;
  }

  if (
    !canRestoreNow(
      threadID,
      "gname"
    )
  ) {
    return false;
  }

  try {
    const info =
      await safeGetThreadInfo(
        api,
        threadID
      );

    if (!info) {
      clearRestoreCooldown(
        threadID,
        "gname"
      );
      return false;
    }

    const currentName =
      normalizeText(
        info.threadName
      );

    const savedName =
      normalizeText(
        data.savedGname
      );

    if (
      !savedName ||
      isSameText(
        currentName,
        savedName
      )
    ) {
      clearRestoreCooldown(
        threadID,
        "gname"
      );
      return false;
    }

    const success =
      await safeSetTitle(
        api,
        threadID,
        savedName
      );

    if (success) {
      data.lastGnameRestore =
        Date.now();

      data.gnameRestoreCount =
        safeNumber(
          data.gnameRestoreCount,
          0
        ) + 1;

      data.updatedAt =
        Date.now();

      saveData();

      return true;
    }

    clearRestoreCooldown(
      threadID,
      "gname"
    );

    return false;
  } catch (error) {
    clearRestoreCooldown(
      threadID,
      "gname"
    );

    logError(
      "RESTORE_GROUP_NAME_ONCE",
      error
    );

    return false;
  }
};

const restoreNicknameOnce = async (
  api,
  threadID
) => {
  const data =
    getThreadDataSafe(threadID);

  if (
    !data ||
    !data.autoNick ||
    !data.savedNick
  ) {
    return false;
  }

  if (
    !canRestoreNow(
      threadID,
      "nickname"
    )
  ) {
    return false;
  }

  try {
    const info =
      await safeGetThreadInfo(
        api,
        threadID
      );

    if (!info) {
      clearRestoreCooldown(
        threadID,
        "nickname"
      );
      return false;
    }

    const members =
      getNicknameList(info);

    const savedNick =
      normalizeText(
        data.savedNick
      );

    if (
      !savedNick ||
      !members.length
    ) {
      clearRestoreCooldown(
        threadID,
        "nickname"
      );
      return false;
    }

    let changed = false;

    for (
      const member of members
    ) {
      if (
        !member ||
        !member.id
      ) {
        continue;
      }

      const currentNick =
        normalizeText(
          member.nickname
        );

      if (
        isSameText(
          currentNick,
          savedNick
        )
      ) {
        continue;
      }

      const success =
        await safeChangeNickname(
          api,
          savedNick,
          threadID,
          member.id
        );

      if (success) {
        changed = true;
        await sleep(600);
      }
    }

    if (changed) {
      data.lastNickRestore =
        Date.now();

      data.nickRestoreCount =
        safeNumber(
          data.nickRestoreCount,
          0
        ) + 1;

      data.updatedAt =
        Date.now();

      saveData();

      return true;
    }

    clearRestoreCooldown(
      threadID,
      "nickname"
    );

    return false;
  } catch (error) {
    clearRestoreCooldown(
      threadID,
      "nickname"
    );

    logError(
      "RESTORE_NICKNAME_ONCE",
      error
    );

    return false;
  }
};const handleMessageEvent = async (
  api,
  event
) => {
  if (!api || !event) return;

  const threadID = event.threadID;
  if (!threadID) return;

  const data =
    getThreadDataSafe(threadID);

  if (!data) return;

  if (!data.active) return;

  if (!canProcessThread(threadID)) {
    return;
  }

  const body =
    typeof event.body === "string"
      ? event.body.trim()
      : "";

  if (!body) return;

  if (
    body.length > 5000
  ) {
    return;
  }

  const senderID =
    event.senderID || null;

  if (!senderID) return;

  if (
    isThreadProcessing(threadID)
  ) {
    return;
  }

  markThreadProcessing(threadID);

  try {
    updateThreadCounter(
      threadID,
      "commandCount",
      1
    );

    const prefix =
      module.exports.config
        .usePrefix
        ? module.exports.config
            .prefix || "/"
        : "";

    const cleanBody =
      body.startsWith(prefix)
        ? body.slice(prefix.length).trim()
        : body;

    if (!cleanBody) {
      return;
    }

    const parts =
      cleanBody.split(/\s+/);

    const command =
      String(
        parts.shift() || ""
      ).toLowerCase();

    const args = parts;

    if (
      command !==
      module.exports.config.name
    ) {
      return;
    }

    await processRyukCommand(
      api,
      event,
      args
    );
  } catch (error) {
    logError(
      "HANDLE_MESSAGE_EVENT",
      error
    );
  } finally {
    unmarkThreadProcessing(
      threadID
    );
  }
};

const processRyukCommand = async (
  api,
  event,
  args
) => {
  const threadID =
    event.threadID;

  const senderID =
    event.senderID;

  const data =
    getThreadDataSafe(
      threadID
    );

  if (!data) return;

  const command =
    String(
      args[0] || "help"
    ).toLowerCase();

  const value =
    args
      .slice(1)
      .join(" ")
      .trim();

  if (
    command === "help" ||
    command === "h"
  ) {
    await send(
      api,
      threadID,
      [
        "💀 RYUK COMMANDS",
        "",
        "/ryuk on",
        "/ryuk off",
        "/ryuk status",
        "/ryuk reacton",
        "/ryuk reactoff",
        "/ryuk nick on",
        "/ryuk nick off",
        "/ryuk nick <name>",
        "/ryuk gname on",
        "/ryuk gname off",
        "/ryuk gname <name>",
        "/ryuk lock",
        "/ryuk unlock"
      ].join("\n")
    );

    return;
  }

  if (
    !isAdmin(senderID)
  ) {
    await send(
      api,
      threadID,
      "❌ Admin only ang command na ito."
    );

    return;
  }

  if (command === "on") {
    data.active = true;
    data.updatedAt = Date.now();

    saveData();

    await send(
      api,
      threadID,
      "💀 RYUK is now ON."
    );

    return;
  }

  if (command === "off") {
    data.active = false;
    data.updatedAt = Date.now();

    saveData();

    await send(
      api,
      threadID,
      "💀 RYUK is now OFF."
    );

    return;
  }

  if (command === "status") {
    await send(
      api,
      threadID,
      [
        "💀 RYUK STATUS",
        "",
        "Active: " +
          (data.active
            ? "ON"
            : "OFF"),
        "Auto React: " +
          (data.autoReact
            ? "ON"
            : "OFF"),
        "Auto Nick: " +
          (data.autoNick
            ? "ON"
            : "OFF"),
        "Auto GC Name: " +
          (data.autoGname
            ? "ON"
            : "OFF"),
        "Saved Nick: " +
          (data.savedNick ||
            "None"),
        "Saved GC Name: " +
          (data.savedGname ||
            "None"),
        "Replies: " +
          safeNumber(
            data.totalReplies,
            0
          ),
        "Commands: " +
          safeNumber(
            data.commandCount,
            0
          )
      ].join("\n")
    );

    return;
  }

  if (
    command === "reacton" ||
    command === "react"
  ) {
    data.autoReact = true;
    data.updatedAt = Date.now();

    saveData();

    await send(
      api,
      threadID,
      "🔥 Auto reaction ON."
    );

    return;
  }

  if (
    command === "reactoff"
  ) {
    data.autoReact = false;
    data.updatedAt = Date.now();

    saveData();

    await send(
      api,
      threadID,
      "Auto reaction OFF."
    );

    return;
  }

  if (
    command === "nick"
  ) {
    const sub =
      String(
        args[1] || ""
      ).toLowerCase();

    if (sub === "on") {
      data.autoNick = true;

      if (value) {
        data.savedNick =
          value;
      }

      data.updatedAt =
        Date.now();

      saveData();

      await send(
        api,
        threadID,
        data.savedNick
          ? "Nickname protection ON: " +
              data.savedNick
          : "Nickname protection ON."
      );

      return;
    }

    if (sub === "off") {
      data.autoNick = false;
      data.updatedAt = Date.now();

      saveData();

      await send(
        api,
        threadID,
        "Nickname protection OFF."
      );

      return;
    }

    if (
      args.length >= 2 &&
      sub !== "on" &&
      sub !== "off"
    ) {
      data.savedNick =
        args
          .slice(1)
          .join(" ")
          .trim();

      data.autoNick = true;
      data.updatedAt = Date.now();

      saveData();

      await send(
        api,
        threadID,
        "Nickname saved: " +
          data.savedNick
      );

      return;
    }

    await send(
      api,
      threadID,
      [
        "Usage:",
        "/ryuk nick on",
        "/ryuk nick off",
        "/ryuk nick <name>"
      ].join("\n")
    );

    return;
  }

  if (
    command === "gname"
  ) {
    const sub =
      String(
        args[1] || ""
      ).toLowerCase();

    if (sub === "on") {
      data.autoGname = true;

      if (args.length >= 3) {
        data.savedGname =
          args
            .slice(2)
            .join(" ")
            .trim();
      }

      data.updatedAt =
        Date.now();

      saveData();

      await send(
        api,
        threadID,
        data.savedGname
          ? "GC name protection ON: " +
              data.savedGname
          : "GC name protection ON."
      );

      return;
    }

    if (sub === "off") {
      data.autoGname = false;
      data.updatedAt = Date.now();

      saveData();

      await send(
        api,
        threadID,
        "GC name protection OFF."
      );

      return;
    }

    if (
      args.length >= 2 &&
      sub !== "on" &&
      sub !== "off"
    ) {
      data.savedGname =
        args
          .slice(1)
          .join(" ")
          .trim();

      data.autoGname = true;
      data.updatedAt = Date.now();

      saveData();

      await send(
        api,
        threadID,
        "GC name saved: " +
          data.savedGname
      );

      return;
    }

    await send(
      api,
      threadID,
      [
        "Usage:",
        "/ryuk gname on <name>",
        "/ryuk gname off",
        "/ryuk gname <name>"
      ].join("\n")
    );

    return;
  }

  if (
    command === "lock"
  ) {
    data.locked = true;
    data.updatedAt = Date.now();

    saveData();

    await send(
      api,
      threadID,
      "🔒 RYUK lock ON."
    );

    return;
  }

  if (
    command === "unlock"
  ) {
    data.locked = false;
    data.updatedAt = Date.now();

    saveData();

    await send(
      api,
      threadID,
      "🔓 RYUK lock OFF."
    );

    return;
  }

  await send(
    api,
    threadID,
    "❌ Unknown command. Use /ryuk help"
  );
};

module.exports.handleMessageEvent =
  handleMessageEvent;const safeSendMessage = async (
  api,
  threadID,
  message
) => {
  if (!api || !threadID) {
    return false;
  }

  const textMessage =
    typeof message === "string"
      ? message.trim()
      : "";

  if (!textMessage) {
    return false;
  }

  try {
    if (
      typeof api.sendMessage !==
      "function"
    ) {
      return false;
    }

    await api.sendMessage(
      textMessage,
      threadID
    );

    return true;
  } catch (error) {
    logError(
      "SAFE_SEND_MESSAGE",
      error
    );

    return false;
  }
};

const safeReact = async (
  api,
  messageID,
  reaction
) => {
  if (
    !api ||
    !messageID ||
    !reaction
  ) {
    return false;
  }

  try {
    if (
      typeof api.setMessageReaction !==
      "function"
    ) {
      return false;
    }

    await api.setMessageReaction(
      reaction,
      messageID,
      true
    );

    return true;
  } catch (error) {
    logError(
      "SAFE_REACTION",
      error
    );

    return false;
  }
};

const shouldReact = (
  data,
  event
) => {
  if (!data) return false;

  if (!data.active) {
    return false;
  }

  if (!data.autoReact) {
    return false;
  }

  if (
    !event ||
    !event.messageID
  ) {
    return false;
  }

  if (
    event.isGroup === false
  ) {
    return false;
  }

  return true;
};

const getRandomItem = (
  array
) => {
  if (
    !Array.isArray(array) ||
    array.length === 0
  ) {
    return null;
  }

  const index =
    Math.floor(
      Math.random() *
        array.length
    );

  return array[index];
};

const RYUK_REACTIONS = [
  "💀",
  "👁️",
  "🔥",
  "🤣",
  "😈",
  "🤡"
];

const getReactionForEvent = (
  event
) => {
  const body =
    typeof event.body === "string"
      ? event.body.toLowerCase()
      : "";

  if (
    body.includes("haha") ||
    body.includes("lol") ||
    body.includes("😂")
  ) {
    return "🤣";
  }

  if (
    body.includes("ryuk") ||
    body.includes("ryu")
  ) {
    return "💀";
  }

  if (
    body.includes("pogi") ||
    body.includes("astig")
  ) {
    return "🔥";
  }

  return getRandomItem(
    RYUK_REACTIONS
  );
};

const reactionCooldowns =
  new Map();

const canReactToThread = (
  threadID
) => {
  if (!threadID) {
    return false;
  }

  const now =
    Date.now();

  const last =
    reactionCooldowns.get(
      threadID
    ) || 0;

  const cooldown = 2500;

  if (
    now - last <
    cooldown
  ) {
    return false;
  }

  reactionCooldowns.set(
    threadID,
    now
  );

  return true;
};

const processAutoReaction = async (
  api,
  event
) => {
  if (!api || !event) {
    return;
  }

  const threadID =
    event.threadID;

  if (!threadID) {
    return;
  }

  const data =
    getThreadDataSafe(
      threadID
    );

  if (
    !shouldReact(
      data,
      event
    )
  ) {
    return;
  }

  if (
    !canReactToThread(
      threadID
    )
  ) {
    return;
  }

  const reaction =
    getReactionForEvent(
      event
    );

  if (!reaction) {
    return;
  }

  await sleep(350);

  const success =
    await safeReact(
      api,
      event.messageID,
      reaction
    );

  if (!success) {
    reactionCooldowns.delete(
      threadID
    );
  }
};

const AUTO_REPLY_COOLDOWN =
  new Map();

const canAutoReply = (
  threadID
) => {
  if (!threadID) {
    return false;
  }

  const now =
    Date.now();

  const last =
    AUTO_REPLY_COOLDOWN.get(
      threadID
    ) || 0;

  const cooldown = 5000;

  if (
    now - last <
    cooldown
  ) {
    return false;
  }

  AUTO_REPLY_COOLDOWN.set(
    threadID,
    now
  );

  return true;
};

const AUTO_REPLIES = [
  "👁️ RYUK: Nakita ko yan.",
  "💀 RYUK: Tahimik lang ako.",
  "😈 RYUK: Alam ko na yan.",
  "🔥 RYUK: Noted.",
  "🤣 RYUK: Grabe naman yan.",
  "👁️ RYUK: Continue.",
  "💀 RYUK: Nandito lang ako."
];

const processAutoReply = async (
  api,
  event
) => {
  if (!api || !event) {
    return;
  }

  const threadID =
    event.threadID;

  if (!threadID) {
    return;
  }

  const data =
    getThreadDataSafe(
      threadID
    );

  if (
    !data ||
    !data.active
  ) {
    return;
  }

  if (
    event.type &&
    event.type !==
      "message"
  ) {
    return;
  }

  if (
    !event.body ||
    typeof event.body !==
      "string"
  ) {
    return;
  }

  if (
    event.body.length >
    2000
  ) {
    return;
  }

  const body =
    event.body.trim();

  if (!body) {
    return;
  }

  const lower =
    body.toLowerCase();

  if (
    lower.startsWith(
      "/ryuk"
    )
  ) {
    return;
  }

  if (
    !lower.includes("ryuk")
  ) {
    return;
  }

  if (
    !canAutoReply(
      threadID
    )
  ) {
    return;
  }

  const reply =
    getRandomItem(
      AUTO_REPLIES
    );

  if (!reply) {
    return;
  }

  await sleep(
    safeNumber(
      data.delay,
      2000
    )
  );

  const sent =
    await safeSendMessage(
      api,
      threadID,
      reply
    );

  if (sent) {
    data.totalReplies =
      safeNumber(
        data.totalReplies,
        0
      ) + 1;

    data.updatedAt =
      Date.now();

    saveData();
  }
};

const cleanupReactionCooldowns =
  () => {
    const now =
      Date.now();

    for (
      const [
        threadID,
        timestamp
      ] of reactionCooldowns
    ) {
      if (
        now - timestamp >
        15000
      ) {
        reactionCooldowns.delete(
          threadID
        );
      }
    }

    for (
      const [
        threadID,
        timestamp
      ] of AUTO_REPLY_COOLDOWN
    ) {
      if (
        now - timestamp >
        20000
      ) {
        AUTO_REPLY_COOLDOWN.delete(
          threadID
        );
      }
    }
  };

const reactionCleanup =
  setInterval(
    cleanupReactionCooldowns,
    10000
  );

if (
  reactionCleanup &&
  typeof reactionCleanup.unref ===
    "function"
) {
  reactionCleanup.unref();
}

module.exports.processAutoReaction =
  processAutoReaction;

module.exports.processAutoReply =
  processAutoReply;const initializeRyuk = () => {
  try {
    if (!global.ryukData) {
      global.ryukData = {};
    }

    if (
      typeof loadData ===
      "function"
    ) {
      loadData();
    }

    if (
      typeof global.ryukData !==
      "object"
    ) {
      global.ryukData = {};
    }

    return true;
  } catch (error) {
    logError(
      "INITIALIZE_RYUK",
      error
    );

    return false;
  }
};

const ensureThreadData = (
  threadID
) => {
  if (!threadID) {
    return null;
  }

  if (!global.ryukData) {
    global.ryukData = {};
  }

  if (
    !global.ryukData[threadID]
  ) {
    global.ryukData[threadID] = {
      active: true,
      autoReact: true,
      autoNick: false,
      autoGname: false,
      savedNick: "",
      savedGname: "",
      locked: false,
      delay: 2000,
      totalReplies: 0,
      commandCount: 0,
      nickRestoreCount: 0,
      gnameRestoreCount: 0,
      lastNickRestore: 0,
      lastGnameRestore: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  return global.ryukData[
    threadID
  ];
};

const runEventPipeline = async (
  api,
  event
) => {
  if (!api || !event) {
    return;
  }

  const threadID =
    event.threadID;

  if (!threadID) {
    return;
  }

  const data =
    ensureThreadData(
      threadID
    );

  if (!data) {
    return;
  }

  try {
    if (
      event.logMessageType ===
      "log:thread-name"
    ) {
      if (
        data.autoGname &&
        data.savedGname
      ) {
        await sleep(1000);

        await restoreGroupNameOnce(
          api,
          threadID
        );
      }

      return;
    }

    if (
      event.logMessageType ===
      "changeNickname"
    ) {
      if (
        data.autoNick &&
        data.savedNick
      ) {
        await sleep(1000);

        await restoreNicknameOnce(
          api,
          threadID
        );
      }

      return;
    }

    if (
      event.type ===
      "message"
    ) {
      if (
        data.autoReact
      ) {
        await processAutoReaction(
          api,
          event
        );
      }

      if (
        data.active
      ) {
        await processAutoReply(
          api,
          event
        );
      }

      return;
    }
  } catch (error) {
    logError(
      "RUN_EVENT_PIPELINE",
      error
    );
  }
};

const startRyuk = () => {
  try {
    initializeRyuk();

    if (
      !global.ryukStarted
    ) {
      global.ryukStarted =
        true;
    }

    return true;
  } catch (error) {
    logError(
      "START_RYUK",
      error
    );

    return false;
  }
};

startRyuk();

module.exports.onStart =
  async function({
    api
  }) {
    try {
      if (!api) {
        return;
      }

      initializeRyuk();
    } catch (error) {
      logError(
        "ON_START",
        error
      );
    }
  };

module.exports.handleEvent =
  async function({
    api,
    event
  }) {
    try {
      await runEventPipeline(
        api,
        event
      );
    } catch (error) {
      logError(
        "HANDLE_EVENT_FINAL",
        error
      );
    }
  };

module.exports.run =
  async function({
    api,
    event,
    args
  }) {
    try {
      await processRyukCommand(
        api,
        event,
        Array.isArray(args)
          ? args
          : []
      );
    } catch (error) {
      logError(
        "RUN_FINAL",
        error
      );
    }
  };

module.exports.config = {
  name: "ryuk",
  version: "1.0.0",
  hasPermission: 0,
  credits: "RYUK",
  description:
    "Stable GC utility manager with protected group name, nickname, reactions and controlled auto replies.",
  usePrefix: true,
  commandCategory: "group",
  cooldowns: 3
};

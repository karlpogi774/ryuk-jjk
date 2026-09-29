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
}async function processAutoReply(
  api,
  event,
  data
) {
  if (
    !data ||
    !data.active ||
    !data.autoReply
  ) {
    return false;
  }

  if (
    !isValidThread(
      event
    )
  ) {
    return false;
  }

  if (
    !isValidMessage(
      event
    )
  ) {
    return false;
  }

  if (
    isCommandMessage(
      event
    )
  ) {
    return false;
  }

  const threadID =
    getThreadID(
      event
    );

  const senderID =
    getSenderID(
      event
    );

  /*
   * If a target is configured,
   * only that user receives
   * the automatic reply.
   */
  if (
    !isTarget(
      data,
      threadID,
      senderID
    )
  ) {
    return false;
  }

  if (
    !canReply(
      threadID
    )
  ) {
    return false;
  }

  try {
    const message =
      getAutoReply();

    const sent =
      await safeSend(
        api,
        message,
        threadID
      );

    if (sent) {
      incrementReply(
        data
      );

      saveData(
        data
      );

      return true;
    }

  } catch (error) {
    console.error(
      "[RYUK] Auto reply error:",
      error.message ||
        error
    );

    incrementError(
      data
    );
  }

  return false;
}

async function processAutoReaction(
  api,
  event,
  data
) {
  if (
    !data ||
    !data.active ||
    !data.autoReact
  ) {
    return false;
  }

  if (
    !isValidThread(
      event
    ) ||
    !isValidMessage(
      event
    )
  ) {
    return false;
  }

  if (
    isCommandMessage(
      event
    )
  ) {
    return false;
  }

  const threadID =
    getThreadID(
      event
    );

  const senderID =
    getSenderID(
      event
    );

  if (
    !isTarget(
      data,
      threadID,
      senderID
    )
  ) {
    return false;
  }

  if (
    !canReact(
      threadID
    )
  ) {
    return false;
  }

  try {
    const reaction =
      getAutoReaction();

    const success =
      await safeReaction(
        api,
        reaction,
        event.messageID
      );

    if (success) {
      incrementReaction(
        data
      );

      saveData(
        data
      );

      return true;
    }

  } catch (error) {
    console.error(
      "[RYUK] Auto reaction error:",
      error.message ||
        error
    );

    incrementError(
      data
    );
  }

  return false;
}

async function processMessageFeatures(
  api,
  event,
  data
) {
  if (
    !event ||
    !data
  ) {
    return;
  }

  /*
   * Run reply and reaction
   * independently so a failure
   * in one does not stop the other.
   */
  try {
    await processAutoReply(
      api,
      event,
      data
    );
  } catch (error) {
    console.error(
      "[RYUK] Reply process error:",
      error.message ||
        error
    );

    incrementError(
      data
    );
  }

  try {
    await processAutoReaction(
      api,
      event,
      data
    );
  } catch (error) {
    console.error(
      "[RYUK] Reaction process error:",
      error.message ||
        error
    );

    incrementError(
      data
    );
  }
    }async function handleCommand(
  api,
  event
) {
  if (
    !event ||
    !event.body
  ) {
    return false;
  }

  const body =
    String(
      event.body
    ).trim();

  if (
    !isRyukCommand(
      body
    )
  ) {
    return false;
  }

  const threadID =
    getThreadID(
      event
    );

  if (!threadID) {
    return true;
  }

  const args =
    getCommandArgs(
      body
    );

  const action =
    normalizeCommandArg(
      args[0]
    );

  const data =
    loadData();

  try {
    switch (
      action
    ) {

      case "on": {
        data.active = true;

        data.nicknameLock =
          true;

        data.gcNameLock =
          true;

        saveData(
          data
        );

        return true;
      }

      case "off": {
        data.active = false;

        saveData(
          data
        );

        return true;
      }

      case "status": {
        await safeSend(
          api,
          getStatusText(
            data,
            threadID
          ),
          threadID
        );

        return true;
      }

      case "help": {
        await safeSend(
          api,
          buildHelpText(),
          threadID
        );

        return true;
      }

      case "lock": {
        data.active =
          true;

        data.nicknameLock =
          true;

        data.gcNameLock =
          true;

        saveData(
          data
        );

        return true;
      }

      case "unlock": {
        data.nicknameLock =
          false;

        data.gcNameLock =
          false;

        saveData(
          data
        );

        return true;
      }

      case "replyon": {
        data.active =
          true;

        data.autoReply =
          true;

        saveData(
          data
        );

        return true;
      }

      case "replyoff": {
        data.autoReply =
          false;

        saveData(
          data
        );

        return true;
      }

      case "reacton": {
        data.active =
          true;

        data.autoReact =
          true;

        saveData(
          data
        );

        return true;
      }

      case "reactoff": {
        data.autoReact =
          false;

        saveData(
          data
        );

        return true;
      }

      default:
        return false;
    }

  } catch (error) {
    console.error(
      "[RYUK] Command error:",
      error.message ||
        error
    );

    incrementError(
      data
    );

    return true;
  }
}async function handleNicknameCommand(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(
      event
    );

  if (!threadID) {
    return true;
  }

  if (
    !data.active
  ) {
    return true;
  }

  data.nickname =
    TARGET_NICKNAME;

  data.nicknameLock =
    true;

  saveData(
    data
  );

  /*
   * Apply RYUK POGI to every
   * current member. No bot message
   * is sent after the command.
   */
  await setAllNicknames(
    api,
    threadID,
    TARGET_NICKNAME,
    data
  );

  return true;
}

async function handleGCNameCommand(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(
      event
    );

  if (!threadID) {
    return true;
  }

  if (
    !data.active
  ) {
    return true;
  }

  data.gcName =
    TARGET_GC_NAME;

  data.gcNameLock =
    true;

  saveData(
    data
  );

  /*
   * applyGroupName() first checks
   * the current GC name. If it is
   * already RYUK POGI, no setTitle()
   * call is made.
   */
  await setCurrentGroupName(
    api,
    threadID,
    data
  );

  return true;
}

async function handleTargetCommand(
  api,
  event,
  data,
  args
) {
  const threadID =
    getThreadID(
      event
    );

  if (!threadID) {
    return true;
  }

  const uid =
    getUIDFromArgs(
      args
    );

  /*
   * If no UID is supplied,
   * use the user whose message
   * was replied to.
   */
  const replyTarget =
    getReplyTarget(
      event
    );

  const targetID =
    uid ||
    replyTarget;

  if (!targetID) {
    await safeSend(
      api,
      "🥷 RYUK: Gamitin /ryuk target <UID> o reply sa message ng target.",
      threadID
    );

    return true;
  }

  setTarget(
    data,
    threadID,
    targetID
  );

  return true;
}

async function handleUntargetCommand(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(
      event
    );

  if (!threadID) {
    return true;
  }

  removeTarget(
    data,
    threadID
  );

  return true;
}async function handleAdvancedCommand(
  api,
  event,
  data,
  action,
  args
) {
  const threadID =
    getThreadID(
      event
    );

  if (!threadID) {
    return true;
  }

  switch (
    action
  ) {

    case "setnick":
      return await handleNicknameCommand(
        api,
        event,
        data
      );

    case "setgname":
      return await handleGCNameCommand(
        api,
        event,
        data
      );

    case "target":
      return await handleTargetCommand(
        api,
        event,
        data,
        args
      );

    case "untarget":
      return await handleUntargetCommand(
        api,
        event,
        data
      );

    default:
      return false;
  }
}

async function executeRyukCommand(
  api,
  event
) {
  if (
    !event ||
    !event.body
  ) {
    return false;
  }

  const body =
    String(
      event.body
    ).trim();

  if (
    !isRyukCommand(
      body
    )
  ) {
    return false;
  }

  const args =
    getCommandArgs(
      body
    );

  const action =
    normalizeCommandArg(
      args[0]
    );

  const advancedActions = [
    "setnick",
    "setgname",
    "target",
    "untarget"
  ];

  if (
    advancedActions.includes(
      action
    )
  ) {
    const data =
      loadData();

    try {
      return await handleAdvancedCommand(
        api,
        event,
        data,
        action,
        args.slice(1)
      );

    } catch (error) {
      console.error(
        "[RYUK] Advanced command error:",
        error.message ||
          error
      );

      incrementError(
        data
      );

      return true;
    }
  }

  return await handleCommand(
    api,
    event
  );
}

function shouldIgnoreEvent(
  event
) {
  if (
    !event
  ) {
    return true;
  }

  if (
    !event.threadID
  ) {
    return true;
  }

  return false;
}

function isOwnMessage(
  api,
  event
) {
  const botID =
    getCurrentBotID(
      api
    );

  if (
    !botID ||
    !event ||
    !event.senderID
  ) {
    return false;
  }

  return (
    String(
      botID
    ) ===
    String(
      event.senderID
    )
  );
}module.exports.handleEvent =
  async function (
    {
      api,
      event
    }
  ) {
    if (
      shouldIgnoreEvent(
        event
      )
    ) {
      return;
    }

    const data =
      loadData();

    try {
      /*
       * Handle nickname and GC-name
       * changes silently.
       */
      const lockHandled =
        await handleLockEvents(
          api,
          event,
          data
        );

      if (
        lockHandled
      ) {
        return;
      }

      /*
       * Handle newly added members.
       */
      if (
        event.logMessageType ===
        "log:subscribe"
      ) {
        await setNicknameForNewMembers(
          api,
          event,
          data
        );

        return;
      }

      /*
       * Ignore the bot's own messages
       * so it does not reply to itself.
       */
      if (
        isOwnMessage(
          api,
          event
        )
      ) {
        return;
      }

      /*
       * Normal message processing.
       */
      if (
        event.type ===
        "message"
      ) {
        if (
          isCommandMessage(
            event
          )
        ) {
          return;
        }

        await processMessageFeatures(
          api,
          event,
          data
        );
      }

    } catch (error) {
      console.error(
        "[RYUK] handleEvent error:",
        error.message ||
          error
      );

      incrementError(
        data
      );
    }
  };module.exports.run =
  async function ({
    api,
    event,
    args
  }) {
    const threadID =
      getThreadID(
        event
      );

    if (!threadID) {
      return;
    }

    const data =
      loadData();

    const action =
      normalizeCommandArg(
        args &&
        args[0]
      );

    try {
      switch (
        action
      ) {

        case "on": {
          data.active =
            true;

          data.autoReply =
            true;

          data.autoReact =
            true;

          data.nicknameLock =
            true;

          data.gcNameLock =
            true;

          data.nickname =
            TARGET_NICKNAME;

          data.gcName =
            TARGET_GC_NAME;

          saveData(
            data
          );

          /*
           * Apply the saved settings
           * silently when the command is
           * enabled.
           */
          await setCurrentGroupName(
            api,
            threadID,
            data
          );

          await setAllNicknames(
            api,
            threadID,
            TARGET_NICKNAME,
            data
          );

          return;
        }

        case "off": {
          data.active =
            false;

          saveData(
            data
          );

          resetThreadCooldowns(
            threadID
          );

          return;
        }

        case "status": {
          await safeSend(
            api,
            getStatusText(
              data,
              threadID
            ),
            threadID
          );

          return;
        }

        case "help": {
          await safeSend(
            api,
            buildHelpText(),
            threadID
          );

          return;
        }

        case "lock": {
          data.active =
            true;

          data.nicknameLock =
            true;

          data.gcNameLock =
            true;

          saveData(
            data
          );

          return;
        }

        case "unlock": {
          data.nicknameLock =
            false;

          data.gcNameLock =
            false;

          saveData(
            data
          );

          return;
        }

        case "setnick": {
          if (
            !data.active
          ) {
            return;
          }

          await handleNicknameCommand(
            api,
            event,
            data
          );

          return;
        }

        case "setgname": {
          if (
            !data.active
          ) {
            return;
          }

          await handleGCNameCommand(
            api,
            event,
            data
          );

          return;
        }

        case "target": {
          await handleTargetCommand(
            api,
            event,
            data,
            args.slice(1)
          );

          return;
        }

        case "untarget": {
          await handleUntargetCommand(
            api,
            event,
            data
          );

          return;
        }

        case "replyon": {
          data.active =
            true;

          data.autoReply =
            true;

          saveData(
            data
          );

          return;
        }

        case "replyoff": {
          data.autoReply =
            false;

          saveData(
            data
          );

          return;
        }

        case "reacton": {
          data.active =
            true;

          data.autoReact =
            true;

          saveData(
            data
          );

          return;
        }

        case "reactoff": {
          data.autoReact =
            false;

          saveData(
            data
          );

          return;
        }

        default:
          return;
      }

    } catch (error) {
      console.error(
        "[RYUK] run error:",
        error.message ||
          error
      );

      incrementError(
        data
      );
    }
  };function cleanupCooldownMap(
  map,
  maxAge
) {
  if (
    !map ||
    typeof map !==
      "object"
  ) {
    return;
  }

  const current =
    Date.now();

  for (
    const key
    of Object.keys(map)
  ) {
    const value =
      Number(
        map[key] || 0
      );

    if (
      !value ||
      current -
        value >
      maxAge
    ) {
      delete map[key];
    }
  }
}

function cleanupMemory() {
  cleanupCooldownMap(
    lastReply,
    600000
  );

  cleanupCooldownMap(
    lastReaction,
    600000
  );

  cleanupCooldownMap(
    nicknameRestoreLock,
    600000
  );

  cleanupCooldownMap(
    gcNameRestoreLock,
    600000
  );
}

function validateData(
  data
) {
  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return {
      ...DEFAULT_DATA
    };
  }

  if (
    typeof data.active !==
      "boolean"
  ) {
    data.active =
      false;
  }

  if (
    typeof data.autoReply !==
      "boolean"
  ) {
    data.autoReply =
      true;
  }

  if (
    typeof data.autoReact !==
      "boolean"
  ) {
    data.autoReact =
      true;
  }

  if (
    typeof data.nicknameLock !==
      "boolean"
  ) {
    data.nicknameLock =
      false;
  }

  if (
    typeof data.gcNameLock !==
      "boolean"
  ) {
    data.gcNameLock =
      false;
  }

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

  return data;
}

function finalDataCheck() {
  try {
    const data =
      validateData(
        loadData()
      );

    saveData(
      data
    );

    return true;

  } catch (error) {
    console.error(
      "[RYUK] Final data check error:",
      error.message ||
        error
    );

    return false;
  }
}

const MEMORY_CLEANUP_INTERVAL =
  setInterval(
    () => {
      try {
        cleanupMemory();
      } catch (error) {
        console.error(
          "[RYUK] Memory cleanup error:",
          error.message ||
            error
        );
      }
    },
    300000
  );

if (
  MEMORY_CLEANUP_INTERVAL &&
  typeof MEMORY_CLEANUP_INTERVAL.unref ===
    "function"
) {
  MEMORY_CLEANUP_INTERVAL.unref();
}

finalDataCheck();

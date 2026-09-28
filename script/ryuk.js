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
  }function safeSend(
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
          resolve(false);
          return;
        }

        const text =
          cleanText(message);

        if (!text) {
          resolve(false);
          return;
        }

        const callback =
          error => {
            if (error) {
              console.error(
                "[RYUK] sendMessage:",
                error.message ||
                  error
              );

              resolve(false);
              return;
            }

            resolve(true);
          };

        if (replyTo) {
          api.sendMessage(
            text,
            threadID,
            callback,
            replyTo
          );
        } else {
          api.sendMessage(
            text,
            threadID,
            callback
          );
        }
      } catch (error) {
        console.error(
          "[RYUK] safeSend:",
          error.message ||
            error
        );

        resolve(false);
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
          resolve(false);
          return;
        }

        if (
          !messageID ||
          !reaction
        ) {
          resolve(false);
          return;
        }

        api.setMessageReaction(
          reaction,
          messageID,
          error => {
            if (error) {
              console.error(
                "[RYUK] reaction:",
                error.message ||
                  error
              );

              resolve(false);
              return;
            }

            resolve(true);
          },
          true
        );
      } catch (error) {
        console.error(
          "[RYUK] safeReaction:",
          error.message ||
            error
        );

        resolve(false);
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
          resolve(false);
          return;
        }

        const value =
          cleanText(
            nickname
          );

        if (
          !value ||
          !threadID ||
          !userID
        ) {
          resolve(false);
          return;
        }

        api.changeNickname(
          value,
          threadID,
          userID,
          error => {
            if (error) {
              console.error(
                "[RYUK] nickname:",
                error.message ||
                  error
              );

              resolve(false);
              return;
            }

            resolve(true);
          }
        );
      } catch (error) {
        console.error(
          "[RYUK] safeNickname:",
          error.message ||
            error
        );

        resolve(false);
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
          resolve(false);
          return;
        }

        const value =
          cleanText(title);

        if (
          !value ||
          !threadID
        ) {
          resolve(false);
          return;
        }

        api.setTitle(
          value,
          threadID,
          error => {
            if (error) {
              console.error(
                "[RYUK] group name:",
                error.message ||
                  error
              );

              resolve(false);
              return;
            }

            resolve(true);
          }
        );
      } catch (error) {
        console.error(
          "[RYUK] safeTitle:",
          error.message ||
            error
        );

        resolve(false);
      }
    }
  );
}

function getBotID(api) {
  try {
    if (
      api &&
      typeof api.getCurrentUserID ===
        "function"
    ) {
      const id =
        api.getCurrentUserID();

      if (id) {
        return String(id);
      }
    }
  } catch (error) {
    console.error(
      "[RYUK] getBotID:",
      error.message ||
        error
    );
  }

  return null;
}

function normalizeName(value) {
  return cleanText(
    value
  ).slice(
    0,
    100
  );
}

function sameName(
  first,
  second
) {
  return (
    normalizeName(
      first
    ).toLowerCase() ===
    normalizeName(
      second
    ).toLowerCase()
  );
}

async function applyNickname(
  api,
  threadID,
  data,
  silent
) {
  try {
    const nickname =
      normalizeName(
        data.nickname
      );

    if (!nickname) {
      return false;
    }

    const botID =
      getBotID(api);

    if (!botID) {
      return false;
    }

    const key =
      getThreadKey(
        threadID
      );

    const current =
      now();

    const previous =
      lastNicknameRestore[
        key
      ] || 0;

    if (
      current -
        previous <
      RESTORE_COOLDOWN
    ) {
      return false;
    }

    lastNicknameRestore[
      key
    ] = current;

    const success =
      await safeNickname(
        api,
        nickname,
        threadID,
        botID
      );

    if (success) {
      data.nickname =
        nickname;

      data.nicknameCount =
        Number(
          data.nicknameCount
        ) + 1;

      data.restoreCount =
        Number(
          data.restoreCount
        ) + 1;

      saveData(data);

      return true;
    }

    return false;
  } catch (error) {
    data.errorCount =
      Number(
        data.errorCount
      ) + 1;

    saveData(data);

    if (!silent) {
      console.error(
        "[RYUK] applyNickname:",
        error.message ||
          error
      );
    }

    return false;
  }
}

async function applyGCName(
  api,
  threadID,
  data,
  silent
) {
  try {
    const gcName =
      normalizeName(
        data.gcName
      );

    if (!gcName) {
      return false;
    }

    const key =
      getThreadKey(
        threadID
      );

    const current =
      now();

    const previous =
      lastGCNameRestore[
        key
      ] || 0;

    if (
      current -
        previous <
      RESTORE_COOLDOWN
    ) {
      return false;
    }

    lastGCNameRestore[
      key
    ] = current;

    const success =
      await safeTitle(
        api,
        gcName,
        threadID
      );

    if (success) {
      data.gcName =
        gcName;

      data.gcNameRestores =
        Number(
          data.gcNameRestores
        ) + 1;

      data.restoreCount =
        Number(
          data.restoreCount
        ) + 1;

      saveData(data);

      return true;
    }

    return false;
  } catch (error) {
    data.errorCount =
      Number(
        data.errorCount
      ) + 1;

    saveData(data);

    if (!silent) {
      console.error(
        "[RYUK] applyGCName:",
        error.message ||
          error
      );
    }

    return false;
  }
}

function scheduleNicknameRestore(
  api,
  threadID,
  data
) {
  const key =
    getThreadKey(
      threadID
    );

  const restoreKey =
    "nick:" + key;

  if (
    pendingRestore[
      restoreKey
    ]
  ) {
    return;
  }

  pendingRestore[
    restoreKey
  ] = true;

  setTimeout(
    async () => {
      try {
        await applyNickname(
          api,
          threadID,
          data,
          true
        );
      } catch (error) {
        console.error(
          "[RYUK] nickname restore:",
          error.message ||
            error
        );
      } finally {
        delete pendingRestore[
          restoreKey
        ];
      }
    },
    RESTORE_DELAY
  );
}

function scheduleGCNameRestore(
  api,
  threadID,
  data
) {
  const key =
    getThreadKey(
      threadID
    );

  const restoreKey =
    "gname:" + key;

  if (
    pendingRestore[
      restoreKey
    ]
  ) {
    return;
  }

  pendingRestore[
    restoreKey
  ] = true;

  setTimeout(
    async () => {
      try {
        await applyGCName(
          api,
          threadID,
          data,
          true
        );
      } catch (error) {
        console.error(
          "[RYUK] group name restore:",
          error.message ||
            error
        );
      } finally {
        delete pendingRestore[
          restoreKey
        ];
      }
    },
    RESTORE_DELAY
  );
    }function getThreadKey(
  threadID
) {
  return String(
    threadID || ""
  );
}

function now() {
  return Date.now();
}

function getTargetData(
  data,
  threadID
) {
  const key =
    getThreadKey(
      threadID
    );

  if (
    !data.target ||
    typeof data.target !==
      "object"
  ) {
    data.target = {};
  }

  if (
    !data.target[key] ||
    typeof data.target[key] !==
      "object"
  ) {
    data.target[key] = {
      enabled: false,
      userID: "",
      name: "",
      updatedAt: 0
    };
  }

  return data.target[key];
}

function setTargetData(
  data,
  threadID,
  userID,
  name
) {
  const target =
    getTargetData(
      data,
      threadID
    );

  target.enabled =
    true;

  target.userID =
    String(
      userID || ""
    );

  target.name =
    cleanText(
      name || ""
    );

  target.updatedAt =
    now();

  saveData(data);

  return target;
}

function clearTargetData(
  data,
  threadID
) {
  const key =
    getThreadKey(
      threadID
    );

  if (
    !data.target ||
    typeof data.target !==
      "object"
  ) {
    data.target = {};
  }

  data.target[key] = {
    enabled: false,
    userID: "",
    name: "",
    updatedAt: now()
  };

  saveData(data);

  return true;
}

function targetEnabled(
  data,
  threadID
) {
  const target =
    getTargetData(
      data,
      threadID
    );

  return Boolean(
    target.enabled &&
    target.userID
  );
}

function isTargetUser(
  data,
  threadID,
  senderID
) {
  if (!senderID) {
    return false;
  }

  const target =
    getTargetData(
      data,
      threadID
    );

  if (
    !target.enabled ||
    !target.userID
  ) {
    return false;
  }

  return (
    String(
      target.userID
    ) ===
    String(senderID)
  );
}

function getMentionedUserID(
  event
) {
  try {
    if (
      !event ||
      !event.mentions
    ) {
      return null;
    }

    const mentions =
      event.mentions;

    const ids =
      Object.keys(
        mentions
      );

    if (
      ids.length === 0
    ) {
      return null;
    }

    return String(
      ids[0]
    );
  } catch (error) {
    return null;
  }
}

function getMentionedUserName(
  event,
  userID
) {
  try {
    if (
      !event ||
      !event.mentions ||
      !userID
    ) {
      return "";
    }

    const mention =
      event.mentions[
        userID
      ];

    if (
      typeof mention ===
      "string"
    ) {
      return cleanText(
        mention
          .replace(
            /^@/,
            ""
          )
      );
    }

    if (
      mention &&
      typeof mention ===
        "object"
    ) {
      return cleanText(
        mention.name ||
          mention.text ||
          ""
      );
    }

    return "";
  } catch (error) {
    return "";
  }
}

function extractUserIDFromArgs(
  event
) {
  const mentioned =
    getMentionedUserID(
      event
    );

  if (mentioned) {
    return mentioned;
  }

  const args =
    getCommandArgs(
      event
    );

  if (
    args.length === 0
  ) {
    return null;
  }

  const first =
    String(
      args[0] || ""
    ).trim();

  if (
    /^\d{8,30}$/.test(
      first
    )
  ) {
    return first;
  }

  return null;
}

function getTargetName(
  event,
  userID
) {
  const mentionedName =
    getMentionedUserName(
      event,
      userID
    );

  if (
    mentionedName
  ) {
    return mentionedName;
  }

  const args =
    getCommandArgs(
      event
    );

  if (
    args.length > 1
  ) {
    return cleanText(
      args
        .slice(1)
        .join(" ")
        .replace(
          /@\S+/g,
          ""
        )
    );
  }

  return "";
}

function getCommandValue(
  event
) {
  return cleanText(
    getArgumentText(
      event
    )
  );
}

function validName(
  value
) {
  const name =
    normalizeName(
      value
    );

  if (
    !name
  ) {
    return false;
  }

  if (
    name.length < 1
  ) {
    return false;
  }

  return true;
}

function saveNickname(
  data,
  nickname
) {
  const value =
    normalizeName(
      nickname
    );

  if (
    !validName(value)
  ) {
    return false;
  }

  if (
    sameName(
      data.nickname,
      value
    )
  ) {
    return false;
  }

  data.nickname =
    value;

  saveData(data);

  return true;
}

function saveGCName(
  data,
  gcName
) {
  const value =
    normalizeName(
      gcName
    );

  if (
    !validName(value)
  ) {
    return false;
  }

  if (
    sameName(
      data.gcName,
      value
    )
  ) {
    return false;
  }

  data.gcName =
    value;

  saveData(data);

  return true;
  }function commandOn(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (!threadID) {
    return;
  }

  data.active = true;

  saveData(data);

  safeSend(
    api,
    "💀 RYUK ON",
    threadID
  );
}

function commandOff(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (!threadID) {
    return;
  }

  data.active = false;

  saveData(data);

  safeSend(
    api,
    "💀 RYUK OFF",
    threadID
  );
}

function commandLock(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (!threadID) {
    return;
  }

  data.nicknameLock = true;
  data.gcNameLock = true;

  saveData(data);

  safeSend(
    api,
    "🔒 RYUK LOCK ON",
    threadID
  );
}

function commandUnlock(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (!threadID) {
    return;
  }

  data.nicknameLock = false;
  data.gcNameLock = false;

  saveData(data);

  safeSend(
    api,
    "🔓 RYUK LOCK OFF",
    threadID
  );
}

function commandReplyOn(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (!threadID) {
    return;
  }

  data.autoReply = true;

  saveData(data);

  safeSend(
    api,
    "💬 AUTO REPLY ON",
    threadID
  );
}

function commandReplyOff(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (!threadID) {
    return;
  }

  data.autoReply = false;

  saveData(data);

  safeSend(
    api,
    "💬 AUTO REPLY OFF",
    threadID
  );
}

function commandReactOn(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (!threadID) {
    return;
  }

  data.autoReact = true;

  saveData(data);

  safeSend(
    api,
    "⚡ AUTO REACT ON",
    threadID
  );
}

function commandReactOff(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (!threadID) {
    return;
  }

  data.autoReact = false;

  saveData(data);

  safeSend(
    api,
    "⚡ AUTO REACT OFF",
    threadID
  );
}

async function commandSetNick(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (!threadID) {
    return;
  }

  const value =
    normalizeName(
      getCommandValue(
        event
      )
    );

  if (!value) {
    return;
  }

  data.nickname =
    value;

  saveData(data);

  const botID =
    getBotID(api);

  if (!botID) {
    return;
  }

  const success =
    await safeNickname(
      api,
      value,
      threadID,
      botID
    );

  if (success) {
    data.nicknameCount =
      Number(
        data.nicknameCount
      ) + 1;

    saveData(data);

    await safeSend(
      api,
      "✅ Nickname set.",
      threadID
    );
  }
}

async function commandSetGCName(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (!threadID) {
    return;
  }

  const value =
    normalizeName(
      getCommandValue(
        event
      )
    );

  if (!value) {
    return;
  }

  data.gcName =
    value;

  saveData(data);

  const success =
    await safeTitle(
      api,
      value,
      threadID
    );

  if (success) {
    data.gcNameRestores =
      Number(
        data.gcNameRestores
      ) + 1;

    saveData(data);

    await safeSend(
      api,
      "✅ GC name set.",
      threadID
    );
  }
}

async function commandTarget(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (!threadID) {
    return;
  }

  const userID =
    extractUserIDFromArgs(
      event
    );

  if (!userID) {
    return;
  }

  const name =
    getTargetName(
      event,
      userID
    );

  setTargetData(
    data,
    threadID,
    userID,
    name
  );

  await safeSend(
    api,
    "🎯 Target set.",
    threadID
  );
}

async function commandUntarget(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (!threadID) {
    return;
  }

  clearTargetData(
    data,
    threadID
  );

  await safeSend(
    api,
    "🎯 Target off.",
    threadID
  );
}function getStatusText(
  data,
  threadID
) {
  const target =
    getTargetData(
      data,
      threadID
    );

  const targetStatus =
    target.enabled &&
    target.userID
      ? "ON"
      : "OFF";

  const targetName =
    target.name ||
    target.userID ||
    "NONE";

  return [
    "💀 RYUK STATUS",
    "",
    "Bot: " +
      (data.active
        ? "ON"
        : "OFF"),
    "Auto Reply: " +
      (data.autoReply
        ? "ON"
        : "OFF"),
    "Auto React: " +
      (data.autoReact
        ? "ON"
        : "OFF"),
    "Nickname Lock: " +
      (data.nicknameLock
        ? "ON"
        : "OFF"),
    "GC Name Lock: " +
      (data.gcNameLock
        ? "ON"
        : "OFF"),
    "Nickname: " +
      (data.nickname ||
        DEFAULT_NICKNAME),
    "GC Name: " +
      (data.gcName ||
        DEFAULT_GC_NAME),
    "Target: " +
      targetStatus,
    "Target User: " +
      targetName
  ].join("\n");
}

async function commandStatus(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (!threadID) {
    return;
  }

  await safeSend(
    api,
    getStatusText(
      data,
      threadID
    ),
    threadID
  );
}

async function commandHelp(
  api,
  event
) {
  const threadID =
    getThreadID(event);

  if (!threadID) {
    return;
  }

  const helpText = [
    "💀 RYUK COMMANDS",
    "",
    "/ryuk on",
    "/ryuk off",
    "/ryuk status",
    "/ryuk lock",
    "/ryuk unlock",
    "/ryuk setnick NAME",
    "/ryuk setgname NAME",
    "/ryuk target @user",
    "/ryuk untarget",
    "/ryuk replyon",
    "/ryuk replyoff",
    "/ryuk reacton",
    "/ryuk reactoff"
  ].join("\n");

  await safeSend(
    api,
    helpText,
    threadID
  );
}

function getCommandAction(
  event
) {
  if (
    !commandIsRyuk(event)
  ) {
    return "";
  }

  const args =
    getCommandArgs(
      event
    );

  return String(
    args[0] || ""
  ).toLowerCase();
}

function isAllowedCommand(
  action
) {
  return [
    "on",
    "off",
    "status",
    "lock",
    "unlock",
    "setnick",
    "setgname",
    "target",
    "untarget",
    "replyon",
    "replyoff",
    "reacton",
    "reactoff",
    "help"
  ].includes(
    action
  );
}

async function runCommand(
  api,
  event
) {
  const senderID =
    getSenderID(event);

  if (
    !isAdmin(senderID)
  ) {
    return;
  }

  if (
    !commandIsRyuk(event)
  ) {
    return;
  }

  const action =
    getCommandAction(
      event
    );

  if (
    !isAllowedCommand(
      action
    )
  ) {
    return;
  }

  const data =
    loadData();

  switch (action) {
    case "on":
      commandOn(
        api,
        event,
        data
      );
      break;

    case "off":
      commandOff(
        api,
        event,
        data
      );
      break;

    case "status":
      await commandStatus(
        api,
        event,
        data
      );
      break;

    case "lock":
      commandLock(
        api,
        event,
        data
      );
      break;

    case "unlock":
      commandUnlock(
        api,
        event,
        data
      );
      break;

    case "setnick":
      await commandSetNick(
        api,
        event,
        data
      );
      break;

    case "setgname":
      await commandSetGCName(
        api,
        event,
        data
      );
      break;

    case "target":
      await commandTarget(
        api,
        event,
        data
      );
      break;

    case "untarget":
      await commandUntarget(
        api,
        event,
        data
      );
      break;

    case "replyon":
      commandReplyOn(
        api,
        event,
        data
      );
      break;

    case "replyoff":
      commandReplyOff(
        api,
        event,
        data
      );
      break;

    case "reacton":
      commandReactOn(
        api,
        event,
        data
      );
      break;

    case "reactoff":
      commandReactOff(
        api,
        event,
        data
      );
      break;

    case "help":
      await commandHelp(
        api,
        event
      );
      break;

    default:
      return;
  }
  }module.exports.run =
  async function({
    api,
    event
  }) {
    try {
      if (
        !event ||
        !api
      ) {
        return;
      }

      const senderID =
        getSenderID(event);

      if (
        !isAdmin(senderID)
      ) {
        return;
      }

      if (
        !commandIsRyuk(event)
      ) {
        return;
      }

      await runCommand(
        api,
        event
      );

    } catch (error) {
      console.error(
        "[RYUK] Command error:",
        error.message ||
          error
      );

      try {
        const data =
          loadData();

        data.errorCount =
          Number(
            data.errorCount
          ) + 1;

        saveData(data);
      } catch (_) {}
    }
  };

module.exports.handleEvent =
  async function({
    api,
    event
  }) {
    try {
      if (
        !api ||
        !event
      ) {
        return;
      }

      const threadID =
        getThreadID(event);

      const senderID =
        getSenderID(event);

      if (
        !threadID ||
        !senderID
      ) {
        return;
      }

      const messageID =
        getMessageID(event);

      if (
        messageID &&
        alreadyProcessed(
          messageID
        )
      ) {
        return;
      }

      if (
        messageID
      ) {
        rememberMessage(
          messageID
        );
      }

      const data =
        loadData();

      if (
        isCommand(event)
      ) {
        return;
      }

      if (
        !data.active
      ) {
        return;
      }

      if (
        isAdmin(senderID)
      ) {
        return;
      }

      const body =
        getBody(event);

      if (!body) {
        return;
      }

      if (
        isSpam(senderID)
      ) {
        return;
      }

      const targetActive =
        targetEnabled(
          data,
          threadID
        );

      if (
        targetActive &&
        !isTargetUser(
          data,
          threadID,
          senderID
        )
      ) {
        return;
      }

      if (
        data.autoReact &&
        messageID &&
        canReact(
          threadID
        )
      ) {
        const reaction =
          getAutoReaction();

        await safeReaction(
          api,
          reaction,
          messageID
        );
      }

      if (
        data.autoReply &&
        canReply(
          threadID
        )
      ) {
        const reply =
          getAutoReply();

        await safeSend(
          api,
          reply,
          threadID
        );

        data.replyCount =
          Number(
            data.replyCount
          ) + 1;

        saveData(data);
      }

    } catch (error) {
      console.error(
        "[RYUK] Event error:",
        error.message ||
          error
      );

      try {
        const data =
          loadData();

        data.errorCount =
          Number(
            data.errorCount
          ) + 1;

        saveData(data);
      } catch (_) {}
    }
  };function getLogData(
  event
) {
  if (
    !event ||
    !event.logMessageData
  ) {
    return {};
  }

  if (
    typeof event.logMessageData ===
    "object"
  ) {
    return event.logMessageData;
  }

  try {
    return JSON.parse(
      event.logMessageData
    );
  } catch (error) {
    return {};
  }
}

function getLogType(
  event
) {
  if (
    !event
  ) {
    return "";
  }

  return String(
    event.logMessageType ||
      ""
  ).toLowerCase();
}

function isGroupNameEvent(
  event
) {
  const type =
    getLogType(event);

  const data =
    getLogData(event);

  if (
    type ===
      "log:thread-name" ||
    type.includes(
      "thread-name"
    ) ||
    type.includes(
      "group-name"
    )
  ) {
    return true;
  }

  if (
    data &&
    (
      data.name !==
        undefined ||
      data.thread_name !==
        undefined ||
      data.new_name !==
        undefined ||
      data.old_name !==
        undefined
    )
  ) {
    return true;
  }

  return false;
}

function isNicknameEvent(
  event
) {
  const type =
    getLogType(event);

  const data =
    getLogData(event);

  if (
    type ===
      "log:user-nickname" ||
    type.includes(
      "user-nickname"
    ) ||
    type.includes(
      "nickname"
    )
  ) {
    return true;
  }

  if (
    data &&
    (
      data.nickname !==
        undefined ||
      data.new_nickname !==
        undefined ||
      data.old_nickname !==
        undefined
    )
  ) {
    return true;
  }

  return false;
}

function getChangedNicknameUserID(
  event
) {
  const data =
    getLogData(event);

  const possibleIDs = [
    data.participant_id,
    data.participantID,
    data.user_id,
    data.userID,
    data.author,
    data.author_id,
    data.uid,
    data.actor_id
  ];

  for (
    const value of
      possibleIDs
  ) {
    if (
      value !==
        undefined &&
      value !==
        null &&
      String(value).trim()
    ) {
      return String(
        value
      );
    }
  }

  return null;
}

function getChangedNickname(
  event
) {
  const data =
    getLogData(event);

  const possibleNames = [
    data.nickname,
    data.new_nickname,
    data.newNickname,
    data.name
  ];

  for (
    const value of
      possibleNames
  ) {
    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return cleanText(
        value
      );
    }
  }

  return "";
}

function shouldRestoreNickname(
  api,
  event,
  data
) {
  if (
    !data.nicknameLock
  ) {
    return false;
  }

  if (
    !isNicknameEvent(event)
  ) {
    return false;
  }

  const botID =
    getBotID(api);

  if (
    !botID
  ) {
    return false;
  }

  const changedUserID =
    getChangedNicknameUserID(
      event
    );

  if (
    changedUserID &&
    String(
      changedUserID
    ) !==
      String(botID)
  ) {
    return false;
  }

  const changedNickname =
    getChangedNickname(
      event
    );

  if (
    changedNickname &&
    sameName(
      changedNickname,
      data.nickname
    )
  ) {
    return false;
  }

  return true;
}

function shouldRestoreGCName(
  event,
  data
) {
  if (
    !data.gcNameLock
  ) {
    return false;
  }

  if (
    !isGroupNameEvent(event)
  ) {
    return false;
  }

  const logData =
    getLogData(event);

  const changedName =
    cleanText(
      logData.name ||
        logData.thread_name ||
        logData.new_name ||
        ""
    );

  if (
    changedName &&
    sameName(
      changedName,
      data.gcName
    )
  ) {
    return false;
  }

  return true;
}

async function handleRestoreEvents(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (
    !threadID
  ) {
    return;
  }

  if (
    shouldRestoreNickname(
      api,
      event,
      data
    )
  ) {
    scheduleNicknameRestore(
      api,
      threadID,
      data
    );
  }

  if (
    shouldRestoreGCName(
      event,
      data
    )
  ) {
    scheduleGCNameRestore(
      api,
      threadID,
      data
    );
  }
}function resetRestoreCooldown(
  threadID,
  type
) {
  const key =
    getThreadKey(
      threadID
    );

  if (
    type === "nickname"
  ) {
    delete lastNicknameRestore[
      key
    ];
    return;
  }

  if (
    type === "gcname"
  ) {
    delete lastGCNameRestore[
      key
    ];
  }
}

function restoreSavedSettings(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (
    !threadID
  ) {
    return;
  }

  if (
    data.nicknameLock &&
    data.nickname
  ) {
    scheduleNicknameRestore(
      api,
      threadID,
      data
    );
  }

  if (
    data.gcNameLock &&
    data.gcName
  ) {
    scheduleGCNameRestore(
      api,
      threadID,
      data
    );
  }
}

function isOwnNicknameChange(
  api,
  event
) {
  const botID =
    getBotID(api);

  if (
    !botID
  ) {
    return false;
  }

  const changedID =
    getChangedNicknameUserID(
      event
    );

  if (
    !changedID
  ) {
    return true;
  }

  return (
    String(
      changedID
    ) ===
    String(botID)
  );
}

function isRelevantRestoreEvent(
  event
) {
  return (
    isNicknameEvent(event) ||
    isGroupNameEvent(event)
  );
}

async function processRestoreEvent(
  api,
  event,
  data
) {
  if (
    !isRelevantRestoreEvent(
      event
    )
  ) {
    return;
  }

  const threadID =
    getThreadID(event);

  if (
    !threadID
  ) {
    return;
  }

  if (
    isNicknameEvent(event) &&
    data.nicknameLock
  ) {
    if (
      isOwnNicknameChange(
        api,
        event
      )
    ) {
      scheduleNicknameRestore(
        api,
        threadID,
        data
      );
    }
  }

  if (
    isGroupNameEvent(event) &&
    data.gcNameLock
  ) {
    scheduleGCNameRestore(
      api,
      threadID,
      data
    );
  }
}

function updateRestoreCounters(
  data
) {
  if (
    typeof data.restoreCount !==
    "number"
  ) {
    data.restoreCount = 0;
  }

  if (
    typeof data.nicknameCount !==
    "number"
  ) {
    data.nicknameCount = 0;
  }

  if (
    typeof data.gcNameRestores !==
    "number"
  ) {
    data.gcNameRestores = 0;
  }

  if (
    typeof data.errorCount !==
    "number"
  ) {
    data.errorCount = 0;
  }
}

function ensureRuntimeData(
  data
) {
  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return cloneDefaultData();
  }

  if (
    !data.target ||
    typeof data.target !==
      "object"
  ) {
    data.target = {};
  }

  if (
    typeof data.nickname !==
      "string" ||
    !data.nickname.trim()
  ) {
    data.nickname =
      DEFAULT_NICKNAME;
  }

  if (
    typeof data.gcName !==
      "string" ||
    !data.gcName.trim()
  ) {
    data.gcName =
      DEFAULT_GC_NAME;
  }

  updateRestoreCounters(
    data
  );

  return data;
}function cleanupCaches() {
  const current =
    Date.now();

  const replyKeys =
    Object.keys(
      lastReply
    );

  for (
    const key of replyKeys
  ) {
    if (
      current -
        lastReply[key] >
      60000
    ) {
      delete lastReply[
        key
      ];
    }
  }

  const reactionKeys =
    Object.keys(
      lastReaction
    );

  for (
    const key of reactionKeys
  ) {
    if (
      current -
        lastReaction[key] >
      60000
    ) {
      delete lastReaction[
        key
      ];
    }
  }

  const nicknameKeys =
    Object.keys(
      lastNicknameRestore
    );

  for (
    const key of nicknameKeys
  ) {
    if (
      current -
        lastNicknameRestore[key] >
      60000
    ) {
      delete lastNicknameRestore[
        key
      ];
    }
  }

  const gcNameKeys =
    Object.keys(
      lastGCNameRestore
    );

  for (
    const key of gcNameKeys
  ) {
    if (
      current -
        lastGCNameRestore[key] >
      60000
    ) {
      delete lastGCNameRestore[
        key
      ];
    }
  }

  const pendingKeys =
    Object.keys(
      pendingRestore
    );

  for (
    const key of pendingKeys
  ) {
    if (
      pendingRestore[key] ===
      false
    ) {
      delete pendingRestore[
        key
      ];
    }
  }
}

function ensureDataFile() {
  try {
    if (
      !fs.existsSync(
        DATA_PATH
      )
    ) {
      saveData(
        cloneDefaultData()
      );
    }

    let data =
      loadData();

    data =
      ensureRuntimeData(
        data
      );

    if (
      typeof data.active !==
        "boolean"
    ) {
      data.active = false;
    }

    if (
      typeof data.autoReply !==
        "boolean"
    ) {
      data.autoReply = true;
    }

    if (
      typeof data.autoReact !==
        "boolean"
    ) {
      data.autoReact = true;
    }

    if (
      typeof data.nicknameLock !==
        "boolean"
    ) {
      data.nicknameLock = false;
    }

    if (
      typeof data.gcNameLock !==
        "boolean"
    ) {
      data.gcNameLock = false;
    }

    if (
      typeof data.replyCount !==
        "number"
    ) {
      data.replyCount = 0;
    }

    if (
      typeof data.reactionCount !==
        "number"
    ) {
      data.reactionCount = 0;
    }

    if (
      typeof data.nicknameCount !==
        "number"
    ) {
      data.nicknameCount = 0;
    }

    if (
      typeof data.restoreCount !==
        "number"
    ) {
      data.restoreCount = 0;
    }

    if (
      typeof data.gcNameRestores !==
        "number"
    ) {
      data.gcNameRestores = 0;
    }

    if (
      typeof data.errorCount !==
        "number"
    ) {
      data.errorCount = 0;
    }

    saveData(
      data
    );

  } catch (error) {
    console.error(
      "[RYUK] Data initialization error:",
      error.message ||
        error
    );
  }
}

ensureDataFile();

setInterval(
  () => {
    try {
      cleanupCaches();
    } catch (error) {
      console.error(
        "[RYUK] Cleanup error:",
        error.message ||
          error
      );
    }
  },
  60000
);function getEventText(
  event
) {
  const body =
    getBody(event);

  if (body) {
    return body;
  }

  const data =
    getLogData(event);

  if (!data) {
    return "";
  }

  const values = [
    data.name,
    data.thread_name,
    data.new_name,
    data.nickname,
    data.new_nickname,
    data.message
  ];

  for (
    const value of values
  ) {
    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return cleanText(
        value
      );
    }
  }

  return "";
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
    event.type ===
    "message_reply"
  ) {
    return false;
  }

  if (
    event.type ===
    "message_reaction"
  ) {
    return false;
  }

  return false;
}

function canProcessMessage(
  event
) {
  const messageID =
    getMessageID(event);

  if (
    !messageID
  ) {
    return true;
  }

  if (
    alreadyProcessed(
      messageID
    )
  ) {
    return false;
  }

  rememberMessage(
    messageID
  );

  return true;
}

function shouldAutoReply(
  data,
  event,
  threadID,
  senderID
) {
  if (
    !data.active ||
    !data.autoReply
  ) {
    return false;
  }

  if (
    !threadID ||
    !senderID
  ) {
    return false;
  }

  if (
    isAdmin(senderID)
  ) {
    return false;
  }

  if (
    targetEnabled(
      data,
      threadID
    ) &&
    !isTargetUser(
      data,
      threadID,
      senderID
    )
  ) {
    return false;
  }

  if (
    !getEventText(event)
  ) {
    return false;
  }

  if (
    isSpam(senderID)
  ) {
    return false;
  }

  return canReply(
    threadID
  );
}

function shouldAutoReact(
  data,
  event,
  threadID,
  senderID
) {
  if (
    !data.active ||
    !data.autoReact
  ) {
    return false;
  }

  if (
    !threadID ||
    !senderID
  ) {
    return false;
  }

  if (
    isAdmin(senderID)
  ) {
    return false;
  }

  if (
    targetEnabled(
      data,
      threadID
    ) &&
    !isTargetUser(
      data,
      threadID,
      senderID
    )
  ) {
    return false;
  }

  const messageID =
    getMessageID(event);

  if (
    !messageID
  ) {
    return false;
  }

  return canReact(
    threadID
  );
}

async function processAutoActions(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  const senderID =
    getSenderID(event);

  if (
    !threadID ||
    !senderID
  ) {
    return;
  }

  const replyAllowed =
    shouldAutoReply(
      data,
      event,
      threadID,
      senderID
    );

  const reactAllowed =
    shouldAutoReact(
      data,
      event,
      threadID,
      senderID
    );

  const messageID =
    getMessageID(event);

  if (
    reactAllowed &&
    messageID
  ) {
    const reaction =
      getAutoReaction();

    const success =
      await safeReaction(
        api,
        reaction,
        messageID
      );

    if (success) {
      data.reactionCount =
        Number(
          data.reactionCount
        ) + 1;

      saveData(data);
    }
  }

  if (
    replyAllowed
  ) {
    const reply =
      getAutoReply();

    const success =
      await safeSend(
        api,
        reply,
        threadID
      );

    if (success) {
      data.replyCount =
        Number(
          data.replyCount
        ) + 1;

      saveData(data);
    }
  }
      }async function handleMessageEvent(
  api,
  event
) {
  try {
    if (
      !api ||
      !event
    ) {
      return;
    }

    if (
      shouldIgnoreEvent(
        event
      )
    ) {
      return;
    }

    const threadID =
      getThreadID(event);

    const senderID =
      getSenderID(event);

    if (
      !threadID ||
      !senderID
    ) {
      return;
    }

    if (
      isCommand(event)
    ) {
      return;
    }

    if (
      !canProcessMessage(
        event
      )
    ) {
      return;
    }

    const data =
      ensureRuntimeData(
        loadData()
      );

    await processAutoActions(
      api,
      event,
      data
    );

  } catch (error) {
    console.error(
      "[RYUK] Message handler:",
      error.message ||
        error
    );

    try {
      const data =
        ensureRuntimeData(
          loadData()
        );

      data.errorCount =
        Number(
          data.errorCount
        ) + 1;

      saveData(data);
    } catch (_) {}
  }
}

async function handleLogEvent(
  api,
  event
) {
  try {
    if (
      !api ||
      !event
    ) {
      return;
    }

    const threadID =
      getThreadID(event);

    if (
      !threadID
    ) {
      return;
    }

    const data =
      ensureRuntimeData(
        loadData()
      );

    await processRestoreEvent(
      api,
      event,
      data
    );

  } catch (error) {
    console.error(
      "[RYUK] Log handler:",
      error.message ||
        error
    );

    try {
      const data =
        ensureRuntimeData(
          loadData()
        );

      data.errorCount =
        Number(
          data.errorCount
        ) + 1;

      saveData(data);
    } catch (_) {}
  }
}

function isLogEvent(
  event
) {
  const type =
    getLogType(event);

  if (
    type.startsWith(
      "log:"
    )
  ) {
    return true;
  }

  return (
    isNicknameEvent(
      event
    ) ||
    isGroupNameEvent(
      event
    )
  );
}

function isMessageEvent(
  event
) {
  if (
    !event
  ) {
    return false;
  }

  if (
    isLogEvent(event)
  ) {
    return false;
  }

  if (
    event.type ===
      "message" ||
    event.type ===
      "message_reply" ||
    event.type ===
      "message_unsend" ||
    typeof event.body ===
      "string"
  ) {
    return true;
  }

  return false;
}

async function dispatchEvent(
  api,
  event
) {
  if (
    isLogEvent(event)
  ) {
    await handleLogEvent(
      api,
      event
    );

    return;
  }

  if (
    isMessageEvent(event)
  ) {
    await handleMessageEvent(
      api,
      event
    );
  }
  }module.exports.handleEvent =
  async function({
    api,
    event
  }) {
    try {
      if (
        !api ||
        !event
      ) {
        return;
      }

      await dispatchEvent(
        api,
        event
      );

    } catch (error) {
      console.error(
        "[RYUK] handleEvent:",
        error.message ||
          error
      );

      try {
        const data =
          ensureRuntimeData(
            loadData()
          );

        data.errorCount =
          Number(
            data.errorCount
          ) + 1;

        saveData(
          data
        );
      } catch (_) {}
    }
  };

module.exports.onLoad =
  function({
    api
  }) {
    try {
      ensureDataFile();

      if (
        api &&
        typeof api.getCurrentUserID ===
          "function"
      ) {
        const botID =
          api.getCurrentUserID();

        if (botID) {
          console.log(
            "[RYUK] Loaded:",
            String(botID)
          );
        }
      }

    } catch (error) {
      console.error(
        "[RYUK] onLoad:",
        error.message ||
          error
      );
    }
  };function normalizeCommand(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

function parseRyukCommand(
  event
) {
  const body =
    getBody(event);

  if (
    !body ||
    !body.startsWith("/")
  ) {
    return {
      valid: false,
      command: "",
      args: [],
      text: ""
    };
  }

  const parts =
    body
      .slice(1)
      .trim()
      .split(/\s+/);

  if (
    parts.length === 0
  ) {
    return {
      valid: false,
      command: "",
      args: [],
      text: ""
    };
  }

  const command =
    normalizeCommand(
      parts[0]
    );

  if (
    command !== "ryuk"
  ) {
    return {
      valid: false,
      command: "",
      args: [],
      text: ""
    };
  }

  const args =
    parts.slice(1);

  return {
    valid: true,
    command: "ryuk",
    args: args,
    text: cleanText(
      args.join(" ")
    )
  };
}

function isRyukCommand(
  event
) {
  const parsed =
    parseRyukCommand(
      event
    );

  return parsed.valid;
}

function getRyukAction(
  event
) {
  const parsed =
    parseRyukCommand(
      event
    );

  if (
    !parsed.valid
  ) {
    return "";
  }

  return normalizeCommand(
    parsed.args[0] || ""
  );
}

function getRyukArguments(
  event
) {
  const parsed =
    parseRyukCommand(
      event
    );

  if (
    !parsed.valid
  ) {
    return [];
  }

  return parsed.args.slice(
    1
  );
}

function getRyukArgumentText(
  event
) {
  const args =
    getRyukArguments(
      event
    );

  return cleanText(
    args.join(" ")
  );
}

function isKnownRyukAction(
  action
) {
  return [
    "on",
    "off",
    "status",
    "lock",
    "unlock",
    "setnick",
    "setgname",
    "target",
    "untarget",
    "replyon",
    "replyoff",
    "reacton",
    "reactoff",
    "help"
  ].includes(
    normalizeCommand(
      action
    )
  );
}

function shouldRunRyukCommand(
  event
) {
  if (
    !isRyukCommand(event)
  ) {
    return false;
  }

  const action =
    getRyukAction(
      event
    );

  if (
    !action
  ) {
    return false;
  }

  return isKnownRyukAction(
    action
  );
}

function adminCommandAllowed(
  event
) {
  const senderID =
    getSenderID(event);

  return isAdmin(
    senderID
  );
}

function rejectNonAdminCommand(
  event
) {
  if (
    !isRyukCommand(event)
  ) {
    return false;
  }

  if (
    adminCommandAllowed(
      event
    )
  ) {
    return false;
  }

  return true;
  }async function executeRyukCommand(
  api,
  event
) {
  try {
    if (
      !api ||
      !event
    ) {
      return;
    }

    if (
      !shouldRunRyukCommand(
        event
      )
    ) {
      return;
    }

    if (
      !adminCommandAllowed(
        event
      )
    ) {
      return;
    }

    const action =
      getRyukAction(
        event
      );

    const data =
      ensureRuntimeData(
        loadData()
      );

    switch (action) {
      case "on":
        commandOn(
          api,
          event,
          data
        );
        break;

      case "off":
        commandOff(
          api,
          event,
          data
        );
        break;

      case "status":
        await commandStatus(
          api,
          event,
          data
        );
        break;

      case "lock":
        commandLock(
          api,
          event,
          data
        );
        break;

      case "unlock":
        commandUnlock(
          api,
          event,
          data
        );
        break;

      case "setnick":
        await commandSetNick(
          api,
          event,
          data
        );
        break;

      case "setgname":
        await commandSetGCName(
          api,
          event,
          data
        );
        break;

      case "target":
        await commandTarget(
          api,
          event,
          data
        );
        break;

      case "untarget":
        await commandUntarget(
          api,
          event,
          data
        );
        break;

      case "replyon":
        commandReplyOn(
          api,
          event,
          data
        );
        break;

      case "replyoff":
        commandReplyOff(
          api,
          event,
          data
        );
        break;

      case "reacton":
        commandReactOn(
          api,
          event,
          data
        );
        break;

      case "reactoff":
        commandReactOff(
          api,
          event,
          data
        );
        break;

      case "help":
        await commandHelp(
          api,
          event
        );
        break;

      default:
        return;
    }

  } catch (error) {
    console.error(
      "[RYUK] Execute command:",
      error.message ||
        error
    );

    try {
      const data =
        ensureRuntimeData(
          loadData()
        );

      data.errorCount =
        Number(
          data.errorCount
        ) + 1;

      saveData(
        data
      );
    } catch (_) {}
  }
}

module.exports.run =
  async function({
    api,
    event
  }) {
    try {
      if (
        !api ||
        !event
      ) {
        return;
      }

      if (
        !isRyukCommand(
          event
        )
      ) {
        return;
      }

      if (
        !adminCommandAllowed(
          event
        )
      ) {
        return;
      }

      await executeRyukCommand(
        api,
        event
      );

    } catch (error) {
      console.error(
        "[RYUK] run:",
        error.message ||
          error
      );
    }
  };function getStoredNickname(
  data
) {
  if (
    !data ||
    typeof data.nickname !==
      "string"
  ) {
    return DEFAULT_NICKNAME;
  }

  const value =
    normalizeName(
      data.nickname
    );

  return (
    value ||
    DEFAULT_NICKNAME
  );
}

function getStoredGCName(
  data
) {
  if (
    !data ||
    typeof data.gcName !==
      "string"
  ) {
    return DEFAULT_GC_NAME;
  }

  const value =
    normalizeName(
      data.gcName
    );

  return (
    value ||
    DEFAULT_GC_NAME
  );
}

function prepareNickname(
  data,
  value
) {
  const nickname =
    normalizeName(
      value
    );

  if (
    !nickname
  ) {
    return false;
  }

  data.nickname =
    nickname;

  return true;
}

function prepareGCName(
  data,
  value
) {
  const gcName =
    normalizeName(
      value
    );

  if (
    !gcName
  ) {
    return false;
  }

  data.gcName =
    gcName;

  return true;
}

async function setNicknameOnce(
  api,
  threadID,
  data,
  value
) {
  const nickname =
    normalizeName(
      value
    );

  if (
    !nickname ||
    !threadID
  ) {
    return false;
  }

  const botID =
    getBotID(api);

  if (
    !botID
  ) {
    return false;
  }

  data.nickname =
    nickname;

  saveData(
    data
  );

  const success =
    await safeNickname(
      api,
      nickname,
      threadID,
      botID
    );

  if (
    success
  ) {
    data.nicknameCount =
      Number(
        data.nicknameCount
      ) + 1;

    saveData(
      data
    );
  }

  return success;
}

async function setGCNameOnce(
  api,
  threadID,
  data,
  value
) {
  const gcName =
    normalizeName(
      value
    );

  if (
    !gcName ||
    !threadID
  ) {
    return false;
  }

  data.gcName =
    gcName;

  saveData(
    data
  );

  const success =
    await safeTitle(
      api,
      gcName,
      threadID
    );

  if (
    success
  ) {
    data.gcNameRestores =
      Number(
        data.gcNameRestores
      ) + 1;

    saveData(
      data
    );
  }

  return success;
}

function cancelPendingRestore(
  threadID,
  type
) {
  const key =
    getThreadKey(
      threadID
    );

  const restoreKey =
    type === "nickname"
      ? "nick:" + key
      : "gname:" + key;

  if (
    pendingRestore[
      restoreKey
    ]
  ) {
    clearTimeout(
      pendingRestore[
        restoreKey
      ]
    );

    delete pendingRestore[
      restoreKey
    ];
  }
    }async function commandSetNickStable(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (
    !threadID
  ) {
    return;
  }

  const value =
    getCommandValue(
      event
    );

  if (
    !value
  ) {
    return;
  }

  cancelPendingRestore(
    threadID,
    "nickname"
  );

  const nickname =
    normalizeName(
      value
    );

  if (
    !nickname
  ) {
    return;
  }

  const changed =
    prepareNickname(
      data,
      nickname
    );

  if (
    !changed
  ) {
    return;
  }

  saveData(
    data
  );

  const success =
    await setNicknameOnce(
      api,
      threadID,
      data,
      nickname
    );

  if (
    success
  ) {
    data.nicknameLock =
      true;

    saveData(
      data
    );

    await safeSend(
      api,
      "✅ Nickname saved.",
      threadID
    );
  }
}

async function commandSetGCNameStable(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (
    !threadID
  ) {
    return;
  }

  const value =
    getCommandValue(
      event
    );

  if (
    !value
  ) {
    return;
  }

  cancelPendingRestore(
    threadID,
    "gcname"
  );

  const gcName =
    normalizeName(
      value
    );

  if (
    !gcName
  ) {
    return;
  }

  const changed =
    prepareGCName(
      data,
      gcName
    );

  if (
    !changed
  ) {
    return;
  }

  saveData(
    data
  );

  const success =
    await setGCNameOnce(
      api,
      threadID,
      data,
      gcName
    );

  if (
    success
  ) {
    data.gcNameLock =
      true;

    saveData(
      data
    );

    await safeSend(
      api,
      "✅ GC name saved.",
      threadID
    );
  }
}

async function commandSetNickFinal(
  api,
  event,
  data
) {
  try {
    await commandSetNickStable(
      api,
      event,
      data
    );
  } catch (error) {
    console.error(
      "[RYUK] setnick:",
      error.message ||
        error
    );
  }
}

async function commandSetGCNameFinal(
  api,
  event,
  data
) {
  try {
    await commandSetGCNameStable(
      api,
      event,
      data
    );
  } catch (error) {
    console.error(
      "[RYUK] setgname:",
      error.message ||
        error
    );
  }
      }function getRestoreState(
  data,
  threadID
) {
  const key =
    getThreadKey(
      threadID
    );

  return {
    nicknameLocked:
      Boolean(
        data.nicknameLock
      ),
    gcNameLocked:
      Boolean(
        data.gcNameLock
      ),
    nickname:
      getStoredNickname(
        data
      ),
    gcName:
      getStoredGCName(
        data
      ),
    lastNickname:
      lastNicknameRestore[
        key
      ] || 0,
    lastGCName:
      lastGCNameRestore[
        key
      ] || 0
  };
}

function markNicknameRestore(
  threadID
) {
  const key =
    getThreadKey(
      threadID
    );

  lastNicknameRestore[
    key
  ] = Date.now();
}

function markGCNameRestore(
  threadID
) {
  const key =
    getThreadKey(
      threadID
    );

  lastGCNameRestore[
    key
  ] = Date.now();
}

function clearRestoreTimers(
  threadID
) {
  const key =
    getThreadKey(
      threadID
    );

  const nicknameKey =
    "nick:" + key;

  const gcNameKey =
    "gname:" + key;

  if (
    pendingRestore[
      nicknameKey
    ]
  ) {
    clearTimeout(
      pendingRestore[
        nicknameKey
      ]
    );

    delete pendingRestore[
      nicknameKey
    ];
  }

  if (
    pendingRestore[
      gcNameKey
    ]
  ) {
    clearTimeout(
      pendingRestore[
        gcNameKey
      ]
    );

    delete pendingRestore[
      gcNameKey
    ];
  }
}

function scheduleStableNicknameRestore(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (
    !threadID ||
    !data.nicknameLock
  ) {
    return;
  }

  const key =
    getThreadKey(
      threadID
    );

  const restoreKey =
    "nick:" + key;

  if (
    pendingRestore[
      restoreKey
    ]
  ) {
    return;
  }

  const timer =
    setTimeout(
      async () => {
        delete pendingRestore[
          restoreKey
        ];

        try {
          const latest =
            ensureRuntimeData(
              loadData()
            );

          if (
            !latest.nicknameLock
          ) {
            return;
          }

          markNicknameRestore(
            threadID
          );

          await applyNickname(
            api,
            threadID,
            latest,
            true
          );
        } catch (error) {
          console.error(
            "[RYUK] stable nickname restore:",
            error.message ||
              error
          );
        }
      },
      RESTORE_DELAY
    );

  pendingRestore[
    restoreKey
  ] = timer;
}

function scheduleStableGCNameRestore(
  api,
  event,
  data
) {
  const threadID =
    getThreadID(event);

  if (
    !threadID ||
    !data.gcNameLock
  ) {
    return;
  }

  const key =
    getThreadKey(
      threadID
    );

  const restoreKey =
    "gname:" + key;

  if (
    pendingRestore[
      restoreKey
    ]
  ) {
    return;
  }

  const timer =
    setTimeout(
      async () => {
        delete pendingRestore[
          restoreKey
        ];

        try {
          const latest =
            ensureRuntimeData(
              loadData()
            );

          if (
            !latest.gcNameLock
          ) {
            return;
          }

          markGCNameRestore(
            threadID
          );

          await applyGCName(
            api,
            threadID,
            latest,
            true
          );
        } catch (error) {
          console.error(
            "[RYUK] stable GC name restore:",
            error.message ||
              error
          );
        }
      },
      RESTORE_DELAY
    );

  pendingRestore[
    restoreKey
  ] = timer;
      }function isNicknameRestoreEventFinal(
  event
) {
  if (
    !event
  ) {
    return false;
  }

  const type =
    String(
      event.logMessageType ||
        event.type ||
        ""
    ).toLowerCase();

  return (
    type.includes(
      "nickname"
    ) ||
    type.includes(
      "nick"
    )
  );
}

function isGroupNameRestoreEventFinal(
  event
) {
  if (
    !event
  ) {
    return false;
  }

  const type =
    String(
      event.logMessageType ||
        event.type ||
        ""
    ).toLowerCase();

  return (
    type.includes(
      "title"
    ) ||
    type.includes(
      "group_name"
    ) ||
    type.includes(
      "gname"
    )
  );
}

function isRestoreChangeEventFinal(
  event
) {
  return (
    isNicknameRestoreEventFinal(
      event
    ) ||
    isGroupNameRestoreEventFinal(
      event
    )
  );
}

async function processStableRestoreFinal(
  api,
  event
) {
  try {
    if (
      !api ||
      !event
    ) {
      return;
    }

    if (
      !isRestoreChangeEventFinal(
        event
      )
    ) {
      return;
    }

    const threadID =
      getThreadID(event);

    if (
      !threadID
    ) {
      return;
    }

    const data =
      ensureRuntimeData(
        loadData()
      );

    if (
      isGroupNameRestoreEventFinal(
        event
      ) &&
      data.gcNameLock
    ) {
      scheduleStableGCNameRestore(
        api,
        event,
        data
      );
    }

    if (
      isNicknameRestoreEventFinal(
        event
      ) &&
      data.nicknameLock
    ) {
      const changedUserID =
        getChangedNicknameUserID(
          event
        );

      const botID =
        getBotID(api);

      if (
        !changedUserID ||
        !botID ||
        String(
          changedUserID
        ) === String(
          botID
        )
      ) {
        return;
      }

      scheduleStableNicknameRestore(
        api,
        event,
        data
      );
    }

  } catch (error) {
    console.error(
      "[RYUK] restore event:",
      error.message ||
        error
    );
  }
}

function normalizeEventTypeFinal(
  event
) {
  if (
    !event
  ) {
    return "";
  }

  return String(
    event.logMessageType ||
      event.type ||
      ""
  )
    .toLowerCase()
    .trim();
}

function isMessageEventFinal(
  event
) {
  if (
    !event
  ) {
    return false;
  }

  if (
    isRestoreChangeEventFinal(
      event
    )
  ) {
    return false;
  }

  return Boolean(
    event.body ||
      event.messageID
  );
}

function isCommandMessageFinal(
  event
) {
  const body =
    getBody(event);

  return (
    body.startsWith(
      "/ryuk"
    ) ||
    body.startsWith(
      "/RYUK"
    )
  );
        }async function processFinalMessage(
  api,
  event
) {
  try {
    if (
      !api ||
      !event
    ) {
      return;
    }

    if (
      !isMessageEventFinal(
        event
      )
    ) {
      return;
    }

    if (
      isCommandMessageFinal(
        event
      )
    ) {
      return;
    }

    const threadID =
      getThreadID(event);

    const senderID =
      getSenderID(event);

    const messageID =
      getMessageID(event);

    if (
      !threadID ||
      !senderID
    ) {
      return;
    }

    if (
      messageID &&
      alreadyProcessed(
        messageID
      )
    ) {
      return;
    }

    if (
      messageID
    ) {
      rememberMessage(
        messageID
      );
    }

    const data =
      ensureRuntimeData(
        loadData()
      );

    if (
      !data.active
    ) {
      return;
    }

    if (
      isAdmin(
        senderID
      )
    ) {
      return;
    }

    if (
      isSpam(
        senderID
      )
    ) {
      return;
    }

    if (
      !isTargetUser(
        data,
        threadID,
        senderID
      )
    ) {
      return;
    }

    const shouldReply =
      shouldAutoReply(
        data,
        event,
        threadID,
        senderID
      );

    const shouldReact =
      shouldAutoReact(
        data,
        event,
        threadID,
        senderID
      );

    if (
      shouldReact &&
      messageID
    ) {
      const reaction =
        getAutoReaction();

      const success =
        await safeReaction(
          api,
          reaction,
          messageID
        );

      if (
        success
      ) {
        data.reactionCount =
          Number(
            data.reactionCount
          ) + 1;

        saveData(
          data
        );
      }
    }

    if (
      shouldReply
    ) {
      const reply =
        getAutoReply();

      const success =
        await safeSend(
          api,
          reply,
          threadID,
          messageID
        );

      if (
        success
      ) {
        data.replyCount =
          Number(
            data.replyCount
          ) + 1;

        saveData(
          data
        );
      }
    }

  } catch (error) {
    console.error(
      "[RYUK] message:",
      error.message ||
        error
    );
  }
}

async function processFinalEvent(
  api,
  event
) {
  try {
    if (
      !api ||
      !event
    ) {
      return;
    }

    if (
      isRestoreChangeEventFinal(
        event
      )
    ) {
      await processStableRestoreFinal(
        api,
        event
      );

      return;
    }

    if (
      isMessageEventFinal(
        event
      )
    ) {
      await processFinalMessage(
        api,
        event
      );
    }

  } catch (error) {
    console.error(
      "[RYUK] event:",
      error.message ||
        error
    );
  }
      }function cleanupFinalRuntime() {
  const current =
    Date.now();

  const cleanupMap = (
    map,
    timeout
  ) => {
    if (
      !map ||
      typeof map !==
        "object"
    ) {
      return;
    }

    for (
      const key of Object.keys(
        map
      )
    ) {
      const value =
        Number(
          map[key]
        ) || 0;

      if (
        current - value >
        timeout
      ) {
        delete map[key];
      }
    }
  };

  cleanupMap(
    lastReply,
    60000
  );

  cleanupMap(
    lastReaction,
    60000
  );

  cleanupMap(
    lastNicknameRestore,
    60000
  );

  cleanupMap(
    lastGCNameRestore,
    60000
  );

  cleanupMap(
    recentMessages,
    60000
  );

  cleanupMap(
    spamTracker,
    SPAM_WINDOW + 60000
  );
}

function ensureFinalData() {
  try {
    const data =
      ensureRuntimeData(
        loadData()
      );

    if (
      !data.target ||
      typeof data.target !==
        "object"
    ) {
      data.target = {};
    }

    if (
      typeof data.active !==
      "boolean"
    ) {
      data.active = false;
    }

    if (
      typeof data.autoReply !==
      "boolean"
    ) {
      data.autoReply = true;
    }

    if (
      typeof data.autoReact !==
      "boolean"
    ) {
      data.autoReact = true;
    }

    if (
      typeof data.nicknameLock !==
      "boolean"
    ) {
      data.nicknameLock = false;
    }

    if (
      typeof data.gcNameLock !==
      "boolean"
    ) {
      data.gcNameLock = false;
    }

    if (
      typeof data.nickname !==
      "string" ||
      !data.nickname.trim()
    ) {
      data.nickname =
        DEFAULT_NICKNAME;
    }

    if (
      typeof data.gcName !==
      "string" ||
      !data.gcName.trim()
    ) {
      data.gcName =
        DEFAULT_GC_NAME;
    }

    const counters = [
      "replyCount",
      "reactionCount",
      "nicknameCount",
      "gcNameCount",
      "gcNameRestores",
      "restoreCount",
      "errorCount"
    ];

    for (
      const key of counters
    ) {
      if (
        typeof data[key] !==
          "number" ||
        !Number.isFinite(
          data[key]
        )
      ) {
        data[key] = 0;
      }
    }

    saveData(
      data
    );

    return data;

  } catch (error) {
    console.error(
      "[RYUK] final data check:",
      error.message ||
        error
    );

    return cloneDefaultData();
  }
}

ensureFinalData();

setInterval(
  () => {
    try {
      cleanupFinalRuntime();
    } catch (error) {
      console.error(
        "[RYUK] final cleanup:",
        error.message ||
          error
      );
    }
  },
  60000
);

module.exports.handleEvent =
  async function({
    api,
    event
  }) {
    try {
      if (
        !api ||
        !event
      ) {
        return;
      }

      if (
        isRyukCommand(
          event
        )
      ) {
        if (
          adminCommandAllowed(
            event
          )
        ) {
          await executeRyukCommand(
            api,
            event
          );
        }

        return;
      }

      await processFinalEvent(
        api,
        event
      );

    } catch (error) {
      console.error(
        "[RYUK] final handler:",
        error.message ||
          error
      );
    }
  };module.exports.onLoad =
  function({
    api
  }) {
    try {
      ensureFinalData();

      if (
        api &&
        typeof api.getCurrentUserID ===
          "function"
      ) {
        const botID =
          api.getCurrentUserID();

        if (
          botID
        ) {
          console.log(
            "[RYUK] RYUK loaded successfully:",
            String(botID)
          );
        }
      }
    } catch (error) {
      console.error(
        "[RYUK] onLoad:",
        error.message ||
          error
      );
    }
  };

process.on(
  "uncaughtException",
  error => {
    console.error(
      "[RYUK] uncaughtException:",
      error &&
        (
          error.message ||
          error
        )
    );

    try {
      const data =
        ensureRuntimeData(
          loadData()
        );

      data.errorCount =
        Number(
          data.errorCount
        ) + 1;

      saveData(
        data
      );
    } catch (_) {}
  }
);

process.on(
  "unhandledRejection",
  error => {
    console.error(
      "[RYUK] unhandledRejection:",
      error &&
        (
          error.message ||
          error
        )
    );

    try {
      const data =
        ensureRuntimeData(
          loadData()
        );

      data.errorCount =
        Number(
          data.errorCount
        ) + 1;

      saveData(
        data
      );
    } catch (_) {}
  }
);

setInterval(
  () => {
    try {
      const data =
        ensureRuntimeData(
          loadData()
        );

      saveData(
        data
      );
    } catch (error) {
      console.error(
        "[RYUK] periodic save:",
        error.message ||
          error
      );
    }
  },
  300000
);

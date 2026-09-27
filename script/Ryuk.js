const fs = require("fs");
const path = require("path");

const BOT_NAME = "ryuk";
const VERSION = "2.0.0";

const DATA_FILE = path.join(
  __dirname,
  "ryuk_data.json"
);

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const DEFAULT_NICKNAME =
  "RYUK POGI ON TOP";

const DEFAULT_GC_NAME =
  "RYUK POGI ON TOP";

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  lockEnabled: false,
  nicknameLock: false,
  gcNameLock: false,

  targetEnabled: false,
  targetUserID: "",

  targetNickname:
    DEFAULT_NICKNAME,

  targetGCName:
    DEFAULT_GC_NAME,

  delay: 2000,

  totalReplies: 0,
  totalReactions: 0,
  totalNickRepairs: 0,
  totalTitleRepairs: 0,
  totalCommands: 0,

  threads: {}
};

const MESSAGE_COOLDOWN = 6000;
const COMMAND_COOLDOWN = 2500;
const EVENT_COOLDOWN = 3000;

const MIN_DELAY = 1500;
const MAX_DELAY = 10000;

const VERIFY_INTERVAL = 20000;

const MAX_SEEN_MESSAGES = 3000;
const MAX_PENDING_REPLIES = 50;

const USER_COOLDOWN =
  new Map();

const COMMAND_COOLDOWN_MAP =
  new Map();

const EVENT_COOLDOWN_MAP =
  new Map();

const SEEN_MESSAGES =
  new Set();

const PENDING_REPLIES =
  new Map();

const VERIFY_TIMERS =
  new Map();

const LAST_NICK_REPAIR =
  new Map();

const LAST_TITLE_REPAIR =
  new Map();

const LOCK_LINES = [
  "👑 RYUK POGI ON TOP.",
  "🛡️ GC protection is active.",
  "⚡ Group settings restored.",
  "🔥 RYUK mode is active.",
  "👑 Protected settings restored.",
  "🛡️ Nickname protection is active.",
  "⚡ Group title protection is active.",
  "💀 RYUK is watching the group.",
  "👑 RYUK POGI ON TOP mode enabled.",
  "🔒 Protected configuration restored."
];

const RYUK_QUOTES = [
  "👑 RYUK POGI ON TOP.",
  "⚡ RYUK mode activated.",
  "🛡️ System is watching the group.",
  "🔥 RYUK is online.",
  "💀 Message received.",
  "👑 RYUK is here.",
  "⚡ Stay calm. RYUK is active.",
  "🛡️ Protected mode is running.",
  "🔥 RYUK system online.",
  "👑 RYUK POGI mode."
];

let lockLineIndex = 0;

function getNextLockLine() {
  if (
    !Array.isArray(LOCK_LINES) ||
    LOCK_LINES.length === 0
  ) {
    return "👑 RYUK POGI ON TOP.";
  }

  const line =
    LOCK_LINES[lockLineIndex];

  lockLineIndex =
    (lockLineIndex + 1) %
    LOCK_LINES.length;

  return line;
}

function randomQuote() {
  if (
    !Array.isArray(RYUK_QUOTES) ||
    RYUK_QUOTES.length === 0
  ) {
    return "👑 RYUK POGI ON TOP.";
  }

  const index =
    Math.floor(
      Math.random() *
      RYUK_QUOTES.length
    );

  return RYUK_QUOTES[index];
}

function isAdmin(senderID) {
  return ADMIN_IDS.includes(
    String(senderID)
  );
}

function safeString(
  value,
  fallback = ""
) {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return String(value).trim();
}

function safeNumber(
  value,
  fallback,
  minimum,
  maximum
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  if (number < minimum) {
    return minimum;
  }

  if (number > maximum) {
    return maximum;
  }

  return number;
}

function createDefaultData() {
  return {
    ...DEFAULT_DATA,
    threads: {}
  };
  }function loadSystemData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const fresh =
        createDefaultData();

      saveSystemData(fresh);

      return fresh;
    }

    const raw =
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      );

    if (!raw.trim()) {
      return createDefaultData();
    }

    const saved =
      JSON.parse(raw);

    const data = {
      ...createDefaultData(),
      ...saved
    };

    if (
      !data.threads ||
      typeof data.threads !== "object"
    ) {
      data.threads = {};
    }

    return data;

  } catch (error) {
    console.error(
      "[RYUK] DATA LOAD ERROR:",
      error.message
    );

    return createDefaultData();
  }
}

function saveSystemData(data) {
  try {
    data.updatedAt =
      Date.now();

    const temporaryFile =
      `${DATA_FILE}.tmp`;

    fs.writeFileSync(
      temporaryFile,
      JSON.stringify(
        data,
        null,
        2
      ),
      "utf8"
    );

    fs.renameSync(
      temporaryFile,
      DATA_FILE
    );

    return true;

  } catch (error) {
    console.error(
      "[RYUK] DATA SAVE ERROR:",
      error.message
    );

    try {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
          data,
          null,
          2
        ),
        "utf8"
      );

      return true;

    } catch (secondError) {
      console.error(
        "[RYUK] BACKUP SAVE ERROR:",
        secondError.message
      );

      return false;
    }
  }
}

function getThreadData(
  data,
  threadID
) {
  const id =
    String(threadID);

  if (!data.threads[id]) {
    data.threads[id] = {
      active: data.active,
      autoReact: data.autoReact,

      lockEnabled:
        data.lockEnabled,

      nicknameLock:
        data.nicknameLock,

      gcNameLock:
        data.gcNameLock,

      targetEnabled:
        data.targetEnabled,

      targetUserID:
        data.targetUserID,

      targetNickname:
        data.targetNickname,

      targetGCName:
        data.targetGCName,

      delay:
        data.delay,

      totalReplies: 0,
      totalReactions: 0,
      totalNickRepairs: 0,
      totalTitleRepairs: 0
    };
  }

  return data.threads[id];
}

function rememberMessage(
  messageID
) {
  if (!messageID) {
    return false;
  }

  const id =
    String(messageID);

  if (
    SEEN_MESSAGES.has(id)
  ) {
    return false;
  }

  SEEN_MESSAGES.add(id);

  if (
    SEEN_MESSAGES.size >
    MAX_SEEN_MESSAGES
  ) {
    const oldest =
      SEEN_MESSAGES
        .values()
        .next()
        .value;

    if (oldest) {
      SEEN_MESSAGES.delete(
        oldest
      );
    }
  }

  return true;
}

function wait(ms) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}

function commandAllowed(
  threadID,
  senderID
) {
  const key =
    `${threadID}:${senderID}`;

  const now =
    Date.now();

  const previous =
    COMMAND_COOLDOWN_MAP
      .get(key) || 0;

  if (
    now - previous <
    COMMAND_COOLDOWN
  ) {
    return false;
  }

  COMMAND_COOLDOWN_MAP.set(
    key,
    now
  );

  return true;
}

function messageAllowed(
  threadID,
  senderID
) {
  const key =
    `${threadID}:${senderID}`;

  const now =
    Date.now();

  const previous =
    USER_COOLDOWN
      .get(key) || 0;

  if (
    now - previous <
    MESSAGE_COOLDOWN
  ) {
    return false;
  }

  USER_COOLDOWN.set(
    key,
    now
  );

  return true;
}

function eventAllowed(key) {
  const now =
    Date.now();

  const previous =
    EVENT_COOLDOWN_MAP
      .get(key) || 0;

  if (
    now - previous <
    EVENT_COOLDOWN
  ) {
    return false;
  }

  EVENT_COOLDOWN_MAP.set(
    key,
    now
  );

  return true;
}

function isTargetUser(
  threadData,
  senderID
) {
  if (
    !threadData.targetEnabled
  ) {
    return false;
  }

  if (
    !threadData.targetUserID
  ) {
    return false;
  }

  return (
    String(
      threadData.targetUserID
    ) ===
    String(senderID)
  );
}

function shouldReplyToUser(
  threadData,
  senderID
) {
  if (!threadData.active) {
    return false;
  }

  if (
    threadData.targetEnabled
  ) {
    return isTargetUser(
      threadData,
      senderID
    );
  }

  return true;
}function safeSend(
  api,
  message,
  threadID,
  messageID = null
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

        api.sendMessage(
          String(message),
          threadID,
          error => {
            resolve(!error);
          },
          messageID || undefined
        );

      } catch (error) {
        console.error(
          "[RYUK] SEND ERROR:",
          error.message
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

        api.setMessageReaction(
          reaction,
          messageID,
          error => {
            resolve(!error);
          },
          true
        );

      } catch (error) {
        resolve(false);
      }
    }
  );
}

function safeChangeNickname(
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

        api.changeNickname(
          nickname,
          threadID,
          userID,
          error => {
            resolve(!error);
          }
        );

      } catch (error) {
        console.error(
          "[RYUK] NICKNAME ERROR:",
          error.message
        );

        resolve(false);
      }
    }
  );
}

function safeSetTitle(
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

        api.setTitle(
          title,
          threadID,
          error => {
            resolve(!error);
          }
        );

      } catch (error) {
        console.error(
          "[RYUK] TITLE ERROR:",
          error.message
        );

        resolve(false);
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
          resolve(null);
          return;
        }

        api.getThreadInfo(
          threadID,
          (error, info) => {
            if (
              error ||
              !info
            ) {
              resolve(null);
              return;
            }

            resolve(info);
          }
        );

      } catch (error) {
        console.error(
          "[RYUK] THREAD INFO ERROR:",
          error.message
        );

        resolve(null);
      }
    }
  );
}

function safeTyping(
  api,
  threadID,
  state
) {
  try {
    if (
      api &&
      typeof api.sendTypingIndicator ===
        "function"
    ) {
      api.sendTypingIndicator(
        threadID,
        state
      );
    }
  } catch (error) {
    // Ignore typing indicator errors.
  }
}

function getBotID(api) {
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
  } catch (error) {
    return "";
  }

  return "";
}

function cleanupCooldownMaps() {
  const now =
    Date.now();

  for (
    const [
      key,
      timestamp
    ] of USER_COOLDOWN
  ) {
    if (
      now - timestamp >
      MESSAGE_COOLDOWN * 10
    ) {
      USER_COOLDOWN.delete(
        key
      );
    }
  }

  for (
    const [
      key,
      timestamp
    ] of COMMAND_COOLDOWN_MAP
  ) {
    if (
      now - timestamp >
      COMMAND_COOLDOWN * 10
    ) {
      COMMAND_COOLDOWN_MAP.delete(
        key
      );
    }
  }

  for (
    const [
      key,
      timestamp
    ] of EVENT_COOLDOWN_MAP
  ) {
    if (
      now - timestamp >
      EVENT_COOLDOWN * 10
    ) {
      EVENT_COOLDOWN_MAP.delete(
        key
      );
    }
  }
}

function cleanupPendingReplies() {
  const now =
    Date.now();

  for (
    const [
      key,
      timestamp
    ] of PENDING_REPLIES
  ) {
    if (
      now - timestamp >
      30000
    ) {
      PENDING_REPLIES.delete(
        key
      );
    }
  }
}

setInterval(
  () => {
    cleanupCooldownMaps();
    cleanupPendingReplies();
  },
  60000
);

module.exports.config = {
  name: BOT_NAME,
  version: VERSION,
  hasPermission: 0,
  credits: "RYUK",
  description:
    "RYUK auto reply, target mode and GC protection.",
  commandCategory: "utility",
  usePrefix: true,
  cooldowns: 2
};async function repairNickname(
  api,
  threadID,
  userID,
  nickname,
  data
) {
  if (
    !userID ||
    !nickname
  ) {
    return false;
  }

  const key =
    `${threadID}:${userID}`;

  const now =
    Date.now();

  const last =
    LAST_NICK_REPAIR.get(
      key
    ) || 0;

  if (
    now - last <
    VERIFY_INTERVAL
  ) {
    return false;
  }

  LAST_NICK_REPAIR.set(
    key,
    now
  );

  const success =
    await safeChangeNickname(
      api,
      nickname,
      threadID,
      userID
    );

  if (success) {
    data.totalNickRepairs =
      Number(
        data.totalNickRepairs || 0
      ) + 1;

    const threadData =
      getThreadData(
        data,
        threadID
      );

    threadData.totalNickRepairs =
      Number(
        threadData.totalNickRepairs || 0
      ) + 1;

    return true;
  }

  return false;
}

async function repairGroupTitle(
  api,
  threadID,
  title,
  data
) {
  if (
    !threadID ||
    !title
  ) {
    return false;
  }

  const now =
    Date.now();

  const last =
    LAST_TITLE_REPAIR.get(
      threadID
    ) || 0;

  if (
    now - last <
    VERIFY_INTERVAL
  ) {
    return false;
  }

  LAST_TITLE_REPAIR.set(
    threadID,
    now
  );

  const success =
    await safeSetTitle(
      api,
      title,
      threadID
    );

  if (success) {
    data.totalTitleRepairs =
      Number(
        data.totalTitleRepairs || 0
      ) + 1;

    const threadData =
      getThreadData(
        data,
        threadID
      );

    threadData.totalTitleRepairs =
      Number(
        threadData.totalTitleRepairs || 0
      ) + 1;

    return true;
  }

  return false;
}

async function applyTargetNickname(
  api,
  threadID,
  targetID,
  nickname,
  data
) {
  if (
    !targetID ||
    !nickname
  ) {
    return false;
  }

  return repairNickname(
    api,
    threadID,
    targetID,
    nickname,
    data
  );
}

async function verifyThread(
  api,
  threadID
) {
  try {
    const data =
      loadSystemData();

    const threadData =
      getThreadData(
        data,
        threadID
      );

    if (
      !threadData.lockEnabled
    ) {
      return;
    }

    const info =
      await getThreadInfo(
        api,
        threadID
      );

    if (!info) {
      return;
    }

    if (
      threadData.gcNameLock &&
      threadData.targetGCName
    ) {
      const currentName =
        safeString(
          info.threadName,
          ""
        );

      if (
        currentName &&
        currentName !==
          threadData.targetGCName
      ) {
        await repairGroupTitle(
          api,
          threadID,
          threadData.targetGCName,
          data
        );
      }
    }

    if (
      threadData.nicknameLock &&
      threadData.targetNickname
    ) {
      if (
        threadData.targetEnabled &&
        threadData.targetUserID
      ) {
        await applyTargetNickname(
          api,
          threadID,
          threadData.targetUserID,
          threadData.targetNickname,
          data
        );
      }
    }

    saveSystemData(data);

  } catch (error) {
    console.error(
      "[RYUK] VERIFY ERROR:",
      error.message
    );
  }
}

function startVerification(
  api,
  threadID
) {
  const id =
    String(threadID);

  if (
    VERIFY_TIMERS.has(id)
  ) {
    return;
  }

  const timer =
    setInterval(
      () => {
        verifyThread(
          api,
          id
        ).catch(
          error => {
            console.error(
              "[RYUK] TIMER ERROR:",
              error.message
            );
          }
        );
      },
      VERIFY_INTERVAL
    );

  VERIFY_TIMERS.set(
    id,
    timer
  );
}

function stopVerification(
  threadID
) {
  const id =
    String(threadID);

  const timer =
    VERIFY_TIMERS.get(id);

  if (timer) {
    clearInterval(timer);

    VERIFY_TIMERS.delete(
      id
    );
  }
}

async function enableLock(
  api,
  threadID,
  threadData,
  data
) {
  threadData.lockEnabled =
    true;

  threadData.nicknameLock =
    true;

  threadData.gcNameLock =
    true;

  if (
    !threadData.targetNickname
  ) {
    threadData.targetNickname =
      DEFAULT_NICKNAME;
  }

  if (
    !threadData.targetGCName
  ) {
    threadData.targetGCName =
      DEFAULT_GC_NAME;
  }

  saveSystemData(data);

  await safeSetTitle(
    api,
    threadData.targetGCName,
    threadID
  );

  await wait(500);

  if (
    threadData.targetEnabled &&
    threadData.targetUserID
  ) {
    await applyTargetNickname(
      api,
      threadID,
      threadData.targetUserID,
      threadData.targetNickname,
      data
    );
  }

  saveSystemData(data);

  startVerification(
    api,
    threadID
  );
}

function disableLock(
  threadID,
  data
) {
  const threadData =
    getThreadData(
      data,
      threadID
    );

  threadData.lockEnabled =
    false;

  threadData.nicknameLock =
    false;

  threadData.gcNameLock =
    false;

  stopVerification(
    threadID
  );

  saveSystemData(data);
        }function getHelpMessage() {
  return `
👑 RYUK CONTROL PANEL
━━━━━━━━━━━━━━━━━━━━

📌 BASIC COMMANDS

/ryuk help
Show all commands.

/ryuk status
Show current status.

/ryuk on
Enable auto reply.

/ryuk off
Disable auto reply.


🔥 REACTION

/ryuk reacton
Enable auto reaction.

/ryuk reactoff
Disable auto reaction.


🔒 PROTECTION

/ryuk lock
Enable GC protection.

/ryuk unlock
Disable GC protection.

/ryuk setnick <name>
Set protected nickname.

/ryuk setgname <name>
Set protected group name.


🎯 TARGET MODE

/ryuk target <uid>
Target one specific user.

/ryuk target off
Disable target mode.

/ryuk target status
Show target settings.


⏱️ DELAY

/ryuk delay <milliseconds>
Change reply delay.


🔄 RESET

/ryuk resettarget
Remove saved target.


━━━━━━━━━━━━━━━━━━━━
👑 RYUK ${VERSION}
━━━━━━━━━━━━━━━━━━━━
`;
}

function getStatusMessage(
  data,
  threadData
) {
  const target =
    threadData.targetEnabled &&
    threadData.targetUserID
      ? threadData.targetUserID
      : "OFF";

  return `
👑 RYUK SYSTEM STATUS
━━━━━━━━━━━━━━━━━━━━

🤖 Auto Reply:
${
  threadData.active
    ? "🟢 ON"
    : "🔴 OFF"
}

🔥 Auto Reaction:
${
  threadData.autoReact
    ? "🟢 ON"
    : "🔴 OFF"
}

🔒 Protection:
${
  threadData.lockEnabled
    ? "🟢 ON"
    : "🔴 OFF"
}

👤 Nickname Lock:
${
  threadData.nicknameLock
    ? "🟢 ON"
    : "🔴 OFF"
}

🏷️ Group Name Lock:
${
  threadData.gcNameLock
    ? "🟢 ON"
    : "🔴 OFF"
}

🎯 Target:
${target}

👤 Protected Nickname:
${
  threadData.targetNickname ||
  "NONE"
}

🏷️ Protected Group Name:
${
  threadData.targetGCName ||
  "NONE"
}

⏱️ Reply Delay:
${threadData.delay} ms

💬 Replies:
${
  threadData.totalReplies || 0
}

🔥 Reactions:
${
  threadData.totalReactions || 0
}

🛡️ Nickname Repairs:
${
  threadData.totalNickRepairs || 0
}

🏷️ Title Repairs:
${
  threadData.totalTitleRepairs || 0
}

━━━━━━━━━━━━━━━━━━━━
👑 RYUK ${VERSION}
━━━━━━━━━━━━━━━━━━━━
`;
}

function getTargetStatus(
  threadData
) {
  if (
    !threadData.targetEnabled
  ) {
    return `
🎯 TARGET MODE

🔴 DISABLED

Walang specific user
na tina-target ng bot.

Use:

/ryuk target <uid>

para mag-set ng target.
`;
  }

  return `
🎯 TARGET MODE

🟢 ENABLED

Target User ID:
${
  threadData.targetUserID ||
  "NONE"
}

Target Nickname:
${
  threadData.targetNickname ||
  "NONE"
}

Kapag enabled ang target
mode, ang automatic reply
ay para lamang sa target
user.
`;
}

function parseDelay(
  value
) {
  return safeNumber(
    value,
    2000,
    MIN_DELAY,
    MAX_DELAY
  );
}

function getRemainingCooldown(
  map,
  key,
  cooldown
) {
  const last =
    map.get(key) || 0;

  const elapsed =
    Date.now() - last;

  const remaining =
    cooldown - elapsed;

  return Math.max(
    0,
    remaining
  );
}

async function commandReply(
  api,
  message,
  threadID,
  messageID
) {
  return safeSend(
    api,
    message,
    threadID,
    messageID
  );
}

function normalizeCommand(
  value
) {
  return safeString(
    value,
    "help"
  ).toLowerCase();
}

function joinArguments(
  args,
  start = 1
) {
  if (
    !Array.isArray(args)
  ) {
    return "";
  }

  return args
    .slice(start)
    .join(" ")
    .trim();
}module.exports.handleEvent =
async function ({
  api,
  event
}) {
  try {
    if (!event) {
      return;
    }

    const threadID =
      event.threadID;

    const senderID =
      event.senderID;

    const messageID =
      event.messageID;

    if (!threadID) {
      return;
    }

    const data =
      loadSystemData();

    const threadData =
      getThreadData(
        data,
        threadID
      );

    // ==========================================
    // GROUP NAME CHANGE
    // ==========================================

    if (
      event.logMessageType ===
      "log:thread-name"
    ) {
      if (
        threadData.lockEnabled &&
        threadData.gcNameLock &&
        threadData.targetGCName
      ) {
        const key =
          `title:${threadID}`;

        if (
          eventAllowed(key)
        ) {
          await wait(500);

          await repairGroupTitle(
            api,
            threadID,
            threadData.targetGCName,
            data
          );

          saveSystemData(
            data
          );
        }
      }

      return;
    }

    // ==========================================
    // NICKNAME CHANGE
    // ==========================================

    if (
      event.logMessageType ===
      "log:user-nickname"
    ) {
      if (
        !threadData.lockEnabled ||
        !threadData.nicknameLock
      ) {
        return;
      }

      const eventData =
        event.logMessageData ||
        {};

      const participantID =
        eventData.participant_id ||
        eventData.participantID ||
        eventData.user_id ||
        eventData.userID;

      if (!participantID) {
        return;
      }

      // Target mode:
      // only repair the selected user.
      if (
        threadData.targetEnabled
      ) {
        if (
          String(participantID) !==
          String(
            threadData.targetUserID
          )
        ) {
          return;
        }
      }

      const key =
        `nick:${threadID}:${participantID}`;

      if (
        !eventAllowed(key)
      ) {
        return;
      }

      await wait(500);

      await repairNickname(
        api,
        threadID,
        participantID,
        threadData.targetNickname,
        data
      );

      saveSystemData(
        data
      );

      return;
    }

    // ==========================================
    // NEW MEMBER
    // ==========================================

    if (
      event.logMessageType ===
      "log:subscribe"
    ) {
      if (
        !threadData.lockEnabled ||
        !threadData.nicknameLock
      ) {
        return;
      }

      const added =
        event.logMessageData &&
        event.logMessageData
          .addedParticipants;

      if (
        !Array.isArray(added)
      ) {
        return;
      }

      for (
        const member of added
      ) {
        const uid =
          member.userFbId ||
          member.userID ||
          member.id;

        if (!uid) {
          continue;
        }

        // If target mode is enabled,
        // don't modify other members.
        if (
          threadData.targetEnabled &&
          String(uid) !==
            String(
              threadData.targetUserID
            )
        ) {
          continue;
        }

        await wait(800);

        await repairNickname(
          api,
          threadID,
          uid,
          threadData.targetNickname,
          data
        );
      }

      saveSystemData(
        data
      );

      return;
    }

    // ==========================================
    // NORMAL MESSAGE
    // ==========================================

    if (
      !senderID ||
      !messageID
    ) {
      return;
    }

    const botID =
      getBotID(api);

    const sender =
      String(senderID);

    if (
      botID &&
      sender === botID
    ) {
      return;
    }

    if (
      !rememberMessage(
        messageID
      )
    ) {
      return;
    }

    // Target mode:
    // Ignore everyone except target.
    if (
      !shouldReplyToUser(
        threadData,
        sender
      )
    ) {
      return;
    }

    if (
      !messageAllowed(
        threadID,
        sender
      )
    ) {
      return;
    }

    // ==========================================
    // AUTO REACTION
    // ==========================================

    if (
      threadData.autoReact
    ) {
      const reacted =
        await safeReaction(
          api,
          "🔥",
          messageID
        );

      if (reacted) {
        data.totalReactions =
          Number(
            data.totalReactions || 0
          ) + 1;

        threadData.totalReactions =
          Number(
            threadData.totalReactions || 0
          ) + 1;

        saveSystemData(
          data
        );
      }
    }

    // ==========================================
    // REPLY QUEUE LIMIT
    // ==========================================

    if (
      PENDING_REPLIES.size >=
      MAX_PENDING_REPLIES
    ) {
      return;
    }

    const delay =
      parseDelay(
        threadData.delay
      );

    const replyKey =
      `${threadID}:${sender}`;

    if (
      PENDING_REPLIES.has(
        replyKey
      )
    ) {
      return;
    }

    PENDING_REPLIES.set(
      replyKey,
      Date.now()
    );

    safeTyping(
      api,
      threadID,
      true
    );

    setTimeout(
      async () => {
        try {
          PENDING_REPLIES.delete(
            replyKey
          );

          safeTyping(
            api,
            threadID,
            false
          );

          const latestData =
            loadSystemData();

          const latestThread =
            getThreadData(
              latestData,
              threadID
            );

          if (
            !shouldReplyToUser(
              latestThread,
              sender
            )
          ) {
            return;
          }

          const reply =
            `👑 RYUK\n\n${randomQuote()}`;

          const sent =
            await safeSend(
              api,
              reply,
              threadID,
              messageID
            );

          if (sent) {
            latestThread.totalReplies =
              Number(
                latestThread.totalReplies || 0
              ) + 1;

            latestData.totalReplies =
              Number(
                latestData.totalReplies || 0
              ) + 1;

            saveSystemData(
              latestData
            );
          }

        } catch (error) {
          console.error(
            "[RYUK] REPLY ERROR:",
            error.message
          );
        }
      },
      delay
    );

  } catch (error) {
    console.error(
      "[RYUK] HANDLE EVENT ERROR:",
      error.message
    );
  }
};module.exports.run =
async function ({
  api,
  event,
  args
}) {
  try {
    if (!event) {
      return;
    }

    const threadID =
      event.threadID;

    const senderID =
      event.senderID;

    const messageID =
      event.messageID;

    if (!threadID) {
      return;
    }

    const data =
      loadSystemData();

    const threadData =
      getThreadData(
        data,
        threadID
      );

    const action =
      normalizeCommand(
        args && args[0]
          ? args[0]
          : "help"
      );

    // ==========================================
    // COMMAND COOLDOWN
    // ==========================================

    if (
      !commandAllowed(
        threadID,
        senderID
      )
    ) {
      return;
    }

    data.totalCommands =
      Number(
        data.totalCommands || 0
      ) + 1;

    // ==========================================
    // HELP
    // ==========================================

    if (
      action === "help"
    ) {
      return commandReply(
        api,
        getHelpMessage(),
        threadID,
        messageID
      );
    }

    // ==========================================
    // STATUS
    // ==========================================

    if (
      action === "status"
    ) {
      return commandReply(
        api,
        getStatusMessage(
          data,
          threadData
        ),
        threadID,
        messageID
      );
    }

    // ==========================================
    // TARGET STATUS
    // ==========================================

    if (
      action === "target" &&
      normalizeCommand(
        args[1]
      ) === "status"
    ) {
      return commandReply(
        api,
        getTargetStatus(
          threadData
        ),
        threadID,
        messageID
      );
    }

    // ==========================================
    // ADMIN CHECK
    // ==========================================

    const adminActions = [
      "on",
      "off",
      "reacton",
      "reactoff",
      "lock",
      "unlock",
      "setnick",
      "setgname",
      "target",
      "delay",
      "resettarget"
    ];

    if (
      adminActions.includes(
        action
      ) &&
      !isAdmin(senderID)
    ) {
      return commandReply(
        api,
        "⛔ Access denied.\n\nAdmin lang ang puwedeng gumamit ng command na ito.",
        threadID,
        messageID
      );
    }

    // ==========================================
    // ON
    // ==========================================

    if (
      action === "on"
    ) {
      threadData.active =
        true;

      data.active =
        true;

      saveSystemData(
        data
      );

      return commandReply(
        api,
        "🚀 RYUK ACTIVATED!\n\n👑 Auto-reply: ON",
        threadID,
        messageID
      );
    }

    // ==========================================
    // OFF
    // ==========================================

    if (
      action === "off"
    ) {
      threadData.active =
        false;

      data.active =
        false;

      saveSystemData(
        data
      );

      return commandReply(
        api,
        "🛑 RYUK DEACTIVATED!\n\nAuto-reply ay naka-off na.",
        threadID,
        messageID
      );
    }

    // ==========================================
    // REACTION ON
    // ==========================================

    if (
      action === "reacton"
    ) {
      threadData.autoReact =
        true;

      data.autoReact =
        true;

      saveSystemData(
        data
      );

      return commandReply(
        api,
        "🔥 Auto-reaction: ON",
        threadID,
        messageID
      );
    }

    // ==========================================
    // REACTION OFF
    // ==========================================

    if (
      action === "reactoff"
    ) {
      threadData.autoReact =
        false;

      data.autoReact =
        false;

      saveSystemData(
        data
      );

      return commandReply(
        api,
        "🔕 Auto-reaction: OFF",
        threadID,
        messageID
      );
    }

    // ==========================================
    // SET NICKNAME
    // ==========================================

    if (
      action === "setnick"
    ) {
      const nickname =
        joinArguments(
          args,
          1
        );

      if (!nickname) {
        return commandReply(
          api,
          "⚠️ Usage:\n/ryuk setnick <nickname>",
          threadID,
          messageID
        );
      }

      if (
        nickname.length > 80
      ) {
        return commandReply(
          api,
          "⚠️ Nickname is too long.",
          threadID,
          messageID
        );
      }

      threadData.targetNickname =
        nickname;

      data.targetNickname =
        nickname;

      saveSystemData(
        data
      );

      if (
        threadData.targetEnabled &&
        threadData.targetUserID
      ) {
        await repairNickname(
          api,
          threadID,
          threadData.targetUserID,
          nickname,
          data
        );
      }

      saveSystemData(
        data
      );

      return commandReply(
        api,
        `👤 Protected nickname saved:\n\n${nickname}`,
        threadID,
        messageID
      );
    }

    // ==========================================
    // SET GROUP NAME
    // ==========================================

    if (
      action === "setgname"
    ) {
      const groupName =
        joinArguments(
          args,
          1
        );

      if (!groupName) {
        return commandReply(
          api,
          "⚠️ Usage:\n/ryuk setgname <group name>",
          threadID,
          messageID
        );
      }

      if (
        groupName.length > 120
      ) {
        return commandReply(
          api,
          "⚠️ Group name is too long.",
          threadID,
          messageID
        );
      }

      threadData.targetGCName =
        groupName;

      data.targetGCName =
        groupName;

      saveSystemData(
        data
      );

      if (
        threadData.gcNameLock
      ) {
        await repairGroupTitle(
          api,
          threadID,
          groupName,
          data
        );
      }

      saveSystemData(
        data
      );

      return commandReply(
        api,
        `🏷️ Protected group name saved:\n\n${groupName}`,
        threadID,
        messageID
      );
        }    // ==========================================
    // LOCK
    // ==========================================

    if (action === "lock") {
      await enableLock(
        api,
        threadID,
        threadData,
        data
      );

      saveSystemData(data);

      return commandReply(
        api,
        "🔒 RYUK protection enabled.\n\n" +
        "🏷️ Group name protection: ON\n" +
        "👤 Nickname protection: ON\n" +
        "🛡️ Automatic verification: ON",
        threadID,
        messageID
      );
    }

    // ==========================================
    // UNLOCK
    // ==========================================

    if (action === "unlock") {
      disableLock(
        threadID,
        data
      );

      return commandReply(
        api,
        "🔓 RYUK protection disabled.",
        threadID,
        messageID
      );
    }

    // ==========================================
    // TARGET
    // /ryuk target <uid>
    // ==========================================

    if (action === "target") {
      const targetID =
        safeString(args[1]);

      if (!targetID) {
        return commandReply(
          api,
          "⚠️ Usage:\n/ryuk target <userID>",
          threadID,
          messageID
        );
      }

      if (
        targetID.toLowerCase() ===
        "off"
      ) {
        threadData.targetEnabled =
          false;

        threadData.targetUserID =
          "";

        data.targetEnabled =
          false;

        data.targetUserID =
          "";

        saveSystemData(data);

        return commandReply(
          api,
          "🎯 Target mode disabled.",
          threadID,
          messageID
        );
      }

      threadData.targetEnabled =
        true;

      threadData.targetUserID =
        targetID;

      data.targetEnabled =
        true;

      data.targetUserID =
        targetID;

      saveSystemData(data);

      return commandReply(
        api,
        "🎯 TARGET MODE ENABLED\n\n" +
        "Target User ID:\n" +
        targetID +
        "\n\n" +
        "Ang automatic reply ay " +
        "nakalaan lamang sa target.",
        threadID,
        messageID
      );
    }

    // ==========================================
    // RESET TARGET
    // ==========================================

    if (
      action === "resettarget"
    ) {
      threadData.targetEnabled =
        false;

      threadData.targetUserID =
        "";

      data.targetEnabled =
        false;

      data.targetUserID =
        "";

      saveSystemData(data);

      return commandReply(
        api,
        "🔄 Target settings reset.",
        threadID,
        messageID
      );
    }

    // ==========================================
    // DELAY
    // ==========================================

    if (
      action === "delay"
    ) {
      const requested =
        Number(args[1]);

      if (
        !Number.isFinite(
          requested
        )
      ) {
        return commandReply(
          api,
          "⚠️ Usage:\n/ryuk delay <milliseconds>\n\nAllowed: " +
          MIN_DELAY +
          " - " +
          MAX_DELAY +
          " ms",
          threadID,
          messageID
        );
      }

      const delay =
        parseDelay(
          requested
        );

      threadData.delay =
        delay;

      data.delay =
        delay;

      saveSystemData(data);

      return commandReply(
        api,
        "⏱️ Reply delay updated:\n\n" +
        delay +
        " ms",
        threadID,
        messageID
      );
    }

    // ==========================================
    // UNKNOWN COMMAND
    // ==========================================

    return commandReply(
      api,
      "⚠️ Unknown command.\n\n" +
      "Use /ryuk help para makita ang available commands.",
      threadID,
      messageID
    );

  } catch (error) {
    console.error(
      "[RYUK] COMMAND ERROR:",
      error.message
    );

    try {
      await commandReply(
        api,
        "⚠️ May error habang pinoproseso ang command.",
        event.threadID,
        event.messageID
      );
    } catch (sendError) {
      console.error(
        "[RYUK] ERROR MESSAGE FAILED:",
        sendError.message
      );
    }
  }
};

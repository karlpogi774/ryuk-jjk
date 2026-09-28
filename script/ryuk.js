const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ryuk",
  version: "4.2.0",
  hasPermission: 0,
  credits: "RYUK",
  description: "Auto reply, auto react, nickname and GC name manager.",
  usePrefix: true,
  commandCategory: "Fun",
  usages: "/ryuk on | off | status | lock | unlock | setnick | setgname | target | untarget | replyon | replyoff | reacton | reactoff | help",
  cooldowns: 3
};

const DATA_PATH = path.join(
  __dirname,
  "ryuk_data.json"
);

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const DEFAULT_NICKNAME = "RYUK POGI";
const DEFAULT_GC_NAME = "RYUK POGI";

const NICKNAME_DELAY = 1500;
const RESTORE_DELAY = 2000;

const REPLY_COOLDOWN = 4000;
const REACTION_COOLDOWN = 1500;

const GCNAME_RESTORE_COOLDOWN = 10000;
const NICKNAME_RESTORE_COOLDOWN = 5000;

const COMMAND_COOLDOWN = 2500;

const DEFAULT_DATA = {
  active: false,

  autoReply: true,
  autoReact: true,

  nicknameLock: false,
  gcNameLock: false,

  nickname: DEFAULT_NICKNAME,
  gcName: DEFAULT_GC_NAME,

  target: {},

  replyCount: 0,
  reactionCount: 0,
  nicknameCount: 0,
  restoreCount: 0,
  gcNameRestores: 0,
  errorCount: 0,

  updatedAt: 0
};

const lastReply = {};
const lastReaction = {};
const lastCommand = {};

const nicknameRestoreLock = {};
const gcNameRestoreLock = {};

const nicknameQueue = new Map();

function now() {
  return Date.now();
}

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function normalizeName(value) {
  return String(value || "").trim();
}

function normalizeUserID(value) {
  return String(value || "").trim();
}

function getThreadKey(threadID) {
  return String(threadID || "").trim();
}

function isAdmin(userID) {
  const id = normalizeUserID(userID);

  return (
    id.length > 0 &&
    ADMIN_IDS.includes(id)
  );
}

function isCooldown(map, key, duration) {
  const current = now();
  const previous = map[key] || 0;

  if (
    current - previous <
    duration
  ) {
    return true;
  }

  map[key] = current;

  return false;
}

function loadData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      return {
        ...DEFAULT_DATA,
        target: {}
      };
    }

    const raw = fs.readFileSync(
      DATA_PATH,
      "utf8"
    );

    if (!raw.trim()) {
      return {
        ...DEFAULT_DATA,
        target: {}
      };
    }

    let saved;

    try {
      saved = JSON.parse(raw);
    } catch (error) {
      console.error(
        "[RYUK] Invalid data file."
      );

      return {
        ...DEFAULT_DATA,
        target: {}
      };
    }

    if (
      !saved ||
      typeof saved !== "object" ||
      Array.isArray(saved)
    ) {
      saved = {};
    }

    const data = {
      ...DEFAULT_DATA,
      ...saved
    };

    data.nickname =
      normalizeName(data.nickname) ||
      DEFAULT_NICKNAME;

    data.gcName =
      normalizeName(data.gcName) ||
      DEFAULT_GC_NAME;

    if (
      !data.target ||
      typeof data.target !== "object" ||
      Array.isArray(data.target)
    ) {
      data.target = {};
    }

    return data;

  } catch (error) {
    console.error(
      "[RYUK] Load error:",
      error.message || error
    );

    return {
      ...DEFAULT_DATA,
      target: {}
    };
  }
}

function saveData(data) {
  try {
    if (
      !data ||
      typeof data !== "object"
    ) {
      return false;
    }

    if (
      !data.target ||
      typeof data.target !== "object" ||
      Array.isArray(data.target)
    ) {
      data.target = {};
    }

    data.updatedAt = now();

    const tempPath =
      DATA_PATH + ".tmp";

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
      error.message || error
    );

    return false;
  }
}

function ensureData() {
  try {
    const data = loadData();

    if (!normalizeName(data.nickname)) {
      data.nickname =
        DEFAULT_NICKNAME;
    }

    if (!normalizeName(data.gcName)) {
      data.gcName =
        DEFAULT_GC_NAME;
    }

    if (
      !data.target ||
      typeof data.target !== "object" ||
      Array.isArray(data.target)
    ) {
      data.target = {};
    }

    saveData(data);

  } catch (error) {
    console.error(
      "[RYUK] Data setup error:",
      error.message || error
    );
  }
}

function getNickname() {
  const data = loadData();

  return (
    normalizeName(data.nickname) ||
    DEFAULT_NICKNAME
  );
}

function getGCName() {
  const data = loadData();

  return (
    normalizeName(data.gcName) ||
    DEFAULT_GC_NAME
  );
}

function getTargetInfo(threadID) {
  const data = loadData();

  const key =
    getThreadKey(threadID);

  if (!key) {
    return null;
  }

  const target =
    data.target[key];

  if (
    !target ||
    typeof target !== "object"
  ) {
    return null;
  }

  const userID =
    normalizeUserID(
      target.userID
    );

  if (!userID) {
    return null;
  }

  return {
    enabled:
      target.enabled === true,

    userID,

    updatedAt:
      Number(target.updatedAt) || 0
  };
}

function getTargetUserID(threadID) {
  const target =
    getTargetInfo(threadID);

  if (
    !target ||
    !target.enabled
  ) {
    return null;
  }

  return target.userID;
}

function hasTarget(threadID) {
  return !!getTargetUserID(
    threadID
  );
}

function setTarget(
  threadID,
  userID
) {
  const key =
    getThreadKey(threadID);

  const targetID =
    normalizeUserID(userID);

  if (
    !key ||
    !targetID
  ) {
    return false;
  }

  const data = loadData();

  if (
    !data.target ||
    typeof data.target !== "object" ||
    Array.isArray(data.target)
  ) {
    data.target = {};
  }

  data.target[key] = {
    enabled: true,
    userID: targetID,
    updatedAt: now()
  };

  return saveData(data);
}

function removeTarget(threadID) {
  const key =
    getThreadKey(threadID);

  if (!key) {
    return false;
  }

  const data = loadData();

  if (
    data.target &&
    Object.prototype.hasOwnProperty.call(
      data.target,
      key
    )
  ) {
    delete data.target[key];
  }

  return saveData(data);
}

function disableTarget(threadID) {
  const key =
    getThreadKey(threadID);

  if (!key) {
    return false;
  }

  const data = loadData();

  const target =
    data.target[key];

  if (!target) {
    return false;
  }

  target.enabled = false;
  target.updatedAt = now();

  return saveData(data);
}

function enableTarget(threadID) {
  const key =
    getThreadKey(threadID);

  if (!key) {
    return false;
  }

  const data = loadData();

  const target =
    data.target[key];

  if (
    !target ||
    !normalizeUserID(
      target.userID
    )
  ) {
    return false;
  }

  target.enabled = true;
  target.updatedAt = now();

  return saveData(data);
}

function getTargetStatus(threadID) {
  const target =
    getTargetInfo(threadID);

  if (!target) {
    return {
      enabled: false,
      userID: null
    };
  }

  return {
    enabled: target.enabled,
    userID: target.userID
  };
}

ensureData();function getCommandArgs(event) {
  if (!event) return [];

  const body =
    String(event.body || "").trim();

  if (!body) return [];

  return body.split(/\s+/);
}

function getCommandName(event) {
  const args =
    getCommandArgs(event);

  if (!args.length) {
    return "";
  }

  let command =
    String(args[0] || "")
      .toLowerCase()
      .trim();

  command =
    command.replace(/^\/+/, "");

  command =
    command.split("@")[0];

  return command;
}

function getSubCommand(event) {
  const args =
    getCommandArgs(event);

  if (args.length < 2) {
    return "";
  }

  return String(
    args[1] || ""
  )
    .toLowerCase()
    .trim();
}

function getSenderID(event) {
  if (!event) return null;

  return normalizeUserID(
    event.senderID ||
    event.author ||
    event.userID
  );
}

function getReplyTargetID(event) {
  if (!event) return null;

  if (
    event.messageReply &&
    event.messageReply.senderID
  ) {
    return normalizeUserID(
      event.messageReply.senderID
    );
  }

  if (
    event.messageReply &&
    event.messageReply.author
  ) {
    return normalizeUserID(
      event.messageReply.author
    );
  }

  if (
    event.mentions &&
    typeof event.mentions === "object"
  ) {
    const mentionIDs =
      Object.keys(event.mentions);

    if (mentionIDs.length > 0) {
      return normalizeUserID(
        mentionIDs[0]
      );
    }
  }

  return null;
}

function resolveTargetUserID(event) {
  if (!event) return null;

  const replyTarget =
    getReplyTargetID(event);

  if (replyTarget) {
    return replyTarget;
  }

  const args =
    getCommandArgs(event);

  if (args.length >= 3) {
    const possibleID =
      normalizeUserID(args[2]);

    if (
      possibleID &&
      /^[0-9]+$/.test(
        possibleID
      )
    ) {
      return possibleID;
    }
  }

  return null;
}

function isRyukCommand(event) {
  return (
    getCommandName(event) ===
    COMMAND_NAME
  );
}

function canUseRyukCommand(event) {
  const senderID =
    getSenderID(event);

  return isAdmin(senderID);
}

function getCommandCooldownKey(event) {
  const threadID =
    getThreadKey(event.threadID);

  const senderID =
    getSenderID(event);

  return (
    threadID +
    ":" +
    senderID
  );
}

function canProcessCommand(event) {
  const key =
    getCommandCooldownKey(event);

  if (!key) {
    return false;
  }

  return !isCooldown(
    lastCommand,
    key,
    COMMAND_COOLDOWN
  );
}

function getTargetStatusText(threadID) {
  const target =
    getTargetInfo(threadID);

  if (!target) {
    return (
      "TARGET: OFF"
    );
  }

  if (!target.enabled) {
    return (
      "TARGET: OFF\n" +
      "ID: " +
      target.userID
    );
  }

  return (
    "TARGET: ON\n" +
    "ID: " +
    target.userID
  );
}

function createEmptyTarget() {
  return {
    enabled: false,
    userID: null,
    updatedAt: 0
  };
}

function getSafeTarget(threadID) {
  const target =
    getTargetInfo(threadID);

  if (!target) {
    return createEmptyTarget();
  }

  return {
    enabled:
      target.enabled === true,

    userID:
      normalizeUserID(
        target.userID
      ) || null,

    updatedAt:
      Number(
        target.updatedAt
      ) || 0
  };
}

function targetMatches(
  threadID,
  userID
) {
  const target =
    getTargetInfo(threadID);

  if (
    !target ||
    !target.enabled
  ) {
    return false;
  }

  return (
    normalizeUserID(
      target.userID
    ) ===
    normalizeUserID(
      userID
    )
  );
}

function setSavedNickname(
  nickname
) {
  const value =
    normalizeName(nickname);

  if (!value) {
    return false;
  }

  const data =
    loadData();

  data.nickname = value;

  return saveData(data);
}

function setSavedGCName(
  gcName
) {
  const value =
    normalizeName(gcName);

  if (!value) {
    return false;
  }

  const data =
    loadData();

  data.gcName = value;

  return saveData(data);
}

function getSavedSettings() {
  const data =
    loadData();

  return {
    active:
      data.active === true,

    autoReply:
      data.autoReply === true,

    autoReact:
      data.autoReact === true,

    nicknameLock:
      data.nicknameLock === true,

    gcNameLock:
      data.gcNameLock === true,

    nickname:
      getNickname(),

    gcName:
      getGCName()
  };
}

function setActive(
  enabled
) {
  const data =
    loadData();

  data.active =
    enabled === true;

  return saveData(data);
}

function setAutoReply(
  enabled
) {
  const data =
    loadData();

  data.autoReply =
    enabled === true;

  return saveData(data);
}

function setAutoReact(
  enabled
) {
  const data =
    loadData();

  data.autoReact =
    enabled === true;

  return saveData(data);
}

function setNicknameLock(
  enabled
) {
  const data =
    loadData();

  data.nicknameLock =
    enabled === true;

  return saveData(data);
}

function setGCNameLock(
  enabled
) {
  const data =
    loadData();

  data.gcNameLock =
    enabled === true;

  return saveData(data);
}

function increaseCounter(
  field
) {
  const data =
    loadData();

  const current =
    Number(data[field]) || 0;

  data[field] =
    current + 1;

  saveData(data);
}

function increaseErrorCount() {
  increaseCounter(
    "errorCount"
  );
    }async function safeSendMessage(
  api,
  message,
  threadID,
  messageID
) {
  if (!api || !threadID) {
    return false;
  }

  if (
    typeof api.sendMessage !==
    "function"
  ) {
    return false;
  }

  try {
    const result =
      await api.sendMessage(
        message,
        threadID,
        null,
        messageID
          ? {
              quotedMessageID:
                messageID
            }
          : undefined
      );

    return result || true;
  } catch (error) {
    increaseErrorCount();
    return false;
  }
}

async function safeReact(
  api,
  reaction,
  messageID
) {
  if (
    !api ||
    !messageID ||
    typeof api.setMessageReaction !==
      "function"
  ) {
    return false;
  }

  try {
    await api.setMessageReaction(
      reaction,
      messageID
    );

    return true;
  } catch (error) {
    return false;
  }
}

async function safeChangeNickname(
  api,
  nickname,
  userID,
  threadID
) {
  if (
    !api ||
    !threadID ||
    !userID ||
    typeof api.changeNickname !==
      "function"
  ) {
    return false;
  }

  const value =
    normalizeName(nickname);

  if (!value) {
    return false;
  }

  try {
    await api.changeNickname(
      value,
      userID,
      threadID
    );

    increaseCounter(
      "nicknameCount"
    );

    return true;
  } catch (error) {
    increaseErrorCount();
    return false;
  }
}

async function safeSetTitle(
  api,
  title,
  threadID
) {
  if (
    !api ||
    !threadID ||
    typeof api.setTitle !==
      "function"
  ) {
    return false;
  }

  const value =
    normalizeName(title);

  if (!value) {
    return false;
  }

  try {
    await api.setTitle(
      value,
      threadID
    );

    increaseCounter(
      "gcNameRestores"
    );

    return true;
  } catch (error) {
    increaseErrorCount();
    return false;
  }
}

function getThreadData(
  threadID
) {
  const data =
    loadData();

  const key =
    getThreadKey(threadID);

  if (!data.threadSettings) {
    data.threadSettings = {};
  }

  if (
    !data.threadSettings[key] ||
    typeof data.threadSettings[key] !==
      "object"
  ) {
    data.threadSettings[key] = {
      nickname:
        data.nickname,
      gcName:
        data.gcName,
      nicknameLock:
        data.nicknameLock === true,
      gcNameLock:
        data.gcNameLock === true,
      updatedAt: now()
    };

    saveData(data);
  }

  return data.threadSettings[key];
}

function saveThreadData(
  threadID,
  settings
) {
  const key =
    getThreadKey(threadID);

  if (!key) {
    return false;
  }

  const data =
    loadData();

  if (!data.threadSettings) {
    data.threadSettings = {};
  }

  data.threadSettings[key] = {
    nickname:
      normalizeName(
        settings.nickname
      ) ||
      data.nickname,

    gcName:
      normalizeName(
        settings.gcName
      ) ||
      data.gcName,

    nicknameLock:
      settings.nicknameLock === true,

    gcNameLock:
      settings.gcNameLock === true,

    updatedAt: now()
  };

  return saveData(data);
}

function getThreadNickname(
  threadID
) {
  const settings =
    getThreadData(threadID);

  return (
    normalizeName(
      settings.nickname
    ) ||
    getNickname()
  );
}

function getThreadGCName(
  threadID
) {
  const settings =
    getThreadData(threadID);

  return (
    normalizeName(
      settings.gcName
    ) ||
    getGCName()
  );
}

function isNicknameLocked(
  threadID
) {
  const settings =
    getThreadData(threadID);

  return (
    settings.nicknameLock === true
  );
}

function isGCNameLocked(
  threadID
) {
  const settings =
    getThreadData(threadID);

  return (
    settings.gcNameLock === true
  );
}

function markNicknameRestore(
  threadID
) {
  const key =
    getThreadKey(threadID);

  if (!key) return;

  nicknameRestoreLock[key] =
    now();
}

function markGCNameRestore(
  threadID
) {
  const key =
    getThreadKey(threadID);

  if (!key) return;

  gcNameRestoreLock[key] =
    now();
}

function canRestoreNickname(
  threadID
) {
  const key =
    getThreadKey(threadID);

  if (!key) return false;

  return !isCooldown(
    nicknameRestoreLock,
    key,
    NICKNAME_RESTORE_COOLDOWN
  );
}

function canRestoreGCName(
  threadID
) {
  const key =
    getThreadKey(threadID);

  if (!key) return false;

  return !isCooldown(
    gcNameRestoreLock,
    key,
    GCNAME_RESTORE_COOLDOWN
  );
}

function queueNicknameRestore(
  api,
  threadID,
  userID,
  nickname
) {
  const key =
    getThreadKey(threadID);

  if (!key || !userID) {
    return false;
  }

  if (
    nicknameQueue.has(key)
  ) {
    return false;
  }

  nicknameQueue.set(
    key,
    {
      userID:
        normalizeUserID(userID),
      nickname:
        normalizeName(nickname)
    }
  );

  return true;
}

async function processNicknameQueue(
  api,
  threadID
) {
  const key =
    getThreadKey(threadID);

  if (!key) return false;

  const job =
    nicknameQueue.get(key);

  if (!job) {
    return false;
  }

  nicknameQueue.delete(key);

  await wait(
    NICKNAME_DELAY
  );

  if (
    !job.userID ||
    !job.nickname
  ) {
    return false;
  }

  return safeChangeNickname(
    api,
    job.nickname,
    job.userID,
    threadID
  );
      }async function restoreNickname(
  api,
  threadID,
  userID
) {
  const tid =
    getThreadKey(threadID);

  const uid =
    normalizeUserID(userID);

  if (!tid || !uid) {
    return false;
  }

  if (!isNicknameLocked(tid)) {
    return false;
  }

  if (!canRestoreNickname(tid)) {
    return false;
  }

  const nickname =
    getThreadNickname(tid);

  if (!nickname) {
    return false;
  }

  markNicknameRestore(tid);

  await wait(
    RESTORE_DELAY
  );

  const success =
    await safeChangeNickname(
      api,
      nickname,
      uid,
      tid
    );

  if (success) {
    increaseCounter(
      "restoreCount"
    );
  }

  return success;
}

async function restoreGCName(
  api,
  threadID
) {
  const tid =
    getThreadKey(threadID);

  if (!tid) {
    return false;
  }

  if (!isGCNameLocked(tid)) {
    return false;
  }

  if (!canRestoreGCName(tid)) {
    return false;
  }

  const gcName =
    getThreadGCName(tid);

  if (!gcName) {
    return false;
  }

  markGCNameRestore(tid);

  await wait(
    RESTORE_DELAY
  );

  return safeSetTitle(
    api,
    gcName,
    tid
  );
}

function getParticipantIDs(event) {
  const ids = new Set();

  if (!event) {
    return [];
  }

  if (
    Array.isArray(
      event.participantIDs
    )
  ) {
    for (
      const id of event.participantIDs
    ) {
      const uid =
        normalizeUserID(id);

      if (uid) {
        ids.add(uid);
      }
    }
  }

  if (
    event.logMessageData &&
    Array.isArray(
      event.logMessageData
        .addedParticipants
    )
  ) {
    for (
      const participant of
        event.logMessageData.addedParticipants
    ) {
      const uid =
        normalizeUserID(
          participant.userFbId ||
          participant.userID ||
          participant.id
        );

      if (uid) {
        ids.add(uid);
      }
    }
  }

  return Array.from(ids);
}

function getChangedNicknameUserID(
  event
) {
  if (!event) {
    return null;
  }

  const data =
    event.logMessageData;

  if (!data) {
    return null;
  }

  return normalizeUserID(
    data.participant_id ||
    data.participantID ||
    data.userID ||
    data.author
  );
}

function isNicknameChangeEvent(
  event
) {
  if (!event) {
    return false;
  }

  const type =
    String(
      event.logMessageType || ""
    ).toLowerCase();

  return (
    type ===
      "log:thread-name" ||
    type ===
      "log:thread-color" ||
    type ===
      "log:thread-icon" ||
    type ===
      "log:subscribe" ||
    type ===
      "log:unsubscribe"
  )
    ? false
    : (
        type.includes(
          "nickname"
        ) ||
        type.includes(
          "nick"
        )
      );
}

function isGroupNameChangeEvent(
  event
) {
  if (!event) {
    return false;
  }

  const type =
    String(
      event.logMessageType || ""
    ).toLowerCase();

  return (
    type.includes(
      "thread-name"
    ) ||
    type.includes(
      "group-name"
    )
  );
}

function getChangedGroupName(
  event
) {
  if (!event) {
    return null;
  }

  const data =
    event.logMessageData;

  if (!data) {
    return null;
  }

  return normalizeName(
    data.name ||
    data.threadName ||
    data.title
  );
}

function getChangedNickname(
  event
) {
  if (!event) {
    return null;
  }

  const data =
    event.logMessageData;

  if (!data) {
    return null;
  }

  return normalizeName(
    data.nickname ||
    data.newNickname ||
    data.new_nickname
  );
}

function shouldIgnoreOwnEvent(
  event
) {
  if (!event) {
    return true;
  }

  const senderID =
    getSenderID(event);

  if (!senderID) {
    return false;
  }

  return false;
}

async function handleNicknameEvent(
  api,
  event
) {
  if (!event) {
    return false;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return false;
  }

  if (!isNicknameLocked(threadID)) {
    return false;
  }

  const userID =
    getChangedNicknameUserID(
      event
    );

  if (!userID) {
    return false;
  }

  const desiredNickname =
    getThreadNickname(
      threadID
    );

  if (!desiredNickname) {
    return false;
  }

  if (
    !canRestoreNickname(
      threadID
    )
  ) {
    return false;
  }

  const queued =
    queueNicknameRestore(
      api,
      threadID,
      userID,
      desiredNickname
    );

  if (!queued) {
    return false;
  }

  await processNicknameQueue(
    api,
    threadID
  );

  return true;
}

async function handleGroupNameEvent(
  api,
  event
) {
  if (!event) {
    return false;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return false;
  }

  if (!isGCNameLocked(threadID)) {
    return false;
  }

  if (!isGroupNameChangeEvent(event)) {
    return false;
  }

  const currentName =
    getChangedGroupName(event);

  const savedName =
    getThreadGCName(threadID);

  if (
    currentName &&
    savedName &&
    currentName === savedName
  ) {
    return false;
  }

  return restoreGCName(
    api,
    threadID
  );
}

async function handleRestoreEvent(
  api,
  event
) {
  if (!event) {
    return false;
  }

  let handled = false;

  if (
    isNicknameChangeEvent(event)
  ) {
    try {
      const result =
        await handleNicknameEvent(
          api,
          event
        );

      if (result) {
        handled = true;
      }
    } catch (error) {
      increaseErrorCount();
    }
  }

  if (
    isGroupNameChangeEvent(event)
  ) {
    try {
      const result =
        await handleGroupNameEvent(
          api,
          event
        );

      if (result) {
        handled = true;
      }
    } catch (error) {
      increaseErrorCount();
    }
  }

  return handled;
}const AUTO_REPLY_LINES = [
  "Ano yun? 😏",
  "Uy, bakit mo ako tinatawag?",
  "Naririnig kita 👀",
  "Ano kailangan mo?",
  "Present si Ryuk.",
  "Hmm? Anong meron?",
  "Sige, sabihin mo lang.",
  "Uy 😂",
  "Ano yan?",
  "Nandito lang ako."
];

const TARGET_REPLY_LINES = [
  "Ikaw pala 😏",
  "Ano kailangan mo?",
  "Uy, ikaw lang muna.",
  "Naririnig kita 👀",
  "Sige, ano yun?",
  "Present.",
  "Hmm? Sabihin mo lang.",
  "Ano meron?",
  "Uy 😂",
  "Nandito ako."
];

const lastCommand = {};
const lastAutoReply = {};
const lastTargetReply = {};
const lastAutoReact = {};
const recentMessages = new Map();

const AUTO_REPLY_COOLDOWN = 4000;
const TARGET_REPLY_COOLDOWN = 3500;
const AUTO_REACT_COOLDOWN = 1500;
const DUPLICATE_MESSAGE_TTL = 12000;
const MAX_RECENT_MESSAGES = 500;

function cleanMessageText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function getMessageID(event) {
  if (!event) return null;

  return String(
    event.messageID ||
    event.messageId ||
    event.mid ||
    ""
  ).trim() || null;
}

function getMessageText(event) {
  if (!event) return "";

  return cleanMessageText(
    event.body ||
    event.message ||
    ""
  );
}

function rememberMessage(
  event
) {
  const messageID =
    getMessageID(event);

  if (!messageID) {
    return true;
  }

  const current =
    now();

  for (
    const [key, timestamp]
    of recentMessages
  ) {
    if (
      current - timestamp >
      DUPLICATE_MESSAGE_TTL
    ) {
      recentMessages.delete(key);
    }
  }

  if (
    recentMessages.has(
      messageID
    )
  ) {
    return false;
  }

  recentMessages.set(
    messageID,
    current
  );

  while (
    recentMessages.size >
    MAX_RECENT_MESSAGES
  ) {
    const firstKey =
      recentMessages.keys().next().value;

    if (firstKey) {
      recentMessages.delete(
        firstKey
      );
    } else {
      break;
    }
  }

  return true;
}

function pickRandomLine(
  lines
) {
  if (
    !Array.isArray(lines) ||
    lines.length === 0
  ) {
    return "";
  }

  const index =
    Math.floor(
      Math.random() *
      lines.length
    );

  return String(
    lines[index] || ""
  ).trim();
}

function canAutoReply(
  threadID
) {
  const key =
    getThreadKey(threadID);

  if (!key) {
    return false;
  }

  return !isCooldown(
    lastAutoReply,
    key,
    AUTO_REPLY_COOLDOWN
  );
}

function canTargetReply(
  threadID
) {
  const key =
    getThreadKey(threadID);

  if (!key) {
    return false;
  }

  return !isCooldown(
    lastTargetReply,
    key,
    TARGET_REPLY_COOLDOWN
  );
}

function canAutoReact(
  threadID
) {
  const key =
    getThreadKey(threadID);

  if (!key) {
    return false;
  }

  return !isCooldown(
    lastAutoReact,
    key,
    AUTO_REACT_COOLDOWN
  );
}

function markAutoReply(
  threadID
) {
  const key =
    getThreadKey(threadID);

  if (key) {
    lastAutoReply[key] =
      now();
  }
}

function markTargetReply(
  threadID
) {
  const key =
    getThreadKey(threadID);

  if (key) {
    lastTargetReply[key] =
      now();
  }
}

function markAutoReact(
  threadID
) {
  const key =
    getThreadKey(threadID);

  if (key) {
    lastAutoReact[key] =
      now();
  }
}

function containsRyukTrigger(
  text
) {
  const value =
    cleanMessageText(
      text
    ).toLowerCase();

  if (!value) {
    return false;
  }

  const triggers = [
    "ryuk",
    "ryu",
    "ryukk",
    "ryuk?"
  ];

  return triggers.some(
    trigger =>
      value === trigger ||
      value.startsWith(
        trigger + " "
      ) ||
      value.startsWith(
        trigger + "?"
      ) ||
      value.startsWith(
        trigger + "!"
      )
  );
}

function isDirectlyMentioned(
  event
) {
  if (
    !event ||
    !event.mentions ||
    typeof event.mentions !==
      "object"
  ) {
    return false;
  }

  const botID =
    normalizeUserID(
      event.apiUserID ||
      event.botID
    );

  if (!botID) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(
    event.mentions,
    botID
  );
}

function shouldAutoReplyToMessage(
  event
) {
  if (!event) {
    return false;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return false;
  }

  const data =
    loadData();

  if (
    data.active !== true ||
    data.autoReply !== true
  ) {
    return false;
  }

  if (!rememberMessage(event)) {
    return false;
  }

  const text =
    getMessageText(event);

  if (!text) {
    return false;
  }

  if (
    isRyukCommand(event)
  ) {
    return false;
  }

  if (
    !containsRyukTrigger(text) &&
    !isDirectlyMentioned(event)
  ) {
    return false;
  }

  if (
    !canAutoReply(threadID)
  ) {
    return false;
  }

  return true;
}

async function sendAutoReply(
  api,
  event
) {
  if (
    !shouldAutoReplyToMessage(
      event
    )
  ) {
    return false;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  const messageID =
    getMessageID(event);

  const line =
    pickRandomLine(
      AUTO_REPLY_LINES
    );

  if (!line) {
    return false;
  }

  markAutoReply(
    threadID
  );

  return safeSendMessage(
    api,
    line,
    threadID,
    messageID
  );
          }async function sendTargetReply(
  api,
  event
) {
  if (!event) {
    return false;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  const senderID =
    getSenderID(event);

  if (
    !threadID ||
    !senderID
  ) {
    return false;
  }

  const data =
    loadData();

  if (
    data.active !== true ||
    data.autoReply !== true
  ) {
    return false;
  }

  if (
    !targetMatches(
      threadID,
      senderID
    )
  ) {
    return false;
  }

  if (
    isRyukCommand(event)
  ) {
    return false;
  }

  if (
    !canTargetReply(
      threadID
    )
  ) {
    return false;
  }

  const messageID =
    getMessageID(event);

  if (!messageID) {
    return false;
  }

  const text =
    getMessageText(event);

  if (!text) {
    return false;
  }

  if (
    !rememberMessage(event)
  ) {
    return false;
  }

  const line =
    pickRandomLine(
      TARGET_REPLY_LINES
    );

  if (!line) {
    return false;
  }

  markTargetReply(
    threadID
  );

  return safeSendMessage(
    api,
    line,
    threadID,
    messageID
  );
}

async function sendAutoReaction(
  api,
  event
) {
  if (!event) {
    return false;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  const messageID =
    getMessageID(event);

  if (
    !threadID ||
    !messageID
  ) {
    return false;
  }

  const data =
    loadData();

  if (
    data.active !== true ||
    data.autoReact !== true
  ) {
    return false;
  }

  if (
    isRyukCommand(event)
  ) {
    return false;
  }

  if (
    !canAutoReact(threadID)
  ) {
    return false;
  }

  const reactionList = [
    "🔥",
    "😂",
    "🤣",
    "😆",
    "🤡"
  ];

  const reaction =
    pickRandomLine(
      reactionList
    );

  if (!reaction) {
    return false;
  }

  markAutoReact(
    threadID
  );

  const result =
    await safeReact(
      api,
      reaction,
      messageID
    );

  if (result) {
    increaseCounter(
      "reactionCount"
    );
  }

  return result;
}

function getStatusMessage(
  threadID
) {
  const settings =
    getSavedSettings();

  const target =
    getSafeTarget(threadID);

  const targetText =
    target.enabled &&
    target.userID
      ? "ON (" +
        target.userID +
        ")"
      : "OFF";

  return [
    "RYUK STATUS",
    "",
    "Active: " +
      (settings.active
        ? "ON"
        : "OFF"),

    "Auto Reply: " +
      (settings.autoReply
        ? "ON"
        : "OFF"),

    "Auto React: " +
      (settings.autoReact
        ? "ON"
        : "OFF"),

    "Nickname Lock: " +
      (settings.nicknameLock
        ? "ON"
        : "OFF"),

    "GC Name Lock: " +
      (settings.gcNameLock
        ? "ON"
        : "OFF"),

    "Nickname: " +
      settings.nickname,

    "GC Name: " +
      settings.gcName,

    "Target: " +
      targetText,

    "",
    "Replies: " +
      (Number(
        loadData().replyCount
      ) || 0),

    "Reactions: " +
      (Number(
        loadData().reactionCount
      ) || 0),

    "Nickname Changes: " +
      (Number(
        loadData().nicknameCount
      ) || 0),

    "Restores: " +
      (Number(
        loadData().restoreCount
      ) || 0)
  ].join("\n");
}

function getHelpMessage() {
  return [
    "RYUK COMMANDS",
    "",
    "/ryuk on",
    "/ryuk off",
    "/ryuk status",
    "",
    "/ryuk replyon",
    "/ryuk replyoff",
    "/ryuk reacton",
    "/ryuk reactoff",
    "",
    "/ryuk lock",
    "/ryuk unlock",
    "",
    "/ryuk setnick NAME",
    "/ryuk setgname NAME",
    "",
    "/ryuk target",
    "/ryuk target on",
    "/ryuk target off",
    "/ryuk target @mention",
    "/ryuk target USER_ID",
    "/ryuk untarget",
    "",
    "/ryuk help"
  ].join("\n");
}

function parseTargetCommand(
  event
) {
  const args =
    getCommandArgs(event);

  if (
    args.length < 2
  ) {
    return {
      action: "status",
      userID: null
    };
  }

  const action =
    String(
      args[2] || ""
    )
      .toLowerCase()
      .trim();

  if (
    action === "on"
  ) {
    return {
      action: "on",
      userID:
        resolveTargetUserID(event)
    };
  }

  if (
    action === "off"
  ) {
    return {
      action: "off",
      userID: null
    };
  }

  if (
    action === "remove" ||
    action === "clear" ||
    action === "untarget"
  ) {
    return {
      action: "remove",
      userID: null
    };
  }

  const userID =
    resolveTargetUserID(event);

  if (userID) {
    return {
      action: "on",
      userID
    };
  }

  return {
    action: "status",
    userID: null
  };
}async function executeTargetCommand(
  api,
  event
) {
  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return false;
  }

  const parsed =
    parseTargetCommand(event);

  if (
    parsed.action === "status"
  ) {
    await safeSendMessage(
      api,
      getTargetStatusText(
        threadID
      ),
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    parsed.action === "off"
  ) {
    disableTarget(
      threadID
    );

    await safeSendMessage(
      api,
      "Target disabled.",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    parsed.action === "remove"
  ) {
    removeTarget(
      threadID
    );

    await safeSendMessage(
      api,
      "Target removed.",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    parsed.action === "on"
  ) {
    if (!parsed.userID) {
      await safeSendMessage(
        api,
        "Reply sa message ng target o gamitin: /ryuk target USER_ID",
        threadID,
        getMessageID(event)
      );

      return true;
    }

    setTarget(
      threadID,
      parsed.userID
    );

    await safeSendMessage(
      api,
      "Target enabled.\nID: " +
        parsed.userID,
      threadID,
      getMessageID(event)
    );

    return true;
  }

  return false;
}

async function executeRyukCommand(
  api,
  event
) {
  if (!event) {
    return false;
  }

  if (
    !isRyukCommand(event)
  ) {
    return false;
  }

  const senderID =
    getSenderID(event);

  if (!senderID) {
    return false;
  }

  if (!isAdmin(senderID)) {
    return true;
  }

  if (!canProcessCommand(event)) {
    return true;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return true;
  }

  const args =
    getCommandArgs(event);

  const sub =
    String(
      args[1] || ""
    )
      .toLowerCase()
      .trim();

  lastCommand[
    getCommandCooldownKey(event)
  ] = now();

  if (!sub) {
    await safeSendMessage(
      api,
      getHelpMessage(),
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "on"
  ) {
    setActive(true);

    await safeSendMessage(
      api,
      "RYUK activated.",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "off"
  ) {
    setActive(false);

    await safeSendMessage(
      api,
      "RYUK deactivated.",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "status"
  ) {
    await safeSendMessage(
      api,
      getStatusMessage(
        threadID
      ),
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "help"
  ) {
    await safeSendMessage(
      api,
      getHelpMessage(),
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "replyon"
  ) {
    setAutoReply(true);

    await safeSendMessage(
      api,
      "Auto-reply: ON",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "replyoff"
  ) {
    setAutoReply(false);

    await safeSendMessage(
      api,
      "Auto-reply: OFF",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "reacton"
  ) {
    setAutoReact(true);

    await safeSendMessage(
      api,
      "Auto-react: ON",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "reactoff"
  ) {
    setAutoReact(false);

    await safeSendMessage(
      api,
      "Auto-react: OFF",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "lock"
  ) {
    setNicknameLock(true);
    setGCNameLock(true);

    saveThreadData(
      threadID,
      {
        nickname:
          getThreadNickname(
            threadID
          ),
        gcName:
          getThreadGCName(
            threadID
          ),
        nicknameLock: true,
        gcNameLock: true
      }
    );

    await safeSendMessage(
      api,
      "Nickname lock + GC name lock: ON",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "unlock"
  ) {
    setNicknameLock(false);
    setGCNameLock(false);

    saveThreadData(
      threadID,
      {
        nickname:
          getThreadNickname(
            threadID
          ),
        gcName:
          getThreadGCName(
            threadID
          ),
        nicknameLock: false,
        gcNameLock: false
      }
    );

    await safeSendMessage(
      api,
      "Nickname lock + GC name lock: OFF",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "target"
  ) {
    return executeTargetCommand(
      api,
      event
    );
  }

  if (
    sub === "untarget"
  ) {
    removeTarget(
      threadID
    );

    await safeSendMessage(
      api,
      "Target removed.",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  return true;
    }function getTextAfterCommand(
  event
) {
  const args =
    getCommandArgs(event);

  if (
    !Array.isArray(args) ||
    args.length < 2
  ) {
    return "";
  }

  return args
    .slice(2)
    .join(" ")
    .trim();
}

async function executeNicknameCommand(
  api,
  event
) {
  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return true;
  }

  const nickname =
    getTextAfterCommand(event);

  if (!nickname) {
    await safeSendMessage(
      api,
      "Usage: /ryuk setnick NAME",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  const clean =
    normalizeName(nickname);

  if (!clean) {
    return true;
  }

  if (
    clean.length > 80
  ) {
    await safeSendMessage(
      api,
      "Nickname is too long.",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  const saved =
    setSavedNickname(clean);

  if (!saved) {
    await safeSendMessage(
      api,
      "Hindi na-save ang nickname.",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  saveThreadData(
    threadID,
    {
      nickname: clean,
      gcName:
        getThreadGCName(threadID),
      nicknameLock:
        isNicknameLocked(threadID),
      gcNameLock:
        isGCNameLocked(threadID)
    }
  );

  const senderID =
    getSenderID(event);

  if (senderID) {
    await wait(
      NICKNAME_DELAY
    );

    await safeChangeNickname(
      api,
      clean,
      senderID,
      threadID
    );
  }

  await safeSendMessage(
    api,
    "Nickname saved: " +
      clean,
    threadID,
    getMessageID(event)
  );

  return true;
}

async function executeGCNameCommand(
  api,
  event
) {
  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return true;
  }

  const gcName =
    getTextAfterCommand(event);

  if (!gcName) {
    await safeSendMessage(
      api,
      "Usage: /ryuk setgname NAME",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  const clean =
    normalizeName(gcName);

  if (!clean) {
    return true;
  }

  if (
    clean.length > 100
  ) {
    await safeSendMessage(
      api,
      "GC name is too long.",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  const saved =
    setSavedGCName(clean);

  if (!saved) {
    await safeSendMessage(
      api,
      "Hindi na-save ang GC name.",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  saveThreadData(
    threadID,
    {
      nickname:
        getThreadNickname(threadID),
      gcName: clean,
      nicknameLock:
        isNicknameLocked(threadID),
      gcNameLock:
        isGCNameLocked(threadID)
    }
  );

  await wait(
    RESTORE_DELAY
  );

  await safeSetTitle(
    api,
    clean,
    threadID
  );

  await safeSendMessage(
    api,
    "GC name saved: " +
      clean,
    threadID,
    getMessageID(event)
  );

  return true;
}

async function executeSetCommands(
  api,
  event
) {
  if (!event) {
    return false;
  }

  const command =
    getCommandName(event);

  if (
    command !== COMMAND_NAME
  ) {
    return false;
  }

  const args =
    getCommandArgs(event);

  const sub =
    String(
      args[1] || ""
    )
      .toLowerCase()
      .trim();

  if (
    sub === "setnick"
  ) {
    return executeNicknameCommand(
      api,
      event
    );
  }

  if (
    sub === "setgname"
  ) {
    return executeGCNameCommand(
      api,
      event
    );
  }

  return false;
}

function validateThreadSettings(
  threadID
) {
  const tid =
    getThreadKey(threadID);

  if (!tid) {
    return false;
  }

  const settings =
    getThreadData(tid);

  let changed = false;

  if (
    !normalizeName(
      settings.nickname
    )
  ) {
    settings.nickname =
      getNickname();

    changed = true;
  }

  if (
    !normalizeName(
      settings.gcName
    )
  ) {
    settings.gcName =
      getGCName();

    changed = true;
  }

  if (
    typeof settings.nicknameLock !==
    "boolean"
  ) {
    settings.nicknameLock =
      false;

    changed = true;
  }

  if (
    typeof settings.gcNameLock !==
    "boolean"
  ) {
    settings.gcNameLock =
      false;

    changed = true;
  }

  if (changed) {
    saveThreadData(
      tid,
      settings
    );
  }

  return true;
}

function cleanupRuntimeMaps() {
  const current =
    now();

  const maps = [
    lastCommand,
    lastAutoReply,
    lastTargetReply,
    lastAutoReact,
    nicknameRestoreLock,
    gcNameRestoreLock
  ];

  for (
    const map of maps
  ) {
    for (
      const key of Object.keys(map)
    ) {
      if (
        current - Number(map[key] || 0) >
        120000
      ) {
        delete map[key];
      }
    }
  }

  for (
    const [
      key,
      timestamp
    ] of recentMessages
  ) {
    if (
      current - timestamp >
      DUPLICATE_MESSAGE_TTL
    ) {
      recentMessages.delete(key);
    }
  }
}

function startRuntimeCleanup() {
  if (
    startRuntimeCleanup.started
  ) {
    return;
  }

  startRuntimeCleanup.started =
    true;

  setInterval(
    () => {
      try {
        cleanupRuntimeMaps();
      } catch (error) {
        increaseErrorCount();
      }
    },
    60000
  );
}

startRuntimeCleanup();async function handleAutoFeatures(
  api,
  event
) {
  if (!event) {
    return false;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return false;
  }

  const data =
    loadData();

  if (
    data.active !== true
  ) {
    return false;
  }

  validateThreadSettings(
    threadID
  );

  let handled = false;

  try {
    const targetResult =
      await sendTargetReply(
        api,
        event
      );

    if (targetResult) {
      handled = true;
    }
  } catch (error) {
    increaseErrorCount();
  }

  try {
    const replyResult =
      await sendAutoReply(
        api,
        event
      );

    if (replyResult) {
      handled = true;
    }
  } catch (error) {
    increaseErrorCount();
  }

  try {
    const reactionResult =
      await sendAutoReaction(
        api,
        event
      );

    if (reactionResult) {
      handled = true;
    }
  } catch (error) {
    increaseErrorCount();
  }

  return handled;
}

async function handleEventSafe(
  api,
  event
) {
  if (!event) {
    return false;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return false;
  }

  validateThreadSettings(
    threadID
  );

  let handled = false;

  try {
    const restoreResult =
      await handleRestoreEvent(
        api,
        event
      );

    if (restoreResult) {
      handled = true;
    }
  } catch (error) {
    increaseErrorCount();
  }

  if (
    String(
      event.body || ""
    ).trim()
  ) {
    try {
      const autoResult =
        await handleAutoFeatures(
          api,
          event
        );

      if (autoResult) {
        handled = true;
      }
    } catch (error) {
      increaseErrorCount();
    }
  }

  return handled;
}

function getEventAPI(
  context
) {
  if (
    context &&
    context.api
  ) {
    return context.api;
  }

  return null;
}

function getEventObject(
  context
) {
  if (
    context &&
    context.event
  ) {
    return context.event;
  }

  return null;
}

async function runCommand(
  api,
  event
) {
  if (!api || !event) {
    return false;
  }

  if (
    !isRyukCommand(event)
  ) {
    return false;
  }

  const senderID =
    getSenderID(event);

  if (!senderID) {
    return true;
  }

  /*
   * Non-admin command attempts are
   * silently ignored.
   * Walang usage/help na ipapakita.
   */
  if (!isAdmin(senderID)) {
    return true;
  }

  try {
    const setResult =
      await executeSetCommands(
        api,
        event
      );

    if (setResult) {
      return true;
    }

    return executeRyukCommand(
      api,
      event
    );
  } catch (error) {
    increaseErrorCount();

    return true;
  }
}

module.exports.handleEvent =
  async function({
    api,
    event
  }) {
    try {
      return await handleEventSafe(
        api,
        event
      );
    } catch (error) {
      increaseErrorCount();
      return false;
    }
  };

module.exports.run =
  async function({
    api,
    event
  }) {
    try {
      return await runCommand(
        api,
        event
      );
    } catch (error) {
      increaseErrorCount();
      return false;
    }
  };function normalizeCommandInput(
  value
) {
  return String(
    value || ""
  )
    .toLowerCase()
    .trim()
    .replace(/^\/+/, "")
    .split("@")[0];
}

function isSupportedRyukCommand(
  value
) {
  const command =
    normalizeCommandInput(value);

  return command === "ryuk";
}

function getCurrentThreadSettings(
  threadID
) {
  const tid =
    getThreadKey(threadID);

  if (!tid) {
    return null;
  }

  const data =
    getThreadData(tid);

  return {
    nickname:
      normalizeName(
        data.nickname
      ) || getNickname(),

    gcName:
      normalizeName(
        data.gcName
      ) || getGCName(),

    nicknameLock:
      data.nicknameLock === true,

    gcNameLock:
      data.gcNameLock === true
  };
}

function syncThreadSettings(
  threadID
) {
  const tid =
    getThreadKey(threadID);

  if (!tid) {
    return false;
  }

  const settings =
    getCurrentThreadSettings(tid);

  if (!settings) {
    return false;
  }

  return saveThreadData(
    tid,
    settings
  );
}

async function applyNicknameToTarget(
  api,
  event
) {
  if (!event) {
    return false;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return false;
  }

  const settings =
    getCurrentThreadSettings(
      threadID
    );

  if (
    !settings ||
    !settings.nicknameLock
  ) {
    return false;
  }

  const targetID =
    resolveTargetUserID(event);

  const userID =
    targetID ||
    getSenderID(event);

  if (!userID) {
    return false;
  }

  if (
    !canRestoreNickname(
      threadID
    )
  ) {
    return false;
  }

  return restoreNickname(
    api,
    threadID,
    userID
  );
}

async function applySavedGCName(
  api,
  event
) {
  if (!event) {
    return false;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return false;
  }

  const settings =
    getCurrentThreadSettings(
      threadID
    );

  if (
    !settings ||
    !settings.gcNameLock
  ) {
    return false;
  }

  return restoreGCName(
    api,
    threadID
  );
}

function getCommandUsage(
  command
) {
  const value =
    normalizeCommandInput(
      command
    );

  if (
    value !== "ryuk"
  ) {
    return "";
  }

  return getHelpMessage();
}

async function handleCommandMessage(
  api,
  event
) {
  if (!event) {
    return false;
  }

  const command =
    getCommandName(event);

  if (
    !isSupportedRyukCommand(
      command
    )
  ) {
    return false;
  }

  const senderID =
    getSenderID(event);

  if (!senderID) {
    return true;
  }

  /*
   * Admin only.
   * Kapag ordinary member:
   * walang reply, walang usage,
   * walang help message.
   */
  if (!isAdmin(senderID)) {
    return true;
  }

  return runCommand(
    api,
    event
  );
}

async function processMessageEvent(
  api,
  event
) {
  if (!event) {
    return false;
  }

  if (
    isRyukCommand(event)
  ) {
    return handleCommandMessage(
      api,
      event
    );
  }

  return handleAutoFeatures(
    api,
    event
  );
}

async function processLogEvent(
  api,
  event
) {
  if (!event) {
    return false;
  }

  return handleRestoreEvent(
    api,
    event
  );
}

function isMessageEvent(
  event
) {
  if (!event) {
    return false;
  }

  return Boolean(
    event.body ||
    event.messageID ||
    event.messageId
  );
}

function isLogEvent(
  event
) {
  if (!event) {
    return false;
  }

  return Boolean(
    event.logMessageType ||
    event.logMessageData
  );
}

async function dispatchEvent(
  api,
  event
) {
  if (!api || !event) {
    return false;
  }

  try {
    if (
      isLogEvent(event)
    ) {
      return processLogEvent(
        api,
        event
      );
    }

    if (
      isMessageEvent(event)
    ) {
      return processMessageEvent(
        api,
        event
      );
    }

    return false;
  } catch (error) {
    increaseErrorCount();
    return false;
  }
}

module.exports.onLoad =
  function() {
    try {
      ensureData();
      startRuntimeCleanup();
    } catch (error) {
      increaseErrorCount();
    }
  };function getNicknameChangeData(
  event
) {
  if (!event) {
    return null;
  }

  const data =
    event.logMessageData;

  if (
    !data ||
    typeof data !== "object"
  ) {
    return null;
  }

  const userID =
    normalizeUserID(
      data.participant_id ||
      data.participantID ||
      data.userID ||
      data.author
    );

  if (!userID) {
    return null;
  }

  const oldNickname =
    normalizeName(
      data.old_nickname ||
      data.oldNickname ||
      data.previousNickname ||
      ""
    );

  const newNickname =
    normalizeName(
      data.nickname ||
      data.new_nickname ||
      data.newNickname ||
      ""
    );

  return {
    userID,
    oldNickname,
    newNickname
  };
}

function nicknameActuallyChanged(
  event
) {
  const data =
    getNicknameChangeData(event);

  if (!data) {
    return false;
  }

  if (
    !data.oldNickname &&
    !data.newNickname
  ) {
    return true;
  }

  return (
    data.oldNickname !==
    data.newNickname
  );
}

function getGroupNameChangeData(
  event
) {
  if (!event) {
    return null;
  }

  const data =
    event.logMessageData;

  if (
    !data ||
    typeof data !== "object"
  ) {
    return null;
  }

  const oldName =
    normalizeName(
      data.oldName ||
      data.oldThreadName ||
      data.previousName ||
      ""
    );

  const newName =
    normalizeName(
      data.name ||
      data.threadName ||
      data.title ||
      ""
    );

  return {
    oldName,
    newName
  };
}

function groupNameActuallyChanged(
  event
) {
  const data =
    getGroupNameChangeData(event);

  if (!data) {
    return false;
  }

  if (
    !data.oldName &&
    !data.newName
  ) {
    return true;
  }

  return (
    data.oldName !==
    data.newName
  );
}

async function restoreAfterNicknameChange(
  api,
  event
) {
  if (!event) {
    return false;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return false;
  }

  if (
    !isNicknameLocked(
      threadID
    )
  ) {
    return false;
  }

  if (
    !nicknameActuallyChanged(
      event
    )
  ) {
    return false;
  }

  const change =
    getNicknameChangeData(
      event
    );

  if (
    !change ||
    !change.userID
  ) {
    return false;
  }

  const savedNickname =
    getThreadNickname(
      threadID
    );

  if (!savedNickname) {
    return false;
  }

  if (
    !canRestoreNickname(
      threadID
    )
  ) {
    return false;
  }

  const queued =
    queueNicknameRestore(
      api,
      threadID,
      change.userID,
      savedNickname
    );

  if (!queued) {
    return false;
  }

  return processNicknameQueue(
    api,
    threadID
  );
}

async function restoreAfterGCNameChange(
  api,
  event
) {
  if (!event) {
    return false;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return false;
  }

  if (
    !isGCNameLocked(
      threadID
    )
  ) {
    return false;
  }

  if (
    !groupNameActuallyChanged(
      event
    )
  ) {
    return false;
  }

  const savedName =
    getThreadGCName(
      threadID
    );

  if (!savedName) {
    return false;
  }

  const currentName =
    getChangedGroupName(event);

  if (
    currentName &&
    currentName === savedName
  ) {
    return false;
  }

  return restoreGCName(
    api,
    threadID
  );
}

async function processRestoreEvent(
  api,
  event
) {
  if (!event) {
    return false;
  }

  let restored = false;

  try {
    const nicknameResult =
      await restoreAfterNicknameChange(
        api,
        event
      );

    if (nicknameResult) {
      restored = true;
    }
  } catch (error) {
    increaseErrorCount();
  }

  try {
    const gcNameResult =
      await restoreAfterGCNameChange(
        api,
        event
      );

    if (gcNameResult) {
      restored = true;
    }
  } catch (error) {
    increaseErrorCount();
  }

  return restored;
}

async function finalEventHandler(
  api,
  event
) {
  if (!api || !event) {
    return false;
  }

  try {
    if (
      isLogEvent(event)
    ) {
      return processRestoreEvent(
        api,
        event
      );
    }

    if (
      isMessageEvent(event)
    ) {
      return processMessageEvent(
        api,
        event
      );
    }

    return false;
  } catch (error) {
    increaseErrorCount();
    return false;
  }
        }async function handleCommandActions(
  api,
  event
) {
  if (!event) {
    return false;
  }

  if (
    !isRyukCommand(event)
  ) {
    return false;
  }

  const senderID =
    getSenderID(event);

  if (!senderID) {
    return true;
  }

  if (!isAdmin(senderID)) {
    return true;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return true;
  }

  const args =
    getCommandArgs(event);

  const sub =
    String(
      args[1] || ""
    )
      .toLowerCase()
      .trim();

  if (!sub) {
    await safeSendMessage(
      api,
      getHelpMessage(),
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "setnick"
  ) {
    return executeNicknameCommand(
      api,
      event
    );
  }

  if (
    sub === "setgname"
  ) {
    return executeGCNameCommand(
      api,
      event
    );
  }

  if (
    sub === "target"
  ) {
    return executeTargetCommand(
      api,
      event
    );
  }

  if (
    sub === "untarget"
  ) {
    removeTarget(threadID);

    await safeSendMessage(
      api,
      "Target removed.",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "on"
  ) {
    setActive(true);

    await safeSendMessage(
      api,
      "RYUK activated.",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "off"
  ) {
    setActive(false);

    await safeSendMessage(
      api,
      "RYUK deactivated.",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "replyon"
  ) {
    setAutoReply(true);

    await safeSendMessage(
      api,
      "Auto-reply: ON",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "replyoff"
  ) {
    setAutoReply(false);

    await safeSendMessage(
      api,
      "Auto-reply: OFF",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "reacton"
  ) {
    setAutoReact(true);

    await safeSendMessage(
      api,
      "Auto-react: ON",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "reactoff"
  ) {
    setAutoReact(false);

    await safeSendMessage(
      api,
      "Auto-react: OFF",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "lock"
  ) {
    setNicknameLock(true);
    setGCNameLock(true);

    syncThreadSettings(
      threadID
    );

    await safeSendMessage(
      api,
      "Nickname + GC name lock: ON",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "unlock"
  ) {
    setNicknameLock(false);
    setGCNameLock(false);

    syncThreadSettings(
      threadID
    );

    await safeSendMessage(
      api,
      "Nickname + GC name lock: OFF",
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "status"
  ) {
    await safeSendMessage(
      api,
      getStatusMessage(
        threadID
      ),
      threadID,
      getMessageID(event)
    );

    return true;
  }

  if (
    sub === "help"
  ) {
    await safeSendMessage(
      api,
      getHelpMessage(),
      threadID,
      getMessageID(event)
    );

    return true;
  }

  return true;
}

async function processAdminCommand(
  api,
  event
) {
  if (!event) {
    return false;
  }

  if (
    !isRyukCommand(event)
  ) {
    return false;
  }

  const senderID =
    getSenderID(event);

  if (!senderID) {
    return true;
  }

  if (!isAdmin(senderID)) {
    return true;
  }

  const key =
    getCommandCooldownKey(
      event
    );

  if (
    isCooldown(
      lastCommand,
      key,
      COMMAND_COOLDOWN
    )
  ) {
    return true;
  }

  lastCommand[key] =
    now();

  try {
    return await handleCommandActions(
      api,
      event
    );
  } catch (error) {
    increaseErrorCount();
    return true;
  }
}

async function processNormalMessage(
  api,
  event
) {
  if (!event) {
    return false;
  }

  const threadID =
    getThreadKey(
      event.threadID
    );

  if (!threadID) {
    return false;
  }

  const data =
    loadData();

  if (
    data.active !== true
  ) {
    return false;
  }

  let result = false;

  try {
    const target =
      await sendTargetReply(
        api,
        event
      );

    if (target) {
      result = true;
    }
  } catch (error) {
    increaseErrorCount();
  }

  try {
    const reply =
      await sendAutoReply(
        api,
        event
      );

    if (reply) {
      result = true;
    }
  } catch (error) {
    increaseErrorCount();
  }

  try {
    const react =
      await sendAutoReaction(
        api,
        event
      );

    if (react) {
      result = true;
    }
  } catch (error) {
    increaseErrorCount();
  }

  return result;
}

async function processRyukEvent(
  api,
  event
) {
  if (!api || !event) {
    return false;
  }

  try {
    if (
      isRyukCommand(event)
    ) {
      return processAdminCommand(
        api,
        event
      );
    }

    if (
      isLogEvent(event)
    ) {
      return processRestoreEvent(
        api,
        event
      );
    }

    if (
      isMessageEvent(event)
    ) {
      return processNormalMessage(
        api,
        event
      );
    }

    return false;
  } catch (error) {
    increaseErrorCount();
    return false;
  }
      }module.exports.run =
  async function({
    api,
    event,
    args
  }) {
    try {
      if (!api || !event) {
        return;
      }

      const command =
        getCommandName(event);

      if (
        command !== COMMAND_NAME
      ) {
        return;
      }

      const senderID =
        getSenderID(event);

      if (!senderID) {
        return;
      }

      /*
       * Admin IDs lamang ang puwedeng
       * gumamit ng Ryuk commands.
       * Ordinary members are silently ignored.
       */
      if (!isAdmin(senderID)) {
        return;
      }

      const threadID =
        getThreadKey(
          event.threadID
        );

      if (!threadID) {
        return;
      }

      validateThreadSettings(
        threadID
      );

      await processAdminCommand(
        api,
        event
      );
    } catch (error) {
      increaseErrorCount();
    }
  };

module.exports.handleEvent =
  async function({
    api,
    event
  }) {
    try {
      if (!api || !event) {
        return;
      }

      const threadID =
        getThreadKey(
          event.threadID
        );

      if (!threadID) {
        return;
      }

      validateThreadSettings(
        threadID
      );

      await processRyukEvent(
        api,
        event
      );
    } catch (error) {
      increaseErrorCount();
    }
  };

module.exports.onLoad =
  function() {
    try {
      ensureData();
      startRuntimeCleanup();
    } catch (error) {
      increaseErrorCount();
    }
  };

process.on(
  "uncaughtException",
  function() {
    try {
      increaseErrorCount();
    } catch (_) {}
  }
);

process.on(
  "unhandledRejection",
  function() {
    try {
      increaseErrorCount();
    } catch (_) {}
  }
);

ensureData();
startRuntimeCleanup();const COMMAND_NAME = "ryuk";

const FINAL_REACTION_LIST = [
  "🔥",
  "💀",
  "🤣",
  "😆",
  "🤡"
];

function finalNormalizeData() {
  const data = loadData();

  if (!data || typeof data !== "object") {
    return;
  }

  if (!data.target || typeof data.target !== "object") {
    data.target = {};
  }

  if (!data.threadSettings || typeof data.threadSettings !== "object") {
    data.threadSettings = {};
  }

  data.nickname =
    normalizeName(data.nickname) ||
    TARGET_NICKNAME;

  data.gcName =
    normalizeName(data.gcName) ||
    TARGET_GC_NAME;

  data.active =
    data.active === true;

  data.autoReply =
    data.autoReply !== false;

  data.autoReact =
    data.autoReact !== false;

  data.nicknameLock =
    data.nicknameLock === true;

  data.gcNameLock =
    data.gcNameLock === true;

  data.replyCount =
    Number(data.replyCount) || 0;

  data.reactionCount =
    Number(data.reactionCount) || 0;

  data.nicknameCount =
    Number(data.nicknameCount) || 0;

  data.restoreCount =
    Number(data.restoreCount) || 0;

  data.gcNameRestores =
    Number(data.gcNameRestores) || 0;

  data.errorCount =
    Number(data.errorCount) || 0;

  data.updatedAt =
    Number(data.updatedAt) || 0;

  saveData(data);
}

function finalGetSettings(threadID) {
  const tid =
    getThreadKey(threadID);

  if (!tid) {
    return null;
  }

  finalNormalizeData();

  const settings =
    getThreadData(tid);

  return {
    nickname:
      normalizeName(settings.nickname) ||
      getNickname(),

    gcName:
      normalizeName(settings.gcName) ||
      getGCName(),

    nicknameLock:
      settings.nicknameLock === true,

    gcNameLock:
      settings.gcNameLock === true
  };
}

function finalShouldIgnoreMessage(event) {
  if (!event) {
    return true;
  }

  if (
    event.isGroup === false
  ) {
    return false;
  }

  return false;
}

async function finalProcess(
  api,
  event
) {
  if (
    !api ||
    !event ||
    finalShouldIgnoreMessage(event)
  ) {
    return false;
  }

  try {
    finalNormalizeData();

    const command =
      getCommandName(event);

    if (
      command === COMMAND_NAME
    ) {
      return processAdminCommand(
        api,
        event
      );
    }

    if (
      isLogEvent(event)
    ) {
      return processRestoreEvent(
        api,
        event
      );
    }

    if (
      isMessageEvent(event)
    ) {
      return processNormalMessage(
        api,
        event
      );
    }

    return false;
  } catch (error) {
    increaseErrorCount();
    return false;
  }
}

module.exports.run =
  async function({
    api,
    event
  }) {
    try {
      if (!api || !event) {
        return;
      }

      if (
        getCommandName(event) !==
        COMMAND_NAME
      ) {
        return;
      }

      const senderID =
        getSenderID(event);

      if (!senderID) {
        return;
      }

      if (!isAdmin(senderID)) {
        return;
      }

      await processAdminCommand(
        api,
        event
      );
    } catch (error) {
      increaseErrorCount();
    }
  };

module.exports.handleEvent =
  async function({
    api,
    event
  }) {
    try {
      await finalProcess(
        api,
        event
      );
    } catch (error) {
      increaseErrorCount();
    }
  };

module.exports.onLoad =
  function() {
    try {
      finalNormalizeData();
      startRuntimeCleanup();
    } catch (error) {
      increaseErrorCount();
    }
  };

ensureData();
finalNormalizeData();
startRuntimeCleanup();

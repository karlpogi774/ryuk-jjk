const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ryuk",
  version: "3.0.0",
  hasPermission: 1,
  credits: "RYUK",
  description:
    "RYUK auto reply, auto react, nickname and group name manager.",
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

const NICKNAME_DELAY =
  1500;

const RESTORE_DELAY =
  1000;

const REPLY_COOLDOWN =
  4000;

const REACTION_COOLDOWN =
  1500;

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
  errorCount: 0,

  updatedAt: 0
};

const lastReply =
  {};

const lastReaction =
  {};

const restoreCooldown =
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

    const saved =
      JSON.parse(raw);

    return {
      ...DEFAULT_DATA,
      ...saved,

      nickname:
        saved.nickname ||
        TARGET_NICKNAME,

      gcName:
        saved.gcName ||
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
      error.message
    );

    return {
      ...DEFAULT_DATA
    };
  }
}

function saveData(data) {
  try {
    data.updatedAt =
      Date.now();

    fs.writeFileSync(
      DATA_PATH,
      JSON.stringify(
        data,
        null,
        2
      )
    );

    return true;
  } catch (error) {
    console.error(
      "[RYUK] Save error:",
      error.message
    );

    return false;
  }
}

function wait(ms) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
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
          return resolve(null);
        }

        api.sendMessage(
          message,
          threadID,
          (error, info) => {
            if (error) {
              console.error(
                "[RYUK] Send error:",
                error.message ||
                  error
              );

              return resolve(null);
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
          error.message
        );

        resolve(null);
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
          return resolve(false);
        }

        api.setMessageReaction(
          reaction,
          messageID,
          error => {
            if (error) {
              return resolve(
                false
              );
            }

            resolve(true);
          },
          true
        );
      } catch (error) {
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
          return resolve(false);
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
          "[RYUK] Nickname error:",
          error.message
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
          return resolve(false);
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
          "[RYUK] Title error:",
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
        api.getThreadInfo(
          threadID,
          (error, info) => {
            if (
              error ||
              !info
            ) {
              return resolve(
                null
              );
            }

            resolve(info);
          }
        );
      } catch (error) {
        resolve(null);
      }
    }
  );
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
    ) || "👍"
  );
    }function canReply(threadID) {
  const key =
    String(threadID);

  const last =
    lastReply[key] || 0;

  const now =
    Date.now();

  if (
    now - last <
    REPLY_COOLDOWN
  ) {
    return false;
  }

  lastReply[key] =
    now;

  return true;
}

function canReact(threadID) {
  const key =
    String(threadID);

  const last =
    lastReaction[key] || 0;

  const now =
    Date.now();

  if (
    now - last <
    REACTION_COOLDOWN
  ) {
    return false;
  }

  lastReaction[key] =
    now;

  return true;
}

function getTarget(
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
      String(threadID)
    ] || null
  );
}

function setTarget(
  data,
  threadID,
  userID
) {
  if (
    !data.target
  ) {
    data.target = {};
  }

  data.target[
    String(threadID)
  ] = String(userID);

  saveData(data);
}

function removeTarget(
  data,
  threadID
) {
  if (
    data.target &&
    data.target[
      String(threadID)
    ]
  ) {
    delete data.target[
      String(threadID)
    ];
  }

  saveData(data);
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
    }async function setAllNicknames(
  api,
  threadID,
  nickname
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
        id => String(id)
      )
    )
  ];

  let success = 0;
  let failed = 0;

  for (
    const userID of uniqueIDs
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
      } else {
        failed++;
      }
    } catch (error) {
      failed++;

      console.error(
        "[RYUK] Setnick error:",
        error.message
      );
    }

    await wait(
      NICKNAME_DELAY
    );
  }

  return {
    total:
      uniqueIDs.length,
    success,
    failed
  };
}

async function setGroupName(
  api,
  threadID,
  name
) {
  return await safeTitle(
    api,
    name,
    threadID
  );
}async function restoreNickname(
  api,
  threadID,
  userID,
  data
) {
  if (
    !data.nicknameLock ||
    !data.active
  ) {
    return;
  }

  const key =
    `${threadID}:${userID}`;

  const current =
    Date.now();

  if (
    restoreCooldown[key] &&
    current -
      restoreCooldown[key] <
      RESTORE_DELAY
  ) {
    return;
  }

  restoreCooldown[key] =
    current;

  const nickname =
    data.nickname ||
    TARGET_NICKNAME;

  const success =
    await safeNickname(
      api,
      nickname,
      threadID,
      userID
    );

  if (success) {
    data.restoreCount =
      Number(
        data.restoreCount || 0
      ) + 1;

    saveData(data);
  }
}

async function restoreGroupName(
  api,
  threadID,
  data
) {
  if (
    !data.gcNameLock ||
    !data.active
  ) {
    return;
  }

  const name =
    data.gcName ||
    TARGET_GC_NAME;

  const success =
    await setGroupName(
      api,
      threadID,
      name
    );

  if (success) {
    data.gcNameRestores =
      Number(
        data.gcNameRestores || 0
      ) + 1;

    saveData(data);
  }
      }async function handleLockEvents(
  api,
  event,
  data
) {
  const threadID =
    event.threadID;

  if (!threadID) {
    return false;
  }

  if (
    event.logMessageType ===
    "log:user-nickname"
  ) {
    if (
      !data.active ||
      !data.nicknameLock
    ) {
      return true;
    }

    const logData =
      event.logMessageData ||
      {};

    const userID =
      logData.participant_id;

    const currentNickname =
      logData.nickname;

    const wanted =
      data.nickname ||
      TARGET_NICKNAME;

    if (
      userID &&
      currentNickname !== wanted
    ) {
      await wait(
        RESTORE_DELAY
      );

      await restoreNickname(
        api,
        threadID,
        userID,
        data
      );
    }

    return true;
  }

  if (
    event.logMessageType ===
    "log:thread-name"
  ) {
    if (
      !data.active ||
      !data.gcNameLock
    ) {
      return true;
    }

    const logData =
      event.logMessageData ||
      {};

    const currentName =
      logData.name;

    const wanted =
      data.gcName ||
      TARGET_GC_NAME;

    if (
      currentName !== wanted
    ) {
      await wait(
        RESTORE_DELAY
      );

      await restoreGroupName(
        api,
        threadID,
        data
      );
    }

    return true;
  }

  return false;
  }async function handleAutoFeatures(
  api,
  event,
  data
) {
  if (!data.active) {
    return;
  }

  const threadID =
    event.threadID;

  const senderID =
    event.senderID;

  const messageID =
    event.messageID;

  if (
    !threadID ||
    !senderID ||
    !messageID
  ) {
    return;
  }

  let botID = null;

  try {
    botID =
      api.getCurrentUserID();
  } catch (error) {
    botID = null;
  }

  if (
    botID &&
    String(senderID) ===
      String(botID)
  ) {
    return;
  }

  if (
    !isTarget(
      data,
      threadID,
      senderID
    )
  ) {
    return;
  }

  if (
    data.autoReact &&
    canReact(threadID)
  ) {
    const reaction =
      getAutoReaction();

    const reacted =
      await safeReaction(
        api,
        reaction,
        messageID
      );

    if (reacted) {
      data.reactionCount =
        Number(
          data.reactionCount || 0
        ) + 1;

      saveData(data);
    }
  }

  if (
    !data.autoReply ||
    !event.body
  ) {
    return;
  }

  const body =
    String(event.body)
      .trim();

  if (
    !body ||
    body.startsWith("/")
  ) {
    return;
  }

  if (
    !canReply(threadID)
  ) {
    return;
  }

  const reply =
    getAutoReply();

  const info =
    await safeSend(
      api,
      reply,
      threadID,
      messageID
    );

  if (info) {
    data.replyCount =
      Number(
        data.replyCount || 0
      ) + 1;

    saveData(data);
  }
  }function parseCommand(args) {
  if (
    !Array.isArray(args) ||
    !args.length
  ) {
    return {
      command: "help",
      values: []
    };
  }

  return {
    command:
      String(args[0])
        .toLowerCase()
        .trim(),

    values:
      args
        .slice(1)
        .filter(Boolean)
  };
}

function getStatus(
  data,
  threadID
) {
  const target =
    getTarget(
      data,
      threadID
    );

  return (
    `☠️ RYUK STATUS\n\n` +
    `Bot: ${
      data.active
        ? "🟢 ON"
        : "🔴 OFF"
    }\n` +
    `Auto Reply: ${
      data.autoReply
        ? "ON"
        : "OFF"
    }\n` +
    `Auto React: ${
      data.autoReact
        ? "ON"
        : "OFF"
    }\n` +
    `Nickname Lock: ${
      data.nicknameLock
        ? "ON"
        : "OFF"
    }\n` +
    `GC Name Lock: ${
      data.gcNameLock
        ? "ON"
        : "OFF"
    }\n` +
    `Nickname: ${
      data.nickname
    }\n` +
    `GC Name: ${
      data.gcName
    }\n` +
    `Target: ${
      target || "ALL"
    }\n\n` +
    `Replies: ${
      data.replyCount || 0
    }\n` +
    `Reactions: ${
      data.reactionCount || 0
    }\n` +
    `Nicknames: ${
      data.nicknameCount || 0
    }\n` +
    `Restores: ${
      data.restoreCount || 0
    }`
  );
}

function getHelp() {
  return (
    `☠️ RYUK COMMANDS\n\n` +
    `/ryuk on\n` +
    `/ryuk off\n` +
    `/ryuk status\n\n` +
    `/ryuk lock\n` +
    `/ryuk unlock\n\n` +
    `/ryuk setnick\n` +
    `/ryuk setgname\n\n` +
    `/ryuk target <UID>\n` +
    `/ryuk untarget\n\n` +
    `/ryuk replyon\n` +
    `/ryuk replyoff\n` +
    `/ryuk reacton\n` +
    `/ryuk reactoff\n\n` +
    `/ryuk help`
  );
}module.exports.run =
  async function ({
    api,
    event,
    args
  }) {
    const threadID =
      event.threadID;

    const messageID =
      event.messageID;

    const data =
      loadData();

    const parsed =
      parseCommand(args);

    const command =
      parsed.command;

    try {
      if (
        command === "help"
      ) {
        return safeSend(
          api,
          getHelp(),
          threadID,
          messageID
        );
      }

      if (
        command === "on"
      ) {
        data.active = true;

        data.nickname =
          TARGET_NICKNAME;

        data.gcName =
          TARGET_GC_NAME;

        saveData(data);

        await safeSend(
          api,
          "☠️ RYUK ON\nAuto-reply, auto-react, nickname restore and GC-name restore are active.",
          threadID,
          messageID
        );

        return;
      }

      if (
        command === "off"
      ) {
        data.active = false;
        saveData(data);

        return safeSend(
          api,
          "☠️ RYUK OFF",
          threadID,
          messageID
        );
      }

      if (
        command === "status"
      ) {
        return safeSend(
          api,
          getStatus(
            data,
            threadID
          ),
          threadID,
          messageID
        );
      }

      if (
        command === "replyon"
      ) {
        data.autoReply = true;
        saveData(data);

        return safeSend(
          api,
          "✅ Auto-reply ON",
          threadID,
          messageID
        );
      }

      if (
        command === "replyoff"
      ) {
        data.autoReply = false;
        saveData(data);

        return safeSend(
          api,
          "✅ Auto-reply OFF",
          threadID,
          messageID
        );
      }

      if (
        command === "reacton"
      ) {
        data.autoReact = true;
        saveData(data);

        return safeSend(
          api,
          "✅ Auto-react ON",
          threadID,
          messageID
        );
      }

      if (
        command === "reactoff"
      ) {
        data.autoReact = false;
        saveData(data);

        return safeSend(
          api,
          "✅ Auto-react OFF",
          threadID,
          messageID
        );
      }

      if (
        command === "lock"
      ) {
        data.nicknameLock = true;
        data.gcNameLock = true;

        data.nickname =
          TARGET_NICKNAME;

        data.gcName =
          TARGET_GC_NAME;

        saveData(data);

        return safeSend(
          api,
          "🔒 Nickname Lock + GC Name Lock ON",
          threadID,
          messageID
        );
      }

      if (
        command === "unlock"
      ) {
        data.nicknameLock = false;
        data.gcNameLock = false;

        saveData(data);

        return safeSend(
          api,
          "🔓 Nickname Lock + GC Name Lock OFF",
          threadID,
          messageID
        );
      }

      if (
        command === "setnick"
      ) {
        data.nickname =
          TARGET_NICKNAME;

        data.nicknameLock =
          true;

        saveData(data);

        await safeSend(
          api,
          "🥷 Setting RYUK POGI to all members...",
          threadID,
          messageID
        );

        const result =
          await setAllNicknames(
            api,
            threadID,
            TARGET_NICKNAME
          );

        data.nicknameCount +=
          result.success;

        saveData(data);

        return safeSend(
          api,
          `🥷 SETNICK COMPLETE\n\n` +
          `Nickname: ${TARGET_NICKNAME}\n` +
          `Members: ${result.total}\n` +
          `Success: ${result.success}\n` +
          `Failed: ${result.failed}`,
          threadID
        );
      }

      if (
        command === "setgname"
      ) {
        data.gcName =
          TARGET_GC_NAME;

        data.gcNameLock =
          true;

        saveData(data);

        const success =
          await setGroupName(
            api,
            threadID,
            TARGET_GC_NAME
          );

        return safeSend(
          api,
          success
            ? `🥷 GC NAME SET\n${TARGET_GC_NAME}`
            : "⚠️ Hindi na-apply ang GC name.",
          threadID,
          messageID
        );
      }      if (
        command === "target"
      ) {
        const userID =
          parsed.values[0];

        if (!userID) {
          return safeSend(
            api,
            "Usage: /ryuk target <UID>",
            threadID,
            messageID
          );
        }

        setTarget(
          data,
          threadID,
          userID
        );

        return safeSend(
          api,
          `🎯 Target set:\n${userID}\n\nRYUK will auto-reply only to this user in this GC.`,
          threadID,
          messageID
        );
      }

      if (
        command === "untarget"
      ) {
        removeTarget(
          data,
          threadID
        );

        return safeSend(
          api,
          "🎯 Target removed.\nRYUK can reply to all members again.",
          threadID,
          messageID
        );
      }

      if (
        command === "setall"
      ) {
        data.nickname =
          TARGET_NICKNAME;

        data.gcName =
          TARGET_GC_NAME;

        data.nicknameLock =
          true;

        data.gcNameLock =
          true;

        saveData(data);

        await safeSend(
          api,
          "🥷 Applying RYUK POGI to nicknames and group name...",
          threadID,
          messageID
        );

        const nickResult =
          await setAllNicknames(
            api,
            threadID,
            TARGET_NICKNAME
          );

        const nameResult =
          await setGroupName(
            api,
            threadID,
            TARGET_GC_NAME
          );

        data.nicknameCount +=
          nickResult.success;

        saveData(data);

        return safeSend(
          api,
          `☠️ RYUK SETALL COMPLETE\n\n` +
          `Nickname: ${TARGET_NICKNAME}\n` +
          `GC Name: ${TARGET_GC_NAME}\n\n` +
          `Members: ${nickResult.total}\n` +
          `Nickname success: ${nickResult.success}\n` +
          `Nickname failed: ${nickResult.failed}\n` +
          `GC name: ${
            nameResult
              ? "SUCCESS"
              : "FAILED"
          }`,
          threadID
        );
      }

      return safeSend(
        api,
        getHelp(),
        threadID,
        messageID
      );

    } catch (error) {
      data.errorCount =
        Number(
          data.errorCount || 0
        ) + 1;

      saveData(data);

      console.error(
        "[RYUK] Command error:",
        error.message ||
          error
      );

      return safeSend(
        api,
        "⚠️ RYUK command error.",
        threadID,
        messageID
      );
    }
  };module.exports.handleEvent =
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

      if (!threadID) {
        return;
      }

      const data =
        loadData();

      const lockEvent =
        await handleLockEvents(
          api,
          event,
          data
        );

      if (lockEvent) {
        return;
      }

      if (!data.active) {
        return;
      }

      if (
        !event.messageID ||
        !event.senderID
      ) {
        return;
      }

      let botID = null;

      try {
        botID =
          api.getCurrentUserID();
      } catch (error) {
        botID = null;
      }

      if (
        botID &&
        String(event.senderID) ===
          String(botID)
      ) {
        return;
      }

      await handleAutoFeatures(
        api,
        event,
        data
      );

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
            data.errorCount || 0
          ) + 1;

        saveData(data);
      } catch (_) {}
    }
  };async function handleNewMember(
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

  const threadID =
    event.threadID;

  if (!threadID) {
    return;
  }

  const logData =
    event.logMessageData ||
    {};

  const addedParticipants =
    Array.isArray(
      logData.addedParticipants
    )
      ? logData.addedParticipants
      : [];

  if (
    addedParticipants.length ===
    0
  ) {
    return;
  }

  const nickname =
    data.nickname ||
    TARGET_NICKNAME;

  for (
    const participant
    of addedParticipants
  ) {
    const userID =
      participant &&
      participant.userFbId;

    if (!userID) {
      continue;
    }

    await wait(
      NICKNAME_DELAY
    );

    const success =
      await safeNickname(
        api,
        nickname,
        threadID,
        String(userID)
      );

    if (success) {
      data.nicknameCount =
        Number(
          data.nicknameCount || 0
        ) + 1;

      saveData(data);
    }
  }
}

async function handleGroupNameProtection(
  api,
  event,
  data
) {
  if (
    !data ||
    !data.active ||
    !data.gcNameLock
  ) {
    return;
  }

  if (
    event.logMessageType !==
    "log:thread-name"
  ) {
    return;
  }

  const threadID =
    event.threadID;

  if (!threadID) {
    return;
  }

  const logData =
    event.logMessageData ||
    {};

  const currentName =
    logData.name;

  const wantedName =
    data.gcName ||
    TARGET_GC_NAME;

  if (
    currentName ===
    wantedName
  ) {
    return;
  }

  await wait(
    RESTORE_DELAY
  );

  await restoreGroupName(
    api,
    threadID,
    data
  );
  }async function processRyukEvent(
  api,
  event
) {
  if (
    !api ||
    !event ||
    !event.threadID
  ) {
    return;
  }

  const data =
    loadData();

  try {
    const lockHandled =
      await handleLockEvents(
        api,
        event,
        data
      );

    if (lockHandled) {
      return;
    }

    await handleNewMember(
      api,
      event,
      data
    );

    await handleGroupNameProtection(
      api,
      event,
      data
    );

    if (
      !data.active
    ) {
      return;
    }

    if (
      event.logMessageType
    ) {
      return;
    }

    await handleAutoFeatures(
      api,
      event,
      data
    );

  } catch (error) {
    console.error(
      "[RYUK] Process error:",
      error.message ||
        error
    );

    try {
      data.errorCount =
        Number(
          data.errorCount || 0
        ) + 1;

      saveData(data);
    } catch (_) {}
  }
}

module.exports.handleEvent =
  async function ({
    api,
    event
  }) {
    try {
      await processRyukEvent(
        api,
        event
      );
    } catch (error) {
      console.error(
        "[RYUK] Handler error:",
        error.message ||
          error
      );
    }
  };function cleanupCaches() {
  const now =
    Date.now();

  const replyKeys =
    Object.keys(
      lastReply
    );

  for (
    const key of replyKeys
  ) {
    if (
      now -
        lastReply[key] >
      60000
    ) {
      delete lastReply[key];
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
      now -
        lastReaction[key] >
      60000
    ) {
      delete lastReaction[key];
    }
  }

  const restoreKeys =
    Object.keys(
      restoreCooldown
    );

  for (
    const key of restoreKeys
  ) {
    if (
      now -
        restoreCooldown[key] >
      60000
    ) {
      delete restoreCooldown[key];
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
      saveData({
        ...DEFAULT_DATA
      });
    }

    const data =
      loadData();

    if (
      !data.target ||
      typeof data.target !==
        "object"
    ) {
      data.target = {};
    }

    if (
      !data.nickname
    ) {
      data.nickname =
        TARGET_NICKNAME;
    }

    if (
      !data.gcName
    ) {
      data.gcName =
        TARGET_GC_NAME;
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

    saveData(data);

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
);

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ryuk",
  version: "1.0.0",
  hasPermission: 0,
  credits: "RYUK",
  description:
    "RYUK auto-reply, auto-react, nickname and group-name manager.",
  usePrefix: true,
  commandCategory: "Fun",
  usages:
    "/ryuk on | off | status | lock | unlock | setnick | setgname | target | untarget",
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

const DEFAULT_DATA = {
  active: false,
  autoReply: true,
  autoReact: true,
  nicknameLock: false,
  gcNameLock: false,
  nickname: "RYUK POGI ON TOP",
  gcName: "RYUK POGI ON TOP",
  target: {},
  replyDelay: 2000,
  reactionDelay: 1500,
  replyCount: 0,
  reactionCount: 0,
  commandCount: 0,
  errorCount: 0,
  updatedAt: Date.now()
};

function loadData() {
  try {
    if (
      fs.existsSync(DATA_PATH)
    ) {
      const raw =
        fs.readFileSync(
          DATA_PATH,
          "utf8"
        );

      const saved =
        JSON.parse(raw);

      return {
        ...DEFAULT_DATA,
        ...saved
      };
    }
  } catch (error) {
    console.error(
      "[RYUK] Load error:",
      error.message
    );
  }

  return {
    ...DEFAULT_DATA,
    target: {}
  };
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

function isAdmin(userID) {
  return ADMIN_IDS.includes(
    String(userID)
  );
}const REPLY_LINES = [
  "👁️ RYUK: Nakita ko yan.",
  "💀 RYUK: Present.",
  "🔥 RYUK: Ayan na naman.",
  "🤣 RYUK: Grabe ka naman.",
  "😈 RYUK: Narinig kita.",
  "👑 RYUK: RYUK is here.",
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
  "💀 RYUK: Message received."
];

const REACTIONS = [
  "💀",
  "🤣",
  "😆",
  "🔥",
  "🤡"
];

function randomItem(list) {
  if (
    !Array.isArray(list) ||
    !list.length
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

function getReply() {
  return (
    randomItem(
      REPLY_LINES
    ) ||
    "💀 RYUK: Present."
  );
}

function getReaction() {
  return (
    randomItem(
      REACTIONS
    ) ||
    "👍"
  );
}const lastReplyTime = {};
const lastReactionTime = {};
const seenMessages = new Set();
const targetUsers = new Map();

const REPLY_COOLDOWN = 3000;
const REACTION_COOLDOWN = 1500;
const MAX_SEEN_MESSAGES = 3000;

function now() {
  return Date.now();
}

function canReply(threadID) {
  const time =
    lastReplyTime[threadID] || 0;

  if (
    now() - time <
    REPLY_COOLDOWN
  ) {
    return false;
  }

  lastReplyTime[threadID] =
    now();

  return true;
}

function canReact(threadID) {
  const time =
    lastReactionTime[threadID] || 0;

  if (
    now() - time <
    REACTION_COOLDOWN
  ) {
    return false;
  }

  lastReactionTime[threadID] =
    now();

  return true;
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
    seenMessages.has(id)
  ) {
    return true;
  }

  seenMessages.add(id);

  if (
    seenMessages.size >
    MAX_SEEN_MESSAGES
  ) {
    const first =
      seenMessages.values()
        .next()
        .value;

    seenMessages.delete(first);
  }

  return false;
    }function safeMessage(
  api,
  message,
  threadID,
  replyTo
) {
  return new Promise(
    (resolve) => {
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

            resolve(info || null);
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
    (resolve) => {
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
          (error) => {
            if (error) {
              console.error(
                "[RYUK] Reaction error:",
                error.message ||
                error
              );

              return resolve(false);
            }

            resolve(true);
          },
          true
        );
      } catch (error) {
        console.error(
          "[RYUK] Reaction exception:",
          error.message
        );

        resolve(false);
      }
    }
  );
      }function safeNickname(
  api,
  nickname,
  threadID,
  userID
) {
  return new Promise(
    (resolve) => {
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
          (error) => {
            if (error) {
              console.error(
                "[RYUK] Nickname error:",
                error.message ||
                error
              );

              return resolve(false);
            }

            resolve(true);
          }
        );
      } catch (error) {
        console.error(
          "[RYUK] Nickname exception:",
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
    (resolve) => {
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
          (error) => {
            if (error) {
              console.error(
                "[RYUK] Title error:",
                error.message ||
                error
              );

              return resolve(false);
            }

            resolve(true);
          }
        );
      } catch (error) {
        console.error(
          "[RYUK] Title exception:",
          error.message
        );

        resolve(false);
      }
    }
  );
}function isTargeted(
  data,
  threadID,
  senderID
) {
  if (
    !data ||
    !data.target ||
    !threadID ||
    !senderID
  ) {
    return false;
  }

  const target =
    data.target[
      String(threadID)
    ];

  if (!target) {
    return false;
  }

  return (
    String(target) ===
    String(senderID)
  );
}

function setTarget(
  data,
  threadID,
  userID
) {
  if (!data.target) {
    data.target = {};
  }

  data.target[
    String(threadID)
  ] = String(userID);

  return saveData(data);
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

  return saveData(data);
}

function getTarget(
  data,
  threadID
) {
  if (
    !data.target ||
    !data.target[
      String(threadID)
    ]
  ) {
    return null;
  }

  return String(
    data.target[
      String(threadID)
    ]
  );
}function normalizeData(data) {
  const base = {
    ...DEFAULT_DATA,
    target: {}
  };

  if (
    !data ||
    typeof data !== "object"
  ) {
    return base;
  }

  const merged = {
    ...base,
    ...data
  };

  if (
    !merged.target ||
    typeof merged.target !==
    "object" ||
    Array.isArray(
      merged.target
    )
  ) {
    merged.target = {};
  }

  if (
    typeof merged.active !==
    "boolean"
  ) {
    merged.active = false;
  }

  if (
    typeof merged.autoReply !==
    "boolean"
  ) {
    merged.autoReply = true;
  }

  if (
    typeof merged.autoReact !==
    "boolean"
  ) {
    merged.autoReact = true;
  }

  if (
    typeof merged.nicknameLock !==
    "boolean"
  ) {
    merged.nicknameLock = false;
  }

  if (
    typeof merged.gcNameLock !==
    "boolean"
  ) {
    merged.gcNameLock = false;
  }

  return merged;
}

function getData() {
  return normalizeData(
    loadData()
  );
}function markCommand(data) {
  data.commandCount =
    Number(data.commandCount || 0) + 1;

  saveData(data);
}

function markReply(data) {
  data.replyCount =
    Number(data.replyCount || 0) + 1;

  saveData(data);
}

function markReaction(data) {
  data.reactionCount =
    Number(data.reactionCount || 0) + 1;

  saveData(data);
}

function markError(data) {
  data.errorCount =
    Number(data.errorCount || 0) + 1;

  saveData(data);
}

function getRemainingStats(data) {
  return {
    replies:
      Number(data.replyCount || 0),

    reactions:
      Number(data.reactionCount || 0),

    commands:
      Number(data.commandCount || 0),

    errors:
      Number(data.errorCount || 0)
  };
}function getStatusText(data) {
  const status =
    data.active
      ? "🟢 ACTIVE"
      : "🔴 OFF";

  const reply =
    data.autoReply
      ? "ON"
      : "OFF";

  const react =
    data.autoReact
      ? "ON"
      : "OFF";

  const nick =
    data.nicknameLock
      ? "LOCKED"
      : "OFF";

  const gname =
    data.gcNameLock
      ? "LOCKED"
      : "OFF";

  const target =
    getTarget(
      data,
      data.currentThreadID
    ) || "NONE";

  return (
    `☠️ RYUK STATUS\n\n` +
    `Bot: ${status}\n` +
    `Auto Reply: ${reply}\n` +
    `Auto React: ${react}\n` +
    `Nickname Lock: ${nick}\n` +
    `Group Name Lock: ${gname}\n` +
    `Target: ${target}\n\n` +
    `Replies: ${data.replyCount || 0}\n` +
    `Reactions: ${data.reactionCount || 0}\n` +
    `Commands: ${data.commandCount || 0}\n` +
    `Errors: ${data.errorCount || 0}`
  );
}function getHelpText() {
  return (
    `☠️ RYUK COMMANDS\n\n` +
    `/ryuk on\n` +
    `/ryuk off\n` +
    `/ryuk status\n` +
    `/ryuk lock\n` +
    `/ryuk unlock\n\n` +
    `/ryuk setnick <name>\n` +
    `/ryuk setgname <name>\n\n` +
    `/ryuk target <UID>\n` +
    `/ryuk untarget\n\n` +
    `/ryuk replyon\n` +
    `/ryuk replyoff\n` +
    `/ryuk reacton\n` +
    `/ryuk reactoff\n\n` +
    `☠️ RYUK auto-reply and` +
    ` auto-react controls.`
  );
}

function parseCommand(args) {
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
        }async function handleAutoReaction(
  api,
  event,
  data
) {
  if (!data.active) {
    return;
  }

  if (!data.autoReact) {
    return;
  }

  if (!event.messageID) {
    return;
  }

  if (!canReact(event.threadID)) {
    return;
  }

  const reaction =
    getReaction();

  if (!reaction) {
    return;
  }

  const success =
    await safeReaction(
      api,
      reaction,
      event.messageID
    );

  if (success) {
    markReaction(data);
  }
}

async function handleAutoReply(
  api,
  event,
  data
) {
  if (!data.active) {
    return;
  }

  if (!data.autoReply) {
    return;
  }

  if (!event.body) {
    return;
  }

  if (
    String(event.body)
      .startsWith("/")
  ) {
    return;
  }

  if (!canReply(event.threadID)) {
    return;
  }

  const target =
    getTarget(
      data,
      event.threadID
    );

  if (
    target &&
    String(event.senderID) !==
    String(target)
  ) {
    return;
  }

  const reply =
    getReply();

  const info =
    await safeMessage(
      api,
      reply,
      event.threadID,
      event.messageID
    );

  if (info) {
    markReply(data);
  }
      }async function restoreNickname(
  api,
  event,
  data
) {
  if (!data.nicknameLock) {
    return;
  }

  if (!data.nickname) {
    return;
  }

  if (!event.threadID) {
    return;
  }

  if (!event.senderID) {
    return;
  }

  await safeNickname(
    api,
    data.nickname,
    event.threadID,
    event.senderID
  );
}

async function restoreGroupName(
  api,
  event,
  data
) {
  if (!data.gcNameLock) {
    return;
  }

  if (!data.gcName) {
    return;
  }

  if (!event.threadID) {
    return;
  }

  await safeTitle(
    api,
    data.gcName,
    event.threadID
  );
}

function isThreadNameEvent(event) {
  return (
    event.logMessageType ===
    "log:thread-name"
  );
}

function isNicknameEvent(event) {
  return (
    event.logMessageType ===
    "log:subscribe" ||
    event.logMessageType ===
    "log:unsubscribe"
  );
  }function handleGroupEvent(
  api,
  event,
  data
) {
  if (!data.active) {
    return;
  }

  if (
    isThreadNameEvent(event) &&
    data.gcNameLock
  ) {
    setTimeout(() => {
      restoreGroupName(
        api,
        event,
        data
      );
    }, 800);

    return;
  }

  if (
    isNicknameEvent(event) &&
    data.nicknameLock
  ) {
    setTimeout(() => {
      restoreNickname(
        api,
        event,
        data
      );
    }, 800);
  }
}

function isUsableMessage(event) {
  if (!event) {
    return false;
  }

  if (!event.threadID) {
    return false;
  }

  if (!event.senderID) {
    return false;
  }

  if (!event.messageID) {
    return false;
  }

  return true;
}

function shouldIgnoreBot(
  api,
  event
) {
  try {
    const botID =
      api.getCurrentUserID();

    return (
      String(event.senderID) ===
      String(botID)
    );
  } catch (error) {
    return false;
  }
      }module.exports.handleEvent =
  async function ({
    api,
    event
  }) {
    try {
      if (!event) {
        return;
      }

      const data =
        getData();

      if (
        isThreadNameEvent(event) ||
        isNicknameEvent(event)
      ) {
        handleGroupEvent(
          api,
          event,
          data
        );
      }

      if (
        !isUsableMessage(event)
      ) {
        return;
      }

      if (
        shouldIgnoreBot(
          api,
          event
        )
      ) {
        return;
      }

      if (
        rememberMessage(
          event.messageID
        )
      ) {
        return;
      }

      if (!data.active) {
        return;
      }

      await handleAutoReaction(
        api,
        event,
        data
      );

      await handleAutoReply(
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

      const data =
        getData();

      markError(data);
    }
  };module.exports.run =
  async function ({
    api,
    event,
    args
  }) {
    try {
      const threadID =
        event.threadID;

      const messageID =
        event.messageID;

      const senderID =
        event.senderID;

      const parsed =
        parseCommand(args);

      const command =
        parsed.command;

      const values =
        parsed.values;

      const data =
        getData();

      data.currentThreadID =
        threadID;

      markCommand(data);

      if (
        command === "help"
      ) {
        return safeMessage(
          api,
          getHelpText(),
          threadID,
          messageID
        );
      }

      if (
        command === "on"
      ) {
        data.active = true;
        saveData(data);

        return safeMessage(
          api,
          "☠️ RYUK ACTIVE\nAuto-reply and auto-react are ON.",
          threadID,
          messageID
        );
      }

      if (
        command === "off"
      ) {
        data.active = false;
        saveData(data);

        return safeMessage(
          api,
          "☠️ RYUK OFF\nAuto features stopped.",
          threadID,
          messageID
        );
      }

      if (
        command === "status"
      ) {
        return safeMessage(
          api,
          getStatusText(data),
          threadID,
          messageID
        );
      }

      if (
        command === "replyon"
      ) {
        data.autoReply = true;
        saveData(data);

        return safeMessage(
          api,
          "✅ RYUK auto-reply: ON",
          threadID,
          messageID
        );
      }

      if (
        command === "replyoff"
      ) {
        data.autoReply = false;
        saveData(data);

        return safeMessage(
          api,
          "✅ RYUK auto-reply: OFF",
          threadID,
          messageID
        );
      }

      if (
        command === "reacton"
      ) {
        data.autoReact = true;
        saveData(data);

        return safeMessage(
          api,
          "✅ RYUK auto-react: ON",
          threadID,
          messageID
        );
      }

      if (
        command === "reactoff"
      ) {
        data.autoReact = false;
        saveData(data);

        return safeMessage(
          api,
          "✅ RYUK auto-react: OFF",
          threadID,
          messageID
        );
      }

      if (
        command === "lock"
      ) {
        data.nicknameLock = true;
        data.gcNameLock = true;
        saveData(data);

        return safeMessage(
          api,
          "🔒 RYUK locks enabled.\nNickname and group name will be restored when supported by the bot API.",
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

        return safeMessage(
          api,
          "🔓 RYUK locks disabled.",
          threadID,
          messageID
        );
      }

      if (
        command === "setnick"
      ) {
        const nickname =
          values.join(" ").trim();

        if (!nickname) {
          return safeMessage(
            api,
            "Usage: /ryuk setnick <name>",
            threadID,
            messageID
          );
        }

        data.nickname =
          nickname;

        data.nicknameLock =
          true;

        saveData(data);

        const success =
          await safeNickname(
            api,
            nickname,
            threadID,
            senderID
          );

        return safeMessage(
          api,
          success
            ? `✅ Nickname set to: ${nickname}`
            : "⚠️ Nickname was saved, but the Messenger API did not apply the change.",
          threadID,
          messageID
        );
      }

      if (
        command === "setgname"
      ) {
        const name =
          values.join(" ").trim();

        if (!name) {
          return safeMessage(
            api,
            "Usage: /ryuk setgname <name>",
            threadID,
            messageID
          );
        }

        data.gcName =
          name;

        data.gcNameLock =
          true;

        saveData(data);

        const success =
          await safeTitle(
            api,
            name,
            threadID
          );

        return safeMessage(
          api,
          success
            ? `✅ Group name set to: ${name}`
            : "⚠️ Group name was saved, but the Messenger API did not apply the change.",
          threadID,
          messageID
        );
      }

      if (
        command === "target"
      ) {
        const userID =
          values[0];

        if (!userID) {
          return safeMessage(
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

        return safeMessage(
          api,
          `🎯 Target set: ${userID}`,
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

        return safeMessage(
          api,
          "🎯 Target removed.",
          threadID,
          messageID
        );
      }

      return safeMessage(
        api,
        getHelpText(),
        threadID,
        messageID
      );

    } catch (error) {
      console.error(
        "[RYUK] Command error:",
        error.message ||
        error
      );

      const data =
        getData();

      markError(data);

      return safeMessage(
        api,
        "⚠️ RYUK encountered an error while processing the command.",
        event.threadID,
        event.messageID
      );
    }
  };

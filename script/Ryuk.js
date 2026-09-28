"use strict";

const fs = require("fs");
const path = require("path");

const ADMIN_IDS = [
    "61594055835097",
    "61593892603402",
    "61594325727109",
    "61594022290817"
];

const DATA_FILE =
    path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
    active: true,
    autoReply: true,
    autoReact: true,

    nicknameLock: false,
    gcNameLock: false,

    targetMode: false,
    targetUserID: null,

    nickname: "RYUK POGI ON TOP",
    gcName: "RYUK POGI ON TOP",

    autoReplyCooldown: 8000,

    replyIndex: 0,

    totalReplies: 0,
    totalReactions: 0,
    totalCommands: 0,
    totalErrors: 0,

    updatedAt: Date.now()
};

const REPLY_MESSAGES = [
    "RYUK is here.",
    "Ano kailangan mo?",
    "Hello.",
    "Nandito lang ako.",
    "Ano meron?",
    "Sige.",
    "Okay.",
    "Noted.",
    "Gets ko.",
    "Wait lang.",
    "HAHAHA.",
    "Grabe naman.",
    "Ano yan?",
    "Sabihin mo lang.",
    "Nakita ko.",
    "Present.",
    "RYUK online.",
    "Okay lang yan.",
    "Sige lang.",
    "Tuloy mo lang.",
    "Ano usapan?",
    "Nakikinig ako.",
    "Andito ako.",
    "Copy.",
    "Roger.",
    "Ayos.",
    "Nice.",
    "Haha.",
    "Legit.",
    "Tama.",
    "Gets.",
    "Oo.",
    "Hindi.",
    "Bakit?",
    "Talaga?",
    "Seryoso?",
    "Wait.",
    "Sandali.",
    "Okay na.",
    "Good.",
    "Not bad.",
    "Astig.",
    "Lakas.",
    "Grabe.",
    "HAHA.",
    "😂",
    "🤣",
    "💀",
    "🔥",
    "😈"
];

const MAX_SEEN = 3000;

const SEEN_MESSAGES =
    new Set();

const REPLY_COOLDOWNS =
    new Map();

function isAdmin(id) {
    return ADMIN_IDS.includes(
        String(id)
    );
}

function loadData() {
    try {
        if (
            !fs.existsSync(
                DATA_FILE
            )
        ) {
            return {
                ...DEFAULT_DATA
            };
        }

        const raw =
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            );

        return {
            ...DEFAULT_DATA,
            ...JSON.parse(raw)
        };
    } catch {
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
            DATA_FILE,
            JSON.stringify(
                data,
                null,
                2
            )
        );

        return true;
    } catch {
        return false;
    }
}

function getReply(data) {
    const index =
        Number(data.replyIndex) || 0;

    const reply =
        REPLY_MESSAGES[
            index %
            REPLY_MESSAGES.length
        ];

    data.replyIndex =
        (
            index + 1
        ) %
        REPLY_MESSAGES.length;

    return reply;
  }function safeSend(
    api,
    message,
    threadID
) {
    return new Promise(
        resolve => {
            if (
                !api ||
                typeof api.sendMessage !==
                    "function"
            ) {
                resolve(false);
                return;
            }

            try {
                api.sendMessage(
                    message,
                    threadID,
                    () => {
                        resolve(true);
                    }
                );
            } catch {
                resolve(false);
            }
        }
    );
}

function canReply(
    threadID,
    data
) {
    const now =
        Date.now();

    const old =
        REPLY_COOLDOWNS.get(
            threadID
        );

    const cooldown =
        Number(
            data.autoReplyCooldown
        ) || 8000;

    if (
        old &&
        now - old < cooldown
    ) {
        return false;
    }

    REPLY_COOLDOWNS.set(
        threadID,
        now
    );

    return true;
}

function rememberMessage(
    messageID
) {
    if (
        !messageID
    ) {
        return true;
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
        MAX_SEEN
    ) {
        const first =
            SEEN_MESSAGES
                .values()
                .next()
                .value;

        if (first) {
            SEEN_MESSAGES.delete(
                first
            );
        }
    }

    return true;
}

async function handleAutoReply(
    api,
    data,
    event
) {
    if (
        !data.active ||
        !data.autoReply
    ) {
        return;
    }

    if (
        !event ||
        !event.body
    ) {
        return;
    }

    const threadID =
        String(
            event.threadID || ""
        );

    if (
        !threadID
    ) {
        return;
    }

    const messageID =
        event.messageID ||
        event.messageID;

    if (
        !rememberMessage(
            messageID
        )
    ) {
        return;
    }

    const senderID =
        String(
            event.senderID ||
            ""
        );

    const botID =
        typeof api.getCurrentUserID ===
            "function"
            ? String(
                api.getCurrentUserID()
            )
            : "";

    if (
        botID &&
        senderID === botID
    ) {
        return;
    }

    if (
        data.targetMode &&
        String(
            data.targetUserID
        ) !== senderID
    ) {
        return;
    }

    if (
        !canReply(
            threadID,
            data
        )
    ) {
        return;
    }

    const reply =
        getReply(data);

    const sent =
        await safeSend(
            api,
            reply,
            threadID
        );

    if (
        sent
    ) {
        data.totalReplies++;
        saveData(data);
    } else {
        data.totalErrors++;
        saveData(data);
    }
      }const REACTIONS = [
    "🔥",
    "💀",
    "🤣",
    "😆",
    "🤡"
];

const REACT_COOLDOWN =
    new Map();

function canReact(
    threadID,
    data
) {
    const now =
        Date.now();

    const old =
        REACT_COOLDOWN.get(
            threadID
        );

    const cooldown =
        Number(
            data.reactionCooldown
        ) || 1500;

    if (
        old &&
        now - old < cooldown
    ) {
        return false;
    }

    REACT_COOLDOWN.set(
        threadID,
        now
    );

    return true;
}

async function handleAutoReact(
    api,
    data,
    event
) {
    if (
        !data.active ||
        !data.autoReact
    ) {
        return;
    }

    if (
        !event ||
        !event.messageID
    ) {
        return;
    }

    const threadID =
        String(
            event.threadID || ""
        );

    if (
        !threadID
    ) {
        return;
    }

    const senderID =
        String(
            event.senderID || ""
        );

    const botID =
        typeof api.getCurrentUserID ===
            "function"
            ? String(
                api.getCurrentUserID()
            )
            : "";

    if (
        botID &&
        senderID === botID
    ) {
        return;
    }

    if (
        data.targetMode &&
        String(
            data.targetUserID
        ) !== senderID
    ) {
        return;
    }

    if (
        !canReact(
            threadID,
            data
        )
    ) {
        return;
    }

    if (
        typeof api.setMessageReaction !==
        "function"
    ) {
        return;
    }

    const index =
        Number(
            data.reactionIndex
        ) || 0;

    const reaction =
        REACTIONS[
            index %
            REACTIONS.length
        ];

    data.reactionIndex =
        (
            index + 1
        ) %
        REACTIONS.length;

    try {
        api.setMessageReaction(
            reaction,
            event.messageID,
            () => {},
            true
        );

        data.totalReactions++;

        saveData(data);
    } catch {
        data.totalErrors++;

        saveData(data);
    }
}function parseCommand(body) {
    if (!body) {
        return null;
    }

    const text =
        String(body).trim();

    if (!text) {
        return null;
    }

    if (
        !text.toLowerCase()
            .startsWith("/ryuk")
    ) {
        return null;
    }

    const parts =
        text.split(/\s+/);

    const command =
        String(
            parts[1] || ""
        ).toLowerCase();

    const args =
        parts.slice(2);

    return {
        command,
        args
    };
}

function getArgsText(parsed) {
    if (
        !parsed ||
        !Array.isArray(
            parsed.args
        )
    ) {
        return "";
    }

    return parsed.args
        .join(" ")
        .trim();
}

function formatStatus(data) {
    return [
        "RYUK STATUS",
        "",
        `Active: ${data.active}`,
        `Auto Reply: ${data.autoReply}`,
        `Auto React: ${data.autoReact}`,
        `Nick Lock: ${data.nicknameLock}`,
        `GC Lock: ${data.gcNameLock}`,
        `Target Mode: ${data.targetMode}`,
        `Target: ${data.targetUserID || "None"}`,
        `Nickname: ${data.nickname}`,
        `GC Name: ${data.gcName}`,
        `Reply Cooldown: ${data.autoReplyCooldown}ms`,
        `Replies: ${data.totalReplies}`,
        `Reactions: ${data.totalReactions}`,
        `Commands: ${data.totalCommands}`,
        `Errors: ${data.totalErrors}`
    ].join("\n");
}

function getHelpText() {
    return [
        "RYUK COMMANDS",
        "",
        "/ryuk on",
        "/ryuk off",
        "/ryuk status",
        "/ryuk help",
        "",
        "/ryuk replyon",
        "/ryuk replyoff",
        "/ryuk reacton",
        "/ryuk reactoff",
        "",
        "/ryuk setreply <text>",
        "/ryuk delay <ms>",
        "",
        "/ryuk locknick",
        "/ryuk unlocknick",
        "/ryuk setnick <name>",
        "",
        "/ryuk lockgc",
        "/ryuk unlockgc",
        "/ryuk setgname <name>",
        "",
        "/ryuk target <uid>",
        "/ryuk untarget",
        "/ryuk reset"
    ].join("\n");
          }async function adminOnly(
    api,
    userID,
    threadID
) {
    if (
        isAdmin(userID)
    ) {
        return true;
    }

    await safeSend(
        api,
        "Admin only.",
        threadID
    );

    return false;
}

async function commandOn(
    api,
    data,
    threadID,
    userID
) {
    if (
        !await adminOnly(
            api,
            userID,
            threadID
        )
    ) {
        return;
    }

    data.active = true;

    data.activatedBy =
        String(userID);

    data.activatedAt =
        Date.now();

    saveData(data);

    await safeSend(
        api,
        "RYUK is now ON.",
        threadID
    );
}

async function commandOff(
    api,
    data,
    threadID,
    userID
) {
    if (
        !await adminOnly(
            api,
            userID,
            threadID
        )
    ) {
        return;
    }

    data.active = false;

    saveData(data);

    await safeSend(
        api,
        "RYUK is now OFF.",
        threadID
    );
}

async function commandReply(
    api,
    data,
    threadID,
    userID,
    enabled
) {
    if (
        !await adminOnly(
            api,
            userID,
            threadID
        )
    ) {
        return;
    }

    data.autoReply =
        Boolean(enabled);

    saveData(data);

    await safeSend(
        api,
        enabled
            ? "Auto reply ON."
            : "Auto reply OFF.",
        threadID
    );
}

async function commandReact(
    api,
    data,
    threadID,
    userID,
    enabled
) {
    if (
        !await adminOnly(
            api,
            userID,
            threadID
        )
    ) {
        return;
    }

    data.autoReact =
        Boolean(enabled);

    saveData(data);

    await safeSend(
        api,
        enabled
            ? "Auto react ON."
            : "Auto react OFF.",
        threadID
    );
                        }async function commandSetReply(
    api,
    data,
    threadID,
    userID,
    text
) {
    if (
        !await adminOnly(
            api,
            userID,
            threadID
        )
    ) {
        return;
    }

    const value =
        String(text || "")
            .trim();

    if (!value) {
        await safeSend(
            api,
            "Usage: /ryuk setreply <text>",
            threadID
        );

        return;
    }

    if (
        value.length > 1000
    ) {
        await safeSend(
            api,
            "Reply is too long.",
            threadID
        );

        return;
    }

    data.autoReplyText =
        value;

    data.replyIndex = 0;

    saveData(data);

    await safeSend(
        api,
        "Auto reply updated.",
        threadID
    );
}

async function commandDelay(
    api,
    data,
    threadID,
    userID,
    value
) {
    if (
        !await adminOnly(
            api,
            userID,
            threadID
        )
    ) {
        return;
    }

    const number =
        Number(value);

    if (
        !Number.isFinite(
            number
        )
    ) {
        await safeSend(
            api,
            "Usage: /ryuk delay 8000",
            threadID
        );

        return;
    }

    data.autoReplyCooldown =
        Math.max(
            3000,
            Math.min(
                60000,
                number
            )
        );

    saveData(data);

    await safeSend(
        api,
        `Reply delay: ${data.autoReplyCooldown}ms`,
        threadID
    );
}

async function commandTarget(
    api,
    data,
    threadID,
    userID,
    targetID
) {
    if (
        !await adminOnly(
            api,
            userID,
            threadID
        )
    ) {
        return;
    }

    const id =
        String(
            targetID || ""
        ).trim();

    if (!id) {
        await safeSend(
            api,
            "Usage: /ryuk target <uid>",
            threadID
        );

        return;
    }

    data.targetMode = true;
    data.targetUserID = id;

    saveData(data);

    await safeSend(
        api,
        `Target set: ${id}`,
        threadID
    );
}

async function commandUntarget(
    api,
    data,
    threadID,
    userID
) {
    if (
        !await adminOnly(
            api,
            userID,
            threadID
        )
    ) {
        return;
    }

    data.targetMode = false;
    data.targetUserID = null;

    saveData(data);

    await safeSend(
        api,
        "Target mode OFF.",
        threadID
    );
}async function commandLockNick(
    api,
    data,
    threadID,
    userID,
    enabled
) {
    if (
        !await adminOnly(
            api,
            userID,
            threadID
        )
    ) {
        return;
    }

    data.nicknameLock =
        Boolean(enabled);

    saveData(data);

    await safeSend(
        api,
        enabled
            ? "Nickname lock ON."
            : "Nickname lock OFF.",
        threadID
    );
}

async function commandSetNick(
    api,
    data,
    threadID,
    userID,
    name
) {
    if (
        !await adminOnly(
            api,
            userID,
            threadID
        )
    ) {
        return;
    }

    const value =
        String(name || "")
            .trim();

    if (!value) {
        await safeSend(
            api,
            "Usage: /ryuk setnick <name>",
            threadID
        );

        return;
    }

    if (
        value.length > 100
    ) {
        await safeSend(
            api,
            "Nickname is too long.",
            threadID
        );

        return;
    }

    data.nickname = value;
    data.nicknameLock = true;

    saveData(data);

    await safeSend(
        api,
        `Nickname saved: ${value}`,
        threadID
    );
}

async function commandLockGC(
    api,
    data,
    threadID,
    userID,
    enabled
) {
    if (
        !await adminOnly(
            api,
            userID,
            threadID
        )
    ) {
        return;
    }

    data.gcNameLock =
        Boolean(enabled);

    saveData(data);

    await safeSend(
        api,
        enabled
            ? "GC name lock ON."
            : "GC name lock OFF.",
        threadID
    );
}

async function commandSetGCName(
    api,
    data,
    threadID,
    userID,
    name
) {
    if (
        !await adminOnly(
            api,
            userID,
            threadID
        )
    ) {
        return;
    }

    const value =
        String(name || "")
            .trim();

    if (!value) {
        await safeSend(
            api,
            "Usage: /ryuk setgname <name>",
            threadID
        );

        return;
    }

    if (
        value.length > 100
    ) {
        await safeSend(
            api,
            "GC name is too long.",
            threadID
        );

        return;
    }

    data.gcName = value;
    data.gcNameLock = true;

    saveData(data);

    await safeSend(
        api,
        `GC name saved: ${value}`,
        threadID
    );
}async function commandReset(
    api,
    data,
    threadID,
    userID
) {
    if (
        !await adminOnly(
            api,
            userID,
            threadID
        )
    ) {
        return;
    }

    const fresh = {
        ...DEFAULT_DATA
    };

    for (
        const key of Object.keys(
            fresh
        )
    ) {
        data[key] =
            fresh[key];
    }

    saveData(data);

    await safeSend(
        api,
        "RYUK settings reset.",
        threadID
    );
}

async function commandStatus(
    api,
    data,
    threadID,
    userID
) {
    if (
        !await adminOnly(
            api,
            userID,
            threadID
        )
    ) {
        return;
    }

    await safeSend(
        api,
        formatStatus(data),
        threadID
    );
}

async function runCommand(
    api,
    data,
    event
) {
    const parsed =
        parseCommand(
            event.body
        );

    if (!parsed) {
        return false;
    }

    const threadID =
        String(
            event.threadID || ""
        );

    const userID =
        String(
            event.senderID || ""
        );

    data.totalCommands++;

    saveData(data);

    const cmd =
        parsed.command;

    const args =
        parsed.args;

    if (
        cmd === "help"
    ) {
        await safeSend(
            api,
            getHelpText(),
            threadID
        );

        return true;
    }

    if (
        cmd === "on"
    ) {
        await commandOn(
            api,
            data,
            threadID,
            userID
        );

        return true;
    }

    if (
        cmd === "off"
    ) {
        await commandOff(
            api,
            data,
            threadID,
            userID
        );

        return true;
    }

    if (
        cmd === "status"
    ) {
        await commandStatus(
            api,
            data,
            threadID,
            userID
        );

        return true;
    }

    if (
        cmd === "replyon"
    ) {
        await commandReply(
            api,
            data,
            threadID,
            userID,
            true
        );

        return true;
    }

    if (
        cmd === "replyoff"
    ) {
        await commandReply(
            api,
            data,
            threadID,
            userID,
            false
        );

        return true;
    }

    if (
        cmd === "reacton"
    ) {
        await commandReact(
            api,
            data,
            threadID,
            userID,
            true
        );

        return true;
    }

    if (
        cmd === "reactoff"
    ) {
        await commandReact(
            api,
            data,
            threadID,
            userID,
            false
        );

        return true;
    }

    return false;
      }async function runCommand2(
    api,
    data,
    event
) {
    const parsed =
        parseCommand(
            event.body
        );

    if (!parsed) {
        return false;
    }

    const threadID =
        String(
            event.threadID || ""
        );

    const userID =
        String(
            event.senderID || ""
        );

    const cmd =
        parsed.command;

    const args =
        parsed.args;

    if (
        cmd === "setreply"
    ) {
        await commandSetReply(
            api,
            data,
            threadID,
            userID,
            args.join(" ")
        );

        return true;
    }

    if (
        cmd === "delay"
    ) {
        await commandDelay(
            api,
            data,
            threadID,
            userID,
            args[0]
        );

        return true;
    }

    if (
        cmd === "target"
    ) {
        await commandTarget(
            api,
            data,
            threadID,
            userID,
            args[0]
        );

        return true;
    }

    if (
        cmd === "untarget"
    ) {
        await commandUntarget(
            api,
            data,
            threadID,
            userID
        );

        return true;
    }

    if (
        cmd === "locknick"
    ) {
        await commandLockNick(
            api,
            data,
            threadID,
            userID,
            true
        );

        return true;
    }

    if (
        cmd === "unlocknick"
    ) {
        await commandLockNick(
            api,
            data,
            threadID,
            userID,
            false
        );

        return true;
    }

    if (
        cmd === "setnick"
    ) {
        await commandSetNick(
            api,
            data,
            threadID,
            userID,
            args.join(" ")
        );

        return true;
    }
          }async function runCommand3(
    api,
    data,
    event
) {
    const parsed =
        parseCommand(
            event.body
        );

    if (!parsed) {
        return false;
    }

    const threadID =
        String(
            event.threadID || ""
        );

    const userID =
        String(
            event.senderID || ""
        );

    const cmd =
        parsed.command;

    const args =
        parsed.args;

    if (
        cmd === "lockgc"
    ) {
        await commandLockGC(
            api,
            data,
            threadID,
            userID,
            true
        );

        return true;
    }

    if (
        cmd === "unlockgc"
    ) {
        await commandLockGC(
            api,
            data,
            threadID,
            userID,
            false
        );

        return true;
    }

    if (
        cmd === "setgname"
    ) {
        await commandSetGCName(
            api,
            data,
            threadID,
            userID,
            args.join(" ")
        );

        return true;
    }

    if (
        cmd === "reset"
    ) {
        await commandReset(
            api,
            data,
            threadID,
            userID
        );

        return true;
    }

    return false;
          }function parseEvent(
    event
) {
    if (
        !event ||
        typeof event !== "object"
    ) {
        return null;
    }

    const body =
        String(
            event.body || ""
        ).trim();

    const threadID =
        String(
            event.threadID || ""
        );

    const senderID =
        String(
            event.senderID ||
            event.userID ||
            ""
        );

    if (
        !threadID ||
        !senderID
    ) {
        return null;
    }

    return {
        body,
        threadID,
        senderID,
        messageID:
            event.messageID || null
    };
}

async function handleMessage(
    api,
    data,
    event
) {
    const parsed =
        parseEvent(event);

    if (!parsed) {
        return;
    }

    const command =
        parseCommand(
            parsed.body
        );

    if (command) {
        await runCommand(
            api,
            data,
            event
        );

        await runCommand2(
            api,
            data,
            event
        );

        await runCommand3(
            api,
            data,
            event
        );

        return;
    }

    await handleAutoReply(
        api,
        data,
        event
    );

    await handleAutoReact(
        api,
        data,
        event
    );
}async function handleEventData(
    api,
    data,
    event
) {
    if (
        !event ||
        !event.threadID
    ) {
        return;
    }

    if (
        event.type ===
        "message"
    ) {
        await handleMessage(
            api,
            data,
            event
        );

        return;
    }

    if (
        event.type ===
        "message_reply"
    ) {
        await handleMessage(
            api,
            data,
            event
        );

        return;
    }

    if (
        event.logMessageType ===
        "log:subscribe"
    ) {
        return;
    }

    if (
        event.logMessageType ===
        "log:unsubscribe"
    ) {
        return;
    }
}

module.exports.handleEvent =
    async function({
        api,
        event
    }) {
        const data =
            loadData();

        try {
            await handleEventData(
                api,
                data,
                event
            );
        } catch {
            data.totalErrors++;
            saveData(data);
        }
    };module.exports.run =
    async function({
        api,
        event
    }) {
        const data =
            loadData();

        try {
            if (
                !event ||
                !event.threadID
            ) {
                return;
            }

            const command =
                parseCommand(
                    event.body
                );

            if (command) {
                await runCommand(
                    api,
                    data,
                    event
                );

                await runCommand2(
                    api,
                    data,
                    event
                );

                await runCommand3(
                    api,
                    data,
                    event
                );

                return;
            }

            await handleAutoReply(
                api,
                data,
                event
            );

            await handleAutoReact(
                api,
                data,
                event
            );
        } catch {
            data.totalErrors++;

            saveData(data);
        }
    };

module.exports.onLoad =
    async function() {
        loadData();
    };

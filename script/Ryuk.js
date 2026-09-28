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
    path.join(
        __dirname,
        "ryuk_data.json"
    );

const BACKUP_FILE =
    path.join(
        __dirname,
        "ryuk_data.backup.json"
    );

const TARGET_NICKNAME =
    "RYUK POGI ON TOP";

const TARGET_GC_NAME =
    "RYUK POGI ON TOP";

const DEFAULT_DATA = {
    active: true,
    autoReply: true,
    autoReact: true,

    nicknameLock: false,
    gcNameLock: false,

    nickname:
        TARGET_NICKNAME,

    gcName:
        TARGET_GC_NAME,

    replyDelay: 2000,
    reactionDelay: 1500,

    totalReplies: 0,
    totalReactions: 0,
    totalNicknames: 0,
    totalGCNames: 0,
    totalCommands: 0,
    totalErrors: 0,

    updatedAt: Date.now()
};

const MAX_SEEN =
    5000;

const MAX_QUEUE =
    100;

const SEEN_MESSAGES =
    new Set();

const REPLY_COOLDOWNS =
    new Map();

const REACTION_COOLDOWNS =
    new Map();

const NICKNAME_COOLDOWNS =
    new Map();

const GCNAME_COOLDOWNS =
    new Map();

const NICKNAME_QUEUE =
    new Map();

const ACTIVE_WORKERS =
    new Set();

const REPLY_LINES = [
    "👑 RYUK POGI ON TOP.",
    "🔥 RYUK is here.",
    "😈 Ano meron?",
    "💀 Nakita ko.",
    "🤣 Grabe naman.",
    "⚡ Present ako.",
    "🛡️ Nandito lang ako.",
    "👑 RYUK online.",
    "🔥 Sige lang.",
    "😎 Gets ko.",
    "💀 Okay.",
    "🤣 Haha.",
    "⚡ Copy.",
    "🥷 Nandito ako.",
    "👑 Ano usapan?",
    "🔥 Sabihin mo lang.",
    "😈 Ayos yan.",
    "💀 Talaga?",
    "🤣 Seryoso?",
    "⚡ Wait lang.",
    "🛡️ Nakikinig ako.",
    "👑 RYUK POGI.",
    "🔥 Walang problema.",
    "😎 Okay lang.",
    "💀 Grabe.",
    "🤣 Haha tama.",
    "⚡ Legit.",
    "🥷 Copy that.",
    "👑 Present.",
    "🔥 Noted.",
    "😈 Ano yan?",
    "💀 Nandito pa.",
    "🤣 Nice.",
    "⚡ Good.",
    "🛡️ Sige.",
    "👑 RYUK MODE.",
    "🔥 Active.",
    "😎 Relax lang.",
    "💀 Nakita ko yan.",
    "🤣 Hahaha.",
    "⚡ Ayos.",
    "🥷 Okay yan.",
    "👑 RYUK ON TOP.",
    "🔥 Tuloy lang.",
    "😈 Gets.",
    "💀 Oo.",
    "🤣 Hindi ah.",
    "⚡ Sandali.",
    "🛡️ Ready.",
    "👑 RYUK nandito."
];

let replyIndex = 0;

let reactionIndex = 0;

const REACTIONS = [
    "🔥",
    "💀",
    "🤣",
    "😆",
    "🤡"
];

function isAdmin(
    userID
) {
    return ADMIN_IDS.includes(
        String(userID)
    );
}

function cloneDefault() {
    return JSON.parse(
        JSON.stringify(
            DEFAULT_DATA
        )
    );
}

function loadData() {
    try {
        if (
            fs.existsSync(
                DATA_FILE
            )
        ) {
            const raw =
                fs.readFileSync(
                    DATA_FILE,
                    "utf8"
                );

            const saved =
                JSON.parse(raw);

            return {
                ...cloneDefault(),
                ...saved
            };
        }
    } catch (
        error
    ) {
        console.error(
            "[ryuk] load error:",
            error.message
        );
    }

    return cloneDefault();
}

function saveData(
    data
) {
    try {
        data.updatedAt =
            Date.now();

        if (
            fs.existsSync(
                DATA_FILE
            )
        ) {
            try {
                fs.copyFileSync(
                    DATA_FILE,
                    BACKUP_FILE
                );
            } catch {}
        }

        const temp =
            `${DATA_FILE}.tmp`;

        fs.writeFileSync(
            temp,
            JSON.stringify(
                data,
                null,
                2
            ),
            "utf8"
        );

        fs.renameSync(
            temp,
            DATA_FILE
        );

        return true;
    } catch (
        error
    ) {
        console.error(
            "[ryuk] save error:",
            error.message
        );

        return false;
    }
}function safeSend(
    api,
    message,
    threadID,
    messageID
) {
    return new Promise(
        (resolve) => {
            try {
                if (
                    !api ||
                    typeof api.sendMessage !==
                    "function"
                ) {
                    return resolve(
                        false
                    );
                }

                const text =
                    String(
                        message || ""
                    ).trim();

                if (!text) {
                    return resolve(
                        false
                    );
                }

                api.sendMessage(
                    text,
                    threadID,
                    (error) => {
                        if (error) {
                            console.error(
                                "[ryuk] send error:",
                                error.message ||
                                error
                            );

                            return resolve(
                                false
                            );
                        }

                        resolve(
                            true
                        );
                    },
                    messageID
                );
            } catch (
                error
            ) {
                console.error(
                    "[ryuk] send exception:",
                    error.message
                );

                resolve(
                    false
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
        (resolve) => {
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

                if (!messageID) {
                    return resolve(
                        false
                    );
                }

                api.setMessageReaction(
                    String(
                        reaction || "👍"
                    ),
                    messageID,
                    (error) => {
                        if (error) {
                            console.error(
                                "[ryuk] reaction error:",
                                error.message ||
                                error
                            );

                            return resolve(
                                false
                            );
                        }

                        resolve(
                            true
                        );
                    },
                    true
                );
            } catch (
                error
            ) {
                console.error(
                    "[ryuk] reaction exception:",
                    error.message
                );

                resolve(
                    false
                );
            }
        }
    );
}

function safeSetTitle(
    api,
    threadID,
    title
) {
    return new Promise(
        (resolve) => {
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

                const cleanTitle =
                    String(
                        title || ""
                    ).trim();

                if (
                    !cleanTitle
                ) {
                    return resolve(
                        false
                    );
                }

                api.setTitle(
                    cleanTitle,
                    threadID,
                    (error) => {
                        if (error) {
                            console.error(
                                "[ryuk] title error:",
                                error.message ||
                                error
                            );

                            return resolve(
                                false
                            );
                        }

                        resolve(
                            true
                        );
                    }
                );
            } catch (
                error
            ) {
                console.error(
                    "[ryuk] title exception:",
                    error.message
                );

                resolve(
                    false
                );
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
        (resolve) => {
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

                const cleanName =
                    String(
                        nickname || ""
                    ).trim();

                const cleanUserID =
                    String(
                        userID || ""
                    ).trim();

                if (
                    !cleanName ||
                    !cleanUserID ||
                    !threadID
                ) {
                    return resolve(
                        false
                    );
                }

                api.changeNickname(
                    cleanName,
                    threadID,
                    cleanUserID,
                    (error) => {
                        if (error) {
                            console.error(
                                "[ryuk] nickname error:",
                                error.message ||
                                error
                            );

                            return resolve(
                                false
                            );
                        }

                        resolve(
                            true
                        );
                    }
                );
            } catch (
                error
            ) {
                console.error(
                    "[ryuk] nickname exception:",
                    error.message
                );

                resolve(
                    false
                );
            }
        }
    );
}

function safeGetThreadInfo(
    api,
    threadID
) {
    return new Promise(
        (resolve) => {
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
                    (error, info) => {
                        if (
                            error ||
                            !info
                        ) {
                            console.error(
                                "[ryuk] thread info error:",
                                error
                                    ? error.message ||
                                      error
                                    : "unknown"
                            );

                            return resolve(
                                null
                            );
                        }

                        resolve(
                            info
                        );
                    }
                );
            } catch (
                error
            ) {
                console.error(
                    "[ryuk] thread info exception:",
                    error.message
                );

                resolve(
                    null
                );
            }
        }
    );
}

function safeTyping(
    api,
    threadID,
    enabled
) {
    try {
        if (
            api &&
            typeof api.sendTypingIndicator ===
            "function"
        ) {
            api.sendTypingIndicator(
                threadID,
                Boolean(enabled)
            );
        }
    } catch (
        error
    ) {
        console.error(
            "[ryuk] typing error:",
            error.message
        );
    }
}

function getNextReply() {
    if (
        !REPLY_LINES.length
    ) {
        return "👑 RYUK POGI ON TOP.";
    }

    const reply =
        REPLY_LINES[
            replyIndex
        ];

    replyIndex =
        (
            replyIndex + 1
        ) %
        REPLY_LINES.length;

    return reply;
}

function getNextReaction() {
    if (
        !REACTIONS.length
    ) {
        return "🔥";
    }

    const reaction =
        REACTIONS[
            reactionIndex
        ];

    reactionIndex =
        (
            reactionIndex + 1
        ) %
        REACTIONS.length;

    return reaction;
}

function rememberMessage(
    messageID
) {
    if (!messageID) {
        return false;
    }

    const id =
        String(
            messageID
        );

    if (
        SEEN_MESSAGES.has(id)
    ) {
        return false;
    }

    SEEN_MESSAGES.add(
        id
    );

    while (
        SEEN_MESSAGES.size >
        MAX_SEEN
    ) {
        const first =
            SEEN_MESSAGES.values()
                .next()
                .value;

        if (
            first === undefined
        ) {
            break;
        }

        SEEN_MESSAGES.delete(
            first
        );
    }

    return true;
}

function canUseCooldown(
    map,
    key,
    cooldown
) {
    const now =
        Date.now();

    const last =
        map.get(key) || 0;

    if (
        now - last <
        cooldown
    ) {
        return false;
    }

    map.set(
        key,
        now
    );

    return true;
}function cleanupMap(
    map,
    maxAge
) {
    if (
        !map ||
        typeof map.entries !==
        "function"
    ) {
        return;
    }

    const now =
        Date.now();

    for (
        const [
            key,
            value
        ] of map.entries()
    ) {
        if (
            now - Number(value || 0) >
            maxAge
        ) {
            map.delete(
                key
            );
        }
    }
}

function cleanupCaches() {
    cleanupMap(
        REPLY_COOLDOWNS,
        300000
    );

    cleanupMap(
        REACTION_COOLDOWNS,
        300000
    );

    cleanupMap(
        NICKNAME_COOLDOWNS,
        600000
    );

    cleanupMap(
        GCNAME_COOLDOWNS,
        600000
    );
}

function normalizeName(
    value,
    fallback
) {
    const name =
        String(
            value === undefined ||
            value === null
                ? ""
                : value
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    if (!name) {
        return fallback;
    }

    return name.slice(
        0,
        100
    );
}

function normalizeDelay(
    value,
    fallback,
    minimum,
    maximum
) {
    const number =
        Number(
            value
        );

    if (
        !Number.isFinite(
            number
        )
    ) {
        return fallback;
    }

    return Math.max(
        minimum,
        Math.min(
            maximum,
            Math.floor(
                number
            )
        )
    );
}

function normalizeData(
    data
) {
    const source =
        data &&
        typeof data ===
            "object"
            ? data
            : {};

    const result = {
        ...cloneDefault(),
        ...source
    };

    result.active =
        Boolean(
            result.active
        );

    result.autoReply =
        Boolean(
            result.autoReply
        );

    result.autoReact =
        Boolean(
            result.autoReact
        );

    result.nicknameLock =
        Boolean(
            result.nicknameLock
        );

    result.gcNameLock =
        Boolean(
            result.gcNameLock
        );

    result.nickname =
        normalizeName(
            result.nickname,
            TARGET_NICKNAME
        );

    result.gcName =
        normalizeName(
            result.gcName,
            TARGET_GC_NAME
        );

    result.replyDelay =
        normalizeDelay(
            result.replyDelay,
            2000,
            500,
            10000
        );

    result.reactionDelay =
        normalizeDelay(
            result.reactionDelay,
            1500,
            500,
            10000
        );

    result.totalReplies =
        Math.max(
            0,
            Number(
                result.totalReplies
            ) || 0
        );

    result.totalReactions =
        Math.max(
            0,
            Number(
                result.totalReactions
            ) || 0
        );

    result.totalNicknames =
        Math.max(
            0,
            Number(
                result.totalNicknames
            ) || 0
        );

    result.totalGCNames =
        Math.max(
            0,
            Number(
                result.totalGCNames
            ) || 0
        );

    result.totalCommands =
        Math.max(
            0,
            Number(
                result.totalCommands
            ) || 0
        );

    result.totalErrors =
        Math.max(
            0,
            Number(
                result.totalErrors
            ) || 0
        );

    result.updatedAt =
        Number(
            result.updatedAt
        ) ||
        Date.now();

    return result;
}

function getThreadState(
    threadID
) {
    const id =
        String(
            threadID || ""
        );

    if (
        !id
    ) {
        return null;
    }

    if (
        !NICKNAME_QUEUE.has(
            id
        )
    ) {
        NICKNAME_QUEUE.set(
            id,
            {
                items: [],
                running: false
            }
        );
    }

    return NICKNAME_QUEUE.get(
        id
    );
}

function queueNickname(
    api,
    threadID,
    userID,
    nickname
) {
    const state =
        getThreadState(
            threadID
        );

    if (!state) {
        return false;
    }

    if (
        state.items.length >=
        MAX_QUEUE
    ) {
        return false;
    }

    state.items.push({
        userID:
            String(
                userID
            ),
        nickname:
            String(
                nickname
            )
    });

    processNicknameQueue(
        api,
        threadID
    );

    return true;
}

async function processNicknameQueue(
    api,
    threadID
) {
    const state =
        getThreadState(
            threadID
        );

    if (
        !state ||
        state.running
    ) {
        return;
    }

    state.running =
        true;

    try {
        while (
            state.items.length
        ) {
            const item =
                state.items.shift();

            if (
                !item ||
                !item.userID ||
                !item.nickname
            ) {
                continue;
            }

            const key =
                `${threadID}:${item.userID}`;

            if (
                !canUseCooldown(
                    NICKNAME_COOLDOWNS,
                    key,
                    5000
                )
            ) {
                continue;
            }

            const success =
                await safeChangeNickname(
                    api,
                    item.nickname,
                    threadID,
                    item.userID
                );

            if (
                success
            ) {
                const data =
                    normalizeData(
                        loadData()
                    );

                data.totalNicknames +=
                    1;

                saveData(
                    data
                );
            }

            await new Promise(
                (
                    resolve
                ) => {
                    setTimeout(
                        resolve,
                        800
                    );
                }
            );
        }
    } catch (
        error
    ) {
        console.error(
            "[ryuk] nickname queue error:",
            error.message
        );
    } finally {
        state.running =
            false;

        if (
            state.items.length
        ) {
            setTimeout(
                () => {
                    processNicknameQueue(
                        api,
                        threadID
                    );
                },
                500
            );
        }
    }
}

setInterval(
    () => {
        cleanupCaches();
    },
    60000
);const RESTORE_GUARD =
    new Map();

const TARGET_USERS =
    new Map();

const COMMAND_COOLDOWNS =
    new Map();

function setRestoreGuard(
    threadID,
    type,
    userID
) {
    const key =
        `${threadID}:${type}:${userID || "all"}`;

    RESTORE_GUARD.set(
        key,
        Date.now()
    );

    setTimeout(
        () => {
            RESTORE_GUARD.delete(
                key
            );
        },
        6000
    );
}

function hasRestoreGuard(
    threadID,
    type,
    userID
) {
    const key =
        `${threadID}:${type}:${userID || "all"}`;

    const time =
        RESTORE_GUARD.get(
            key
        );

    if (!time) {
        return false;
    }

    if (
        Date.now() - time >
        6000
    ) {
        RESTORE_GUARD.delete(
            key
        );

        return false;
    }

    return true;
}

function setTarget(
    threadID,
    userID
) {
    if (
        !threadID ||
        !userID
    ) {
        return false;
    }

    TARGET_USERS.set(
        String(threadID),
        String(userID)
    );

    return true;
}

function getTarget(
    threadID
) {
    if (!threadID) {
        return null;
    }

    return (
        TARGET_USERS.get(
            String(threadID)
        ) || null
    );
}

function removeTarget(
    threadID
) {
    if (!threadID) {
        return false;
    }

    return TARGET_USERS.delete(
        String(threadID)
    );
}

function commandAllowed(
    threadID,
    senderID
) {
    const key =
        `${threadID}:${senderID}`;

    return canUseCooldown(
        COMMAND_COOLDOWNS,
        key,
        1500
    );
}

function getParticipantIDs(
    info
) {
    if (
        !info ||
        !Array.isArray(
            info.participantIDs
        )
    ) {
        return [];
    }

    return [
        ...new Set(
            info.participantIDs
                .map(
                    (id) =>
                        String(id)
                )
                .filter(
                    Boolean
                )
        )
    ];
}

function shouldTargetUser(
    threadID,
    userID
) {
    const target =
        getTarget(
            threadID
        );

    if (!target) {
        return true;
    }

    return (
        String(target) ===
        String(userID)
    );
}

function getSafeBotID(
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
    } catch (
        error
    ) {
        console.error(
            "[ryuk] bot id error:",
            error.message
        );
    }

    return null;
}

async function applyNicknameLock(
    api,
    threadID,
    userIDs,
    nickname
) {
    const uniqueUsers = [
        ...new Set(
            (
                Array.isArray(
                    userIDs
                )
                    ? userIDs
                    : []
            )
                .map(
                    (id) =>
                        String(id)
                )
                .filter(
                    Boolean
                )
        )
    ];

    if (
        !uniqueUsers.length
    ) {
        return 0;
    }

    let queued = 0;

    for (
        const userID of uniqueUsers
    ) {
        if (
            !shouldTargetUser(
                threadID,
                userID
            )
        ) {
            continue;
        }

        if (
            queueNickname(
                api,
                threadID,
                userID,
                nickname
            )
        ) {
            setRestoreGuard(
                threadID,
                "nickname",
                userID
            );

            queued += 1;
        }
    }

    return queued;
}

async function applyGCNameLock(
    api,
    threadID,
    gcName
) {
    if (
        hasRestoreGuard(
            threadID,
            "gcname"
        )
    ) {
        return false;
    }

    setRestoreGuard(
        threadID,
        "gcname"
    );

    const success =
        await safeSetTitle(
            api,
            threadID,
            gcName
        );

    if (success) {
        const data =
            normalizeData(
                loadData()
            );

        data.totalGCNames +=
            1;

        saveData(
            data
        );
    }

    return success;
}

async function applyFullLock(
    api,
    threadID,
    data
) {
    const info =
        await safeGetThreadInfo(
            api,
            threadID
        );

    if (!info) {
        return {
            nicknameCount: 0,
            gcNameChanged: false
        };
    }

    const participants =
        getParticipantIDs(
            info
        );

    data.nicknameLock =
        true;

    data.gcNameLock =
        true;

    saveData(
        data
    );

    const nicknameCount =
        await applyNicknameLock(
            api,
            threadID,
            participants,
            data.nickname
        );

    const gcNameChanged =
        await applyGCNameLock(
            api,
            threadID,
            data.gcName
        );

    return {
        nicknameCount,
        gcNameChanged
    };
}async function restoreNickname(
    api,
    threadID,
    userID
) {
    try {
        const data =
            normalizeData(
                loadData()
            );

        if (
            !data.nicknameLock
        ) {
            return false;
        }

        if (
            !shouldTargetUser(
                threadID,
                userID
            )
        ) {
            return false;
        }

        if (
            hasRestoreGuard(
                threadID,
                "nickname",
                userID
            )
        ) {
            return false;
        }

        setRestoreGuard(
            threadID,
            "nickname",
            userID
        );

        return queueNickname(
            api,
            threadID,
            userID,
            data.nickname
        );
    } catch (
        error
    ) {
        console.error(
            "[ryuk] restore nickname error:",
            error.message
        );

        return false;
    }
}

async function restoreGCName(
    api,
    threadID
) {
    try {
        const data =
            normalizeData(
                loadData()
            );

        if (
            !data.gcNameLock
        ) {
            return false;
        }

        if (
            hasRestoreGuard(
                threadID,
                "gcname"
            )
        ) {
            return false;
        }

        return applyGCNameLock(
            api,
            threadID,
            data.gcName
        );
    } catch (
        error
    ) {
        console.error(
            "[ryuk] restore gc error:",
            error.message
        );

        return false;
    }
}

function formatStatus(
    data,
    threadID
) {
    const target =
        getTarget(
            threadID
        );

    return [
        "👑 RYUK STATUS",
        "",
        `⚡ Auto Reply: ${
            data.active &&
            data.autoReply
                ? "ON"
                : "OFF"
        }`,
        `🔥 Auto React: ${
            data.active &&
            data.autoReact
                ? "ON"
                : "OFF"
        }`,
        `🛡️ Nick Lock: ${
            data.nicknameLock
                ? "ON"
                : "OFF"
        }`,
        `🏷️ GC Lock: ${
            data.gcNameLock
                ? "ON"
                : "OFF"
        }`,
        `👤 Target: ${
            target || "ALL"
        }`,
        `✏️ Nickname: ${
            data.nickname
        }`,
        `🏠 GC Name: ${
            data.gcName
        }`,
        `⏱️ Reply Delay: ${
            data.replyDelay
        }ms`,
        `💬 Replies: ${
            data.totalReplies
        }`,
        `🔥 Reactions: ${
            data.totalReactions
        }`,
        `✏️ Nick Changes: ${
            data.totalNicknames
        }`,
        `🏷️ GC Changes: ${
            data.totalGCNames
        }`,
        `⚙️ Commands: ${
            data.totalCommands
        }`,
        `❌ Errors: ${
            data.totalErrors
        }`
    ].join(
        "\n"
    );
}

function helpText() {
    return [
        "👑 RYUK COMMANDS",
        "",
        "/ryuk help",
        "/ryuk status",
        "/ryuk on",
        "/ryuk off",
        "/ryuk reacton",
        "/ryuk reactoff",
        "/ryuk lock",
        "/ryuk unlock",
        "/ryuk setnick <name>",
        "/ryuk setgname <name>",
        "/ryuk target <uid>",
        "/ryuk untarget",
        "/ryuk targetstatus",
        "/ryuk delay <ms>",
        "",
        "Admin commands require an admin account.",
        "lock = nickname + GC name lock.",
        "unlock = disables both locks.",
        "target = limits automatic actions to one UID."
    ].join(
        "\n"
    );
}

function parseNameArgs(
    args,
    startIndex
) {
    if (
        !Array.isArray(
            args
        )
    ) {
        return "";
    }

    return args
        .slice(
            startIndex
        )
        .join(" ")
        .trim();
}

function addCommandCount() {
    const data =
        normalizeData(
            loadData()
        );

    data.totalCommands +=
        1;

    saveData(
        data
    );

    return data;
        }module.exports.config = {
    name: "ryuk",
    version: "2.0.0",
    hasPermission: 0,
    credits: "RYUK",
    description:
        "RYUK auto reply, reaction, nickname lock and GC name lock.",
    usePrefix: true,
    cooldowns: 2
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

        const {
            threadID,
            senderID,
            messageID,
            logMessageType,
            logMessageData
        } = event;

        const data =
            normalizeData(
                loadData()
            );

        if (
            logMessageType ===
            "log:user-nickname"
        ) {
            const changedUser =
                logMessageData &&
                (
                    logMessageData.participant_id ||
                    logMessageData.author
                );

            if (
                !changedUser
            ) {
                return;
            }

            if (
                !data.nicknameLock
            ) {
                return;
            }

            if (
                !shouldTargetUser(
                    threadID,
                    changedUser
                )
            ) {
                return;
            }

            const changedNickname =
                logMessageData &&
                logMessageData.nickname;

            if (
                String(
                    changedNickname || ""
                ).trim() ===
                String(
                    data.nickname
                ).trim()
            ) {
                return;
            }

            await restoreNickname(
                api,
                threadID,
                changedUser
            );

            return;
        }

        if (
            logMessageType ===
            "log:thread-name"
        ) {
            if (
                !data.gcNameLock
            ) {
                return;
            }

            await restoreGCName(
                api,
                threadID
            );

            return;
        }

        if (
            logMessageType
        ) {
            return;
        }

        if (
            !senderID ||
            !messageID
        ) {
            return;
        }

        const botID =
            getSafeBotID(
                api
            );

        if (
            botID &&
            String(
                senderID
            ) ===
            String(
                botID
            )
        ) {
            return;
        }

        if (
            !rememberMessage(
                String(
                    messageID
                )
            )
        ) {
            return;
        }

        if (
            !data.active
        ) {
            return;
        }

        if (
            !shouldTargetUser(
                threadID,
                senderID
            )
        ) {
            return;
        }

        if (
            data.autoReact &&
            canUseCooldown(
                REACTION_COOLDOWNS,
                `${threadID}:${senderID}`,
                4000
            )
        ) {
            const reaction =
                getNextReaction();

            setTimeout(
                async () => {
                    const success =
                        await safeReaction(
                            api,
                            reaction,
                            messageID
                        );

                    if (
                        success
                    ) {
                        const latest =
                            normalizeData(
                                loadData()
                            );

                        latest.totalReactions +=
                            1;

                        saveData(
                            latest
                        );
                    }
                },
                data.reactionDelay
            );
        }

        if (
            !data.autoReply
        ) {
            return;
        }

        if (
            !canUseCooldown(
                REPLY_COOLDOWNS,
                `${threadID}:${senderID}`,
                5000
            )
        ) {
            return;
        }

        safeTyping(
            api,
            threadID,
            true
        );

        const delay =
            normalizeDelay(
                data.replyDelay,
                2000,
                500,
                10000
            );

        setTimeout(
            async () => {
                try {
                    const latest =
                        normalizeData(
                            loadData()
                        );

                    if (
                        !latest.active ||
                        !latest.autoReply
                    ) {
                        return;
                    }

                    if (
                        !shouldTargetUser(
                            threadID,
                            senderID
                        )
                    ) {
                        return;
                    }

                    const reply =
                        `👑 [RYUK]\n\n${getNextReply()}`;

                    const sent =
                        await safeSend(
                            api,
                            reply,
                            threadID,
                            messageID
                        );

                    if (
                        sent
                    ) {
                        latest.totalReplies +=
                            1;

                        saveData(
                            latest
                        );
                    }
                } catch (
                    error
                ) {
                    console.error(
                        "[ryuk] reply worker error:",
                        error.message
                    );
                } finally {
                    safeTyping(
                        api,
                        threadID,
                        false
                    );
                }
            },
            delay
        );
    } catch (
        error
    ) {
        console.error(
            "[ryuk] handleEvent error:",
            error.message
        );

        try {
            const data =
                normalizeData(
                    loadData()
                );

            data.totalErrors +=
                1;

            saveData(
                data
            );
        } catch {}
    }
};module.exports.run =
async function ({
    api,
    event,
    args
}) {
    try {
        if (
            !event ||
            !event.threadID
        ) {
            return;
        }

        const threadID =
            String(
                event.threadID
            );

        const senderID =
            String(
                event.senderID || ""
            );

        const messageID =
            event.messageID;

        const commandArgs =
            Array.isArray(args)
                ? args
                : [];

        const action =
            String(
                commandArgs[0] ||
                "help"
            )
                .toLowerCase()
                .trim();

        if (
            !commandAllowed(
                threadID,
                senderID
            )
        ) {
            return;
        }

        let data =
            normalizeData(
                loadData()
            );

        data.totalCommands +=
            1;

        saveData(
            data
        );

        if (
            action === "help" ||
            action === "h"
        ) {
            return safeSend(
                api,
                helpText(),
                threadID,
                messageID
            );
        }

        if (
            action === "status" ||
            action === "stats"
        ) {
            return safeSend(
                api,
                formatStatus(
                    data,
                    threadID
                ),
                threadID,
                messageID
            );
        }

        const adminCommands = [
            "on",
            "off",
            "reacton",
            "reactoff",
            "lock",
            "unlock",
            "unlocknick",
            "unlockgc",
            "setnick",
            "setgname",
            "target",
            "untarget",
            "delay"
        ];

        if (
            adminCommands.includes(
                action
            ) &&
            !isAdmin(
                senderID
            )
        ) {
            return safeSend(
                api,
                "⛔ Access denied.\nAdmin lang ang puwedeng gumamit ng command na ito.",
                threadID,
                messageID
            );
        }

        if (
            action === "on"
        ) {
            data.active =
                true;

            data.autoReply =
                true;

            saveData(
                data
            );

            return safeSend(
                api,
                "👑 RYUK ON.\nAuto-reply is now active.",
                threadID,
                messageID
            );
        }

        if (
            action === "off"
        ) {
            data.active =
                false;

            saveData(
                data
            );

            return safeSend(
                api,
                "🛑 RYUK OFF.\nAuto-reply and auto-reaction are paused.",
                threadID,
                messageID
            );
        }

        if (
            action === "reacton"
        ) {
            data.autoReact =
                true;

            saveData(
                data
            );

            return safeSend(
                api,
                "🔥 Auto-react ON.",
                threadID,
                messageID
            );
        }

        if (
            action === "reactoff"
        ) {
            data.autoReact =
                false;

            saveData(
                data
            );

            return safeSend(
                api,
                "🛑 Auto-react OFF.",
                threadID,
                messageID
            );
        }

        if (
            action === "unlock"
        ) {
            data.nicknameLock =
                false;

            data.gcNameLock =
                false;

            saveData(
                data
            );

            return safeSend(
                api,
                "🔓 RYUK LOCK OFF.\nNickname lock at GC name lock ay naka-disable.",
                threadID,
                messageID
            );
        }

        if (
            action === "unlocknick"
        ) {
            data.nicknameLock =
                false;

            saveData(
                data
            );

            return safeSend(
                api,
                "🔓 Nickname lock OFF.",
                threadID,
                messageID
            );
        }

        if (
            action === "unlockgc"
        ) {
            data.gcNameLock =
                false;

            saveData(
                data
            );

            return safeSend(
                api,
                "🔓 GC name lock OFF.",
                threadID,
                messageID
            );
        }

        if (
            action === "delay"
        ) {
            const value =
                commandArgs[1];

            data.replyDelay =
                normalizeDelay(
                    value,
                    data.replyDelay,
                    500,
                    10000
                );

            saveData(
                data
            );

            return safeSend(
                api,
                `⏱️ Reply delay set to ${data.replyDelay}ms.`,
                threadID,
                messageID
            );
        }

        if (
            action === "setnick"
        ) {
            const newNickname =
                parseNameArgs(
                    commandArgs,
                    1
                );

            if (
                !newNickname
            ) {
                return safeSend(
                    api,
                    "⚠️ Gamitin:\n/ryuk setnick <nickname>",
                    threadID,
                    messageID
                );
            }

            data.nickname =
                normalizeName(
                    newNickname,
                    TARGET_NICKNAME
                );

            data.nicknameLock =
                true;

            saveData(
                data
            );

            const info =
                await safeGetThreadInfo(
                    api,
                    threadID
                );

            const participants =
                getParticipantIDs(
                    info
                );

            const count =
                await applyNicknameLock(
                    api,
                    threadID,
                    participants,
                    data.nickname
                );

            return safeSend(
                api,
                [
                    "✏️ NICKNAME LOCK UPDATED.",
                    "",
                    `Name: ${data.nickname}`,
                    `Users queued: ${count}`,
                    "🛡️ Kapag may magpalit, susubukan ni RYUK ibalik."
                ].join(
                    "\n"
                ),
                threadID,
                messageID
            );
        }

        if (
            action === "setgname"
        ) {
            const newGCName =
                parseNameArgs(
                    commandArgs,
                    1
                );

            if (
                !newGCName
            ) {
                return safeSend(
                    api,
                    "⚠️ Gamitin:\n/ryuk setgname <group name>",
                    threadID,
                    messageID
                );
            }

            data.gcName =
                normalizeName(
                    newGCName,
                    TARGET_GC_NAME
                );

            data.gcNameLock =
                true;

            saveData(
                data
            );

            setRestoreGuard(
                threadID,
                "gcname"
            );

            const changed =
                await safeSetTitle(
                    api,
                    threadID,
                    data.gcName
                );

            if (
                changed
            ) {
                data.totalGCNames +=
                    1;

                saveData(
                    data
                );
            }

            return safeSend(
                api,
                [
                    "🏠 GC NAME LOCK UPDATED.",
                    "",
                    `Group name: ${data.gcName}`,
                    `Applied: ${
                        changed
                            ? "YES"
                            : "NO"
                    }`,
                    "🛡️ Kapag may magpalit, susubukan ni RYUK ibalik."
                ].join(
                    "\n"
                ),
                threadID,
                messageID
            );
        }
    } catch (
        error
    ) {
        console.error(
            "[ryuk] command error:",
            error.message
        );

        try {
            const data =
                normalizeData(
                    loadData()
                );

            data.totalErrors +=
                1;

            saveData(
                data
            );
        } catch {}

        return safeSend(
            api,
            "❌ May error habang pinoproseso ang command.",
            event.threadID,
            event.messageID
        );
    }
};    if (
        action === "lock"
    ) {
        data.active =
            true;

        data.autoReply =
            true;

        data.nicknameLock =
            true;

        data.gcNameLock =
            true;

        saveData(
            data
        );

        safeTyping(
            api,
            threadID,
            true
        );

        const result =
            await applyFullLock(
                api,
                threadID,
                data
            );

        safeTyping(
            api,
            threadID,
            false
        );

        const nicknameResult =
            result.nicknameCount;

        const gcResult =
            result.gcNameChanged
                ? "YES"
                : "NO";

        await safeReaction(
            api,
            "🥷",
            messageID
        );

        return safeSend(
            api,
            [
                "🛡️ RYUK LOCK ACTIVATED.",
                "",
                `✏️ Nickname: ${data.nickname}`,
                `👥 Nicknames queued: ${nicknameResult}`,
                `🏠 GC Name: ${data.gcName}`,
                `🏷️ GC name applied: ${gcResult}`,
                "",
                "🔥 Auto-reply: ON",
                "⚡ Auto-react: ON",
                "🛡️ Nickname restore: ON",
                "🏠 GC name restore: ON"
            ].join(
                "\n"
            ),
            threadID,
            messageID
        );
    }

    if (
        action === "target"
    ) {
        const targetID =
            String(
                commandArgs[1] || ""
            )
                .replace(
                    /[^0-9]/g,
                    ""
                )
                .trim();

        if (
            !targetID
        ) {
            return safeSend(
                api,
                [
                    "⚠️ Missing UID.",
                    "",
                    "Gamitin:",
                    "/ryuk target <uid>"
                ].join(
                    "\n"
                ),
                threadID,
                messageID
            );
        }

        setTarget(
            threadID,
            targetID
        );

        return safeSend(
            api,
            [
                "🎯 RYUK TARGET SET.",
                "",
                `Target UID: ${targetID}`,
                "",
                "Auto-reply at auto-react ay para sa target user lamang.",
                "Nickname lock ay target din kapag active ang target mode."
            ].join(
                "\n"
            ),
            threadID,
            messageID
        );
    }

    if (
        action === "untarget"
    ) {
        const oldTarget =
            getTarget(
                threadID
            );

        removeTarget(
            threadID
        );

        return safeSend(
            api,
            [
                "🎯 TARGET MODE OFF.",
                "",
                `Previous target: ${
                    oldTarget || "NONE"
                }`,
                "Automatic actions are back to normal."
            ].join(
                "\n"
            ),
            threadID,
            messageID
        );
    }

    if (
        action === "targetstatus"
    ) {
        const target =
            getTarget(
                threadID
            );

        return safeSend(
            api,
            [
                "🎯 TARGET STATUS",
                "",
                `Target: ${
                    target || "NONE"
                }`,
                `Mode: ${
                    target
                        ? "TARGET ONLY"
                        : "ALL USERS"
                }`
            ].join(
                "\n"
            ),
            threadID,
            messageID
        );
    }

    return safeSend(
        api,
        [
            "⚠️ Unknown command.",
            "",
            `Command: /ryuk ${action}`,
            "",
            "Type /ryuk help para makita ang available commands."
        ].join(
            "\n"
        ),
        threadID,
        messageID
    );
};const STARTUP_STATE = {
    startedAt: Date.now(),
    ready: false,
    lastSave: 0,
    lastCleanup: 0
};

function validateRuntime() {
    const checks = {
        fs: typeof fs !== "undefined",
        path: typeof path !== "undefined",
        dataFile: Boolean(DATA_FILE),
        admins: Array.isArray(
            ADMIN_IDS
        ),
        replies: Array.isArray(
            REPLY_LINES
        ),
        reactions: Array.isArray(
            REACTIONS
        )
    };

    return Object.values(
        checks
    ).every(
        Boolean
    );
}

function ensureDataFile() {
    try {
        if (
            !fs.existsSync(
                DATA_FILE
            )
        ) {
            const data =
                cloneDefault();

            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(
                    data,
                    null,
                    2
                ),
                "utf8"
            );
        }

        const loaded =
            normalizeData(
                loadData()
            );

        saveData(
            loaded
        );

        STARTUP_STATE.lastSave =
            Date.now();

        return true;
    } catch (
        error
    ) {
        console.error(
            "[ryuk] startup data error:",
            error.message
        );

        return false;
    }
}

function limitMapSize(
    map,
    maximum
) {
    if (
        !map ||
        typeof map.size !==
        "number"
    ) {
        return;
    }

    while (
        map.size >
        maximum
    ) {
        const first =
            map.keys()
                .next()
                .value;

        if (
            first === undefined
        ) {
            break;
        }

        map.delete(
            first
        );
    }
}

function cleanupRuntime() {
    try {
        cleanupCaches();

        limitMapSize(
            TARGET_USERS,
            1000
        );

        limitMapSize(
            RESTORE_GUARD,
            5000
        );

        limitMapSize(
            COMMAND_COOLDOWNS,
            5000
        );

        limitMapSize(
            NICKNAME_QUEUE,
            500
        );

        STARTUP_STATE.lastCleanup =
            Date.now();
    } catch (
        error
    ) {
        console.error(
            "[ryuk] cleanup error:",
            error.message
        );
    }
}

function initializeRyuk() {
    try {
        if (
            !validateRuntime()
        ) {
            console.error(
                "[ryuk] runtime validation failed."
            );

            return false;
        }

        if (
            !ensureDataFile()
        ) {
            console.error(
                "[ryuk] data initialization failed."
            );

            return false;
        }

        cleanupRuntime();

        STARTUP_STATE.ready =
            true;

        console.log(
            "[ryuk] module initialized."
        );

        return true;
    } catch (
        error
    ) {
        console.error(
            "[ryuk] initialization error:",
            error.message
        );

        return false;
    }
}

initializeRyuk();

const CLEANUP_INTERVAL =
    setInterval(
        cleanupRuntime,
        120000
    );

if (
    CLEANUP_INTERVAL &&
    typeof CLEANUP_INTERVAL.unref ===
    "function"
) {
    CLEANUP_INTERVAL.unref();
        }function isValidThreadID(
    threadID
) {
    if (
        threadID === undefined ||
        threadID === null
    ) {
        return false;
    }

    const value =
        String(
            threadID
        ).trim();

    return (
        value.length > 0 &&
        value.length <= 100
    );
}

function isValidUserID(
    userID
) {
    if (
        userID === undefined ||
        userID === null
    ) {
        return false;
    }

    const value =
        String(
            userID
        )
            .replace(
                /[^0-9]/g,
                ""
            );

    return (
        value.length >= 5 &&
        value.length <= 30
    );
}

function cleanCommandArgs(
    args
) {
    if (
        !Array.isArray(
            args
        )
    ) {
        return [];
    }

    return args
        .map(
            (item) =>
                String(
                    item === undefined ||
                    item === null
                        ? ""
                        : item
                ).trim()
        )
        .filter(
            Boolean
        );
}

function getCommandName(
    args
) {
    const cleaned =
        cleanCommandArgs(
            args
        );

    return String(
        cleaned[0] ||
        "help"
    )
        .toLowerCase()
        .trim();
}

function getCommandValue(
    args,
    index
) {
    const cleaned =
        cleanCommandArgs(
            args
        );

    return cleaned[index] || "";
}

function getJoinedCommandValue(
    args,
    start
) {
    const cleaned =
        cleanCommandArgs(
            args
        );

    return cleaned
        .slice(start)
        .join(" ")
        .trim();
}

function commandNeedsAdmin(
    command
) {
    return [
        "on",
        "off",
        "reacton",
        "reactoff",
        "lock",
        "unlock",
        "unlocknick",
        "unlockgc",
        "setnick",
        "setgname",
        "target",
        "untarget",
        "targetstatus",
        "delay"
    ].includes(
        String(
            command || ""
        )
            .toLowerCase()
            .trim()
    );
}

function buildErrorMessage(
    command
) {
    return [
        "⚠️ RYUK COMMAND ERROR",
        "",
        `Command: ${
            command || "unknown"
        }`,
        "",
        "Gamitin ang:",
        "/ryuk help"
    ].join(
        "\n"
    );
}

function getQueueLength(
    threadID
) {
    const state =
        getThreadState(
            threadID
        );

    if (
        !state
    ) {
        return 0;
    }

    return state.items.length;
}

function clearThreadQueue(
    threadID
) {
    const state =
        getThreadState(
            threadID
        );

    if (
        !state
    ) {
        return false;
    }

    state.items.length =
        0;

    return true;
}

function clearThreadCooldowns(
    threadID
) {
    const prefix =
        `${threadID}:`;

    const maps = [
        REPLY_COOLDOWNS,
        REACTION_COOLDOWNS,
        NICKNAME_COOLDOWNS,
        COMMAND_COOLDOWNS
    ];

    for (
        const map of maps
    ) {
        for (
            const key of map.keys()
        ) {
            if (
                String(
                    key
                ).startsWith(
                    prefix
                )
            ) {
                map.delete(
                    key
                );
            }
        }
    }
}

function clearThreadGuards(
    threadID
) {
    const prefix =
        `${threadID}:`;

    for (
        const key of RESTORE_GUARD.keys()
    ) {
        if (
            String(
                key
            ).startsWith(
                prefix
            )
        ) {
            RESTORE_GUARD.delete(
                key
            );
        }function resetThreadRuntime(
    threadID
) {
    if (
        !isValidThreadID(
            threadID
        )
    ) {
        return false;
    }

    clearThreadQueue(
        threadID
    );

    clearThreadCooldowns(
        threadID
    );

    clearThreadGuards(
        threadID
    );

    removeTarget(
        threadID
    );

    return true;
}

function getAdminListText() {
    return ADMIN_IDS
        .map(
            (id, index) =>
                `${index + 1}. ${id}`
        )
        .join(
            "\n"
        );
}

function getLockText(
    data
) {
    return [
        "🛡️ RYUK LOCK STATUS",
        "",
        `Nickname lock: ${
            data.nicknameLock
                ? "ON"
                : "OFF"
        }`,
        `GC name lock: ${
            data.gcNameLock
                ? "ON"
                : "OFF"
        }`,
        "",
        `Nickname: ${data.nickname}`,
        `GC name: ${data.gcName}`,
        "",
        `Queue: ${
            "available"
        }`
    ].join(
        "\n"
    );
}

function getRuntimeStatus(
    threadID
) {
    const state =
        getThreadState(
            threadID
        );

    return {
        ready:
            STARTUP_STATE.ready,

        uptime:
            Date.now() -
            STARTUP_STATE.startedAt,

        queue:
            state
                ? state.items.length
                : 0,

        target:
            getTarget(
                threadID
            ),

        seen:
            SEEN_MESSAGES.size,

        nicknameGuards:
            RESTORE_GUARD.size,

        cooldowns:
            COMMAND_COOLDOWNS.size
    };
}

function formatRuntimeStatus(
    threadID
) {
    const runtime =
        getRuntimeStatus(
            threadID
        );

    const uptimeSeconds =
        Math.floor(
            runtime.uptime /
            1000
        );

    return [
        "⚙️ RYUK RUNTIME",
        "",
        `Ready: ${
            runtime.ready
                ? "YES"
                : "NO"
        }`,
        `Uptime: ${
            uptimeSeconds
        }s`,
        `Queue: ${
            runtime.queue
        }`,
        `Seen messages: ${
            runtime.seen
        }`,
        `Restore guards: ${
            runtime.nicknameGuards
        }`,
        `Cooldown entries: ${
            runtime.cooldowns
        }`,
        `Target: ${
            runtime.target ||
            "ALL"
        }`
    ].join(
        "\n"
    );
}

function makeUniqueArray(
    values
) {
    if (
        !Array.isArray(
            values
        )
    ) {
        return [];
    }

    return [
        ...new Set(
            values
                .map(
                    (value) =>
                        String(
                            value
                        ).trim()
                )
                .filter(
                    Boolean
                )
        )
    ];
}

function getValidParticipants(
    info
) {
    if (
        !info
    ) {
        return [];
    }

    return makeUniqueArray(
        info.participantIDs
    ).filter(
        isValidUserID
    );
}

function shouldSkipNickname(
    api,
    userID
) {
    const botID =
        getSafeBotID(
            api
        );

    if (
        !botID
    ) {
        return false;
    }

    return (
        String(
            botID
        ) ===
        String(
            userID
        )
    );
}

function getNicknameTargets(
    api,
    threadID,
    participantIDs
) {
    const users =
        makeUniqueArray(
            participantIDs
        );

    return users.filter(
        (userID) => {
            if (
                shouldSkipNickname(
                    api,
                    userID
                )
            ) {
                return false;
            }

            return shouldTargetUser(
                threadID,
                userID
            );
        }
    );
}

function buildLockSummary(
    nicknameCount,
    gcChanged
) {
    return [
        "👑 RYUK LOCK DONE",
        "",
        `✏️ Nickname queue: ${
            nicknameCount
        }`,
        `🏠 GC name applied: ${
            gcChanged
                ? "YES"
                : "NO"
        }`,
        "",
        "🛡️ Protection remains active."
    ].join(
        "\n"
    );
    }async function applyNicknameToParticipants(
    api,
    threadID,
    participantIDs,
    nickname
) {
    try {
        const targets =
            getNicknameTargets(
                api,
                threadID,
                participantIDs
            );

        if (
            !targets.length
        ) {
            return 0;
        }

        let count = 0;

        for (
            const userID of targets
        ) {
            const added =
                queueNickname(
                    api,
                    threadID,
                    userID,
                    nickname
                );

            if (
                added
            ) {
                setRestoreGuard(
                    threadID,
                    "nickname",
                    userID
                );

                count += 1;
            }
        }

        return count;
    } catch (
        error
    ) {
        console.error(
            "[ryuk] participant nickname error:",
            error.message
        );

        return 0;
    }
}

async function applyCurrentLocks(
    api,
    threadID
) {
    const data =
        normalizeData(
            loadData()
        );

    const info =
        await safeGetThreadInfo(
            api,
            threadID
        );

    if (
        !info
    ) {
        return {
            nicknameCount: 0,
            gcChanged: false
        };
    }

    let nicknameCount =
        0;

    let gcChanged =
        false;

    if (
        data.nicknameLock
    ) {
        nicknameCount =
            await applyNicknameToParticipants(
                api,
                threadID,
                getValidParticipants(
                    info
                ),
                data.nickname
            );
    }

    if (
        data.gcNameLock
    ) {
        gcChanged =
            await applyGCNameLock(
                api,
                threadID,
                data.gcName
            );
    }

    return {
        nicknameCount,
        gcChanged
    };
}

async function refreshLocksAfterCommand(
    api,
    threadID
) {
    try {
        safeTyping(
            api,
            threadID,
            true
        );

        const result =
            await applyCurrentLocks(
                api,
                threadID
            );

        safeTyping(
            api,
            threadID,
            false
        );

        return result;
    } catch (
        error
    ) {
        safeTyping(
            api,
            threadID,
            false
        );

        console.error(
            "[ryuk] refresh locks error:",
            error.message
        );

        return {
            nicknameCount: 0,
            gcChanged: false
        };
    }
}

function saveAndReturn(
    data
) {
    const normalized =
        normalizeData(
            data
        );

    saveData(
        normalized
    );

    return normalized;
}

function updateBooleanSetting(
    property,
    value
) {
    const data =
        normalizeData(
            loadData()
        );

    data[property] =
        Boolean(
            value
        );

    return saveAndReturn(
        data
    );
}

function getSettingValue(
    property
) {
    const data =
        normalizeData(
            loadData()
        );

    return data[property];
}

function createReplyMessage(
    text
) {
    const clean =
        String(
            text || ""
        ).trim();

    if (
        !clean
    ) {
        return "👑 RYUK POGI ON TOP.";
    }

    return [
        "👑 [RYUK]",
        "",
        clean
    ].join(
        "\n"
    );
}

function createTargetMessage(
    target
) {
    if (
        !target
    ) {
        return [
            "🎯 TARGET MODE",
            "",
            "Target: ALL USERS"
        ].join(
            "\n"
        );
    }

    return [
        "🎯 TARGET MODE",
        "",
        `Target UID: ${target}`,
        "",
        "Automatic replies and reactions are limited to this user."
    ].join(
        "\n"
    );
}function incrementErrorCount() {
    try {
        const data =
            normalizeData(
                loadData()
            );

        data.totalErrors =
            Number(
                data.totalErrors || 0
            ) + 1;

        saveData(
            data
        );
    } catch (
        error
    ) {
        console.error(
            "[ryuk] error counter failed:",
            error.message
        );
    }
}

function incrementReplyCount() {
    try {
        const data =
            normalizeData(
                loadData()
            );

        data.totalReplies =
            Number(
                data.totalReplies || 0
            ) + 1;

        saveData(
            data
        );
    } catch (
        error
    ) {
        console.error(
            "[ryuk] reply counter failed:",
            error.message
        );
    }
}

function incrementReactionCount() {
    try {
        const data =
            normalizeData(
                loadData()
            );

        data.totalReactions =
            Number(
                data.totalReactions || 0
            ) + 1;

        saveData(
            data
        );
    } catch (
        error
    ) {
        console.error(
            "[ryuk] reaction counter failed:",
            error.message
        );
    }
}

function incrementNicknameCount() {
    try {
        const data =
            normalizeData(
                loadData()
            );

        data.totalNicknames =
            Number(
                data.totalNicknames || 0
            ) + 1;

        saveData(
            data
        );
    } catch (
        error
    ) {
        console.error(
            "[ryuk] nickname counter failed:",
            error.message
        );
    }
}

function incrementGCNameCount() {
    try {
        const data =
            normalizeData(
                loadData()
            );

        data.totalGCNames =
            Number(
                data.totalGCNames || 0
            ) + 1;

        saveData(
            data
        );
    } catch (
        error
    ) {
        console.error(
            "[ryuk] gc counter failed:",
            error.message
        );
    }
}

function incrementCommandCount() {
    try {
        const data =
            normalizeData(
                loadData()
            );

        data.totalCommands =
            Number(
                data.totalCommands || 0
            ) + 1;

        saveData(
            data
        );
    } catch (
        error
    ) {
        console.error(
            "[ryuk] command counter failed:",
            error.message
        );
    }
}

function getCurrentSettings() {
    const data =
        normalizeData(
            loadData()
        );

    return {
        active:
            data.active,

        autoReply:
            data.autoReply,

        autoReact:
            data.autoReact,

        nicknameLock:
            data.nicknameLock,

        gcNameLock:
            data.gcNameLock,

        nickname:
            data.nickname,

        gcName:
            data.gcName,

        replyDelay:
            data.replyDelay,

        reactionDelay:
            data.reactionDelay
    };
}

function isLockEnabled(
    type
) {
    const data =
        normalizeData(
            loadData()
        );

    if (
        type ===
        "nickname"
    ) {
        return Boolean(
            data.nicknameLock
        );
    }

    if (
        type ===
        "gcname"
    ) {
        return Boolean(
            data.gcNameLock
        );
    }

    return false;
}

function clearExpiredGuards() {
    const now =
        Date.now();

    for (
        const [
            key,
            timestamp
        ] of RESTORE_GUARD.entries()
    ) {
        if (
            now -
            Number(
                timestamp || 0
            ) >
            10000
        ) {
            RESTORE_GUARD.delete(
                key
            );
        }
    }
}

function clearExpiredTargets() {
    if (
        TARGET_USERS.size <=
        1000
    ) {
        return;
    }

    while (
        TARGET_USERS.size >
        1000
    ) {
        const first =
            TARGET_USERS.keys()
                .next()
                .value;

        if (
            first === undefined
        ) {
            break;
        }

        TARGET_USERS.delete(
            first
        );
    }
}

setInterval(
    () => {
        clearExpiredGuards();
        clearExpiredTargets();
    },
    60000
).unref();function getCommandUsage(
    command
) {
    const usages = {
        on:
            "/ryuk on",

        off:
            "/ryuk off",

        reacton:
            "/ryuk reacton",

        reactoff:
            "/ryuk reactoff",

        lock:
            "/ryuk lock",

        unlock:
            "/ryuk unlock",

        unlocknick:
            "/ryuk unlocknick",

        unlockgc:
            "/ryuk unlockgc",

        setnick:
            "/ryuk setnick <nickname>",

        setgname:
            "/ryuk setgname <group name>",

        target:
            "/ryuk target <uid>",

        untarget:
            "/ryuk untarget",

        targetstatus:
            "/ryuk targetstatus",

        delay:
            "/ryuk delay <milliseconds>",

        status:
            "/ryuk status"
    };

    return (
        usages[
            String(
                command || ""
            )
                .toLowerCase()
        ] ||
        "/ryuk help"
    );
}

function isSafeCommandValue(
    value
) {
    const text =
        String(
            value || ""
        ).trim();

    if (
        !text
    ) {
        return false;
    }

    if (
        text.length >
        100
    ) {
        return false;
    }

    return true;
}

function getCommandHelpLine(
    command,
    description
) {
    return [
        getCommandUsage(
            command
        ),
        `  ${description}`
    ].join(
        "\n"
    );
}

function extendedHelpText() {
    return [
        "👑 RYUK COMMAND LIST",
        "",
        getCommandHelpLine(
            "on",
            "Enable RYUK."
        ),
        getCommandHelpLine(
            "off",
            "Disable automatic replies."
        ),
        getCommandHelpLine(
            "reacton",
            "Enable reactions."
        ),
        getCommandHelpLine(
            "reactoff",
            "Disable reactions."
        ),
        getCommandHelpLine(
            "lock",
            "Enable nickname + GC name lock."
        ),
        getCommandHelpLine(
            "unlock",
            "Disable both locks."
        ),
        getCommandHelpLine(
            "unlocknick",
            "Disable nickname lock."
        ),
        getCommandHelpLine(
            "unlockgc",
            "Disable GC name lock."
        ),
        getCommandHelpLine(
            "setnick",
            "Change and apply locked nickname."
        ),
        getCommandHelpLine(
            "setgname",
            "Change and apply locked GC name."
        ),
        getCommandHelpLine(
            "target",
            "Target one UID."
        ),
        getCommandHelpLine(
            "untarget",
            "Remove target mode."
        ),
        getCommandHelpLine(
            "targetstatus",
            "Show current target."
        ),
        getCommandHelpLine(
            "delay",
            "Change reply delay."
        ),
        getCommandHelpLine(
            "status",
            "Show complete settings."
        ),
        "",
        "Example:",
        "/ryuk setnick RYUK POGI ON TOP",
        "/ryuk setgname RYUK POGI GC",
        "/ryuk target 123456789",
        "/ryuk delay 2000"
    ].join(
        "\n"
    );
}

function getShortStatus(
    threadID
) {
    const data =
        normalizeData(
            loadData()
        );

    const target =
        getTarget(
            threadID
        );

    return [
        "👑 RYUK",
        `Status: ${
            data.active
                ? "ON"
                : "OFF"
        }`,
        `React: ${
            data.autoReact
                ? "ON"
                : "OFF"
        }`,
        `Nick Lock: ${
            data.nicknameLock
                ? "ON"
                : "OFF"
        }`,
        `GC Lock: ${
            data.gcNameLock
                ? "ON"
                : "OFF"
        }`,
        `Target: ${
            target || "ALL"
        }`
    ].join(
        "\n"
    );
}

function isAdminCommand(
    command
) {
    return commandNeedsAdmin(
        command
    );
}

function validateCommandContext(
    event
) {
    if (
        !event
    ) {
        return false;
    }

    if (
        !isValidThreadID(
            event.threadID
        )
    ) {
        return false;
    }

    if (
        !isValidUserID(
            event.senderID
        )
    ) {
        return false;
    }

    return true;
            }async function handleSetNickname(
    api,
    event,
    args
) {
    const threadID =
        String(
            event.threadID
        );

    const messageID =
        event.messageID;

    const nickname =
        getJoinedCommandValue(
            args,
            1
        );

    if (
        !isSafeCommandValue(
            nickname
        )
    ) {
        return safeSend(
            api,
            [
                "⚠️ Invalid nickname.",
                "",
                "Gamitin:",
                "/ryuk setnick <nickname>"
            ].join(
                "\n"
            ),
            threadID,
            messageID
        );
    }

    const data =
        normalizeData(
            loadData()
        );

    data.nickname =
        normalizeName(
            nickname,
            TARGET_NICKNAME
        );

    data.nicknameLock =
        true;

    saveData(
        data
    );

    const info =
        await safeGetThreadInfo(
            api,
            threadID
        );

    if (
        !info
    ) {
        return safeSend(
            api,
            "❌ Hindi makuha ang members ng GC. Na-save ang nickname setting pero hindi na-apply ngayon.",
            threadID,
            messageID
        );
    }

    const participants =
        getValidParticipants(
            info
        );

    const count =
        await applyNicknameToParticipants(
            api,
            threadID,
            participants,
            data.nickname
        );

    return safeSend(
        api,
        [
            "✏️ NICKNAME SET SUCCESS.",
            "",
            `Name: ${data.nickname}`,
            `Users queued: ${count}`,
            "",
            "🛡️ Nickname lock: ON"
        ].join(
            "\n"
        ),
        threadID,
        messageID
    );
}

async function handleSetGCName(
    api,
    event,
    args
) {
    const threadID =
        String(
            event.threadID
        );

    const messageID =
        event.messageID;

    const gcName =
        getJoinedCommandValue(
            args,
            1
        );

    if (
        !isSafeCommandValue(
            gcName
        )
    ) {
        return safeSend(
            api,
            [
                "⚠️ Invalid GC name.",
                "",
                "Gamitin:",
                "/ryuk setgname <group name>"
            ].join(
                "\n"
            ),
            threadID,
            messageID
        );
    }

    const data =
        normalizeData(
            loadData()
        );

    data.gcName =
        normalizeName(
            gcName,
            TARGET_GC_NAME
        );

    data.gcNameLock =
        true;

    saveData(
        data
    );

    setRestoreGuard(
        threadID,
        "gcname"
    );

    const changed =
        await safeSetTitle(
            api,
            threadID,
            data.gcName
        );

    if (
        changed
    ) {
        data.totalGCNames +=
            1;

        saveData(
            data
        );
    }

    return safeSend(
        api,
        [
            "🏠 GC NAME SET SUCCESS.",
            "",
            `Name: ${data.gcName}`,
            `Applied: ${
                changed
                    ? "YES"
                    : "NO"
            }`,
            "",
            "🛡️ GC name lock: ON"
        ].join(
            "\n"
        ),
        threadID,
        messageID
    );
}

async function handleTarget(
    api,
    event,
    args
) {
    const threadID =
        String(
            event.threadID
        );

    const messageID =
        event.messageID;

    const target =
        getCommandValue(
            args,
            1
        ).replace(
            /[^0-9]/g,
            ""
        );

    if (
        !isValidUserID(
            target
        )
    ) {
        return safeSend(
            api,
            [
                "⚠️ Invalid UID.",
                "",
                "Gamitin:",
                "/ryuk target <uid>"
            ].join(
                "\n"
            ),
            threadID,
            messageID
        );
    }

    setTarget(
        threadID,
        target
    );

    return safeSend(
        api,
        createTargetMessage(
            target
        ),
        threadID,
        messageID
    );
}

async function handleUntarget(
    api,
    event
) {
    const threadID =
        String(
            event.threadID
        );

    const messageID =
        event.messageID;

    const previous =
        getTarget(
            threadID
        );

    removeTarget(
        threadID
    );

    return safeSend(
        api,
        [
            "🎯 TARGET REMOVED.",
            "",
            `Previous target: ${
                previous || "NONE"
            }`,
            "Mode: ALL USERS"
        ].join(
            "\n"
        ),
        threadID,
        messageID
    );
    }async function handleDelay(
    api,
    event,
    args
) {
    const threadID =
        String(
            event.threadID
        );

    const messageID =
        event.messageID;

    const raw =
        getCommandValue(
            args,
            1
        );

    const parsed =
        Number(
            raw
        );

    if (
        !Number.isFinite(
            parsed
        )
    ) {
        return safeSend(
            api,
            [
                "⚠️ Invalid delay.",
                "",
                "Gamitin:",
                "/ryuk delay 2000",
                "",
                "Allowed: 500ms hanggang 10000ms."
            ].join(
                "\n"
            ),
            threadID,
            messageID
        );
    }

    const data =
        normalizeData(
            loadData()
        );

    data.replyDelay =
        normalizeDelay(
            parsed,
            2000,
            500,
            10000
        );

    saveData(
        data
    );

    return safeSend(
        api,
        [
            "⏱️ REPLY DELAY UPDATED.",
            "",
            `Delay: ${data.replyDelay}ms`
        ].join(
            "\n"
        ),
        threadID,
        messageID
    );
}

async function handleLock(
    api,
    event
) {
    const threadID =
        String(
            event.threadID
        );

    const messageID =
        event.messageID;

    const data =
        normalizeData(
            loadData()
        );

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

    saveData(
        data
    );

    const result =
        await refreshLocksAfterCommand(
            api,
            threadID
        );

    await safeReaction(
        api,
        "🥷",
        messageID
    );

    return safeSend(
        api,
        [
            "🛡️ RYUK LOCK ACTIVATED.",
            "",
            `✏️ Nickname: ${data.nickname}`,
            `👥 Nicknames queued: ${
                result.nicknameCount
            }`,
            `🏠 GC Name: ${data.gcName}`,
            `🏷️ GC Applied: ${
                result.gcChanged
                    ? "YES"
                    : "NO"
            }`,
            "",
            "🔥 Auto Reply: ON",
            "⚡ Auto React: ON",
            "🛡️ Nick Lock: ON",
            "🏠 GC Lock: ON"
        ].join(
            "\n"
        ),
        threadID,
        messageID
    );
}

async function handleUnlock(
    api,
    event,
    type
) {
    const threadID =
        String(
            event.threadID
        );

    const messageID =
        event.messageID;

    const data =
        normalizeData(
            loadData()
        );

    if (
        type ===
        "nickname"
    ) {
        data.nicknameLock =
            false;
    } else if (
        type ===
        "gcname"
    ) {
        data.gcNameLock =
            false;
    } else {
        data.nicknameLock =
            false;

        data.gcNameLock =
            false;
    }

    saveData(
        data
    );

    return safeSend(
        api,
        [
            "🔓 RYUK LOCK UPDATED.",
            "",
            `Nickname Lock: ${
                data.nicknameLock
                    ? "ON"
                    : "OFF"
            }`,
            `GC Name Lock: ${
                data.gcNameLock
                    ? "ON"
                    : "OFF"
            }`
        ].join(
            "\n"
        ),
        threadID,
        messageID
    );
}

async function handleStatus(
    api,
    event
) {
    const threadID =
        String(
            event.threadID
        );

    const messageID =
        event.messageID;

    const data =
        normalizeData(
            loadData()
        );

    return safeSend(
        api,
        formatStatus(
            data,
            threadID
        ),
        threadID,
        messageID
    );
}

async function handleRuntime(
    api,
    event
) {
    const threadID =
        String(
            event.threadID
        );

    const messageID =
        event.messageID;

    return safeSend(
        api,
        formatRuntimeStatus(
            threadID
        ),
        threadID,
        messageID
    );
    }async function handleReplyToggle(
    api,
    event,
    enabled
) {
    const threadID =
        String(event.threadID);

    const messageID =
        event.messageID;

    const data =
        normalizeData(loadData());

    data.autoReply =
        Boolean(enabled);

    saveData(data);

    return safeSend(
        api,
        [
            `💬 AUTO REPLY: ${
                data.autoReply
                    ? "ON"
                    : "OFF"
            }`,
            "",
            data.autoReply
                ? "Makakasagot na ulit si RYUK sa messages."
                : "Hindi muna sasagot si RYUK."
        ].join("\n"),
        threadID,
        messageID
    );
}

async function handleReactionToggle(
    api,
    event,
    enabled
) {
    const threadID =
        String(event.threadID);

    const messageID =
        event.messageID;

    const data =
        normalizeData(loadData());

    data.autoReact =
        Boolean(enabled);

    saveData(data);

    return safeSend(
        api,
        [
            `⚡ AUTO REACT: ${
                data.autoReact
                    ? "ON"
                    : "OFF"
            }`,
            "",
            data.autoReact
                ? "Automatic reactions are enabled."
                : "Automatic reactions are disabled."
        ].join("\n"),
        threadID,
        messageID
    );
}

async function handleTargetStatus(
    api,
    event
) {
    const threadID =
        String(event.threadID);

    const messageID =
        event.messageID;

    const target =
        getTarget(threadID);

    if (!target) {
        return safeSend(
            api,
            [
                "🎯 TARGET MODE",
                "",
                "Status: OFF",
                "",
                "Gamitin:",
                "/ryuk target USER_ID"
            ].join("\n"),
            threadID,
            messageID
        );
    }

    return safeSend(
        api,
        [
            "🎯 TARGET MODE",
            "",
            "Status: ON",
            `Target UID: ${target}`,
            "",
            "Auto reply/react will focus on this user."
        ].join("\n"),
        threadID,
        messageID
    );
}

async function handleReset(
    api,
    event
) {
    const threadID =
        String(event.threadID);

    const messageID =
        event.messageID;

    clearThreadRuntime(
        threadID
    );

    return safeSend(
        api,
        [
            "🧹 RYUK RUNTIME RESET.",
            "",
            "Temporary queues, cooldowns, guards, and target data were cleared.",
            "",
            "Persistent settings were not deleted."
        ].join("\n"),
        threadID,
        messageID
    );
}

async function handleQueue(
    api,
    event
) {
    const threadID =
        String(event.threadID);

    const messageID =
        event.messageID;

    const queueLength =
        getQueueLength(
            threadID
        );

    return safeSend(
        api,
        [
            "📦 RYUK QUEUE",
            "",
            `Nickname queue: ${queueLength}`,
            `Worker active: ${
                ACTIVE_WORKERS.has(threadID)
                    ? "YES"
                    : "NO"
            }`,
            `Seen cache: ${SEEN_MESSAGES.size}/${MAX_SEEN}`
        ].join("\n"),
        threadID,
        messageID
    );
}

async function handlePing(
    api,
    event
) {
    const threadID =
        String(event.threadID);

    const messageID =
        event.messageID;

    const started =
        Date.now();

    const sent =
        await safeSend(
            api,
            "🏓 RYUK PONG!",
            threadID,
            messageID
        );

    const elapsed =
        Date.now() - started;

    if (!sent) {
        return false;
    }

    return safeSend(
        api,
        `⚡ Response: ${elapsed}ms`,
        threadID
    );
    }async function handleAdminInfo(
    api,
    event
) {
    const threadID =
        String(event.threadID);

    const messageID =
        event.messageID;

    return safeSend(
        api,
        [
            "👑 RYUK ADMINS",
            "",
            getAdminListText(),
            "",
            "Admin-only commands are protected."
        ].join("\n"),
        threadID,
        messageID
    );
}

async function handleSave(
    api,
    event
) {
    const threadID =
        String(event.threadID);

    const messageID =
        event.messageID;

    const data =
        normalizeData(loadData());

    const saved =
        saveData(data);

    return safeSend(
        api,
        saved
            ? [
                "💾 RYUK DATA SAVED.",
                "",
                `File: ${path.basename(DATA_FILE)}`,
                "Status: SUCCESS"
            ].join("\n")
            : [
                "❌ SAVE FAILED.",
                "",
                "Hindi naisulat ang persistent data."
            ].join("\n"),
        threadID,
        messageID
    );
}

async function handleReplyDelay(
    api,
    event,
    args
) {
    const threadID =
        String(event.threadID);

    const messageID =
        event.messageID;

    const raw =
        getCommandValue(
            args,
            1
        );

    if (!raw) {
        return safeSend(
            api,
            [
                "⏱️ CURRENT DELAY",
                "",
                `Reply delay: ${
                    normalizeData(
                        loadData()
                    ).replyDelay
                }ms`,
                "",
                "Example:",
                "/ryuk delay 2500"
            ].join("\n"),
            threadID,
            messageID
        );
    }

    return handleDelay(
        api,
        event,
        args
    );
}

async function handleNickShow(
    api,
    event
) {
    const threadID =
        String(event.threadID);

    const messageID =
        event.messageID;

    const data =
        normalizeData(loadData());

    return safeSend(
        api,
        [
            "✏️ RYUK NICKNAME",
            "",
            `Saved nickname: ${data.nickname}`,
            `Lock: ${
                data.nicknameLock
                    ? "ON"
                    : "OFF"
            }`
        ].join("\n"),
        threadID,
        messageID
    );
}

async function handleGCNameShow(
    api,
    event
) {
    const threadID =
        String(event.threadID);

    const messageID =
        event.messageID;

    const data =
        normalizeData(loadData());

    return safeSend(
        api,
        [
            "🏠 RYUK GC NAME",
            "",
            `Saved GC name: ${data.gcName}`,
            `Lock: ${
                data.gcNameLock
                    ? "ON"
                    : "OFF"
            }`
        ].join("\n"),
        threadID,
        messageID
    );
}

function buildCommandAlias(
    command
) {
    const aliases = {
        replyon: "replyon",
        replyoff: "replyoff",
        reacton: "reacton",
        reactoff: "reactoff",
        nick: "nick",
        nickname: "nick",
        gname: "gname",
        groupname: "gname",
        runtime: "runtime",
        queue: "queue",
        ping: "ping",
        save: "save",
        admins: "admins"
    };

    return (
        aliases[
            String(command || "")
                .toLowerCase()
        ] ||
        String(command || "")
            .toLowerCase()
    );
}

function getNormalizedAction(
    args
) {
    if (
        !Array.isArray(args) ||
        !args.length
    ) {
        return "help";
    }

    return buildCommandAlias(
        args[0]
    );
    }function getCommandDescription(
    command
) {
    const descriptions = {
        on:
            "I-on ang RYUK.",
        off:
            "I-off ang RYUK.",
        lock:
            "I-lock ang nickname at GC name.",
        unlock:
            "I-unlock ang nickname at GC name.",
        unlocknick:
            "I-unlock ang nickname.",
        unlockgc:
            "I-unlock ang GC name.",
        setnick:
            "Mag-set ng nickname at i-apply agad.",
        setgname:
            "Mag-set ng GC name at i-apply agad.",
        nick:
            "Ipakita ang saved nickname.",
        gname:
            "Ipakita ang saved GC name.",
        replyon:
            "I-on ang auto reply.",
        replyoff:
            "I-off ang auto reply.",
        reacton:
            "I-on ang auto reaction.",
        reactoff:
            "I-off ang auto reaction.",
        target:
            "Mag-target ng specific user.",
        untarget:
            "Tanggalin ang current target.",
        targetstatus:
            "Ipakita ang target status.",
        delay:
            "I-set ang reply delay.",
        status:
            "Ipakita ang RYUK status.",
        runtime:
            "Ipakita ang runtime status.",
        queue:
            "Ipakita ang queue status.",
        ping:
            "I-check kung responsive ang bot.",
        save:
            "I-save ang current settings.",
        reset:
            "I-clear ang temporary runtime data.",
        admins:
            "Ipakita ang configured admin IDs.",
        help:
            "Ipakita ang command list."
    };

    return (
        descriptions[
            String(command || "")
                .toLowerCase()
        ] ||
        "Unknown command."
    );
}

function buildCommandList() {
    const commands = [
        "on",
        "off",
        "lock",
        "unlock",
        "unlocknick",
        "unlockgc",
        "setnick",
        "setgname",
        "nick",
        "gname",
        "replyon",
        "replyoff",
        "reacton",
        "reactoff",
        "target",
        "untarget",
        "targetstatus",
        "delay",
        "status",
        "runtime",
        "queue",
        "ping",
        "save",
        "reset",
        "admins",
        "help"
    ];

    return commands.map(
        (command) => {
            return (
                `/${"ryuk"} ` +
                `${command} ` +
                `- ` +
                getCommandDescription(
                    command
                )
            );
        }
    );
}

function buildDetailedHelp() {
    return [
        "👑 RYUK COMMAND CENTER",
        "",
        ...buildCommandList(),
        "",
        "SET NICK:",
        "/ryuk setnick NAME",
        "",
        "SET GC NAME:",
        "/ryuk setgname NAME",
        "",
        "TARGET:",
        "/ryuk target USER_ID",
        "",
        "DELAY:",
        "/ryuk delay 2000",
        "",
        "LOCK:",
        "/ryuk lock",
        "",
        "UNLOCK:",
        "/ryuk unlock",
        "",
        "STATUS:",
        "/ryuk status"
    ].join("\n");
}

function isMessageFromBot(
    api,
    event
) {
    const senderID =
        event &&
        event.senderID
            ? String(
                event.senderID
            )
            : "";

    const botID =
        getSafeBotID(api);

    if (
        senderID &&
        botID &&
        senderID === botID
    ) {
        return true;
    }

    return false;
}

function isCommandMessage(
    event
) {
    if (
        !event ||
        typeof event.body !==
            "string"
    ) {
        return false;
    }

    return (
        event.body
            .trim()
            .toLowerCase()
            .startsWith(
                "/ryuk"
            )
    );
}

function extractMessageText(
    event
) {
    if (
        !event ||
        typeof event.body !==
            "string"
    ) {
        return "";
    }

    return event.body
        .replace(
            /\s+/g,
            " "
        )
        .trim();
    }function splitCommandText(
    body
) {
    const text =
        String(body || "")
            .trim();

    if (!text) {
        return [];
    }

    return text
        .split(/\s+/)
        .filter(Boolean);
}

function extractRyukArgs(
    body
) {
    const parts =
        splitCommandText(
            body
        );

    if (!parts.length) {
        return [];
    }

    const first =
        String(
            parts[0]
        )
        .toLowerCase();

    if (
        first !== "/ryuk" &&
        first !== "ryuk"
    ) {
        return [];
    }

    return parts.slice(1);
}

function isValidNickname(
    nickname
) {
    const value =
        String(
            nickname || ""
        ).trim();

    if (!value) {
        return false;
    }

    if (
        value.length < 1 ||
        value.length > 80
    ) {
        return false;
    }

    return true;
}

function isValidGCName(
    name
) {
    const value =
        String(
            name || ""
        ).trim();

    if (!value) {
        return false;
    }

    if (
        value.length < 1 ||
        value.length > 100
    ) {
        return false;
    }

    return true;
}

function isValidTargetID(
    userID
) {
    const value =
        String(
            userID || ""
        ).trim();

    return /^\d{5,30}$/.test(
        value
    );
}

function sanitizeDisplayText(
    value,
    fallback
) {
    const text =
        String(
            value || ""
        )
        .replace(
            /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
            ""
        )
        .trim();

    return text || fallback;
}

function createSettingLine(
    label,
    value
) {
    return (
        `${label}: ` +
        `${value}`
    );
}

function boolText(
    value
) {
    return value
        ? "ON"
        : "OFF";
}

function getThreadDataSnapshot(
    threadID
) {
    const data =
        normalizeData(
            loadData()
        );

    return {
        threadID:
            String(
                threadID || ""
            ),
        active:
            Boolean(
                data.active
            ),
        autoReply:
            Boolean(
                data.autoReply
            ),
        autoReact:
            Boolean(
                data.autoReact
            ),
        nicknameLock:
            Boolean(
                data.nicknameLock
            ),
        gcNameLock:
            Boolean(
                data.gcNameLock
            ),
        nickname:
            String(
                data.nickname
            ),
        gcName:
            String(
                data.gcName
            ),
        target:
            getTarget(
                String(
                    threadID || ""
                )
            )
    };
}

function buildCompactStatus(
    threadID
) {
    const state =
        getThreadDataSnapshot(
            threadID
        );

    return [
        "👑 RYUK STATUS",
        "",
        createSettingLine(
            "Active",
            boolText(
                state.active
            )
        ),
        createSettingLine(
            "Auto Reply",
            boolText(
                state.autoReply
            )
        ),
        createSettingLine(
            "Auto React",
            boolText(
                state.autoReact
            )
        ),
        createSettingLine(
            "Nick Lock",
            boolText(
                state.nicknameLock
            )
        ),
        createSettingLine(
            "GC Lock",
            boolText(
                state.gcNameLock
            )
        ),
        createSettingLine(
            "Target",
            state.target ||
                "NONE"
        )
    ].join("\n");
    }function getSafeThreadID(
    event
) {
    if (
        !event ||
        event.threadID ===
            undefined ||
        event.threadID ===
            null
    ) {
        return "";
    }

    return String(
        event.threadID
    ).trim();
}

function getSafeSenderID(
    event
) {
    if (
        !event ||
        event.senderID ===
            undefined ||
        event.senderID ===
            null
    ) {
        return "";
    }

    return String(
        event.senderID
    ).trim();
}

function getSafeMessageID(
    event
) {
    if (
        !event ||
        event.messageID ===
            undefined ||
        event.messageID ===
            null
    ) {
        return "";
    }

    return String(
        event.messageID
    ).trim();
}

function ensureThreadRuntime(
    threadID
) {
    const id =
        String(
            threadID || ""
        ).trim();

    if (!id) {
        return null;
    }

    if (
        !NICKNAME_QUEUE.has(id)
    ) {
        NICKNAME_QUEUE.set(
            id,
            []
        );
    }

    if (
        !REPLY_COOLDOWNS.has(id)
    ) {
        REPLY_COOLDOWNS.set(
            id,
            0
        );
    }

    if (
        !REACTION_COOLDOWNS.has(id)
    ) {
        REACTION_COOLDOWNS.set(
            id,
            0
        );
    }

    if (
        !GCNAME_COOLDOWNS.has(id)
    ) {
        GCNAME_COOLDOWNS.set(
            id,
            0
        );
    }

    return id;
}

function pushNicknameTask(
    threadID,
    userID,
    nickname
) {
    const id =
        ensureThreadRuntime(
            threadID
        );

    if (!id) {
        return false;
    }

    const uid =
        String(
            userID || ""
        ).trim();

    const name =
        String(
            nickname || ""
        ).trim();

    if (
        !uid ||
        !name
    ) {
        return false;
    }

    const queue =
        NICKNAME_QUEUE.get(
            id
        ) || [];

    if (
        queue.length >=
        MAX_QUEUE
    ) {
        return false;
    }

    const duplicate =
        queue.some(
            (item) =>
                item &&
                String(
                    item.userID
                ) === uid
        );

    if (duplicate) {
        return false;
    }

    queue.push({
        userID: uid,
        nickname: name,
        createdAt:
            Date.now()
    });

    NICKNAME_QUEUE.set(
        id,
        queue
    );

    return true;
}

function getPendingNicknameTasks(
    threadID
) {
    const id =
        String(
            threadID || ""
        ).trim();

    if (!id) {
        return [];
    }

    const queue =
        NICKNAME_QUEUE.get(
            id
        );

    if (
        !Array.isArray(queue)
    ) {
        return [];
    }

    return queue.slice();
}

function removeNicknameTask(
    threadID,
    userID
) {
    const id =
        String(
            threadID || ""
        ).trim();

    const uid =
        String(
            userID || ""
        ).trim();

    if (
        !id ||
        !uid
    ) {
        return false;
    }

    const queue =
        NICKNAME_QUEUE.get(
            id
        );

    if (
        !Array.isArray(queue)
    ) {
        return false;
    }

    const filtered =
        queue.filter(
            (item) =>
                !item ||
                String(
                    item.userID
                ) !== uid
        );

    NICKNAME_QUEUE.set(
        id,
        filtered
    );

    return true;
        }function hasPendingNicknameTask(
    threadID,
    userID
) {
    const id =
        String(
            threadID || ""
        ).trim();

    const uid =
        String(
            userID || ""
        ).trim();

    if (
        !id ||
        !uid
    ) {
        return false;
    }

    const queue =
        NICKNAME_QUEUE.get(
            id
        );

    if (
        !Array.isArray(queue)
    ) {
        return false;
    }

    return queue.some(
        (item) =>
            item &&
            String(
                item.userID
            ) === uid
    );
}

function clearNicknameTasks(
    threadID
) {
    const id =
        String(
            threadID || ""
        ).trim();

    if (!id) {
        return false;
    }

    NICKNAME_QUEUE.set(
        id,
        []
    );

    return true;
}

function getNicknameTaskCount(
    threadID
) {
    const id =
        String(
            threadID || ""
        ).trim();

    if (!id) {
        return 0;
    }

    const queue =
        NICKNAME_QUEUE.get(
            id
        );

    if (
        !Array.isArray(queue)
    ) {
        return 0;
    }

    return queue.length;
}

function isWorkerRunning(
    threadID
) {
    const id =
        String(
            threadID || ""
        ).trim();

    if (!id) {
        return false;
    }

    return ACTIVE_WORKERS.has(
        id
    );
}

function markWorkerStarted(
    threadID
) {
    const id =
        String(
            threadID || ""
        ).trim();

    if (!id) {
        return false;
    }

    ACTIVE_WORKERS.add(
        id
    );

    return true;
}

function markWorkerStopped(
    threadID
) {
    const id =
        String(
            threadID || ""
        ).trim();

    if (!id) {
        return false;
    }

    ACTIVE_WORKERS.delete(
        id
    );

    return true;
}

function getWorkerCount() {
    return ACTIVE_WORKERS.size;
}

function getSeenMessageCount() {
    return SEEN_MESSAGES.size;
}

function getTargetCount() {
    return TARGET_USERS.size;
}

function getRuntimeCounts() {
    return {
        workers:
            getWorkerCount(),
        seenMessages:
            getSeenMessageCount(),
        targets:
            getTargetCount()
    };
    }function getDataSummary(
    data
) {
    const safe =
        normalizeData(
            data
        );

    return {
        active:
            Boolean(
                safe.active
            ),

        autoReply:
            Boolean(
                safe.autoReply
            ),

        autoReact:
            Boolean(
                safe.autoReact
            ),

        nicknameLock:
            Boolean(
                safe.nicknameLock
            ),

        gcNameLock:
            Boolean(
                safe.gcNameLock
            ),

        nickname:
            String(
                safe.nickname
            ),

        gcName:
            String(
                safe.gcName
            ),

        replyDelay:
            Number(
                safe.replyDelay
            ),

        reactionDelay:
            Number(
                safe.reactionDelay
            ),

        totalReplies:
            Number(
                safe.totalReplies
            ) || 0,

        totalReactions:
            Number(
                safe.totalReactions
            ) || 0,

        totalNicknames:
            Number(
                safe.totalNicknames
            ) || 0,

        totalGCNames:
            Number(
                safe.totalGCNames
            ) || 0,

        totalCommands:
            Number(
                safe.totalCommands
            ) || 0,

        totalErrors:
            Number(
                safe.totalErrors
            ) || 0
    };
}

function buildStatisticsText(
    data
) {
    const stats =
        getDataSummary(
            data
        );

    return [
        "📊 RYUK STATISTICS",
        "",
        `Replies: ${stats.totalReplies}`,
        `Reactions: ${stats.totalReactions}`,
        `Nicknames: ${stats.totalNicknames}`,
        `GC Names: ${stats.totalGCNames}`,
        `Commands: ${stats.totalCommands}`,
        `Errors: ${stats.totalErrors}`,
        "",
        `Workers: ${getWorkerCount()}`,
        `Seen Messages: ${getSeenMessageCount()}`,
        `Targets: ${getTargetCount()}`
    ].join("\n");
}

async function handleStats(
    api,
    event
) {
    const threadID =
        getSafeThreadID(
            event
        );

    const messageID =
        getSafeMessageID(
            event
        );

    if (!threadID) {
        return false;
    }

    const data =
        normalizeData(
            loadData()
        );

    return safeSend(
        api,
        buildStatisticsText(
            data
        ),
        threadID,
        messageID
    );
}

function isLockCommand(
    action
) {
    const value =
        String(
            action || ""
        )
        .toLowerCase()
        .trim();

    return (
        value === "lock" ||
        value === "unlock" ||
        value === "unlocknick" ||
        value === "unlockgc"
    );
}

function isToggleCommand(
    action
) {
    const value =
        String(
            action || ""
        )
        .toLowerCase()
        .trim();

    return (
        value === "on" ||
        value === "off" ||
        value === "replyon" ||
        value === "replyoff" ||
        value === "reacton" ||
        value === "reactoff"
    );
}

function isInformationCommand(
    action
) {
    const value =
        String(
            action || ""
        )
        .toLowerCase()
        .trim();

    return [
        "help",
        "status",
        "runtime",
        "queue",
        "ping",
        "admins",
        "nick",
        "gname",
        "stats",
        "targetstatus"
    ].includes(
        value
    );
    }function isConfigurationCommand(
    action
) {
    const value =
        String(
            action || ""
        )
        .toLowerCase()
        .trim();

    return [
        "setnick",
        "setgname",
        "delay",
        "target",
        "untarget"
    ].includes(
        value
    );
}

function isMaintenanceCommand(
    action
) {
    const value =
        String(
            action || ""
        )
        .toLowerCase()
        .trim();

    return [
        "save",
        "reset"
    ].includes(
        value
    );
}

function getCommandCategory(
    action
) {
    if (
        isLockCommand(
            action
        )
    ) {
        return "LOCK";
    }

    if (
        isToggleCommand(
            action
        )
    ) {
        return "TOGGLE";
    }

    if (
        isInformationCommand(
            action
        )
    ) {
        return "INFO";
    }

    if (
        isConfigurationCommand(
            action
        )
    ) {
        return "CONFIG";
    }

    if (
        isMaintenanceCommand(
            action
        )
    ) {
        return "MAINTENANCE";
    }

    return "UNKNOWN";
}

function canExecuteCommand(
    action
) {
    const category =
        getCommandCategory(
            action
        );

    return (
        category !==
        "UNKNOWN"
    );
}

function getCommandCategoryText(
    action
) {
    const category =
        getCommandCategory(
            action
        );

    return [
        "Command:",
        String(
            action || "unknown"
        ),
        "",
        `Category: ${category}`,
        `Valid: ${
            category !== "UNKNOWN"
                ? "YES"
                : "NO"
        }`
    ].join("\n");
}

function safeNumber(
    value,
    fallback
) {
    const number =
        Number(value);

    if (
        !Number.isFinite(
            number
        )
    ) {
        return fallback;
    }

    return number;
}

function safeBoolean(
    value,
    fallback
) {
    if (
        typeof value ===
        "boolean"
    ) {
        return value;
    }

    if (
        value === "true" ||
        value === "1" ||
        value === 1
    ) {
        return true;
    }

    if (
        value === "false" ||
        value === "0" ||
        value === 0
    ) {
        return false;
    }

    return fallback;
}

function safeString(
    value,
    fallback
) {
    if (
        value === undefined ||
        value === null
    ) {
        return fallback;
    }

    const text =
        String(value)
            .trim();

    return text ||
        fallback;
}

function getCurrentTimestamp() {
    return Date.now();
}

function getUptimeSeconds() {
    if (
        !STARTUP_STATE ||
        !STARTUP_STATE.startedAt
    ) {
        return 0;
    }

    return Math.max(
        0,
        Math.floor(
            (
                Date.now() -
                STARTUP_STATE.startedAt
            ) / 1000
        )
    );
}function formatUptime(
    seconds
) {
    const total =
        Math.max(
            0,
            Number(seconds) || 0
        );

    const days =
        Math.floor(
            total / 86400
        );

    const hours =
        Math.floor(
            (total % 86400) / 3600
        );

    const minutes =
        Math.floor(
            (total % 3600) / 60
        );

    const secs =
        Math.floor(
            total % 60
        );

    return [
        days
            ? `${days}d`
            : "",
        hours
            ? `${hours}h`
            : "",
        minutes
            ? `${minutes}m`
            : "",
        `${secs}s`
    ]
        .filter(Boolean)
        .join(" ");
}

function getStartupStatus() {
    return {
        ready:
            Boolean(
                STARTUP_STATE.ready
            ),

        startedAt:
            Number(
                STARTUP_STATE.startedAt
            ) || 0,

        lastSave:
            Number(
                STARTUP_STATE.lastSave
            ) || 0,

        lastCleanup:
            Number(
                STARTUP_STATE.lastCleanup
            ) || 0,

        uptime:
            getUptimeSeconds()
    };
}

function buildStartupText() {
    const status =
        getStartupStatus();

    return [
        "⚙️ RYUK RUNTIME",
        "",
        `Ready: ${
            status.ready
                ? "YES"
                : "NO"
        }`,
        `Uptime: ${
            formatUptime(
                status.uptime
            )
        }`,
        `Workers: ${
            getWorkerCount()
        }`,
        `Queues: ${
            NICKNAME_QUEUE.size
        }`,
        `Seen: ${
            SEEN_MESSAGES.size
        }`
    ].join("\n");
}

function normalizeCommand(
    action
) {
    return String(
        action || ""
    )
        .trim()
        .toLowerCase();
}

function commandEquals(
    action,
    expected
) {
    return (
        normalizeCommand(
            action
        ) ===
        normalizeCommand(
            expected
        )
    );
}

function commandInList(
    action,
    list
) {
    if (
        !Array.isArray(
            list
        )
    ) {
        return false;
    }

    const normalized =
        normalizeCommand(
            action
        );

    return list.some(
        (item) =>
            normalizeCommand(
                item
            ) === normalized
    );
}

function getCommandArgumentText(
    args,
    startIndex
) {
    if (
        !Array.isArray(
            args
        )
    ) {
        return "";
    }

    const index =
        Number.isInteger(
            startIndex
        )
            ? startIndex
            : 0;

    return args
        .slice(index)
        .join(" ")
        .trim();
}

function hasCommandArguments(
    args,
    minimum
) {
    if (
        !Array.isArray(
            args
        )
    ) {
        return false;
    }

    return (
        args.length >=
        Number(minimum || 1)
    );
        }function createCommandResult(
    success,
    message,
    extra
) {
    return {
        success:
            Boolean(success),

        message:
            String(
                message || ""
            ),

        extra:
            extra &&
            typeof extra ===
                "object"
                ? extra
                : {}
    };
}

function createSuccessResult(
    message,
    extra
) {
    return createCommandResult(
        true,
        message,
        extra
    );
}

function createFailureResult(
    message,
    extra
) {
    return createCommandResult(
        false,
        message,
        extra
    );
}

function isResultSuccessful(
    result
) {
    return Boolean(
        result &&
        result.success
    );
}

function getResultMessage(
    result,
    fallback
) {
    if (
        result &&
        typeof result.message ===
            "string" &&
        result.message.trim()
    ) {
        return result.message
            .trim();
    }

    return String(
        fallback || ""
    );
}

function createErrorResult(
    error,
    fallback
) {
    const message =
        error &&
        error.message
            ? error.message
            : fallback ||
              "Unknown error.";

    return createFailureResult(
        message
    );
}

function recordRuntimeError(
    error,
    context
) {
    try {
        incrementErrorCount();

        console.error(
            "[ryuk]",
            context ||
                "runtime error",
            error &&
            error.message
                ? error.message
                : error
        );
    } catch {
        console.error(
            "[ryuk] runtime error"
        );
    }
}

function isPromiseLike(
    value
) {
    return Boolean(
        value &&
        typeof value.then ===
            "function"
    );
}

async function resolveSafely(
    operation,
    fallback
) {
    try {
        if (
            typeof operation !==
            "function"
        ) {
            return fallback;
        }

        const result =
            operation();

        if (
            isPromiseLike(
                result
            )
        ) {
            return await result;
        }

        return result;
    } catch (error) {
        recordRuntimeError(
            error,
            "resolveSafely"
        );

        return fallback;
    }
}

function delayExecution(
    milliseconds
) {
    const duration =
        Math.max(
            0,
            Number(
                milliseconds
            ) || 0
        );

    return new Promise(
        (resolve) => {
            setTimeout(
                resolve,
                duration
            );
        }
    );
        }function getRandomInteger(
    minimum,
    maximum
) {
    const min =
        Math.ceil(
            Number(minimum) || 0
        );

    const max =
        Math.floor(
            Number(maximum) || min
        );

    if (max <= min) {
        return min;
    }

    return (
        Math.floor(
            Math.random() *
            (max - min + 1)
        ) + min
    );
}

function getRandomItem(
    items,
    fallback
) {
    if (
        !Array.isArray(items) ||
        !items.length
    ) {
        return fallback;
    }

    const index =
        getRandomInteger(
            0,
            items.length - 1
        );

    return (
        items[index] !== undefined
            ? items[index]
            : fallback
    );
}

function getRandomReply() {
    return getRandomItem(
        REPLY_LINES,
        "👑 RYUK POGI ON TOP."
    );
}

function getRandomReaction() {
    return getRandomItem(
        REACTIONS,
        "🔥"
    );
}

function buildAutoReply(
    senderID,
    text
) {
    const sender =
        String(
            senderID || ""
        ).trim();

    const message =
        String(
            text || ""
        ).trim();

    const reply =
        getRandomReply();

    if (
        sender &&
        message
    ) {
        return [
            "👑 [RYUK]",
            "",
            reply
        ].join("\n");
    }

    return [
        "👑 [RYUK]",
        "",
        reply
    ].join("\n");
}

function shouldReplyToMessage(
    data,
    threadID,
    senderID
) {
    if (!data.active) {
        return false;
    }

    if (!data.autoReply) {
        return false;
    }

    if (
        !threadID ||
        !senderID
    ) {
        return false;
    }

    return shouldTargetUser(
        threadID,
        senderID
    );
}

function shouldReactToMessage(
    data,
    threadID,
    senderID
) {
    if (!data.active) {
        return false;
    }

    if (!data.autoReact) {
        return false;
    }

    if (
        !threadID ||
        !senderID
    ) {
        return false;
    }

    return shouldTargetUser(
        threadID,
        senderID
    );
}

function getMessageCooldownKey(
    threadID,
    senderID
) {
    return [
        String(
            threadID || ""
        ),
        String(
            senderID || ""
        )
    ].join(":");
}

function canAutoReply(
    threadID,
    senderID,
    delay
) {
    const key =
        getMessageCooldownKey(
            threadID,
            senderID
        );

    return canUseCooldown(
        REPLY_COOLDOWNS,
        key,
        Math.max(
            500,
            Number(delay) || 2000
        )
    );
}

function canAutoReact(
    threadID,
    senderID,
    delay
) {
    const key =
        getMessageCooldownKey(
            threadID,
            senderID
        );

    return canUseCooldown(
        REACTION_COOLDOWNS,
        key,
        Math.max(
            500,
            Number(delay) || 1500
        )
    );
        }function createReplyTask(
    api,
    event,
    data
) {
    return {
        api,
        threadID:
            getSafeThreadID(event),
        senderID:
            getSafeSenderID(event),
        messageID:
            getSafeMessageID(event),
        body:
            extractMessageText(event),
        delay:
            Math.max(
                500,
                Number(
                    data.replyDelay
                ) || 2000
            ),
        createdAt:
            Date.now()
    };
}

async function executeReplyTask(
    task
) {
    if (
        !task ||
        !task.api ||
        !task.threadID
    ) {
        return false;
    }

    try {
        await delayExecution(
            task.delay
        );

        const data =
            normalizeData(
                loadData()
            );

        if (
            !data.active ||
            !data.autoReply
        ) {
            return false;
        }

        if (
            !shouldTargetUser(
                task.threadID,
                task.senderID
            )
        ) {
            return false;
        }

        const reply =
            buildAutoReply(
                task.senderID,
                task.body
            );

        const sent =
            await safeSend(
                task.api,
                reply,
                task.threadID,
                task.messageID
            );

        if (sent) {
            incrementReplyCount();
        }

        return sent;
    } catch (error) {
        recordRuntimeError(
            error,
            "reply task"
        );

        return false;
    }
}

const REPLY_QUEUE =
    new Map();

const REPLY_WORKERS =
    new Set();

function queueReplyTask(
    task
) {
    if (
        !task ||
        !task.threadID
    ) {
        return false;
    }

    const id =
        String(
            task.threadID
        );

    let queue =
        REPLY_QUEUE.get(id);

    if (
        !Array.isArray(queue)
    ) {
        queue = [];
        REPLY_QUEUE.set(
            id,
            queue
        );
    }

    if (
        queue.length >= 20
    ) {
        return false;
    }

    queue.push(task);

    processReplyQueueSafe(
        task.api,
        id
    );

    return true;
}

async function processReplyQueueSafe(
    api,
    threadID
) {
    if (
        REPLY_WORKERS.has(
            threadID
        )
    ) {
        return;
    }

    REPLY_WORKERS.add(
        threadID
    );

    try {
        while (true) {
            const queue =
                REPLY_QUEUE.get(
                    threadID
                );

            if (
                !Array.isArray(queue) ||
                !queue.length
            ) {
                break;
            }

            const task =
                queue.shift();

            await executeReplyTask(
                task
            );
        }
    } catch (error) {
        recordRuntimeError(
            error,
            "reply queue"
        );
    } finally {
        REPLY_WORKERS.delete(
            threadID
        );
    }
}

function clearReplyQueue(
    threadID
) {
    const id =
        String(
            threadID || ""
        );

    REPLY_QUEUE.delete(id);
    REPLY_WORKERS.delete(id);
    }function createReactionTask(api, event, data) {
    return {
        api,
        threadID: getSafeThreadID(event),
        senderID: getSafeSenderID(event),
        messageID: getSafeMessageID(event),
        reaction: getRandomReaction(),
        delay: Math.max(
            500,
            Number(data.reactionDelay) || 1500
        )
    };
}

async function executeReactionTask(task) {
    if (
        !task ||
        !task.api ||
        !task.threadID ||
        !task.messageID
    ) {
        return false;
    }

    try {
        await delayExecution(task.delay);

        const data =
            normalizeData(loadData());

        if (!data.active || !data.autoReact) {
            return false;
        }

        if (
            !shouldTargetUser(
                task.threadID,
                task.senderID
            )
        ) {
            return false;
        }

        const success =
            await safeReaction(
                task.api,
                task.reaction,
                task.messageID
            );

        if (success) {
            incrementReactionCount();
        }

        return success;
    } catch (error) {
        recordRuntimeError(
            error,
            "reaction task"
        );
        return false;
    }
}

const REACTION_QUEUE = new Map();
const REACTION_WORKERS = new Set();

function queueReactionTask(task) {
    if (!task || !task.threadID) {
        return false;
    }

    const id = String(task.threadID);
    let queue = REACTION_QUEUE.get(id);

    if (!Array.isArray(queue)) {
        queue = [];
        REACTION_QUEUE.set(id, queue);
    }

    if (queue.length >= 20) {
        return false;
    }

    queue.push(task);
    processReactionQueueSafe(task.api, id);

    return true;
}async function processReactionQueueSafe(
    api,
    threadID
) {
    if (
        REACTION_WORKERS.has(
            threadID
        )
    ) {
        return;
    }

    REACTION_WORKERS.add(
        threadID
    );

    try {
        while (true) {
            const queue =
                REACTION_QUEUE.get(
                    threadID
                );

            if (
                !Array.isArray(queue) ||
                !queue.length
            ) {
                break;
            }

            const task =
                queue.shift();

            await executeReactionTask(
                task
            );
        }
    } catch (error) {
        recordRuntimeError(
            error,
            "reaction queue"
        );
    } finally {
        REACTION_WORKERS.delete(
            threadID
        );
    }
}

function clearReactionQueue(
    threadID
) {
    const id =
        String(
            threadID || ""
        );

    if (!id) {
        return false;
    }

    REACTION_QUEUE.delete(
        id
    );

    REACTION_WORKERS.delete(
        id
    );

    return true;
}

function getReactionQueueSize(
    threadID
) {
    const id =
        String(
            threadID || ""
        );

    const queue =
        REACTION_QUEUE.get(
            id
        );

    if (
        !Array.isArray(queue)
    ) {
        return 0;
    }

    return queue.length;
}

function clearAllReactionQueues() {
    REACTION_QUEUE.clear();
    REACTION_WORKERS.clear();
}

function getTotalReactionQueues() {
    return REACTION_QUEUE.size;
            }function getAllRuntimeQueueSizes(
    threadID
) {
    const id =
        String(
            threadID || ""
        );

    return {
        nickname:
            getNicknameTaskCount(id),

        reply:
            REPLY_QUEUE.has(id)
                ? REPLY_QUEUE.get(id).length
                : 0,

        reaction:
            getReactionQueueSize(id)
    };
}

function buildQueueStatusText(
    threadID
) {
    const queues =
        getAllRuntimeQueueSizes(
            threadID
        );

    return [
        "📦 RYUK QUEUE STATUS",
        "",
        `Nickname: ${queues.nickname}`,
        `Reply: ${queues.reply}`,
        `Reaction: ${queues.reaction}`,
        "",
        `Workers: ${getWorkerCount()}`,
        `Reaction Workers: ${
            REACTION_WORKERS.size
        }`
    ].join("\n");
}

async function handleQueueStatus(
    api,
    event
) {
    const threadID =
        getSafeThreadID(event);

    const messageID =
        getSafeMessageID(event);

    if (!threadID) {
        return false;
    }

    return safeSend(
        api,
        buildQueueStatusText(
            threadID
        ),
        threadID,
        messageID
    );
}

function clearAllThreadQueues(
    threadID
) {
    const id =
        String(
            threadID || ""
        );

    if (!id) {
        return false;
    }

    clearNicknameTasks(id);
    clearReplyQueue(id);
    clearReactionQueue(id);

    return true;
            }function getThreadQueueSummary(
    threadID
) {
    const id =
        String(
            threadID || ""
        );

    const nickname =
        getNicknameTaskCount(id);

    const replyQueue =
        REPLY_QUEUE.get(id);

    const reactionQueue =
        REACTION_QUEUE.get(id);

    return {
        nickname,
        reply:
            Array.isArray(replyQueue)
                ? replyQueue.length
                : 0,
        reaction:
            Array.isArray(reactionQueue)
                ? reactionQueue.length
                : 0
    };
}

function isThreadBusy(
    threadID
) {
    const id =
        String(
            threadID || ""
        );

    if (!id) {
        return false;
    }

    const queues =
        getThreadQueueSummary(id);

    return (
        queues.nickname > 0 ||
        queues.reply > 0 ||
        queues.reaction > 0 ||
        REPLY_WORKERS.has(id) ||
        REACTION_WORKERS.has(id)
    );
}

function getThreadActivityText(
    threadID
) {
    const id =
        String(
            threadID || ""
        );

    const queues =
        getThreadQueueSummary(id);

    return [
        `Thread: ${id}`,
        `Nickname Queue: ${queues.nickname}`,
        `Reply Queue: ${queues.reply}`,
        `Reaction Queue: ${queues.reaction}`,
        `Busy: ${
            isThreadBusy(id)
                ? "YES"
                : "NO"
        }`
    ].join("\n");
                           }function getDataFileSize() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return 0;
        }

        return fs.statSync(
            DATA_FILE
        ).size;
    } catch (error) {
        recordRuntimeError(
            error,
            "data file size"
        );

        return 0;
    }
}

function getBackupFileSize() {
    try {
        if (!fs.existsSync(BACKUP_FILE)) {
            return 0;
        }

        return fs.statSync(
            BACKUP_FILE
        ).size;
    } catch (error) {
        recordRuntimeError(
            error,
            "backup file size"
        );

        return 0;
    }
}

function buildStorageStatus() {
    return [
        "💾 RYUK STORAGE",
        "",
        `Data: ${getDataFileSize()} bytes`,
        `Backup: ${getBackupFileSize()} bytes`,
        `Data File: ${
            fs.existsSync(DATA_FILE)
                ? "OK"
                : "MISSING"
        }`,
        `Backup File: ${
            fs.existsSync(BACKUP_FILE)
                ? "OK"
                : "MISSING"
        }`
    ].join("\n");
}

async function handleStorageStatus(
    api,
    event
) {
    const threadID =
        getSafeThreadID(event);

    const messageID =
        getSafeMessageID(event);

    if (!threadID) {
        return false;
    }

    return safeSend(
        api,
        buildStorageStatus(),
        threadID,
        messageID
    );
    }function getSafeErrorText(error) {
    if (!error) {
        return "Unknown error";
    }

    if (typeof error === "string") {
        return error.slice(0, 300);
    }

    if (error.message) {
        return String(
            error.message
        ).slice(0, 300);
    }

    return "Unknown error";
}

function logRyukError(
    context,
    error
) {
    const text =
        getSafeErrorText(error);

    console.error(
        `[RYUK] ${context}: ${text}`
    );
}

function recordRuntimeError(
    error,
    context
) {
    try {
        const data =
            normalizeData(
                loadData()
            );

        data.errorCount =
            Number(
                data.errorCount || 0
            ) + 1;

        data.lastError =
            `${context}: ${getSafeErrorText(error)}`;

        data.updatedAt =
            Date.now();

        saveData(data);

        logRyukError(
            context,
            error
        );
    } catch (saveError) {
        logRyukError(
            "runtime error",
            saveError
        );
    }
}

function safeLog(
    message
) {
    try {
        console.log(
            `[RYUK] ${String(message)}`
        );
    } catch (error) {
        return false;
    }

    return true;
    }function isValidReplyDelay(
    value
) {
    const delay =
        Number(value);

    return (
        Number.isFinite(delay) &&
        delay >= 500 &&
        delay <= 60000
    );
}

function isValidReactionDelay(
    value
) {
    const delay =
        Number(value);

    return (
        Number.isFinite(delay) &&
        delay >= 500 &&
        delay <= 60000
    );
}

function setReplyDelay(
    value
) {
    if (
        !isValidReplyDelay(
            value
        )
    ) {
        return false;
    }

    const data =
        normalizeData(
            loadData()
        );

    data.replyDelay =
        Number(value);

    data.updatedAt =
        Date.now();

    return saveData(data);
}

function setReactionDelay(
    value
) {
    if (
        !isValidReactionDelay(
            value
        )
    ) {
        return false;
    }

    const data =
        normalizeData(
            loadData()
        );

    data.reactionDelay =
        Number(value);

    data.updatedAt =
        Date.now();

    return saveData(data);
}

function getDelaySettings() {
    const data =
        normalizeData(
            loadData()
        );

    return {
        reply:
            Number(
                data.replyDelay
            ),

        reaction:
            Number(
                data.reactionDelay
            )
    };
}function buildDelayStatus() {
    const delays =
        getDelaySettings();

    return [
        "⏱️ RYUK DELAY",
        "",
        `Auto Reply: ${delays.reply}ms`,
        `Auto React: ${delays.reaction}ms`,
        "",
        "Allowed: 500ms - 60000ms"
    ].join("\n");
}

async function handleDelayStatus(
    api,
    event
) {
    const threadID =
        getSafeThreadID(event);

    const messageID =
        getSafeMessageID(event);

    if (!threadID) {
        return false;
    }

    return safeSend(
        api,
        buildDelayStatus(),
        threadID,
        messageID
    );
}

function parseDelayValue(
    value
) {
    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    const number =
        Number(
            String(value)
                .trim()
        );

    if (
        !Number.isFinite(number)
    ) {
        return null;
    }

    return number;
}

function formatDelay(
    value
) {
    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "N/A";
    }

    return `${number}ms`;
    }function buildAutoReply(
    senderID,
    message
) {
    const text =
        String(
            message || ""
        )
        .trim()
        .toLowerCase();

    const replies = [
        "👁️ RYUK: Nakita ko yan.",
        "🖤 RYUK: Ano bang trip mo?",
        "💀 RYUK: Tahimik lang ako pero active.",
        "🔥 RYUK: Sige, narinig kita.",
        "😈 RYUK: May sagot ako diyan.",
        "👑 RYUK: Present.",
        "🤣 RYUK: Grabe ka naman.",
        "⚡ RYUK: Ayan na nga.",
        "🥷 RYUK: Relax lang.",
        "💀 RYUK: Huwag kang kabahan.",
        "🔥 RYUK: Continue mo lang.",
        "😆 RYUK: Gets ko na.",
        "🤡 RYUK: Interesting yan.",
        "👀 RYUK: Binasa ko.",
        "🛡️ RYUK: Nandito lang ako."
    ];

    if (
        text.includes("ryuk")
    ) {
        return (
            "💀 RYUK: Tinawag mo ako?"
        );
    }

    if (
        text.includes("hello") ||
        text.includes("hi")
    ) {
        return (
            "👋 RYUK: Hello rin!"
        );
    }

    if (
        text.includes("kamusta") ||
        text.includes("kumusta")
    ) {
        return (
            "🔥 RYUK: Ayos lang. Ikaw?"
        );
    }

    const index =
        Math.floor(
            Math.random() *
            replies.length
        );

    return replies[index];
}

function getRandomReplyLine() {
    const replies =
        Array.isArray(REPLY_LINES)
            ? REPLY_LINES
            : [];

    if (!replies.length) {
        return "💀 RYUK: Present.";
    }

    const index =
        Math.floor(
            Math.random() *
            replies.length
        );

    return replies[index];
        }function getRandomReaction() {
    const list =
        Array.isArray(REACTIONS)
            ? REACTIONS
            : ["👍"];

    if (!list.length) {
        return "👍";
    }

    const index =
        Math.floor(
            Math.random() *
            list.length
        );

    return list[index];
}

function isReactionAllowed(
    threadID
) {
    const data =
        normalizeData(
            loadData()
        );

    if (!data.active) {
        return false;
    }

    if (!data.autoReact) {
        return false;
    }

    if (!threadID) {
        return false;
    }

    return true;
}

function isReplyAllowed(
    threadID
) {
    const data =
        normalizeData(
            loadData()
        );

    if (!data.active) {
        return false;
    }

    if (!data.autoReply) {
        return false;
    }

    if (!threadID) {
        return false;
    }

    return true;
}

function canProcessMessage(
    event
) {
    if (!event) {
        return false;
    }

    const threadID =
        getSafeThreadID(event);

    const messageID =
        getSafeMessageID(event);

    if (!threadID) {
        return false;
    }

    if (!messageID) {
        return false;
    }

    if (
        rememberMessage(
            messageID
        )
    ) {
        return false;
    }

    return true;
}function buildTargetStatus(
    threadID
) {
    const target =
        getTarget(
            threadID
        );

    if (!target) {
        return [
            "🎯 RYUK TARGET",
            "",
            "Status: OFF",
            "Target: NONE"
        ].join("\n");
    }

    return [
        "🎯 RYUK TARGET",
        "",
        "Status: ON",
        `Target: ${target}`,
        "",
        "Auto-reply and auto-react",
        "will follow the target."
    ].join("\n");
}

async function handleTargetStatusMessage(
    api,
    event
) {
    const threadID =
        getSafeThreadID(event);

    const messageID =
        getSafeMessageID(event);

    if (!threadID) {
        return false;
    }

    return safeSend(
        api,
        buildTargetStatus(
            threadID
        ),
        threadID,
        messageID
    );
}

function targetMatches(
    threadID,
    senderID
) {
    if (!threadID || !senderID) {
        return false;
    }

    const target =
        getTarget(
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

function clearTargetIfInvalid(
    threadID
) {
    const target =
        getTarget(
            threadID
        );

    if (!target) {
        return false;
    }

    if (
        !isValidUserID(
            target
        )
    ) {
        removeTarget(
            threadID
        );

        return true;
    }

    return false;
}function getLockSettings() {
    const data =
        normalizeData(
            loadData()
        );

    return {
        nicknameLock:
            Boolean(
                data.nicknameLock
            ),

        gcNameLock:
            Boolean(
                data.gcNameLock
            ),

        nickname:
            String(
                data.nickname || ""
            ),

        gcName:
            String(
                data.gcName || ""
            )
    };
}

function buildLockStatus() {
    const lock =
        getLockSettings();

    return [
        "🔒 RYUK LOCK STATUS",
        "",
        `Nickname Lock: ${
            lock.nicknameLock
                ? "ON"
                : "OFF"
        }`,
        `GC Name Lock: ${
            lock.gcNameLock
                ? "ON"
                : "OFF"
        }`,
        "",
        `Nickname: ${
            lock.nickname || "NONE"
        }`,
        `GC Name: ${
            lock.gcName || "NONE"
        }`
    ].join("\n");
}

async function handleLockStatus(
    api,
    event
) {
    const threadID =
        getSafeThreadID(event);

    const messageID =
        getSafeMessageID(event);

    if (!threadID) {
        return false;
    }

    return safeSend(
        api,
        buildLockStatus(),
        threadID,
        messageID
    );
}

function hasNicknameLock() {
    return Boolean(
        getLockSettings()
            .nicknameLock
    );
}

function hasGCNameLock() {
    return Boolean(
        getLockSettings()
            .gcNameLock
    );
        }function shouldRestoreNickname(
    threadID
) {
    const settings =
        getLockSettings();

    if (!settings.nicknameLock) {
        return false;
    }

    if (!settings.nickname) {
        return false;
    }

    if (!threadID) {
        return false;
    }

    return true;
}

function shouldRestoreGCName() {
    const settings =
        getLockSettings();

    if (!settings.gcNameLock) {
        return false;
    }

    if (!settings.gcName) {
        return false;
    }

    return true;
}

async function restoreLockedNickname(
    api,
    threadID,
    userID
) {
    if (
        !shouldRestoreNickname(
            threadID
        )
    ) {
        return false;
    }

    if (
        !userID ||
        !isValidUserID(userID)
    ) {
        return false;
    }

    if (
        !shouldTargetUser(
            threadID,
            userID
        )
    ) {
        return false;
    }

    const settings =
        getLockSettings();

    setRestoreGuard(
        "nick",
        threadID,
        userID
    );

    return safeChangeNickname(
        api,
        settings.nickname,
        threadID,
        userID
    );
}

async function restoreLockedGCName(
    api,
    threadID
) {
    if (
        !shouldRestoreGCName()
    ) {
        return false;
    }

    if (!threadID) {
        return false;
    }

    const settings =
        getLockSettings();

    setRestoreGuard(
        "gname",
        threadID
    );

    return safeSetTitle(
        api,
        settings.gcName,
        threadID
    );
    }function buildNicknameApplyList(
    threadID,
    participantIDs
) {
    const ids =
        Array.isArray(
            participantIDs
        )
            ? participantIDs
            : [];

    const target =
        getTarget(
            threadID
        );

    if (target) {
        return ids.filter(
            id =>
                String(id) ===
                String(target)
        );
    }

    return ids.filter(
        id =>
            isValidUserID(id)
    );
}

async function applySavedNickname(
    api,
    event
) {
    const threadID =
        getSafeThreadID(event);

    if (!threadID) {
        return false;
    }

    const settings =
        getLockSettings();

    if (
        !settings.nicknameLock ||
        !settings.nickname
    ) {
        return false;
    }

    const participants =
        await getParticipantIDs(
            api,
            threadID
        );

    const targets =
        buildNicknameApplyList(
            threadID,
            participants
        );

    if (!targets.length) {
        return false;
    }

    for (const userID of targets) {
        await queueNickname(
            api,
            threadID,
            userID,
            settings.nickname
        );
    }

    return true;
}

async function applySavedGCName(
    api,
    event
) {
    const threadID =
        getSafeThreadID(event);

    if (!threadID) {
        return false;
    }

    return restoreLockedGCName(
        api,
        threadID
    );
                        }async function applySavedLocks(
    api,
    event
) {
    if (!api || !event) {
        return false;
    }

    const threadID =
        getSafeThreadID(event);

    if (!threadID) {
        return false;
    }

    const settings =
        getLockSettings();

    let changed = false;

    if (
        settings.gcNameLock &&
        settings.gcName
    ) {
        const result =
            await applySavedGCName(
                api,
                event
            );

        if (result) {
            changed = true;
        }
    }

    if (
        settings.nicknameLock &&
        settings.nickname
    ) {
        const result =
            await applySavedNickname(
                api,
                event
            );

        if (result) {
            changed = true;
        }
    }

    return changed;
}

function isLockEvent(
    event
) {
    if (!event) {
        return false;
    }

    const type =
        String(
            event.type || ""
        ).toLowerCase();

    return (
        type === "log:user-nickname" ||
        type === "log:thread-name"
    );
}

function getLockEventType(
    event
) {
    if (!event) {
        return "";
    }

    return String(
        event.type || ""
    ).toLowerCase();
    }function getEventNicknameData(
    event
) {
    if (!event) {
        return null;
    }

    return (
        event.logMessageData ||
        event.logMessageData2 ||
        null
    );
}

function getChangedNicknameUser(
    event
) {
    const data =
        getEventNicknameData(
            event
        );

    if (!data) {
        return "";
    }

    return String(
        data.participant_id ||
        data.author ||
        data.user_id ||
        ""
    );
}

function getChangedNickname(
    event
) {
    const data =
        getEventNicknameData(
            event
        );

    if (!data) {
        return "";
    }

    return String(
        data.nickname ||
        ""
    ).trim();
}

function getChangedThreadName(
    event
) {
    const data =
        getEventNicknameData(
            event
        );

    if (!data) {
        return "";
    }

    return String(
        data.name ||
        data.thread_name ||
        ""
    ).trim();
}

function shouldHandleLockEvent(
    event
) {
    const type =
        getLockEventType(
            event
        );

    return (
        type ===
            "log:user-nickname" ||
        type ===
            "log:thread-name"
    );
        }async function handleLockEvent(
    api,
    event
) {
    if (
        !api ||
        !event ||
        !shouldHandleLockEvent(event)
    ) {
        return false;
    }

    const threadID =
        getSafeThreadID(event);

    if (!threadID) {
        return false;
    }

    const type =
        getLockEventType(event);

    if (
        type ===
        "log:user-nickname"
    ) {
        const userID =
            getChangedNicknameUser(
                event
            );

        if (!userID) {
            return false;
        }

        if (
            hasRestoreGuard(
                "nick",
                threadID,
                userID
            )
        ) {
            return false;
        }

        return restoreLockedNickname(
            api,
            threadID,
            userID
        );
    }

    if (
        type ===
        "log:thread-name"
    ) {
        if (
            hasRestoreGuard(
                "gname",
                threadID
            )
        ) {
            return false;
        }

        return restoreLockedGCName(
            api,
            threadID
        );
    }

    return false;
        }module.exports.handleEvent = async function (
    {
        api,
        event
    }
) {
    try {
        if (!api || !event) {
            return;
        }

        const threadID =
            getSafeThreadID(event);

        const senderID =
            getSafeSenderID(event);

        if (!threadID) {
            return;
        }

        if (
            isLockEvent(event)
        ) {
            await handleLockEvent(
                api,
                event
            );

            return;
        }

        if (
            !senderID ||
            senderID ===
                getSafeBotID(api)
        ) {
            return;
        }

        const messageID =
            getSafeMessageID(event);

        if (!messageID) {
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
            normalizeData(
                loadData()
            );

        if (!data.active) {
            return;
        }

        if (
            !shouldTargetUser(
                threadID,
                senderID
            )
        ) {
            return;
        }

        if (
            data.autoReact &&
            isReactionAllowed(
                threadID
            )
        ) {
            const reactionTask =
                createReactionTask(
                    api,
                    event,
                    data
                );

            queueReactionTask(
                reactionTask
            );
        }

        if (
            data.autoReply &&
            isReplyAllowed(
                threadID
            )
        ) {
            const replyTask =
                createReplyTask(
                    api,
                    event,
                    data
                );

            queueReplyTask(
                replyTask
            );
        }
    } catch (error) {
        recordRuntimeError(
            error,
            "handleEvent"
        );
    }
};

module.exports.run = async function (
    {
        api,
        event,
        args
    }
) {
    const threadID =
        getSafeThreadID(event);

    const messageID =
        getSafeMessageID(event);

    if (!api || !threadID) {
        return;
    }

    const input =
        Array.isArray(args)
            ? args
            : [];

    const command =
        String(
            input[0] || ""
        )
        .toLowerCase()
        .trim();

    const values =
        input
            .slice(1)
            .join(" ")
            .trim();

    try {
        if (
            command === "help" ||
            command === "h"
        ) {
            return safeSend(
                api,
                buildDetailedHelp(),
                threadID,
                messageID
            );
        }

        if (
            command === "status"
        ) {
            return handleStatus(
                api,
                event
            );
        }

        if (
            command === "runtime"
        ) {
            return handleRuntime(
                api,
                event
            );
        }

        if (
            command === "stats"
        ) {
            return handleStats(
                api,
                event
            );
        }

        if (
            command === "queue"
        ) {
            return handleQueueStatus(
                api,
                event
            );
        }

        if (
            command === "storage"
        ) {
            return handleStorageStatus(
                api,
                event
            );
        }

        if (
            command === "delays"
        ) {
            return handleDelayStatus(
                api,
                event
            );
        }

        if (
            command === "targetstatus"
        ) {
            return handleTargetStatusMessage(
                api,
                event
            );
        }

        if (
            command === "lockstatus"
        ) {
            return handleLockStatus(
                api,
                event
            );
        }

        if (
            command === "on"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            return updateBooleanSetting(
                "active",
                true
            );
        }

        if (
            command === "off"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            return updateBooleanSetting(
                "active",
                false
            );
        }

        if (
            command === "reacton"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            return updateBooleanSetting(
                "autoReact",
                true
            );
        }

        if (
            command === "reactoff"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            return updateBooleanSetting(
                "autoReact",
                false
            );
        }

        if (
            command === "replyon"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            return updateBooleanSetting(
                "autoReply",
                true
            );
        }

        if (
            command === "replyoff"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            return updateBooleanSetting(
                "autoReply",
                false
            );
        }

        if (
            command === "setnick"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            return handleSetNickname(
                api,
                event,
                values
            );
        }

        if (
            command === "setgname"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            return handleSetGCName(
                api,
                event,
                values
            );
        }

        if (
            command === "lock"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            return handleLock(
                api,
                event
            );
        }

        if (
            command === "unlock"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            return handleUnlock(
                api,
                event
            );
        }

        if (
            command === "target"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            return handleTarget(
                api,
                event,
                values
            );
        }

        if (
            command === "untarget"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            return handleUntarget(
                api,
                event
            );
        }

        if (
            command === "delay"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            const delay =
                parseDelayValue(
                    values
                );

            if (
                delay === null ||
                !setReplyDelay(delay)
            ) {
                return safeSend(
                    api,
                    "❌ Invalid delay.",
                    threadID,
                    messageID
                );
            }

            return safeSend(
                api,
                `✅ Reply delay: ${formatDelay(delay)}`,
                threadID,
                messageID
            );
        }

        if (
            command === "save"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            return handleSave(
                api,
                event
            );
        }

        if (
            command === "reset"
        ) {
            if (!isAdmin(
                event.senderID
            )) {
                return;
            }

            return handleReset(
                api,
                event
            );
        }

        if (
            command === "ping"
        ) {
            return handlePing(
                api,
                event
            );
        }

        return safeSend(
            api,
            "❌ Unknown RYUK command. Use /ryuk help.",
            threadID,
            messageID
        );
    } catch (error) {
        recordRuntimeError(
            error,
            "run"
        );

        return safeSend(
            api,
            "⚠️ RYUK encountered an error.",
            threadID,
            messageID
        );
    }
};

try {
    ensureDataFile();
    initializeRyuk();
    safeLog(
        "RYUK module loaded successfully."
    );
} catch (error) {
    console.error(
        "[RYUK] startup error:",
        error
    );
        }

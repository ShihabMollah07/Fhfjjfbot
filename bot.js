// bot.js
// Money Tree (টাকার গাছ) - simple demo Telegram bot (single file).
// Node.js + Telegraf
//
// Usage:
// 1) set env var BOT_TOKEN or paste token in BOT_TOKEN variable below
// 2) run: node bot.js
//
// IMPORTANT: This is a demo. No real money transactions. Use at your own risk.

const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN || '8443626704:AAGXRq8__KfwZUmDX_JCyv_FvC7Dts5A7fQ';
if (!BOT_TOKEN || BOT_TOKEN === '8443626704:AAGXRq8__KfwZUmDX_JCyv_FvC7Dts5A7fQ') {
  console.error('Please set BOT_TOKEN environment variable or edit the BOT_TOKEN in the file.');
  process.exit(1);
}

const DATA_FILE = path.join(__dirname, 'data.json');

// Helper: load/save simple JSON persistence
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const init = { users: {}, withdraws: [] };
      fs.writeFileSync(DATA_FILE, JSON.stringify(init, null, 2));
      return init;
    }
    const raw = fs.readFileSync(DATA_FILE);
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load data:', e);
    return { users: {}, withdraws: [] };
  }
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Simple utilities
function ensureUser(data, tgId, info = {}) {
  if (!data.users[tgId]) {
    data.users[tgId] = {
      id: tgId,
      username: info.username || null,
      first_name: info.first_name || null,
      balance: 0,
      referrals: 0,
      joined_at: new Date().toISOString(),
    };
  }
  return data.users[tgId];
}

// Admin list - change to your Telegram ID(s)
const ADMINS = [ /* put admin numeric IDs here, e.g. 5657408797 */ ];

// Bot start
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  const data = loadData();
  // Check for referral code parameter
  const payload = (ctx.startPayload || '').trim();
  const ref = payload || null;
  const tgId = String(ctx.from.id);
  const user = ensureUser(data, tgId, ctx.from);

  let reply = `স্বাগতম, ${ctx.from.first_name || 'বন্ধু'}!\n\n` +
              `এই বটটি একটি ডেমো "টাকার গাছ" বট — এখানে পয়েন্ট (কল্পিত) জমা হবে।\n` +
              `কিছু কমান্ড: /balance, /withdraw, /invite, /poll (admin), /help\n\n`;

  // Handle referral: ref expected as referrer user id
  if (ref && ref !== tgId && data.users[ref]) {
    // Give bonus to referrer and referee (demo)
    const referrer = ensureUser(data, ref);
    if (!user.referred_by) { // only once
      user.referred_by = ref;
      user.balance += 5;         // bonus to new user
      referrer.balance += 10;    // bonus to referrer
      referrer.referrals = (referrer.referrals || 0) + 1;
      reply += `🎉 তুমি রেফারেলে যোগদান করেছো — তোমাকে +5 পয়েন্ট দেয়া হয়েছে।\n` +
               `রেফারারকে +10 পয়েন্ট দেয়া হয়েছে।\n\n`;
      saveData(data);
    } else {
      reply += `তুমি ইতিমধ্যেই কাউকে রেফার করেছো/রেফার্ড হয়েছো।\n\n`;
    }
  }

  reply += `তোমার ইউজার আইডি: ${tgId}\n`;
  reply += `তোমার রেফারাল লিংক: https://t.me/${ctx.botInfo.username}?start=${tgId}\n`;
  ctx.reply(reply, Markup.inlineKeyboard([
    [ Markup.button.callback('ব্যালান্স দেখো 💰', 'BALANCE') ],
    [ Markup.button.url('বটের পেইজ', `https://t.me/${ctx.botInfo.username}`) ]
  ]));
});

// Handle inline button callback for balance quick view
bot.action('BALANCE', (ctx) => {
  const data = loadData();
  const user = ensureUser(data, String(ctx.from.id), ctx.from);
  ctx.answerCbQuery(); // remove loading
  ctx.reply(`তোমার ব্যালান্স: ${user.balance} পয়েন্ট\nরেফারেল: ${user.referrals || 0}`);
});

// /help
bot.command('help', (ctx) => {
  ctx.reply(
    `/balance - ব্যালান্স দেখো\n` +
    `/invite - তোমার রেফারাল লিংক দেখাও\n` +
    `/withdraw - উইথড্র রিকোয়েস্ট তৈরি করো (ডেমো)\n` +
    `/poll - (admin) পোল তৈরি\n` +
    `/profile - তোমার প্রোফাইল দেখাও\n`
  );
});

// /balance
bot.command('balance', (ctx) => {
  const data = loadData();
  const user = ensureUser(data, String(ctx.from.id), ctx.from);
  saveData(data);
  ctx.reply(`🔹 তোমার ব্যালান্স: ${user.balance} পয়েন্ট\n🔹 রেফারেল: ${user.referrals || 0}`);
});

// /invite
bot.command('invite', (ctx) => {
  const link = `https://t.me/${ctx.botInfo.username}?start=${ctx.from.id}`;
  ctx.reply(`তোমার রেফারাল লিংক শেয়ার করো:\n\n${link}\n\nপ্রতিটি সফল রেফারালে রেফারারকে +10 এবং রেফারি(new) কে +5 পয়েন্ট দেওয়া হবে (ডেমো)।`);
});

// /profile
bot.command('profile', (ctx) => {
  const data = loadData();
  const u = ensureUser(data, String(ctx.from.id), ctx.from);
  ctx.replyWithMarkdown(
    `*Profile*\n` +
    `ID: \`${u.id}\`\n` +
    `Name: ${u.first_name || '-'}\n` +
    `Username: ${u.username ? '@' + u.username : '-'}\n` +
    `Balance: ${u.balance} পয়েন্ট\n` +
    `Referrals: ${u.referrals || 0}\n` +
    `Joined: ${u.joined_at}`
  );
});

// /withdraw - create a withdraw request (demo)
bot.command('withdraw', (ctx) => {
  const data = loadData();
  const user = ensureUser(data, String(ctx.from.id), ctx.from);
  // For safety: require minimum balance for withdraw
  const MIN_WITHDRAW = 50; // demo threshold
  if (user.balance < MIN_WITHDRAW) {
    ctx.reply(`দুঃখিত — উইথড্র করতে ন্যূনতম ${MIN_WITHDRAW} পয়েন্ট প্রয়োজন। তুমি এখন: ${user.balance} পয়েন্ট`);
    return;
  }
  // Create a withdraw request entry
  const req = {
    id: 'W' + Date.now(),
    user_id: user.id,
    amount: user.balance,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  data.withdraws.push(req);
  // For demo, we don't actually send money; we zero user's balance and mark request
  user.balance = 0;
  saveData(data);
  ctx.reply(`✅ উইথড্র রিকোয়েস্ট তৈরি হয়েছে!\nRequest ID: ${req.id}\nAmount: ${req.amount} (ডেমো)\nঅ্যাডমিন রিভিউ করার পরে স্ট্যাটাস এডভাইজ করা হবে।`);
  // Notify admins (if any)
  ADMINS.forEach(async adminId => {
    try {
      await ctx.telegram.sendMessage(adminId, `নতুন উইথড্র রিকোয়েস্ট:\nID: ${req.id}\nUser: ${user.id}\nAmount: ${req.amount}`);
    } catch (e) { /* ignore */ }
  });
});

// Admin commands: /credit <user_id> <amount>, /debit <user_id> <amount>, /withdraws
bot.command('credit', (ctx) => {
  if (!ADMINS.includes(ctx.from.id)) return ctx.reply('এই কমান্ড ব্যবহার করার অনুমতি নেই।');
  const parts = ctx.message.text.split(/\s+/);
  if (parts.length < 3) return ctx.reply('ব্যবহার: /credit <user_id> <amount>');
  const uid = parts[1];
  const amt = parseInt(parts[2], 10);
  if (isNaN(amt)) return ctx.reply('সঠিক পরিমাণ দিন।');
  const data = loadData();
  const user = ensureUser(data, uid);
  user.balance += amt;
  saveData(data);
  ctx.reply(`✅ ${amt} পয়েন্ট credited to ${uid}. নতুন ব্যালান্স: ${user.balance}`);
});

// debit
bot.command('debit', (ctx) => {
  if (!ADMINS.includes(ctx.from.id)) return ctx.reply('এই কমান্ড ব্যবহার করার অনুমতি নেই।');
  const parts = ctx.message.text.split(/\s+/);
  if (parts.length < 3) return ctx.reply('ব্যবহার: /debit <user_id> <amount>');
  const uid = parts[1];
  const amt = parseInt(parts[2], 10);
  if (isNaN(amt)) return ctx.reply('সঠিক পরিমাণ দিন।');
  const data = loadData();
  const user = ensureUser(data, uid);
  user.balance = Math.max(0, user.balance - amt);
  saveData(data);
  ctx.reply(`✅ ${amt} পয়েন্ট debited from ${uid}. নতুন ব্যালান্স: ${user.balance}`);
});

// /withdraws - list withdraw requests (admin)
bot.command('withdraws', (ctx) => {
  if (!ADMINS.includes(ctx.from.id)) return ctx.reply('এই কমান্ড ব্যবহার করার অনুমতি নেই।');
  const data = loadData();
  if (!data.withdraws.length) return ctx.reply('কোনো উইথড্র রিকোয়েস্ট নেই।');
  const list = data.withdraws.map(w => `${w.id} | ${w.user_id} | ${w.amount} | ${w.status}`).join('\n');
  ctx.reply('Withdraw Requests:\n' + list);
});

// /poll - admin-only quick poll creation (simplified)
bot.command('poll', async (ctx) => {
  if (!ADMINS.includes(ctx.from.id)) return ctx.reply('এই কমান্ড ব্যবহার করার অনুমতি নেই।');
  // Expected format: /poll Question ? Option1 ; Option2 ; Option3
  // Example: /poll তোমার প্রিয় খাবার কোনটা? Pizza;Biriyani;Burger
  const text = ctx.message.text.replace(/^\/poll\s*/i, '').trim();
  if (!text) return ctx.reply('ব্যবহার: /poll প্রশ্ন ? অপশন1;অপশন2;অপশন3\nউদাহরণ: /poll তুমি কি টাকার গাছ লাগাতে চাও? হ্যাঁ;না');
  // Try split by ? or newline
  let question = text;
  let options = [];
  if (text.includes('?')) {
    const [q, rest] = text.split('?');
    question = q + '?';
    options = rest.split(';').map(s => s.trim()).filter(Boolean);
  } else if (text.includes('\n')) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    question = lines.shift();
    options = lines.join(' ').split(';').map(s => s.trim()).filter(Boolean);
  } else {
    const parts = text.split(';');
    question = parts.shift();
    options = parts.map(s => s.trim()).filter(Boolean);
  }
  if (options.length < 2) return ctx.reply('কমপক্ষে 2টি অপশন দিন। অপশনগুলো `;` দিয়ে আলাদা করুন।');

  try {
    // Send a quiz-style poll (non-anonymous disabled so bot can track? Telegraf uses sendPoll)
    await ctx.telegram.sendPoll(ctx.chat.id, question, options, { is_anonymous: false });
    ctx.reply('পোল পাঠানো হয়েছে।');
  } catch (e) {
    console.error(e);
    ctx.reply('পোল পাঠাতে সমস্যা হয়েছে। বটকে গ্রুপে অ্যাড এবং অ্যাডমিন বানানো আছে কি না চেক করো।');
  }
});

// Fallback text handler - simple gamified action: "water" -> grow tree (earn points)
bot.on('text', (ctx) => {
  const txt = ctx.message.text.toLowerCase();
  const data = loadData();
  const user = ensureUser(data, String(ctx.from.id), ctx.from);
  if (txt.includes('water') || txt.includes('পানি') || txt.includes('গাছ')) {
    // small random reward but rate-limit by last action timestamp (not implemented here for simplicity)
    const gain = Math.floor(Math.random() * 5) + 1; // 1-5 points
    user.balance += gain;
    saveData(data);
    ctx.reply(`🌱 তুমি টাকার গাছ সেচ দিলে — পেয়েছো ${gain} পয়েন্ট! (ডেমো) \nতোমার নতুন ব্যালান্স: ${user.balance}`);
  } else {
    ctx.reply('আমি বোঝা পারলাম না — /help দেখে নেও। (টেক্সটে "পানি" বা "water" লিখলে ছোট পয়েন্ট পাওয়া যাবে।)');
  }
});

// Launch bot
bot.launch().then(() => {
  console.log('Money Tree demo bot started.');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

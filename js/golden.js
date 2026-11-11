// ============================================================
// HAYK — ساعت طلایی (Golden Hour) helpers
// این فایل مستقل است و به js/app.js دست نمی‌زند.
// ============================================================

var GOLDEN_DAY_NAMES = { 6: "شنبه", 0: "یکشنبه", 1: "دوشنبه", 2: "سه‌شنبه", 3: "چهارشنبه", 4: "پنجشنبه", 5: "جمعه" };
var GOLDEN_WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

function goldenFa(n) {
  return String(n).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; });
}
function goldenToman(n) {
  return goldenFa(Math.round(Number(n) || 0).toLocaleString("en-US")) + " تومان";
}

function defaultGoldenHour() {
  return { enabled: false, days: [6, 0, 1, 2, 3], start: "19:00", end: "21:00", rewardType: "wallet", walletBonus: 5000, cashbackExpireDays: 14 };
}

async function getGoldenHour() {
  var def = defaultGoldenHour();
  try {
    var raw = await getSetting("golden_hour");
    var o = raw ? JSON.parse(raw) : null;
    if (o && typeof o === "object") {
      return {
        enabled: !!o.enabled,
        days: Array.isArray(o.days) ? o.days.map(Number) : def.days,
        start: o.start || def.start,
        end: o.end || def.end,
        rewardType: o.rewardType === "double" ? "double" : "wallet",
        walletBonus: Number(o.walletBonus) > 0 ? Number(o.walletBonus) : def.walletBonus,
        // اگه این مقدار قبلاً ذخیره نشده باشه، انقضا خاموشه (۰) تا ناخواسته چیزی نسوزه
        cashbackExpireDays: o.cashbackExpireDays !== undefined ? Math.max(0, Number(o.cashbackExpireDays) || 0) : 0,
      };
    }
  } catch (e) { console.error(e); }
  return def;
}

function isGoldenHourNow(gh, now) {
  if (!gh || !gh.enabled) return false;
  var d = now || new Date();
  if (gh.days.indexOf(d.getDay()) === -1) return false;
  var p = function (n) { return String(n).padStart(2, "0"); };
  var t = p(d.getHours()) + ":" + p(d.getMinutes());
  return t >= gh.start && t < gh.end;
}

function goldenDaysLabel(days) {
  var ordered = GOLDEN_WEEK_ORDER.filter(function (d) { return days.indexOf(d) !== -1; });
  if (ordered.length === 7) return "همه روزهای هفته";
  var idx = ordered.map(function (d) { return GOLDEN_WEEK_ORDER.indexOf(d); });
  var contiguous = idx.every(function (v, i) { return i === 0 || v === idx[i - 1] + 1; });
  if (contiguous && ordered.length >= 3) {
    return GOLDEN_DAY_NAMES[ordered[0]] + " تا " + GOLDEN_DAY_NAMES[ordered[ordered.length - 1]];
  }
  return ordered.map(function (d) { return GOLDEN_DAY_NAMES[d]; }).join("، ");
}

function goldenRewardLabel(gh) {
  return gh.rewardType === "double"
    ? "هر نوشیدنی دو تا امتیاز حساب می‌شه (استمپ دوبرابر)"
    : "برای هر نوشیدنی " + goldenToman(gh.walletBonus) + " هدیه به کیف پولتون" +
      (gh.cashbackExpireDays > 0 ? " (تا " + goldenFa(gh.cashbackExpireDays) + " روز اعتبار داره؛ بعدش می‌سوزه)" : "");
}

// فقط برای یک نوشیدنی «عادی» صدا زده می‌شه (نه نوشیدنی رایگان).
// ورودی: تعداد فعلی نوشیدنی + موجودی کیف پول. خروجی: مقدارهای جدید + bonus
function goldenAdjust(gh, drinkCount, walletBalance) {
  var drink_count = drinkCount + 1;
  var wallet_balance = walletBalance || 0;
  var bonus = null;
  if (isGoldenHourNow(gh)) {
    if (gh.rewardType === "double") {
      if (drinkCount + 2 <= DRINKS_FOR_FREE) {
        drink_count = drinkCount + 2;
        bonus = { type: "double" };
      }
    } else {
      wallet_balance += gh.walletBonus;
      bonus = { type: "wallet", amount: gh.walletBonus };
    }
  }
  return { drink_count: drink_count, wallet_balance: wallet_balance, bonus: bonus };
}

function goldenToastText(bonus) {
  if (!bonus) return "یک نوشیدنی اضافه شد ☕";
  if (bonus.type === "wallet") return "⚡ ساعت طلایی! " + goldenToman(bonus.amount) + " به کیف پول اضافه شد ☕";
  return "⚡ ساعت طلایی! استمپ دوبرابر ثبت شد ☕☕";
}


// ============================================================
// کش‌بک ساعت طلایی با مهلت انقضا
// فقط هدیهٔ ساعت طلایی منقضی می‌شه؛ پولی که خود مشتری شارژ کرده هیچ‌وقت دست نمی‌خوره.
// ============================================================

// هر بار هدیهٔ ساعت طلایی به کیف پول اضافه می‌شه، یک «سند کش‌بک» با تاریخ انقضا ثبت می‌شه.
// اگه جدول کش‌بک ساخته نشده باشه، هدیه مثل پول معمولی کیف پول می‌مونه (چیزی نمی‌سوزه).
async function recordCashbackGrant(customerId, amount, gh) {
  if (!gh || !(gh.cashbackExpireDays > 0) || !(amount > 0)) return;
  var expires = new Date(Date.now() + gh.cashbackExpireDays * 86400000).toISOString();
  try {
    var res = await supabaseClient.from("cashback_grants").insert({
      customer_id: customerId, amount: amount, remaining: amount, expires_at: expires,
    });
    if (res.error) console.warn("cashback grant not saved", res.error);
  } catch (e) { console.warn(e); }
}

// هر بار از کیف پول کم می‌شه، اول از کش‌بک (نزدیک‌ترین انقضا) مصرف می‌شه
// تا پول شارژی مشتری سالم بمونه و کش‌بک قبل از سوختن خرج بشه.
async function consumeCashback(customerId, spent) {
  try {
    var res = await supabaseClient.from("cashback_grants")
      .select("id,remaining").eq("customer_id", customerId)
      .gt("remaining", 0).gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: true });
    if (res.error || !res.data) return;
    var left = spent;
    for (var i = 0; i < res.data.length && left > 0; i++) {
      var g = res.data[i];
      var use = Math.min(g.remaining, left);
      await supabaseClient.from("cashback_grants").update({ remaining: g.remaining - use }).eq("id", g.id);
      left -= use;
    }
  } catch (e) { console.warn(e); }
}

// کش‌بک‌های منقضی‌شده رو می‌سوزونه (تابع داخل دیتابیس). علاوه بر زمان‌بندی روزانه،
// هر بار صفحه‌ای باز می‌شه هم صدا زده می‌شه تا حتماً به‌روز باشه.
async function burnExpiredCashback() {
  try { await supabaseClient.rpc("burn_expired_cashback"); } catch (e) { console.warn(e); }
}

// خلاصهٔ کش‌بک فعال مشتری: { total, soonest, soonestAmount }
async function getCashbackSummary(customerId) {
  try {
    var res = await supabaseClient.from("cashback_grants")
      .select("remaining,expires_at").eq("customer_id", customerId)
      .gt("remaining", 0).gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: true });
    if (res.error || !res.data || !res.data.length) return null;
    var total = res.data.reduce(function (s, g) { return s + g.remaining; }, 0);
    return { total: total, soonest: res.data[0].expires_at, soonestAmount: res.data[0].remaining };
  } catch (e) { return null; }
}

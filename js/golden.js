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
  return { enabled: false, days: [6, 0, 1, 2, 3], start: "19:00", end: "21:00", rewardType: "wallet", walletBonus: 5000 };
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
    : "برای هر نوشیدنی " + goldenToman(gh.walletBonus) + " هدیه به کیف پولتون";
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

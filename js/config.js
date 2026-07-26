// ============================================================
// HAYK Loyalty Club — Supabase configuration
// ------------------------------------------------------------
// Fill these two values in with the ones from your own Supabase
// project: Project Settings → API → "Project URL" and "anon public" key.
// These are safe to expose in client-side code (that's what the
// anon key is designed for) as long as you keep Row Level Security
// policies from schema.sql in place.
// ============================================================

const SUPABASE_URL = "https://ykqxxicmanvxtrmtlgcc.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_x_50j8gDLKBGJODKvC9S2g_YJZ-cpGx";

// Number of drinks needed before the next one is free.
const DRINKS_FOR_FREE = 7;

// reCAPTCHA site key (public — safe to expose). Get it from
// https://www.google.com/recaptcha/admin → your site → "Site Key".
// The matching SECRET key goes only in Vercel's Environment Variables,
// never in this file.
const RECAPTCHA_SITE_KEY = "⚠️ اینجا کلید reCAPTCHA خودتون رو که یادداشت کردید بذارید";

// Chance (0 to 1) that adding a drink unlocks a "Wheel of Fortune" spin
// for the customer. 0.2 = 20% chance per drink added.
const SPIN_CHANCE = 0.2;

// Prizes on the wheel (10 slots total, per the shop's request):
//   - 4 real prizes: cookie, pastry, free drink of choice, drink+pastry combo
//   - 6 empty slots so winning isn't too easy
// `effect`:
//   "prize" -> unclaimed prize, staff must hand it over then mark it claimed
//              in the admin panel
//   "none"  -> no effect, just a friendly message
// `weight` controls actual odds (higher = more likely). The combo prize is
// intentionally the rarest. Total prize weight (22) vs empty weight (60)
// keeps the overall win chance around ~27%, so it doesn't feel too easy.
const SPIN_PRIZES = [
  { label: "🍪 یک کوکی رایگان", effect: "prize", weight: 9 },
  { label: "🥐 یک شیرینی رایگان", effect: "prize", weight: 7 },
  { label: "☕ یک نوشیدنی دلخواه رایگان", effect: "prize", weight: 5 },
  { label: "🎉 نوشیدنی + شیرینی رایگان با هم", effect: "prize", weight: 1 },
  { label: "🔄 پوچ، دوباره امتحان کن", effect: "none", weight: 10 },
  { label: "😊 امیدواریم روز خوبی داشته باشید", effect: "none", weight: 10 },
  { label: "🍀 این دفعه نه، دفعه‌ی بعد", effect: "none", weight: 10 },
  { label: "☁️ پوچ", effect: "none", weight: 10 },
  { label: "🌟 نزدیک بود! دوباره امتحان کن", effect: "none", weight: 10 },
  { label: "🎯 دفعه‌ی بعد شانست بیشتره", effect: "none", weight: 10 },
];

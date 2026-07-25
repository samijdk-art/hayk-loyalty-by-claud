// ============================================================
// HAYK Loyalty Club — shared helpers
// ============================================================

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function normalizePhone(raw) {
  return (raw || "").toString().trim().replace(/[\s\-()]/g, "");
}

function showToast(message, isError = false) {
  let toast = document.getElementById("app-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "app-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle("err", isError);
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 2800);
}

function showFormMsg(el, message, type = "error") {
  el.textContent = message;
  el.className = `form-msg show ${type}`;
}

function hideFormMsg(el) {
  el.className = "form-msg";
  el.textContent = "";
}

function setBtnLoading(btn, loading, loadingText = "…") {
  if (loading) {
    btn.dataset.origText = btn.dataset.origText || btn.innerHTML;
    btn.innerHTML = `<span class="loading-dot"></span>${loadingText}`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.origText || btn.innerHTML;
    btn.disabled = false;
  }
}

async function getSetting(key) {
  const { data, error } = await supabaseClient
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return data ? data.value : null;
}

async function setSetting(key, value) {
  const { error } = await supabaseClient
    .from("app_settings")
    .update({ value })
    .eq("key", key);
  if (error) throw error;
}

async function fetchCustomerById(id) {
  const { data, error } = await supabaseClient
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchCustomerByPhone(phone) {
  const { data, error } = await supabaseClient
    .from("customers")
    .select("*")
    .eq("phone", normalizePhone(phone))
    .maybeSingle();
  if (error) throw error;
  return data;
}

function dashboardUrlForId(id) {
  const base = window.location.origin + window.location.pathname.replace(/[^/]*$/, "");
  return `${base}dashboard.html?id=${id}`;
}

function renderQrInto(elId, text) {
  const el = document.getElementById(elId);
  el.innerHTML = "";
  new QRCode(el, {
    text,
    width: 176,
    height: 176,
    colorDark: "#18110b",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M,
  });
}

function initials(name) {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return iso;
  }
}

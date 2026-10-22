(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------------- data (fake, replaces backend) ---------------- */
  const PLANS = {
    monthly: { name: "Monthly Premium", price: "$14.99 per month" },
    annual:  { name: "Annual Premium",  price: "$83.88 per year" },
    long:    { name: "Premium Black Friday Lifetime Promo 2026", price: "$499 one-time" },
  };
  const ACCESS_DATE = new Date(2026, 10, 23);
  const fmtLong = ACCESS_DATE.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const fmtShort = ACCESS_DATE.toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  const fmt = n => n.toLocaleString("en-US");

  // Personal chips first (hidden below a minimum value, big numbers rounded down), then general perks.
  const PERSONAL = {
    normal: [ { icon: "heart", text: `${fmt(182)} favorites hand-picked by you` }, { icon: "user", text: `Following ${fmt(24)} creators` }, { icon: "eye", text: `Over ${fmt(40)} hours in VR` } ],
    long:   [ { icon: "heart", text: `Over ${fmt(12000)} favorites hand-picked by you` }, { icon: "user", text: `Following over ${fmt(1200)} creators` }, { icon: "eye", text: `Over ${fmt(2400)} hours in VR` } ],
    none:   [],
  };
  const GENERAL = [
    { icon: "film", text: "Endless library of premium VR" },
    { icon: "sparkles", text: "Weekly drops for all your tastes" },
    { icon: "crown", text: "Exclusive DeoVR Originals" },
    { icon: "passthrough-ai", text: "Immersive AR & interactive videos" },
    { icon: "cloud", text: "30 GB in DeoVR Drive" },
  ];
  const REASONS = {
    price: "Too expensive", content: "Not enough content I like", tech: "Playback or technical problems",
    usage: "I don't watch often enough", switching: "Switching to another service", short: "Only needed it for a short time",
  };

  const state = { theme: "light", flags: { app: true, drive: true }, chips: "normal", plan: "monthly", result: "success", steps: "on", cancelled: false, index: 0 };

  /* ---------------- page ---------------- */
  const applyPlan = () => {
    const p = PLANS[state.plan];
    $$("[data-plan-name]").forEach(el => el.textContent = p.name);
    $$("[data-plan-price]").forEach(el => el.textContent = p.price);
    $$("[data-plan-date-long]").forEach(el => el.textContent = fmtLong);
    $$("[data-plan-date-short]").forEach(el => el.textContent = fmtShort);
  };
  const applyCancelled = () => {
    $("#benefits-active").hidden = state.cancelled;
    $("#benefits-cancelled").hidden = !state.cancelled;
  };

  /* ---------------- toasts ---------------- */
  const toast = (type, text) => {
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `<div class="toast__body"><div class="toast__icon"><svg class="icon" aria-hidden="true"><use href="icons.svg#${type === "success" ? "check-circle" : "info-circle"}"/></svg></div><div class="toast__text">${text}</div></div><div class="toast__end"><button class="new-button ghost neutral icon-button toast__close" type="button" aria-label="Close"><svg class="icon" aria-hidden="true"><use href="icons.svg#x-close"/></svg></button></div>`;
    $(".toast__close", el).addEventListener("click", () => el.remove());
    $("#toasts").append(el);
    setTimeout(() => el.remove(), 6000);
  };

  /* ---------------- modal & flow ---------------- */
  const modal = $("#modal");
  const screens = Object.fromEntries($$(".screen").map(s => [s.dataset.screen, s]));
  const sequence = () => ["leaving", state.flags.app && "app", state.flags.drive && "drive", "why"].filter(Boolean);

  const renderChips = () => {
    const chips = [...PERSONAL[state.chips].map(c => ({ ...c, personal: true })), ...GENERAL].slice(0, 5);
    $("#chips").innerHTML = chips.map(c => `<span class="chip${c.personal ? " chip--personal" : ""}"><svg class="icon" aria-hidden="true"><use href="icons.svg#${c.icon}"/></svg><span>${c.text}</span></span>`).join("");
  };

  const renderReasons = () => {
    const keys = Object.keys(REASONS).sort(() => Math.random() - 0.5); // shuffled in product; "Other" always last
    const items = [...keys.map(k => [k, REASONS[k]]), ["other", "Other"]];
    $("#reasons").innerHTML = items.map(([k, label]) => `<label class="reason"><input class="radio" type="radio" name="reason" value="${k}"><span>${label}</span></label>`).join("");
    $("#comment-wrap").hidden = true;
    $("#comment-field").value = "";
    $("#confirm-error").hidden = true;
    $$("input[name=reason]").forEach(r => r.addEventListener("change", () => {
      const other = r.value === "other";
      $("#comment-wrap").hidden = !other;
      if (other) $("#comment-field").focus();
    }));
  };

  const renderSteps = () => {
    const seq = sequence(), el = $("#steps");
    el.hidden = state.steps !== "on";
    el.innerHTML = seq.map((_, i) => `<i class="${i <= state.index ? "done" : ""}"></i>`).join("");
  };

  const show = (i) => {
    const seq = sequence();
    state.index = Math.max(0, Math.min(i, seq.length - 1));
    const key = seq[state.index], s = screens[key];
    Object.values(screens).forEach(x => x.classList.toggle("active", x === s));
    $("#modal-title").textContent = s.dataset.title;
    const sub = $("#modal-subtitle"); sub.hidden = !s.dataset.subtitle; sub.textContent = s.dataset.subtitle || "";
    $("#btn-back").hidden = state.index === 0;
    $(".modal__body").scrollTop = 0;
    renderSteps();
    if (key === "why") setTimeout(() => $("input[name=reason]")?.focus(), 50);
  };

  const open = (i = 0) => {
    renderChips(); renderReasons();
    modal.classList.add("open"); document.body.style.overflow = "hidden";
    show(i);
  };
  const close = () => { modal.classList.remove("open"); document.body.style.overflow = ""; setConfirmLoading(false); };
  const keep = () => { close(); toast("info", "Your Premium stays active"); };

  const setConfirmLoading = (on) => { const b = $("#btn-confirm"); b.classList.toggle("loading", on); b.disabled = on; $$("#why-form .new-button, #why-form .radio").forEach(x => { if (x !== b) x.disabled = on; }); };

  $("#why-form").addEventListener("submit", (e) => {
    e.preventDefault();
    $("#confirm-error").hidden = true;
    setConfirmLoading(true);
    setTimeout(() => {
      setConfirmLoading(false);
      if (state.result === "error") { $("#confirm-error").hidden = false; return; }
      state.cancelled = true; applyCancelled(); close();
      toast("success", `Your subscription is cancelled. You have Premium until ${fmtLong}`);
    }, 1200);
  });

  modal.addEventListener("click", (e) => {
    const a = e.target.closest("[data-action]");
    if (e.target === modal) return close();
    if (!a) return;
    const act = a.dataset.action;
    if (act === "next") show(state.index + 1);
    if (act === "keep") keep();
    if (act === "get-app") { toast("info", "Opens the DeoVR app download page (prototype)"); }
    if (act === "open-drive") { toast("info", "Opens DeoVR Drive (prototype)"); }
  });
  $("#btn-back").addEventListener("click", () => show(state.index - 1));
  $("#btn-close").addEventListener("click", close);
  $("#btn-cancel").addEventListener("click", () => open(0));
  $("#btn-reactivate").addEventListener("click", () => { state.cancelled = false; applyCancelled(); toast("success", "Welcome back! Your Premium is active again"); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) close();
    if (e.key.toLowerCase() === "p" && !/input|textarea/i.test(document.activeElement.tagName)) togglePanel();
  });

  /* ---------------- prototype controls ---------------- */
  const panel = $("#proto-panel");
  const togglePanel = () => panel.hidden = !panel.hidden;
  $("#proto-toggle").addEventListener("click", togglePanel);
  const applyTheme = () => { if (state.theme === "dark") document.body.setAttribute("data-proto-theme", "dark"); else document.body.removeAttribute("data-proto-theme"); };
  $$("[data-proto]").forEach(b => b.addEventListener("click", () => {
    const { proto, value } = b.dataset;
    if (proto === "flag") { state.flags[value] = !state.flags[value]; b.classList.toggle("on", state.flags[value]); if (modal.classList.contains("open")) show(Math.min(state.index, sequence().length - 1)); return; }
    if (proto === "go") { open(sequence().indexOf(value) === -1 ? 0 : sequence().indexOf(value)); return; }
    if (proto === "reset") { state.cancelled = false; applyCancelled(); close(); return; }
    $$(`[data-proto="${proto}"]`).forEach(x => x.classList.toggle("on", x === b));
    state[proto] = value;
    if (proto === "theme") applyTheme();
    if (proto === "plan") applyPlan();
    if (proto === "chips") renderChips();
    if (proto === "steps") renderSteps();
  }));

  applyPlan(); applyCancelled(); renderChips();
})();

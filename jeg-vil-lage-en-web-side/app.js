const WORKOUT_KEY = "treningslogg.workouts.v2";
const PROFILE_KEY = "treningslogg.profile.v1";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // Appen fungerer fortsatt uten offline-cache, for eksempel når den åpnes som file://.
    });
  });
}

const zoneDefinitions = [
  { key: "Sone 1", name: "Restitusjon", min: 0.50, max: 0.60, purpose: "lett pratetempo" },
  { key: "Sone 2", name: "Rolig", min: 0.60, max: 0.75, purpose: "grunnlag og langtur" },
  { key: "Sone 3", name: "Maraton", min: 0.75, max: 0.80, purpose: "kontrollert moderat" },
  { key: "Sone 4", name: "Terskel", min: 0.80, max: 0.87, purpose: "sub-terskel etter Bakken" },
  { key: "Sone 5", name: "VO2", min: 0.87, max: 0.95, purpose: "kortere, hard kvalitet" },
];

const plan = [
  {
    offset: 0,
    day: "Mandag",
    type: "Løp",
    title: "Rolig aerob tur",
    zone: "Sone 2 Rolig",
    duration: 45,
    distance: 7,
    note: "Hold igjen. Denne økten skal bygge kapasitet uten å stjele fra terskel og styrke.",
  },
  {
    offset: 1,
    day: "Tirsdag",
    type: "Løp",
    title: "Sub-terskel 5 x 6 min",
    zone: "Sone 4 Terskel",
    duration: 60,
    distance: 10,
    note: "Bakken-inspirert: kontrollert terskel, helst 80-87 % av makspuls. Avslutt mens du fortsatt har kontroll.",
  },
  {
    offset: 2,
    day: "Onsdag",
    type: "Mobilitet",
    title: "Fri eller mobilitet",
    zone: "Sone 1 Restitusjon",
    duration: 20,
    distance: 0,
    note: "Lett bevegelighet, søvn og mat. Dette er dagen som gjør resten mulig.",
  },
  {
    offset: 3,
    day: "Torsdag",
    type: "HYROX",
    title: "Daily HYROX 8-10 runder",
    zone: "Sone 3 Maraton",
    duration: 55,
    distance: 3.2,
    note: "400 m løp/sprint mellom enkle basisøvelser. Eksempel: pushups, knebøy, utfall, situps, burpees, mountain climbers, planke og farmers carry.",
  },
  {
    offset: 4,
    day: "Fredag",
    type: "Løp",
    title: "Rolig + stigningsløp",
    zone: "Sone 2 Rolig",
    duration: 40,
    distance: 6,
    note: "Rolig løp med 4-6 korte stigninger. Raskt, men avslappet.",
  },
  {
    offset: 5,
    day: "Lørdag",
    type: "Styrke",
    title: "Styrke nummer to",
    zone: "Sone 1 Restitusjon",
    duration: 45,
    distance: 0,
    note: "Mer teknikk og robusthet enn maks løft. Hold nok overskudd til langturen.",
  },
  {
    offset: 6,
    day: "Søndag",
    type: "Løp",
    title: "Langtur halvmaraton",
    zone: "Sone 2 Rolig",
    duration: 80,
    distance: 14,
    note: "Rolig langtur. Øk varighet gradvis, og legg inn korte blokker i Sone 3 når kroppen tåler det.",
  },
];

const suggestionLibrary = {
  thresholdLong: {
    type: "Løp",
    title: "Sub-terskel 5 x 6 min",
    intensity: "Sone 4 Terskel",
    duration: 62,
    distance: 10,
    note: "Bakken-prinsipp: samle tid nær terskel uten å presse over. Hold omtrent 80-87 % av makspuls, eller 2-3 mmol/l hvis du måler laktat.",
  },
  thresholdShort: {
    type: "Løp",
    title: "Kort terskel 12 x 1 min",
    intensity: "Sone 4 Terskel",
    duration: 45,
    distance: 7,
    note: "Kortere drag kan ligge nær terskel, men stopp før det blir VO2-jag. Jevn følelse og korte pauser.",
  },
  easyRun: {
    type: "Løp",
    title: "Rolig aerob tur",
    intensity: "Sone 2 Rolig",
    duration: 45,
    distance: 7,
    note: "Lav intensitet er en del av metoden. Du skal kunne snakke rolig og avslutte friskere enn du startet.",
  },
  longRun: {
    type: "Løp",
    title: "Langtur halvmaraton",
    intensity: "Sone 2 Rolig",
    duration: 85,
    distance: 15,
    note: "Halvmaraton-spesifikk base. Hold mesteparten rolig, og legg bare inn Sone 3-blokker når ukebelastningen er stabil.",
  },
  hyrox: {
    type: "HYROX",
    title: "Daily HYROX 8-10 runder",
    intensity: "Sone 3 Maraton",
    duration: 55,
    distance: 3.2,
    note: "Torsdagsøkten: 8-10 sett med 400 m løp/sprint + basisøvelse. Eksempel: 50 pushups, 50 knebøy, 40 utfall, 40 situps, 30 burpees, 50 mountain climbers, planke og farmers carry.",
  },
  strength: {
    type: "Styrke",
    title: "Robust styrke",
    intensity: "Sone 1 Restitusjon",
    duration: 45,
    distance: 0,
    note: "Andre styrkedag. Prioriter skadeforebyggende bein, legger, hofte, kjerne og teknisk kvalitet.",
  },
  mobility: {
    type: "Mobilitet",
    title: "Mobilitet og restitusjon",
    intensity: "Sone 1 Restitusjon",
    duration: 25,
    distance: 0,
    note: "Når løpekvoten eller terskelbelastningen er brukt: lett mobilitet, gåtur og forberedelse til neste kvalitetsøkt.",
  },
};

const motivationQuotes = [
  "Kontrollert innsats slår sporadisk heroisk innsats.",
  "Nelson Mandela: It always seems impossible until it's done.",
  "Mark Twain: The secret of getting ahead is getting started.",
  "Du trenger ikke vinne dagen. Du trenger bare å møte opp for økten.",
  "Rolige kilometer er ikke kjedelige. De er fundamentet.",
];

const form = document.querySelector("#workoutForm");
const profileForm = document.querySelector("#profileForm");
const inputs = {
  date: document.querySelector("#dateInput"),
  type: document.querySelector("#typeInput"),
  title: document.querySelector("#titleInput"),
  duration: document.querySelector("#durationInput"),
  intensity: document.querySelector("#intensityInput"),
  warmup: document.querySelector("#warmupInput"),
  cooldown: document.querySelector("#cooldownInput"),
  sets: document.querySelector("#setsInput"),
  reps: document.querySelector("#repsInput"),
  weight: document.querySelector("#weightInput"),
  distance: document.querySelector("#distanceInput"),
  pace: document.querySelector("#paceInput"),
  rest: document.querySelector("#restInput"),
  avgHr: document.querySelector("#avgHrInput"),
  notes: document.querySelector("#notesInput"),
};
const profileInputs = {
  name: document.querySelector("#nameInput"),
  age: document.querySelector("#ageInput"),
  bodyWeight: document.querySelector("#bodyWeightInput"),
  vo2: document.querySelector("#vo2Input"),
  maxHr: document.querySelector("#maxHrInput"),
  restHr: document.querySelector("#restHrInput"),
  raceName: document.querySelector("#raceNameInput"),
  raceDate: document.querySelector("#raceDateInput"),
  raceDistance: document.querySelector("#raceDistanceInput"),
};

const list = document.querySelector("#workoutList");
const template = document.querySelector("#workoutTemplate");
const emptyState = document.querySelector("#emptyState");
const filterInput = document.querySelector("#filterInput");
const clearFormBtn = document.querySelector("#clearFormBtn");
const exportBtn = document.querySelector("#exportBtn");
const importInput = document.querySelector("#importInput");
const addPlanBtn = document.querySelector("#addPlanBtn");

const totals = {
  yearSessions: document.querySelector("#yearSessions"),
  yearStrengthMinutes: document.querySelector("#yearStrengthMinutes"),
  yearRunMinutes: document.querySelector("#yearRunMinutes"),
  populationComparison: document.querySelector("#populationComparison"),
  populationNote: document.querySelector("#populationNote"),
  motivationQuote: document.querySelector("#motivationQuote"),
  summary: document.querySelector("#activeSummary"),
  chart: document.querySelector("#barChart"),
  chartTotal: document.querySelector("#chartTotal"),
  zoneList: document.querySelector("#zoneList"),
  zoneBasis: document.querySelector("#zoneBasis"),
  profileStatus: document.querySelector("#profileStatus"),
  raceSummary: document.querySelector("#raceSummary"),
  planGrid: document.querySelector("#planGrid"),
  suggestionGrid: document.querySelector("#suggestionGrid"),
  suggestionSummary: document.querySelector("#suggestionSummary"),
};

let workouts = loadWorkouts();
let profile = loadProfile();
let editingId = null;

fillProfileForm();
inputs.date.valueAsDate = new Date();
render();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const workout = readForm();

  if (editingId) {
    workouts = workouts.map((item) => item.id === editingId ? { ...workout, id: editingId } : item);
    editingId = null;
  } else {
    workouts = [{ ...workout, id: crypto.randomUUID() }, ...workouts];
  }

  saveWorkouts();
  resetForm();
  render();
});

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  profile = readProfileForm();
  saveProfile();
  render();
});

clearFormBtn.addEventListener("click", resetForm);
filterInput.addEventListener("change", render);
exportBtn.addEventListener("click", exportCsv);
importInput.addEventListener("change", importCsv);
addPlanBtn.addEventListener("click", addPlanToLog);

function readForm() {
  return {
    date: inputs.date.value,
    type: inputs.type.value,
    title: inputs.title.value.trim(),
    duration: toNumber(inputs.duration.value),
    intensity: inputs.intensity.value,
    warmup: toNumber(inputs.warmup.value),
    cooldown: toNumber(inputs.cooldown.value),
    sets: toNumber(inputs.sets.value),
    reps: toNumber(inputs.reps.value),
    weight: toNumber(inputs.weight.value),
    distance: toNumber(inputs.distance.value),
    pace: inputs.pace.value.trim() || paceFromDurationAndDistance(toNumber(inputs.duration.value), toNumber(inputs.distance.value)),
    rest: toNumber(inputs.rest.value),
    avgHr: toNumber(inputs.avgHr.value),
    notes: inputs.notes.value.trim(),
    createdAt: new Date().toISOString(),
  };
}

function readProfileForm() {
  return Object.fromEntries(Object.entries(profileInputs).map(([key, input]) => {
    const value = input.value.trim();
    return [key, key === "name" || key === "raceName" || key === "raceDate" ? value : toNumber(value)];
  }));
}

function fillProfileForm() {
  for (const [key, input] of Object.entries(profileInputs)) {
    input.value = profile[key] || "";
  }
}

function resetForm() {
  form.reset();
  inputs.date.valueAsDate = new Date();
  inputs.intensity.value = "Sone 2 Rolig";
  inputs.type.value = "Løp";
  editingId = null;
  form.querySelector(".primary-button").textContent = "Lagre økt";
}

function render() {
  const filter = filterInput.value;
  const filtered = workouts
    .filter((workout) => filter === "Alle" || workout.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  renderMetrics();
  renderZones();
  renderRaceSummary();
  renderPlan();
  renderSuggestions();
  renderChart();
  renderList(filtered);
}

function renderRaceSummary() {
  const name = profile.raceName || "Neste konkurranse";
  const distance = profile.raceDistance ? `${formatNumber(profile.raceDistance)} km` : "Distanse ikke satt";
  const countdown = raceCountdown(profile.raceDate);

  totals.raceSummary.querySelector("span").textContent = name;
  totals.raceSummary.querySelector("strong").textContent = countdown.title;
  totals.raceSummary.querySelector("p").textContent = `${distance}. ${countdown.detail}`;
}

function renderMetrics() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekRuns = workouts.filter((workout) => {
    const workoutDate = new Date(`${workout.date}T12:00:00`);
    return workout.type === "Løp" && workoutDate >= weekStart;
  }).length;
  const minutes = sum(workouts.map((workout) => workout.duration));

  renderYearSummary();
  totals.summary.textContent = workouts.length
    ? `${workouts.length} økter lagret, ${minutes} minutter totalt, ${weekRuns}/4 løpedager denne uken.`
    : "Ingen økter registrert enda.";
}

function renderYearSummary() {
  const currentYear = new Date().getFullYear();
  const ytd = workouts.filter((workout) => new Date(`${workout.date}T12:00:00`).getFullYear() === currentYear);
  const strengthMinutes = sum(ytd
    .filter((workout) => workout.type === "Styrke" || workout.type === "HYROX")
    .map((workout) => workout.duration));
  const runMinutes = sum(ytd
    .filter((workout) => workout.type === "Løp")
    .map((workout) => workout.duration));
  const weekMinutes = getWeekMinutes();
  const recommendedShare = Math.round((weekMinutes / 150) * 100);

  totals.yearSessions.textContent = ytd.length;
  totals.yearStrengthMinutes.textContent = `${strengthMinutes} min`;
  totals.yearRunMinutes.textContent = `${runMinutes} min`;
  totals.populationComparison.textContent = `${recommendedShare} % av 150 min/uke`;
  totals.populationNote.textContent = weekMinutes >= 150
    ? "Du er over minimumsanbefalingen for voksne denne uken."
    : `${150 - weekMinutes} min igjen til minimumsanbefalingen denne uken.`;
  totals.motivationQuote.textContent = motivationQuotes[ytd.length % motivationQuotes.length];
}

function renderZones() {
  const maxHr = effectiveMaxHr();
  const restHr = profile.restHr || 0;
  const hasResting = restHr >= 30;
  const zones = calculateZones(maxHr, restHr);

  totals.profileStatus.textContent = profile.name
    ? `${profile.name}: ${profile.bodyWeight || "-"} kg, VO2 maks ${profile.vo2 || "-"}.`
    : "Legg inn data for personlige pulssoner.";
  totals.zoneBasis.textContent = maxHr
    ? `Soner beregnet fra ${profile.maxHr ? "oppgitt makspuls" : "220 minus alder"}${hasResting ? " og pulsreserve" : ""}.`
    : "Fyll inn alder eller makspuls for å beregne soner.";

  totals.zoneList.replaceChildren(...zones.map((zone) => {
    const item = document.createElement("article");
    item.className = "zone-card";
    item.innerHTML = `
      <div>
        <strong>${zone.key}</strong>
        <span>${zone.name}</span>
      </div>
      <b>${zone.low}-${zone.high} bpm</b>
      <em>${Math.round(zone.min * 100)}-${Math.round(zone.max * 100)} % av makspuls</em>
      <p>${zone.purpose}</p>
    `;
    return item;
  }));
}

function renderPlan() {
  totals.planGrid.replaceChildren(...plan.map((session) => {
    const card = document.createElement("article");
    card.className = "plan-card";
    card.dataset.type = session.type;
    card.innerHTML = `
      <div class="card-topline">
        <span class="date">${session.day}</span>
        <span class="tag">${session.type}</span>
      </div>
      <h3>${session.title}</h3>
      <div class="stats-row">
        <span class="stat-pill">${session.duration} min</span>
        <span class="stat-pill">${session.zone}</span>
        ${session.distance ? `<span class="stat-pill">${session.distance} km</span>` : ""}
      </div>
      <p>${session.note}</p>
    `;
    return card;
  }));
}

function renderSuggestions() {
  const suggestions = getRecommendedSessions();
  const weekRuns = getWeekRuns();
  const lastHard = daysSinceLastHardRun();

  totals.suggestionSummary.textContent = `Denne uken: ${weekRuns}/4 løpedager. ${
    lastHard === null ? "Ingen terskeløkt logget enda." : `Siste terskel/harde løp var for ${lastHard} dager siden.`
  }`;

  totals.suggestionGrid.replaceChildren(...suggestions.map((session, index) => {
    const card = document.createElement("article");
    card.className = "suggestion-card";
    card.dataset.type = session.type;
    card.innerHTML = `
      <div class="card-topline">
        <span class="date">${session.reason}</span>
        <span class="tag">${session.type}</span>
      </div>
      <h3>${session.title}</h3>
      <div class="stats-row">
        <span class="stat-pill">${session.duration} min</span>
        <span class="stat-pill">${session.intensity}</span>
        ${session.distance ? `<span class="stat-pill">${session.distance} km</span>` : ""}
      </div>
      <p>${session.note}</p>
      <button class="primary-button" type="button" data-suggestion="${index}">Legg til økt</button>
    `;
    card.querySelector("button").addEventListener("click", () => addSuggestionToLog(session));
    return card;
  }));
}

function getRecommendedSessions() {
  const today = new Date();
  const day = today.getDay();
  const weekRuns = getWeekRuns();
  const hardGap = daysSinceLastHardRun();
  const strengthThisWeek = getWeekCount(["Styrke", "HYROX"]);
  const suggestions = [];

  if (day === 4) {
    suggestions.push(withReason(suggestionLibrary.hyrox, "Torsdag"));
  }

  if (weekRuns >= 4) {
    suggestions.push(withReason(suggestionLibrary.strength, "Løpekvote brukt"));
    suggestions.push(withReason(suggestionLibrary.mobility, "Restitusjon"));
    return fillSuggestions(suggestions);
  }

  if (hardGap === null || hardGap >= 3) {
    suggestions.push(withReason(suggestionLibrary.thresholdLong, "Bakken terskel"));
  } else {
    suggestions.push(withReason(suggestionLibrary.easyRun, "Etter kvalitet"));
  }

  if (weekRuns <= 2) {
    suggestions.push(withReason(suggestionLibrary.longRun, "Halvmaraton"));
  } else {
    suggestions.push(withReason(suggestionLibrary.thresholdShort, "Kort kontroll"));
  }

  if (strengthThisWeek < 2) {
    suggestions.push(withReason(day === 4 ? suggestionLibrary.hyrox : suggestionLibrary.strength, "Styrke 2x"));
  }

  return fillSuggestions(suggestions);
}

function fillSuggestions(suggestions) {
  const fallbacks = [
    withReason(suggestionLibrary.easyRun, "Aerob base"),
    withReason(suggestionLibrary.strength, "Robusthet"),
    withReason(suggestionLibrary.mobility, "Lav belastning"),
  ];

  for (const fallback of fallbacks) {
    if (suggestions.length >= 3) break;
    if (!suggestions.some((item) => item.title === fallback.title)) {
      suggestions.push(fallback);
    }
  }

  return suggestions.slice(0, 3);
}

function withReason(session, reason) {
  return { ...session, reason };
}

function renderChart() {
  const days = lastSevenDays();
  const max = Math.max(1, ...days.map((day) => minutesForDate(day.iso)));
  const total = sum(days.map((day) => minutesForDate(day.iso)));

  totals.chartTotal.textContent = `${total} min`;
  totals.chart.replaceChildren(...days.map((day) => {
    const minutes = minutesForDate(day.iso);
    const item = document.createElement("div");
    item.className = "bar-item";
    item.title = `${day.label}: ${minutes} min`;
    item.innerHTML = `
      <div class="bar-track"><div class="bar-fill" style="height: ${(minutes / max) * 100}%"></div></div>
      <span>${day.short}</span>
    `;
    return item;
  }));
}

function renderList(items) {
  list.replaceChildren();
  emptyState.hidden = workouts.length > 0;

  for (const workout of items) {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.type = workout.type;
    node.querySelector(".date").textContent = formatDate(workout.date);
    node.querySelector(".tag").textContent = workout.type;
    node.querySelector("h3").textContent = workout.title;
    node.querySelector(".notes").textContent = workout.notes;
    node.querySelector(".stats-row").replaceChildren(...statPills(workout));
    node.querySelector(".edit").addEventListener("click", () => editWorkout(workout.id));
    node.querySelector(".delete").addEventListener("click", () => deleteWorkout(workout.id));
    list.append(node);
  }
}

function statPills(workout) {
  const stats = [
    workout.duration ? `${workout.duration} min` : "",
    normalizeZoneLabel(workout.intensity),
    workout.warmup ? `${workout.warmup} min oppvarming` : "",
    workout.cooldown ? `${workout.cooldown} min nedjogg` : "",
    workout.sets ? `${workout.sets} sett` : "",
    workout.reps ? `${workout.reps} reps` : "",
    workout.weight ? `${formatNumber(workout.weight)} kg` : "",
    workout.distance ? `${formatNumber(workout.distance)} km` : "",
    workout.pace ? `${workout.pace}/km` : "",
    workout.rest ? `${formatRest(workout.rest)} pause` : "",
    workout.avgHr ? `${workout.avgHr} bpm snitt` : "",
  ].filter(Boolean);

  return stats.map((stat) => {
    const pill = document.createElement("span");
    pill.className = "stat-pill";
    pill.textContent = stat;
    return pill;
  });
}

function editWorkout(id) {
  const workout = workouts.find((item) => item.id === id);
  if (!workout) return;

  editingId = id;
  for (const [key, input] of Object.entries(inputs)) {
    input.value = workout[key] ?? "";
  }
  inputs.intensity.value = normalizeZoneLabel(workout.intensity);
  form.querySelector(".primary-button").textContent = "Oppdater økt";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteWorkout(id) {
  workouts = workouts.filter((item) => item.id !== id);
  if (editingId === id) resetForm();
  saveWorkouts();
  render();
}

function addPlanToLog() {
  const monday = startOfWeek(new Date());
  const planned = plan
    .filter((session) => session.type !== "Mobilitet")
    .map((session) => ({
      id: crypto.randomUUID(),
      date: toIsoDate(shiftDate(monday, session.offset)),
      type: session.type,
      title: session.title,
      duration: session.duration,
      intensity: session.zone,
      warmup: session.type === "Løp" || session.type === "HYROX" ? 10 : 0,
      cooldown: session.type === "Løp" || session.type === "HYROX" ? 10 : 0,
      sets: session.type === "Løp" ? 0 : 8,
      reps: session.type === "Løp" ? 0 : 80,
      weight: 0,
      distance: session.distance,
      pace: "",
      rest: 0,
      avgHr: 0,
      notes: session.note,
      createdAt: new Date().toISOString(),
    }));

  workouts = [...planned, ...workouts];
  saveWorkouts();
  render();
}

function addSuggestionToLog(session) {
  workouts = [{
    id: crypto.randomUUID(),
    date: toIsoDate(new Date()),
    type: session.type,
    title: session.title,
    duration: session.duration,
    intensity: session.intensity,
    warmup: session.type === "Løp" || session.type === "HYROX" ? 10 : 0,
    cooldown: session.type === "Løp" || session.type === "HYROX" ? 10 : 0,
    sets: session.type === "Løp" || session.type === "Mobilitet" ? 0 : 8,
    reps: session.type === "Løp" || session.type === "Mobilitet" ? 0 : 80,
    weight: 0,
    distance: session.distance,
    pace: "",
    rest: 0,
    avgHr: 0,
    notes: session.note,
    createdAt: new Date().toISOString(),
  }, ...workouts];
  saveWorkouts();
  render();
}

function getWeekRuns() {
  return getWeekCount(["Løp"]);
}

function getWeekMinutes() {
  const weekStart = startOfWeek(new Date());
  return sum(workouts.filter((workout) => {
    const workoutDate = new Date(`${workout.date}T12:00:00`);
    return workoutDate >= weekStart;
  }).map((workout) => workout.duration));
}

function getWeekCount(types) {
  const weekStart = startOfWeek(new Date());
  return workouts.filter((workout) => {
    const workoutDate = new Date(`${workout.date}T12:00:00`);
    return types.includes(workout.type) && workoutDate >= weekStart;
  }).length;
}

function daysSinceLastHardRun() {
  const hardRuns = workouts
    .filter((workout) => workout.type === "Løp" && /terskel|Z4|Z5|Sone 4|Sone 5|VO2/i.test(`${workout.title} ${workout.intensity}`))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!hardRuns.length) return null;
  const last = new Date(`${hardRuns[0].date}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.max(0, Math.round((today - last) / 86400000));
}

function calculateZones(maxHr, restHr) {
  if (!maxHr) {
    return zoneDefinitions.map((zone) => ({ ...zone, low: 0, high: 0 }));
  }

  const reserve = restHr >= 30 ? maxHr - restHr : 0;
  return zoneDefinitions.map((zone) => {
    const low = reserve ? Math.round(restHr + reserve * zone.min) : Math.round(maxHr * zone.min);
    const high = reserve ? Math.round(restHr + reserve * zone.max) : Math.round(maxHr * zone.max);
    return { ...zone, low, high };
  });
}

function effectiveMaxHr() {
  if (profile.maxHr) return profile.maxHr;
  if (profile.age) return 220 - profile.age;
  return 0;
}

function exportCsv() {
  const header = ["date", "type", "title", "duration", "intensity", "warmup", "cooldown", "sets", "reps", "weight", "distance", "pace", "rest", "avgHr", "notes"];
  const rows = workouts.map((workout) => header.map((key) => csvCell(workout[key])).join(","));
  const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `treningslogg-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function importCsv(event) {
  const [file] = event.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const imported = parseCsv(String(reader.result));
    workouts = [...imported, ...workouts];
    saveWorkouts();
    render();
    importInput.value = "";
  });
  reader.readAsText(file);
}

function loadWorkouts() {
  try {
    const raw = localStorage.getItem(WORKOUT_KEY) || localStorage.getItem("treningslogg.workouts.v1");
    return raw ? JSON.parse(raw).map(normalizeWorkout) : sampleWorkouts();
  } catch {
    return sampleWorkouts();
  }
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveWorkouts() {
  localStorage.setItem(WORKOUT_KEY, JSON.stringify(workouts));
}

function saveProfile() {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function sampleWorkouts() {
  const today = new Date();
  const yesterday = shiftDate(today, -1);
  return [
    {
      id: crypto.randomUUID(),
      date: toIsoDate(today),
      type: "Løp",
      title: "Rolig tur",
      duration: 45,
      intensity: "Sone 2 Rolig",
      warmup: 8,
      cooldown: 8,
      sets: 0,
      reps: 0,
      weight: 0,
      distance: 7.2,
      pace: "6:15",
      rest: 0,
      avgHr: 142,
      notes: "Jevn pust og kontrollert puls.",
      createdAt: today.toISOString(),
    },
    {
      id: crypto.randomUUID(),
      date: toIsoDate(yesterday),
      type: "HYROX",
      title: "Daily HYROX",
      duration: 55,
      intensity: "Sone 3 Maraton",
      warmup: 10,
      cooldown: 10,
      sets: 8,
      reps: 50,
      weight: 0,
      distance: 3.2,
      pace: "",
      rest: 60,
      avgHr: 155,
      notes: "8 runder: 400 m løp + enkel basisøvelse, for eksempel pushups, knebøy, utfall og situps.",
      createdAt: yesterday.toISOString(),
    },
  ];
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = splitCsvLine(lines.shift() ?? "");
  const isGarmin = header.includes("Aktivitetstype") && header.includes("Dato") && header.includes("Tid");

  return lines.map((line) => {
    const values = splitCsvLine(line);
    const record = Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""]));
    if (isGarmin) return parseGarminRecord(record);
    return {
      id: crypto.randomUUID(),
      date: record.date || toIsoDate(new Date()),
      type: record.type || "Annet",
      title: record.title || "Importert økt",
      duration: toNumber(record.duration),
      intensity: normalizeZoneLabel(record.intensity || "Sone 2 Rolig"),
      warmup: toNumber(record.warmup),
      cooldown: toNumber(record.cooldown),
      sets: toNumber(record.sets),
      reps: toNumber(record.reps),
      weight: toNumber(record.weight),
      distance: toNumber(record.distance),
      pace: record.pace || paceFromDurationAndDistance(toNumber(record.duration), toNumber(record.distance)),
      rest: toNumber(record.rest),
      avgHr: toNumber(record.avgHr),
      notes: record.notes || "",
      createdAt: new Date().toISOString(),
    };
  });
}

function parseGarminRecord(record) {
  const duration = parseDurationMinutes(record.Tid);
  const title = record.Tittel || record.Aktivitetstype || "Garmin-økt";

  return {
    id: crypto.randomUUID(),
    date: parseGarminDate(record.Dato),
    type: mapGarminType(record.Aktivitetstype, title),
    title,
    duration,
    intensity: inferZoneFromHeartRate(toNumber(record["Gjennomsnittlig puls"])),
    warmup: title.toLowerCase().includes("oppvarming") ? 10 : 0,
    cooldown: title.toLowerCase().includes("nedjogg") ? 10 : 0,
    sets: toNumber(record["Totalt antall sett"]),
    reps: toNumber(record["Totalt antall repetisjoner"]),
    weight: 0,
    distance: toNumber(normalizeDecimal(record.Distanse)),
    pace: record["Gjennomsnittlig tempo"] && record["Gjennomsnittlig tempo"] !== "--" ? record["Gjennomsnittlig tempo"] : "",
    rest: 0,
    avgHr: toNumber(record["Gjennomsnittlig puls"]),
    notes: garminNotes(record),
    createdAt: new Date().toISOString(),
  };
}

function mapGarminType(activityType, title) {
  const combined = `${activityType} ${title}`.toLowerCase();
  if (combined.includes("løp") || combined.includes("running")) return "Løp";
  if (combined.includes("hyrox") || combined.includes("hiit")) return "HYROX";
  if (combined.includes("styrke") || combined.includes("strength")) return "Styrke";
  return "Annet";
}

function inferZoneFromHeartRate(avgHr) {
  const maxHr = effectiveMaxHr();
  if (!avgHr || !maxHr) return "Sone 2 Rolig";
  const share = avgHr / maxHr;
  if (share < 0.60) return "Sone 1 Restitusjon";
  if (share < 0.75) return "Sone 2 Rolig";
  if (share < 0.80) return "Sone 3 Maraton";
  if (share < 0.87) return "Sone 4 Terskel";
  return "Sone 5 VO2";
}

function garminNotes(record) {
  const parts = [
    record["Gjennomsnittlig tempo"] && record["Gjennomsnittlig tempo"] !== "--" ? `Tempo ${record["Gjennomsnittlig tempo"]}/km` : "",
    record.Makspuls && record.Makspuls !== "--" ? `Makspuls ${record.Makspuls}` : "",
    record["Aerob treningseffekt"] && record["Aerob treningseffekt"] !== "--" ? `Aerob effekt ${record["Aerob treningseffekt"]}` : "",
    record["Totale kalorier"] && record["Totale kalorier"] !== "--" ? `${record["Totale kalorier"]} kcal` : "",
  ].filter(Boolean);
  return parts.length ? `Importert fra Garmin. ${parts.join(", ")}.` : "Importert fra Garmin.";
}

function parseGarminDate(value) {
  const [date] = String(value || "").split(" ");
  return date || toIsoDate(new Date());
}

function parseDurationMinutes(value) {
  const parts = String(value || "").split(":").map((part) => Number.parseInt(part, 10));
  if (parts.length === 3) return Math.round(parts[0] * 60 + parts[1] + parts[2] / 60);
  if (parts.length === 2) return Math.round(parts[0] + parts[1] / 60);
  return toNumber(value);
}

function normalizeDecimal(value) {
  return String(value || "").replace(",", ".");
}

function splitCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }

  cells.push(cell);
  return cells;
}

function csvCell(value) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function minutesForDate(isoDate) {
  return sum(workouts.filter((workout) => workout.date === isoDate).map((workout) => workout.duration));
}

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(new Date(), index - 6);
    return {
      iso: toIsoDate(date),
      label: formatDate(toIsoDate(date)),
      short: date.toLocaleDateString("no-NO", { weekday: "short" }).replace(".", ""),
    };
  });
}

function startOfWeek(date) {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day);
  return copy;
}

function shiftDate(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function toNumber(value) {
  return Number.parseFloat(value) || 0;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function formatDate(isoDate) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("no-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value) {
  return new Intl.NumberFormat("no-NO", { maximumFractionDigits: 1 }).format(value);
}

function formatRest(seconds) {
  if (seconds < 60) return `${seconds} sek`;
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return restSeconds ? `${minutes}:${String(restSeconds).padStart(2, "0")} min` : `${minutes} min`;
}

function paceFromDurationAndDistance(durationMinutes, distanceKm) {
  if (!durationMinutes || !distanceKm) return "";
  const secondsPerKm = Math.round((durationMinutes * 60) / distanceKm);
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function raceCountdown(dateValue) {
  if (!dateValue) {
    return {
      title: "Ikke satt",
      detail: "Legg inn dato og distanse for å få nedtelling.",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const raceDate = new Date(`${dateValue}T00:00:00`);
  const days = Math.ceil((raceDate - today) / 86400000);

  if (days < 0) {
    return {
      title: "Gjennomført",
      detail: `Konkurransen var ${Math.abs(days)} dager siden.`,
    };
  }

  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  return {
    title: `${weeks} uker ${remainingDays} dager igjen`,
    detail: `Konkurransedato: ${formatDate(dateValue)}.`,
  };
}

function normalizeWorkout(workout) {
  return {
    ...workout,
    intensity: normalizeZoneLabel(workout.intensity),
  };
}

function normalizeZoneLabel(label) {
  return String(label || "")
    .replace(/^Z1\b/, "Sone 1")
    .replace(/^Z2\b/, "Sone 2")
    .replace(/^Z3\b/, "Sone 3")
    .replace(/^Z4\b/, "Sone 4")
    .replace(/^Z5\b/, "Sone 5");
}

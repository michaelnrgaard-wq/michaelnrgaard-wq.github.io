(function () {
  'use strict';

  // Skift koden her, og giv den til elevgruppen:
  var ADGANGSKODE = 'Epos1234';
  var SESSION_KEY = 'navnespil-adgang';

  var OPTION_COUNT = 4;
  var CORRECT_DELAY_MS = 900;
  var WRONG_DELAY_MS = 1800;

  var passcodeScreen = document.getElementById('ns-passcode-screen');
  var modeScreen = document.getElementById('ns-mode-screen');
  var gameScreen = document.getElementById('ns-game-screen');
  var passcodeForm = document.getElementById('ns-passcode-form');
  var passcodeInput = document.getElementById('ns-passcode-input');
  var passcodeError = document.getElementById('ns-passcode-error');
  var modeNavneBtn = document.getElementById('ns-mode-navne');
  var modeHuseBtn = document.getElementById('ns-mode-huse');
  var switchModeBtn = document.getElementById('ns-switch-mode');
  var photoEl = document.getElementById('ns-photo');
  var namecaptionEl = document.getElementById('ns-namecaption');
  var optionsEl = document.getElementById('ns-options');
  var feedbackEl = document.getElementById('ns-feedback');
  var scoreCorrectEl = document.getElementById('ns-score-correct');
  var scoreWrongEl = document.getElementById('ns-score-wrong');

  var allStudents = [];
  var activeList = [];
  var houses = [];
  var mode = null; // 'navne' | 'huse'
  var lastIndex = -1;
  var deck = [];
  var score = { correct: 0, wrong: 0 };
  var roundLocked = false;
  var dataPromise = null;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function refillDeck() {
    deck = activeList.map(function (_, i) { return i; });
    shuffle(deck);
    // Undgå at sidste elev fra forrige bunke bliver første i den nye.
    if (deck.length > 1 && deck[deck.length - 1] === lastIndex) {
      var swapWith = Math.floor(Math.random() * (deck.length - 1));
      var tmp = deck[deck.length - 1];
      deck[deck.length - 1] = deck[swapWith];
      deck[swapWith] = tmp;
    }
  }

  function pickTargetIndex() {
    if (activeList.length < 2) return 0;
    if (deck.length === 0) refillDeck();
    return deck.pop();
  }

  function buildNameOptions(targetIdx) {
    var pool = activeList.map(function (_, i) { return i; }).filter(function (i) { return i !== targetIdx; });
    shuffle(pool);
    var wrongIdx = pool.slice(0, OPTION_COUNT - 1);
    var all = wrongIdx.concat([targetIdx]);
    return shuffle(all).map(function (i) { return { key: i, label: activeList[i].name }; });
  }

  function buildHouseOptions(targetIdx) {
    var correctHouse = activeList[targetIdx].house;
    var wrongHouses = shuffle(houses.filter(function (h) { return h !== correctHouse; })).slice(0, OPTION_COUNT - 1);
    var all = wrongHouses.concat([correctHouse]);
    return shuffle(all).map(function (h) { return { key: h, label: h }; });
  }

  function startRound() {
    roundLocked = false;
    feedbackEl.textContent = '';
    var targetIdx = pickTargetIndex();
    lastIndex = targetIdx;
    var target = activeList[targetIdx];

    photoEl.src = target.image;
    photoEl.alt = 'Foto af en elev fra gruppen';

    var options, correctKey;
    if (mode === 'huse') {
      namecaptionEl.hidden = false;
      namecaptionEl.textContent = target.name;
      options = buildHouseOptions(targetIdx);
      correctKey = target.house;
    } else {
      namecaptionEl.hidden = true;
      namecaptionEl.textContent = '';
      options = buildNameOptions(targetIdx);
      correctKey = targetIdx;
    }

    optionsEl.innerHTML = '';
    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ns-option';
      btn.textContent = opt.label;
      btn.addEventListener('click', function () { handleAnswer(opt.key, correctKey, opt.label, btn); });
      optionsEl.appendChild(btn);
    });
  }

  function handleAnswer(chosenKey, correctKey, correctLabelFallback, chosenBtn) {
    if (roundLocked) return;
    roundLocked = true;

    var buttons = Array.prototype.slice.call(optionsEl.querySelectorAll('.ns-option'));
    buttons.forEach(function (b) { b.disabled = true; });

    var correctLabel = mode === 'huse' ? correctKey : activeList[correctKey].name;
    var correctBtn = buttons.filter(function (b) { return b.textContent === correctLabel; })[0];

    if (chosenKey === correctKey) {
      score.correct++;
      scoreCorrectEl.textContent = score.correct;
      chosenBtn.classList.add('is-correct');
      feedbackEl.textContent = 'Rigtigt!';
      setTimeout(startRound, CORRECT_DELAY_MS);
    } else {
      score.wrong++;
      scoreWrongEl.textContent = score.wrong;
      chosenBtn.classList.add('is-wrong');
      if (correctBtn) correctBtn.classList.add('is-correct');
      feedbackEl.textContent = 'Det var ' + correctLabel;
      setTimeout(startRound, WRONG_DELAY_MS);
    }
  }

  function ensureData() {
    if (!dataPromise) {
      dataPromise = fetch('/navneleg/elever.json')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          allStudents = data;
          houses = Array.from(new Set(data.map(function (s) { return s.house; }).filter(Boolean)));
        })
        .catch(function () {
          feedbackEl.textContent = 'Kunne ikke hente elevdata.';
          dataPromise = null;
          throw new Error('data-load-failed');
        });
    }
    return dataPromise;
  }

  function startMode(chosenMode) {
    modeScreen.hidden = true;
    gameScreen.hidden = false;
    feedbackEl.textContent = '';
    optionsEl.innerHTML = '';
    photoEl.src = '';

    ensureData().then(function () {
      mode = chosenMode;
      score = { correct: 0, wrong: 0 };
      scoreCorrectEl.textContent = '0';
      scoreWrongEl.textContent = '0';
      lastIndex = -1;
      deck = [];

      activeList = mode === 'huse'
        ? allStudents.filter(function (s) { return !!s.house; })
        : allStudents;

      if (activeList.length < OPTION_COUNT) {
        feedbackEl.textContent = 'Der mangler data til dette spil.';
        return;
      }
      startRound();
    }).catch(function () {});
  }

  function showModeSelect() {
    passcodeScreen.hidden = true;
    gameScreen.hidden = true;
    modeScreen.hidden = false;
    ensureData().catch(function () {});
  }

  function checkPasscode(value) {
    return value.trim().toLowerCase() === ADGANGSKODE.trim().toLowerCase();
  }

  passcodeForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (checkPasscode(passcodeInput.value)) {
      sessionStorage.setItem(SESSION_KEY, '1');
      passcodeError.textContent = '';
      showModeSelect();
    } else {
      passcodeError.textContent = 'Forkert kode — prøv igen.';
      passcodeInput.value = '';
      passcodeInput.focus();
    }
  });

  modeNavneBtn.addEventListener('click', function () { startMode('navne'); });
  modeHuseBtn.addEventListener('click', function () { startMode('huse'); });
  switchModeBtn.addEventListener('click', showModeSelect);

  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    showModeSelect();
  }
})();

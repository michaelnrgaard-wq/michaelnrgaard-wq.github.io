(function () {
  'use strict';

  // Skift koden her, og giv den til elevgruppen:
  var ADGANGSKODE = 'Epos1234';
  var SESSION_KEY = 'navnespil-adgang';

  var OPTION_COUNT = 4;
  var CORRECT_DELAY_MS = 900;
  var WRONG_DELAY_MS = 1800;

  var passcodeScreen = document.getElementById('ns-passcode-screen');
  var gameScreen = document.getElementById('ns-game-screen');
  var passcodeForm = document.getElementById('ns-passcode-form');
  var passcodeInput = document.getElementById('ns-passcode-input');
  var passcodeError = document.getElementById('ns-passcode-error');
  var photoEl = document.getElementById('ns-photo');
  var optionsEl = document.getElementById('ns-options');
  var feedbackEl = document.getElementById('ns-feedback');
  var scoreCorrectEl = document.getElementById('ns-score-correct');
  var scoreWrongEl = document.getElementById('ns-score-wrong');

  var students = [];
  var lastIndex = -1;
  var deck = [];
  var score = { correct: 0, wrong: 0 };
  var roundLocked = false;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function refillDeck() {
    deck = students.map(function (_, i) { return i; });
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
    if (students.length < 2) return 0;
    if (deck.length === 0) refillDeck();
    return deck.pop();
  }

  function buildOptions(targetIdx) {
    var pool = students.map(function (_, i) { return i; }).filter(function (i) { return i !== targetIdx; });
    shuffle(pool);
    var wrongIdx = pool.slice(0, OPTION_COUNT - 1);
    var all = wrongIdx.concat([targetIdx]);
    return shuffle(all);
  }

  function startRound() {
    roundLocked = false;
    feedbackEl.textContent = '';
    var targetIdx = pickTargetIndex();
    lastIndex = targetIdx;
    var target = students[targetIdx];
    var optionIdx = buildOptions(targetIdx);

    photoEl.src = target.image;
    photoEl.alt = 'Foto af en elev fra gruppen';

    optionsEl.innerHTML = '';
    optionIdx.forEach(function (idx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ns-option';
      btn.textContent = students[idx].name;
      btn.addEventListener('click', function () { handleAnswer(idx, targetIdx, btn); });
      optionsEl.appendChild(btn);
    });
  }

  function handleAnswer(chosenIdx, targetIdx, chosenBtn) {
    if (roundLocked) return;
    roundLocked = true;

    var buttons = Array.prototype.slice.call(optionsEl.querySelectorAll('.ns-option'));
    buttons.forEach(function (b) { b.disabled = true; });

    var correctBtn = buttons.filter(function (b) { return b.textContent === students[targetIdx].name; })[0];

    if (chosenIdx === targetIdx) {
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
      feedbackEl.textContent = 'Det var ' + students[targetIdx].name;
      setTimeout(startRound, WRONG_DELAY_MS);
    }
  }

  function showGame() {
    passcodeScreen.hidden = true;
    gameScreen.hidden = false;
    fetch('/navneleg/elever.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        students = data;
        if (students.length < OPTION_COUNT) {
          feedbackEl.textContent = 'Der mangler elevdata.';
          return;
        }
        startRound();
      })
      .catch(function () {
        feedbackEl.textContent = 'Kunne ikke hente elevbilleder.';
      });
  }

  function checkPasscode(value) {
    return value.trim().toLowerCase() === ADGANGSKODE.trim().toLowerCase();
  }

  passcodeForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (checkPasscode(passcodeInput.value)) {
      sessionStorage.setItem(SESSION_KEY, '1');
      passcodeError.textContent = '';
      showGame();
    } else {
      passcodeError.textContent = 'Forkert kode — prøv igen.';
      passcodeInput.value = '';
      passcodeInput.focus();
    }
  });

  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    showGame();
  }
})();

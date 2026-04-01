// i18n.js — Internationalization support (hu/en/de)

const I18n = {
  _lang: 'hu',

  _translations: {
    hu: {
      // Action buttons & navigation
      takePhoto: 'Fotózás',
      selectionDone: 'Kijelölés kész',
      solve: 'Megoldás!',
      newProblem: 'Új feladat',
      back: 'Vissza',
      apply: 'Alkalmaz',

      // Home screen
      homeTagline: 'Oldd meg az egyenletet lépésről lépésre!',
      typeEntry: 'Begépelés',
      typeEntrySubtitle: 'Írd be az egyenletet',
      photoEntry: 'Fotózás',
      photoEntrySubtitle: 'Fotózd le az egyenletet',

      // Camera & OCR
      recognizing: 'Felismerés...',
      original: 'Eredeti',
      recognized: 'Felismert képlet',
      lowConfidence: 'Alacsony felismerési biztonság - ellenőrizd a képletet!',
      cameraError: 'Kamera nem elérhető. Használd a fájlfeltöltést!',
      apiError: 'Hiba a képletfelismerésnél. Próbáld újra vagy írd be kézzel!',
      offline: 'Nincs internetkapcsolat. A felismerés nem elérhető.',
      selectImage: 'Kép kiválasztása',
      imageNotAvailable: 'Kép nem elérhető',
      originalImageNA: 'Eredeti (kép nem elérhető)',
      latexPlaceholder: 'LaTeX képlet...',

      // Solver rules
      startingEquation: 'Kiinduló egyenlet',
      expandParens: 'Zárójelek felbontása',
      subtractBothSides: 'Kivonás mindkét oldalból',
      addBothSides: 'Hozzáadás mindkét oldalhoz',
      simplify: 'Egyszerűsítés',
      divideBothSides: 'Osztás mindkét oldalon',
      multiplyBothSides: 'Szorzás mindkét oldalon',
      solution: 'Megoldás',
      directSolution: 'Közvetlen megoldás',
      noSolution: 'Nincs megoldás',
      expandInner: 'Belső zárójel felbontása',
      expandOuter: 'Zárójel felbontása',
      simplifyTerms: 'Összevonás',
      divideFirstHint: 'Mindkét oldal osztható',

      // Alternative paths
      alternativePath: 'Más út',
      altExpandDesc: 'A zárójelek felbontásával is megoldható',
      altDivideDesc: 'Először osztás mindkét oldalon',

      // Interactive board
      equation: 'Egyenlet',
      inputPlaceholder: 'pl. 2x + 3 = 7',
      dragHint: 'Húzd át a tagokat az egyenlőjel másik oldalára!',
      nextStep: 'Következő lépés',
      showAll: 'Teljes megoldás',
      freeRewrite: 'Átírás',
      rewritePlaceholder: 'pl. 5x - 3 = 12',

      // Errors & feedback
      errorParsing: 'Nem sikerült értelmezni az egyenletet. Próbáld egyszerűbb formában!',
      rewriteNeedsEquals: 'Az egyenletnek tartalmaznia kell egy = jelet',
      rewriteInvalid: 'Nem sikerült értelmezni az egyenletet',
      rewriteSolutionMismatch: 'Az átírt egyenlet megoldása nem egyezik az eredetivel!',
      nothingToExpand: 'Nincs mit felbontani',
      nothingToSimplify: 'Nincs mit egyszerűsíteni',
      divisionByZero: 'Nullával nem lehet osztani',
      actionError: 'A művelet nem sikerült',

      // Sessions sidebar
      equations: 'Egyenletek',
      deleted: 'Törölve.',
      undo: 'Visszavonás',
      delete_: 'Törlés',
      statusNew: 'Új',
      statusInProgress: 'Folyamatban',
      statusSolved: 'Megoldva',
      timeJustNow: 'most',
      timeMinutes: 'p.',
      timeHours: 'ó.',
      timeDays: 'nap'
    },

    en: {
      takePhoto: 'Take photo',
      selectionDone: 'Selection done',
      solve: 'Solve!',
      newProblem: 'New problem',
      back: 'Back',
      apply: 'Apply',

      homeTagline: 'Solve equations step by step!',
      typeEntry: 'Type it in',
      typeEntrySubtitle: 'Enter the equation',
      photoEntry: 'Take a photo',
      photoEntrySubtitle: 'Photograph the equation',

      recognizing: 'Recognizing...',
      original: 'Original',
      recognized: 'Recognized formula',
      lowConfidence: 'Low recognition confidence - please check the formula!',
      cameraError: 'Camera not available. Use file upload!',
      apiError: 'Recognition error. Try again or type it manually!',
      offline: 'No internet connection. Recognition is not available.',
      selectImage: 'Select image',
      imageNotAvailable: 'Image not available',
      originalImageNA: 'Original (image not available)',
      latexPlaceholder: 'LaTeX formula...',

      startingEquation: 'Starting equation',
      expandParens: 'Expand parentheses',
      subtractBothSides: 'Subtract from both sides',
      addBothSides: 'Add to both sides',
      simplify: 'Simplify',
      divideBothSides: 'Divide both sides',
      multiplyBothSides: 'Multiply both sides',
      solution: 'Solution',
      directSolution: 'Direct solution',
      noSolution: 'No solution',
      expandInner: 'Expand inner parentheses',
      expandOuter: 'Expand parentheses',
      simplifyTerms: 'Combine like terms',
      divideFirstHint: 'Both sides are divisible',

      alternativePath: 'Alternative',
      altExpandDesc: 'Can also be solved by expanding parentheses',
      altDivideDesc: 'Divide both sides first',

      equation: 'Equation',
      inputPlaceholder: 'e.g. 2x + 3 = 7',
      dragHint: 'Drag terms to the other side of the equation!',
      nextStep: 'Next step',
      showAll: 'Full solution',
      freeRewrite: 'Rewrite',
      rewritePlaceholder: 'e.g. 5x - 3 = 12',

      errorParsing: 'Could not parse the equation. Try a simpler form!',
      rewriteNeedsEquals: 'The equation must contain an = sign',
      rewriteInvalid: 'Could not parse the equation',
      rewriteSolutionMismatch: 'The rewritten equation has a different solution!',
      nothingToExpand: 'Nothing to expand',
      nothingToSimplify: 'Nothing to simplify',
      divisionByZero: 'Cannot divide by zero',
      actionError: 'Operation failed',

      equations: 'Equations',
      deleted: 'Deleted.',
      undo: 'Undo',
      delete_: 'Delete',
      statusNew: 'New',
      statusInProgress: 'In progress',
      statusSolved: 'Solved',
      timeJustNow: 'now',
      timeMinutes: 'min',
      timeHours: 'h',
      timeDays: 'days'
    },

    de: {
      takePhoto: 'Fotografieren',
      selectionDone: 'Auswahl fertig',
      solve: 'Lösen!',
      newProblem: 'Neue Aufgabe',
      back: 'Zurück',
      apply: 'Anwenden',

      homeTagline: 'Löse Gleichungen Schritt für Schritt!',
      typeEntry: 'Eingeben',
      typeEntrySubtitle: 'Gleichung eingeben',
      photoEntry: 'Fotografieren',
      photoEntrySubtitle: 'Gleichung fotografieren',

      recognizing: 'Erkennung...',
      original: 'Original',
      recognized: 'Erkannte Formel',
      lowConfidence: 'Niedrige Erkennungssicherheit - bitte Formel überprüfen!',
      cameraError: 'Kamera nicht verfügbar. Verwende den Datei-Upload!',
      apiError: 'Erkennungsfehler. Erneut versuchen oder manuell eingeben!',
      offline: 'Keine Internetverbindung. Erkennung nicht verfügbar.',
      selectImage: 'Bild auswählen',
      imageNotAvailable: 'Bild nicht verfügbar',
      originalImageNA: 'Original (Bild nicht verfügbar)',
      latexPlaceholder: 'LaTeX-Formel...',

      startingEquation: 'Ausgangsgleichung',
      expandParens: 'Klammern auflösen',
      subtractBothSides: 'Von beiden Seiten subtrahieren',
      addBothSides: 'Auf beiden Seiten addieren',
      simplify: 'Vereinfachen',
      divideBothSides: 'Beide Seiten dividieren',
      multiplyBothSides: 'Beide Seiten multiplizieren',
      solution: 'Lösung',
      directSolution: 'Direkte Lösung',
      noSolution: 'Keine Lösung',
      expandInner: 'Innere Klammer auflösen',
      expandOuter: 'Klammer auflösen',
      simplifyTerms: 'Zusammenfassen',
      divideFirstHint: 'Beide Seiten sind teilbar',

      alternativePath: 'Alternativer Weg',
      altExpandDesc: 'Kann auch durch Auflösen der Klammern gelöst werden',
      altDivideDesc: 'Zuerst beide Seiten dividieren',

      equation: 'Gleichung',
      inputPlaceholder: 'z.B. 2x + 3 = 7',
      dragHint: 'Ziehe Terme auf die andere Seite der Gleichung!',
      nextStep: 'Nächster Schritt',
      showAll: 'Vollständige Lösung',
      freeRewrite: 'Umschreiben',
      rewritePlaceholder: 'z.B. 5x - 3 = 12',

      errorParsing: 'Gleichung konnte nicht interpretiert werden. Versuche eine einfachere Form!',
      rewriteNeedsEquals: 'Die Gleichung muss ein = Zeichen enthalten',
      rewriteInvalid: 'Gleichung konnte nicht interpretiert werden',
      rewriteSolutionMismatch: 'Die umgeschriebene Gleichung hat eine andere Lösung!',
      nothingToExpand: 'Nichts aufzulösen',
      nothingToSimplify: 'Nichts zu vereinfachen',
      divisionByZero: 'Division durch Null nicht möglich',
      actionError: 'Operation fehlgeschlagen',

      equations: 'Gleichungen',
      deleted: 'Gelöscht.',
      undo: 'Rückgängig',
      delete_: 'Löschen',
      statusNew: 'Neu',
      statusInProgress: 'In Bearbeitung',
      statusSolved: 'Gelöst',
      timeJustNow: 'jetzt',
      timeMinutes: 'Min.',
      timeHours: 'Std.',
      timeDays: 'Tage'
    }
  },

  init() {
    this._lang = localStorage.getItem('crackthex_lang') || 'hu';
    this._updateStringsProxy();
    this.applyToDOM();
  },

  setLanguage(lang) {
    if (!this._translations[lang]) return;
    this._lang = lang;
    localStorage.setItem('crackthex_lang', lang);
    document.documentElement.lang = lang;
    this._updateStringsProxy();
    this.applyToDOM();
  },

  t(key) {
    const dict = this._translations[this._lang] || this._translations['hu'];
    return dict[key] || this._translations['hu'][key] || key;
  },

  applyToDOM() {
    document.documentElement.lang = this._lang;

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.dataset.i18n);
    });

    // Update elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });

    // Update elements with data-i18n-aria
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', this.t(el.dataset.i18nAria));
    });

    // Update language selector active state
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this._lang);
    });
  },

  _updateStringsProxy() {
    if (typeof STRINGS === 'undefined') return;
    const dict = this._translations[this._lang] || this._translations['hu'];
    const fallback = this._translations['hu'];
    for (const key of Object.keys(fallback)) {
      STRINGS[key] = dict[key] || fallback[key];
    }
  }
};

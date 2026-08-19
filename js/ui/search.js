/**
 * Instant Client-Side Search Controller.
 */

export class SearchController {
  /**
   * @param {Object} elements
   * @param {HTMLInputElement} elements.inputEl
   * @param {HTMLElement} elements.countEl
   * @param {HTMLButtonElement} elements.prevBtn
   * @param {HTMLButtonElement} elements.nextBtn
   * @param {Function} options.onSearch
   * @param {Function} options.onNavigate
   */
  constructor(elements, options = {}) {
    this.inputEl = elements.inputEl;
    this.countEl = elements.countEl;
    this.prevBtn = elements.prevBtn;
    this.nextBtn = elements.nextBtn;

    this.onSearch = options.onSearch;
    this.onNavigate = options.onNavigate;

    this.matches = [];
    this.currentMatchIndex = -1;
    this.debounceTimer = null;

    this.initEvents();
  }

  initEvents() {
    this.inputEl.addEventListener('input', () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.executeSearch(this.inputEl.value);
      }, 180); // debounced search for performance
    });

    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          this.navigatePrev();
        } else {
          this.navigateNext();
        }
      }
    });

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.navigatePrev());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.navigateNext());
    }
  }

  /**
   * Executes search query against active messages.
   * @param {string} query 
   */
  executeSearch(query) {
    const q = (query || '').trim();
    if (!q) {
      this.matches = [];
      this.currentMatchIndex = -1;
      this.updateUI();
      if (this.onSearch) this.onSearch(q, []);
      return;
    }

    if (this.onSearch) {
      this.matches = this.onSearch(q);
      this.currentMatchIndex = this.matches.length > 0 ? 0 : -1;
      this.updateUI();

      if (this.currentMatchIndex !== -1 && this.onNavigate) {
        this.onNavigate(this.matches[this.currentMatchIndex]);
      }
    }
  }

  navigatePrev() {
    if (this.matches.length === 0) return;
    this.currentMatchIndex = (this.currentMatchIndex - 1 + this.matches.length) % this.matches.length;
    this.updateUI();
    if (this.onNavigate) {
      this.onNavigate(this.matches[this.currentMatchIndex]);
    }
  }

  navigateNext() {
    if (this.matches.length === 0) return;
    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matches.length;
    this.updateUI();
    if (this.onNavigate) {
      this.onNavigate(this.matches[this.currentMatchIndex]);
    }
  }

  updateUI() {
    if (!this.countEl) return;

    if (this.matches.length === 0) {
      this.countEl.textContent = this.inputEl.value.trim() ? '0 results' : '';
      if (this.prevBtn) this.prevBtn.disabled = true;
      if (this.nextBtn) this.nextBtn.disabled = true;
    } else {
      this.countEl.textContent = `${this.currentMatchIndex + 1} of ${this.matches.length}`;
      if (this.prevBtn) this.prevBtn.disabled = false;
      if (this.nextBtn) this.nextBtn.disabled = false;
    }
  }
}

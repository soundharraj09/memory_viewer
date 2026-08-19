/**
 * "Who are you?" Participant Selector Controller.
 */

export class MeSelector {
  /**
   * @param {HTMLSelectElement} selectEl 
   * @param {Function} onChange 
   */
  constructor(selectEl, onChange) {
    this.selectEl = selectEl;
    this.onChange = onChange;
    this.activeMe = localStorage.getItem('wa_chat_me_sender') || null;

    if (this.selectEl) {
      this.selectEl.addEventListener('change', () => {
        const val = this.selectEl.value;
        this.activeMe = val === 'none' ? null : val;
        if (this.activeMe) {
          localStorage.setItem('wa_chat_me_sender', this.activeMe);
        } else {
          localStorage.removeItem('wa_chat_me_sender');
        }

        if (this.onChange) {
          this.onChange(this.activeMe);
        }
      });
    }
  }

  /**
   * Populates participant dropdown.
   * @param {Array<string>} participants 
   */
  setParticipants(participants) {
    if (!this.selectEl) return;
    this.selectEl.innerHTML = '<option value="none">Who are you? (Select Me)</option>';

    participants.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      if (this.activeMe && this.activeMe.toLowerCase() === p.toLowerCase()) {
        opt.selected = true;
      }
      this.selectEl.appendChild(opt);
    });

    if (this.onChange) {
      this.onChange(this.activeMe);
    }
  }
}

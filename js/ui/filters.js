/**
 * Multi-Criteria Filter Controller.
 */

export class FilterController {
  /**
   * @param {Object} elements
   * @param {HTMLSelectElement} elements.participantSelect
   * @param {HTMLSelectElement} elements.typeSelect
   * @param {HTMLInputElement} elements.fromDateInput
   * @param {HTMLInputElement} elements.toDateInput
   * @param {HTMLButtonElement} elements.resetBtn
   * @param {Function} options.onFilterChange
   */
  constructor(elements, options = {}) {
    this.participantSelect = elements.participantSelect;
    this.typeSelect = elements.typeSelect;
    this.fromDateInput = elements.fromDateInput;
    this.toDateInput = elements.toDateInput;
    this.resetBtn = elements.resetBtn;

    this.onFilterChange = options.onFilterChange;

    this.initEvents();
  }

  initEvents() {
    const trigger = () => {
      if (this.onFilterChange) {
        this.onFilterChange(this.getFilterState());
      }
    };

    if (this.participantSelect) this.participantSelect.addEventListener('change', trigger);
    if (this.typeSelect) this.typeSelect.addEventListener('change', trigger);
    if (this.fromDateInput) this.fromDateInput.addEventListener('change', trigger);
    if (this.toDateInput) this.toDateInput.addEventListener('change', trigger);

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.resetFilters();
        trigger();
      });
    }
  }

  /**
   * Populate participant dropdown menu.
   * @param {Array<string>} participants 
   */
  populateParticipants(participants) {
    if (!this.participantSelect) return;
    this.participantSelect.innerHTML = '<option value="all">All Participants</option>';
    
    participants.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      this.participantSelect.appendChild(opt);
    });
  }

  getFilterState() {
    return {
      participant: this.participantSelect ? this.participantSelect.value : 'all',
      type: this.typeSelect ? this.typeSelect.value : 'all',
      fromDate: this.fromDateInput && this.fromDateInput.value ? new Date(this.fromDateInput.value + 'T00:00:00') : null,
      toDate: this.toDateInput && this.toDateInput.value ? new Date(this.toDateInput.value + 'T23:59:59') : null
    };
  }

  resetFilters() {
    if (this.participantSelect) this.participantSelect.value = 'all';
    if (this.typeSelect) this.typeSelect.value = 'all';
    if (this.fromDateInput) this.fromDateInput.value = '';
    if (this.toDateInput) this.toDateInput.value = '';
  }

  /**
   * Filters an array of messages using criteria.
   * @param {Array<import('../models/message.js').Message>} messages 
   * @param {Object} filterState 
   * @param {string} searchQuery 
   * @returns {Array<import('../models/message.js').Message>}
   */
  static filterMessages(messages, filterState, searchQuery = '') {
    if (!messages) return [];

    const { participant, type, fromDate, toDate } = filterState;
    const query = searchQuery ? searchQuery.toLowerCase().trim() : '';

    return messages.filter(msg => {
      // Participant Filter
      if (participant !== 'all') {
        if (!msg.sender || msg.sender.toLowerCase() !== participant.toLowerCase()) {
          return false;
        }
      }

      // Message Type Filter
      if (type !== 'all') {
        if (type === 'text' && (msg.isSystem || msg.isMedia)) return false;
        if (type === 'media' && !msg.isMedia) return false;
        if (type === 'system' && !msg.isSystem) return false;
        if (type === 'links' && (!msg.links || msg.links.length === 0)) return false;
      }

      // Date Range Filter
      if (fromDate && msg.timestamp < fromDate) return false;
      if (toDate && msg.timestamp > toDate) return false;

      // Text Search Query
      if (query) {
        const textMatch = msg.text && msg.text.toLowerCase().includes(query);
        const senderMatch = msg.sender && msg.sender.toLowerCase().includes(query);
        if (!textMatch && !senderMatch) return false;
      }

      return true;
    });
  }
}

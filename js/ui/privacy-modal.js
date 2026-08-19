/**
 * Privacy Policy Assurance Modal.
 */

export class PrivacyModal {
  constructor(modalContainer) {
    this.modalContainer = modalContainer;
    this.closeBtn = modalContainer.querySelector('.modal-close');

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.hide());
    }

    this.modalContainer.addEventListener('click', (e) => {
      if (e.target === this.modalContainer) this.hide();
    });
  }

  show() {
    const body = this.modalContainer.querySelector('.modal-body');
    if (body) {
      body.innerHTML = `
        <div class="privacy-modal-content">
          <div class="privacy-modal-icon">🔒</div>
          <h2>100% Local Privacy Guarantee</h2>
          <p class="privacy-intro">
            This application processes your WhatsApp export file <strong>entirely inside your web browser's memory</strong>.
          </p>
          <ul class="privacy-checklist">
            <li>✅ No server upload — files never leave your device</li>
            <li>✅ No external API endpoints or databases</li>
            <li>✅ No account or login required</li>
            <li>✅ No tracking scripts, telemetry, or analytics</li>
            <li>✅ 100% offline capable after initial page load</li>
          </ul>
          <div class="privacy-callout">
            "Your chat stays on this device. Files are processed locally in your browser and are never uploaded."
          </div>
          <p class="privacy-footer-text">
            Closing this browser tab immediately clears all parsed chat data from memory.
          </p>
        </div>
      `;
    }

    this.modalContainer.classList.add('active');
  }

  hide() {
    this.modalContainer.classList.remove('active');
  }
}

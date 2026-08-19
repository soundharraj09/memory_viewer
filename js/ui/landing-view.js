/**
 * Landing Screen, Password Gate & Source File Selector Controller.
 */

const HARDCODED_PASSWORD = 'muffinladdu@#09';

export class LandingView {
  /**
   * @param {HTMLElement} landingContainer 
   * @param {Object} options
   * @param {Function} options.onFileSelected
   * @param {Function} options.onSourceFileSelected
   */
  constructor(landingContainer, options = {}) {
    this.container = landingContainer;
    this.onFileSelected = options.onFileSelected;
    this.onSourceFileSelected = options.onSourceFileSelected;

    this.dropZone = this.container.querySelector('.upload-dropzone');
    this.fileInput = this.container.querySelector('.file-input');
    this.progressContainer = this.container.querySelector('.parse-progress');
    this.progressLabel = this.container.querySelector('.progress-label');
    this.progressBarFill = this.container.querySelector('.progress-bar-fill');
    this.sourceFilesListEl = this.container.querySelector('#source-files-list');

    this.initEvents();
    this.renderSourceSection();
  }

  initEvents() {
    if (!this.dropZone || !this.fileInput) return;

    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleFile(e.target.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('drag-active');
      });
    });

    this.dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files.length > 0) {
        this.handleFile(dt.files[0]);
      }
    });
  }

  isUnlocked() {
    return sessionStorage.getItem('wa_source_unlocked') === 'true';
  }

  renderSourceSection() {
    if (!this.sourceFilesListEl) return;

    if (this.isUnlocked()) {
      this.fetchSourceFiles();
    } else {
      this.renderPasswordGate();
    }
  }

  renderPasswordGate() {
    this.sourceFilesListEl.innerHTML = `
      <div class="password-gate-card" style="padding: 16px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 8px;">
        <p style="font-size: 12.5px; color: var(--text-secondary); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
          🔒 Enter password to access local <code>Source_file</code> export folder:
        </p>
        <div style="display: flex; gap: 8px;">
          <input type="password" id="source-password-input" class="text-input" placeholder="Enter password..." style="flex: 1;" />
          <button id="unlock-source-btn" class="btn btn-primary" style="padding: 6px 14px; font-size: 12px; white-space: nowrap;">
            Unlock Files 🔓
          </button>
        </div>
        <div id="password-error-msg" style="font-size: 11.5px; color: #ef4444; margin-top: 8px; display: none;">
          ❌ Incorrect password. Access denied.
        </div>
      </div>
    `;

    const passInput = this.sourceFilesListEl.querySelector('#source-password-input');
    const unlockBtn = this.sourceFilesListEl.querySelector('#unlock-source-btn');
    const errorMsg = this.sourceFilesListEl.querySelector('#password-error-msg');

    const tryUnlock = () => {
      const val = passInput ? passInput.value : '';
      if (val === HARDCODED_PASSWORD) {
        sessionStorage.setItem('wa_source_unlocked', 'true');
        this.fetchSourceFiles();
      } else {
        if (errorMsg) errorMsg.style.display = 'block';
        if (passInput) passInput.focus();
      }
    };

    if (unlockBtn) unlockBtn.addEventListener('click', tryUnlock);
    if (passInput) {
      passInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') tryUnlock();
      });
    }
  }

  async fetchSourceFiles() {
    if (!this.sourceFilesListEl) return;

    try {
      const res = await fetch('/api/source-files');
      if (res.ok) {
        const files = await res.json();
        this.renderSourceFiles(files);
      } else {
        this.sourceFilesListEl.innerHTML = `
          <p style="font-size: 12px; color: var(--text-muted); padding: 10px;">
            No export files found in <code>Source_file</code> folder.
          </p>
        `;
      }
    } catch (e) {
      console.log('Error fetching source files list:', e);
      this.sourceFilesListEl.innerHTML = `
        <p style="font-size: 12px; color: var(--text-muted); padding: 10px;">
          Use the file box below to upload a WhatsApp export file.
        </p>
      `;
    }
  }

  renderSourceFiles(files) {
    if (!files || files.length === 0) {
      this.sourceFilesListEl.innerHTML = `
        <div style="padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
          <p style="font-size: 12px; color: var(--text-muted);">
            No files found in <code>Source_file/</code> folder.
          </p>
          <button id="relock-btn" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;">🔒 Lock</button>
        </div>
      `;
      const relockBtn = this.sourceFilesListEl.querySelector('#relock-btn');
      if (relockBtn) {
        relockBtn.addEventListener('click', () => {
          sessionStorage.removeItem('wa_source_unlocked');
          this.renderPasswordGate();
        });
      }
      return;
    }

    const filesHTML = files.map(file => `
      <div class="source-file-card" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
          <span style="font-size: 20px;">📄</span>
          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <div style="font-size: 13.5px; font-weight: 600; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
              ${file.name}
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">
              File Size: ${file.sizeFormatted}
            </div>
          </div>
        </div>
        <button class="btn btn-primary load-source-btn" data-path="${file.path}" data-name="${file.name}" style="padding: 6px 14px; font-size: 12px; white-space: nowrap;">
          Open Chat 🚀
        </button>
      </div>
    `).join('');

    this.sourceFilesListEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 11px; color: #00a884; font-weight: 600;">🔓 Source Files Unlocked</span>
        <button id="relock-btn" class="btn btn-secondary" style="padding: 3px 8px; font-size: 11px;">🔒 Lock</button>
      </div>
      ${filesHTML}
    `;

    const relockBtn = this.sourceFilesListEl.querySelector('#relock-btn');
    if (relockBtn) {
      relockBtn.addEventListener('click', () => {
        sessionStorage.removeItem('wa_source_unlocked');
        this.renderPasswordGate();
      });
    }

    const btns = this.sourceFilesListEl.querySelectorAll('.load-source-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const path = btn.getAttribute('data-path');
        const name = btn.getAttribute('data-name');
        if (this.onSourceFileSelected) {
          this.onSourceFileSelected(path, name);
        }
      });
    });
  }

  handleFile(file) {
    if (this.onFileSelected) {
      this.onFileSelected(file);
    }
  }

  showProgress(statusText = 'Parsing chat...', percentage = 0) {
    if (this.progressContainer) {
      this.progressContainer.classList.remove('hidden');
    }
    if (this.progressLabel) {
      this.progressLabel.textContent = statusText;
    }
    if (this.progressBarFill) {
      this.progressBarFill.style.width = `${percentage}%`;
    }
  }

  hideProgress() {
    if (this.progressContainer) {
      this.progressContainer.classList.add('hidden');
    }
  }

  show() {
    this.container.classList.remove('hidden');
    this.renderSourceSection();
  }

  hide() {
    this.container.classList.add('hidden');
  }
}

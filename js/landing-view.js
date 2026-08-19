/**
 * Landing Screen & Source File Selector Controller.
 */

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
    this.fetchSourceFiles();
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
            No pre-loaded export files found in <code>Source_file</code> folder.
          </p>
        `;
      }
    } catch (e) {
      console.log('Error fetching source files list:', e);
      this.sourceFilesListEl.innerHTML = `
        <p style="font-size: 12px; color: var(--text-muted); padding: 10px;">
          Use the file upload box below to select your WhatsApp export.
        </p>
      `;
    }
  }

  renderSourceFiles(files) {
    if (!files || files.length === 0) {
      this.sourceFilesListEl.innerHTML = `
        <p style="font-size: 12px; color: var(--text-muted); padding: 10px; background: var(--bg-secondary); border-radius: var(--radius-sm);">
          No files found in <code>Source_file/</code> folder. Use file picker below.
        </p>
      `;
      return;
    }

    this.sourceFilesListEl.innerHTML = files.map(file => `
      <div class="source-file-card" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 8px; transition: border-color 0.2s ease;">
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
          Load Chat 🚀
        </button>
      </div>
    `).join('');

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
  }

  hide() {
    this.container.classList.add('hidden');
  }
}

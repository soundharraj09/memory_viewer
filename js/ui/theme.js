/**
 * Theme Controller (Dark/Light Mode).
 */

export class ThemeController {
  /**
   * @param {HTMLButtonElement} toggleBtn 
   */
  constructor(toggleBtn) {
    this.toggleBtn = toggleBtn;
    this.currentTheme = localStorage.getItem('wa_chat_theme') || 'light';

    this.applyTheme(this.currentTheme);

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => {
        const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(nextTheme);
      });
    }
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wa_chat_theme', theme);

    if (this.toggleBtn) {
      this.toggleBtn.textContent = theme === 'dark' ? 'Light' : 'Dark';
    }
  }
}

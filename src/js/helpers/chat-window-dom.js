import throttle from 'lodash/throttle';
import Dom from './dom';

export default class ChatWindowDom extends Dom {
  constructor(html, domain) {
    super();
    this.html = html;
    this.currentDomain = domain;
    this.globalDom = new Dom(document.querySelector('html'));
    this.init();
  }

  init() {
    this.html
      .querySelector('.chat-toggle')
      .addEventListener('click', throttle(this.chatToggle.bind(this), 1000));
    this.html
      .querySelector('.pin-window')
      .addEventListener('click', this.togglePinned.bind(this));
    this.html
      .querySelector('.navbar-brand')
      .querySelector('span')
      .textContent = this.currentDomain;
  }

  chatToggle(event) {
    this.html.classList.toggle('visible');
    event.stopPropagation();
  }

  togglePinned(event) {
    this.html.classList.toggle('pinned');
    this.toggleGlobalMargin();
    event.stopPropagation();
  }

  toggleGlobalMargin() {
    console.log(this.globalDom.globalRightMargin);
    if (!this.globalDom.globalRightMargin || this.globalDom.globalRightMargin === '0px') {
      return this.globalDom.globalRightMargin = 340;
    }
    return this.globalDom.globalRightMargin = 0;
  }
}
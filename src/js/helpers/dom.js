export default class Dom {
  constructor(html) {
    this.html = html;
  };

  get globalRightMargin() {
    return this.html.style.marginRight;
  }

  set globalRightMargin(margin = 0) {
    this.html.style.marginRight = `${margin}px`;
  }

  toggleClass(toggle = '') {
    this.html.classList.toggle(toggle);
  }

};

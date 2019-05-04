import throttle from 'lodash/throttle';
import Dom from './dom';
import Firebase from './firebase';

export default class ChatWindowDom extends Dom {
  constructor(html, domain, firebaseUser) {
    super();
    this.firebaseUser = firebaseUser;
    this.firebase = new Firebase();
    this.html = html;
    this.currentDomain = domain;
    this.globalDom = new Dom(document.querySelector('html'));
    this.messageArea = this.html.querySelector('.message-area');
    this.panelMessageArea = this.messageArea.querySelector('.panel');
    this.textArea = this.html.querySelector('#text-message-input');
    this.controlMessageInput = this.html.querySelector('.control.message-input');
    this.sendButton = this.controlMessageInput.querySelector('a.button');
    this.alert = this.html.querySelector('.notification-warning');
    this.init();
  }

  async init() {
    this.textArea.focus();
    this.html
      .querySelector('.chat-toggle')
      .addEventListener('click', throttle(this.chatToggle.bind(this), 1000));
    this.html
      .querySelector('.pin-window')
      .addEventListener('click', this.togglePinned.bind(this));
    this.html
      .querySelector('.navbar-brand')
      .querySelector('span')
      .innerText = `Room: ${this.currentDomain}`;

    this.html
      .querySelector('#text-message-input')
      .addEventListener('input', this.processTextArea.bind(this));
    this.html
      .querySelector('#text-message-input')
      .addEventListener('keypress', this.onKeyPressed.bind(this));

    const user = await this.getCurrentUser();
    const { displayName, email } = user;
    if (!displayName) {
      this.setChatDisabled({ reason: 'You must set a username first' });
    } else {
      this.username = displayName;
      this.html
        .querySelector('.navbar-user')
        .querySelector('span')
        .innerText = `Logged in as: ${displayName}`;
      this.setChatEnabled();
      if (!email) {
        this.alert.innerHTML = `
          Save your username by <strong>login in</strong>
          <div class="form-wrap">
            <input class="input email-input" type="text" placeholder="Email">
            <a class="button is-primary">Login</a>
          </div>
        `;
        this.alert.style.display = 'block';
      }
    }
    this.sendButton.addEventListener('click', this.processTextArea.bind(this));
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
    if (!this.globalDom.globalRightMargin || this.globalDom.globalRightMargin === '0px') {
      return this.globalDom.globalRightMargin = 340;
    }
    return this.globalDom.globalRightMargin = 0;
  }

  async setUsername(username = null) {
    if (!username) return false;
    try {
      const response = await this.firebase.updateUserDisplayName(username);
      this.username = response.displayName;
    } catch (e) {
      console.error('Error setting username: ', e);
      return;
    }
  }

  async getCurrentUser() {
    return new Promise(async (fulfill, reject) => {
      const username = await this.firebase.getCurrentUser();
      if (!username) return fulfill(null);
      return fulfill(username);
    });
  }

  setChatDisabled({ reason }) {
    this.chatEnabled = false;
    this.textArea.rows = 1;
    this.textArea.setAttribute('maxlength', '24');
  }

  setChatEnabled() {
    this.chatEnabled = true;
    this.alert.style.display = 'none';
    this.sendButton.innerText = 'Send';
    this.textArea.placeholder = 'Write a message...';
    this.textArea.setAttribute('maxlength', '600');
    this.textArea.rows = 2;
    this.textArea.focus();
  }

  addMessageToList(message = null, author = null) {
    if (!message || !author) return;
    const newMessage = document.createElement('div');
    newMessage.classList.add('panel-block');
    newMessage.innerText = `${author}: ${message}`;
    this.panelMessageArea.appendChild(newMessage);
    this.panelMessageArea.scrollTo(0, this.panelMessageArea.scrollHeight);
  }

  sendMessageButtonPressed(event = null) {
    this.sendMessage(this.textArea.value);
  }

  sendMessage(message = null) {
    if (!message) return;
    this.addMessageToList(message, this.username);
  }

  async tryUsername(username = null) {
    if (!username) return;

    // Do things
    setTimeout(async () => {
      await this.setUsername(username);
      this.controlMessageInput.classList.remove('is-loading');
      this.textArea.disabled = false;
      this.sendButton.removeAttribute('disabled');
      this.setChatEnabled();
    }, 2000);
  }

  clearTextAreaOnEnter(event) {
    event.stopPropagation();
    event.preventDefault();
    this.textArea.value = '';
    this.textArea.focus();
  }

  checkUsername(username = null) {
    if (username === '') return true;
    return /^[0-9a-zA-Z_.-]+$/.test(username);
  }

  setMessageInputStatus(isUsernameValid = false) {
    if (!isUsernameValid) {
      this.textArea.classList.add('is-danger');
    } else {
      this.textArea.classList.remove('is-danger');
    }
  }

  processTextArea(event) {
    if (!this.chatEnabled) {
      const isUsernameValid = this.checkUsername(this.textArea.value);
      this.setMessageInputStatus(isUsernameValid);
    }
    
    if ((event.type === 'click') && (!this.chatEnabled)) {
      this.controlMessageInput.classList.add('is-loading');
      this.textArea.disabled = true;
      this.sendButton.setAttribute('disabled', true);
      console.log('Setting username: ' + this.textArea.value);
      this.tryUsername(this.textArea.value);
      this.clearTextAreaOnEnter(event);
    } else if ((event.type === 'click') && (this.chatEnabled)) {
      console.log('Sending message: ', this.textArea.value);
      this.sendMessage(this.textArea.value);
      this.clearTextAreaOnEnter(event);
    }
  }

  onKeyPressed(event) {
    const code = (event.keyCode ? event.keyCode : event.which);
    if ((code === 13) && (!this.chatEnabled)) {
      this.controlMessageInput.classList.add('is-loading');
      this.textArea.disabled = true;
      this.sendButton.setAttribute('disabled', true);
      console.log('Setting username: ' + this.textArea.value);
      this.tryUsername(this.textArea.value);
      this.clearTextAreaOnEnter(event);
    } else if ((code === 13) && (this.chatEnabled)) {
      console.log('Sending message: ', this.textArea.value);
      this.sendMessage(this.textArea.value);
      this.clearTextAreaOnEnter(event);
    }
  }
}
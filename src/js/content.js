import Dom from './helpers/dom';
import ChatWindowDom from './helpers/chat-window-dom';
import Firebase from './helpers/firebase';

import '../css/global.scss';

(function() {
  class Content {
    constructor() {
      this.create();
    }
    
    async create() {
      this.firebase = new Firebase();
      // await this.firebase.signOut();
      // debugger;

      this.firebase.getCurrentUser()
        .then(async (user) => {
          if (!user) {
            try {
              this.firebaseUser = (await this.firebase.signInAnon()).user;
              chrome.storage.local.get(['currentDomain'], async (result) => {
                this.currentDomain = result.currentDomain;
                const url = chrome.extension.getURL('chat-window.html');
                const cssUrl = chrome.extension.getURL('css/global.css');
                const chatWindowHtml = await this.getHTML(url);
                const css = await this.getHTML(cssUrl);
                this.injectHTML(chatWindowHtml, css);
              });
            } catch (e) {
              this.firebaseUser = null;
            }
          } else {
            this.firebaseUser = user;
            chrome.runtime.sendMessage({
              contentScriptQuery: 'getCurrentDomain',
            }, async (response) => {
              this.currentDomain = response.currentDomain;
              const url = chrome.extension.getURL('chat-window.html');
              const cssUrl = chrome.extension.getURL('css/global.css');
              const chatWindowHtml = await this.getHTML(url);
              const css = await this.getHTML(cssUrl);
              this.injectHTML(chatWindowHtml, css);
            });
          }
        });

    };

    async getHTML(url = null) {
      const response = await fetch(url);
      return await response.text();
    }

    injectHTML(html = null, css = null) {
      const body = document.body;
      const firstChild = body.childNodes[0];
      const chatRoot = document.createElement('div');

      chatRoot.attachShadow({ mode: 'open' });
      chatRoot.id = 'chat-everywhere';
      chatRoot.shadowRoot.innerHTML = `
        <style>${css}</style>
        ${html}
      `;

      const chatWindow = chatRoot.shadowRoot.querySelector('.chat-window');
      this.chatWindowDom = new ChatWindowDom(chatWindow, this.currentDomain, this.firebaseUser);
      return body.insertBefore(chatRoot, firstChild);
    }

  };
  new Content();
}());


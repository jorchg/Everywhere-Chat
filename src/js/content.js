import Dom from './helpers/dom';
import ChatWindowDom from './helpers/chat-window-dom';
import Firebase from './helpers/firebase';

import '../css/global.scss';

(function() {
  class Content {
    constructor() {
      this.create();
      this.firebase = new Firebase();
    }

    async create() {
      chrome.storage.local.get(['currentDomain'], async (result) => {
        this.currentDomain = result.currentDomain;
        const url = chrome.extension.getURL('chat-window.html');
        const cssUrl = chrome.extension.getURL('css/global.css');
        const chatWindowHtml = await this.getHTML(url);
        const css = await this.getHTML(cssUrl);
        this.injectHTML(chatWindowHtml, css);
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
      this.chatWindowDom = new ChatWindowDom(chatWindow, this.currentDomain);
      return body.insertBefore(chatRoot, firstChild);
    }

  };
  new Content();
}());


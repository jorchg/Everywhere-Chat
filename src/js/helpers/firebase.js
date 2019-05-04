export default class Firebase {
  constructor() {

  }

  async signInAnon() {
    return new Promise((fulfill, reject) => {
      chrome.runtime.sendMessage({
        contentScriptQuery: 'signInAnon',
      }, response => {
        if (!response) return reject(new Error('Operation invalid'));
        return fulfill(response);
      });
    });
  }

  async updateUserDisplayName(displayName = '') {
    return new Promise((fulfill, reject) => {
      chrome.runtime.sendMessage({
        contentScriptQuery: 'updateUserDisplayName',
        displayName,
      }, response => {
        if (!response) return reject(new Error('Operation invalid'));
        return fulfill(response);
      })
    });
  }

  getCurrentUser() {
    return new Promise((fulfill, reject) => {
      chrome.runtime.sendMessage({
        contentScriptQuery: 'getCurrentUser',
      }, response => {
        if (!response) return fulfill(null);
        if (response.user) return fulfill(response.user);
      });
    });
  }

  async signOut() {
    return new Promise((fulfill, reject) => {
      chrome.runtime.sendMessage({
        contentScriptQuery: 'signOut',
      }, response => {
        if (response.error) return reject(new Error('Operation invalid'));
        return fulfill(true);
      });
    });
  }
}
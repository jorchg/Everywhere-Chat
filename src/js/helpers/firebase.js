import * as firebase from 'firebase/app';
import config from '../../../config/index';

// Add the Firebase products that you want to use
import 'firebase/auth';
import 'firebase/firestore';

firebase.initializeApp(config.firebase);
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

export default class Firebase {
  constructor() {
    // return firebase;
    return this;
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
      }, response => fulfill());
    });
  }

  async setUserListener() {
    return new Promise((fulfill, reject) => {
      firebase.auth().onAuthStateChanged((user) => {
        return fulfill(user);
      });
    });
  }

  setMessageListener(callback) {
    chrome.runtime.onMessage.addListener(
      (request, sender, sendResponse) => {
        if ((request.action === 'linkAndRetrieveDataWithCredential') && (request.status === 'ok')) {
          callback({ action: request.action, status: 'ok', data: request.data });
        } else if ((request.action === 'linkAndRetrieveDataWithCredential') && (request.status === 'error')) {
          callback({ action: request.action, status: 'error', data: request.data.user.displayName });
        } else if ((request.action === 'updateUserDisplayName') && (request.status === 'ok')) {
          const data = {
            user: {
              displayName: request.data.user.displayName,
            },
          };
          callback({ action: request.action, status: 'ok', data });
        }
      });
  }

  getCurrentUser() {
    return new Promise((fulfill, reject) => {
      chrome.runtime.sendMessage({
        contentScriptQuery: 'getCurrentUser',
      }, response => {
        if (!response || !response.user) return fulfill(null);
        if (response.user) return fulfill(response.user);
      });
    });
  }

  async signInWithEmailLink(email = null) {
    return new Promise((fulfill, reject) => {
      chrome.runtime.sendMessage({
        contentScriptQuery: 'signInEmailLink',
        email,
      }, response => {
        if (!response) return fulfill();
        if (response.error) return reject(response.error);
        return fulfill(response);
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

  async setEmailLinkListener() {
    return new Promise((fulfill, reject) => {
      chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
          if ((request.action === 'linkAndRetrieveDataWithCredential') && (request.status === 'ok')) {
            return fulfill('sucess');
          } else if ((request.action === 'linkAndRetrieveDataWithCredential') && (request.status === 'error')) {
            return reject('error');
          }
          return true;
      });
    });
  }
}
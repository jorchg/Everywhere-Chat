import * as firebase from 'firebase/app';
import config from '../../config/index';

// Add the Firebase products that you want to use
import 'firebase/auth';
import 'firebase/firestore';

firebase.initializeApp(config.firebase);
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, ([currentTab]) => {
    chrome.storage.local.set({
      currentTab: JSON.stringify(currentTab),
      currentDomain: (new URL(currentTab.url)).hostname,
    });
  });
});

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.contentScriptQuery === 'signInAnon') {
      firebase.auth().signInAnonymously()
        .then(user => sendResponse({ user }))
        .catch((error) => {
          sendResponse(error.code)
        });
    }

    if (request.contentScriptQuery === 'updateUserDisplayName') {
      firebase.auth().currentUser.updateProfile({
        displayName: request.displayName,
      })
        .then(_ => sendResponse({ displayName: request.displayName }))
        .catch(error => sendResponse({ error }));
    }

    if (request.contentScriptQuery === 'getCurrentUser') {
      sendResponse({ user: firebase.auth().currentUser });
    }

    if (request.contentScriptQuery === 'signOut') {
      firebase.auth().signOut()
        .then(_ => sendResponse({ message: 'logged out' }))
        .catch(error => sendResponse({ error }));
    }
    return true;
  });

import * as firebase from 'firebase/app';
import config from '../../config/index';
import Firebase from '../js/helpers/firebase';

// Add the Firebase products that you want to use
import 'firebase/auth';
// import 'firebase/firestore';
// firebase.initializeApp(config.firebase);
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// const firebase = new Firebase();
const domain = config.firebase.hosting.domain;

function sendMessageToAll(message) {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, message);
    });
  });

}

function checkEmailLink(email, emailLink) {
  if (firebase.auth().isSignInWithEmailLink(emailLink)) {
    const credential = firebase.auth.EmailAuthProvider.credentialWithLink(
      email, emailLink);
  
    firebase.auth().currentUser.linkAndRetrieveDataWithCredential(credential)
      .then((usercred) => {
        sendMessageToAll({
          action: 'linkAndRetrieveDataWithCredential',
          status: 'ok',
          user: usercred.user,
        });
      })
      .catch((error) => {
        sendMessageToAll({
          action: 'linkAndRetrieveDataWithCredential',
          status: 'error',
          error,
        });
      });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, ([currentTab]) => {
    if (currentTab && currentTab.url) {
      const url = new URL(currentTab.url);
      const search = url.search;
      if (currentTab.url.includes(domain) && (currentTab.status === 'complete') && (search.includes('action=confirm'))) {
        console.log('currentTab: ', currentTab);
        chrome.storage.sync.get(['emailForSignin'], async (result) => {
          checkEmailLink(result.emailForSignin, currentTab.url);
        });
      }
  
      chrome.storage.local.set({
        currentTab: JSON.stringify(currentTab),
        currentDomain: (new URL(currentTab.url)).hostname,
      });
    }
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

    if (request.contentScriptQuery === 'signInEmailLink') {
      const { email } = request;
      const actionCodeSettings = {
        // URL must be whitelisted in the Firebase Console.
        url: 'https://everywhere-chat.firebaseapp.com/index.html?action=confirm',
        handleCodeInApp: true,
      };

      firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings)
        .then((_) => {
          chrome.storage.sync.set({
            emailForSignin: email,
          });
          sendResponse({ response: 'correct' })
        })
        .catch(error => sendResponse({ error }));
    }

    return true;
  });

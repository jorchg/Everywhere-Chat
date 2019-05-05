import * as firebase from 'firebase/app';
import config from '../../config/index';
import Firebase from '../js/helpers/firebase';
import Firestore from '../js/helpers/firestore';

// Add the Firebase products that you want to use
import 'firebase/auth';
// import 'firebase/firestore';
// firebase.initializeApp(config.firebase);
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// const firebase = new Firebase();
const firestore = new Firestore();

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
          data: {
            user: usercred.user
          },
        });
      })
      .catch((error) => {
        sendMessageToAll({
          action: 'linkAndRetrieveDataWithCredential',
          status: 'error',
          data: {
            error,
          },
        });
      });
  }
}

let currentDomain = {};
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, ([currentTab]) => {
    if (currentTab && currentTab.url) {
      currentDomain[`currentDomain-${currentTab.id}`] = (new URL(currentTab.url)).hostname;
      const url = new URL(currentTab.url);
      const search = url.search;
      if (currentTab.url.includes(domain) && (currentTab.status === 'complete') && (search.includes('action=confirm'))) {
        chrome.storage.sync.get(['emailForSignin'], async (result) => {
          checkEmailLink(result.emailForSignin, currentTab.url);
        });
      }
  
      const currentTabKey = `currentTab-${currentTab.id}`;
      const currentDomainKey = `currentDomain-${currentTab.id}`;
      const toSave = {};
      toSave[currentTabKey] = JSON.stringify(currentTab);
      toSave[currentDomainKey] = (new URL(currentTab.url)).hostname,
      chrome.storage.local.set(toSave);
    }
  });
});

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.contentScriptQuery === 'getCurrentDomain') {
      sendResponse({ currentDomain: currentDomain[`currentDomain-${sender.tab.id}`] });
    }

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
        .then((_) => {
          sendResponse('ok');
          sendMessageToAll({
            action: 'updateUserDisplayName',
            status: 'ok',
            data: {
              user: {
                displayName: request.displayName,
              },
            },
          });
        })
        .catch((error) => {
          sendResponse('error');
          sendMessageToAll({
            action: 'updateUserDisplayName',
            status: 'error',
            data: {
              error,
            },
          });
        });
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

    if (request.contentScriptQuery === 'getOrCreateRoom') {
      const { name, domain } = request;
      const data = {
        domain,
        name,
      };
      firestore.searchRoom(data)
        .then((roomSnap) => {
          if (roomSnap.empty) {
            const roomData = {
              ...data,
              users: 0,
              messages: 0,
              connected: 0,
              createdAt: new Date(),
            };
            firestore.setRoom(roomData)
              .then((newRoomRef) => {
                newRoomRef.get()
                  .then((newRoom) => {
                    const room = newRoom.data();
                    sendResponse({
                      uid: newRoomRef.id,
                      ...room,
                    });
                  });
              });
          } else {
            sendResponse({
              uid: roomSnap.docs[0].id,
              ...roomSnap.docs[0].data(),
            });
          }
        })
    }

    if (request.contentScriptQuery === 'addMessage') {
      const { room, user, message } = request;
      firestore.addMessage({ room, user, message })
        .then((written) => {
          sendResponse('ok');
        });
    }

    return true;
  });

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'messageChan') {
    port.onMessage.addListener((message) => {
      if (message.action === 'initSync') {
        firestore.initMessagesSnapshot({
          room: {
            uid: message.room.uid,
          },
        }, (snapshot) => {
          const docs = snapshot.docChanges().map((doc) => {
            const message = doc.doc.data();
            message['uid'] = doc.id;
            return {
              message,
              type: doc.type,
              oldIndex: doc.oldIndex,
              newIndex: doc.newIndex,
            }
          });
          port.postMessage({ data: docs });
        });
      }
    });
  }
});
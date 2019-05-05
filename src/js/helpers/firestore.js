import * as firebase from 'firebase/app';
import config from '../../../config/index';

import 'firebase/firestore';
import { DH_CHECK_P_NOT_PRIME } from 'constants';

export default class Firestore {
  constructor() {
    this.db = firebase.firestore();
    return this;
  }

  async searchRoom(data = null) {
    const { name, domain } = data;
    try {
      return await this.db.collection('rooms')
        .where('name', '==', name)
        .where('domain', '==', domain)
        .get();
    } catch (e) {
      throw e;
    }
  }

  async setRoom(data) {
    try {
      if (data.room && data.room.uid) {
        const { roomData, ...room } = data;
        return await this.db.collection('rooms')
          .doc(data.room.uid)
          .set(roomData, { merge: true })
      } else {
        return await this.db.collection('rooms')
          .add(data);
      }
    } catch (e) {
      throw e;
    }
  }

  async addMessage(data) {
    const { room, user, message } = data;
    try {
      return await this.db.collection('rooms')
        .doc(room.uid)
        .collection('messages')
        .add(message);
    } catch (e) {
      throw e;
    };
  }

  sendMessage(data) {
    chrome.runtime.sendMessage({
      contentScriptQuery: 'addMessage',
      ...data,
    });
  }

  initMessagesSnapshot(data, callback) {
    this.db.collection('rooms')
      .doc(data.room.uid)
      .collection('messages')
      .orderBy('sentAt', 'asc')
      .limit(100)
      .onSnapshot((snapshot) => {
        callback(snapshot);
      });
  }

  connectToListener(data, callback) {
    const roomUid = data.room.uid;
    const port = chrome.runtime.connect({ name: 'messageChan' });
    port.onMessage.addListener((message) => {
      callback(message);
    });
    port.postMessage({
      action: 'initSync',
      room: {
        uid: roomUid,
      },
    });
  }
}

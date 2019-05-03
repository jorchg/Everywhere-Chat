import * as firebase from 'firebase/app';
import * as config from '../../../config/index';

// Add the Firebase products that you want to use
import 'firebase/auth';
import 'firebase/firestore';

export default class Firebase {
  constructor() {
    firebase.initializeApp(config.firebase);
    return firebase;
  }
}
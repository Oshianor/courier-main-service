const firebase = require("firebase-admin");
const serviceAccount = require("../firebase-token.json");


firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://exalt-logistics.firebaseio.com",
});

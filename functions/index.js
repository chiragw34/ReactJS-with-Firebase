const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require("./util/fbAuth"); //Authentication for protected routes
const { db } = require("./util/admin");

const {
  getAllScreams,
  postOneScream,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream
} = require("./handlers/screams");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  markNotificationsRead,
  getUserDetails
} = require("./handlers/users");

//Scream routes
app.get("/screams", getAllScreams); // to get all screams on feed
app.get("/scream/:screamId", getScream); // to get a scream with scream id
app.get("/scream/:screamId/like", FBAuth, likeScream); // to like a scream with id
app.get("/scream/:screamId/unlike", FBAuth, unlikeScream); // to unlike a scream with id
app.post("/scream", FBAuth, postOneScream); // to post one scream on feed
app.post("/scream/:screamId/comment", FBAuth, commentOnScream); // to comment on a scream with id
app.delete("/scream/:screamId", FBAuth, deleteScream); // to delete scream with id

//User routes
app.get("/user", FBAuth, getAuthenticatedUser); // to get authenticated user
app.get("/user/:handle", getUserDetails); // to get user details using handle
app.post("/notifications", FBAuth, markNotificationsRead); // to mark notifications read
app.post("/signup", signup); // sign up the user
app.post("/login", login); // log in the user
app.post("/user/image", FBAuth, uploadImage); // to upload profile image
app.post("/user", FBAuth, addUserDetails); // to add details { bio, location, website }

exports.api = functions.region("asia-east2").https.onRequest(app);

// DB triggers
exports.createNotificationOnLike = functions
  .region("asia-east2")
  .firestore.document("likes/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            screamId: doc.id
          });
        }
      })
      .catch(err => console.error(err));
  });

exports.deleteNotificationOnUnlike = functions
  .region("asia-east2")
  .firestore.document("likes/{id}")
  .onDelete(snapshot => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("asia-east2")
  .firestore.document("comments/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            screamId: doc.id
          });
        }
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region("asia-east2")
  .firestore.document(`/users/{userId}`)
  .onUpdate(change => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log("image has changed");
      const batch = db.batch();
      return db
        .collection("screams")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then(data => {
          data.forEach(doc => {
            const scream = db.doc(`/screams/${doc.id}`);
            batch.update(scream, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onScreamDelete = functions
  .region("asia-east2")
  .firestore.document(`/screams/{screamId}`)
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("screamId", "==", screamId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection("likes").where("screamId", "==", screamId).get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db.collection("notifications").where("screamId", "==", screamId).get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(err => console.error(err));
  });

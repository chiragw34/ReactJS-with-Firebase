const functions = require("firebase-functions");

const app = require("express")();

const FBAuth = require("./util/fbAuth"); //Authentication for protected routes

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
  getAuthenticatedUser
} = require("./handlers/users");

//Scream routes
app.get("/screams", getAllScreams); // to get all screams on feed
app.post("/scream", FBAuth, postOneScream); // to post one scream on feed
app.get("/scream/:screamId", getScream); // to get a scream with scream id
app.delete("/scream/:screamId", FBAuth,deleteScream); // to delete scream with id
app.get("/scream/:screamId/like", FBAuth, likeScream); // to like a scream with id
app.get("/scream/:screamId/unlike", FBAuth, unlikeScream); // to unlike a scream with id
app.post("/scream/:screamId/comment", FBAuth, commentOnScream); // to comment on a scream with id 

//User routes
app.post("/signup", signup); // sign up the user
app.post("/login", login); // log in the user
app.post("/user/image", FBAuth, uploadImage); // to upload profile image
app.post("/user", FBAuth, addUserDetails); // to add details { bio, location, website }
app.get("/user", FBAuth, getAuthenticatedUser); // to get authenticated user 

exports.api = functions.region("asia-east2").https.onRequest(app);

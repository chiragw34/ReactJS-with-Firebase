const functions = require("firebase-functions");

const app = require("express")();

const FBAuth = require("./util/fbAuth");

const {
  getAllScreams,
  postOneScream,
  getScream,
  commentOnScream
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
//TODO delete scream
//TODO like a scream
//TODO unliking scream
app.post("/scream/:screamId/comment", FBAuth, commentOnScream);

//User routes
app.post("/signup", signup); // sign up the user
app.post("/login", login); // log in the user
app.post("/user/image", FBAuth, uploadImage); // to upload profile image
app.post("/user", FBAuth, addUserDetails); //to add details { bio, location, website }
app.get("/user", FBAuth, getAuthenticatedUser);

exports.api = functions.region("asia-east2").https.onRequest(app);

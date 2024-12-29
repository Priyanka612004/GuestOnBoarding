const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/GuestOnboarding");

const userSchema = mongoose.Schema({
  username: String,
  hotelname: String,
  email: String,
  password: String,
  bio: String,
  profileImage: String,
  name: String,
  address: String,
  isMainAdmin: { type: Boolean, default: false },
  isGuestAdmin: { type: Boolean, default: false },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "booking" }],
});
userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);

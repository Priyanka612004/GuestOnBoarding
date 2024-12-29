const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  picture: String,
  hotelname: String,
  caption: String,
  qrCode: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },

  date: {
    type: Date,
    default: Date.now,
  },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "booking" }],
});
module.exports = mongoose.model("post", postSchema);

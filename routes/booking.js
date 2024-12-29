const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  hotelname: String,
  name: String,
  email: String,
  phone: String,
  address: String,
  idProof: String,
  checkInDate: Date,
  checkOutDate: Date,
  purpose: {
    type: String,
    enum: ["business", "personal", "tourist"],
  },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("booking", bookingSchema);

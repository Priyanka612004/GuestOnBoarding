var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const bookingModel = require("./booking");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");
const QRCode = require("qrcode");
passport.use(new localStrategy(userModel.authenticate()));

router.get("/", function (req, res) {
  res.render("index", { footer: false });
});

router.get("/thankyou", function (req, res) {
  res.render("thankyou", { footer: false });
});
router.get("/login", function (req, res) {
  res.render("login", { footer: false });
});
router.get("/register", function (req, res) {
  res.render("register", { footer: false });
});

router.get("/logout", isLoggedIn, function (req, res, next) {
  res.redirect("/");
});

router.get("/feed", isLoggedIn, async function (req, res) {
  try {
    // Fetch the user and posts from the database
    const user = await postModel.find({ username: req.session.passport.user });
    const posts = await postModel.find().populate("user");

    // Iterate over each post and generate a unique QR code for each post
    const postsWithQrCodes = await Promise.all(
      posts.map(async (post) => {
        // Generate a unique QR code URL based on the post's unique ID
        const qrText = `${req.protocol}://${req.get("host")}/hotel/${post._id}`; // Generate a URL with the post ID
        // const qrText = `https://example.com/post/${post._id}`; // Unique URL for the post based on post ID
        const qrCode = await QRCode.toDataURL(qrText); // Generate QR code for the URL
        post.qrCode = await QRCode.toDataURL(qrText); // Generate a QR code for the URL

        // Create a new post object with the QR code (don't modify the original post object)
        const postWithQrCode = {
          ...post.toObject(), // Clone the post document to avoid modifying the original
          qrCode, // Add the QR code to the cloned object
        };
        return postWithQrCode;
      })
    );

    // Render the 'feed' template with posts, user, and unique QR codes for each post
    res.render("feed", {
      footer: true,
      isMainAdmin: req.user?.isMainAdmin || false,
      isGuestAdmin: req.user?.isGuestAdmin || false,
      posts: postsWithQrCodes,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching posts or generating QR codes");
  }
});

router.get("/guestbooked", isLoggedIn, async function (req, res) {
  res.render("guestbooked", {
    footer: true,
    isMainAdmin: req.user?.isMainAdmin || false,
    isGuestAdmin: req.user?.isGuestAdmin || false,
  });
});
router.get("/view/:bookingId", isLoggedIn, async function (req, res) {
  try {
    const bookingId = req.params.bookingId; // Get postId from the URL
    const booking = await bookingModel.findById(bookingId).populate("user"); // Fetch the post with user details

    if (!booking) {
      return res.status(404).send("Hotel not found.");
    }

    res.render("view", {
      footer: true,
      isMainAdmin: req.user?.isMainAdmin || false,
      isGuestAdmin: req.user?.isGuestAdmin || false,
      booking,
    }); // Pass only the specific post
  } catch (err) {
    console.error("Error fetching hotel post:", err);
    res.status(500).send("An error occurred.");
  }
});
router.get("/editform/:bookingId", isLoggedIn, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = await bookingModel.findById(bookingId); // Find the booking by its ID

    if (!booking) {
      return res.status(404).send("Booking not found.");
    }

    res.render("editform", { booking }); // Pass the booking details to the edit page
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).send("An error occurred.");
  }
});
router.get("/deleteBookingguest/:bookingId", isLoggedIn, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = await bookingModel.findById(bookingId); // Find the booking by its ID

    if (!booking) {
      return res.status(404).send("Booking not found.");
    }

    res.render("deleteBookingguest", { booking }); // Pass the booking details to the edit page
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).send("An error occurred.");
  }
});
router.get("/deleteBooking/:bookingId", isLoggedIn, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = await bookingModel.findById(bookingId); // Find the booking by its ID

    if (!booking) {
      return res.status(404).send("Booking not found.");
    }

    res.render("deleteBooking", { booking }); // Pass the booking details to the edit page
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).send("An error occurred.");
  }
});
router.get("/deletePost/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;

    // Find and delete the post
    const deletedPost = await postModel.findByIdAndDelete(postId);

    if (!deletedPost) {
      return res.status(404).send("Post not found.");
    }

    console.log(`Post with ID: ${postId} deleted successfully.`);
    res.redirect("/profile"); // Replace with the appropriate redirect route
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).send("An error occurred.");
  }
});

router.get("/profile", isLoggedIn, async function (req, res) {
  const user = await userModel
    .findOne({
      username: req.session.passport.user,
    })
    .populate("posts");
  res.render("profile", {
    footer: true,
    isMainAdmin: req.user?.isMainAdmin || false,
    isGuestAdmin: req.user?.isGuestAdmin || false,
    user,
  });
});

router.get("/edit", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("edit", {
    footer: true,
    isMainAdmin: req.user?.isMainAdmin || false,
    isGuestAdmin: req.user?.isGuestAdmin || false,
    user,
  });
});
router.get("/hotelform/:postId", isLoggedIn, async function (req, res) {
  try {
    const postId = req.params.postId; // Extract the postId from the URL
    const post = await postModel.findById(postId).populate("user"); // Fetch the post details along with the user

    if (!post) {
      return res.status(404).send("Hotel form data not found.");
    }

    // Fetch the logged-in user
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    res.render("hotelform", {
      footer: true,
      isMainAdmin: req.user?.isMainAdmin || false,
      isGuestAdmin: req.user?.isGuestAdmin || false,
      post,
      user,
    }); // Pass both post and user data to the form
  } catch (err) {
    console.error("Error fetching hotel form data:", err);
    res.status(500).send("An error occurred.");
  }
});

router.get("/upload", isLoggedIn, function (req, res) {
  res.render("upload", {
    footer: true,
    isMainAdmin: req.user?.isMainAdmin || false,
    isGuestAdmin: req.user?.isGuestAdmin || false,
  });
});
router.get("/guestpanel", isLoggedIn, async function (req, res) {
  const bookings = await bookingModel.find().populate("user");
  res.render("guestpanel", {
    footer: true,
    isMainAdmin: req.user?.isMainAdmin || false,
    isGuestAdmin: req.user?.isGuestAdmin || false,
    bookings,
  });
});
router.get("/guestadminpanel", isLoggedIn, async function (req, res) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("bookings");
  res.render("guestadminpanel", {
    footer: true,
    isMainAdmin: req.user?.isMainAdmin || false,
    isGuestAdmin: req.user?.isGuestAdmin || false,
    user,
  });
});
router.get("/hotel/:postId", isLoggedIn, async function (req, res) {
  try {
    const postId = req.params.postId; // Get postId from the URL
    const post = await postModel.findById(postId).populate("user"); // Fetch the post with user details

    if (!post) {
      return res.status(404).send("Hotel not found.");
    }

    res.render("hotel", {
      footer: true,
      isMainAdmin: req.user?.isMainAdmin || false,
      isGuestAdmin: req.user?.isGuestAdmin || false,
      post,
    }); // Pass only the specific post
  } catch (err) {
    console.error("Error fetching hotel post:", err);
    res.status(500).send("An error occurred.");
  }
});

router.get("/username/:username", isLoggedIn, async function (req, res) {
  const regex = new RegExp(`^${req.params.username}`, "i");
  const users = await userModel.find({ username: regex });
  res.json(users);
});

router.post("/register", function (req, res, next) {
  // Validate that username, name, and password are at least 6 characters long
  const { username, name, password, email } = req.body;

  if (username.length < 6 || name.length < 6 || password.length < 6) {
    return res
      .status(400)
      .send("Username, name, and password must be at least 6 characters long.");
  }

  const userData = new userModel({
    username: username,
    name: name,
    email: email,
  });

  userModel
    .register(userData, password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/feed");
      });
    })
    .catch(function (err) {
      next(err); // Handle errors (e.g., if the email is already registered)
    });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/feed",
    failureRedirect: "/login",
  }),
  function (req, res) {}
);

router.post("/update", upload.single("image"), async function (req, res) {
  const user = await userModel.findOneAndUpdate(
    { username: req.session.passport.user },
    { username: req.body.username, name: req.body.name, bio: req.body.bio },
    { new: true }
  );
  if (req.file) {
    user.profileImage = req.file.filename;
  }
  await user.save();
  res.redirect("/profile");
});

router.post(
  "/upload",
  isLoggedIn,
  upload.single("image"),
  async function (req, res) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    const post = await postModel.create({
      picture: req.file.filename,
      user: user._id,
      hotelname: req.body.hotelname,
      caption: req.body.caption,
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect("/feed");
  }
);

router.post("/hotelform/:postId", isLoggedIn, async (req, res) => {
  try {
    const postId = req.params.postId; // Capture the postId from the URL
    const post = await postModel.findById(postId); // Fetch the post using postId

    if (!post) {
      return res.status(404).send("Hotel post not found.");
    }

    // Fetch the user from the session
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Ensure bookings array exists
    user.bookings = Array.isArray(user.bookings) ? user.bookings : [];
    post.bookings = Array.isArray(post.bookings) ? post.bookings : [];

    // Create a new booking linked to the user and the hotel post
    const booking = new bookingModel({
      user: user._id,
      hotel: postId, // Link the booking to the specific hotel post
      hotelname: post.hotelname, // Optionally fetch hotel name from the post
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      purpose: req.body.purpose,
      idProof: req.body.idProof,
      checkInDate: req.body.checkInDate,
      checkOutDate: req.body.checkOutDate,
    });

    // Push the booking into both the user's bookings and the post's bookings
    user.bookings.push(booking._id);
    post.bookings.push(booking._id);

    await booking.save();
    await user.save();
    await post.save();

    // After successful booking, render the guestbooked page with the booking data
    res.render("guestbooked", {
      footer: true,
      booking, // Pass the booking data to the template
    });
  } catch (err) {
    console.error("Error processing hotel form submission:", err); // Log the specific error
    res
      .status(500)
      .send(`An error occurred while processing your booking: ${err.message}`);
  }
});
router.post("/editform/:bookingId", isLoggedIn, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const {
      hotelname,
      name,
      phone,
      address,
      checkInDate,
      checkOutDate,
      purpose,
    } = req.body;

    // Find the booking by its ID and update only the relevant fields
    const editformBooking = await bookingModel.findByIdAndUpdate(
      bookingId, // Keep the same ID
      { hotelname, name, phone, address, checkInDate, checkOutDate, purpose }, // Only update these fields
      { new: true } // Return the updated document
    );

    if (!editformBooking) {
      return res.status(404).send("Booking not found.");
    }

    // After successful update, redirect to the updated booking's view page
    res.redirect("/view/" + editformBooking._id); // Redirect to the view page with updated data
  } catch (err) {
    console.error("Error updating booking:", err);
    res.status(500).send("An error occurred.");
  }
});
router.post("/deleteBookingguest/:bookingId", isLoggedIn, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    // Find the booking to delete
    const booking = await bookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).send("Booking not found.");
    }

    // Remove the booking reference from the user's 'bookings' array
    await userModel.updateOne(
      { _id: booking.user }, // Find the user associated with this booking
      { $pull: { bookings: bookingId } } // Remove the booking reference
    );

    // Remove all posts associated with this booking
    await postModel.deleteMany({ booking: bookingId });

    // Delete the booking
    await bookingModel.findByIdAndDelete(bookingId);

    console.log(
      `Booking with ID: ${bookingId} and its related posts have been deleted.`
    );

    // Redirect or send a response
    res.redirect("/guestpanel"); // Replace with your desired redirect
  } catch (err) {
    console.error("Error deleting booking:", err);
    res.status(500).send("An error occurred.");
  }
});
router.post("/deleteBooking/:bookingId", isLoggedIn, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    // Find the booking to delete
    const booking = await bookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).send("Booking not found.");
    }

    // Remove the booking reference from the user's 'bookings' array
    await userModel.updateOne(
      { _id: booking.user }, // Find the user associated with this booking
      { $pull: { bookings: bookingId } } // Remove the booking reference
    );

    // Remove all posts associated with this booking
    await postModel.deleteMany({ booking: bookingId });

    // Delete the booking
    await bookingModel.findByIdAndDelete(bookingId);

    console.log(
      `Booking with ID: ${bookingId} and its related posts have been deleted.`
    );

    // Redirect or send a response
    res.redirect("/guestadminpanel"); // Replace with your desired redirect
  } catch (err) {
    console.error("Error deleting booking:", err);
    res.status(500).send("An error occurred.");
  }
});

router.post("/deletePost/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;

    // Delete the post
    const deletedPost = await postModel.findByIdAndDelete(postId);

    if (!deletedPost) {
      return res.status(404).send("Post not found.");
    }

    // Remove the post reference from the user
    await userModel.updateOne({ posts: postId }, { $pull: { posts: postId } });

    console.log(`Post with ID: ${postId} deleted successfully.`);
    res.redirect("/profile"); // Replace with the appropriate redirect route
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).send("An error occurred.");
  }
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}
module.exports = router;

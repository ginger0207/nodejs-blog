const express = require("express");
const router = express.Router({ mergeParams: true });
const multer = require("multer");
const upload = multer({ dest: "uploads" });

const user = require("../controllers/user");
const mw = require("../middleware");
const {
  asyncErrorHandler,
  isLoggedIn,
  getCurrentUserAndOwner,
  isBlogOwner,
} = require("../middleware/index");

/* /:user/profile */
router.use(getCurrentUserAndOwner);

// GET user profile
router.get("/", asyncErrorHandler(user.profileShow));

// DELETE user account
router.delete("/", isBlogOwner, asyncErrorHandler(user.userDelete));

// UPDATE about
router.put("/about", isBlogOwner, asyncErrorHandler(user.aboutUpdate));

// UPDATE avatar
router.put(
  "/avatar",
  upload.single("avatar"),
  asyncErrorHandler(user.avatarUpdate)
);

module.exports = router;

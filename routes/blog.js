const express = require("express");
const router = express.Router({ mergeParams: true });
const multer = require("multer");
const upload = multer({ dest: "uploads" });

const blog = require("../controllers/blog");
const {
  asyncErrorHandler,
  isLoggedIn,
  getCurrentUserAndOwner,
  isBlogOwner,
  isCommentOwner,
} = require("../middleware/index");

/* /:user/blog */
router.use(getCurrentUserAndOwner);

// GET post all
router.get("/", blog.postAll);

// GET posts of specified tag
router.get("/tag/:tag_name", asyncErrorHandler(blog.postAll_tag));

// GET post show
router.get("/post/:post_id", asyncErrorHandler(blog.postShow));

// GET post new
router.get("/postNew", isBlogOwner, asyncErrorHandler(blog.postNew));
// POST post create
router.post("/postCreate", isBlogOwner, asyncErrorHandler(blog.postCreate));

// GET post edit
router.get(
  "/post/:post_id/edit",
  isBlogOwner,
  asyncErrorHandler(blog.postEdit)
);
// PUT post update
router.put("/post/:post_id", isBlogOwner, asyncErrorHandler(blog.postUpdate));
// DELETE post
router.delete(
  "/post/:post_id",
  isBlogOwner,
  asyncErrorHandler(blog.postDestroy)
);

// POST comment create
router.post(
  "/post/:post_id/comment",
  isLoggedIn,
  asyncErrorHandler(blog.commentCreate)
);
// PUT comment update
router.put(
  "/post/:post_id/comment/:comment_id",
  isCommentOwner,
  asyncErrorHandler(blog.commentUpdate)
);
// DELETE comment
router.delete(
  "/post/:post_id/comment/:comment_id",
  isCommentOwner,
  asyncErrorHandler(blog.commentDestroy)
);

// POST image upload
router.post(
  "/image",
  upload.single("image"),
  isBlogOwner,
  asyncErrorHandler(blog.imageUpload)
);

module.exports = router;

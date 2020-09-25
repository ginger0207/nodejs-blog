const express = require("express");
const router = express.Router();

// For updating data
// const multer = require('multer');
// const upload = multer();

const index = require("../controllers/index");
const { asyncErrorHandler } = require("../middleware/index");

/* GET landing page */
router.get("/", asyncErrorHandler(index.landingPage));

/* GET all posts */
router.get("/allPosts", asyncErrorHandler(index.showAllPosts));

/* GET search post */
router.get("/search", asyncErrorHandler(index.postSearch));

/* GET /register */
router.get("/register", index.getRegister);

/* POST /register */
router.post("/register", asyncErrorHandler(index.postRegister));

/* GET /login */
router.get("/login", index.getLogin);

/* POST /login */
router.post("/login", asyncErrorHandler(index.postLogin));

/* GET /logout */
router.get("/logout", index.getLogout);

/* GET /forgot-password */
router.get("/forgot-password", index.getForgotPw);

/* PUT /forgot-password */
router.put("/forgot-password", asyncErrorHandler(index.putForgotPw));

/* GET /reset-password */
router.get("/reset-password/:token", asyncErrorHandler(index.getResetPw));

/* PUT /reset-password */
router.put("/reset-password/:token", asyncErrorHandler(index.putResetPw));

module.exports = router;

const bcrypt = require("bcrypt");
const passport = require("passport");
const util = require("util");
const db = require("../db/database");
const cloudinary = require("cloudinary").v2;
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");

cloudinary.config({
  cloud_name: "ginger0207",
  api_key: "854325318823997",
  api_secret: process.env.CLOUDINARY_SECRET,
});
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = {
  // GET landing page
  async landingPage(req, res, next) {
    let latestPosts = await db("posts")
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .limit(5);
    // console.log(req);
    let hottestPostsIdx = await db("visitsByDate")
      .where("date", new Date().toLocaleDateString())
      .orderBy("visits")
      .limit(5)
      .select("post_id");
    let idx = [];
    for (let e of hottestPostsIdx) idx.push(e.post_id);
    // console.log("hottestPostsIdx: ", idx);
    hottestPostsToday = await db("posts")
      .whereIn("id", idx)
      .orderBy("totalVisits", "desc");
    // console.log("hottestPostsToday: ", hottestPostsToday);
    res.render("index", { title: "Home", latestPosts, hottestPostsToday });
  },

  // GET all posts
  async showAllPosts(req, res, next) {
    let allPosts = await db("posts").orderBy("created_at", "desc");
    let paginateUrl =
      req.originalUrl.replace(/(\?|\&)page=\d+/g, "") + `?page=`;
    let [postPagination, posts] = paginate(req, allPosts);
    res.render("allPosts", {
      posts,
      postPagination,
      paginateUrl,
    });
  },

  // GET search posts
  async postSearch(req, res, next) {
    let kw = req.query.q.split(" ").join("|");
    // console.log("kw:", kw);
    let re;

    let alphabets = /^[A-Za-z0-9|]*$/;
    let isEng = alphabets.test(kw);

    // console.time("search");
    let searchRes = [];

    if (isEng) {
      re = new RegExp(`\\b(${kw})\\b`, "gi");
      // console.log("re:", re);
      // use postgresql "full-text search" function
      let raw = `to_tsvector(content) @@ to_tsquery('${kw}')`;
      searchRes = await db("posts").whereRaw(raw).orderBy("created_at", "desc");
    } else {
      re = new RegExp(`(${kw})`, "gi");
      // console.log("re:", re);
      let response = await db("posts").orderBy("created_at", "desc");
      response.forEach((post) => {
        let title = post.title
          .replace(/<[^>]*?>/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim();
        let content = post.content
          .replace(/<[^>]*?>/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim();
        if (content.search(re) > -1) {
          searchRes.push(post);
        }
        // console.log(content.search(re));
      });
    }
    // console.timeEnd("search");
    let paginateUrl =
      req.originalUrl.replace(/(\?|\&)page=\d+/g, "") + `&page=`;
    let [postPagination, posts] = paginate(req, searchRes);
    res.render("search", {
      posts,
      postPagination,
      paginateUrl,
      re,
    });
  },

  // GET /register
  getRegister(req, res, next) {
    res.locals.flash = req.session.flash || "";
    req.session.flash = "";
    res.render("register", { title: "Register" });
  },
  // POST /register
  async postRegister(req, res, next) {
    try {
      let duplicateUser = (await db("users").where("username", req.body.username)).length;
      if (duplicateUser)
        throw Error("duplicate username")
      let duplicateEmail = (await db("users").where("email", req.body.email)).length;
      if (duplicateEmail)
        throw Error("duplicate email")
      await createUser(req);
      passport.authenticate("local", (err, user, info) => {
        if (user) {
          req.login(user, function (err) {
            if (err) return next(err);
            req.session.success = `Welcome, ${user.username}!`;
            res.redirect("/");
          });
        }
      })(req, res, next);
    } catch (err) {
      let error = err.message;
      if (error.includes("duplicate") && error.includes("username")) {
        error = "A user with the given username is already registered";
        req.session.flash = {
          type: "error",
          message: error,
        };
      } else if (error.includes("duplicate") && error.includes("email")) {
        error = "A user with the given email is already registered";
        req.session.flash = {
          type: "error",
          message: error,
        };
      }
      res.redirect("/register");
    }
  },

  // GET /login
  getLogin(req, res, next) {
    if (req.isAuthenticated()) return res.redirect("/");
    res.locals.flash = req.session.flash || "";
    req.session.flash = "";
    res.render("login", { title: "Login" });
  },
  // POST /login
  async postLogin(req, res, next) {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.session.flash = {
          type: "error",
          message:
            "The username and/or password you specified are not correct.",
        };
        return res.redirect("/login");
      }
      req.logIn(user, async function (err) {
        if (err) {
          return next(err);
        }
        const redirectUrl = req.session.redirectTo || "/";
        delete req.session.redirectTo;
        // delete user's tmp files in database
        let { images_tmp } = await db("users")
          .where("username", user.username)
          .first();
        for (let img in images_tmp) {
          await cloudinary.uploader.destroy(images_tmp[img]);
        }
        await db("users")
          .where("username", user.username)
          .update("images_tmp", null);
        // console.log("redirectUrl:", redirectUrl);
        res.redirect(redirectUrl);
      });
    })(req, res, next);
  },

  // GET /logout
  getLogout(req, res, next) {
    req.logout();
    res.redirect("/");
  },

  // GET /forgot-password
  getForgotPw(req, res, next) {
    res.render("user/forgot");
  },
  // PUT set token and send email
  async putForgotPw(req, res, next) {
    let token = await crypto.randomBytes(20).toString("hex");
    let user = await db("users").where("email", req.body.email).first();
    if (!user) {
      req.session.error = "No account with this email exists";
      return res.redirect("/forgot-password");
    }
    let expiredTime = new Date(Date.now() + 30 * 60 * 1000); // 30 mins -> ms
    await db("users").where("email", req.body.email).update({
      resetPasswordToken: token,
      resetPasswordExpired: expiredTime,
    });

    const msg = {
      to: user.email,
      from: "yunghsiu.dev@gmail.com", // Use the email address or domain you verified above
      subject: "MyBlog - Forgot Password / Reset",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.
      Please click on the following link, or copy and paste it into your browser to complete the process:
      http://${req.headers.host}/reset-password/${token}
      If you did not request this, please ignore this email and your password will remain unchanged.`.replace(
        /      /g,
        ""
      ),
      // html: "<strong>and easy to do anywhere, even with Node.js</strong>",
    };
    await sgMail.send(msg);

    req.session.success = `An email has been sent to ${user.email} with further instructions.`;
    res.redirect("/forgot-password");
  },
  async getResetPw(req, res, next) {
    const { token } = req.params;
    const user = await db("users")
      .where("resetPasswordToken", token)
      .andWhere("resetPasswordExpired", ">", new Date(Date.now()))
      .first();

    if (!user) {
      req.session.error = "Password reset token is invalid or has expired.";
      return res.redirect("/forgot-password");
    }

    res.render("user/reset", { token });
  },
  async putResetPw(req, res, next) {
    const { token } = req.params;
    const user = await db("users")
      .where("resetPasswordToken", token)
      .andWhere("resetPasswordExpired", ">", new Date(Date.now()))
      .first();

    if (!user) {
      req.session.error = "Password reset token is invalid or has expired.";
      return res.redirect("/forgot-password");
    }

    if (req.body.password === req.body.confirm) {
      const salt = bcrypt.genSaltSync();
      const hash = bcrypt.hashSync(req.body.password, salt);
      await db("users").where("username", user.username).update({
        password: hash,
        resetPasswordToken: null,
        resetPasswordExpired: null,
      });
      const login = util.promisify(req.logIn.bind(req));
      await login(user);
    } else {
      req.session.error = "Passwords do not match.";
      return res.redirect(`/reset-password/${token}`);
    }

    const msg = {
      to: user.email,
      from: "yunghsiu.dev@gmail.com", // Use the email address or domain you verified above
      subject: "MyBlog - Password Changed",
      text: `Hello,
      This email is to confirm that the password for your account has just been changed.
      If you did not make this change, please hit reply and notify us at once.`.replace(
        /      /g,
        ""
      ),
      // html: "<strong>and easy to do anywhere, even with Node.js</strong>",
    };
    await sgMail.send(msg);

    req.session.success = `Password successfully updated!`;
    res.redirect("/");
  },
};

function createUser(req) {
  const salt = bcrypt.genSaltSync();
  const hash = bcrypt.hashSync(req.body.password, salt);
  return db("users")
    .insert({
      username: req.body.username,
      password: hash,
      email: req.body.email,
    })
    .returning("*");
}

function paginate(req, posts) {
  let res = {};
  let per_page = 10;
  let page = req.query.page || 1;
  let offset = (page - 1) * per_page;

  res.per_page = per_page;
  res.page = Number(page);
  res.pages = Math.ceil(posts.length / per_page);

  posts.splice(0, offset);
  if (posts.length > per_page) posts = posts.slice(0, 10);

  return [res, posts];
}

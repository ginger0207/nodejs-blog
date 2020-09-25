const db = require("../db/database");

module.exports = {
  asyncErrorHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },

  isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    req.session.error = "You need to log in first!";
    req.session.redirectTo = req.originalUrl;
    // console.log(req.originalUrl);
    // console.log(req.headers.referer);
    res.redirect("/login");
  },

  getCurrentUserAndOwner(req, res, next) {
    req.currentUser = req.user ? req.user.username : "";
    req.blogOwner = req.params.user;
    return next();
  },

  isBlogOwner(req, res, next) {
    if (req.currentUser !== req.blogOwner) {
      req.session.error = "You are not the owner of this blog!";
      return res.redirect("back");
    }

    return next();
  },

  async isCommentOwner(req, res, next) {
    try {
      let query = await db("comments")
        .where("id", req.params.comment_id)
        .select("author")
        .first();
      commentOwner = query.author;
      // console.log("commentOwner:", commentOwner);
      // console.log("req.currentUser: ", req.currentUser);
      if (req.currentUser !== commentOwner) {
        req.session.error = "You are not the owner of this comment!";
        return res.redirect("back");
      } else {
        return next();
      }
    } catch (error) {
      return next(error);
    }
  },
};

const db = require("../db/database");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
cloudinary.config({
  cloud_name: "ginger0207",
  api_key: "854325318823997",
  api_secret: process.env.CLOUDINARY_SECRET,
});

module.exports = {
  // GET show user profile
  async profileShow(req, res, next) {
    let { about, avatar } = await db("users")
      .where("username", req.blogOwner)
      .first();

    // console.log("avatar from db:", avatar);
    avatar = avatar ? avatar.url : "/images/blank-profile-picture.png";

    // console.log("about...", about);
    // console.log("avatar...", avatar);
    res.render("user/profile", {
      user: req.currentUser,
      owner: req.blogOwner,
      about,
      avatar,
    });
  },

  // DELETE user account
  async userDelete(req, res, next) {
    req.logout();
    let user = await db("users").where("username", req.currentUser).first();
    if (!user) {
      req.session.error = "This account does not exist";
      res.redirect("/");
    }

    if (user.avatar) await cloudinary.uploader.destroy(user.avatar.public_id);
    if (user.images_tmp) {
      for (let img in user.images_tmp) {
        await cloudinary.uploader.destroy(user.images_tmp[img]);
      }
    }
    let posts = await db("posts").where("author", user.username);
    for (let post of posts) {
      for (let img in post.images) {
        await cloudinary.uploader.destroy(post.images[img]);
      }
    }
    cloudinary.api.delete_folder(`blog/${user.username}`);
    await db("users").where("username", user.username).delete();
    res.redirect("/");
  },

  // UPDATE about
  async aboutUpdate(req, res, next) {
    await db("users")
      .where("username", req.blogOwner)
      .update("about", req.body.about);

    res.status(200).send({ about: req.body.about });
  },

  // UPDATE avatar
  async avatarUpdate(req, res, next) {
    // console.log("req.file", req.file);
    let image = await cloudinary.uploader.upload(req.file.path, {
      folder: `blog/${req.blogOwner}/avatar`,
    });
    // delete image in local storage
    fs.unlink(req.file.path, () => {
      // console.log(`${req.file.path} has been deleted`);
    });
    let obj = { url: image.secure_url, public_id: image.public_id };

    let { avatar } = await db("users").where("username", req.blogOwner).first();
    // console.log("avatar:", typeof avatar);

    if (avatar) {
      // console.log("avatar:", avatar);
      await cloudinary.uploader.destroy(avatar.public_id);
      // console.log("old avatar deleted");
    }

    await db("users").where("username", req.blogOwner).update("avatar", obj);
    res.status(200).send({ avatar: image.secure_url });
  },
};

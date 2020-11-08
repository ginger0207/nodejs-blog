const db = require("../db/database");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
cloudinary.config({
  cloud_name: "ginger0207",
  api_key: "854325318823997",
  api_secret: process.env.CLOUDINARY_SECRET,
});

module.exports = {
  // GET show all posts
  async postAll(req, res, next) {
    let response = await getAllPosts(req);
    let paginateUrl =
      req.originalUrl.replace(/(\?|\&)page=\d+/g, "") + `?page=`;
    let [postPagination, posts] = paginate(req, response);
    let profile = await db("users").where("username", req.blogOwner).first();
    let tagList = await getTagLists(req.blogOwner);
    let avatar = profile.avatar
      ? profile.avatar.url
      : "/images/blank-profile-picture.png";
    res.render("blog/postAll", {
      user: req.currentUser,
      owner: req.blogOwner,
      posts,
      postPagination,
      paginateUrl,
      avatar,
      tagList,
    });
  },

  // GET show posts of specified tag
  async postAll_tag(req, res, next) {
    let response = await getAllPosts(req);
    let paginateUrl =
      req.originalUrl.replace(/(\?|\&)page=\d+/g, "") + `?page=`;
    let [postPagination, posts] = paginate(req, response);
    let profile = await db("users").where("username", req.blogOwner).first();
    let tagList = await getTagLists(req.blogOwner);
    let avatar = profile.avatar
      ? profile.avatar.url
      : "/images/blank-profile-picture.png";
    res.render("blog/postAll", {
      user: req.currentUser,
      owner: req.blogOwner,
      posts,
      postPagination,
      paginateUrl,
      avatar,
      tagList,
    });
  },

  // GET post show
  async postShow(req, res, next) {
    await updateVisits(req);
    let post = await getPost(req);
    if (post.length) {
      post = post[0];
      let neighbor = await db.raw(
        "select * from ( \
        select * , \
          lag(id) over (order by id asc, created_at asc) as prev_id, \
          lag(title) over (order by id asc, created_at asc) as prev_title, \
          lead(id) over (order by id asc, created_at asc) as next_id, \
          lead(title) over (order by id asc, created_at asc) as next_title \
        from posts \
         where author = ? and tag = ?\
      ) as foo \
      where id = ?",
        [post.author, post.tag, post.id]
      );
      neighbor = neighbor.rows[0];
      // console.log(neighbor)
      let comments = await getAllComments(req);
      let profile = await db("users").where("username", req.blogOwner).first();
      let tagList = await getTagLists(req.blogOwner);
      let avatar = profile.avatar
        ? profile.avatar.url
        : "/images/blank-profile-picture.png";
      res.render("blog/postShow", {
        user: req.currentUser,
        owner: req.blogOwner,
        post,
        comments,
        avatar,
        tagList,
        prev: { id: neighbor.prev_id, title: neighbor.prev_title },
        next: { id: neighbor.next_id, title: neighbor.next_title },
      });
    } else {
      req.session.error = "Post does not exist!";
      res.redirect(`/${req.params.user}/blog`);
    }
  },

  // GET post new
  async postNew(req, res, next) {
    let tmp = await db("posts")
      .select("tag")
      .where("author", req.user.username);
    // console.log("tmp:", tmp);
    let tagList = new Set();
    for (let element of tmp) {
      tagList.add(element.tag);
    }
    tagList = new Array(...tagList).sort();
    // console.log("tagList:", tagList);

    res.render("blog/postNew", { user: req.user.username, tagList });
  },
  // POST create new post
  async postCreate(req, res, next) {
    // console.log("in postCreate...");
    let string = req.body.post.content,
      pattern = /<img src="(.*?)"/g,
      match,
      matches = [];
    while ((match = pattern.exec(string))) {
      matches.push(match[1]);
    }

    let { images_tmp } = await db("users")
      .where("username", req.blogOwner)
      .first();
    let images = {};
    for (let img of matches) {
      // console.log("img:", img);
      if (images_tmp[img]) {
        images[img] = images_tmp[img];
        delete images_tmp[img];
      }
    }
    for (let img in images_tmp) {
      await cloudinary.uploader.destroy(images_tmp[img]);
    }
    await createPost(req, images);
    await db("users").where("username", req.blogOwner).update("images_tmp", {});
    req.session.success = "Post succeed!";
    res.redirect(`/${req.user.username}/blog`); // equals to: res.redirect('.');
  },

  // GET post edit
  async postEdit(req, res, next) {
    let post = await getPost(req);
    if (post.length) {
      let tmp = await db("posts")
        .select("tag")
        .where("author", req.user.username);
      let tagList = new Set();
      for (let element of tmp) {
        tagList.add(element.tag);
      }
      tagList = new Array(...tagList).sort();
      // console.log("tagList:", tagList);
      res.render("blog/postEdit", { user: req.user.username, post, tagList });
    } else {
      req.session.error = "Post does not exist!";
      res.redirect(`/${req.params.user}/blog`);
    }
  },
  // POST post update
  async postUpdate(req, res, next) {
    let string = req.body.post.content,
      pattern = /<img src="(.*?)"/g,
      match,
      matches = [];
    while ((match = pattern.exec(string))) {
      matches.push(match[1]);
    }

    let { images_tmp } = await db("users")
      .where("username", req.blogOwner)
      .first();
    let images_prev = (
      await db("posts").where("id", req.params.post_id).first()
    ).images;
    let images = {};
    for (let img of matches) {
      // console.log("img:", img);
      if (images_tmp && images_tmp[img]) {
        images[img] = images_tmp[img];
        delete images_tmp[img];
      }
      if (images_prev && images_prev[img]) {
        images[img] = images_prev[img];
        delete images_prev[img];
      }
    }

    for (let img in images_tmp) {
      // console.log("deleting img: ", img);
      await cloudinary.uploader.destroy(images_tmp[img]);
    }
    for (let img in images_prev) {
      // console.log("deleting img: ", img);
      await cloudinary.uploader.destroy(images_prev[img]);
    }

    await updatePost(req, images);
    await db("users").where("username", req.blogOwner).update("images_tmp", {});
    req.session.success = "Post update successfully!";
    res.redirect(`/${req.user.username}/blog`);
  },

  // DELETE post destroy
  async postDestroy(req, res, next) {
    let { images } = await db("posts").where("id", req.params.post_id).first();
    for (let img in images) {
      await cloudinary.uploader.destroy(images[img]);
    }
    await db("posts").where("id", req.params.post_id).delete();
    req.session.success = "Post delete successfully!";
    res.redirect(`/${req.user.username}/blog`);
  },

  // POST comment create
  async commentCreate(req, res, next) {
    await db("comments").insert({
      post_id: req.params.post_id,
      author: req.user.username,
      content: req.body.comment.content,
    });

    req.session.success = "Comment create successfully!";
    res.redirect(`/${req.params.user}/blog/post/${req.params.post_id}`);
  },
  // PUT comment update
  async commentUpdate(req, res, next) {
    await db("comments")
      .where("id", req.params.comment_id)
      .update("content", req.body.commen);
    req.session.success = "Comment update successfully!";
    res.redirect(`/${req.params.user}/blog/post/${req.params.post_id}`);
  },
  // DELETE comment
  async commentDestroy(req, res, next) {
    await db("comments").where("id", req.params.comment_id).delete();
    req.session.success = "Comment delete successfully!";
    res.redirect(`/${req.params.user}/blog/post/${req.params.post_id}`);
  },

  // POST image upload
  async imageUpload(req, res, next) {
    // console.log("imageUpload");
    // console.log(req.file);
    try {
      let image = await cloudinary.uploader.upload(req.file.path, {
        folder: `blog/${req.blogOwner}/images`,
      });
      // delete image in local storage
      fs.unlink(req.file.path, () => {
        // console.log(`${req.file.path} has been deleted`);
      });

      let { images_tmp } = await db("users")
        .where("username", req.blogOwner)
        .first();
      images_tmp = images_tmp || {};
      // console.log("images_tmp:", images_tmp);
      images_tmp[image.secure_url] = image.public_id;
      await db("users")
        .where("username", req.params.user)
        .update("images_tmp", images_tmp);

      res.status(200).send({ image: image.secure_url });
    } catch (error) {
      // console.log(error);
      fs.unlink(req.file.path, () => {
        // console.log(`${req.file.path} has been deleted`);
      });
      res.status(404).send({ error: "Upload failed" });
    }
  },
};

function createPost(req, images) {
  return db("posts").insert({
    author: req.user.username,
    title: req.body.post.title,
    content: req.body.post.content,
    images: images,
    tag: req.body.post.newTag || req.body.post.tag,
  });
}

function getAllPosts(req) {
  let option = { author: req.params.user };
  if (req.params.tag_name !== undefined) option.tag = req.params.tag_name;

  return db("posts").where(option).orderBy("id", "desc");
}

function getPost(req) {
  return db("posts").where({
    id: req.params.post_id,
    author: req.params.user,
  });
}

function updatePost(req, images) {
  return db("posts")
    .where("id", req.params.post_id)
    .update({
      title: req.body.post.title,
      content: req.body.post.content,
      images: images,
      tag: req.body.post.newTag || req.body.post.tag,
    });
}

function getAllComments(req) {
  return db("comments")
    .where("post_id", req.params.post_id)
    .orderBy("created_at", "id");
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

async function updateVisits(req) {
  let isExist = await isVisitedToday(req);
  let shouldUpdate = false;
  if (req.session.visitedPosts[req.params.post_id]) {
    let time = req.session.visitedPosts[req.params.post_id];
    // if > 1 hour, update visit time
    if (new Date() - new Date(time) > 60 * 60 * 1000) {
      req.session.visitedPosts[req.params.post_id] = new Date().toISOString;
      shouldUpdate = true;
    }
  } else {
    req.session.visitedPosts[req.params.post_id] = new Date().toISOString();
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    if (isExist) {
      await db("visitsByDate")
        .where({
          post_id: req.params.post_id,
          date: new Date().toLocaleDateString(),
        })
        .increment("visits", 1);
    } else {
      await db("visitsByDate").where("post_id", req.params.post_id).insert({
        author: req.params.user,
        post_id: req.params.post_id,
      });
    }

    await db("posts")
      .where("id", req.params.post_id)
      .increment("totalVisits", 1);
  }
  // console.log("req.session.visitedPosts: ", req.session.visitedPosts);
}

async function isVisitedToday(req) {
  let results = await db("visitsByDate").where({
    post_id: req.params.post_id,
    date: new Date().toLocaleDateString(),
  });
  // console.log("results: ", results);
  return results.length > 0;
}

async function getTagLists(user) {
  let tmp = await db("posts").select("tag").where("author", user);
  let tagList = []; // [[tag name, num]]
  let idx = {};
  for (let element of tmp) {
    if (idx[element.tag] !== undefined) {
      tagList[idx[element.tag]][1]++;
    } else {
      tagList.push([element.tag, 1]);
      idx[element.tag] = tagList.length - 1;
    }
  }
  // console.log("tagList: ", tagList);
  tagList.sort((a, b) => a[0].localeCompare(b[0], "en"));

  return tagList;
}

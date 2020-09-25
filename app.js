if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
  console.log(`process.env.NODE_ENV = ${process.env.NODE_ENV}`);
}

const express = require("express");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const passportLocal = require("passport-local");
const methodOverride = require("method-override");
const session = require("express-session");

// connect to database
const db = require("./db/database");

// Require routes
const index = require("./routes/index");
const blog = require("./routes/blog");
const user = require("./routes/user");

const app = express();

// console.log(db.select('*').from('users_test'));
// db.select('*').from('users').then(data=>{
//   console.log(data);
// });

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  db("users")
    .where({ id })
    .first()
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

passport.use(
  new passportLocal.Strategy(function (username, password, done) {
    // check to see if the username exists
    db("users")
      .where({ username })
      .first()
      .then((user) => {
        if (!user) {
          return done(null, false);
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false);
        }
        return done(null, user);
      })
      .catch((err) => {
        return done(err);
      });
  })
);

// set local variables middleware
app.use(function (req, res, next) {
  if (!req.session.visitedPosts) req.session.visitedPosts = {};
  // else {
  //   for (let d in req.session.visitedPosts) {
  //     console.log(d);
  //     console.log(req.session.visitedPosts[d]);
  //   }
  // }

  // console.log("req.cookies:", req.cookies);
  // console.log("Signed Cookies: ", req.signedCookies);
  res.locals.currentUser = req.user;
  // set default page title
  res.locals.title = "MyBlog";
  // set success flash message
  res.locals.success = req.session.success || "";
  delete req.session.success;
  // set error flash message
  res.locals.error = req.session.error || "";
  delete req.session.error;
  // continue on to next function in middleware chain
  // console.log("session: ", req.session);
  next();
});

// Mount routes
app.use("/", index);
app.use("/:user/blog", blog);
app.use("/:user/profile", user);

//The 404 Route (ALWAYS Keep this as the last route)
app.use(function (req, res, next) {
  res.status(404);

  // respond with html page
  // if (req.accepts("html")) {
  //   res.render("404", { url: req.url });
  //   return;
  // }

  // respond with json
  // if (req.accepts("json")) {
  //   res.send({ error: "Page Not found" });
  //   return;
  // }

  // default to plain-text. send()
  res.type("txt").send("Page Not found");
  return;
});

app.listen(process.env.PORT || 3000, () => {
  if (process.env.PORT)
    console.log(`Blog server is running on port ${process.env.PORT}!`);
  else
    console.log("Blog server is running on port 3000!");
});

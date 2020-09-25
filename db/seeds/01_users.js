const bcrypt = require("bcrypt");

const salt = bcrypt.genSaltSync();
const hash = bcrypt.hashSync("123", salt);

exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex("users")
    .del()
    .then(function () {
      // Inserts seed entries
      return knex("users").insert([
        { username: "user1", password: hash, email: `user1@gmail.com` },
        { username: "user2", password: hash, email: `user2@gmail.com` },
        { username: "user3", password: hash, email: `user3@gmail.com` },
      ]);
    });
};

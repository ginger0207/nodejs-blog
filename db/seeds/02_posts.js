const faker = require("faker");

let data = [];
let post_num = 20;
for (let i = 0; i < post_num; i++) {
  let obj = {
    author: "user1",
    title: faker.lorem.words(),
    content: faker.lorem.paragraph(),
  };
  data.push(obj);
}

exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex("posts")
    .del()
    .then(function () {
      // Inserts seed entries
      return knex("posts").insert(data);
    });
};

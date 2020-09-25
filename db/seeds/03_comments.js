const faker = require("faker");

let data = [];
let post_num = 20;
let user_num = 3;
for (let i = 0; i < post_num; i++) {
  for (let j = 1; j < user_num; j++) {
    let obj = {
      post_id: i + 1,
      author: `user${j + 1}`,
      content: faker.lorem.sentence(),
    };
    data.push(obj);
  }
}

exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex("comments")
    .del()
    .then(function () {
      // Inserts seed entries
      return knex("comments").insert(data);
    });
};

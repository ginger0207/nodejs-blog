const env = process.env.NODE_ENV || "development";
const knexfile = require("../knexfile");
const knex = require("knex");

const db = knex(knexfile[env]);

module.exports = db;

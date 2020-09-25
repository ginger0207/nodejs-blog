const {env, dotenv_config} = require("../dotenv_config");

const knexfile = require("../knexfile");
const knex = require("knex");

const db = knex(knexfile[env]);

module.exports = db;

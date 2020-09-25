exports.up = function (knex) {
  return knex.schema.createTable("posts", (table) => {
    table.increments("id");
    table.string("author").notNullable();
    table.string("title").notNullable();
    table.text("content").notNullable();
    table.json("images");
    table.string("tag").notNullable().defaultTo("undefined");
    table.integer("totalVisits").unsigned().notNullable().defaultTo(0);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table
      .foreign("author")
      .references("username")
      .inTable("users")
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("posts");
};

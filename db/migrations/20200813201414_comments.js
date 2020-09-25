exports.up = function (knex) {
  return knex.schema.createTable("comments", (table) => {
    table.increments("id");
    table.integer("post_id").unsigned().notNullable();
    table.string("author").notNullable();
    table.text("content").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table
      .foreign("post_id")
      .references("id")
      .inTable("posts")
      .onDelete("CASCADE");
    table
      .foreign("author")
      .references("username")
      .inTable("users")
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("comments");
};

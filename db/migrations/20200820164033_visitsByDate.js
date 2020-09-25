exports.up = function (knex) {
  return knex.schema.createTable("visitsByDate", (table) => {
    table.increments("id");
    table.integer("visits").unsigned().notNullable().defaultTo(1);
    table.string("author").notNullable();
    table.integer("post_id").unsigned().notNullable();
    table.date("date").notNullable().defaultTo(knex.fn.now());

    table
      .foreign("author")
      .references("username")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .foreign("post_id")
      .references("id")
      .inTable("posts")
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("visitsByDate");
};

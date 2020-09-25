exports.up = function (knex) {
  return knex.schema.createTable("users", (table) => {
    table.increments("id");
    table.string("username").unique().notNullable();
    table.string("password").notNullable();
    table.string("email").unique().notNullable();
    table.json("avatar");
    table.text("about");
    table.json("images_tmp");
    table.string("resetPasswordToken");
    table.timestamp("resetPasswordExpired");
    table.boolean("admin").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("users");
};

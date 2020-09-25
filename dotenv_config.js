let self = module.exports = {
  env: process.env.NODE_ENV || "development",

  dotenv_config() {
    if (self.env === "development") {
      require("dotenv").config();
    }
  },
};

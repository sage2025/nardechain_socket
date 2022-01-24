const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const UserSchema = new Schema({
  account: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: false
  },

  name: {
    type: String,
    required: false
  },
  birth: {
    type: String,
    required: false
  },

  // email: {
  //   type: String,
  //   required: false
  // },
  gender: {
    type: String,
    required: false,
    default: null
  },
  state: {
    type: String,
    required: false
  },
  // code: {
  //   type: String,
  //   required: false
  // },
  avatar : {
    type: String,
    required: false
  },

  password: {
    type: String,
    required: false
  },
  win: {
    type: String,
    required: false
  },
  loss: {
    type: String,
    required: false
  },

}, {
  timestamps: true
});
module.exports = User = mongoose.model("users", UserSchema);
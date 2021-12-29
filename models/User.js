const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: false,
    default: null
  },
  country: {
    type: String,
    required: false
  },
  birthday: {
    type: String,
    required: false
  },
  code: {
    type: String,
    required: false
  },
}, {
  timestamps: true
});
module.exports = User = mongoose.model("users", UserSchema);
const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateRegisterInput(data) {
  let errors = {};
// Convert empty fields to an empty string so we can use validator functions
  // data.name = !isEmpty(data.name) ? data.name : "";
  // data.email = !isEmpty(data.email) ? data.email : "";
  // data.password = !isEmpty(data.password) ? data.password : "";
  // data.passwordconf = !isEmpty(data.passwordconf) ? data.passwordconf : "";
  // // Name checks
  // if (Validator.isEmpty(data.name)) {
  //   errors.push("Name field is required");
  // }
  // // Email checks
  // if (Validator.isEmpty(data.email)) {
  //   errors.push("Email field is required");
  // } else if (!Validator.isEmail(data.email)) {
  //   errors.push("Email is invalid");
  // }
  // // Password checks
  // if (Validator.isEmpty(data.password)) {
  //   errors.push("Password field is required");
  // }
  // if (Validator.isEmpty(data.passwordconf)) {
  //   errors.push("Confirm password field is required");
  // }
  // if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
  //   errors.push("Password must be at least 6 characters");
  // }
  // if (!Validator.equals(data.password, data.passwordconf)) {
  //   errors.push("Passwords must match");
  // }
  return {
    errors,
    isValid: isEmpty(errors)
  };
};
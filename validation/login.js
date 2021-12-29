const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateLoginInput(data) {
  let errors = {};
  
  data.email = !isEmpty(data.email) ? data.email : "";
  data.password = !isEmpty(data.password) ? data.password : "";
  
    if (Validator.isEmpty(data.email)) {
      errors.push = "email field is required";
    }
    
  if (Validator.isEmpty(data.password)) {
    errors.push = "Password field is required";
  }
return {
    errors,
    isValid: isEmpty(errors)
  };
};
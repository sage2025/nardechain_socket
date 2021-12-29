const validator = require('validator');
const isEmpty = require('is-empty');

module.exports = function validateResetInput(data) {
    let errors = [];
    data.password = !isEmpty(data.password) ? data.password : "";
    data.passwordconf = !isEmpty(data.passwordconf) ? data.passwordconf : "";

    if(validator.isEmpty(data.password)) {
        errors.push("Password couldn't be empty. ");
    }

    if(validator.isEmpty(data.passwordconf)) {
        errors.push("Password confirmation couldn't be empty. ");
    }

    if(!validator.isLength(data.password, { min: 6, max: 30 })) {
        errors.push("Password must be at least 6 characters. ");
    }

    if(!validator.isLength(data.passwordconf, { min: 6, max: 30 })) {
        errors.push("Password confirmation must be at least 6 characters. ");
    }

    if(!validator.equals(data.password, data.passwordconf)) {
        errors.push("Passwords must be matched. ");
    }

    return {
        errors: errors,
        isValid: isEmpty(errors)
    };

};
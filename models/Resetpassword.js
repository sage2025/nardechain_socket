const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResetSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    token : {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = Resetpassword = mongoose.model("Resetpassword", ResetSchema);
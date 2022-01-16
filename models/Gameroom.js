const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameroomSchema = new Schema({
    roomID : {
        type: String,
        required: true
    },
    name : {
        type: String,
        required: false
    },
    player: {
        type: String,
        required: false
    },
    // ratingA: {
    //     type: String,
    //     required: true
    // },
    // playerB: {
    //     type: String,
    //     required: false
    // },
    // ratingB: {
    //     type: String,
    //     required: false
    // },
    length: {
        type: String,
        required: false
    },
    clock: {
        type: String,
        required: false
    },
    stake: {
        type: String,
        required: false
    },
    join: {
        type: String,
        required: false
    },

})

module.exports = Gameroom = mongoose.model("Gameroom", GameroomSchema)
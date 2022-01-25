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
    opponer: {
        type: String,
        required: false
    },
    account: {
        type: String,
        required: false
    },
    accountopp: {
        type: String,
        required: false
    },
    finish: {
        type: String,
        required: false
    },
    winner: {
        type: String,
        required: false
    },
    loser: {
        type: String,
        required: false
    },
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
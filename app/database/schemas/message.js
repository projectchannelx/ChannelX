'use strict';

var Mongoose  = require('mongoose');

/**
 * Each connection object represents a user connected through a unique socket.
 * Each connection object composed of {userId + socketId}. Both of them together are unique.
 *
 */
var MessageSchema = new Mongoose.Schema({
    ChannelID:   { type: Mongoose.Schema.Types.ObjectId, required: true },
    SenderName:    { type: String, required: true },
    message:     { type: String, default: "" },
    messageDate: { type: Date, default: Date.now() },
});

var messageModel = Mongoose.model('message', MessageSchema);

module.exports = messageModel;
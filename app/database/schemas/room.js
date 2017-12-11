'use strict';

var Mongoose  = require('mongoose');

/**
 * Each connection object represents a user connected through a unique socket.
 * Each connection object composed of {userId + socketId}. Both of them together are unique.
 *
 */
var RoomSchema = new Mongoose.Schema({
    timeID:      [Mongoose.Schema.Types.ObjectId],
    ownerID:     { type: Mongoose.Schema.Types.ObjectId, required: true},
    title:       { type: String, required: true },
    connections: { type: [{ userId: String, socketId: String }]},
    userID: [Mongoose.Schema.Types.ObjectId],
    verificationCode: { type: String, required: true },
    isActive: 	 { type: Boolean }
});

var roomModel = Mongoose.model('room', RoomSchema);

module.exports = roomModel;
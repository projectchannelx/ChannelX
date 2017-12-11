'use strict';

var Mongoose  = require('mongoose');

/**
 * Each connection object represents a user connected through a unique socket.
 * Each connection object composed of {userId + socketId}. Both of them together are unique.
 *
 */
var PeriodSchema = new Mongoose.Schema({
    ChannelID:   { type: Mongoose.Schema.Types.ObjectId, required: false },
    startTime:   { type: String, required: true },
    endTime:     { type: String, required: true },
    isRepeat:    { type: Boolean, default: false },
    days: 		 [ String ],
    endDate:	 { type: Date, required: true}
});

var periodModel = Mongoose.model('period', PeriodSchema);

module.exports = periodModel;
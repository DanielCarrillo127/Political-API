const mongoose = require('mongoose');


const eventSchema = new mongoose.Schema({
    eventid: {type: String, required: true, unique: true },
    eventName: { type: String, required: true },
    description: { type: String},
    address: { type: String, required: true },
    creatorid: { type: String, required: true },
    dateCreated: { type: Date, required: true },
    dateDevelopment: { type: String, required: true },
    transport: { type: String, required: true },
    refreshments: { type: String, required: true }
});


module.exports = mongoose.model('events', eventSchema);
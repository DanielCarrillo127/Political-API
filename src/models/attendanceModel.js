const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    eventid: { type: String, required: true },
    attendant: {
        type: Map,
        of: String
    },
    type: {
        type: String,
        enum: ['NEW', 'OLD'],
    },
});

module.exports = mongoose.model('attendance', attendanceSchema);
const mongoose = require('mongoose');

const witnessSchema = new mongoose.Schema({
    name: { type: String, required: true },
    surnames: { type: String, required: true },
    cedula: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    votingBoothInCharge: { type: String },
    tableInCharge: { type: String },
    isCoordinator: { type: Boolean },
});

const Witness = mongoose.model("Witness", witnessSchema);

module.exports = Witness; 
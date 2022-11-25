const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surnames: { type: String, required: true },
  password: { type: String},
  cedula: { type: String, required: true, unique: true },
  phoneNumber: {type: String, required: true},
  role: {
    type: String,
    enum: ['CANDIDATE','ADMIN','COORDINATOR','LEADER', 'VOTER'],
    default: 'VOTER'
  },
  leaderid: {type: String, required: true },
  sex: {
    type: String,
    enum: ['MALE', 'WOMEN', "OTHERS"], required: true
  },
  address: { type: String, required: true },
  age: { type: String, required: true },
  votingBooth: { type: String },
  table: { type: String },
  productiveSection: {type: String, required: true},
}
);


module.exports = mongoose.model('users', userSchema);
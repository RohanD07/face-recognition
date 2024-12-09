const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  source: {
    type: String,
  },
  sourceLat:Number,
  sourceLong:Number,
  destinationLat:Number,
  destinationLong:Number,
  destination: {
    type: String,
  },
  sourceLat: Number,
  
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  fullname: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 400
  },
  travelling:{
    type: Boolean,
    default: false
  },
  photo: String,
  faceDescriptor: {
    type: [Number], 
  },
  transactions: [transactionSchema]
});

const User = mongoose.model('User', userSchema);

module.exports = User;

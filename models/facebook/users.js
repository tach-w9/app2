const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const info = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  username: String
},{ titmestamps: true });
const model =  mongoose.model("Facebook", info);
module.exports=model;
const mongoose = require("mongoose");


const CountrySchema = new mongoose.Schema({
  code2: String,
  code3: String,
  cc: { type: String, index: true, unique: true },
  name: { type: String, index: true, unique: true },
  capital: String,
  region: String,
  subregion: String,
  states: Array,
});


const Country = mongoose.model("countries", CountrySchema);


exports.Country = Country;
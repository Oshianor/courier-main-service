const config = require('config');
const mongoose = require('mongoose');

// connecting to the database
mongoose
  .connect(config.get('database.url'), {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB...')
  })
  .catch((err) => console.error('Could not connect to MongoDB...'));
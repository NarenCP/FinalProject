const app = require('./app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
//console.log(x);
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
});
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Database connected successfully');
  });

// console.log(process.env);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is starting on ${port}`);
});

//whenever DB connection is unsuccessfull
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  // server.close(() => {
  //   process.exit(1);
  // });
});

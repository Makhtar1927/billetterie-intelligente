const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { acheterTicket } = require('../controllers/ticketController');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const req = {
    user: { _id: new mongoose.Types.ObjectId() },
    body: { prix: 500 }
  };
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log('Response JSON:', data);
    }
  };

  await acheterTicket(req, res);
  await mongoose.disconnect();
}
test().catch(console.error);

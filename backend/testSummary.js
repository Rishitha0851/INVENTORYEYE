const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { getExecutiveSummary } = require('./controllers/reportController');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventoryeye')
  .then(async () => {
    console.log('MongoDB Connected');
    const req = {};
    const res = {
      json: (data) => console.log('SUCCESS:', JSON.stringify(data).substring(0, 200)),
      status: (code) => {
        console.log('STATUS:', code);
        return { json: (data) => console.log('ERROR JSON:', data) };
      }
    };
    await getExecutiveSummary(req, res);
    process.exit(0);
  })
  .catch(err => {
    console.error('DB Error:', err);
    process.exit(1);
  });

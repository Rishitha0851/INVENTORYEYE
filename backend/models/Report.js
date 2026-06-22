const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['Inventory', 'Forecast', 'Recommendation', 'ExecutiveSummary'], 
    required: true 
  },
  generatedAt: { type: Date, default: Date.now },
  data: { type: mongoose.Schema.Types.Mixed, required: true }, // Store dynamic report data
}, {
  timestamps: true,
});

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;

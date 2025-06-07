const mongoose = require('mongoose');
const ShowTimeSchema = new mongoose.Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    typeTickets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'typetickets',
        required: true,
      },
    ],
    status: {
      type: String,
      enum: [
        'NotStarted',
        'Ongoing',
        'Ended',
        'SoldOut',
        'OnSale',
        'SaleStopped',
        'NotYetOnSale',
        'Canceled',
      ],
    },
  },
  {
    timestamps: true,
  }
);

const ShowTimeModel = mongoose.model('showtimes', ShowTimeSchema);
module.exports = ShowTimeModel;

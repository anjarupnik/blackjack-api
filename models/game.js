// models/game.js
const mongoose = require('../config/database')
const { Schema } = mongoose

const playerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'users' },
  hand: [{}],
  score: { type: Number , default: 0},
  hasStood: { type: Boolean },
  blackJack: { type: Number, default: 0},
  busted: { type: Number, default: 21}
});

const gameSchema = new Schema({
  deck: [{}],
  players: [playerSchema],
  started: { type: Boolean, default: false },
  winnerId: { type: Schema.Types.ObjectId, ref: 'users' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: 'users' },
}, { usePushEach: true })

module.exports = mongoose.model('games', gameSchema)

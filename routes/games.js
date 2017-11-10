// routes/games.js
const router = require('express').Router()
const passport = require('../config/auth')
const { Game } = require('../models')
const utils = require('../lib/utils')

const authenticate = passport.authorize('jwt', { session: false })
var cards = require('node-of-cards');
var card = 0
cards.shuffle(function (err, data) {
  cards.reshuffle(function (err, data) {
    cards.draw({number_of_cards: 52}, function (err, data) {
      return card = data.cards
    });
  });
});

module.exports = io => {
  router
    .get('/games', (req, res, next) => {
      Game.find()
        // Newest games first
        .sort({ createdAt: -1 })
        // Send the data in JSON format
        .then((games) => res.json(games))
        // Throw a 500 error if something goes wrong
        .catch((error) => next(error))
    })
    .get('/games/:id', (req, res, next) => {
      const id = req.params.id

      Game.findById(id)
        .then((game) => {
          if (!game) { return next() }
          res.json(game)
        })
        .catch((error) => next(error))
    })

    .post('/games', authenticate, (req, res, next) => {
      const newGame = {
        userId: req.account._id,
        players: [{
          userId: req.account._id,

        }],
        deck: card
      }

      Game.create(newGame)
        .then((game) => {
          io.emit('action', {
            type: 'GAME_CREATED',
            payload: game
          })
          res.json(game)
        })
        .catch((error) => next(error))
    })

    .put('/games/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      var updatedGame = req.body

      if (req.body.players[0].userId.toString() === req.account._id.toString()
          && req.body.turn % 2 !== 0) {
          updatedGame.players[0].hasStood = true
          updatedGame.turn = updatedGame.turn + 1
      }

      if (req.body.players[1].userId.toString() === req.account._id.toString() &&
          req.body.turn % 2 === 0) {
          updatedGame.players[1].hasStood = true
          updatedGame.turn = updatedGame.turn + 1
      }



      Game.findByIdAndUpdate(id, { $set: updatedGame }, { new: true })
        .then((game) => {
          io.emit('action', {
            type: 'GAME_UPDATED',
            payload: game
          })
          res.json(game)
        })
        .catch((error) => next(error))
    })

    .patch('/games/:id', authenticate, (req, res, next) => {
      function pick(deck, hand) {
        var num1 = Math.floor(Math.random() * (deck.length + 1))
         hand.push(deck[num1])
         newDeck = deck.filter(d => d !== game.deck[num1])}

      const id = req.params.id
      const game = req.body
      var patchForGame = {}
      var hand1 = []
      var hand2 = []
      var newDeck = []

      if (game.deck.length === 52) {
          pick(game.deck, hand1)
          pick(newDeck, hand1)
          pick(newDeck, hand2)
          pick(newDeck, hand2)
          var newPlayers = req.body.players
          newPlayers[0].hand = hand1
          newPlayers[1].hand = hand2
          sum1 = hand1.map(p => {
          if (p.value === "QUEEN") {return "10"}
          if (p.value === "KING")  {return "10"}
          if (p.value === "JACK")  {return "10"}
          if (p.value === "ACE")   {return "11"}
           return p.value}).map(p => Number(p)).reduce((a, b) => a + b, 0)
            if (sum1 === 21) { newPlayers[0].blackJack = true }
            if (sum1 > 21)   { newPlayers[0].busted = true }
          sum2 = hand2.map(p => {
            if (p.value === "QUEEN") {return "10"}
            if (p.value === "KING")  {return "10"}
            if (p.value === "JACK")  {return "10"}
            if (p.value === "ACE")   {return "11"}
             return p.value}).map(p => Number(p)).reduce((a, b) => a + b, 0)
          if (sum2 === 21) {newPlayers[1].blackJack = true }
          if (sum2 > 21) {newPlayers[1].busted = true }

        patchForGame = {
          started: true,
          deck: newDeck,
          players: newPlayers,
          turn: 1
        }}

        if (game.deck.length < 52 &&
             game.players[0].userId.toString() === req.account._id.toString()
              && game.turn % 2 !== 0) {
          var newPlayers = req.body.players
          pick(game.deck, hand1)
          newPlayers[0].hand.push(...hand1)
          sum1 = newPlayers[0].hand.map(p => {
          if (p.value === "QUEEN") {return "10"}
          if (p.value === "KING")  {return "10"}
          if (p.value === "JACK")  {return "10"}
          if (p.value === "ACE")   {return "11"}
           return p.value}).map(p => Number(p)).reduce((a, b) => a + b, 0)
            if (sum1 === 21) { newPlayers[0].blackJack = true }
            if (sum1 > 21)   { newPlayers[0].busted = true }

            patchForGame = {
            players: newPlayers,
            deck: newDeck,
            turn: game.turn + 1
          }
        }

        if (game.deck.length < 52 &&
             game.players[1].userId.toString() === req.account._id.toString()
              && game.turn % 2 === 0) {
          var newPlayers = req.body.players
          pick(game.deck, hand2)
          newPlayers[1].hand.push(...hand2)
          sum2 = newPlayers[1].hand.map(p => {
          if (p.value === "QUEEN") {return "10"}
          if (p.value === "KING")  {return "10"}
          if (p.value === "JACK")  {return "10"}
          if (p.value === "ACE")   {return "11"}
           return p.value}).map(p => Number(p)).reduce((a, b) => a + b, 0)
            if (sum2 === 21) { newPlayers[1].blackJack = true }
            if (sum2 > 21) {newPlayers[1].busted = true }

            patchForGame = {
            players: newPlayers,
            deck: newDeck,
            turn: game.turn + 1
          }
        }


      Game.findById(id)
        .then((game) => {
          if (!game) { return next() }

          const updatedGame = { ...game, ...patchForGame }

          Game.findByIdAndUpdate(id, { $set: updatedGame }, { new: true })
            .then((game) => {
              io.emit('action', {
                type: 'GAME_UPDATED',
                payload: game
              })
              res.json(game)
            })
            .catch((error) => next(error))
        })
        .catch((error) => next(error))
    })

    .delete('/games/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      Game.findByIdAndRemove(id)
        .then(() => {
          io.emit('action', {
            type: 'GAME_REMOVED',
            payload: id
          })
          res.status = 200
          res.json({
            message: 'Removed',
            _id: id
          })
        })
        .catch((error) => next(error))
    })

  return router
}

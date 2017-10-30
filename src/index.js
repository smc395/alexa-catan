"use strict"
const Alexa = require("alexa-sdk");

exports.handler = function(event, context, callback){
    const alexa = Alexa.handler(event, context, callback);
    //alexa.dynamoDBTableName = "TableName";
    alexa.registerHandlers(gameHandlers, initialHandlers, inGameHandlers);
    alexa.execute();
}

const states = {
    INITIAL: "_INITIAL",
    INGAME: "_INGAME"
};

function rollDice(){
    const min = 2;
    const max = 12;
    var roll = Math.floor(Math.random() * (max - min + 1)) + min;
    return roll;
}

// handlers when players are placing two roads and two houses
var initialHandlers = Alexa.CreateStateHandler(states.INITIAL, {
    "StartIntent": function () {
        this.emit(":ask", "Welcome to Settlers of Catan! Would you like to start a new game?",
                          "Say yes to start a new game or no to quit");
    },

    "NewGameIntent": function() {
        this.attributes["rollList"] = [];
        this.handler.state = states.INGAME;
        this.emitWithState("RollIntent");// call in game roll function
    }
 });

// handlers when the game has started till the end of the game
var inGameHandlers = Alexa.CreateStateHandler(states.INGAME, {
    // rolls the dice and adds the number to the end of the list
    "RollIntent": function() {
        var roll = rollDice();
        this.attributes["rollList"].push(roll);
        this.emit("RollIntent", roll);
    },

    //if invoked by user get from request and add roll to end of list
    "AddRollIntent": function(roll) {
        var roll = parseInt(this.event.request.intent.slots.number.value);
        if (roll < 2 || roll > 12) {
            var repromptSpeech = "please say two, twelve, or a number between 2 and 12";
            this.emit(":elicitSlot", "number", "I could not add that to my list, " + repromptSpeech, repromptSpeech);
        } else {
            this.attributes["rollList"].push(roll);
            this.emit(":tell", "I have added the number" + roll);
        }
    },

    // removes roll from the end of the list
    "UndoRollIntent": function() {
        this.attributes["rollList"].pop();
        this.emit(":tell", "I have undone the roll");
    },

    // returns the number from the end of the list
    "LastRollIntent": function() {
        var rList = this.attributes["rollList"];
        this.emit(":tell", "The last roll was " + rList[rList.length - 1]);
    },

    "StatisticsIntent": function() {

    },

    "EndGameIntent": function() {
        // confirm end
        // clean up stuff
    }

});

// general handlers not bound to a state
var gameHandlers = {
    "LaunchRequest": function () {
        this.handler.state = states.INITIAL;
        this.emit("StartIntent");
    },

    "RollIntent": function(roll) {
        if (roll === undefined) {
            roll = rollDice();
        }
        this.emit(":tell", roll);
    },

    "AMAZON.HelpIntent": function() {
        this.emit(":tell", "")
    }

    "AMAZON.StopIntent": function() {
        //quit skill
    }
}
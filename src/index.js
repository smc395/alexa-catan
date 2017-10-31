"use strict"
const Alexa = require("alexa-sdk");

exports.handler = function(event, context, callback){
    const alexa = Alexa.handler(event, context, callback);
    //alexa.dynamoDBTableName = "TableName";
    alexa.registerHandlers(gameHandlers, inGameHandlers);
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

// handlers before the game starts
var initialHandlers = Alexa.CreateStateHandler(states.INITIAL, {
    "StartIntent": function () {
        this.emit(":ask", "Ready to start a new game?", "Say yes to start or no to quit");
    },

    "AMAZON.YesIntent": function() {
        this.attributes["rollList"] = []; // reset roll list
        this.attributes["elapsedTurns"] = 1;
        this.handler.state = states.INGAME;
        this.emitWithState("FirstRollIntent"); // call in game roll function
    },

    "AMAZON.NoIntent": function(){
        this.handler.state = "";
        this.response.speak("Ok see you next time");
        this.emit(":responseReady");
    }
 });

// handlers when the game has started till the end of the game
var inGameHandlers = Alexa.CreateStateHandler(states.INGAME, {

    "FirstRollIntent": function() {
        var roll = rollDice();
        this.attributes["rollList"].push(roll);
        this.emit(":tell", "Starting a new game, the first roll is " + roll);
    },

    // rolls the dice and adds the number to the end of the list
    "RollIntent": function() {
        var roll = rollDice();
        var turns = this.attributes["elapsedTurns"];
        this.attributes["rollList"].push(roll);
        this.attributes["elapsedTurns"] = turns + 1;
        this.emit("RollIntent", roll);
    },

    //if invoked by user get from request and add roll to end of list
    "AddRollIntent": function() {
        var roll = parseInt(this.event.request.intent.slots.number.value);
        if (isNaN(roll) || roll < 2 || roll > 12) {
            var repromptSpeech = "please say two, twelve, or a number between 2 and 12";
            this.emit(":elicitSlot", "number", "I could not add that to my list, " + repromptSpeech, repromptSpeech);
        } else {
            this.attributes["rollList"].push(roll);
            var turns = this.attributes["elapsedTurns"];
            this.attributes["elapsedTurns"] = turns + 1;
            this.emit(":tell", "I have added the roll " + roll);
        }
    },

    // removes roll from the end of the list
    "UndoRollIntent": function() {
        this.attributes["rollList"].pop();
        var turns = this.attributes["elapsedTurns"];
        this.attributes["elapsedTurns"] = turns - 1;
        this.emit(":tell", "I have undone the roll");
    },

    // returns the number from the end of the list
    "LastRollIntent": function() {
        var rList = this.attributes["rollList"];
        this.emit(":tell", "The last roll was " + rList[rList.length - 1]);
    },

    "StatisticsIntent": function() {
        var speechOutput = "What statistic would you like to hear?";
        this.emit(":ask", speechOutput, speechOutput);
    },

    "StatisticsHelpIntent": function() {
    },

    "MostRollIntent": function() {
        var rList = this.attributes["rollList"];
        if (rList.length == 0){
            this.emit(":tell", "You need to roll first!");
        }
        rList = rList.sort(function(a, b){return b - a}); // sort list is descending order

    },

    "LeastRollIntent": function() {
        if (rList.length == 0){
            this.emit(":tell", "You need to roll first!");
        }
    },

    "TopThreeRollsIntent": function() {
        if (rList.length < 3){
            this.emit(":tell", "You need to roll more first!");
        }
    },

    "NumberOfTurnsIntent": function() {
        this.emit(":tell", this.attributes["elapsedTurns"] + " turns have passed since the start of the game");
    },

    "EndGameIntent": function() {
        // confirm end
        // clean up stuff
    }
});

// general handlers not bound to a state
var gameHandlers = {
    "LaunchRequest": function() {
        this.emit(":tell", "Welcome to Settlers of Catan! Let me know when you are ready to start a new game");
    },

    "NewGameIntent": function() {
        this.handler.state = states.INITIAL;
        this.emitWithState("StartIntent")
    },

    "RollIntent": function(roll) {
        if (roll === undefined) {
            roll = rollDice();
        }
        this.emit(":tell", roll);
    },

    "AMAZON.HelpIntent": function() {
        this.emit(":tell", "")
    },

    "AMAZON.StopIntent": function() {
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    }
}
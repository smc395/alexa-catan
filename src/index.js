const Alexa = require("alexa-sdk");

exports.handler = function(event, context, callback){
    const alexa = Alexa.handler(event, context, callback);
    //alexa.dynamoDBTableName = "TableName";
    alexa.registerHandlers(gameHandlers, initialHandlers, inProgressHandlers);
    alexa.execute();
}

const states = {
    INITIAL: "_INITIAL",
    INPROGRESS: "_INPROGRESS"
};

// handlers when players are placing two roads and two houses
var initialHandlers = Alexa.CreateStateHandler(states.INITIAL, {
    "LaunchRequest": function () {
        this.emit("StartIntent");
    },

    "StartIntent": function () {
        this.emit(":ask", "Hello! Welcome to Settlers of Catan!");
    },

    "AMAZON.HelpIntent":function () {
        this.emit(":tell", "")
    }
 });

// handlers when the game has started till the end of the game
var inProgressHandlers = Alexa.CreateStateHandler(states.INPROGRESS, {
    "RollIntent": function () {
        this.emit("RollIntent");
        this.emit("AddRollIntent");
    }

    "AddRollIntent": function () {
        //add roll to end of list of numbers
    }
});

// general handlers not bound to a state
var gameHandlers = {
    "RollIntent": function () {
        const min = 2;
        const max = 12;
        var roll = Math.floor(Math.random() * (max - min + 1)) + min;
        this.emit(":tell", roll);
    },
}
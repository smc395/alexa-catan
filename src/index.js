"use strict";

const Alexa = require("alexa-sdk");

exports.handler = function(event, context, callback){
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = "amzn1.ask.skill.6fcf0010-f714-4fc0-a510-ebbf3d5e3910";
    //alexa.dynamoDBTableName = "TableName";
    alexa.registerHandlers(generalHandlers, gameHandlers, initialHandlers, inGameHandlers, endGameHandlers);
    alexa.execute();
};

const states = {
    LAUNCH: "_LAUNCHGAME",
    INITIAL: "_INITIAL",
    INGAME: "_INGAME",
    ENDGAME: "_ENDGAME"
};

function rollDice(){
    const min = 2;
    const max = 12;
    var roll = Math.floor(Math.random() * (max - min + 1)) + min;
    return roll;
}

function findMinIndex(array){
    var minValue = array[array.length-1];
    var minIndex = array.indexOf(minValue);
    return minIndex;
}

// creates a map of roll values to their frequency
function countRollListElements(list) {
    var rList = list;
    rList = rList.sort(function(a, b){return b - a}); // sort list in descending order

    var frequencyTable = {};
    while(rList.length > 0){
        var minIndex = findMinIndex(rList);
        var minValueList = rList.slice(minIndex); // returns array of smallest value in rList
        var minVal = minValueList[0];
        frequencyTable[minVal] = minValueList.length;
        rList.splice(minIndex, minValueList.length); // remove smallest value in rList
    }
    return frequencyTable;
}

// find the most rolled count
function findMostRolledCount(rollFrequencies) {
    var mostRolledCount = 0;
    for(var v in rollFrequencies){
        if(rollFrequencies[v] > mostRolledCount){
            mostRolledCount = rollFrequencies[v];
        }
    }
    return mostRolledCount;
}

// find the values equal to the most rolled count
function findMostRolledList(rollFrequencies, mostRolledCount) {
    var mostRolledList = [];
    for(var v in rollFrequencies){
        if(rollFrequencies[v] === mostRolledCount){
            mostRolledList.push(v);
        }
    }
    return mostRolledList;
}

// find the least rolled count
function findLeastRolledCount(rollFrequencies) {
    var leastRolledCount = Infinity;
    for(var v in rollFrequencies){
        if(rollFrequencies[v] < leastRolledCount){
            leastRolledCount = rollFrequencies[v];
        }
    }
    return leastRolledCount;
}

// find the values equal to the least rolled count
function findLeastRolledList(rollFrequencies, leastRolledCount) {
    var leastRolledList = [];
    for(var v in rollFrequencies){
        if(rollFrequencies[v] === leastRolledCount){
            leastRolledList.push(v);
        }
    }
    return leastRolledList;
}

// handlers before the game starts
var initialHandlers = Alexa.CreateStateHandler(states.INITIAL, {
    "StartIntent": function() {
        this.emit(":ask", "Ready to start a new game?", "Say yes to start or no to quit");
    },

    "AMAZON.HelpIntent": function() {
        this.emit(":tell", "To play, simply say 'roll' and I'll roll the dice, Say 'add' with a number to manually add a roll, " +
            "Say 'undo' to undo the last roll, Say 'statistics help' to hear some statistics I can give you about the game");
    },

    "AMAZON.YesIntent": function() {
        this.attributes["rollList"] = []; // reset roll list
        this.attributes["elapsedTurns"] = 1;
        this.handler.state = states.INGAME;
        this.emitWithState("FirstRollIntent"); // call in game roll function
    },

    "AMAZON.NoIntent": function(){
        this.handler.state = states.LAUNCH;
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
        if(this.attributes["rollList"].length > 0){
            var turns = this.attributes["elapsedTurns"];
            this.attributes["elapsedTurns"] = turns - 1;
        }
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
        this.emit(":tell", "Say 'most rolled' and I'll tell you the most rolled number, Say 'turns' and I'll tell you how many " +
            "player turns it has been since you've started the game, Say 'least rolled' and I'll tell you the least rolled " +
            "number in the game, finally Say 'top three' to hear the top three rolls" );
    },

    // emits the value(s) and the most rolled frequency in the game
    "MostRollIntent": function() {
        if (this.attributes["rollList"].length === 0){
            this.emit(":tell", "You need to roll first!");
        }
        var list = JSON.parse(JSON.stringify(this.attributes["rollList"])); // to prevent session attributes from being altered
        var rollFrequencies = countRollListElements(list);
        var mostRolledCount = findMostRolledCount(rollFrequencies);
        var mostRolledList = findMostRolledList(rollFrequencies, mostRolledCount);

        var outputSpeech = "";
        if(mostRolledList.length > 1){
            var numString = ""
            for(var i = 0; i < mostRolledList.length; i++){
                numString = numString.concat(mostRolledList[i], ", ");
            }
            outputSpeech = "The most rolled numbers are " + numString + "with a frequency of " + mostRolledCount;
        } else {
            outputSpeech = "The most rolled number is " + mostRolledList[0] + " with a frequency of " + mostRolledCount;
        }

        this.response.speak(outputSpeech);
        this.emit(':responseReady');
    },

    // emits the value(s) and the least rolled frequency in the game
    "LeastRollIntent": function() {
        if (this.attributes["rollList"].length === 0){
            this.emit(":tell", "You need to roll first!");
        }
        var list = JSON.parse(JSON.stringify(this.attributes["rollList"])); // to prevent session attributes from being altered
        var rollFrequencies = countRollListElements(list);
        var leastRolledCount = findLeastRolledCount(rollFrequencies);
        var leastRolledList = findLeastRolledList(rollFrequencies, leastRolledCount);

        var outputSpeech = "";
        if(leastRolledList.length > 1){
            var numString = ""
            for(var i = 0; i < leastRolledList.length; i++){
                numString = numString.concat(leastRolledList[i], ", ");
            }
            outputSpeech = "The least rolled numbers are " + numString + "with a frequency of " + leastRolledCount;
        } else {
            outputSpeech = "The least rolled number is " + leastRolledList[0] + " with a frequency of " + leastRolledCount;
        }

        this.response.speak(outputSpeech);
        this.emit(':responseReady');
    },

    // emits the top three values of with frequencies (can be the same frequencies or different)
    "TopThreeRollsIntent": function() {
        if (this.attributes["rollList"].length < 3){
            this.emit(":tell", "You need to roll more first!");
        }
        var list = JSON.parse(JSON.stringify(this.attributes["rollList"])); // to prevent session attributes from being altered
        var rollFrequencies = countRollListElements(list);
        var mostRolledCount1 = findMostRolledCount(rollFrequencies);
        var mostRolledList1 = findMostRolledList(rollFrequencies, mostRolledCount1);
        var outputSpeech = "";

    // we only would get here if all there are 3 different numbers with the same frequency
        if(mostRolledList1.length === 3){
            var numString = ""
            for(var i = 0; i < mostRolledList1.length; i++){
                numString = numString.concat(mostRolledList1[i], ", ");
            }
            outputSpeech = "The top three rolled numbers are " + numString + "with a frequency of " + mostRolledCount1;
            this.response.speak(outputSpeech);
            this.emit(":responseReady");
        }

    // we only would get here if there are 2 different numbers with the same frequency or 1 number in the first list
        // remove roll value with the highest frequency
        for(var v1 in rollFrequencies){
            if(rollFrequencies[v1] === mostRolledCount1){
                delete rollFrequencies[v1];
            }
        }

        var mostRolledCount2 = findMostRolledCount(rollFrequencies);
        var mostRolledList2 = findMostRolledList(rollFrequencies, mostRolledCount2);

        if((mostRolledList1.length + mostRolledList2.length) >= 3){
            var numString1 = "";
            for(var j = 0; j < mostRolledList1.length; j++){
                numString1 = numString1.concat(mostRolledList1[j], ", ");
            }

            var numString2 = "";
            for(var k = 0; k < mostRolledList2.length; k++){
                numString2 = numString2.concat(mostRolledList2[k], ", ");
            }

            outputSpeech = "The top three rolled numbers are " + numString1 + "with a frequency of " + mostRolledCount1
                            + " and "+ numString2 + "with a frequency of " + mostRolledCount2;

            this.response.speak(outputSpeech);
            this.emit(":responseReady");
        }

    // we only would get here if each most roll list had one item in their lists
        for(var v2 in rollFrequencies){
            if(rollFrequencies[v2] === mostRolledCount2){
                delete rollFrequencies[v2];
            }
        }

        var mostRolledCount3 = findMostRolledCount(rollFrequencies);
        var mostRolledList3 = findMostRolledList(rollFrequencies, mostRolledCount3);

        outputSpeech = "The top three rolled numbers are " + mostRolledList1[0] + "  with a frequency of " + mostRolledCount1
                            + ", " + mostRolledList2[0] + " with a frequency of " + mostRolledCount2 + " and "
                            + mostRolledList3[0] + " with a frequency of " + mostRolledCount3;
        this.response.speak(outputSpeech);
        this.emit(":responseReady");
    },

    "NumberOfTurnsIntent": function() {
        this.emit(":tell", this.attributes["elapsedTurns"] + " turns have passed since the start of the game");
    },

    "AMAZON.HelpIntent": function() {
        this.emit(":tell", "To play, simply say 'roll' and I'll roll the dice, Say 'add' with a number to manually add a roll, " +
            "Say 'undo' to undo the last roll, Say 'statistics help' to hear some statistics I can give you about the game");
    },

    "EndGamePromptIntent": function() {
        this.handler.state = states.ENDGAME;
        this.emitWithState("EndGameConfirmIntent");
    }
});

var endGameHandlers = Alexa.CreateStateHandler(states.ENDGAME, {
    "EndGameConfirmIntent": function() {
        this.emit(":ask", "Are you sure you want to end the game?", "Say yes or no");
    },

    "AMAZON.YesIntent": function() {
        this.handler.state = states.LAUNCH;
        this.response.speak("Good game! Hope to see you next time!");
        this.emit(":responseReady");
    },

    "AMAZON.NoIntent": function() {
        this.handler.state = states.INGAME;
        this.response.speak("Ok back to the game!");
        this.emit(":responseReady");
    }
});

// general handlers not bound to a state
var generalHandlers = {
    "LaunchRequest": function() {
        this.handler.state = states.LAUNCH;
        this.emit(":tell", "Welcome to Settlers of Catan! Say new game to start a new game");
    },

    "RollIntent": function(roll) {
        if (roll === undefined) {
            roll = rollDice();
        }
        this.emit(":tell", roll);
    },

    "AMAZON.HelpIntent": function() {
        this.emit(":tell", "To play, simply say 'roll' and I'll roll the dice, Say 'add' with a number to manually add a roll, " +
            "Say 'undo' to undo the last roll, Say 'statistics help' to hear some statistics I can give you about the game");
    }
}

// handlers for before game starts and after skill launch
var gameHandlers = Alexa.CreateStateHandler(states.LAUNCH, {
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

    "AMAZON.StopIntent": function() {
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    }
});
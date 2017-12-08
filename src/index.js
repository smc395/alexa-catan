"use strict";

const Alexa = require("alexa-sdk");
const imageObj = {
            smallImageUrl: "https://raw.githubusercontent.com/smc395/alexa-catan/master/src/images/logo_720x480.png",
            largeImageUrl: "https://raw.githubusercontent.com/smc395/alexa-catan/master/src/images/logo_1200x800.png"
        };

exports.handler = function(event, context, callback){
    const alexa = Alexa.handler(event, context, callback);
    alexa.dynamoDBTableName = "";
    alexa.registerHandlers(generalHandlers, gameHandlers, initialHandlers, inGameHandlers, endGameHandlers);
    alexa.execute();
};

// ***************** GAME STATES *****************

const states = {
    LAUNCH: "_LAUNCHGAME",
    INITIAL: "_INITIAL",
    INGAME: "_INGAME",
    ENDGAME: "_ENDGAME"
};

// ***************** HELPER FUNCTIONS *****************

function rollDice() {
    const min = 1;
    const max = 6;
    var dice1 = Math.floor(Math.random() * (max - min + 1)) + min;
    var dice2 = Math.floor(Math.random() * (max - min + 1)) + min;
    var roll = dice1 + dice2;
    return roll;
}

function incrementTurn(numOfTurns) {
    var turns = numOfTurns + 1;
    return turns;
}

function decrementTurn(numOfTurns) {
    var turns = numOfTurns - 1;
    return turns;
}

function findMinIndex(array) {
    array = array.sort(function(a, b){return b - a;}); // sort list in descending order
    var minValue = array[array.length-1];
    var minIndex = array.indexOf(minValue);
    return minIndex;
}

// creates a map of roll values to their frequency
function countRollListElements(list) {
    var rList = list;
    var frequencyTable = {};
    var minIndex;
    var minValueList;
    var minVal;
    while(rList.length > 0){
        minIndex = findMinIndex(rList);
        minValueList = rList.slice(minIndex); // array of smallest value in rList
        minVal = minValueList[0];
        frequencyTable[minVal] = minValueList.length;
        rList.splice(minIndex, minValueList.length); // remove smallest value in rList
    }
    return frequencyTable;
}

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

// ***************** GAME STATE HANDLERS *****************

// general handlers not bound to a state
var generalHandlers = {
    "LaunchRequest": function() {
        this.handler.state = states.LAUNCH;
        var outputSpeech = "Welcome to Settlers of Catan Helper! If this is your first time using this skill, please say 'help' to learn how to use it";
        this.emit(":ask", outputSpeech, outputSpeech);
    },

    // so in game RollIntent can access this intent
    "RollIntent": function(roll) {
        if (roll === undefined) {
            roll = rollDice();
        }
        this.emit(":tell", roll);
    },

    "GameStatus": function() {
        this.emit(":tell", "There is no game in progress.");
    },

    "SessionEndedRequest": function() {
        this.emit(":saveState"); //save attributes to DB
    },

    "Unhandled": function() {
        const message = "Sorry, I didn't get that. Please say it again.";
        this.response.speak(message).listen(message);
        this.emit(':responseReady');
    }
};

// general skill handlers after game launch
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

    "AMAZON.HelpIntent": function() {
        var speechOutput = "<prosody rate='85%'><p><s>During the initial part of the game, when you place your first two houses and roads, you can ask me to roll the dice for you.</s>"
            + "<s>Then, when you are ready to begin the game, say new game.</s></p> <p><s>During the game, you can use me to roll the dice for you.</s>"
            + "<s>If not, during the game you can tell me to add a roll, or undo the last roll.</s></p> <p><s>I also track statistics during the game"
            + "such as the number of elapsed turns, the last rolled number, most rolled number, least rolled number, three most rolled numbers, roll frequency for an individual number, or the roll frequency for all numbers.</s>"
            + "<s>Say 'statistics help' at any time during the game to hear the statistics I can give you.</s></p><p><s>When you are ready to end the game let me know.</s></p><p><s>Now starting the initial part of the game.</s></p></prosody>"

        var cardText = "During the initial part of the game you can:\n* Roll the dice\n* Start a new game\n" +
                        "During the game you can:\n* Roll the dice\n* Add a roll\n* Undo a roll\n* End the game\n" +
                        "Statistics I can give you:\n* Elapsed turns\n* Last rolled number\n* Most rolled number\n* Least rolled number" +
                        "\n* Three most rolled numbers\n* Individual number frequency\n* All number frequencies"

        var cardTitle = "Settlers Skill Commands";

        this.emit(":tellWithCard", speechOutput, cardTitle, cardText, imageObj);
    },

    "AMAZON.CancelIntent": function() {
        this.response.speak("Cancelling");
        this.emit(':responseReady');
    },

    "AMAZON.StopIntent": function() {
        this.response.speak("Stopping");
        this.emit(':responseReady');
    },

    "QuitIntent": function() {
        this.handler.state = "";
        delete this.attributes.STATE;
        this.response.speak("Thanks for using Catan Helper, Goodbye!");
        this.emit(':responseReady');
    },

    "GameStatus": function() {
        this.emit(":tell", "You are currently in the initial part of the game. When ready, you can begin a new game.");
    },

    // in case someone uses the invocation word
    "LaunchRequest": function() {
        this.emitWithState("GameStatus");
    },

    "Unhandled": function() {
        const message = "Sorry, I didn't get that. Please say it again.";
        this.response.speak(message).listen(message);
        this.emit(':responseReady');
    }
});

// handlers before the game starts
var initialHandlers = Alexa.CreateStateHandler(states.INITIAL, {
    "StartIntent": function() {
        var outputSpeech = "Finished placing your initial pieces and ready to start a new game?";
        this.emit(":ask", outputSpeech, outputSpeech);
    },

    "AMAZON.HelpIntent": function() {
        var speechOutput = "<prosody rate='85%'><p><s>During the initial part of the game, when you place your first two houses and roads, you can ask me to roll the dice for you.</s>"
            + "<s>Then, when you are ready to begin the game, say new game.</s></p> <p><s>During the game, you can use me to roll the dice for you.</s>"
            + "<s>If not, during the game you can tell me to add a roll, or undo the last roll.</s></p> <p><s>I also track statistics during the game"
            + "such as the number of elapsed turns, the last rolled number, most rolled number, least rolled number, three most rolled numbers, roll frequency for an individual number, or the roll frequency for all numbers.</s>"
            + "<s>Say 'statistics help' at any time during the game to hear the statistics I can give you.</s></p><p><s>When you are ready to end the game let me know.</s></p><p><s>Now starting the initial part of the game.</s></p></prosody>"

        var cardText = "During the initial part of the game you can:\n* Roll the dice\n* Start a new game\n" +
                        "During the game you can:\n* Roll the dice\n* Add a roll\n* Undo a roll\n* End the game\n" +
                        "Statistics I can give you:\n* Elapsed turns\n* Last rolled number\n* Most rolled number\n* Least rolled number" +
                        "\n* Three most rolled numbers\n* Individual number frequency\n* All number frequencies"

        var cardTitle = "Settlers Skill Commands";

        this.emit(":tellWithCard", speechOutput, cardTitle, cardText, imageObj);
    },

    "AMAZON.YesIntent": function() {
        this.attributes["rollList"] = []; // reset roll list
        this.attributes["elapsedTurns"] = 1;
        this.handler.state = states.INGAME;
        this.emitWithState("FirstRollIntent"); // call in game roll function
    },

    "AMAZON.NoIntent": function(){
        this.handler.state = states.LAUNCH;
        this.response.speak("Okay, let me know when you are ready.");
        this.emit(":responseReady");
    },

    "AMAZON.CancelIntent": function() {
        this.handler.state = states.LAUNCH;
        this.response.speak("Okay, let me know when you are ready.");
        this.emit(':responseReady');
    },

    "AMAZON.StopIntent": function() {
        this.handler.state = states.LAUNCH;
        this.response.speak("Okay, let me know when you are ready.");
        this.emit(':responseReady');
    },

    "QuitIntent": function() {
        this.handler.state = "";
        delete this.attributes.STATE;
        this.response.speak("Thanks for using Catan Helper, Goodbye!");
        this.emit(':responseReady');
    },

    "GameStatus": function() {
        this.emit(":ask", "You are about to start a new game. Would you like to start now?");
    },

    // in case someone uses the invocation word
    "LaunchRequest": function() {
        this.emitWithState("GameStatus");
    },

    "Unhandled": function() {
        const message = "Sorry, I didn't get that. Please say it again.";
        this.response.speak(message).listen(message);
        this.emit(':responseReady');
    }
 });

// handlers when the game has started
var inGameHandlers = Alexa.CreateStateHandler(states.INGAME, {

    "FirstRollIntent": function() {
        var roll = rollDice();
        this.attributes["rollList"].push(roll);
        this.emit(":tell", "Starting a new game, the first roll is " + roll);
    },

    // rolls the dice and adds the number to the end of the list
    "RollIntent": function() {
        var roll = rollDice();
        this.attributes["rollList"].push(roll);
        var turns = incrementTurn(this.attributes["elapsedTurns"]);
        this.attributes["elapsedTurns"] = turns;
        this.emit("RollIntent", roll);
    },

    //if invoked by user get from request and add roll to end of list
    "AddRollIntent": function() {
        var roll = parseInt(this.event.request.intent.slots.number.value);
        if (isNaN(roll) || roll < 2 || roll > 12) {
            var repromptSpeech = "I could not add that to the roll list. Please try again.";
            this.emit(":ask", repromptSpeech, repromptSpeech);
        } else {
            this.attributes["rollList"].push(roll);
            var turns = incrementTurn(this.attributes["elapsedTurns"]);
            this.attributes["elapsedTurns"] = turns;
            this.emit(":tell", "I have added " + roll + " to the roll list.");
        }
    },

    // removes roll from the end of the roll list
    "UndoRollIntent": function() {
        this.attributes["rollList"].pop();
        if(this.attributes["rollList"].length > 0){
            var turns = decrementTurn(this.attributes["elapsedTurns"]);
            this.attributes["elapsedTurns"] = turns;
        }
        this.emit(":tell", "I have undone the roll");
    },

    // emits the number from the end of the roll list
    "LastRollIntent": function() {
        var rList = this.attributes["rollList"];
        this.emit(":tell", "The last roll was " + rList[rList.length - 1]);
    },

    // asks what statistic a user would like to hear
    "StatisticsIntent": function() {
        var speechOutput = "What statistic would you like to hear?";
        this.emit(":ask", speechOutput, speechOutput);
    },

    // emits the statistics that users can receive
    "StatisticsHelpIntent": function() {
        var speechOutput = "<prosody rate='90%'>I can tell you the last rolled number, most rolled number, least rolled number, "
            +"number of turns since you've started the game, top three rolls, roll frequency for an individual number, or the roll frequency for all numbers.</prosody>";

        var cardText = "Statistics I can give you:\n* Elapsed turns\n* Last rolled number\n* Most rolled number\n* Least rolled number" +
                        "\n* Three most rolled numbers\n* Individual number frequency\n* All number frequencies"

        var cardTitle = "Settlers Statistics Commands";

        this.emit(":tellWithCard", speechOutput, cardTitle, cardText, imageObj);
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

    // emits the top three values with frequencies (can be the same frequencies or different)
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
                            + ". Next is "+ numString2 + "with a frequency of " + mostRolledCount2;

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
                            + ". Next is " + mostRolledList2[0] + " with a frequency of " + mostRolledCount2 + ". Finally, "
                            + mostRolledList3[0] + " with a frequency of " + mostRolledCount3;
        this.response.speak(outputSpeech);
        this.emit(":responseReady");
    },

    // emits the number of elapsed turns
    "NumberOfTurnsIntent": function() {
        this.emit(":tell", this.attributes["elapsedTurns"] + " turns have passed since the start of the game");
    },

    // triggers the EndGameConfirmIntent in the endGameHandlers
    "EndGamePromptIntent": function() {
        this.handler.state = states.ENDGAME;
        this.emitWithState("EndGameConfirmIntent");
    },

    // emits the game state
    "GameStatus": function() {
        this.emit(":ask", "You are currently in a game. What would you like to do?");
    },

    // emits the roll frequency for all numbers rolled in the game
    "AllNumberStatisticsIntent": function() {
        if (this.attributes["rollList"].length === 0){
            this.emit(":tell", "You need to roll first!");
        }
        var list = JSON.parse(JSON.stringify(this.attributes["rollList"])); // to prevent session attributes from being altered
        var rollFrequencies = countRollListElements(list);
        var outputSpeech = "The statistics for all numbers are as follows: ";
        var noRollsList = [2,3,4,5,6,7,8,9,10,11,12]; // list of numbers that have not been rolled yet
        var cardFreqText = "";

        // create a string listing all the numbers in the roll list and their frequencies
        for(var i = 2; i < 13; i++) {
            var f = rollFrequencies[i];
            if(f !== undefined){
                noRollsList.splice(noRollsList.indexOf(i), 1);
                outputSpeech = outputSpeech + "The number " + i + " has a roll frequency of " + f + ". ";
                cardFreqText = cardFreqText + i + " has a roll frequency of " + f + ".\n";
            }
        }

        // concat all numbers in the no rolls list in a string
        var noRollString = ""
        for(var n in noRollsList) {
            noRollString = noRollString.concat(noRollsList[n], ", ");
        }

        // determine the last sentence string
        var endString = "";
        if(noRollsList.length == 1){
            endString = "\nThe number " + noRollString + "has not been rolled.";
        } else if (noRollsList.length > 1) {
            endString = "\nThe numbers " + noRollString + "have not been rolled.";
        }

        var speechOutput = "<prosody rate='90%'><p>" + outputSpeech + "</p><p>"+ endString +"</p></prosody>";

        var cardText = cardFreqText + endString;

        var cardTitle = "All Roll Frequencies";

        this.emit(":tellWithCard", speechOutput, cardTitle, cardText, imageObj);
    },

    // emits the roll frequency for the user specified number
    "NumberStatisticIntent": function() {
        var num = parseInt(this.event.request.intent.slots.statNumber.value);
        if (isNaN(num) || num < 2 || num > 12) {
            var repromptSpeech = "Sorry, I couldn't get the statistic for that number. Please try again."
            this.emit(":ask", repromptSpeech, repromptSpeech);
        } else {
            var list = JSON.parse(JSON.stringify(this.attributes["rollList"]));
            var rollFrequencies = countRollListElements(list);
            var frequency = rollFrequencies[num];
            if(frequency === undefined){
                this.emit(":tell", "The number " + num + " has not been rolled yet.");
            }
            this.emit(":tell", "The number " + num + " has a roll frequency of " + frequency);
        }
    },

    "AMAZON.HelpIntent": function() {
        var speechOutput = "<p>I can roll the dice.</p> <p>If not, you can tell me to add a roll." +
            " You can also undo the last roll.</p> Say 'statistics help' to hear the statistics I can give you about the game."

        var cardText = "You can:\n* Roll the dice\n* Add a roll\n* Undo a roll\n* End the game\n" +
                        "Statistics I can give you:\n* Elapsed turns\n* Last rolled number\n* Most rolled number\n* Least rolled number" +
                        "\n* Three most rolled numbers\n* Individual number frequency\n* All number frequencies"

        var cardTitle = "Settlers Skill Commands";

        this.emit(":tellWithCard", speechOutput, cardTitle, cardText, imageObj);
    },

    "AMAZON.CancelIntent": function() {
        this.response.speak("Cancel");
        this.emit(':responseReady');
    },

    "AMAZON.StopIntent": function() {
        this.response.speak("Stopping");
        this.emit(':responseReady');
    },

    // in case someone uses the invocation word
    "LaunchRequest": function() {
        this.emitWithState("GameStatus");
    },

    "Unhandled": function() {
        const message = "Sorry, I didn't get that. Please say it again.";
        this.response.speak(message).listen(message);
        this.emit(':responseReady');
    }
});

// handlers when the game is ending
var endGameHandlers = Alexa.CreateStateHandler(states.ENDGAME, {
    "EndGameConfirmIntent": function() {
        this.emit(":ask", "Are you sure you want to end the game?", "Say yes or no to wanting to end the game");
    },

    "AMAZON.YesIntent": function() {
        this.handler.state = "";
        delete this.attributes.STATE;
        this.response.speak("Good game! Hope to see you next time!");
        this.emit(":responseReady");
    },

    "AMAZON.NoIntent": function() {
        this.handler.state = states.INGAME;
        this.response.speak("Okay, back to the game!");
        this.emit(":responseReady");
    },

    "GameStatus": function() {
        this.emit(":ask", "You are about to end the game. Would you like to end your current game?");
    },

    // in case someone uses the invocation word
    "LaunchRequest": function() {
        this.emitWithState("GameStatus");
    },

    "Unhandled": function() {
        const message = "Sorry, I didn't get that. Please say it again.";
        this.response.speak(message).listen(message);
        this.emit(':responseReady');
    }
});

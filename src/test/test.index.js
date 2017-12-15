const states = {
    LAUNCH: "_LAUNCHGAME",
    INITIAL: "_INITIAL",
    INGAME: "_INGAME",
    ENDGAME: "_ENDGAME"
};

var helpers = {

	rollDice: function () {
	    const min = 1;
	    const max = 6;
	    var dice1 = Math.floor(Math.random() * (max - min + 1)) + min;
	    var dice2 = Math.floor(Math.random() * (max - min + 1)) + min;
	    var roll = dice1 + dice2;
	    return roll;
	},

	incrementTurn: function (numOfTurns) {
	    var turns = numOfTurns + 1;
	    return turns;
	},

	decrementTurn: function (numOfTurns) {
	    var turns = numOfTurns - 1;
	    return turns;
	},

	findMinIndex: function (array) {
	    var minValue = array[array.length-1];
	    var minIndex = array.indexOf(minValue);
	    return minIndex;
	},

	// creates a map of roll values to their frequency
	countRollListElements: function (list) {
	    var rList = list;
	    rList = rList.sort(function(a, b){return b - a;}); // sort list in descending order

	    var frequencyTable = {};
	    var minIndex;
	    var minValueList;
	    var minVal;
	    while(rList.length > 0){
	        minIndex = this.findMinIndex(rList);
	        minValueList = rList.slice(minIndex); // array of smallest value in rList
	        minVal = minValueList[0];
	        frequencyTable[minVal] = minValueList.length;
	        rList.splice(minIndex, minValueList.length); // remove smallest value in rList
	    }
	    return frequencyTable;
	},

	findMostRolledCount: function (rollFrequencies) {
	    var mostRolledCount = 0;
	    for(var v in rollFrequencies){
	        if(rollFrequencies[v] > mostRolledCount){
	            mostRolledCount = rollFrequencies[v];
	        }
	    }
	    return mostRolledCount;
	},

	// find the values equal to the most rolled count
	findMostRolledList: function (rollFrequencies, mostRolledCount) {
	    var mostRolledList = [];
	    for(var v in rollFrequencies){
	        if(rollFrequencies[v] === mostRolledCount){
	            mostRolledList.push(v);
	        }
	    }
	    return mostRolledList;
	},

	findLeastRolledCount: function (rollFrequencies) {
	    var leastRolledCount = Infinity;
	    for(var v in rollFrequencies){
	        if(rollFrequencies[v] < leastRolledCount){
	            leastRolledCount = rollFrequencies[v];
	        }
	    }
	    return leastRolledCount;
	},

	// find the values equal to the least rolled count
	findLeastRolledList: function (rollFrequencies, leastRolledCount) {
	    var leastRolledList = [];
	    for(var v in rollFrequencies){
	        if(rollFrequencies[v] === leastRolledCount){
	            leastRolledList.push(v);
	        }
	    }
	    return leastRolledList;
	}
}

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

module.exports.helper = helpers;
module.exports.gen = generalHandlers;
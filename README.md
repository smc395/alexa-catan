![Repo Logo](/src/images/logo_720x480.png)
# alexa-catan
This repository contains the source code for the **Unofficial Settlers of Catan Helper** skill for Amazon Alexa.

## Purpose
The purpose of this skill is to act as an aid to the Settlers of Catan game by Klaus Teuber. Main features of the skill include the ability to \"roll the dice\" and track statistics about the game. Users may also tell the skill to add a number to a roll list or undo rolls. 

Statistics currently tracked include:
* Number of elapsed turns
* Most rolled number 
* Least rolled number
* Top three rolled numbers
* Individual roll frequencies
* All roll frequencies

Another purpose of this skill is to learn more about Amazon Web Services and to try to develop an Amazon Alexa skill.

## Tools Used
* Amazon Lambda (with a Node.js 6.10 runtime)
* Amazon DynamoDB
* ![Amazon Alexa SDK](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs)
* Sublime Text
* Google Drawings (for graphics)
#### Testing Tools Used
* Amazon API Gateway
* Jest
* Postman

## Future Improvement Plans
* Sound effects
* Catan facts
* Ability to indicate a player's turn by name (e.g. It's Taylor's turn)
* Ability to give individual player statistics (e.g. number of 7s rolled)
* Statistics visualization
* _If you have any improvement suggestions please create an issue. Thanks!_

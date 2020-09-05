# Personalized Smart Mirror

This project is an implementation of set of modules on MagicMirror2 template that recognizes the users,authorizes and displays custom user content. An alexa skill is implemented to set an alarm with the time visible on the smart mirror. The commands "Alexa!Turn my mirror ON/OFF" are used to toggle the state of the smart mirror. 
# Modules
There are five different modules in this project.

## MMM-Face Recognition
The face recognition module is the implementation of Local Binary Patterns Histograms (LBPH) Algorithm. The images of users are captured, trained and recognized. 
This module provides the access restrictions for other modules.For example, an authorized user can see corresponding calendar events. 
This module is dependent on another internal module called MMM-FacialRecognitionTools where the LBPH algorithm is implemented along with the scripts to capture an image and train the model.
## Local Temperature
Not User restricted.
This module is to capture the temperature and humidity details of the room where the Smart Mirror is installed.
## Current Weather
Not user restricted.
This module is to get the local weather details through a cloud API.
## Weather Forecast
Not User restricted.
This module is to get the local weather forecast for 3 days through a cloud API.
## Calendar
User restricted - Custom Calendar.
This module is to display the calendar of the authorized user standing in front of the smart mirror. We have configured our UW student To Do list from canvas along with google calendar events displayed together.
## Alarm Clock
Not user restricted.
This module is to set an alarm on the smart mirror through a voice command. The time of the alarm is displayed on the mirror. At the time of the alarm, a pop up will appear on the smart mirror along with a customized tone from the speaker.
## MirrorMirrorOnTheWall

This module is to take a voice input and set an alarm on the smart mirror.

## MyMirrorAWSLambdaAlexaSkill

This is the code that is to be deployed on AWS Lambda to integrate between AWS IoT core and Alexa Skill

####  Eample Commands can be : 
	"Alexa! Ask My Mirror to set an alarm in 2 hours"
	"Alexa! Ask My Mirror to set an alarm at 8:00 AM"
This module has dependency on another internal module called MirrorMirrorOnTheWallSkill which has the AWS and Alexa Skill Kit configured.
## Alert
Not User restricted - Custom Calendar.
This module is to display the required content on the smart mirror in the form of an alert.


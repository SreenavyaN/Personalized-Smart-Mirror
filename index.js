'use strict';
const fs = require('fs');
const moment = require('moment');
require('moment-timezone');
const ask = require('ask-sdk');
const AWS = require('aws-sdk');

const SKILL_ID = "amzn1.ask.skill.491c4cf2-176a-4827-bdf1-48a949b47479";
const IOT_CORE_ENDPOINT = "a32x9rxd14xevl-ats.iot.us-east-1.amazonaws.com";
const SET_ALARM_TOPIC = "SmartMirror:set-alarm";
const SET_ALARM_NOTIF_TYPE = "SET_ALARM";

const iotData = new AWS.IotData({endpoint: IOT_CORE_ENDPOINT});

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Welcome to the IoT Project, you can say Hello and more!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('IoT Project ask Skill ', speechText)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
        .speak('This is our IoT project alexa skill to set alarm on magic mirror so do that!')
        .reprompt('I didn\'t catch that. What can I help you with?')
        .getResponse();
  },
};

const SessionEndedHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest' ||
        (handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent') ||
        (handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent');
  },
  handle(handlerInput) {
    console.log('IN: SessionEndedHandler.handle');
    return handlerInput.responseBuilder
        .speak('Okay! Have a Great Day!')
        .getResponse();
  },
};
const SetAlarmHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'SetAlarmIntent';
  },
  async handle(handlerInput) {
    console.log('IN SetAlarmHandler');
    let time = getResolvedValue(handlerInput.requestEnvelope, 'Time');
    let duration = getResolvedValue(handlerInput.requestEnvelope, 'Duration');
    let speakMsg = 'Alarm is not successfully set!';
    let gotTime = true;
    let alarmTime = moment.tz("America/Los_Angeles");
    if (time === undefined && duration !== undefined) {
      alarmTime.add(moment.duration(duration));
    } else if (time !== undefined && duration === undefined) {
      let todayTime = moment.duration(time);
      alarmTime.hours(todayTime.hours()).minutes(todayTime.minutes()).seconds(0).milliseconds(0);
    } else {
      speakMsg = "Sorry, this alarm input is malformed, please try again!";
      gotTime = false;
    }
    if (gotTime) {
      speakMsg = 'Will alarm ' + alarmTime.fromNow() + ' from now!';
    }
    const response = await publishSetAlarmMessage(alarmTime);
    if (undefined !== response) {
      speakMsg = 'Sorry, we have encountered an error to publish to IoT Data. Please try again.';
    }
    return handlerInput.responseBuilder
        .speak(speakMsg)
        .reprompt(speakMsg)
        .withSimpleCard('IoT Project ask Skill ', speakMsg)
        .getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    console.log('IN FallbackHandler');
    return handlerInput.responseBuilder
        .speak('Sorry, It seems there is some issue with setting the alarm. Please try again.')
        .reprompt('Sorry, It seems there is some issue with setting the alarm. Please try again.')
        .getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${JSON.stringify(error.message)}`);
    console.log(`handlerInput: ${JSON.stringify(handlerInput)}`);
    return handlerInput.responseBuilder
        .speak('Sorry, we have encountered an error. Please try again.')
        .reprompt('Sorry, we have encountered an error. Please try again.')
        .getResponse();
  },
};

function publishSetAlarmMessage(alarmTime) {
  return new Promise(((resolve, reject) => {
    iotData.publish({
      topic: SET_ALARM_TOPIC,
      payload: JSON.stringify({
        notification: SET_ALARM_NOTIF_TYPE,
        time: alarmTime.toISOString()
      })
    }, (error, result) => {
      if (error) {
        console.log('Error handled: ' + JSON.stringify(error));
        reject(error);
      } else {
        resolve();
      }
    });
  }));
}

function getResolvedValue(requestEnvelope, slotName) {
  if (requestEnvelope &&
      requestEnvelope.request &&
      requestEnvelope.request.intent &&
      requestEnvelope.request.intent.slots &&
      requestEnvelope.request.intent.slots[slotName] &&
      requestEnvelope.request.intent.slots[slotName].value &&
      requestEnvelope.request.intent.slots[slotName].name) {
    return requestEnvelope.request.intent.slots[slotName].value;
  }
  return undefined;
}

const RequestLog = {
  process(handlerInput) {
    console.log(`REQUEST ENVELOPE = ${JSON.stringify(handlerInput.requestEnvelope)}`);
  },
};

const ResponseLog = {
  process(handlerInput) {
    console.log(`RESPONSE BUILDER = ${JSON.stringify(handlerInput)}`);
    console.log(`RESPONSE = ${JSON.stringify(handlerInput.responseBuilder.getResponse())}`);
  },
};

exports.handler = ask.SkillBuilders.standard()
    .addRequestHandlers(
        LaunchRequestHandler,
        SetAlarmHandler,
        SessionEndedHandler,
        HelpHandler,
        FallbackHandler,
    )
    .addRequestInterceptors(
        RequestLog,
    )
    .addResponseInterceptors(ResponseLog)
    .addErrorHandlers(ErrorHandler)
    .withCustomUserAgent('sample/iot-project-skill/v1')
    .lambda();

/*
#exports.handler = function(event, context, callback) {
#	
#   if(event.request.type == 'IntentRequest'){
#	console.log(event.request.intent.type + " " + JSON.stringify(event.request.intent.slots));
#	}
#    let alexa = ask.handler(event, context);
#    alexa.APP_ID = APP_ID;
#    // To enable string internationalization (i18n) features, set a resources object.
#    alexa.resources = languageStrings;
#    alexa.registerHandlers(handlers);
#    alexa.execute();
#};
#
#var languageStrings = {
#    "en-US": {
#        "translation": {
#            "WELCOME_MESSAGE": "Hello my Queen, what can I do for you? ",
#            "WELCOME_REPROMPT": "I can show you text and images, if you give me commands like 'say you are the fairest of them all' or 'find Snow White'. I can also open or close a magic mirror module, if you say commands like 'open compliments', or 'close weather forecast'. What can I do for you, my Queen?",
#            "WELCOME_CARD": "Hello",
#            "HELP_MESSAGE": "Hello my Queen, I can show you text and images, if you give me commands like 'say you are the fairest of them all' or 'find Snow White'. I can also open or close a magic mirror module, if you say commands like 'open compliments', or 'close weather forecast'. What can I do for you, my Queen?",
#            "HELP_CARD": "Help",
#            "STOP_MESSAGE": "See you next time, my Queen!",
#            "STOP_CARD": "Goodbye",
#            "SHOW_TEXT": "Yes, my Queen. %s.",
#            "SHOW_TEXT_ERR": "Sorry, my Queen, I didn't get that. You can give me commands like 'display text of hello', or 'say you are the fairest of them all'. What can I do for you, my Queen?",
#            "SHOW_TEXT_CARD": "Display Text",
#            "ERROR_CARD": "Error"
#        }
#    },
#    "en-GB": {
#        "translation": {
#            "WELCOME_MESSAGE": "Hello my Queen, what can I do for you? ",
#            "WELCOME_REPROMPT": "I can show you text and images, if you give me commands like 'say you are the fairest of them all' or 'find Snow White'. I can also open or close a magic mirror module, if you say commands like 'open compliments', or 'close weather forecast'. What can I do for you, my Queen?",
#            "WELCOME_CARD": "Hello",
#            "HELP_MESSAGE": "Hello my Queen, I can show you text and images, if you give me commands like 'say you are the fairest of them all' or 'find Snow White'. I can also open or close a magic mirror module, if you say commands like 'open compliments', or 'close weather forecast'. What can I do for you, my Queen?",
#            "HELP_CARD": "Help",
#            "STOP_MESSAGE": "See you next time, my Queen!",
#            "STOP_CARD": "Goodbye",
#            "SHOW_TEXT": "Yes, my Queen. %s.",
#            "SHOW_TEXT_ERR": "Sorry, my Queen, I didn't get that. You can give me commands like 'display text of hello', or 'say you are the fairest of them all'. What can I do for you, my Queen?",
#            "SHOW_TEXT_CARD": "Display Text",
#            "ERROR_CARD": "Error"
#        }
#    }
#};
#
#var handlers = {
#    'LaunchRequest': function() {
#        this.emit('SayHello');
#    },
#    'MirrorMirrorHelloIntent': function() {
#        this.emit('SayHello');
#    },
#    'AMAZON.HelpIntent': function() {
#        this.emit(':askWithCard', this.t("HELP_MESSAGE"), this.t("HELP_MESSAGE"), this.t("HELP_CARD"), this.t("HELP_MESSAGE"));
#    },
#    'AMAZON.StopIntent': function() {
#        this.emit('StopCommand');
#    },
#    'AMAZON.CancelIntent': function() {
#        this.emit('StopCommand');
#    },
#    'ShowTextIntent': function() {
#        let displayText = this.event.request.intent.slots.displayText.value;
#        if (displayText) {
#            let alexa = this
#
#            // ask voice/card response to invoke after text is published to AWS IoT successfully
#            let alexaEmit = function() {
#                alexa.emit(':tellWithCard', alexa.t("SHOW_TEXT", displayText), alexa.t("SHOW_TEXT_CARD"), displayText)
#            }
#
#            // Send publish attempt to AWS IoT
#            MirrorMirror.displayText(displayText, alexaEmit);
#        } else {
#            this.emit(':askWithCard', this.t("SHOW_TEXT_ERR"), this.t("SHOW_TEXT_ERR"), this.t("ERROR_CARD"), this.t("SHOW_TEXT_ERR"))
#        }
#    },
#	'Unhandled': function() {
#		this.emit(':askWithCard', this.t("HELP_MESSAGE"), this.t("HELP_MESSAGE"), this.t("HELP_CARD"), this.t("HELP_MESSAGE"));
#	}
#};
*/
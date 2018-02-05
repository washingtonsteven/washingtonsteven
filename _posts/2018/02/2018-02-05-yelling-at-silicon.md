---
layout: post
title:  "Yelling at Silicon"
subtitle: "Getting Google Assistant to do what you want"
date:   2018-02-05
categories: google assistant javascript ifttt
---

Various voice-activated home assistants have been booming lately. It started off with Siri, and Google followed with their Assistant. Alexa came on the scene and even Cortana has given it a go.

These assistants come with a good set of features and functions that help you automate your life: setting timers, playing music, turning on and off lights, setting thermostats. It's all very helpful! However, regardless of how many functions exist, there's never going to be a one-size-fits-all solution.

So it's time to make one.

## A bus tracking app

My typical morning involves the typical things: waking up, checking Twitter while laying in bed for 20 minutes, rushing through breakfast/shower/dressing myself to get out the door on time. A part of this involves halting the whole process as I fiddle with my phone to bring up predictions from a bus tracking all ([Nextbus][nextbus] in this case). It would be so much easier if I could instead ask my phone (or Google Home) for the latest buses by my house.

To start, I built a quick function that interfaces with Nextbus' API. It accepts a stop name, and returns an object that has the prediction data that I need:

```javascript
exports.getPredictions = stopName => {
  // Nextbus needs a stopId to look up predictions
  // We have an object that maps stopNames to stopIds
  // This is statically defined in code, but it works
  // For the single-use case.
  const stopId = stops[stopName];

  const nextbusURL = `http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=mbta&stopId=${stopId}`;

  // The Nextbus API is an XML api, so we use the xml2js package
  // to convert that to JSON
  // Then we have a parseSchedule function to clean up that
  // JSON, only returning the results we want
  return request(nextbusURL)
    .then(xml => xml2js(xml))
    .then(json => parseSchedule(json))
}

const parseSchedule = json => {
  const cleanedUp = {};
  
  // Take `json` and extract only the info we care about

  return cleanedUp;
}
```

## Making sentences - `filter` and `join`

Before we can send this data to any voice assistant, we need to make actual, speakable sentences. 

The `cleanedUp` object from `parseSchedule` is a multi-dimensional array. The first dimension is a set of routes (bus numbers) and the second is the set of predictions for that route. Since these are in an array, we can use some of the new ES6 functions to parse this out into a set of sentences for each route.

Note: That routes with no predictions will show up as empty arrays, so we have to `filter` to get them out.

In the actual repo, I have this set up as a one-liner, but it's expanded/annotated below:

```javascript
exports.stringifyPredictions = (results, joiner = ". ") => {
  let resultsMessage = results.map(predictionList => {
    // predicitonList is a set of predictions for a route
    // Filter out the empty ones, then join them togeter
    return predictionList.filter(l => l.length > 0).join(joiner)
  }).filter(l => l.length > 0).join(joiner); // Filter and join again on the set of routes

  // Clean up resultsMessage, clear whitespace, etc.

  return resultsMessage;
}
```

## Make it web-accessible

In order to work, Google Assistant must be able to access our service over the web, where we will return what we want it to say as a JSON response. I use [Express][express] to set up a server to listen to queries from Google, and host on Heroku. 

## Conversiing with Google Assistant - Actions on Google and DialogFlow

Now that we have functions for getting prediction sentences, we need to hook up Google Assistant to respond to our voice, and reach out to our service to get the set of predictions. For that we use the [`actions-on-google`][aog] module from `npm` as well as [Dialogflow][df].

Before getting into code, we need to set up our all on the Google Developer Console and Dialogflow. Dialogflow is the glue between Google Assistant and our app, it receives the parsed voice input from Google Assistant, and will call our app via webhook in response. [I used this bit of documentation to get all of this set up][tut].

Part of said setup is making an "Action" that the service can respond to. This can be any sort of string that identifies what's happening; we just need to remember is when we get to coding up our response.

## Responding to requests with `actions-on-google`

The `actions-on-google` module works by parsing the request received from Google Assistant/Dialog flow, and calling a function based on what action was sent. This is done by setting up a map that maps action strings to functions. From there we just have to call `getPredictions`/`stringifyPredictions` to get our prediction sentences, and then pass that into a `tell` function that `actions-on-google` gives us!

```javascript
const App = require('actions-on-google').DialogflowApp;
const { getPredictions, stringifyPredictions } = require('./getPredictions');

// This is the action we set up in DialogFlow
const ASK_ACTION = 'ask_stop_by_name';

// We set up a parameter called stop_name, that is filled in
// when the voice input is parsed.
const STOP_NAME_ARGUMENT = 'stop_name';

module.exports = (request, response) => {
  const app = new App({request, response});

  let actionMap = new Map();
  actionMap.set(ASK_ACTION, app => {
    // getArgument() is a function from `actions-on-google`
    // that can parse out the argument from the
    // voice input.
    let stopName = app.getArgument(STOP_NAME_ARGUMENT);

    getPredictions(stopName)
      .then(results => stringifyPredictions(results))
      .then(resultsMessage => {
        if (resultsMessage === false) {
          // app.tell literally makes Google Assistant speak!
          app.tell(`There don't seem to be any buses at ${stopName}`);
        } else if (!resultsMessage) {
          app.tell(`Sorry, I don't have information for ${stopName}`);
        } else {
          app.tell(resultsMessage);
        }
      });
  });

  // The App, built based on the request/response we received,
  // will take in our map, figure out the action based
  // on what Dialogflow sent us, and then call the
  // relevant function.
  // When the action is 'ask_stop_by_name'
  app.handleRequest(actionMap);
}
```

[nextbus]: https://nextbus.com
[express]: https://expressjs.com
[aog]: https://www.npmjs.com/package/actions-on-google
[df]: https://dialogflow.com
[tut]: https://developers.google.com/actions/dialogflow/first-app
const WebSocket = require('ws');
const fs = require('fs');
const config = require('./config');
const axios = require('axios');
const https = require('https');
const querystring = require('querystring');
const timeseries = require('timeseries-analysis');
const express = require('express');
const d3 = require("d3");
var path = require('path');
const app = express();

app.use("/", express.static(__dirname + "/public"));
app.get('/chartdata', function(req,res) {
  let curTime = Date.now();
  let dataSlice = sliceByTime(curTime-(60000*3), curTime, eventData);
  let curBow = top5bow(arrayToBow(dataSlice))
  let keys = curBow.map(a =>a.key)
  let vals = curBow.map(a =>a.value)

  // make some calls to database, fetch some data, information, check state, etc...
  if(keys.length >= 1){
  var dataToSendToClient = {'labels': keys, 'data':vals};
  // convert whatever we want to send (preferably should be an object) to JSON
  } else {
    var dataToSendToClient = {'labels': [], 'data':[]};
  }
  var JSONdata = JSON.stringify(dataToSendToClient);
  res.send(JSONdata);
});

app.listen(80, function () {
  console.log('Example app listening on port 3000!')
});

const ws = new WebSocket('wss://graphigostream.prd.dlive.tv', 'graphql-ws');

//collecting data  
var eventData = new Map()

const recordData = message => {
  let splitStr = message.content.substr(1).slice(0, -1).split("/");
  let emote = splitStr[3];
  let time = Date.now();
  let dataEntry = emote;
  eventData.set(time, dataEntry);
  // console.log("eventData:",eventData);
};

function sliceByTime(startTime, endTime, xdata) {
  let chunk = [];
  for (const [key, value] of xdata) {
      if(key < endTime && key > startTime) {
        chunk.push(value);
      }
  }
  return chunk;
}

function arrayToBow(array) {
  let bow = {}
  for (const word of array) {
    if (!bow[word]) {
      bow[word] = 1;
    } else {
      bow[word] += 1;
    }
  }
  return bow;
}

const bow = {}

function top5bow(bow) {
  return d3.entries(bow).sort(function(a,b) {return a.value < b.value}).slice(0,5); 
}

const bowappend = word => {
    if (!bow[word] && word !== '') {
        bow[word] = 1;
      } else {
        bow[word] += 1;
    }
};

const makeEmoteUrl = emote => {
  return "".concat("https://images.prd.dlivecdn.com/emote/", emote);
};



const onNewMsg = data => {
  if (data.type === 'ka') return;
  if (data.type === 'data') {
    let payload = data.payload;
    let payData = payload.data;
    for (let i = 0; i < payData.streamMessageReceived.length; i++) {
      let message = payData.streamMessageReceived[i];
      if (message.type === 'Message') {
        let splitStr = message.content.substr(1).slice(0, -1).split("/");
        if(splitStr[0] === "emote") {
          recordData(message)
          let emote = splitStr[3];
          bowappend(emote);
          console.log(
            'Count: ', bow[emote], ", key: ", emote, "url: ", makeEmoteUrl(emote)
          );
          // console.log(
          //   'Save Data:', eventData
          // );
        } else {
          console.log(
            'NEW MSG FROM:',
            message.sender.displayname,
            'MESSAGE: ',
            message.content
          );
        }
      }
    }
  }
};

ws.on('message', function(data) {
  if (!data || data == null) return;
  onNewMsg(JSON.parse(data));
});

ws.on('open', function() {
  ws.send(
    JSON.stringify({
      type: 'connection_init',
      payload: {}
    })
  );
  ws.send(
    JSON.stringify({
      id: '1',
      type: 'start',
      payload: {
        variables: {
          streamer: config.streamer
        },
        extensions: {},
        operationName: 'StreamMessageSubscription',
        query:
          'subscription StreamMessageSubscription($streamer: String!) {\n  streamMessageReceived(streamer: $streamer) {\n    type\n    ... on ChatGift {\n      id\n      gift\n      amount\n      recentCount\n      expireDuration\n      ...VStreamChatSenderInfoFrag\n    }\n    ... on ChatHost {\n      id\n      viewer\n      ...VStreamChatSenderInfoFrag\n    }\n    ... on ChatSubscription {\n      id\n      month\n      ...VStreamChatSenderInfoFrag\n    }\n    ... on ChatChangeMode {\n      mode\n    }\n    ... on ChatText {\n      id\n      content\n      ...VStreamChatSenderInfoFrag\n    }\n    ... on ChatFollow {\n      id\n      ...VStreamChatSenderInfoFrag\n    }\n    ... on ChatDelete {\n      ids\n    }\n    ... on ChatBan {\n      id\n      ...VStreamChatSenderInfoFrag\n    }\n    ... on ChatModerator {\n      id\n      ...VStreamChatSenderInfoFrag\n      add\n    }\n    ... on ChatEmoteAdd {\n      id\n      ...VStreamChatSenderInfoFrag\n      emote\n    }\n  }\n}\n\nfragment VStreamChatSenderInfoFrag on SenderInfo {\n  subscribing\n  role\n  roomRole\n  sender {\n    id\n    username\n    displayname\n    avatar\n    partnerStatus\n  }\n}\n'
      }
    })
  );
});
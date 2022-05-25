/* eslint-disable no-console, no-path-concat */

// Dependencies
var express = require('express');
var OpenTok = require('opentok-node');
var app = express();

var opentok;
var apiKey = process.env.API_KEY;
var apiSecret = process.env.API_SECRET;
var appId = process.env.VONAGE_APP_ID;
var keyPath = process.env.VONAGE_PRIVATE_KEY;
var apiUrl = process.env.VONAGE_VIDEO_API_SERVER_URL;
var otOptions = {
  vgAuth: !!appId,
  apiUrl: apiUrl
};
var port = process.env.PORT || 3000;

// Verify that either the OpenTok API key and API secret
// or the VG app ID and private key path are defined
if (!(apiKey && apiSecret) && !(appId && keyPath)) {
  console.log('You must specify API_KEY and API_SECRET or VONAGE_APP_ID and VONAGE_PRIVATE_KEY environment variables');
  process.exit(1);
}

app.use(express.static(__dirname + '/public')); //

app.listen(port, function () {
  console.log('You\'re app is now ready at http://localhost:' + port);
});

if (otOptions.vgAuth) {
  opentok = new OpenTok(appId, keyPath, otOptions);
}
else {
  opentok = new OpenTok(apiKey, apiSecret, otOptions);
}

app.get('/', function (req, res) {
  opentok.createSession({ mediaMode: 'routed' }, function (err, session) {
    if (err) reject(err);
    res.redirect('/' + session.sessionId);
  });
});

app.get('/:sessionId', function (req, res) {
  var sessionId = req.params.sessionId;
  var token = opentok.generateToken(sessionId);
  opentok = new OpenTok(appId, keyPath, otOptions);
  res.render('index.ejs', {
    apiKey: apiKey,
    appId: appId,
    sessionId: sessionId,
    token: token,
    otjsSrcUrl: process.env.OPENTOK_JS_URL ,
    otjsApiUrl: process.env.OVERRIDE_OPENTOK_JS_API_URL && process.env.VONAGE_VIDEO_API_SERVER_URL
  });
});

app.get('/startArchive/:sessionId', function (req, res) {
  opentok.startArchive(req.params.sessionId, function (error, archive) {
    if (error) return res.set(400).send();
    return res.send(archive);
  });
});

app.get('/stopArchive/:id', function (req, res) {
  console.log('stopArchive', req.params.id)
  opentok.stopArchive(req.params.id, function (error, archive) {
    if (error) return res.set(400).send();
    return res.send(archive);
  });
});

app.get('/listArchives/:sessionId', function (req, res) {
  opentok.listArchives(req.params.sessionId, function (error, archives) {
    console.log('listArchives', error, archives);
    if (error) return res.set(400).send();
    return res.send(archives);
  });
});

app.get('/forceDisconnect/:sessionId/:connectionId', function (req, res) {
  opentok.forceDisconnect(req.params.sessionId, req.params.connectionId, function (error) {
    console.log('forceDisconnect', req.params.id, error);
    if (error) return res.set(400).send();
    return res.send('');
  });
});

app.get('/forceMuteStream/:sessionId/:streamId', function (req, res) {
  opentok.forceDisconnect(req.params.sessionId, req.params.streamId, function (error) {
    console.log('forceDisconnect', req.params.streamId, error);
    if (error) return res.set(400).send();
    return res.send('');
  });
});

app.get('/forceMuteAll/:sessionId', function (req, res) {
  opentok.forceMuteAll(req.params.sessionId, function (error) {
    console.log('forceMuteAll', error);
    return res.send('');
  });
});

app.get('/disableForceMute/:sessionId', function (req, res) {
  opentok.disableForceMute(req.params.sessionId, function (error) {
    console.log('disableForceMute', error);
    return res.send('');
  });
});

app.get('/signalAll/:sessionId', function (req) {
  opentok.signal(req.params.sessionId, undefined, {
    data: 'hello from server',
    type: 'test-type'
  }, function (error) {
    console.log('signal', error);
  });
});

app.get('/signalConnection/:sessionId/:connectionId', function (req, res) {
  opentok.signal(req.params.sessionId, req.params.connectionId, {
    data: 'hello from server to ' + req.params.connectionId,
    type: 'test-type'
  }, function (error) {
    console.log('signal', error);
  });
});

app.get('/listStreams/:sessionId', function (req, res) {
  opentok.listStreams(req.params.sessionId, function (error, streams) {
    console.log('listStreams', error, streams);
    res.send(streams);
  });
});

app.get('/getStream/:sessionId/:id', function (req, res) {
  var sessionId = req.params.sessionId;
  opentok.getStream(sessionId, req.params.id, function (error, stream) {
    console.log('getStream', error, stream);
    res.send(stream);
  });
});

app.get('/setStreamClassLists/:sessionId/:id', function (req, res) {
  var sessionId = req.params.sessionId;
  opentok.setStreamClassLists(sessionId, [{
    id: req.params.id,
    layoutClassList: ['focus']
  }], function (error) {
    console.log('setStreamClassLists', error);
    res.send('');
  });
});

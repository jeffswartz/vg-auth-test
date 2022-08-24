/* eslint-disable no-console, no-path-concat */

// Dependencies
var express = require('express');
var Vonage = require('@vonage/video');
var app = express();
var fs = require('fs');

var vonageVideo;
var appId = process.env.VONAGE_APP_ID;
var otjsSrcUrl = process.env.OPENTOK_JS_URL || 'https://unpkg.com/@vonage/video-client@2.23.3/dist/js/opentok.js';
var keyPath = process.env.VONAGE_PRIVATE_KEY;
var apiUrl = process.env.VONAGE_VIDEO_API_SERVER_URL || 'https://video.api.vonage.com';
var devAppId = process.env.DEV_VONAGE_APP_ID;
var devKey = process.env.DEV_VONAGE_PRIVATE_KEY;
var devApiServerUrl = process.env.DEV_VONAGE_VIDEO_API_SERVER_URL || 'https://video.api.dev.vonage.com';
var devOtjsSrcUrl = process.env.DEV_OPENTOK_JS_URL || 'https://static.dev.tokbox.com/v2/js/opentok.js';

var port = process.env.PORT || 3000;

// Verify that the VG app ID and private key path are defined
if (!(appId && keyPath && devAppId && devKey)) {
  console.log('Missing environment variables');
  process.exit(1);
}

app.use(express.static(__dirname + '/public')); //

app.listen(port, function () {
  console.log('You\'re app is now ready at http://localhost:' + port);
});

function getVonageVideo(req) {
  if ((req.query && req.query.env) === 'dev') {
    return new Vonage.Video({
      applicationId: devAppId,
      privateKey: (devKey.indexOf('-----BEGIN PRIVATE KEY-----') > -1) ? devKey : fs.readFileSync(devKey),
      baseUrl: devApiServerUrl
    });
  }
  return new Vonage.Video({
    applicationId: appId,
    privateKey: (keyPath.indexOf('-----BEGIN PRIVATE KEY-----') > -1) ? keyPath : fs.readFileSync(keyPath),
    baseUrl: apiUrl
  });
}

function getOpenjsUrl(req) {
  if ((req.query && req.query.env) === 'dev') {
    return devOtjsSrcUrl;
  }
  return otjsSrcUrl
}

function getOpenTokjsApisUrl(req) {
  if ((req.query && req.query.env) === 'dev') {
    return process.env.DEV_OVERRIDE_OPENTOK_JS_API_URL && devApiServerUrl
  }
  return process.env.OVERRIDE_OPENTOK_JS_API_URL && apiUrl;
}

app.get('/', async function (req, res) {
  vonageVideo = getVonageVideo(req);
  try{
    var session = await vonageVideo.createSession({
      mediaMode: 'routed',
    });
    console.log('new session:', session)
    var query = (req.query && req.query.env) ? '?env=' + req.query.env : '';
    return res.redirect('/' + session.sessionId + query);
  } catch(err) {
    return res.set(400).send(err.message);
  }
});

app.get('/:sessionId', function (req, res) {
  var sessionId = req.params.sessionId;
  vonageVideo = getVonageVideo(req);
  var token = vonageVideo.generateClientToken(sessionId);
  res.render('index.ejs', {
    appId: ((req.query && req.query.env) === 'dev') ? devAppId : appId,
    sessionId: sessionId,
    token: token,
    otjsSrcUrl: getOpenjsUrl(req),
    otjsApiUrl: getOpenTokjsApisUrl(req)
  });
});

app.get('/startArchive/:sessionId', async function (req, res) {
  vonageVideo = getVonageVideo(req);
  try {
    var archive = await vonageVideo.startArchive(req.params.sessionId);
    return res.send(archive);
  } catch (error) {
    return res.set(400).send();
  }
});

app.get('/stopArchive/:id', async function (req, res) {
  vonageVideo = getVonageVideo(req);
  try {
    var archive = await vonageVideo.stopArchive(req.params.id);
    return res.send(archive);
  } catch (error) {
    return res.set(400).send();
  }
});

app.get('/listArchives/:sessionId', async function (req, res) {
  vonageVideo = getVonageVideo(req);
  try {
    var archives = await vonageVideo.searchArchives({
      sessionId: req.params.sessionId
    });
    return res.send(archives);
  } catch (error) {
    return res.set(400).send();
  }
});

app.get('/forceDisconnect/:sessionId/:connectionId', async function (req, res) {
  vonageVideo = getVonageVideo(req);
  try {
    await vonageVideo.disconnectClient(req.params.sessionId, req.params.connectionId);
    return res.send('');
  } catch (error) {
    return res.set(400).send();
  }
});

app.get('/forceMuteStream/:sessionId/:streamId', async function (req, res) {
  vonageVideo = getVonageVideo(req);
  try {
    await vonageVideo.muteStream(req.params.sessionId, req.params.streamId);
    return res.send('');
  } catch (error) {
    return res.set(400).send();
  }
});

app.get('/forceMuteAll/:sessionId', async function (req, res) {
  vonageVideo = getVonageVideo(req);
  try {
    await vonageVideo.muteAllStreams(req.params.sessionId, true);
    return res.send('');
  } catch (error) {
    return res.set(400).send();
  }
});

app.get('/disableForceMute/:sessionId', async function (req, res) {
  vonageVideo = getVonageVideo(req);
  try {
    await vonageVideo.muteAllStreams(req.params.sessionId, false);
    return res.send('');
  } catch (error) {
    return res.set(400).send();
  }
});

app.get('/signalAll/:sessionId', async function (req, res) {
  vonageVideo = getVonageVideo(req);
  try {
    await vonageVideo.sendSignal({
      data: 'hello from server',
      type: 'test-type'
    }, req.params.sessionId);
    return res.send('');
  } catch (error) {
    return res.set(400).send();
  }
});

app.get('/signalConnection/:sessionId/:connectionId', async function (req, res) {
  vonageVideo = getVonageVideo(req, res);
  try {
    await vonageVideo.sendSignal({
      data: 'hello from server to ' + req.params.connectionId,
      type: 'test-type'
    }, req.params.sessionId, req.params.connectionId, );
    return res.send('');
  } catch (error) {
    return res.set(400).send();
  }
});

app.get('/listStreams/:sessionId', async function (req, res) {
  vonageVideo = getVonageVideo(req);
  try {
    var streams = await vonageVideo.getStreamInfo(req.params.sessionId);
    return res.send(streams);
  } catch (error) {
    return res.set(400).send();
  }
});

app.get('/getStream/:sessionId/:id', async function (req, res) {
  vonageVideo = getVonageVideo(req);
  try {
    var stream = await vonageVideo.getStreamInfo(req.params.sessionId, req.params.id);
    return res.send(stream);
  } catch (error) {
    return res.set(400).send();
  }
});

app.get('/setStreamClassLists/:sessionId/:id', async function (req, res) {
  vonageVideo = getVonageVideo(req);
  try {
    var stream = await vonageVideo.setStreamClassLists(req.params.sessionId, [{
      id: req.params.id,
      layoutClassList: ['focus']
    }]);
    return res.send(stream);
  } catch (error) {
    return res.set(400).send();
  }
});

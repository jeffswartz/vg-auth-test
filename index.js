/* eslint-disable no-console, no-path-concat */

// Dependencies
const express = require('express');
const Vonage = require('@vonage/video');

const app = express();
const fs = require('fs');

let vonageVideo;
const appId = process.env.VONAGE_APP_ID;
const otjsSrcUrl = process.env.OPENTOK_JS_URL || 'https://unpkg.com/@vonage/video-client@2/dist/js/opentok.js';
const keyPath = process.env.VONAGE_PRIVATE_KEY;
const apiUrl = process.env.VONAGE_VIDEO_API_SERVER_URL || 'https://video.api.vonage.com';
const devAppId = process.env.DEV_VONAGE_APP_ID;
const devKey = process.env.DEV_VONAGE_PRIVATE_KEY;
const devApiServerUrl = process.env.DEV_VONAGE_VIDEO_API_SERVER_URL || 'https://video.api.dev.vonage.com';
const devOtjsSrcUrl = process.env.DEV_OPENTOK_JS_URL || 'https://static.dev.tokbox.com/v2/js/opentok.js';

const port = process.env.PORT || 3000;

// Verify that the VG app ID and private key path are defined
if (!(appId && keyPath && devAppId && devKey)) {
  console.log('Missing environment variables');
  process.exit(1);
}

app.use(express.static(`${__dirname}/public`)); //
app.use(express.json()); // for parsing application/json

app.listen(port, () => {
  console.log(`You're app is now ready at http://localhost:${port}`);
});

function getVonageVideo(req) {
  if ((req.query && req.query.env) === 'dev') {
    return new Vonage.Video({
      applicationId: devAppId,
      privateKey: (devKey.indexOf('-----BEGIN PRIVATE KEY-----') > -1) ? devKey : fs.readFileSync(devKey, 'utf8'),
    }, {
      videoHost: devApiServerUrl,
    });
  }
  return new Vonage.Video({
    applicationId: appId,
    privateKey: (keyPath.indexOf('-----BEGIN PRIVATE KEY-----') > -1) ? keyPath : fs.readFileSync(keyPath, 'utf8'),
  }, {
    videoHost: apiUrl,
  });
}

function getOpenjsUrl(req) {
  if ((req.query && req.query.env) === 'dev') {
    return devOtjsSrcUrl;
  }
  return otjsSrcUrl;
}

function getOpenTokjsApisUrl(req) {
  if ((req.query && req.query.env) === 'dev') {
    return process.env.DEV_OVERRIDE_OPENTOK_JS_API_URL && devApiServerUrl;
  }
  return process.env.OVERRIDE_OPENTOK_JS_API_URL && apiUrl;
}

app.get('/', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  // The @vonage/video SDK uses enum values of 'enabled' : 'disabled' for the mediaMode option.
  // See https://github.com/Vonage/vonage-node-sdk/blob/3.x/packages/video/lib/interfaces/MediaMode.ts
  const mediaMode = (req.query.relayed === 'true') ? 'enabled' : 'disabled';
  const queryArray = [];
  Object.keys(req.query).forEach((key) => queryArray.push(`${key}=${req.query[key]}`));
  const qString = queryArray.length > 0 ? `?${queryArray.join('&')}` : '';
  try {
    const session = await vonageVideo.createSession({ mediaMode });
    return res.redirect(`/${session.sessionId}${qString}`);
  } catch (err) {
    return res.status(400).send(`Error. ${err.response?.data?.detail}`);
  }
});

app.get('/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  vonageVideo = getVonageVideo(req);
  const token = vonageVideo.generateClientToken(sessionId);
  res.render('index.ejs', {
    appId: ((req.query && req.query.env) === 'dev') ? devAppId : appId,
    sessionId,
    token,
    otjsSrcUrl: getOpenjsUrl(req),
    otjsApiUrl: getOpenTokjsApisUrl(req),
  });
});

app.post('/startArchive/:sessionId', async (req, res) => {
  const { resolution, outputMode } = req.body;
  vonageVideo = getVonageVideo(req);
  const archiveOptions = {
    resolution,
    outputMode,
  };
  try {
    const archive = await vonageVideo.startArchive(req.params.sessionId, archiveOptions);
    return res.send(archive);
  } catch (error) {
    return res.status(400).json({ errorMessage: error.response.data.message });
  }
});

app.get('/stopArchive/:id', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  try {
    const archive = await vonageVideo.stopArchive(req.params.id);
    return res.send(archive);
  } catch (error) {
    return res.status(400).json({ errorMessage: error.response.data.message });
  }
});

app.get('/deleteArchive/:id', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  try {
    await vonageVideo.deleteArchive(req.params.id);
    return res.send();
  } catch (error) {
    return res.status(400).send(error.response.data.message);
  }
});

app.post('/startBroadcast/:sessionId', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  try {
    const broadcast = await vonageVideo.startBroadcast(
      req.params.sessionId,
      req.body,
    );
    return res.send(broadcast);
  } catch (error) {
    return res.set(400).send(error.response.data);
  }
});

app.get('/stopBroadcast/:id', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  try {
    const broadcast = await vonageVideo.stopBroadcast(req.params.id);
    return res.send(broadcast);
  } catch (error) {
    return res.set(400).send(error.response.data);
  }
});

app.get('/listArchives/:sessionId', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  try {
    const archives = await vonageVideo.searchArchives({
      sessionId: req.params.sessionId,
    });
    return res.send(archives);
  } catch (error) {
    return res.status(400).json({ errorMessage: error.response.data.message });
  }
});

app.get('/listBroadcasts/:sessionId', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  try {
    const broadcasts = await vonageVideo.searchBroadcasts({
      sessionId: req.params.sessionId,
    });
    return res.send(broadcasts);
  } catch (error) {
    return res.status(400).json({ errorMessage: error.response.data.message });
  }
});

app.get('/forceDisconnect/:sessionId/:connectionId', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  try {
    await vonageVideo.disconnectClient(req.params.sessionId, req.params.connectionId);
    return res.send('');
  } catch (error) {
    return res.status(400).json({ errorMessage: error.response.data.message });
  }
});

app.get('/forceMuteStream/:sessionId/:streamId', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  try {
    await vonageVideo.muteStream(req.params.sessionId, req.params.streamId);
    return res.send('');
  } catch (error) {
    return res.status(400).json({ errorMessage: error.response.data.message });
  }
});

app.get('/forceMuteAll/:sessionId', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  try {
    await vonageVideo.muteAllStreams(req.params.sessionId, true);
    return res.send('');
  } catch (error) {
    return res.status(400).json({ errorMessage: error.response.data.message });
  }
});

app.get('/disableForceMute/:sessionId', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  try {
    await vonageVideo.muteAllStreams(req.params.sessionId, false);
    return res.send('');
  } catch (error) {
    return res.status(400).json({ errorMessage: error.response.data.message });
  }
});

app.get('/signalAll/:sessionId', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  try {
    await vonageVideo.sendSignal({
      data: 'hello from server',
      type: 'test-type',
    }, req.params.sessionId);
    return res.send('');
  } catch (error) {
    return res.status(400).json({ errorMessage: error.response.data.message });
  }
});

app.get('/signalConnection/:sessionId/:connectionId', async (req, res) => {
  vonageVideo = getVonageVideo(req, res);
  try {
    await vonageVideo.sendSignal({
      data: `hello from server to ${req.params.connectionId}`,
      type: 'test-type',
    }, req.params.sessionId, req.params.connectionId);
    return res.send('');
  } catch (error) {
    return res.status(400).json({ errorMessage: error.response.data.message });
  }
});

app.get('/listStreams/:sessionId', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  try {
    const streams = await vonageVideo.getStreamInfo(req.params.sessionId);
    return res.send(streams);
  } catch (error) {
    return res.status(400).json({ errorMessage: error.response.data.message });
  }
});

app.get('/getStream/:sessionId/:id', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  try {
    const stream = await vonageVideo.getStreamInfo(req.params.sessionId, req.params.id);
    return res.send(stream);
  } catch (error) {
    return res.status(400).json({ errorMessage: error.response.data.message });
  }
});

app.get('/setStreamClassLists/:sessionId/:id', async (req, res) => {
  vonageVideo = getVonageVideo(req);
  try {
    const stream = await vonageVideo.setStreamClassLists(req.params.sessionId, [{
      id: req.params.id,
      layoutClassList: ['focus'],
    }]);
    return res.send(stream);
  } catch (error) {
    return res.status(400).json({ errorMessage: error.response.data.message });
  }
});

/* global OT, appId, sessionId, token */

const session = OT.initSession(appId, sessionId);
const publisherOptions = (window.location.search.indexOf('audioOnly=true') > -1)
  ? { videoSource: null } : {};
const publisher = OT.initPublisher('publisher', publisherOptions);
let streamId;
let archiveId;
let broadcastId;
let lastArchiveId;
let logPre;
let logDiv;

const log = function (str) {
  const logStr = `${new Date().toISOString()}: ${str}\n`;
  console.log(logStr);
  logPre.innerText += logStr;
  logDiv.scrollTop = logDiv.scrollHeight;
};

session.on({
  sessionConnected() {
    log(`connected to session ${sessionId}`);
    session.publish(publisher);
  },

  streamCreated(event) {
    log(`new subscriber stream ${event.stream.id}`);
    session.subscribe(event.stream, 'streams-container', { insertMode: 'append' });
  },
  streamDestroyed(event) {
    log(`subscriber stream e${event.stream.id}`);
    session.subscribe(event.stream, 'streams-container', { insertMode: 'append' });
  },
  signal(e) {
    log(`signal data:${e.data} -- type: ${e.type}`);
  },

  archiveStarted(e) {
    log(`archiveStarted ${e.id}`);
    archiveId = e.id;
  },

  archiveStopped(e) {
    log(`archiveStopped ${e.id}`);
    lastArchiveId = e.id;
    document.getElementById('delete-archive-btn').disabled = false;
  },

  sessionDisconnected() {
    log('sessionDisconnected');
  },
});

publisher.on('streamCreated', (event) => {
  log(`new published stream ${event.stream.id}`);
  streamId = event.stream.id;
});

window.addEventListener('DOMContentLoaded', () => {
  logPre = document.getElementById('log-pre');
  logDiv = document.getElementById('log-div');
  const archiveResolutionOptions = document.getElementById('archive-resolution-options');
  const archiveOutputModeInputs = document.querySelectorAll('input[type=radio][name="archiveOutputMode"]');
  const broadcastRtmp = document.getElementById('rtmp');
  const broadcastRtmpOptions = document.getElementById('broadcast-rtmp-options');

  archiveOutputModeInputs.forEach((inputElement) => inputElement.addEventListener('change', () => {
    const opacity = (inputElement.value === 'individual') ? '0.2' : '1';
    archiveResolutionOptions.style.opacity = opacity;
  }));

  broadcastRtmp.addEventListener('change', () => {
    const opacity = broadcastRtmp.checked ? '1' : '0.2';
    broadcastRtmpOptions.style.opacity = opacity;
  });

  document.getElementById('start-archive-btn').addEventListener('click', () => {
    const resolution = document.querySelector('input[name="archiveResolution"]:checked').value;
    const outputMode = document.querySelector('input[name="archiveOutputMode"]:checked').value;

    log(`startArchive  ${resolution} ${outputMode}`);
    fetch(`/startArchive/${sessionId}${location.search}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outputMode,
        resolution: (outputMode === 'composed' && resolution) || undefined,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        archiveId = data.id;
        log(JSON.stringify(data, null, 2));
      });
  });

  document.getElementById('stop-archive-btn').addEventListener('click', () => {
    log(`stopArchive ${archiveId}`);
    fetch(`/stopArchive/${archiveId}${location.search}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .then((data) => {
        archiveId = data.id;
        log(JSON.stringify(data, null, 2));
      });
  });
  document.getElementById('delete-archive-btn').addEventListener('click', () => {
    log(`deleteArchive ${lastArchiveId}`);
    fetch(`/deleteArchive/${lastArchiveId}${location.search}`, {
      method: 'get',
    }).then((response) => {
      if (response.status === 200) {
        document.getElementById('delete-archive-btn').disabled = true;
        return log('archive deleted.');
      }
      return response.text().then((data) => {
        log(`deleteArchive error: ${data}`);
      });
    });
  });

  document.getElementById('start-broadcast-btn').addEventListener('click', () => {
    const resolution = document.querySelector('input[name="broadcastResolution"]:checked').value;
    const rtmpUrl = document.getElementById('rtmp-url').value;
    const hls = document.getElementById('hls');
    const rtmp = document.getElementById('rtmp');
    const broadcastOptions = {
      resolution,
      outputs: {
        hls: hls.checked ? { } : undefined,
        rtmp: rtmp.checked ? [{
          serverUrl: rtmpUrl,
          streamName: 'testStream',
        }] : [],
      },
    };

    log(`startBroadcast  ${JSON.stringify(broadcastOptions)}`);
    fetch(`/startBroadcast/${sessionId}${location.search}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(broadcastOptions),
    })
      .then((response) => response.json())
      .then((data) => {
        broadcastId = data.id;
        log(JSON.stringify(data, null, 2));
      });
  });

  document.getElementById('stop-broadcast-btn').addEventListener('click', () => {
    log(`stopBroadcast ${broadcastId}`);
    fetch(`/stopBroadcast/${broadcastId}${location.search}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .then((data) => {
        log(JSON.stringify(data, null, 2));
      });
  });

  document.getElementById('force-disconnect-btn').addEventListener('click', () => {
    fetch(`/forceDisconnect/${sessionId}/${session.connection.id}${location.search}`, {
      method: 'get',
    }).then(() => { log('forced to disconnect'); });
  });

  document.getElementById('force-mute-all-btn').addEventListener('click', () => {
    fetch(`/forceMuteAll/${sessionId}${location.search}`, {
      method: 'get',
    }).then(() => { log('session muted'); });
  });

  document.getElementById('force-mute-stream-btn').addEventListener('click', () => {
    fetch(`/forceMuteStream/${sessionId}/${streamId}${location.search}`, {
      method: 'get',
    }).then(() => { log('stream muted'); });
  });

  document.getElementById('disable-force-mute-btn').addEventListener('click', () => {
    fetch(`/disableForceMute/${sessionId}${location.search}`, {
      method: 'get',
    }).then(() => { log('force mute disabled'); });
  });

  document.getElementById('signal-me-btn').addEventListener('click', () => {
    fetch(`/signalConnection/${sessionId}/${session.connection.id}${location.search}`, {
      method: 'get',
    });
  });

  document.getElementById('signal-all-btn').addEventListener('click', () => {
    console.log(`${23342}/signalAll/${sessionId}`);
    fetch(`/signalAll/${sessionId}${location.search}`, {
      method: 'get',
    });
  });

  document.getElementById('list-streams-btn').addEventListener('click', () => {
    fetch(`/listStreams/${sessionId}${location.search}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .then((data) => { log(JSON.stringify(data, null, 2)); });
  });

  document.getElementById('get-stream-btn').addEventListener('click', () => {
    fetch(`/getStream/${sessionId}/${streamId}${location.search}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .then((data) => { log(JSON.stringify(data, null, 2)); });
  });

  document.getElementById('list-archives-btn').addEventListener('click', () => {
    fetch(`/listArchives/${sessionId}${location.search}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .then((data) => { log(JSON.stringify(data, null, 2)); });
  });

  document.getElementById('list-broadcasts-btn').addEventListener('click', () => {
    fetch(`/listBroadcasts/${sessionId}${location.search}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .then((data) => { log(JSON.stringify(data, null, 2)); });
  });

  document.getElementById('set-class-list-btn').addEventListener('click', () => {
    fetch(`/setStreamClassLists/${sessionId}/${streamId}${location.search}`, {
      method: 'get',
    })
      .then(log('stream class list updated'));
  });
});

session.connect(token);

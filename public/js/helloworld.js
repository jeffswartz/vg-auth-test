/* global OT, appId, sessionId, token */

const session = OT.initSession(appId, sessionId);
const publisherOptions = {
  insertMode: 'append',
  publishCaptions: true,
};
if (window.location.search.indexOf('audioOnly=true') > -1) {
  publisherOptions.videoSource = null;
}
const publisher = OT.initPublisher('publisher', publisherOptions);
let streamId;
let archiveId;
let broadcastId;
let lastArchiveId;
let captionsId;
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
    let captionTimer;
    log(`new subscriber stream ${event.stream.id}`);

    const subscriberContainer = document.createElement('div');
    const captionDiv = document.createElement('div');
    subscriberContainer.id = `sub-container-${event.stream.id}`;

    subscriberContainer.appendChild(captionDiv);
    captionDiv.classList.add('caption');
    document.getElementById('streams-container').appendChild(subscriberContainer);

    const subscriber = session.subscribe(event.stream, subscriberContainer, { insertMode: 'append' });
    subscriber.subscribeToCaptions(true)
      .catch((err) => {
        log(`subscribeToCaptions error: ${err}`);
      });

    subscriber.on('captionReceived', (captionEvent) => {
      if (captionTimer) {
        window.clearTimeout(captionTimer);
      }
      captionDiv.innerHTML = captionEvent.caption;
      captionTimer = window.setTimeout(() => {
        captionDiv.innerHTML = '';
      }, 5000);
    });
  },

  streamDestroyed(event) {
    log(`subscriber stream e${event.stream.id}`);
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

  document.getElementById('dial-sip-btn').addEventListener('click', () => {
    const uri = document.getElementById('sip-uri').value;
    const from = document.getElementById('sip-from').value || undefined;
    const headerJson = document.getElementById('sip-headers').value || undefined;
    const username = document.getElementById('sip-username').value;
    const password = document.getElementById('sip-password').value;
    const secure = document.getElementById('sip-secure').checked;
    const video = document.getElementById('sip-video').checked;
    const observeForceMute = document.getElementById('sip-observeForceMute').checked;
    const auth = (username || password) ? {
      username: username || undefined,
      password: password || undefined,
    } : undefined;
    let headers;
    let invalidHeaders = false;

    try {
      headers = JSON.parse(headerJson);
    } catch (e) {
      invalidHeaders = true;
    }

    const sipCallOptions = {
      uri,
      from,
      headers,
      auth: auth || undefined,
      secure,
      video,
      observeForceMute,
    };

    if (headerJson && invalidHeaders) {
      log('invalid SIP headers ignored. JSON should be in the form of { "header1": "value1" }');
    }
    fetch(`/dialSip/${sessionId}${location.search}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sipCallOptions),
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

  document.getElementById('start-audio-connect-btn').addEventListener('click', () => {
    const uri = document.getElementById('audio-connect-uri').value;
    fetch(`/audioConnect/${sessionId}${location.search}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uri }),
    })
      .then((response) => response.json())
      .then((data) => {
        log(JSON.stringify(data, null, 2));
      });
  });

  document.getElementById('enable-captions-btn').addEventListener('click', () => {
    log('enableCaptions');
    fetch(`/enableCaptions/${sessionId}${location.search}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        log(`enableCaptions response ${JSON.stringify(data, null, 2)}`);
        captionsId = data.captionsId;
      });
  });

  document.getElementById('disable-captions-btn').addEventListener('click', () => {
    log(`disableCaptions ${captionsId}`);
    fetch(`/disableCaptions/${captionsId}${location.search}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .then((data) => {
        log(`disableCaptions response ${JSON.stringify(data, null, 2)}`);
      });
  });

  document.getElementById('get-caption-status-btn').addEventListener('click', () => {
    log(`getCaptionStatus ${captionsId}`);
    fetch(`/getCaptionStatus/${captionsId}${location.search}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .then((data) => {
        log(`getCaptionStatus response ${JSON.stringify(data, null, 2)}`);
      });
  });
});

session.connect(token);

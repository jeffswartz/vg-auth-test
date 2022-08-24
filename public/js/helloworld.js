/* global OT, appId, sessionId, token */

var session = OT.initSession(appId, sessionId);

var publisher = OT.initPublisher('publisher');
var streamId;
var archiveId;
var logElement;
var logDiv;

var log = function (str) {
  var logStr = new Date().toISOString() + ': ' + str + '\n';
  console.log(logStr);
  logPre.innerText += logStr;
  logDiv.scrollTop = logDiv.scrollHeight;
}

session.on({
  connectionCreated: function (event) {
    log('connection created -- connection.data ' + event.connection.data);
  },

  sessionConnected: function () {
    log('connected to session -- connection.data ' + session.connection.data);
    log('connected to session -- session.capabilities.forceDisconnect ' + session.capabilities.forceDisconnect);
    log('connected to session ' + sessionId);
    session.publish(publisher);
  },

  streamCreated: function (event) {
    log('new subscriber stream ' + event.stream.id);
    session.subscribe(event.stream, 'streams-container', { insertMode: 'append' });
  },
  streamDestroyed: function (event) {
    log('subscriber stream e' + event.stream.id);
    session.subscribe(event.stream, 'streams-container', { insertMode: 'append' });
  },
  signal: function(e) {
    log('signal data:' + e.data + ' -- type: ' + e.type);
  },
  
  archiveStarted: function(e) {
    log('archiveStarted ' + e.id);
    archiveId = e.id;
  },
  
  archiveStopped: function(e) {
    log('archiveStopped ' + e.id);
  },
  
  sessionDisconnected: function(e) {
    log('sessionDisconnected');
  }
});

publisher.on('streamCreated', function (event) {
  log('new published stream ' + event.stream.id);
  streamId = event.stream.id;
});

window.addEventListener('DOMContentLoaded', function () {
  logPre = document.getElementById('log-pre');
  logDiv = document.getElementById('log-div');
  document.getElementById('start-archive-btn').addEventListener('click', function () {
    log('startArchive')
    fetch('/startArchive/' + sessionId + location.search, {
      method: 'get'
    })
      .then(function (response) { return response.json(); })
      .then(function (data) {
        archiveId = data.id;
        log(JSON.stringify(data, null, 2));
      });
  });

  document.getElementById('stop-archive-btn').addEventListener('click', function () {
    log('stopArchive ' + archiveId);
    fetch('/stopArchive/' +  archiveId + location.search, {
      method: 'get'
    })
      .then(function (response) { return response.json(); })
      .then(function (data) {
        archiveId = data.id;
        log(JSON.stringify(data, null, 2));
      });
  });

  document.getElementById('toggle-archive-layout-btn').addEventListener('click', function () {
    log('toggleArchiveLayout ' + archiveId);
    fetch('/toggleArchiveLayout/' +  archiveId + location.search, {
      method: 'get'
    })
      .then(function (response) { return response.json(); })
      .then(function (data) {
        log(JSON.stringify(data, null, 2));
      });
  });

  document.getElementById('force-disconnect-btn').addEventListener('click', function () {
    fetch('/forceDisconnect/' + sessionId + '/' +  session.connection.id + location.search, {
      method: 'get'
    }).then(function (response) { log('forced to disconnect'); });
  });

  document.getElementById('force-mute-all-btn').addEventListener('click', function () {
    fetch('/forceMuteAll/' + sessionId + location.search, {
      method: 'get'
    }).then(function (response) { log('session muted'); });
  });

  document.getElementById('force-mute-stream-btn').addEventListener('click', function () {
    fetch('/forceMuteStream/' + sessionId + '/' + streamId + location.search, {
      method: 'get'
    }).then(function (response) { log('stream muted'); });
  });

  document.getElementById('disable-force-mute-btn').addEventListener('click', function () {
    fetch('/disableForceMute/' + sessionId + location.search, {
      method: 'get'
    }).then(function (response) { log('force mute disabled'); });
  });

  document.getElementById('signal-me-btn').addEventListener('click', function () {
    fetch('/signalConnection/' + sessionId + '/' + session.connection.id + location.search, {
      method: 'get'
    });
  });

  document.getElementById('signal-all-btn').addEventListener('click', function () {
    console.log(23342 + '/signalAll/' + sessionId)
    fetch('/signalAll/' + sessionId + location.search, {
      method: 'get'
    });
  });

  document.getElementById('list-streams-btn').addEventListener('click', function () {
    fetch('/listStreams/' + sessionId + location.search, {
      method: 'get'
    })
      .then(function (response) { return response.json(); })
      .then(function (data) { log(JSON.stringify(data, null, 2)); });
  });

  document.getElementById('get-stream-btn').addEventListener('click', function () {
    fetch('/getStream/' + sessionId + '/' + streamId + location.search, {
      method: 'get'
    })
      .then(function (response) { return response.json(); })
      .then(function (data) { log(JSON.stringify(data, null, 2)); });
  });

  document.getElementById('list-archives-btn').addEventListener('click', function () {
    fetch('/listArchives/' + sessionId + location.search, {
      method: 'get'
    })
      .then(function (response) { return response.json(); })
      .then(function (data) { log(JSON.stringify(data, null, 2)); });
  });

  document.getElementById('set-class-list-btn').addEventListener('click', function () {
    fetch('/setStreamClassLists/' + sessionId + '/' + streamId + location.search, {
      method: 'get'
    })
      .then(log('stream class list updated'));
  });
});

session.connect(token,  function(error) {
   if (error) {
     console.log(error.message);
   }
 });

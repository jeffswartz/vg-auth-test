/* global OT, appId, sessionId, token */

const session = OT.initSession(appId, sessionId);

session.on({
  streamCreated(event) {
    session.subscribe(event.stream, 'opentok-container', { insertMode: 'append' });
  },
});

session.connect(token);

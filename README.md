# Video API test app

This is a simple app that you can use to test different methods of the OpenTok Node SDK
using an app with VG credentials in either the production or dev environments.


## Running the App

First, download the dependencies:

```
$ npm install
```

Add a Vonage application ID (`VONAGE_APP_ID`) and either a private key string
or a path to a private key file associated with that application (`VONAGE_PRIVATE_KEY`)
to the environment variables:

```
export VONAGE_APP_ID=123456
export VONAGE_PRIVATE_KEY="-----BEGIN PRIVATE KEY----- ...." # This can be a path to a key file
```

The following defaults are already set (but you can override them):

```export VONAGE_VIDEO_API_SERVER_URL=https://video.api.vonage.com
export OPENTOK_JS_URL=https://static.opentok.com/v2/js/opentok.min.js
```

Also, set these for the dev instance:

```
export DEV_VONAGE_APP_ID=123456
export DEV_VONAGE_PRIVATE_KEY="-----BEGIN PRIVATE KEY----- ...." # This can be a path to a key file
```

The following defaults are already set for the dev environment (but you can override them):

```
export DEV_VONAGE_VIDEO_API_SERVER_URL=https://video.api.dev.vonage.com
export DEV_OPENTOK_JS_URL=https://static.dev.tokbox.com/v2/js/opentok.js
```

The `VONAGE_VIDEO_API_SERVER_URL` is used for Video API REST calls from the Node server.
To have OpenTok.js in the web app also use the `VONAGE_VIDEO_API_SERVER_URL` for API calls
(instead of the API URL loaded from the OpenTok.js config), set `OVERRIDE_OPENTOK_JS_API_URL` 
(for production) and/or `DEV_OVERRIDE_OPENTOK_JS_API_URL` to `true`:

```
export OVERRIDE_OPENTOK_JS_API_URL=true
export DEV_OVERRIDE_OPENTOK_JS_API_URL=true
```

Finally, start the app using node:

```
$ node index.js
```

Or, you can run `npm start` in the root directory of the project.

### To test in the production environment:

Visit <http://localhost:3000> in your browser. Open the resulting URL again in a second window.

To use a relayed session, add a `relayed=true` query string parameter: <http://localhost:3000?relayed=true>

### To test in the dev environment:

Visit <http://localhost:3000?env=dev> in your browser. Open the resulting URL again in a second window.

To use a relayed session, add a `relayed=true` query string parameter: <http://localhost:3000?env=dev&relayed=true>


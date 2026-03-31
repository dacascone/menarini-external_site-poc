# Menarini external site (menarini-external-site)

A Quasar Project

## Install the dependencies
```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```


### Lint the files
```bash
yarn lint
# or
npm run lint
```



### Build the app for production
```bash
quasar build
```

### Required environment variables
```bash
CLIENT_ID=...
REDIRECT_URI=...
EXPID=...
ONETRUST_CLIENT_ID=...
ONETRUST_CLIENT_SECRET=...
```

Optional:
```bash
ONETRUST_BASE_URL=https://daisytestsandbox-sandbox-428.my.onetrust.com
ONETRUST_POPUP_PURPOSE_NAME=Channels allowed|095
ONETRUST_SEARCH_PAGE_SIZE=25
```

### Customize the configuration
See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

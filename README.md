# Chrome Chat Everywhere
## Features
**Chat Everywhere** is a Chrome extension that adds a little public chat to your browser:
- All the rooms are public
- The room in which you are is the domain which you are browsing
- You can login with an e-mail to save your username
- The login is password-less. It sends you a link to your e-mail inbox, just click it and you are logged in!

## Developing the extension
_I'll assume that you already read the [Webpack docs](https://webpack.github.io/docs) and the [Chrome Extension](https://developer.chrome.com/extensions/getstarted) docs._

1. Check if your Node.js version is >= 6.
2. Clone the repository.
3. Run `npm i`.
5. Change the package's name and description on `package.json`.
6. Change the name of your extension on `src/manifest.json`.
7. Run `npm run start`
8. Load your extension on Chrome following:
    1. Access `chrome://extensions/`
    2. Check `Developer mode`
    3. Click on `Load unpacked extension`
    4. Select the `build` folder.
8. Have fun.

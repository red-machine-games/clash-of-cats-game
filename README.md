<p align="center">
    <img alt="Goblin Base Server" src="https://raw.githubusercontent.com/red-machine-games/clash-of-cats-game/master/assets/ico/android-chrome-192x192.png" width="192">
  </a>
</p>

# Clash of Cats game

It's an html5 game developed with [Phaser](https://phaser.io) engine and Goblin Base Server demonstrating capabilities of Backend profiles, leaderboards, matchmaking and real-time PvP.

Check out the demo here: https://rmg-clocats-dev.gbln.app . **It's pvp only so try to play with your friend or in different browsers**.

Find out more about Goblin Base Server here: https://github.com/red-machine-games/goblin-base-server

## Running

It runs with Webpack:

 - Configure `config.js`;
 - Run as development version: `$ cd ./clash-of-cats-game && webpack`;
 - Modify `index.html`;
 - Build a production version: `$ cd ./clash-of-cats-game && webpack --config "webpack.production.js"`. Get build from `dist`.

## Net code

Pvp-related cloud function stored at `cloudFunctions` folder. Real-time networking is powered by deterministic ping-pong model.

Here are some theses about net code to help you understand it better:

 - Deterministic model powered by mersenne twister random to be synced for both players - common seed provided by backend;
 - The model implements time traveling: it means that you can place opponent input in past time what will change the present;
 - The model fully syncs with opponent every 2.5 secs;
 - Client sends ~10 direct messages per second to opponent. Turns are used only for game over announcement;
 - Check out determenistic model's code here: https://github.com/red-machine-games/clash-of-cats-game/blob/master/src/model/deterministicPong.js

All netwoking done with js SDK (https://github.com/red-machine-games/goblin-javascript-asset)

Check out SDK exposure here: https://github.com/red-machine-games/clash-of-cats-game/blob/master/src/controllers/ControllerHowardResponsibleForNetworking.js

## License

All code and code-related files are under MIT license.

All images, sounds and music under [CC BY-NC-ND](https://creativecommons.org/licenses/by-nc-nd/4.0/)
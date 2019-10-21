'use strict';

var Scene = require('phaser').Scene,
    WebFont = require('webfontloader');

class BootScene extends Scene{
    constructor(){
        super({ key: 'BootScene' });
    }
    preload(){
        this.load.spritesheet('backgrounds', 'assets/Backgrounds.png', { frameWidth: 1812, frameHeight: 1024 });
        this.load.atlas('game-1', 'assets/game-atlas-01.png', 'assets/game-atlas-01.json');

        this.load.image('clew-shadow', 'assets/bottom-shadow.png');
        this.load.image('red-cape', 'assets/red_cape.png');
        this.load.image('spinner', 'assets/loading_spinner.png');
        this.load.image('awaiting', 'assets/waiting_icon.png');

        this.load.audio('maintrack', ['assets/sounds/Cats-Maintrack.ogg', 'assets/sounds/Cats-Maintrack.mp3']);
        this.load.audio('click', ['assets/sounds/OrdinaryClick.ogg', 'assets/sounds/OrdinaryClick.mp3']);
        this.load.audio('lose', ['assets/sounds/Lose.ogg', 'assets/sounds/Lose.mp3']);
        this.load.audio('meow1', ['assets/sounds/Meow1.ogg', 'assets/sounds/Meow1.mp3']);
        this.load.audio('meow2', ['assets/sounds/Meow2.ogg', 'assets/sounds/Meow2.mp3']);
        this.load.audio('meow3', ['assets/sounds/Meow3.ogg', 'assets/sounds/Meow3.mp3']);
        this.load.audio('meow4', ['assets/sounds/Meow4.ogg', 'assets/sounds/Meow4.mp3']);
        this.load.audio('pause', ['assets/sounds/Pause.ogg', 'assets/sounds/Pause.mp3']);
        this.load.audio('paw1', ['assets/sounds/Paw1.ogg', 'assets/sounds/Paw1.mp3']);
        this.load.audio('paw2', ['assets/sounds/Paw2.ogg', 'assets/sounds/Paw2.mp3']);
        this.load.audio('paw3', ['assets/sounds/Paw3.ogg', 'assets/sounds/Paw3.mp3']);
        this.load.audio('paw4', ['assets/sounds/Paw4.ogg', 'assets/sounds/Paw4.mp3']);
        this.load.audio('paw5', ['assets/sounds/Paw5.ogg', 'assets/sounds/Paw5.mp3']);
        this.load.audio('spawn1', ['assets/sounds/Spawn1.ogg', 'assets/sounds/Spawn1.mp3']);
        this.load.audio('spawn2', ['assets/sounds/Spawn2.ogg', 'assets/sounds/Spawn2.mp3']);
        this.load.audio('spawn3', ['assets/sounds/Spawn3.ogg', 'assets/sounds/Spawn3.mp3']);

        WebFont.load({ google: { families: ['Changa'] }});
    }
    create(){
        var config = require('../../config');
        require('../controllers/ControllerHowardResponsibleForNetworking.js').configure(
            config.project,
            config.env,
            config.hmacSecret,
            config.targetPlatform,
            config.targetVersion,
            config.overrideAddress
        );
        this.scene.start('MenuScene');
    }
}

module.exports = BootScene;
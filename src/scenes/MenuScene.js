'use strict';

var Phaser = require('phaser'),
    Scene = Phaser.Scene;

var Background = require('../elements/Background.js'),
    PlayButton = require('../elements/PlayButton.js'),
    LoadingSpinner = require('../elements/LoadingSpinner.js');

var ControllerHowardResponsibleForNetworking = require('../controllers/ControllerHowardResponsibleForNetworking.js');

class MenuScene extends Scene{
    constructor(){
        super({ key: 'MenuScene' });
    }
    create(){
        this.background_spr = new Background(this, { whichOne: 'menu' });

        this.events.on('resize', this.centerThings);

        if(!this.sound.sounds.find(e => e.key === 'maintrack')){
            this.sound.add('maintrack', { loop: true }).play();
        }

        this.networking = ControllerHowardResponsibleForNetworking.getOrCreate();
        this.input.on('pointermove', () => this.networking.inputBeenDone());
        this.spinner = new LoadingSpinner(this);
        this.add.existing(this.spinner);

        this.networking.enter()
            .then(() => {
                this.spinner.visible = false;
                this.playButton = new PlayButton(this, { text: `PLAY!`, name: this.networking.myName, size: .3, color: 'green', pulsing: true });
                this.playButton.once('click', this.startNewGame, this);
                this.centerThings();
            })
            .catch(err => console.error(err));

        this.centerThings();
        this.events.once('shutdown', this._onShutdown, this);
    }
    startNewGame(){
        if((this.sys.game.device.os.android || this.sys.game.device.os.iOS || this.sys.game.device.os.iPad
                || this.sys.game.device.os.iPhone || this.sys.game.device.os.windowsPhone) && !this.scale.isFullscreen){
            this.scale.lockOrientation(Phaser.Scale.LANDSCAPE);
            this.scale.startFullscreen();
        }
        this.playButton.think();
        this.networking.beginGameplay()
            .then(() => {
                this.playButton.unthink();
                if(this.networking.currentPvp){
                    this.scene.start('GameplayScene');
                } else {
                    this.playButton.once('click', this.startNewGame, this);
                }
            })
            .catch(err => console.error(err));
    }
    centerThings(){
        this.background_spr.centralize();
        if(this.playButton){
            this.playButton.setPosition(
                (this.scale.gameSize.width - this.playButton.displayWidth) / 2,
                this.scale.gameSize.height * .85
            );
        }
        if(this.spinner && this.spinner.visible){
            this.spinner.setPosition(
                (this.scale.gameSize.width - this.spinner.displayWidth) / 2,
                this.scale.gameSize.height * .85
            );
        }
    }
    _onShutdown(){
        if(this.spinner){
            this.spinner.destroy();
            this.spinner = undefined;
        }
        if(this.playButton){
            this.playButton.destroy();
            this.playButton = undefined;
        }
    }
}

module.exports = MenuScene;
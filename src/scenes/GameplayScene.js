'use strict';

var Scene = require('phaser').Scene;

var Background = require('../elements/Background.js'),
    Battleground = require('../elements/Battleground.js'),
    LoadingSpinner = require('../elements/LoadingSpinner.js');

var ControllerHowardResponsibleForNetworking = require('../controllers/ControllerHowardResponsibleForNetworking.js');

class GameplayScene extends Scene{
    constructor(){
        super({ key: 'GameplayScene' });
    }
    create(){
        this.background_spr = new Background(this, { whichOne: 'gameplay' });

        this.networking = ControllerHowardResponsibleForNetworking.getOrCreate();
        this.networking.currentPvp.once('begin', this._beginGameplay, this);

        this.input.on('pointermove', () => this.networking.inputBeenDone());

        this.spinner = new LoadingSpinner(this);
        this.add.existing(this.spinner);

        this.centerThings();

        this.events.on('resize', this.centerThings, this);
        this.events.once('shutdown', this._onShutdown, this);

        this.game.events.on('hidden', this._pauseGameplay, this);
        this.game.events.on('visible', this._unpauseGameplay, this);
    }
    _beginGameplay(startTimestamp, randomSeed, meIsPlayerA, opponentName){
        this.spinner.destroy();
        this.spinner = undefined;

        this.battleground = new Battleground(this, {
            nominalWidth: this.scale.gameSize.width,
            nominalHeight: this.scale.gameSize.height,
            randomSeed, startTimestamp, mirror: !meIsPlayerA, opponentName
        });
        this.centerThings();
    }
    _pauseGameplay(){
        if(this.battleground){
            this.battleground.pause();
        }
    }
    _unpauseGameplay(){
        if(this.battleground){
            this.battleground.resume();
        }
    }
    centerThings(){
        if(this.spinner){
            this.spinner.setPosition(this.scale.gameSize.width / 2, this.scale.gameSize.height / 2);
        }
        this.background_spr.centralize();
        if(this.battleground){
            this.battleground.centerThings();
        }
    }
    _onShutdown(){
        if(this.spinner){
            this.spinner.destroy();
            this.spinner = undefined;
        }
        this.background_spr.destroy();
        this.background_spr = undefined;
        if(this.battleground){
            this.battleground.destroy();
            this.battleground = undefined;
        }
        this.game.events.removeListener('hidden', this._pauseGameplay);
        this.game.events.removeListener('visible', this._unpauseGameplay);
    }
}

module.exports = GameplayScene;
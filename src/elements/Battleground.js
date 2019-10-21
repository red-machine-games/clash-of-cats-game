'use strict';

var Container = require('phaser').GameObjects.Container;

var Pussy = require('./Pussy.js'),
    ControllerMaggieResponsibleForMovingPussies = require('../controllers/ControllerMaggieResponsibleForMovingPussies.js'),
    WireframeGameplayWithGraphics = require('../elements/gameplay/WireframeGameplayWithGraphics.js'),
    GameplayUI = require('../elements/gameplay/GameplayUI.js'),
    LoadingSpinner = require('./LoadingSpinner.js');

var ControllerHowardResponsibleForNetworking = require('../controllers/ControllerHowardResponsibleForNetworking.js');

const HERTZ = 8,
    HP_SYNC_HERTZ = 3,
    TURN_ON_WIREFRAME = false;

const DEFAULT_PLAYER_HP = 5;

const _MAGIC_NUMBER_1 = 93.75,
    _MAGIC_NUMBER_2 = 1.9;

class Battleground extends Container{
    constructor(scene, opts){
        super(scene, 0, 0);

        this.opts = opts;
        scene.add.existing(this);

        this.score = 0;

        this.pussy_1 = new Pussy(scene, { whichOne: 'dark', nominalWidth: opts.nominalWidth });
        this.pussy_2 = new Pussy(scene, { whichOne: 'bright', nominalWidth: opts.nominalWidth });

        this.controllerMaggie = new ControllerMaggieResponsibleForMovingPussies(this.pussy_1, this.pussy_2, opts);

        this.networking = ControllerHowardResponsibleForNetworking.getOrCreate();

        this.gameplayWithGraphics = new WireframeGameplayWithGraphics(this.scene, {
            wireframeCanvas: TURN_ON_WIREFRAME,
            nominalWidth: this.scene.scale.gameSize.width,
            nominalHeight: this.scene.scale.gameSize.height,
            randomSeed: opts.randomSeed,
            playZoneHeight: this.controllerMaggie.getFacePlayZoneHeight(),
            startTimestamp: this.opts.startTimestamp, mirror: this.opts.mirror,
            timeDiff: this.networking.timeDiff
        });

        console.log(` ~~#~~ THIS IS PLAYER ${this.opts.mirror ? 'B' : 'A'} ~~#~~`);

        if(TURN_ON_WIREFRAME){
            this.add(this.pussy_1);
            this.add(this.pussy_2);
            this.add(this.gameplayWithGraphics);
        } else {
            this.add(this.gameplayWithGraphics);
            this.add(this.pussy_1);
            this.add(this.pussy_2);
        }

        this.gameplayWithGraphics.on('pussyPawA', (modelTime, pussyPositionY, clewId, fixDirection) => {
            this.scene.sound.play(`paw${Math.ceil(Math.random() * 5)}`);
            if(this.opts.mirror){
                this.gameplayUI.addScoreB();
                this.pussy_2.throwPaw();
            } else {
                this.score++;
                this.gameplayUI.addScoreA();
                this.pussy_1.throwPaw();
                if(this.networking.currentPvp){
                    this.networking.currentPvp.hertzMessage(
                        { col: { y: pussyPositionY, at: modelTime, fix: clewId ? { id: clewId, dir: fixDirection } : undefined } }
                    );
                }
            }
        });
        this.gameplayWithGraphics.on('pussyPawB', (modelTime, pussyPositionY, clewId, fixDirection) => {
            this.scene.sound.play(`paw${Math.ceil(Math.random() * 5)}`);
            if(this.opts.mirror){
                this.score++;
                this.gameplayUI.addScoreA();
                this.pussy_1.throwPaw();
                if(this.networking.currentPvp){
                    this.networking.currentPvp.hertzMessage(
                        { col: { y: pussyPositionY, at: modelTime, fix: clewId ? { id: clewId, dir: fixDirection } : undefined } }
                    );
                }
            } else {
                this.gameplayUI.addScoreB();
                this.pussy_2.throwPaw();
            }
        });

        this.gameplayWithGraphics.on('minusHpA', () => this._workoutDamage(true));
        this.gameplayWithGraphics.on('minusHpB', () => this._workoutDamage(false));

        this.gameplayWithGraphics.on('sync-dump', dump => {
            if(this.opts.mirror && this.networking.currentPvp){
                this.networking.currentPvp.hertzMessage({ sync: { amt: dump.amt, hash: dump.hash, hp: `${this.gameplayUI.getHpA()};${this.gameplayUI.getHpB()}` } });
            }
        });

        this.waitingSpinner = new LoadingSpinner(this.scene);
        this.add(this.waitingSpinner);
        this.waitingSpinner.visible = false;

        this.gameplayUI = new GameplayUI(this.scene, {
            pulsing: true, defaultHp: DEFAULT_PLAYER_HP,
            myName: this.networking.myName, opponentName: opts.opponentName
        });
        this.add(this.gameplayUI);

        this.scene.events.on('update', this._onUpdate, this);

        this.networking.currentPvp.on('message', message => {
            if(message.col){
                if(message.col.fix){
                    this.gameplayWithGraphics.fixClewDirection(message.col.at, message.col.fix.id, message.col.fix.dir);
                }
                if(this.opts.mirror){
                    this.gameplayWithGraphics.imposePussyA_Y(message.col.y, message.col.at);
                } else {
                    this.gameplayWithGraphics.imposePussyB_Y(message.col.y, message.col.at);
                }
            }
            if(message.p){
                this.controllerMaggie.updatePussyB_PositionY(message.p.y);
                if(this.opts.mirror){
                    this.gameplayWithGraphics.pussyA_SetGraphics((message.p.y - _MAGIC_NUMBER_1) * _MAGIC_NUMBER_2);
                } else {
                    this.gameplayWithGraphics.pussyB_SetGraphics((message.p.y - _MAGIC_NUMBER_1) * _MAGIC_NUMBER_2);
                }
            }
            if(message.sync && this.gameplayWithGraphics.running){
                if(this.opts.mirror){
                    if(message.sync.state){
                        this.gameplayWithGraphics.syncGameplay(message.sync);
                    }
                    if(message.sync.hp){
                        let [hpA, hpB] = message.sync.hp.split(';').map(e => +e);
                        if(!this.gameplayUI.setHpA(hpA) || !this.gameplayUI.setHpB(hpB)){
                            this._prepareGameover();
                        }
                    }
                } else {
                    let dump = this.gameplayWithGraphics.dumpGameplayModelAt(message.sync.amt);
                    if(dump && dump.hash !== message.sync.hash && this.networking.currentPvp){
                        this.networking.currentPvp.hertzMessage({ sync: { amt: dump.amt, state: dump.state } });
                    }
                }
            }
        });
        this.networking.currentPvp.on('paused', atTimestamp => {
            this.gameplayUI.awaiting();
            this.gameplayWithGraphics.pauseGameplay(atTimestamp);
        });
        this.networking.currentPvp.on('unpaused', (fromTimestamp, toTimestamp) => {
            this.lastNetworkingSendedY = null;
            this.gameplayUI.unawaiting();
            this.gameplayWithGraphics.unpauseGameplay(toTimestamp, fromTimestamp || Date.now() - this.networking.timeDiff);
        });
        this.networking.currentPvp.once('finish', this._runGameover, this);

        this.lastNetworkingUpdateTimestamp = 0;
        this.lastNetworkingHpSyncTimestamp = 0;
        this.lastNetworkingSendedY = 0;
    }
    _workoutDamage(isA){
        var howMuch;

        this.scene.sound.play(`meow${Math.ceil(Math.random() * 4)}`);
        if(isA){
            howMuch = this.opts.mirror ? this.gameplayUI.decreaseHpB() : this.gameplayUI.decreaseHpA();
        } else {
            howMuch = this.opts.mirror ? this.gameplayUI.decreaseHpA() : this.gameplayUI.decreaseHpB();
        }
        if(!howMuch){
            this._prepareGameover();
        }
    }
    _prepareGameover(){
        if(this.networking.currentPvp){
            this.gameplayWithGraphics.stop();
            this.networking.currentPvp.sendGameover();
            this.waitingSpinner.visible = true;
        } else {
            this._runGameover();
        }
    }
    _runGameover(){
        if(this.waitingSpinner){
            this.waitingSpinner.destroy();
            this.waitingSpinner = undefined;
        }
        this.gameplayWithGraphics.stop();
        this.scene.sound.play('lose');
        this.gameplayUI.showGameoverOverlay(this.score);
    }
    _onUpdate(){
        var controllerY_Perc = this.controllerMaggie.getControlledPussyY_Perc(),
            now = Date.now();

        this.opts.mirror
            ? this.gameplayWithGraphics.controlPussyB(controllerY_Perc)
            : this.gameplayWithGraphics.controlPussyA(controllerY_Perc);

        if(this.networking.currentPvp && this.gameplayWithGraphics.running){
            let _hertzUpdate = this.lastNetworkingUpdateTimestamp + 1000 / HERTZ <= now,
                _hertsHpSync = (this.lastNetworkingHpSyncTimestamp + 1000 / HP_SYNC_HERTZ <= now) && !this.opts.mirror;

            if(_hertzUpdate || _hertsHpSync){
                let _msgToSend = {};

                if(_hertzUpdate){
                    let _currentY = this.controllerMaggie.getControlledPussyY_Fact();
                    if(_currentY !== this.lastNetworkingSendedY){
                        this.lastNetworkingSendedY = _currentY;
                        this.lastNetworkingUpdateTimestamp = now;
                        _msgToSend.p = { y: _currentY };
                    }
                }
                if(_hertsHpSync){
                    this.lastNetworkingHpSyncTimestamp = now;
                    _msgToSend.sync = { hp: `${this.gameplayUI.getHpB()};${this.gameplayUI.getHpA()}` };
                }

                if(Object.keys(_msgToSend).length){
                    this.networking.currentPvp.hertzMessage(_msgToSend);
                }
            }
            this.gameplayUI.setPingA(this.networking.currentPvp.pvpInstance.myPing);
            this.gameplayUI.setPingB(this.networking.currentPvp.pvpInstance.opponentPing);
        }
    }
    pause(){
        if(this.networking.currentPvp){
            this.networking.currentPvp.pause();
        }
    }
    resume(){
        this.lastNetworkingSendedY = null;
        if(this.networking.currentPvp){
            this.networking.currentPvp.resume();
        }
    }
    centerThings(){
        this.gameplayWithGraphics.centralize();
        this.gameplayUI.centralize();
        if(this.waitingSpinner){
            this.waitingSpinner.setPosition(this.scene.scale.gameSize.width / 2, this.scene.scale.gameSize.height / 2);
        }
    }
    destroy(){
        if(this.waitingSpinner){
            this.waitingSpinner.destroy();
            this.waitingSpinner = undefined;
        }
        this.gameplayWithGraphics.destroy();
        if(this.scene){
            this.scene.events.removeListener('update', this._onUpdate);
        }
        super.destroy();
    }
}

module.exports = Battleground;
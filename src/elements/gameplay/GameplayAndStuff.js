'use strict';

var Container = require('phaser').GameObjects.Container;

var detPong = require('../../model/deterministicPong.js'),
    DeterministicPong = detPong.DeterministicPong;

const SIZE_W = detPong.SIZE_W,
    SIZE_H = detPong.SIZE_H,
    DEFAULT_PUSSY_PROTRUSION_PERC = detPong.DEFAULT_PUSSY_PROTRUSION_PERC,
    CLEW_SPAWN_PENALTY = 20;

class GameplayAndStuff extends Container{
    constructor(scene, opts){
        super(scene, 0, 0);

        this.opts = opts;
        scene.add.existing(this);

        this.gameplayModel = new DeterministicPong(opts.startTimestamp, {
            rSeed: this.opts.randomSeed,
            clewSpawnPenalty: CLEW_SPAWN_PENALTY,
            noKeepState: this.opts.mirror
        });
        this.gameplayModel.on('pussyCollision', (pussyIsA, modelTime, pussyPositionY, clewId, fixDirection) =>
            this.emit(pussyIsA ? 'pussyPawA' : 'pussyPawB', modelTime, pussyPositionY, clewId, fixDirection));
        this.gameplayModel.on('strikeA', () => this.emit('minusHpA'));
        this.gameplayModel.on('strikeB', () => this.emit('minusHpB'));
        this.gameplayModel.on('clewSpawn', () => this.scene.sound.play(`spawn${Math.ceil(Math.random() * 3)}`));
        this.scene.events.on('update', this._onUpdate, this);

        this.pussyA_Coordinates = { x: SIZE_W * DEFAULT_PUSSY_PROTRUSION_PERC, y: 0 };
        this.pussyB_Coordinates = { x: SIZE_W * (1 - DEFAULT_PUSSY_PROTRUSION_PERC), y: 0 };

        if(this.opts.mirror){
            this.controlPussyB(.5);
        } else {
            this.controlPussyA(.5);
        }

        this.running = true;
    }
    controlPussyA(yValuePerc){
        if(!this.scene){
            return;
        }
        var yValue = Math.floor(yValuePerc * SIZE_H);
        this.pussyA_SetGraphics(yValue);
        if(this.running){
            this.imposePussyA_Y(yValue);
        }
    }
    pussyA_SetGraphics(yValue){
        this.pussyA_Coordinates.y = yValue;
    }
    imposePussyA_Y(yValue, atModelTime){
        if(!atModelTime){
            atModelTime = this.gameplayModel.getUpcomingModelTime(Date.now() - this.opts.timeDiff);
        }
        this.gameplayModel.imposePussyPositionDataA(atModelTime, yValue);
    }
    controlPussyB(yValuePerc){
        if(!this.scene){
            return;
        }
        var yValue = Math.floor(yValuePerc * SIZE_H);
        this.pussyB_SetGraphics(yValue);
        if(this.running){
            this.imposePussyB_Y(yValue);
        }
    }
    pussyB_SetGraphics(yValue){
        this.pussyB_Coordinates.y = yValue;
    }
    imposePussyB_Y(yValue, atModelTime){
        if(!atModelTime){
            atModelTime = this.gameplayModel.getUpcomingModelTime(Date.now() - this.opts.timeDiff);
        }
        this.gameplayModel.imposePussyPositionDataB(atModelTime, yValue);
    }
    fixClewDirection(atModelTime, clewId, theDirection){
        this.gameplayModel.imposeClewVectorDirection(atModelTime, clewId, theDirection);
    }
    pauseGameplay(atPlayTime){
        if(!this.gameplayModel._checkRecentlyPausedOrUnpaused()){
            this.gameplayModel.pauseCurrent(atPlayTime);
        }
    }
    unpauseGameplay(atPlayTime, swapPauseValue){
        if(swapPauseValue){
            this.gameplayModel.swapRecentPauseTimestamp(swapPauseValue);
        }
        this.gameplayModel.unpauseCurrent(atPlayTime);
    }
    dumpGameplayModelAt(atModelTime){
        return this.gameplayModel.getStateDumpAt(atModelTime);
    }
    syncGameplay(withDump){
        this.gameplayModel.imposeState(withDump.state, withDump.amt);
    }
    stop(){
        if(this.running){
            this.running = false;
            return true;
        } else {
            return false;
        }
    }
    _onUpdate(){
        if(this.running && this.scene){
            if(this.gameplayModel.update(Date.now() - this.opts.timeDiff)){
                let _latestDump = this.gameplayModel.getLastStateDump();
                if(_latestDump){
                    this.emit('sync-dump', _latestDump)
                }
            }
        }
    }
    centralize(){

    }
    destroy(){
        if(this.scene){
            this.scene.events.removeListener('update', this._onUpdate);
        }
        super.destroy();
    }
}

module.exports = GameplayAndStuff;
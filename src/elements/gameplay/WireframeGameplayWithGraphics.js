'use strict';

var Graphics = require('phaser').GameObjects.Graphics,
    Container = require('phaser').GameObjects.Container;

var GameplayAndStuff = require('./GameplayAndStuff.js'),
    Clew = require('../Clew.js');

var detPong = require('../../model/deterministicPong.js'),
    utils = require('./utils/utils.js');

const SIZE_W = detPong.SIZE_W,
    SIZE_H = detPong.SIZE_H,
    DEFAULT_CLEW_RADIUS = detPong.DEFAULT_CLEW_RADIUS,
    DEFAULT_PUSSY_RADIUS = detPong.DEFAULT_PUSSY_RADIUS,
    CLEW_GRAPHICS_DEFAULT_SCALE = 1,
    GRAPHICS_SHIFT_Y = 30;

class WireframeGameplayWithGraphics extends GameplayAndStuff{
    constructor(scene, opts){
        super(scene, opts);

        this.scene.events.on('update', this._onUpdate, this);

        this.containerWithClew = new Container(this.scene, 0, 0);
        this.add(this.containerWithClew);
        this.containerWithClew.setScale(this.opts.playZoneHeight / SIZE_H);
        this.registryOfClew = {};

        if(opts.wireframeCanvas){
            this.wireframeCanvas = new Graphics(this.scene);
            this.add(this.wireframeCanvas);
            this.wireframeCanvas.setScale(this.opts.playZoneHeight / SIZE_H);
        }

        this.playerA_DistancesSum = 0;
        this.playerB_DistancesSum = 0;

        this.centralize();
    }
    _onUpdate(){
        super._onUpdate();

        if(!this.scene){
            return;
        }

        if(this.wireframeCanvas){
            this.wireframeCanvas.clear();

            this.wireframeCanvas.lineStyle(2, 0x00ff00, .9);
            this.wireframeCanvas.strokeRect(0, 0, SIZE_W, SIZE_H);

            this.wireframeCanvas.lineStyle(2, 0xff0000, .9);
            this.wireframeCanvas.fillStyle(0xff0000, .7);
            this.wireframeCanvas.fillCircle(this.pussyA_Coordinates.x, this.pussyA_Coordinates.y, DEFAULT_PUSSY_RADIUS);
            this.wireframeCanvas.fillCircle(this.pussyB_Coordinates.x, this.pussyB_Coordinates.y, DEFAULT_PUSSY_RADIUS);
        }

        var balls = this.gameplayModel.getClewAtTime(Date.now() - this.opts.timeDiff);

        if(this.wireframeCanvas){
            this.wireframeCanvas.lineStyle(2, 0xffff00, .9);
            this.wireframeCanvas.fillStyle(0xffff00, .7);
        }

        for(let k in this.registryOfClew){
            if(this.registryOfClew.hasOwnProperty(k)){
                let _c = this.registryOfClew[k],
                    _bl = balls[k];
                if(_bl){
                    _c.setPosition(this.opts.mirror ? Math.abs(_bl.x - SIZE_W) : _bl.x, _bl.y);
                    _c.setHpText(_bl.hp);
                    if(_bl.hp >= 5){
                        _c.setOkay();
                    } else if(_bl.hp <= 4 && _bl.hp > 2){
                        _c.setFine();
                    } else {
                        _c.setNotFine();
                    }
                    _c.calculateRotationVectorFromDirection(_bl.dir);
                } else {
                    this.containerWithClew.remove(_c);
                    delete this.registryOfClew[k];
                }
            }
        }

        this.playerA_DistancesSum = 0;
        this.playerB_DistancesSum = 0;

        for(let k in balls){
            if(balls.hasOwnProperty(k)){
                let _b = balls[k],
                    _realX = this.opts.mirror ? Math.abs(_b.x - SIZE_W) : _b.x;
                if(this.wireframeCanvas){
                    this.wireframeCanvas.fillCircle(_b.x, _b.y, DEFAULT_CLEW_RADIUS);
                }
                if(!this.registryOfClew[k]){
                    let whichFreakinColor = Math.ceil(Math.random() * 5);
                    switch(whichFreakinColor){
                        case 1: whichFreakinColor = 'blue'; break;
                        case 2: whichFreakinColor = 'dark'; break;
                        case 3: whichFreakinColor = 'golden'; break;
                        case 4: whichFreakinColor = 'green'; break;
                        case 5: whichFreakinColor = 'yellow'; break;
                    }
                    let newClewSpr = new Clew(this.scene, { whichOne: whichFreakinColor, defaultHp: _b.hp, scale: CLEW_GRAPHICS_DEFAULT_SCALE });
                    this.containerWithClew.add(newClewSpr);
                    newClewSpr.setPosition(_realX, _b.y);
                    this.registryOfClew[k] = newClewSpr;
                }
                this.playerA_DistancesSum += utils.getTheDistance(
                    this.pussyA_Coordinates.x, this.pussyA_Coordinates.y,
                    _realX, _b.y
                );
                this.playerB_DistancesSum += utils.getTheDistance(
                    this.pussyB_Coordinates.x, this.pussyB_Coordinates.y,
                    _realX, _b.y
                );
            }
        }
    }
    get playerA_IsInRealMess(){
        return this.playerA_DistancesSum <= this.playerB_DistancesSum;
    }
    centralize(){
        super.centralize();
        this.setPosition(
            (this.opts.nominalWidth - SIZE_W * this.opts.playZoneHeight / SIZE_H) / 2,
            (this.opts.nominalHeight - this.opts.playZoneHeight) / 2 + GRAPHICS_SHIFT_Y
        );
    }
    destroy(){
        if(this.scene){
            this.scene.events.removeListener('update', this._onUpdate);
        }
        super.destroy();
    }
}

module.exports = WireframeGameplayWithGraphics;
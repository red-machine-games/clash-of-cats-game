'use strict';

var Container = require('phaser').GameObjects.Container,
    Sprite = require('phaser').GameObjects.Sprite;

const SCALE_W_REFERENCE = 1800,
    THROW_PAW_DURING_MS = 125,
    A_SMALL_SHIFT_UPWARDS_PX = -50;

class Pussy extends Container{
    constructor(scene, opts){
        super(scene, 0, 0);

        if(opts.whichOne === 'dark'){
            this.pussySpr = new Sprite(scene, 0, 0, 'game-1', 'cat_01');
            this.pussyPawSpr = new Sprite(scene, 0, 0, 'game-1', 'cat_01_02');
            this.pussySpr.setOrigin(0.4910394265232972, 0.8043758043758048);
            this.pussyPawSpr.setOrigin(0.37823967863493524, 0.8311166420367618);
        } else if(opts.whichOne === 'bright'){
            this.pussySpr = new Sprite(scene, 0, 0, 'game-1', 'cat_02');
            this.pussyPawSpr = new Sprite(scene, 0, 0, 'game-1', 'cat_02_02');
            this.pussySpr.setOrigin(0.5017921146953402, 0.8043758043758049);
            this.pussyPawSpr.setOrigin(0.6170798898071622, 0.838501291989664);
        }
        this.pussySpr.setPosition(null, -A_SMALL_SHIFT_UPWARDS_PX);
        this.pussyPawSpr.setPosition(null, -A_SMALL_SHIFT_UPWARDS_PX);
        this.pussySpr.setScale(opts.nominalWidth / SCALE_W_REFERENCE);
        this.pussyPawSpr.setScale(opts.nominalWidth / SCALE_W_REFERENCE);

        this.add(this.pussySpr);
        this.add(this.pussyPawSpr);
        this.pussyPawSpr.visible = false;

        this.pawTill = 0;

        scene.events.on('update', this._theUpdate, this);
    }
    throwPaw(){
        this.pawTill = Date.now() + THROW_PAW_DURING_MS;
        this.pussySpr.visible = false;
        this.pussyPawSpr.visible = true;
    }
    _theUpdate(){
        if(Date.now() >= this.pawTill && !this.pussySpr.visible){
            this.pussySpr.visible = true;
            this.pussyPawSpr.visible = false;
        }
    }
}

module.exports = Pussy;
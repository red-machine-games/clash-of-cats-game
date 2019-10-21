'use strict';

var Sprite = require('phaser').GameObjects.Sprite;

class Background extends Sprite{
    constructor(scene, opts){
        super(scene, 0, 0, 'backgrounds', opts.whichOne === 'menu' ? 1 : 0);

        scene.add.existing(this);
        this.setOrigin(0, 0);

        var displaySizeRatio = this.scene.scale.gameSize.width / this.scene.scale.gameSize.height,
            bgSizeRation = this.width / this.height;
        if(displaySizeRatio < bgSizeRation){
            let bgNewWidth = this.width * (this.scene.scale.gameSize.height / this.height);
            this.setDisplaySize(bgNewWidth, this.scene.scale.gameSize.height);
        } else {
            let bgNewHeight = this.height * (this.scene.scale.gameSize.width / this.width);
            this.setDisplaySize(this.scene.scale.gameSize.height, bgNewHeight);
        }
    }
    centralize(){
        if(!this.scene){
            return;
        }
        this.setPosition(
            (this.scene.scale.gameSize.width - this.displayWidth) / 2,
            (this.scene.scale.gameSize.height - this.displayHeight) / 2
        );
    }
}

module.exports = Background;
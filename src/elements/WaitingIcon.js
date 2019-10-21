'use strict';

var Container = require('phaser').GameObjects.Container,
    Sprite = require('phaser').GameObjects.Sprite;

const ORIGINAL_SCALE = .3;

class LoadingSpinner extends Container{
    constructor(scene){
        super(scene, 0, 0);

        this.awaitingSprt = new Sprite(scene, 0, 0, 'awaiting').setOrigin(.5).setScale(ORIGINAL_SCALE);
        this.add(this.awaitingSprt);

        this.scene.tweens.add({
            targets: this, scaleX: 1.025, scaleY: 1.025, rotation: Math.PI / 15,
            duration: 1000, yoyo: true,
            ease: 'Linear', repeat: Number.MAX_VALUE
        });
    }
}

module.exports = LoadingSpinner;
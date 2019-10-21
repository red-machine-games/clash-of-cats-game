'use strict';

var Container = require('phaser').GameObjects.Container,
    Sprite = require('phaser').GameObjects.Sprite;

const SPIN_RADS_PER_UPDATE = Math.PI / 50;

class LoadingSpinner extends Container{
    constructor(scene){
        super(scene, 0, 0);

        this.spinnerSprt = new Sprite(scene, 0, 0, 'spinner').setOrigin(.5);
        this.add(this.spinnerSprt);

        this.scene.events.on('update', this._onUpdate, this);
    }
    _onUpdate(){
        this.setRotation(this.rotation + SPIN_RADS_PER_UPDATE);
    }
    destroy(){
        if(this.scene){
            this.scene.events.removeListener('update', this._onUpdate);
        }
        super.destroy();
    }
}

module.exports = LoadingSpinner;
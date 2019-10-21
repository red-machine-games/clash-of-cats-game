'use strict';

var Container = require('phaser').GameObjects.Container,
    Sprite = require('phaser').GameObjects.Sprite,
    Text = require('phaser').GameObjects.Text;

var LoadingSpinner = require('./LoadingSpinner.js');

var utils = require('./utils/utils.js');

class PlayButton extends Container{
    constructor(scene, opts){
        super(scene, 0, 0);
        scene.add.existing(this);

        this.buttonSprite = new Sprite(scene, 0, 0, 'game-1', 'the_button');
        this.buttonText = new Text(scene, 0, 0, opts.text, {
            fontFamily: 'Changa', fontStyle: 'bold', fontSize: '48px', stroke: '#000', strokeThickness: 4
        }).setOrigin(.5);
        this.nameText = new Text(scene, 0, 0, `(as ${opts.name})`, {
            fontFamily: 'Changa', fontStyle: 'bold', fontSize: '24px', stroke: '#000', strokeThickness: 4
        }).setOrigin(.5, -.5);

        this.add(this.buttonSprite);
        this.add(this.buttonText);
        this.add(this.nameText);

        if(opts.size){
            this.buttonSprite.setScale(opts.size);
        }
        if(opts.color){
            switch(opts.color.toLowerCase()){
                case 'green': this.buttonSprite.tint = 0x00ff00; break;
                default: this.buttonSprite.tint = 0xffffff;
            }
        }

        this.spinner = new LoadingSpinner(this.scene).setScale(.3);
        this.add(this.spinner);
        this.spinner.visible = false;

        if(opts.pulsing){
            this.scene.tweens.add({
                targets: this, scaleX: 1.025, scaleY: 1.025,
                duration: 1000, yoyo: true,
                ease: 'Linear', repeat: Number.MAX_VALUE
            });
        }

        utils.makeClickable(this.buttonSprite, true, () => {
            this.scene.sound.play('click');
            this.emit('click');
        });
    }
    think(){
        this.spinner.visible = true;
        this.buttonText.visible = false;
        this.nameText.visible = false;
    }
    unthink(){
        this.spinner.visible = false;
        this.buttonText.visible = true;
        this.nameText.visible = true;
    }
    destroy(){
        this.spinner.destroy();
        super.destroy();
    }
}

module.exports = PlayButton;
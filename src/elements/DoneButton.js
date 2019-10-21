'use strict';

var Container = require('phaser').GameObjects.Container,
    Sprite = require('phaser').GameObjects.Sprite,
    Text = require('phaser').GameObjects.Text;

var utils = require('./utils/utils.js');

class DoneButton extends Container{
    constructor(scene, opts){
        super(scene, 0, 0);
        scene.add.existing(this);

        this.buttonSprite = new Sprite(scene, 0, 0, 'game-1', 'the_button');
        this.buttonText = new Text(scene, 0, 0, opts.text, { fontFamily: 'Changa', fontStyle: 'bold', fontSize: '36px', stroke: '#000', strokeThickness: 4 }).setOrigin(.5);

        this.add(this.buttonSprite);
        this.add(this.buttonText);

        if(opts.size){
            this.buttonSprite.setScale(opts.size);
        }
        if(opts.color){
            switch(opts.color.toLowerCase()){
                case 'green': this.buttonSprite.tint = 0x00ff00; break;
                default: this.buttonSprite.tint = 0xffffff;
            }
        }
        if(opts.pulsing){
            this.scene.tweens.add({
                targets: this, scaleX: 1.025, scaleY: 1.025,
                duration: 1000, yoyo: true,
                ease: 'Linear', repeat: Number.MAX_VALUE
            });
        }

        this.iconSprt = new Sprite(this.scene, 0, 0, 'game-1', 'exit_button').setOrigin(.5);
        this.add(this.iconSprt);
        this.iconSprt.setScale(.3);
        this.iconSprt.setPosition(-this.buttonText.displayWidth, 0);
        this.iconShadSprt = new Sprite(this.scene, 0, 0, 'game-1', 'src_button_shadow').setOrigin(.5);
        this.add(this.iconShadSprt);
        this.iconShadSprt.setScale(this.iconSprt.displayWidth / this.iconSprt.width + .31);
        this.iconShadSprt.setPosition(-this.buttonText.displayWidth - 2, -1);

        utils.makeClickable(this.buttonSprite, true, () => {
            this.scene.sound.play('click');
            this.emit('click');
        });
    }
}

module.exports = DoneButton;
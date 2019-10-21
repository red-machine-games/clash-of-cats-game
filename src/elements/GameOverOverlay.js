'use strict';

var Container = require('phaser').GameObjects.Container,
    Graphics = require('phaser').GameObjects.Graphics,
    Text = require('phaser').GameObjects.Text;

var DoneButton = require('./DoneButton.js');

const GGTEXT_PADDING = .25,
    DONE_BTN_PADDING = .75;

class GameOverOverlay extends Container{
    constructor(scene, opts){
        super(scene, 0, 0);

        this.bgshadow = new Graphics(this.scene);
        this.add(this.bgshadow);

        this.ggText = new Text(scene, 0, 0, ``, { fontFamily: 'Changa', fontStyle: 'bold', fontSize: '56px', stroke: '#000', strokeThickness: 6, align: 'center' }).setOrigin(.5);
        this.add(this.ggText);

        this.doneButton = new DoneButton(this.scene, { text: 'Done', pulsing: true, size: .5 });
        this.add(this.doneButton);
        this.doneButton.on('click', () => {
            this.scene.scene.start('MenuScene');
        });

        this.scoreValue = 0;
        this.totalScoreValue = 0;
        this.ladderPlaceValue = 0;
    }
    setScoreText(value){
        this.scoreValue = value;
        this.ggText.text = `Good Game!\nYour score: ${this.scoreValue}\n\nYou're at #${this.ladderPlaceValue} world's place.\nWith total score: ${this.totalScoreValue}`;
    }
    setGlobalPlaceInLadder(value){
        this.ladderPlaceValue = value;
        this.ggText.text = `Good Game!\nYour score: ${this.scoreValue}\n\nYou're at #${this.ladderPlaceValue} world's place.\nWith total score: ${this.totalScoreValue}`;
    }
    setTotalScore(value){
        this.totalScoreValue = value;
        this.ggText.text = `Good Game!\nYour score: ${this.scoreValue}\n\nYou're at #${this.ladderPlaceValue} world's place.\nWith total score: ${this.totalScoreValue}`;
    }
    centralize(){
        if(!this.scene){
            return;
        }
        this.bgshadow.clear();
        this.bgshadow.fillStyle(0x000000, .4);
        this.bgshadow.fillRect(0, 0, this.scene.scale.gameSize.width, this.scene.scale.gameSize.height);
        this.ggText.setPosition(
            this.scene.scale.gameSize.width / 2,
            this.scene.scale.gameSize.height * GGTEXT_PADDING + this.ggText.displayHeight / 2
        );
        this.doneButton.setPosition(
            this.scene.scale.gameSize.width / 2,
            this.scene.scale.gameSize.height * DONE_BTN_PADDING + this.doneButton.displayHeight / 2
        );
    }
}

module.exports = GameOverOverlay;
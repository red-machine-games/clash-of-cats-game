'use strict';

var Container = require('phaser').GameObjects.Container,
    Sprite = require('phaser').GameObjects.Sprite,
    Text = require('phaser').GameObjects.Text;

var GameOverOverlay = require('../GameOverOverlay.js'),
    WaitingIcon = require('../WaitingIcon.js');

var ControllerHowardResponsibleForNetworking = require('../../controllers/ControllerHowardResponsibleForNetworking.js');

const HEART_NORMAL_SIZE = .6,
    HEART_GAP = 10,
    ENEMY_HEART_NORMAL_SIZE = .3,
    ENEMY_HEART_GAP = 6;

class GameplayUI extends Container{
    constructor(scene, opts){
        super(scene, 0, 0);

        this.opts = opts;

        this.scoreValueA = 0;
        this.scoreTextA = new Text(scene, 0, 0, `${opts.myName}: ${this.scoreValueA}`, { fontFamily: 'Changa', fontStyle: 'bold', fontSize: '24px', stroke: '#000', strokeThickness: 4 }).setOrigin(.5);
        this.add(this.scoreTextA);
        this.scoreValueB = 0;
        this.scoreTextB = new Text(scene, 0, 0, `${opts.opponentName}: ${this.scoreValueB}`, { fontFamily: 'Changa', fontStyle: 'bold', fontSize: '18px', stroke: '#000', strokeThickness: 4 }).setOrigin(.5);
        this.add(this.scoreTextB);

        this.hpIndicatorContainerA = new Container(scene, 0, 0);
        this.heartSprtA = new Sprite(scene, 0, 0, 'game-1', 'heart').setOrigin(.5).setScale(HEART_NORMAL_SIZE);
        this._heartSprtA_displayWidth = this.heartSprtA.displayWidth;
        this._heartSprtA_displayHeight = this.heartSprtA.displayHeight;
        this.hpIndicatorContainerA.add(this.heartSprtA);
        if(opts.pulsing){
            this.scene.tweens.add({
                targets: this.heartSprtA, scaleX: HEART_NORMAL_SIZE + .03, scaleY: HEART_NORMAL_SIZE + .03,
                duration: 1000, yoyo: true,
                ease: 'Linear', repeat: -1
            });
        }

        this.hpIndicatorA = opts.defaultHp;
        this.hpTextA = new Text(scene, 0, 0, this.hpIndicatorA, { fontFamily: 'Changa', fontStyle: 'bold', fontSize: '48px', stroke: '#000', strokeThickness: 4 }).setOrigin(.5);
        this.hpIndicatorContainerA.add(this.hpTextA);

        this.add(this.hpIndicatorContainerA);

        this.hpIndicatorContainerB = new Container(scene, 0, 0);
        this.heartSprtB = new Sprite(scene, 0, 0, 'game-1', 'heart').setOrigin(.5).setScale(ENEMY_HEART_NORMAL_SIZE);
        this._heartSprtB_displayWidth = this.heartSprtB.displayWidth;
        this._heartSprtB_displayHeight = this.heartSprtB.displayHeight;
        this.hpIndicatorContainerB.add(this.heartSprtB);
        if(opts.pulsing){
            this.scene.tweens.add({
                targets: this.heartSprtB, scaleX: ENEMY_HEART_NORMAL_SIZE + .03, scaleY: ENEMY_HEART_NORMAL_SIZE + .03,
                duration: 1000, yoyo: true,
                ease: 'Linear', repeat: -1
            });
        }

        this.hpIndicatorB = opts.defaultHp;
        this.hpTextB = new Text(scene, 0, 0, this.hpIndicatorB, { fontFamily: 'Changa', fontStyle: 'bold', fontSize: '24px', stroke: '#000', strokeThickness: 4 }).setOrigin(.5);
        this.hpIndicatorContainerB.add(this.hpTextB);

        this.add(this.hpIndicatorContainerB);

        this.damageSprt = new Sprite(scene, 0, 0, 'red-cape').setOrigin(.5);
        this.damageSprt.setRotation(Math.PI / 2);
        this.damageSprt.setScale(14);
        this.damageSprt.setAlpha(0);
        this.add(this.damageSprt);

        this.awaitingIcon = new WaitingIcon(this.scene);
        this.add(this.awaitingIcon);
        this.awaitingIcon.visible = false;

        this.gameoverOverlay = new GameOverOverlay(this.scene, {});
        this.add(this.gameoverOverlay);
        this.gameoverOverlay.visible = false;

        this.pingTextA = new Text(scene, 0, 0, `ping: 0`, { fontFamily: 'Changa', fontStyle: 'bold', fontSize: '12px', stroke: '#000', strokeThickness: 2 }).setOrigin(.5);
        this.add(this.pingTextA);
        this.pingTextB = new Text(scene, 0, 0, `ping: 0`, { fontFamily: 'Changa', fontStyle: 'bold', fontSize: '12px', stroke: '#000', strokeThickness: 2 }).setOrigin(.5);
        this.add(this.pingTextB);

        this.networking = ControllerHowardResponsibleForNetworking.getOrCreate();
    }
    setPingA(pingValue){
        this.pingTextA.text = `ping: ${pingValue}`;
        if(pingValue >= 0 && pingValue <= 90){
            this.pingTextA.setColor('#0f0');
        } else if(pingValue > 90 && pingValue <= 130){
            this.pingTextA.setColor('#ff0');
        } else {
            this.pingTextA.setColor('#f00');
        }
        this.centralize();
    }
    setPingB(pingValue){
        this.pingTextB.text = `ping: ${pingValue}`;
        if(pingValue >= 0 && pingValue <= 90){
            this.pingTextB.setColor('#0f0');
        } else if(pingValue > 90 && pingValue <= 130){
            this.pingTextB.setColor('#ff0');
        } else {
            this.pingTextB.setColor('#f00');
        }
        this.centralize();
    }
    decreaseHpA(){
        return this.setHpA(this.hpIndicatorA - 1);
    }
    getHpA(){
        return this.hpIndicatorA;
    }
    setHpA(value){
        if(this.hpIndicatorA !== value){
            if(this.hpIndicatorA > value){
                this.scene.tweens.add({
                    targets: this.damageSprt, alpha: { from: 0, to: 1 },
                    duration: 200, yoyo: true,
                    ease: 'Cubic', repeat: 0
                });
                this.scene.cameras.main.shake(250, 0.01, true);
            }
            this.hpIndicatorA = value;
            this.hpTextA.text = this.hpIndicatorA;
        }
        return this.hpIndicatorA;
    }
    decreaseHpB(){
        return this.setHpB(this.hpIndicatorB - 1);
    }
    getHpB(){
        return this.hpIndicatorB;
    }
    setHpB(value){
        if(this.hpIndicatorB !== value){
            this.hpIndicatorB = value;
            this.hpTextB.text = this.hpIndicatorB;
        }
        return this.hpIndicatorB;
    }
    addScoreA(){
        this.scoreValueA++;
        this.scoreTextA.text = `${this.opts.myName}: ${this.scoreValueA}`;
    }
    addScoreB(){
        this.scoreValueB++;
        this.scoreTextB.text = `${this.opts.opponentName}: ${this.scoreValueB}`;
        this.centralize();
    }
    awaiting(){
        this.scene.sound.play('pause');
        this.awaitingIcon.visible = true;
    }
    unawaiting(){
        this.scene.sound.play('pause');
        this.awaitingIcon.visible = false;
    }
    showGameoverOverlay(theScore){
        this.gameoverOverlay.visible = true;
        this.gameoverOverlay.setScoreText(theScore);
        this.networking.getWorldRankAndScore(theScore)
            .then(theRankAndScore => {
                this.gameoverOverlay.setGlobalPlaceInLadder(theRankAndScore[0]);
                this.gameoverOverlay.setTotalScore(theRankAndScore[1]);
            })
            .catch(err => console.error(err));
    }
    centralize(){
        if(!this.scene){
            return;
        }
        this.hpIndicatorContainerA.setPosition(
            this._heartSprtA_displayWidth / 2 + HEART_GAP,
            this._heartSprtA_displayHeight / 2 + HEART_GAP
        );
        this.hpIndicatorContainerB.setPosition(
            this.scene.scale.gameSize.width - this._heartSprtB_displayWidth / 2 - ENEMY_HEART_GAP,
            this._heartSprtB_displayHeight / 2 + ENEMY_HEART_GAP
        );

        this.scoreTextA.setPosition(
            this.hpIndicatorContainerA.x - this._heartSprtA_displayWidth / 2 + this.scoreTextA.displayWidth / 2,
            this.hpIndicatorContainerA.y + this._heartSprtA_displayHeight / 2 + this.scoreTextA.displayHeight / 2 + ENEMY_HEART_GAP
        );
        this.scoreTextB.setPosition(
            this.scene.scale.gameSize.width - this.scoreTextB.displayWidth / 2 - ENEMY_HEART_GAP,
            this.hpIndicatorContainerB.y + this._heartSprtB_displayHeight / 2 + this.scoreTextB.displayHeight / 2 + ENEMY_HEART_GAP
        );

        this.pingTextA.setPosition(
            this.pingTextA.displayWidth / 2,
            this.scene.scale.gameSize.height - this.pingTextA.displayHeight / 2
        );
        this.pingTextB.setPosition(
            this.scene.scale.gameSize.width - this.pingTextB.displayWidth / 2,
            this.scene.scale.gameSize.height - this.pingTextB.displayHeight / 2
        );

        this.damageSprt.setPosition(
            (this.scene.scale.gameSize.width) / 2,
            (this.scene.scale.gameSize.height) / 2
        );
        this.awaitingIcon.setPosition(
            (this.scene.scale.gameSize.width) / 2,
            (this.scene.scale.gameSize.height) / 2
        );
        this.gameoverOverlay.centralize();
    }
}

module.exports = GameplayUI;
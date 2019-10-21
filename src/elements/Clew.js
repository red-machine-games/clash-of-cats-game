'use strict';

var Container = require('phaser').GameObjects.Container,
    Sprite = require('phaser').GameObjects.Sprite,
    Text = require('phaser').GameObjects.Text;

const MIN_ROTATION_VECTOR = 0,
    MAX_ROTATION_VECTOR = .1;

class Clew extends Container{
    constructor(scene, opts){
        super(scene, 0, 0);

        switch(opts.whichOne){
            case 'blue':
                this.okayClewSprt = new Sprite(scene, 0, 0, 'game-1', 'blue_clew');
                this.fineClewSprt = new Sprite(scene, 0, 0, 'game-1', 'blue_clew_half_disheveled');
                this.notFineClewSprt = new Sprite(scene, 0, 0, 'game-1', 'blue_clew_disheveled');
                break;
            case 'dark':
                this.okayClewSprt = new Sprite(scene, 0, 0, 'game-1', 'dark_clew');
                this.fineClewSprt = new Sprite(scene, 0, 0, 'game-1', 'dark_clew_half_disheveled');
                this.notFineClewSprt = new Sprite(scene, 0, 0, 'game-1', 'dark_clew_disheveled');
                break;
            case 'golden':
                this.okayClewSprt = new Sprite(scene, 0, 0, 'game-1', 'golden_clew');
                this.fineClewSprt = new Sprite(scene, 0, 0, 'game-1', 'golden_clew_half_disheveled');
                this.notFineClewSprt = new Sprite(scene, 0, 0, 'game-1', 'golden_clew_disheveled');
                break;
            case 'green':
                this.okayClewSprt = new Sprite(scene, 0, 0, 'game-1', 'green_clew');
                this.fineClewSprt = new Sprite(scene, 0, 0, 'game-1', 'green_clew');
                this.notFineClewSprt = new Sprite(scene, 0, 0, 'game-1', 'green_clew_disheveled');
                break;
            case 'yellow':
                this.okayClewSprt = new Sprite(scene, 0, 0, 'game-1', 'yellow_clew');
                this.fineClewSprt = new Sprite(scene, 0, 0, 'game-1', 'yellow_clew_half_disheveled');
                this.notFineClewSprt = new Sprite(scene, 0, 0, 'game-1', 'yellow_clew_disheveled');
                break;
        }

        this.bottomShadow = new Sprite(scene, 0, 0, 'clew-shadow');
        this.add(this.bottomShadow);
        this.bottomShadow.setOrigin(.5, -.2);

        this.clewCubcontainer = new Container(this.scene, 0, 0);
        this.add(this.clewCubcontainer);
        this.clewCubcontainer.add(this.okayClewSprt);
        this.clewCubcontainer.add(this.fineClewSprt);
        this.clewCubcontainer.add(this.notFineClewSprt);
        this.okayClewSprt.setOrigin(.5, .5);
        this.fineClewSprt.setOrigin(.5, .5);
        this.notFineClewSprt.setOrigin(.5, .5);
        this.okayClewSprt.visible = true;
        this.fineClewSprt.visible = false;
        this.notFineClewSprt.visible = false;

        this.rotationVector = 0;
        this.rotationVectorFromDir = 0;

        this.hpText = new Text(scene, 0, 0, opts.defaultHp + '', { fontFamily: 'Changa', fontStyle: 'bold', fontSize: '40px', stroke: '#000', strokeThickness: 4 }).setOrigin(.5).setScale(2);
        this.clewCubcontainer.add(this.hpText);

        this.currentState = 3;

        this.setScale(opts.scale);

        // this.alpha = .1;

        scene.events.on('update', this._theUpdate, this);
    }
    _theUpdate(){
        this.clewCubcontainer.setRotation(this.clewCubcontainer.rotation + this.rotationVector);
    }
    setHpText(v){
        this.hpText.text = v + '';
    }
    setOkay(){
        if(this.currentState === 2){
            this.fineClewSprt.visible = false;
        } else if(this.currentState === 1){
            this.notFineClewSprt.visible = false;
        } else if(this.currentState === 0){
            // TODO
        } else {
            return;
        }
        this.okayClewSprt.visible = true;
        this.currentState = 3;
    }
    setFine(){
        if(this.currentState === 3){
            this.okayClewSprt.visible = false;
        } else if(this.currentState === 1){
            this.notFineClewSprt.visible = false;
        } else if(this.currentState === 0){
            // TODO
        } else {
            return;
        }
        this.fineClewSprt.visible = true;
        this.currentState = 2;
    }
    setNotFine(){
        if(this.currentState === 3){
            this.okayClewSprt.visible = false;
        } else if(this.currentState === 2){
            this.fineClewSprt.visible = false;
        } else if(this.currentState === 0){
            // TODO
        } else {
            return;
        }
        this.notFineClewSprt.visible = true;
        this.currentState = 1;
    }
    setTotaled(){
        if(this.currentState === 3){
            this.okayClewSprt.visible = false;
        } else if(this.currentState === 2){
            this.fineClewSprt.visible = false;
        } else if(this.currentState === 1){
            this.notFineClewSprt.visible = false;
        } else {
            return;
        }
        // TODO
        this.hpText.visible = false;
        this.currentState = 0;
    }
    calculateRotationVectorFromDirection(dirRad){
        if(this.rotationVectorFromDir === dirRad){
            return;
        }
        if(dirRad >= 0 && dirRad < Math.PI / 2){
            this.rotationVector = MIN_ROTATION_VECTOR + (Math.PI / 2 - dirRad) * (MAX_ROTATION_VECTOR - MIN_ROTATION_VECTOR);
        } else if(dirRad >= Math.PI / 2 && dirRad <= Math.PI){
            this.rotationVector = (MIN_ROTATION_VECTOR + (Math.PI - dirRad) * (MAX_ROTATION_VECTOR - MIN_ROTATION_VECTOR)) * -1;
        } else if(dirRad >= -Math.PI / 2 && dirRad < 0){
            this.rotationVector = MIN_ROTATION_VECTOR + (Math.PI / 2 + dirRad) * (MAX_ROTATION_VECTOR - MIN_ROTATION_VECTOR);
        } else if(dirRad >= -Math.PI && dirRad < -Math.PI / 2){
            this.rotationVector = (MIN_ROTATION_VECTOR + (Math.PI + dirRad) * (MAX_ROTATION_VECTOR - MIN_ROTATION_VECTOR)) * -1;
        }
        this.rotationVectorFromDir = dirRad;
    }
}

module.exports = Clew;
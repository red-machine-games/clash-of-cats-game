'use strict';

var Phaser = require('phaser');

var game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'the-game',
    width: 1105,
    height: 625,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    autoRound: false,
    backgroundColor: 0x333333,
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
        transparent: false,
        clearBeforeRender: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'default',
        batchSize: 2000,
        desynchronized: false,
    },
    physics: {
        default: false
    },
    fps: {
        min: 10,
        target: 60,
        forceSetTimeOut: false,
        deltaHistory: 10
    },
    banner: {
        hidePhaser: true
    }
});

game.scene.add('BootScene', require('./scenes/BootScene.js'), true);
game.scene.add('MenuScene', require('./scenes/MenuScene.js'), false);
game.scene.add('GameplayScene', require('./scenes/GameplayScene.js'), false);
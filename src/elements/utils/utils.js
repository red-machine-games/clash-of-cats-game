'use strict';

module.exports = {
    makeClickable
};

function makeClickable(targetSprite, useHandCursor, onClick){
    targetSprite.preClick = false;

    if(targetSprite.constructor.name !== 'EventEmitter'){
        targetSprite
            .setInteractive({ useHandCursor: !!useHandCursor })
    }
    targetSprite
        .on('pointerout', () => targetSprite.preClick = false)
        .on('pointerdown', () => targetSprite.preClick = true)
        .on('pointerup', () => {
            if(targetSprite.preClick){
                targetSprite.preClick = false;
                onClick();
            }
        });
}
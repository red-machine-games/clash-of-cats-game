'use strict';

const SIDE_MILK_ZONE = .135,
    TOP_MILK_ZONE = .06,
    BOTTOM_MILK_ZONE = .01,
    FOLLOW_EASING = 3;

class ControllerMaggieResponsibleForMovingPussies{
    constructor(darkPussy, brightPussy, opts){
        this.darkPussy = darkPussy;
        this.brightPussy = brightPussy;
        this.opts = opts;

        this.pussy_1_targetY = 0;
        this.pussy_2_targetY = this.opts.nominalHeight / 2;

        this.controlledPussyFactY_Target = 0;
        this.controlledPussyFactY = 0;

        darkPussy.scene.input.on('pointermove', this._updatePussyPositionTarget, this);
        darkPussy.scene.events.on('update', this._onUpdate, this);

        this.darkPussy.setPosition(this.opts.nominalWidth * SIDE_MILK_ZONE, null);
        this.brightPussy.setPosition(this.opts.nominalWidth * (1 - SIDE_MILK_ZONE), null);
        this._updatePussyPositionTarget({ x: 0, y: opts.nominalHeight / 2 });
    }
    _updatePussyPositionTarget(pointer){
        this.pussy_1_targetY = Math.min(Math.max(this.opts.nominalHeight * TOP_MILK_ZONE, pointer.y), this.opts.nominalHeight * (1 - BOTTOM_MILK_ZONE));
        this.controlledPussyFactY_Target = Math.max(0, Math.min(this.opts.nominalHeight, ((pointer.y - (this.opts.nominalHeight * TOP_MILK_ZONE)) / (this.opts.nominalHeight * (1 - TOP_MILK_ZONE - BOTTOM_MILK_ZONE))) * this.opts.nominalHeight));
    }
    updatePussyB_PositionY(targetY){
        this.pussy_2_targetY = Math.min(Math.max(this.opts.nominalHeight * TOP_MILK_ZONE, targetY), this.opts.nominalHeight * (1 - BOTTOM_MILK_ZONE));
    }
    _onUpdate(){
        this.darkPussy.setPosition(
            this.darkPussy.x,
            this.darkPussy.y + ((this.pussy_1_targetY - this.darkPussy.y) / FOLLOW_EASING)
        );
        this.brightPussy.setPosition(
            this.brightPussy.x,
            this.brightPussy.y + ((this.pussy_2_targetY - this.brightPussy.y) / FOLLOW_EASING)
        );
        this.controlledPussyFactY += ((this.controlledPussyFactY_Target - this.controlledPussyFactY) / FOLLOW_EASING)
    }
    getControlledPussyY_Perc(){
        return this.controlledPussyFactY / this.opts.nominalHeight;
    }
    getControlledPussyY_Fact(){
        return this.pussy_1_targetY;
    }
    getFacePlayZoneHeight(){
        return this.opts.nominalHeight * (1 - TOP_MILK_ZONE - BOTTOM_MILK_ZONE);
    }
    fire(){
        console.log('Maggie: ;-(');
    }
}

module.exports = ControllerMaggieResponsibleForMovingPussies;
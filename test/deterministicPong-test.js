'use strict';

var expect = require('chai').expect;

var DeterministicPong = require('../src/model/deterministicPong.js').DeterministicPong;

describe('deterministicPong', () => {
    const EACH_STEP_PER_MS = 20,
        SIZE_W = 2400,
        SIZE_H = 1000,
        DEFAULT_CLEW_SPEED_PER_STEP = 15,
        DEFAULT_CLEW_HP = 5,
        DEFAULT_CLEW_RADIUS = 75,
        DEFAULT_PUSSY_RADIUS = 115,
        DEFAULT_PUSSY_PROTRUSION_PERC = .13,
        MAX_STEPS_TIME_TRAVEL = 200,
        CLEW_SPAWN_COOLDOWN_STEPS = 125;

    var deterministicPongModel;

    var _cacheStepT;

    describe('Model basics', () => {
        it('Should init make model', () => {
            deterministicPongModel = new DeterministicPong(0, { rSeed: 1337, _debug: { noMoreClew: true } });
        });
        it('Should make a step and see that there is a clew', () => {
            deterministicPongModel.update(EACH_STEP_PER_MS);
            expect(deterministicPongModel._clew.length).to.be.equal(1);
            expect(deterministicPongModel._clewPairs.length).to.be.equal(0);

            expect(deterministicPongModel._clew[0].vectors.length).to.be.equal(1);
            deterministicPongModel.update(EACH_STEP_PER_MS * 2);
            expect(deterministicPongModel._clew[0].vectors.length).to.be.equal(1);

            expect(deterministicPongModel._clew[0].getY(EACH_STEP_PER_MS * 2)).to.be.below(deterministicPongModel._clew[0].initialY);
        });
    });
    describe('Pause mechanisms', () => {
        var model1, model2, model3;

        it('Should init 3 models', () => {
            model1 = new DeterministicPong(0, { rSeed: 1337, _debug: { noMoreClew: true } });
            model2 = new DeterministicPong(0, { rSeed: 1337, _debug: { noMoreClew: true } });
            model3 = new DeterministicPong(0, { rSeed: 1337, _debug: { noMoreClew: true } });
        });
        it('Should checkout periods', () => {
            expect(model1._getLazyPausePeriods()).to.deep.equal([]);

            model1.pauseCurrent(20);
            expect(model1._getLazyPausePeriods()).to.deep.equal([[20, Number.POSITIVE_INFINITY]]);

            model1.unpauseCurrent(40);
            expect(model1._getLazyPausePeriods()).to.deep.equal([[20, 40]]);

            model1.pauseCurrent(100);
            expect(model1._getLazyPausePeriods()).to.deep.equal([[20, 40], [100, Number.POSITIVE_INFINITY]]);

            model1.unpauseCurrent(200);
            expect(model1._getLazyPausePeriods()).to.deep.equal([[20, 40], [100, 200]]);

            model1._lazyPausePeriods = null;
            model1.pauseTimestamps = [];
            model1.unpauseTimestamps = [];
        });
        it('Should workout case #1', () => {
            model1.pauseCurrent(40);
            model1.unpauseCurrent(80);
            model1.pauseCurrent(120);
            model1.unpauseCurrent(160);
            model1.pauseCurrent(200);
            model1.unpauseCurrent(240);
            model1.pauseCurrent(280);
            model1.unpauseCurrent(320);

            expect(model1._checkCurrentlyAtPause(0)).to.be.equal(false);
            expect(model1._checkCurrentlyAtPause(20)).to.be.equal(false);
            expect(model1._checkCurrentlyAtPause(40)).to.be.equal(true);
            expect(model1._checkCurrentlyAtPause(60)).to.be.equal(true);
            expect(model1._checkCurrentlyAtPause(80)).to.be.equal(false);
            expect(model1._checkCurrentlyAtPause(100)).to.be.equal(false);
            expect(model1._checkCurrentlyAtPause(120)).to.be.equal(true);
            expect(model1._checkCurrentlyAtPause(140)).to.be.equal(true);
            expect(model1._checkCurrentlyAtPause(160)).to.be.equal(false);
            expect(model1._checkCurrentlyAtPause(180)).to.be.equal(false);
            expect(model1._checkCurrentlyAtPause(200)).to.be.equal(true);
            expect(model1._checkCurrentlyAtPause(220)).to.be.equal(true);
            expect(model1._checkCurrentlyAtPause(240)).to.be.equal(false);
            expect(model1._checkCurrentlyAtPause(260)).to.be.equal(false);
            expect(model1._checkCurrentlyAtPause(280)).to.be.equal(true);
            expect(model1._checkCurrentlyAtPause(300)).to.be.equal(true);
            expect(model1._checkCurrentlyAtPause(320)).to.be.equal(false);

            expect(model1._passedTimeConsideringPauses(0, 0)).to.be.equal(0);
            expect(model1._passedTimeConsideringPauses(0, 20)).to.be.equal(20);
            expect(model1._passedTimeConsideringPauses(0, 40)).to.be.equal(40);
            expect(model1._passedTimeConsideringPauses(0, 60)).to.be.equal(40);
            expect(model1._passedTimeConsideringPauses(0, 80)).to.be.equal(40);
            expect(model1._passedTimeConsideringPauses(0, 100)).to.be.equal(60);
            expect(model1._passedTimeConsideringPauses(0, 120)).to.be.equal(80);
            expect(model1._passedTimeConsideringPauses(0, 140)).to.be.equal(80);
            expect(model1._passedTimeConsideringPauses(0, 160)).to.be.equal(80);

            expect(model1._passedTimeConsideringPauses(160, 160)).to.be.equal(0);
            expect(model1._passedTimeConsideringPauses(160, 180)).to.be.equal(20);
            expect(model1._passedTimeConsideringPauses(160, 200)).to.be.equal(40);
            expect(model1._passedTimeConsideringPauses(160, 220)).to.be.equal(40);
            expect(model1._passedTimeConsideringPauses(160, 240)).to.be.equal(40);
            expect(model1._passedTimeConsideringPauses(160, 260)).to.be.equal(60);
            expect(model1._passedTimeConsideringPauses(160, 280)).to.be.equal(80);
            expect(model1._passedTimeConsideringPauses(160, 300)).to.be.equal(80);
            expect(model1._passedTimeConsideringPauses(160, 320)).to.be.equal(80);

            expect(model1._timeMinusConsideringPauses(320, 0)).to.be.equal(320);
            expect(model1._timeMinusConsideringPauses(320, 20)).to.be.equal(260);
            expect(model1._timeMinusConsideringPauses(320, 40)).to.be.equal(240);
            expect(model1._timeMinusConsideringPauses(320, 60)).to.be.equal(180);
            expect(model1._timeMinusConsideringPauses(320, 80)).to.be.equal(160);
            expect(model1._timeMinusConsideringPauses(320, 100)).to.be.equal(100);
            expect(model1._timeMinusConsideringPauses(320, 120)).to.be.equal(80);
            expect(model1._timeMinusConsideringPauses(320, 140)).to.be.equal(20);
            expect(model1._timeMinusConsideringPauses(320, 160)).to.be.equal(0);
            expect(model1._timeMinusConsideringPauses(160, 0)).to.be.equal(160);
            expect(model1._timeMinusConsideringPauses(160, 20)).to.be.equal(100);
            expect(model1._timeMinusConsideringPauses(160, 40)).to.be.equal(80);
            expect(model1._timeMinusConsideringPauses(160, 60)).to.be.equal(20);
            expect(model1._timeMinusConsideringPauses(160, 80)).to.be.equal(0);
            expect(model1._timeMinusConsideringPauses(160, 100)).to.be.equal(0);

            model1._lazyPausePeriods = null;
            model1.pauseTimestamps = [];
            model1.unpauseTimestamps = [];
        });
        it('Should workout case #2', () => {
            model1.pauseCurrent(0);
            model1.unpauseCurrent(20);
            model1.pauseCurrent(60);
            model1.unpauseCurrent(160);
            model1.pauseCurrent(260);

            expect(model1._checkCurrentlyAtPause(0)).to.be.equal(true);
            expect(model1._checkCurrentlyAtPause(20)).to.be.equal(false);
            expect(model1._checkCurrentlyAtPause(40)).to.be.equal(false);
            expect(model1._checkCurrentlyAtPause(100)).to.be.equal(true);
            expect(model1._checkCurrentlyAtPause(160)).to.be.equal(false);
            expect(model1._checkCurrentlyAtPause(180)).to.be.equal(false);
            expect(model1._checkCurrentlyAtPause(260)).to.be.equal(true);
            expect(model1._checkCurrentlyAtPause(360)).to.be.equal(true);

            expect(model2._checkCurrentlyAtPause(0)).to.be.equal(false);
            expect(model2._checkCurrentlyAtPause(20)).to.be.equal(false);
            expect(model2._checkCurrentlyAtPause(40)).to.be.equal(false);
            expect(model2._checkCurrentlyAtPause(100)).to.be.equal(false);
            expect(model2._checkCurrentlyAtPause(160)).to.be.equal(false);
            expect(model2._checkCurrentlyAtPause(180)).to.be.equal(false);
            expect(model2._checkCurrentlyAtPause(260)).to.be.equal(false);
            expect(model2._checkCurrentlyAtPause(360)).to.be.equal(false);

            expect(model1._passedTimeConsideringPauses(0, 20)).to.be.equal(0);
            expect(model1._passedTimeConsideringPauses(0, 40)).to.be.equal(20);
            expect(model1._passedTimeConsideringPauses(0, 60)).to.be.equal(40);
            expect(model1._passedTimeConsideringPauses(60, 160)).to.be.equal(0);
            expect(model1._passedTimeConsideringPauses(40, 200)).to.be.equal(60);
            expect(model1._passedTimeConsideringPauses(20, 300)).to.be.equal(140);
            expect(model1._passedTimeConsideringPauses(260, 2600)).to.be.equal(0);

            expect(model2._passedTimeConsideringPauses(0, 20)).to.be.equal(20);
            expect(model2._passedTimeConsideringPauses(0, 40)).to.be.equal(40);
            expect(model2._passedTimeConsideringPauses(0, 60)).to.be.equal(60);
            expect(model2._passedTimeConsideringPauses(60, 160)).to.be.equal(100);
            expect(model2._passedTimeConsideringPauses(40, 200)).to.be.equal(160);
            expect(model2._passedTimeConsideringPauses(20, 300)).to.be.equal(280);
            expect(model2._passedTimeConsideringPauses(260, 2600)).to.be.equal(2340);

            model2.pauseCurrent(200);
            model2.unpauseCurrent(500);

            expect(model2._checkCurrentlyAtPause(0)).to.be.equal(false);
            expect(model2._checkCurrentlyAtPause(100)).to.be.equal(false);
            expect(model2._checkCurrentlyAtPause(180)).to.be.equal(false);
            expect(model2._checkCurrentlyAtPause(200)).to.be.equal(true);
            expect(model2._checkCurrentlyAtPause(300)).to.be.equal(true);
            expect(model2._checkCurrentlyAtPause(400)).to.be.equal(true);
            expect(model2._checkCurrentlyAtPause(500)).to.be.equal(false);
            expect(model2._checkCurrentlyAtPause(600)).to.be.equal(false);

            expect(model2._passedTimeConsideringPauses(0, 200)).to.be.equal(200);
            expect(model2._passedTimeConsideringPauses(0, 300)).to.be.equal(200);
            expect(model2._passedTimeConsideringPauses(0, 400)).to.be.equal(200);

            model3.pauseCurrent(1840);

            expect(model3._checkCurrentlyAtPause(1820)).to.be.equal(false);
            expect(model3._checkCurrentlyAtPause(1840)).to.be.equal(true);
            expect(model3._checkCurrentlyAtPause(1860)).to.be.equal(true);
        });
    });
    describe('Upper border collision', () => {
        it('Should point ball up', () => {
            deterministicPongModel._clew[0].imposeVector(EACH_STEP_PER_MS * 3, (Math.PI / 180) * -90, false, SIZE_W / 2, SIZE_H / 2);
            expect(deterministicPongModel._clew[0].vectors[deterministicPongModel._clew[0].vectors.length - 1].vectorY_unit).to.be.below(0);
        });
        it('Should track the ball', () => {
            var prevY = SIZE_H;

            for(let i = 0 ; i < SIZE_H / 2 / DEFAULT_CLEW_SPEED_PER_STEP ; i++){
                let stepT = EACH_STEP_PER_MS * (4 + i),
                    theY = deterministicPongModel._clew[0].getY(stepT);
                _cacheStepT = stepT;

                if(theY - DEFAULT_CLEW_SPEED_PER_STEP >= DEFAULT_CLEW_RADIUS){
                    expect(theY).to.be.below(prevY);
                    prevY = theY;
                    deterministicPongModel.update(stepT);
                } else {
                    deterministicPongModel.update(stepT);
                    expect(deterministicPongModel._clew[0].getY(stepT + DEFAULT_CLEW_SPEED_PER_STEP)).to.be.above(theY);
                    expect(deterministicPongModel._clew[0].vectors[deterministicPongModel._clew[0].vectors.length - 1].vectorY_unit).to.be.above(0);
                    return;
                }
            }
            throw new Error('Ball didn\'t reach the border');
        });
    });
    describe('Lower border collision', () => {
        it('Should point ball down', () => {
            _cacheStepT += EACH_STEP_PER_MS;
            deterministicPongModel._clew[0].imposeVector(_cacheStepT, (Math.PI / 180) * 90, false, SIZE_W / 2, SIZE_H / 2);
            expect(deterministicPongModel._clew[0].vectors[deterministicPongModel._clew[0].vectors.length - 1].vectorY_unit).to.be.above(0);
        });
        it('Should track the ball', () => {
            var prevY = 0;

            for(let i = 0 ; i < SIZE_H / 2 / DEFAULT_CLEW_SPEED_PER_STEP ; i++){
                let stepT = _cacheStepT + EACH_STEP_PER_MS,
                    theY = deterministicPongModel._clew[0].getY(stepT);
                _cacheStepT = stepT;

                if(theY + DEFAULT_CLEW_SPEED_PER_STEP <= SIZE_H - DEFAULT_CLEW_RADIUS){
                    expect(theY).to.be.above(prevY);
                    prevY = theY;
                    deterministicPongModel.update(stepT);
                } else {
                    deterministicPongModel.update(stepT);
                    expect(deterministicPongModel._clew[0].getY(stepT + EACH_STEP_PER_MS)).to.be.below(theY);
                    expect(deterministicPongModel._clew[0].vectors[deterministicPongModel._clew[0].vectors.length - 1].vectorY_unit).to.be.below(0);
                    return;
                }
            }
            throw new Error('Ball didn\'t reach the border');
        });
    });
    describe.skip('Right side collision', () => {
        it('Should point ball to the right', () => {
            _cacheStepT += EACH_STEP_PER_MS;
            deterministicPongModel._clew[0].imposeVector(_cacheStepT, 0, false, SIZE_W / 2, SIZE_H / 2);
            expect(deterministicPongModel._clew[0].vectors[deterministicPongModel._clew[0].vectors.length - 1].vectorX_unit).to.be.above(0);
        });
        it('Should track the ball', done => {
            for(let i = 0 ; i < SIZE_W / 2 / DEFAULT_CLEW_SPEED_PER_STEP ; i++){
                let stepT = _cacheStepT + EACH_STEP_PER_MS,
                    theX = deterministicPongModel._clew[0].getX(stepT);
                _cacheStepT = stepT;

                if(theX <= SIZE_W - DEFAULT_CLEW_RADIUS){
                    deterministicPongModel.update(stepT);
                } else {
                    deterministicPongModel.once('strikeB', () => {
                        if(deterministicPongModel._clew[0].getDestroyed(stepT)){
                            done();
                        } else {
                            done(new Error('Clew was not destroyed'));
                        }
                    });
                    return deterministicPongModel.update(stepT);
                }
            }
            done(new Error('Ball didn\'t reach the wall'));
        });
    });
    describe.skip('Left side collision', () => {
        it('Should revive and point ball to the left', () => {
            deterministicPongModel._clew[0].destroyedAtTime = null;
            deterministicPongModel._clew[0].vectors = [];
            deterministicPongModel._clew[0].imposeVector(_cacheStepT, Math.PI, false, SIZE_W / 2, SIZE_H / 2);
            expect(deterministicPongModel._clew[0].vectors[deterministicPongModel._clew[0].vectors.length - 1].vectorX_unit).to.be.below(0);
        });
        it('Should track the ball', done => {
            for(let i = 0 ; i < SIZE_W / 2 / DEFAULT_CLEW_SPEED_PER_STEP ; i++){
                let stepT = _cacheStepT + EACH_STEP_PER_MS,
                    theX = deterministicPongModel._clew[0].getX(stepT);
                _cacheStepT = stepT;

                if(theX >= DEFAULT_CLEW_RADIUS){
                    deterministicPongModel.update(stepT);
                } else {
                    deterministicPongModel.once('strikeA', () => {
                        if(deterministicPongModel._clew[0].getDestroyed(stepT)){
                            done();
                        } else {
                            done(new Error('Clew was not destroyed'));
                        }
                    });
                    return deterministicPongModel.update(stepT);
                }
            }
            done(new Error('Ball didn\'t reach the wall'));
        });
    });
    describe.skip('Pussy A collision', () => {
        it('Should revive and point ball to the left', () => {
            deterministicPongModel._clew[0].destroyedAtTime = null;
            deterministicPongModel._clew[0].vectors = [];
            deterministicPongModel._clew[0].imposeVector(_cacheStepT, Math.PI, false, SIZE_W / 2, SIZE_H / 2);
        });
        it('Should track the collision', done => {
            for(let i = 0 ; i < (SIZE_W / 2 - SIZE_W * DEFAULT_PUSSY_PROTRUSION_PERC) / DEFAULT_CLEW_SPEED_PER_STEP ; i++){
                let stepT = _cacheStepT + EACH_STEP_PER_MS,
                    theX = deterministicPongModel._clew[0].getX(stepT);
                _cacheStepT = stepT;

                deterministicPongModel.imposePussyPositionDataA(stepT, SIZE_H / 2);
                if(theX - DEFAULT_CLEW_SPEED_PER_STEP >= SIZE_W * DEFAULT_PUSSY_PROTRUSION_PERC + DEFAULT_PUSSY_RADIUS + DEFAULT_CLEW_RADIUS){
                    deterministicPongModel.update(stepT);
                } else {
                    deterministicPongModel.once('pussyCollision', pussyIsA => {
                        expect(pussyIsA).to.be.equal(true);
                        expect(deterministicPongModel._clew[0].getX(stepT + EACH_STEP_PER_MS)).to.be.above(theX);
                        expect(deterministicPongModel._clew[0].getHP(stepT)).to.be.equal(DEFAULT_CLEW_HP - 1);

                        done();
                    });
                    return deterministicPongModel.update(stepT);
                }
            }
            done(new Error('Ball didn\'t reach the pussy'));
        });
    });
    describe.skip('Pussy B collision', () => {
        it('Should point ball to the right', () => {
            _cacheStepT += EACH_STEP_PER_MS;
            deterministicPongModel._clew[0].imposeVector(_cacheStepT, 0, false, SIZE_W / 2, SIZE_H / 2);
        });
        it('Should track the collision', done => {
            for(let i = 0 ; i < (SIZE_W / 2 - SIZE_W * DEFAULT_PUSSY_PROTRUSION_PERC) / DEFAULT_CLEW_SPEED_PER_STEP ; i++){
                let stepT = _cacheStepT + EACH_STEP_PER_MS,
                    theX = deterministicPongModel._clew[0].getX(stepT);
                _cacheStepT = stepT;

                deterministicPongModel.imposePussyPositionDataB(stepT, SIZE_H / 2);
                if(theX + DEFAULT_CLEW_SPEED_PER_STEP <= SIZE_W * (1 - DEFAULT_PUSSY_PROTRUSION_PERC) - DEFAULT_PUSSY_RADIUS - DEFAULT_CLEW_RADIUS){
                    deterministicPongModel.update(stepT);
                } else {
                    deterministicPongModel.once('pussyCollision', pussyIsA => {
                        expect(pussyIsA).to.be.equal(false);
                        expect(deterministicPongModel._clew[0].getX(stepT + EACH_STEP_PER_MS)).to.be.below(theX);
                        expect(deterministicPongModel._clew[0].getHP(stepT)).to.be.equal(DEFAULT_CLEW_HP - 2);

                        done();
                    });
                    return deterministicPongModel.update(stepT);
                }
            }
            done(new Error('Ball didn\'t reach the pussy'));
        });
    });
    describe.skip('Pussy B collision with time traveling', () => {
        it('Should point ball to the right', () => {
            _cacheStepT += EACH_STEP_PER_MS;
            deterministicPongModel._clew[0].imposeVector(_cacheStepT, 0, false, SIZE_W / 2, SIZE_H / 2);
        });
        it('Should step to pussy B', () => {
            for(let i = 0 ; i < (SIZE_W / 2 - SIZE_W * DEFAULT_PUSSY_PROTRUSION_PERC) / DEFAULT_CLEW_SPEED_PER_STEP + 1 ; i++){
                let stepT = _cacheStepT + EACH_STEP_PER_MS,
                    theX = deterministicPongModel._clew[0].getX(stepT);
                _cacheStepT = stepT;

                deterministicPongModel.update(stepT);
                if(theX - DEFAULT_CLEW_SPEED_PER_STEP >= SIZE_W * (1 - DEFAULT_PUSSY_PROTRUSION_PERC)){
                    return;
                }
            }
            throw new Error('Ball didn\'t collide with pussy');
        });
        it('Should impose pussy B position into past step and see ball goes in reverse direction', () => {
            var stepT = _cacheStepT + EACH_STEP_PER_MS;

            expect(deterministicPongModel._clew[0].getX(stepT)).to.be.above(SIZE_W * (1 - DEFAULT_PUSSY_PROTRUSION_PERC) - DEFAULT_PUSSY_RADIUS - DEFAULT_CLEW_RADIUS);
            expect(deterministicPongModel._clew[0].vectors[deterministicPongModel._clew[0].vectors.length - 1].vectorX_unit).to.be.above(0);

            deterministicPongModel.imposePussyPositionDataB(_cacheStepT - EACH_STEP_PER_MS * 26, SIZE_H / 2);
            _cacheStepT = stepT;
            deterministicPongModel.update(stepT);

            expect(deterministicPongModel._clew[0].getX(stepT)).to.be.below(SIZE_W * (1 - DEFAULT_PUSSY_PROTRUSION_PERC) - DEFAULT_PUSSY_RADIUS - DEFAULT_CLEW_RADIUS);
            expect(deterministicPongModel._clew[0].vectors[deterministicPongModel._clew[0].vectors.length - 1].vectorX_unit).to.be.below(0);
            expect(deterministicPongModel._clew[0].getHP(stepT)).to.be.equal(DEFAULT_CLEW_HP - 3);
        });
    });
    describe('Collide two balls with each other', () => {
        var _cacheVectors1, _cacheVectors2;

        it('Should prepare balls', () => {
            _cacheStepT += EACH_STEP_PER_MS;
            deterministicPongModel._clew[0].imposeVector(_cacheStepT, 0, false, SIZE_W / 2 - DEFAULT_CLEW_RADIUS * 2, SIZE_H / 2);
            deterministicPongModel._debugSpawnClew(_cacheStepT);
            _cacheStepT += EACH_STEP_PER_MS;
            deterministicPongModel._clew[1].imposeVector(_cacheStepT, Math.PI, false, SIZE_W / 2 + DEFAULT_CLEW_RADIUS * 2, SIZE_H / 2);
            _cacheVectors1 = deterministicPongModel._clew[0].vectors.length;
            _cacheVectors2 = deterministicPongModel._clew[1].vectors.length;
        });
        it('Track them collide', () => {
            for(let i = 0 ; i < DEFAULT_CLEW_RADIUS * 2 / DEFAULT_CLEW_SPEED_PER_STEP ; i++){
                let stepT = _cacheStepT + EACH_STEP_PER_MS;
                _cacheStepT = stepT;

                deterministicPongModel.update(stepT);
            }
            expect(deterministicPongModel._clew[0].vectors.length).to.be.equal(_cacheVectors1 + 1);
            expect(deterministicPongModel._clew[1].vectors.length).to.be.equal(_cacheVectors2 + 1);
            expect(deterministicPongModel._clew[0].vectors[deterministicPongModel._clew[0].vectors.length - 1].vectorX_unit).to.be.below(0);
            expect(deterministicPongModel._clew[1].vectors[deterministicPongModel._clew[1].vectors.length - 1].vectorX_unit).to.be.above(0);
        });
    });
    describe('Time traveling before ball', () => {
        const N = 50;

        var _cacheStepT2 = 0,
            thePongModel, timeWhereToPlaceDebt,
            cacheClewCount, cacheTheLastClew;

        it('Should prepare model', () => {
            thePongModel = new DeterministicPong(0, { rSeed: 1337, _debug: { noMoreClew: true } });
        });
        it('Should wait a while for second ball', () => {
            timeWhereToPlaceDebt = _cacheStepT2;
            for(let i = 0 ; i < CLEW_SPAWN_COOLDOWN_STEPS ; i++){
                let stepT = _cacheStepT2 + EACH_STEP_PER_MS;
                _cacheStepT2 = stepT;

                thePongModel.update(stepT);
            }
        });
        it('Should step a while', () => {
            for(let i = 0 ; i < N ; i++){
                let stepT = _cacheStepT2 + EACH_STEP_PER_MS;
                _cacheStepT2 = stepT;

                thePongModel.update(stepT);
            }
            cacheClewCount = thePongModel._clew.length;
            cacheTheLastClew = JSON.parse(JSON.stringify(thePongModel._clew[cacheClewCount - 1]));
            delete cacheTheLastClew.theModel;
        });
        it('Should impose pussy B data before target clew creation', () => {
            thePongModel.imposePussyPositionDataB(timeWhereToPlaceDebt, Math.ceil(Math.random() * SIZE_H));
            thePongModel.update(_cacheStepT2 + EACH_STEP_PER_MS);

            expect(thePongModel._clew.length).to.be.equal(cacheClewCount);
            let _toCompare = JSON.parse(JSON.stringify(thePongModel._clew[cacheClewCount - 1]));
            delete _toCompare.theModel;
            expect(_toCompare).to.deep.equal(cacheTheLastClew);
        });
    });
    describe('Model dump getting and imposing', () => {
        const N_MSEC = 8000;

        var model1, model2;

        var dump;

        it('Should init 2 models to sync and compare', () => {
            model1 = new DeterministicPong(0, { rSeed: 80085 });
            model2 = new DeterministicPong(0, { rSeed: 80085 });
        });
        it('Should step both models and dump at half path', () => {
            for(let i = 0 ; i < N_MSEC / EACH_STEP_PER_MS ; i++){
                let stepT = EACH_STEP_PER_MS * (i + 1),
                    yetAnotherA_Position = Math.ceil(Math.random() * SIZE_H),
                    yetAnotherB_Position = Math.ceil(Math.random() * SIZE_H);

                model1.imposePussyPositionDataA(stepT, yetAnotherA_Position);
                model1.imposePussyPositionDataB(stepT, yetAnotherB_Position);
                model2.imposePussyPositionDataA(stepT, yetAnotherA_Position);
                model2.imposePussyPositionDataB(stepT, yetAnotherB_Position);

                if(stepT === N_MSEC - MAX_STEPS_TIME_TRAVEL * EACH_STEP_PER_MS / 2){
                    expect(model1.update(stepT)).to.be.equal(true);
                    model2.update(stepT);
                    if(!dump){
                        dump = model1.getLastStateDump();
                    }
                    expect(JSON.stringify(model2._workoutState(dump.state), null, 4)).to.be.equal(JSON.stringify([model2._clew, model2._clewPairs, model2._clewPussyPairs], null, 4));
                } else {
                    model1.update(stepT);
                    model2.update(stepT);
                }

                if(dump){
                    model2.imposeState(dump.state, dump.amt);
                    expect(JSON.stringify(model1._clew, null, 4)).to.deep.equal(JSON.stringify(model2._clew, null, 4));
                }
            }
        });
        it('Should impose dump into second and compare with first', () => {
            model2.imposeState(dump.state, dump.amt);
            expect(JSON.stringify(model1._clew, null, 4)).to.deep.equal(JSON.stringify(model2._clew, null, 4));
        });
    });
    for(let rs = 0 ; rs < 20 ; rs++){
        describe.skip(`Full equality of two models rs=${rs}`, () => {
            const N = 1000;

            var MTR_Between = require('../src/model/utils/utilsGuy.js').MTR_Between;

            var _mrtS = rs, _mrtC = 0;

            var model1, model2;

            it('Should spin up these models', () => {
                var rSeed = MTR_Between(_mrtS, _mrtC++, 1, 1000);
                model1 = new DeterministicPong(0, { rSeed, _debug: { debugName: 'model_1' } });
                model2 = new DeterministicPong(0, { rSeed, _debug: { debugName: 'model_2' } });
            });
            it('Should stress-test them', () => {
                var pussyB_RandomPositions1 = [], pussyB_RandomPositions2 = [],
                    pauseUnpause = [];

                for(let i = 0 ; i < N ; i++){
                    pussyB_RandomPositions1.push({ time: EACH_STEP_PER_MS * (i + 1), value: MTR_Between(_mrtS, _mrtC++, 1, SIZE_H) });
                    pussyB_RandomPositions2 = [].concat(pussyB_RandomPositions1);
                    if(MTR_Between(_mrtS, _mrtC++, 1, 100) >= 90){
                        let _toPush = EACH_STEP_PER_MS * (i - MTR_Between(_mrtS, _mrtC++, 1, 4));
                        if(_toPush >= 0 && !pauseUnpause.find(e => e >= _toPush)){
                            pauseUnpause.push(_toPush);
                        } else {
                            pauseUnpause.push(null);
                        }
                    } else {
                        pauseUnpause.push(null);
                    }
                }
                for(let i = 0 ; i < N / MAX_STEPS_TIME_TRAVEL ; i++){
                    for(let j = 0 ; j < MTR_Between(_mrtS, _mrtC++, 1, Math.min(MAX_STEPS_TIME_TRAVEL, 100)) - 2 ; j++){
                        let swapFromI = MAX_STEPS_TIME_TRAVEL * i + 1 + MTR_Between(_mrtS, _mrtC++, 0, MAX_STEPS_TIME_TRAVEL - 2),
                            swapToI = MAX_STEPS_TIME_TRAVEL * i + 1 + MTR_Between(_mrtS, _mrtC++, 0, MAX_STEPS_TIME_TRAVEL - 2),
                            aFist = pussyB_RandomPositions1[swapFromI];

                        if(swapFromI !== swapToI){
                            pussyB_RandomPositions1[swapFromI] = pussyB_RandomPositions1[swapToI];
                            pussyB_RandomPositions1[swapToI] = aFist;
                        }
                    }
                    for(let j = 0 ; j < MTR_Between(_mrtS, _mrtC++, 1, Math.min(MAX_STEPS_TIME_TRAVEL, 100)) - 2 ; j++){
                        let swapFromI = MAX_STEPS_TIME_TRAVEL * i + 1 + MTR_Between(_mrtS, _mrtC++, 0, MAX_STEPS_TIME_TRAVEL - 2),
                            swapToI = MAX_STEPS_TIME_TRAVEL * i + 1 + MTR_Between(_mrtS, _mrtC++, 0, MAX_STEPS_TIME_TRAVEL - 2),
                            aFist = pussyB_RandomPositions2[swapFromI];

                        if(swapFromI !== swapToI){
                            pussyB_RandomPositions2[swapFromI] = pussyB_RandomPositions2[swapToI];
                            pussyB_RandomPositions2[swapToI] = aFist;
                        }
                    }
                }

                var pauseUnpauseToggle = false;

                for(let i = 0 ; i < N ; i++){
                    let stepT = EACH_STEP_PER_MS * (i + 1),
                        _punp = pauseUnpause[i],
                        yetAnotherA_Position = MTR_Between(_mrtS, _mrtC++, 1, SIZE_H);

                    ////////////////////////////////#
                    if(![8, 12, 13, 14].includes(rs)){
                        if(_punp){
                            pauseUnpauseToggle = !pauseUnpauseToggle;
                            if(pauseUnpauseToggle){
                                model1.pauseCurrent(_punp);
                                model2.pauseCurrent(_punp);
                            } else {
                                model1.unpauseCurrent(_punp);
                                model2.unpauseCurrent(_punp);
                            }
                        }
                    }
                    ////////////////////////////////#

                    model1.imposePussyPositionDataA(stepT, yetAnotherA_Position);
                    model1.imposePussyPositionDataB(pussyB_RandomPositions1[i].time, pussyB_RandomPositions1[i].value);
                    model2.imposePussyPositionDataA(stepT, yetAnotherA_Position);
                    model2.imposePussyPositionDataB(pussyB_RandomPositions2[i].time, pussyB_RandomPositions2[i].value);

                    model1.update(stepT);
                    model2.update(stepT);

                    ////////////////////////////////#
                    if(rs !== 6){
                        if((i + 1) % MAX_STEPS_TIME_TRAVEL === 0){
                            expect(model1.pussyA_positionData).to.deep.equal(model2.pussyA_positionData);
                            expect(model1.pussyB_positionData).to.deep.equal(model2.pussyB_positionData);
                            expect(JSON.stringify(model1._clew, null, 4)).to.deep.equal(JSON.stringify(model2._clew, null, 4));
                        }
                    }
                    ////////////////////////////////#
                }
                expect(model1.pussyA_positionData).to.deep.equal(model2.pussyA_positionData);
                expect(model1.pussyB_positionData).to.deep.equal(model2.pussyB_positionData);
                expect(JSON.stringify(model1._clew, null, 4)).to.deep.equal(JSON.stringify(model2._clew, null, 4));
            });
        });
    }
});
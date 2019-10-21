'use strict';

var EventEmitter = require('phaser').Events.EventEmitter,
    crc32 = require('crc').crc32;

// Use eventemitter3 to run tests from Node.js
// var EventEmitter = require('eventemitter3');

var utils = require('./utils/utilsGuy.js');

const EACH_STEP_PER_MS = 20,
    MAX_STEPS_TIME_TRAVEL = 40,
    SIZE_W = 1800,
    SIZE_H = 1000,
    DEFAULT_CLEW_RADIUS = 65,
    DEFAULT_CLEW_COLLISION_COOLDOWN_STEPS = 10,
    DEFAULT_PUSSY_COLLISION_COOLDOWN_STEPS = 50,
    LOOPHOLE_STEPS = 30,
    DEFAULT_CLEW_X = SIZE_W / 2,
    DEFAULT_CLEW_Y = SIZE_H - DEFAULT_CLEW_RADIUS,
    DEFAULT_CLEW_SPEED_PER_STEP = 15,
    DEFAULT_CLEW_HP = 5,
    DEFAULT_PUSSY_RADIUS = 115,
    DEFAULT_PUSSY_PROTRUSION_PERC = .115,
    CLEW_SPAWN_COOLDOWN_STEPS_RANGE = [250, 100],
    MAX_CLEW_ON_BATTLEGROUND_RANGE = [2, 4],
    DIFFICULTY_EVERY_STEPS = 50,
    MAX_DIFFICULTY = 30,
    CLEW_EXPANSION_ANGLE = 60,
    PAW_ERROR_CONTROL_STEPS_FRAME = 100,
    DUMP_STATE_EVERY_STEPS = 100;

class DeterministicPong extends EventEmitter{
    constructor(launchTime, opts){
        super();

        this.opts = opts;

        this.launchTime = launchTime;
        this.lastModelStepTime = 0;
        this.mtRandomCounter = 0;

        this.pussyA_positionData = [];
        this.pussyA_PastDebt = Number.POSITIVE_INFINITY;
        this.pussyB_positionData = [];
        this.pussyA_PastDebt = Number.POSITIVE_INFINITY;

        this._clew = [];
        this._clewPairs = [];
        this._clewPussyPairs = [];
        this._clewVectorDirFix = [];

        this._strikesLog = [];
        this._pawsLog = [];

        this.pauseTimestamps = [];
        this.unpauseTimestamps = [];
        this._lazyPausePeriods = null;

        this._stateDumps = [];
    }
    dumpState(atModelTime){
        var _clewStr = '';
        for(let i = 0 ; i < this._clew.length ; i++){
            let _c = this._clew[i];
            _clewStr += `${_c.id},${_c.initialX},${_c.initialY},${_c.destroyedAtTime == null ? -1 : _c.destroyedAtTime}$`;
            for(let j = 0 ; j < _c.vectors.length ; j++){
                let _cv = _c.vectors[j];
                _clewStr += `${_cv.cat},${_cv.x},${_cv.y},${_cv.direction},${_cv.minusHp}${j < _c.vectors.length - 1 ? '|' : ''}`;
            }
            if(i < this._clew.length - 1){
                _clewStr += ';';
            }
        }

        var _clewPairsStr = '';
        for(let i = 0 ; i < this._clewPairs.length ; i++){
            let _cp = this._clewPairs[i];
            _clewPairsStr += `${_cp.clew1.id}|${_cp.clew2.id}|${JSON.stringify(_cp.collisions)}`;
            if(i < this._clewPairs.length - 1){
                _clewPairsStr += ';'
            }
        }

        var _clewPussyPairsStr = '';
        for(let i = 0 ; i < this._clewPussyPairs.length ; i++){
            let _cpp = this._clewPussyPairs[i];
            _clewPussyPairsStr += `${_cpp.clew.id}|${+_cpp.isPussyA}|${JSON.stringify(_cpp.collisions)}|${JSON.stringify(_cpp.loopholes)}`
            if(i < this._clewPussyPairs.length - 1){
                _clewPussyPairsStr += ';'
            }
        }

        var state = {
                c: _clewStr, cp: _clewPairsStr, cpp: _clewPussyPairsStr,
                mtr: this.mtRandomCounter,
                p: this.pauseTimestamps.join(','), unp: this.unpauseTimestamps.join(',')
            },
            hash = crc32(JSON.stringify(state)).toString(16);

        this._stateDumps.push({ amt: atModelTime, state: this.opts.noKeepState ? null : state, hash });
    }
    getLastStateDump(){
        return this._stateDumps[this._stateDumps.length - 1];
    }
    getStateDumpAt(atModelTime){
        for(let i = this._stateDumps.length - 1 ; i >= 0 ; i--){
            let _std = this._stateDumps[i];
            if(_std.amt === atModelTime){
                return _std;
            }
        }
    }
    _workoutState(theState){
        var _clew = [], _clewPairs = [], _clewPussyPairs = [], _pauseTimestamps, _unpauseTimestamps;

        function workoutClew(){
            if(theState.c){
                let _multipleClew = theState.c.split(';');
                for(let i = 0 ; i < _multipleClew.length ; i++){
                    let [_singleClew, _vectors] = _multipleClew[i].split('$');

                    let [_clewId, _initialX, _initialY, _destroyedAtTime] = _singleClew.split(',');

                    let _newClew = new _TheClew(0, +_initialX, +_initialY, 0, this);
                    _newClew.id = _clewId;
                    _newClew.destroyedAtTime = _destroyedAtTime === '-1' ? null : +_destroyedAtTime;

                    _vectors = _vectors.split('|');
                    for(let i = 0 ; i < _vectors.length ; i++){
                        let [_cat, _x, _y, _direction, _minusHp] = _vectors[i].split(','),
                            _newClewVector = new _TheClewVector(+_cat, +_x, +_y, +_direction, +_minusHp);

                        _newClew.vectors.push(_newClewVector);
                    }
                    _clew.push(_newClew);
                }
            }
            return workoutClewPairs.call(this);
        }
        function workoutClewPairs(){
            if(theState.cp){
                let _multipleClewPairs = theState.cp.split(';');
                for(let i = 0 ; i < _multipleClewPairs.length ; i++){
                    let [_clew1Id, _clew2Id, _collisions] = _multipleClewPairs[i].split('|'),
                        _newClewPair = new _ClewPair(_clew.find(e => e.id === _clew1Id), _clew.find(e => e.id === _clew2Id), this);
                    _newClewPair.collisions = JSON.parse(_collisions);

                    _clewPairs.push(_newClewPair);
                }
            }
            return workoutClewPussyPairs.call(this);
        }
        function workoutClewPussyPairs(){
            if(theState.cpp){
                let _multipleClewPussyPairs = theState.cpp.split(';');
                for(let i = 0 ; i < _multipleClewPussyPairs.length ; i++){
                    let [_clewId, _isPussyA, _collisions, _loopholes] = _multipleClewPussyPairs[i].split('|'),
                        _newClewPussyPair = new _ClewPussyPair(_clew.find(e => e.id === _clewId), !!+_isPussyA, this);
                    _newClewPussyPair.collisions = JSON.parse(_collisions);
                    _newClewPussyPair.loopholes = JSON.parse(_loopholes);

                    _clewPussyPairs.push(_newClewPussyPair);
                }
            }
            return workoutPauseUnpause.call(this);
        }
        function workoutPauseUnpause(){
            _pauseTimestamps = theState.p ? theState.p.split(',') : [];
            _unpauseTimestamps = theState.unp ? theState.unp.split(',') : [];

            return [_clew, _clewPairs, _clewPussyPairs, _pauseTimestamps, _unpauseTimestamps];
        }

        return workoutClew.call(this);
    }
    imposeState(theState, atModelTime){
        if(this._passedTimeConsideringPauses(atModelTime, this.lastModelStepTime) > MAX_STEPS_TIME_TRAVEL * EACH_STEP_PER_MS){
            // throw new Error('atModelTime goes beyond allowed time travel');
            return;
        }

        this._stateDumps = [];

        [this._clew, this._clewPairs, this._clewPussyPairs, this.pauseTimestamps, this.unpauseTimestamps] =
            this._workoutState(theState);

        this._timeTravel(this.lastModelStepTime + EACH_STEP_PER_MS, atModelTime + EACH_STEP_PER_MS, theState.mtr);
    }
    imposePussyPositionDataA(atModelTime, y){
        if(atModelTime % EACH_STEP_PER_MS){
            throw new Error(`Argument atModelTime must be multiple of EACH_STEP_PER_MS(${EACH_STEP_PER_MS})`);
        }
        this.pussyA_PastDebt = Math.min(this.pussyA_PastDebt, atModelTime);
        this._imposePussyPositionData(atModelTime, SIZE_W * DEFAULT_PUSSY_PROTRUSION_PERC, y, this.pussyA_positionData);
    }
    imposePussyPositionDataB(atModelTime, y){
        if(atModelTime % EACH_STEP_PER_MS){
            throw new Error(`Argument atModelTime must be multiple of EACH_STEP_PER_MS(${EACH_STEP_PER_MS})`);
        }
        this.pussyB_PastDebt = Math.min(this.pussyB_PastDebt, atModelTime);
        this._imposePussyPositionData(atModelTime, SIZE_W * (1 - DEFAULT_PUSSY_PROTRUSION_PERC), y, this.pussyB_positionData);
    }
    _imposePussyPositionData(atModelTime, x, y, targetPositionData){
        if(atModelTime % EACH_STEP_PER_MS){
            throw new Error(`atModelTime is not multiple of EACH_STEP_PER_MS(${EACH_STEP_PER_MS})`);
        }
        if(this._passedTimeConsideringPauses(atModelTime, this.lastModelStepTime) > MAX_STEPS_TIME_TRAVEL * EACH_STEP_PER_MS){
            // throw new Error('atModelTime goes beyond allowed time travel');
            return;
        }

        var _newPd = new _ThePussyPositionData(atModelTime, x, y);
        if(!targetPositionData.length || targetPositionData[targetPositionData.length - 1].atModelTime <= atModelTime){
            targetPositionData.push(_newPd);
        } else if(targetPositionData[0].atModelTime > atModelTime){
            targetPositionData.unshift(_newPd);
        } else {
            for(let i = 0 ; i < targetPositionData.length - 1 ; i++){
                if(targetPositionData[i].atModelTime === atModelTime){
                    if(targetPositionData[i].x === x && targetPositionData[i].y === y){
                        break;
                    } else {
                        throw new Error('Imposing position data at frame that already exists(with different data)');
                    }
                } else if(targetPositionData[i].atModelTime < atModelTime && targetPositionData[i + 1].atModelTime > atModelTime){
                    targetPositionData.splice(i + 1, 0, _newPd);
                    break;
                } else if(i === targetPositionData.length - 1){
                    targetPositionData.push(_newPd);
                    break;
                }
            }
        }
    }
    imposeClewVectorDirection(atModelTime, clewId, theDirection){
        if(this._passedTimeConsideringPauses(atModelTime, this.lastModelStepTime) > MAX_STEPS_TIME_TRAVEL * EACH_STEP_PER_MS){
            // throw new Error('atModelTime goes beyond allowed time travel');
            return;
        }

        this._clewVectorDirFix.push(new _TheClewVectorDirectionFix(atModelTime, clewId, theDirection));
    }
    _debugSpawnClew(atModelTime){
        _spawnClew.call(this, atModelTime);
    }
    update(playTime){
        var _elapsedPT = playTime - this.launchTime,
            _elapsedAfterLastStep = _elapsedPT - this.lastModelStepTime,
            _soHowMuchStepsWeGot = Math.floor(utils.accuracyLossDivide(_elapsedAfterLastStep, EACH_STEP_PER_MS)),
            dumped = false;

        if(_soHowMuchStepsWeGot){
            for(let i = 1 ; i <= _soHowMuchStepsWeGot ; i++){
                let _theModelTime = this.lastModelStepTime + EACH_STEP_PER_MS * i;
                _modelStep.call(this, _theModelTime);
                if(_theModelTime % (DUMP_STATE_EVERY_STEPS * EACH_STEP_PER_MS) === 0){
                    this.dumpState(_theModelTime);
                    dumped = true;
                }
            }
            this.lastModelStepTime += EACH_STEP_PER_MS * _soHowMuchStepsWeGot;
        }
        return dumped;
    }
    getUpcomingModelTime(playTime){
        return Math.ceil((playTime - this.launchTime) / EACH_STEP_PER_MS) * EACH_STEP_PER_MS
    }
    pauseCurrent(atPlayTime){
        if(this._checkRecentlyPausedOrUnpaused()){
            // throw new Error('It\'s already at pause');
            return;
        }

        var atModelTime = this.getUpcomingModelTime(atPlayTime);

        if(this._passedTimeConsideringPauses(atModelTime, this.lastModelStepTime) > MAX_STEPS_TIME_TRAVEL * EACH_STEP_PER_MS){
            throw new Error('atPlayTime goes beyond allowed time travel');
        }

        if(this.unpauseTimestamps.length && this.unpauseTimestamps[this.unpauseTimestamps.length - 1] === atModelTime){
            throw new Error('It\'s already something at this step');
        }
        this.pauseTimestamps.push(atModelTime);

        this._lazyPausePeriods = null;
        this._timeTravel(this.lastModelStepTime, atModelTime);
    }
    unpauseCurrent(atPlayTime){
        if(!this._checkRecentlyPausedOrUnpaused()){
            // throw new Error('It\'s already unpaused');
            return;
        }

        var atModelTime = this.getUpcomingModelTime(atPlayTime);

        if(this._passedTimeConsideringPauses(atModelTime, this.lastModelStepTime) > MAX_STEPS_TIME_TRAVEL * EACH_STEP_PER_MS){
            throw new Error('atPlayTime goes beyond allowed time travel');
        }

        var lastPauseTimestamp = this.pauseTimestamps[this.pauseTimestamps.length - 1];

        if(this.pauseTimestamps.length && lastPauseTimestamp === atModelTime){
            throw new Error('It\'s already something at this step');
        }
        this.unpauseTimestamps.push(atModelTime);

        this._lazyPausePeriods = null;
        this._timeTravel(this.lastModelStepTime, lastPauseTimestamp);
    }
    swapRecentPauseTimestamp(toPlayTime){
        if(!toPlayTime){
            throw new Error('toPlayTime value is incorrect');
        }
        if(!this.pauseTimestamps.length){
            throw new Error('No pause recently');
        }

        var toModelTime = this.getUpcomingModelTime(toPlayTime);

        // if(this._passedTimeConsideringPauses(toModelTime, this.lastModelStepTime) > MAX_STEPS_TIME_TRAVEL * EACH_STEP_PER_MS){
        //     throw new Error('toPlayTime goes beyond allowed time travel');
        // }

        if(this.pauseTimestamps[this.pauseTimestamps.length - 1] !== toModelTime){
            let prevModelTime = this.pauseTimestamps.splice(this.pauseTimestamps.length - 1, 1)[0];

            if(this.unpauseTimestamps.length && this.unpauseTimestamps[this.unpauseTimestamps.length - 1] === toModelTime){
                throw new Error('It\'s already something at this step');
            }
            this.pauseTimestamps.push(toModelTime);

            this._lazyPausePeriods = null;
            this._timeTravel(this.lastModelStepTime, Math.min(prevModelTime, toModelTime));
        }
    }
    _timeTravel(fromModelTime, toModelTime, forceSetMtRandom){
        if(fromModelTime > toModelTime){
            for(let i = this._clew.length - 1 ; i >= 0 ; i--){
                let _theClew = this._clew[i];
                if(!_theClew.rollbackHistory(toModelTime)){
                    this.mtRandomCounter--;
                    this._clew.splice(i, 1);
                    for(let j = this._clewPairs.length - 1 ; j >= 0 ; j--){
                        let _pair = this._clewPairs[j];
                        if(_pair.clew1 === _theClew || _pair.clew2 === _theClew){
                            this._clewPairs.splice(j, 1);
                        }
                    }
                    for(let j = this._clewPussyPairs.length - 1 ; j >= 0 ; j--){
                        let _pair = this._clewPussyPairs[j];
                        if(_pair.clew === _theClew){
                            this._clewPussyPairs.splice(j, 1);
                        }
                    }
                }
            }
            for(let j = 0 ; j < this._clewPairs.length ; j++){
                this._clewPairs[j].rollback(toModelTime);
            }
            for(let j = 0 ; j < this._clewPussyPairs.length ; j++){
                this._clewPussyPairs[j].rollback(toModelTime);
            }

            let howMuchStepsForDebt = ((fromModelTime - toModelTime) / EACH_STEP_PER_MS) - 1;

            if(typeof forceSetMtRandom === 'number' && !isNaN(forceSetMtRandom)){
                this.mtRandomCounter = forceSetMtRandom;
            }

            for(let i = 0 ; i <= howMuchStepsForDebt ; i++){
                _modelStep.call(this, toModelTime + (i * EACH_STEP_PER_MS));
            }
        }
    }
    _getLazyPausePeriods(){
        if(!this._lazyPausePeriods){
            this._lazyPausePeriods = [];

            if(this.pauseTimestamps.length === 1 && !this.unpauseTimestamps.length){
                this._lazyPausePeriods.push([this.pauseTimestamps[this.pauseTimestamps.length - 1], Number.POSITIVE_INFINITY]);
            } else if(this.pauseTimestamps.length && this.unpauseTimestamps.length){
                let _pi = this.pauseTimestamps.length - 1,
                    _upi = this.unpauseTimestamps.length - 1;

                while(_pi >= 0 || _upi >= 0){
                    let _pA = _pi >= 0 ? this.pauseTimestamps[_pi] : null,
                        _pB = _upi >= 0 ? this.unpauseTimestamps[_upi] : null;

                    if(_pA > _pB){
                        this._lazyPausePeriods.unshift([_pA, Number.POSITIVE_INFINITY]);
                        _pi--;
                    } else if(_pA == null){
                        this._lazyPausePeriods.unshift([0, _pB]);
                        _upi--;
                    } else {
                        this._lazyPausePeriods.unshift([_pA, _pB]);
                        _pi--;
                        _upi--;
                    }
                }
            }
        }
        return this._lazyPausePeriods;
    }
    _checkRecentlyPausedOrUnpaused(){
        if(!this.pauseTimestamps.length && !this.unpauseTimestamps.length){
            return false;
        } else if(this.pauseTimestamps.length && !this.unpauseTimestamps.length){
            return true;
        } else {
            return (this.pauseTimestamps[this.pauseTimestamps.length - 1] > this.unpauseTimestamps[this.unpauseTimestamps.length - 1]);
        }
    }
    _checkCurrentlyAtPause(atModelTime){
        if(!this.pauseTimestamps.length && this.unpauseTimestamps.length){
            return false;
        } else if(this.pauseTimestamps.length && !this.unpauseTimestamps.length){
            return (atModelTime >= this.pauseTimestamps[0]);
        } else if(!this.pauseTimestamps.length && !this.unpauseTimestamps.length){
            return false;
        } else {
            for(let i = this._getLazyPausePeriods().length - 1 ; i >= 0 ; i--){
                let _per = this._getLazyPausePeriods()[i],
                    _perFrom = _per[0], _perTo = _per[1];

                if(_perFrom <= atModelTime && _perTo > atModelTime){
                    return true;
                } else if(_perTo < atModelTime){
                    break;
                }
            }
            return false;
        }
    }
    _passedTimeConsideringPauses(fromModelTime, toModelTime){
        if(!this.pauseTimestamps.length && !this.unpauseTimestamps.length){
            return toModelTime - fromModelTime;
        } else {
            let _outputTime = toModelTime - fromModelTime;

            for(let i = this._getLazyPausePeriods().length - 1 ; i >= 0 ; i--){
                let _per = this._getLazyPausePeriods()[i],
                    _perFrom = _per[0], _perTo = _per[1];

                if((_perFrom >= fromModelTime && _perFrom <= toModelTime) || (_perTo > fromModelTime && _perTo <= toModelTime)){
                    _outputTime -= Math.min(toModelTime, _perTo) - Math.max(fromModelTime, _perFrom);
                } else if(_perTo < fromModelTime){
                    break;
                }
            }

            return _outputTime;
        }
    }
    _timeMinusConsideringPauses(fromModelTime, minusTime){
        if(minusTime <= 0){
            return fromModelTime;
        } else if(!this.pauseTimestamps.length && !this.unpauseTimestamps.length){
            return fromModelTime - minusTime;
        } else {
            let _targetToModelTime = fromModelTime - minusTime,
                _peri = this._getLazyPausePeriods().length - 1;

            while(_peri >= 0){
                let _per = this._getLazyPausePeriods()[_peri],
                    _perFrom = _per[0], _perTo = _per[1];

                if((_perFrom >= _targetToModelTime && _perFrom <= fromModelTime) || (_perTo > _targetToModelTime && _perTo <= fromModelTime)){
                    _targetToModelTime -= Math.min(fromModelTime, _perTo) - _perFrom;
                    _peri--;
                } else if(_perTo <= _targetToModelTime){
                    break;
                } else {
                    _peri--;
                }
            }

            return Math.max(0, _targetToModelTime);
        }
    }
    getClewAtTime(atPlayTime){
        var atPlayTimeFixed = atPlayTime - this.launchTime;
        if(this.lastModelStepTime - atPlayTimeFixed > MAX_STEPS_TIME_TRAVEL * EACH_STEP_PER_MS){
            throw new Error('atPlayTime goes beyond allowed time travel');
        }

        var out = {};

        for(let i = 0 ; i < this._clew.length ; i++){
            let _theClew = this._clew[i];
            if(!_theClew.getDestroyed(atPlayTimeFixed)){
                out[_theClew.id] = {
                    x: _theClew.getX(atPlayTimeFixed), y: _theClew.getY(atPlayTimeFixed),
                    hp: _theClew.getHP(atPlayTimeFixed), dir: _theClew.getCurrentDirection(atPlayTimeFixed)
                };
            }
        }

        return out;
    }
}

function _modelStep(modelTime){
    function workoutOutOfTimeTravelFrame(){
        var borderOfTimeTraveling = this._timeMinusConsideringPauses(modelTime, EACH_STEP_PER_MS * MAX_STEPS_TIME_TRAVEL);

        for(let i = this.pussyA_positionData.length - 1 ; i >= 0 ; i--){
            if(this.pussyA_positionData[i].atModelTime < borderOfTimeTraveling){
                this.pussyA_positionData.splice(i, 1);
            }
        }
        for(let i = this.pussyB_positionData.length - 1 ; i >= 0 ; i--){
            if(this.pussyB_positionData[i].atModelTime < borderOfTimeTraveling){
                this.pussyB_positionData.splice(i, 1);
            }
        }
        for(let i = this._clew.length - 1 ; i >= 0 ; i--){
            let _theClew = this._clew[i];
            if(_theClew.getDestroyed(borderOfTimeTraveling)){
                this._clew.splice(i, 1);
                for(let j = this._clewPairs.length - 1 ; j >= 0 ; j--){
                    let _pair = this._clewPairs[j];
                    if(_pair.clew1 === _theClew || _pair.clew2 === _theClew){
                        this._clewPairs.splice(j, 1);
                    }
                }
                for(let j = this._clewPussyPairs.length - 1 ; j >= 0 ; j--){
                    let _pair = this._clewPussyPairs[j];
                    if(_pair.clew === _theClew){
                        this._clewPussyPairs.splice(j, 1);
                    }
                }
            } else {
                for(let j = _theClew.vectors.length - 1 ; j > 0 ; j--){
                    let _v = _theClew.vectors[j];
                    if(_v.atModelTime <= borderOfTimeTraveling){
                        _theClew.vectors.splice(0, j);
                        break;
                    }
                }
            }
        }
        for(let i = 0 ; i < this._clewPairs.length ; i++){
            let _cp = this._clewPairs[i];
            for(let j = 0 ; j < _cp.collisions.length ; j++){
                if(_cp.collisions[j] <= borderOfTimeTraveling){
                    _cp.collisions.splice(0, j);
                    break;
                }
            }
        }
        for(let i = 0 ; i < this._clewPussyPairs.length ; i++){
            let _cp = this._clewPussyPairs[i];
            for(let j = 0 ; j < _cp.collisions.length ; j++){
                if(_cp.collisions[j] <= borderOfTimeTraveling){
                    _cp.collisions.splice(0, j);
                    break;
                }
            }
            for(let j = 0 ; j < _cp.loopholes.length ; j++){
                if(_cp.loopholes[j] <= borderOfTimeTraveling){
                    _cp.loopholes.splice(0, j);
                    break;
                }
            }
        }
        for(let i = this._strikesLog.length - 1 ; i >= 0 ; i--){
            if(this._strikesLog[i].atModelTime <= borderOfTimeTraveling){
                this._strikesLog.splice(i, 1);
            }
        }
        for(let i = this._pawsLog.length - 1 ; i >= 0 ; i--){
            if(this._pawsLog[i].atModelTime <= borderOfTimeTraveling){
                this._pawsLog.splice(i, 1);
            }
        }
        for(let i = this._clewVectorDirFix.length - 1 ; i >= 0 ; i--){
            if(this._clewVectorDirFix[i].atModelTime <= borderOfTimeTraveling){
                this._clewVectorDirFix.splice(i, 1);
            }
        }
        for(let i = this._stateDumps.length - 1 ; i >= 0 ; i--){
            if(this._stateDumps[i].amt <= borderOfTimeTraveling){
                this._stateDumps.splice(i, 1);
            }
        }
        workoutPastDebt.call(this);
    }
    function workoutPastDebt(){
        var deepestDebt = Math.min(this.pussyA_PastDebt, this.pussyB_PastDebt);

        if(deepestDebt < modelTime){
            this._timeTravel(modelTime, deepestDebt);
        }
        this.pussyA_PastDebt = Number.POSITIVE_INFINITY;
        this.pussyB_PastDebt = Number.POSITIVE_INFINITY;

        workoutSpawn.call(this);
    }
    function workoutSpawn(){
        var difficulty = Math.min(modelTime / EACH_STEP_PER_MS / DIFFICULTY_EVERY_STEPS, MAX_DIFFICULTY),
            difficultyCoef = utils.accuracyLossDivide(difficulty, MAX_DIFFICULTY),
            clewSpawnCooldown = utils.accuracyLossAdd(CLEW_SPAWN_COOLDOWN_STEPS_RANGE[1], Math.ceil(utils.accuracyLossMultiply(1 - difficultyCoef, CLEW_SPAWN_COOLDOWN_STEPS_RANGE[0] - CLEW_SPAWN_COOLDOWN_STEPS_RANGE[1]))),
            maxClewOnBattleground = utils.accuracyLossAdd(MAX_CLEW_ON_BATTLEGROUND_RANGE[0], Math.ceil(utils.accuracyLossMultiply(difficultyCoef, MAX_CLEW_ON_BATTLEGROUND_RANGE[1] - MAX_CLEW_ON_BATTLEGROUND_RANGE[0])));

        if((modelTime > this.opts.clewSpawnPenalty || !this.opts.clewSpawnPenalty)
                && (!this.opts._debug || !this.opts._debug.noMoreClew || (this.opts._debug.noMoreClew && this._clew.length === 0))
                && (modelTime && (modelTime === EACH_STEP_PER_MS || modelTime % (EACH_STEP_PER_MS * clewSpawnCooldown) === 0))
                && this._clew.length < maxClewOnBattleground){
            _spawnClew.call(this, modelTime);
        }
        workoutBorderCollisions.call(this);
    }
    function workoutBorderCollisions(){
        for(let i = 0 ; i < this._clew.length ; i++){
            let _theClew = this._clew[i];
            if(!_theClew.getDestroyed(modelTime)){
                let _clewX = _theClew.getX(modelTime);
                if(_clewX < 0){
                    _theClew.destroyAt(modelTime);
                    if(!this._strikesLog.find(e => e.approximate(modelTime, _theClew.id, MAX_STEPS_TIME_TRAVEL))){
                        this._strikesLog.push(new _ErrorControlLog(modelTime, _theClew.id));
                        this.emit('strikeA', modelTime, _theClew.id);
                    }
                } else if(_clewX > SIZE_W){
                    _theClew.destroyAt(modelTime);
                    if(!this._strikesLog.find(e => e.approximate(modelTime, _theClew.id, MAX_STEPS_TIME_TRAVEL))){
                        this._strikesLog.push(new _ErrorControlLog(modelTime, _theClew.id));
                        this.emit('strikeB', modelTime, _theClew.id);
                    }
                } else {
                    let _clewNextY = _theClew.getY(modelTime + EACH_STEP_PER_MS);
                    if(_clewNextY < DEFAULT_CLEW_RADIUS || _clewNextY > SIZE_H - DEFAULT_CLEW_RADIUS){
                        _theClew.imposeVector(modelTime, _theClew.getCurrentDirection(modelTime) * -1);
                    }
                }
            }
        }
        workoutClewCollisions.call(this);
    }
    function workoutClewCollisions(){
        for(let i = 0 ; i < this._clewPairs.length ; i++){
            let _cpair = this._clewPairs[i];

            if(!_cpair.clew1.getDestroyed(modelTime) && !_cpair.clew2.getDestroyed(modelTime)){
                let x1 = _cpair.clew1.getX(modelTime),
                    y1 = _cpair.clew1.getY(modelTime),
                    x2 = _cpair.clew2.getX(modelTime),
                    y2 = _cpair.clew2.getY(modelTime),
                    distance = utils.accuracyLossDistance(x1, y1, x2, y2);

                if(distance <= DEFAULT_CLEW_RADIUS * 2 && _cpair.tryToCollide(modelTime)){
                    let [newDirection1, newDirection2] = utils.accuracyLossNewDirectionsFromCollision(x1, y1, x2, y2);
                    _cpair.clew1.imposeVector(modelTime, newDirection1);
                    _cpair.clew2.imposeVector(modelTime, newDirection2);
                    this._clewPussyPairs.find(e => e.clew === _cpair.clew1).imposeLoophole(modelTime);
                    this._clewPussyPairs.find(e => e.clew === _cpair.clew2).imposeLoophole(modelTime);
                }
            }
        }
        workoutPussyCollisions.call(this);
    }
    function workoutPussyCollisions(){
        var pussyA_position,
            pussyB_position;

        for(let i = 0 ; i < this.pussyA_positionData.length ; i++){
            if(this.pussyA_positionData[i].atModelTime === modelTime){
                pussyA_position = this.pussyA_positionData[i];
                break;
            }
        }
        for(let i = 0 ; i < this.pussyB_positionData.length ; i++){
            if(this.pussyB_positionData[i].atModelTime === modelTime){
                pussyB_position = this.pussyB_positionData[i];
                break;
            }
        }
        for(let i = 0 ; i < this._clewPussyPairs.length ; i++){
            let _pair = this._clewPussyPairs[i],
                pussyPosition = _pair.isPussyA ? pussyA_position : pussyB_position;
            if(!_pair.clew.getDestroyed(modelTime) && _pair.checkPosbToCollide(modelTime) && pussyPosition){
                let _clewX = _pair.clew.getX(modelTime),
                    _clewY = _pair.clew.getY(modelTime);
                if(((_pair.isPussyA && _clewX < SIZE_W / 2) || (!_pair.isPussyA && _clewX > SIZE_W / 2))
                        && utils.accuracyLossDistance(_clewX, _clewY, pussyPosition.x, pussyPosition.y) <= DEFAULT_CLEW_RADIUS + DEFAULT_PUSSY_RADIUS){
                    _pair.doCollide(modelTime);
                    return _collideClewWithPussy.call(this, modelTime, _pair.clew, pussyPosition, _pair.isPussyA);
                }
            }
        }
    }

    if(!this._checkCurrentlyAtPause(modelTime)){
        workoutOutOfTimeTravelFrame.call(this);
    }
}

function _spawnClew(modelTime){
    var rSeedForNewClew = utils.MTR_Between(this.opts.rSeed, this.mtRandomCounter++, 1),
        newClew = new _TheClew(modelTime, DEFAULT_CLEW_X, DEFAULT_CLEW_Y, rSeedForNewClew, this);

    for(let i = 0 ; i < this._clew.length ; i++){
        this._clewPairs.push(new _ClewPair(this._clew[i], newClew, this));
    }
    this._clewPussyPairs.push(new _ClewPussyPair(newClew, true, this), new _ClewPussyPair(newClew, false, this));
    this._clew.push(newClew);

    var _initialDirection = utils.MTR_Between(
        rSeedForNewClew, 1,
        -90 - (CLEW_EXPANSION_ANGLE / 2),
        -90 + (CLEW_EXPANSION_ANGLE / 2)
    );
    newClew.imposeVector(modelTime, utils.accuracyLossDegreesToRads(_initialDirection));
    this.emit('clewSpawn');
}

function _collideClewWithPussy(modelTime, theClew, pussyPosition, pussyIsA){
    var clewX = theClew.getX(modelTime),
        clewY = theClew.getY(modelTime),
        _cvf, newDirection;

    if(theClew.getHP(modelTime) === 1){
        theClew.destroyAt(modelTime);
        this.emit('clewBurst', clewX, clewY);
    } else {
        for(let i = this._clewVectorDirFix.length - 1 ; i >= 0 ; i--){
            _cvf = this._clewVectorDirFix[i];
            if(_cvf.atModelTime === modelTime && _cvf.clewId === theClew.id){
                newDirection = _cvf.theDirection;
            }
            if(_cvf.atModelTime >= modelTime){
                break;
            }
        }
        if(newDirection == null){
            _cvf = null;
            newDirection = utils.accuracyLossNewDirectionsFromCollision(clewX, clewY, pussyPosition.x, pussyPosition.y)[0];
        }

        theClew.imposeVector(modelTime, newDirection, true);
    }

    if(!this._pawsLog.find(e => e.approximate(modelTime, theClew.id, PAW_ERROR_CONTROL_STEPS_FRAME))){
        this._pawsLog.push(new _ErrorControlLog(modelTime, theClew.id));
        if(!_cvf){
            this.emit('pussyCollision', pussyIsA, modelTime, pussyPosition.y, theClew.id, newDirection);
        } else {
            this.emit('pussyCollision', pussyIsA, modelTime, pussyPosition.y);
        }
    }
}

class _TheClew{
    constructor(atModelTime, initialX, initialY, rSeed, theModel){
        this.id = crc32(`${atModelTime}-${rSeed}`).toString(16);
        this.initialX = initialX;
        this.initialY = initialY;
        this.theModel = function(){ return theModel };

        this.vectors = [];
        this.destroyedAtTime = null;
    }
    imposeVector(atModelTime, newDirection, minusHp, _debugX, _debugY){
        if(this.vectors.length && this.vectors[this.vectors.length - 1].cat > atModelTime){
            throw new Error('Trying to impose vector of incorrect time');
        }
        this.vectors.push(new _TheClewVector(
            atModelTime,
            _debugX || this.getX(atModelTime), _debugY || this.getY(atModelTime), newDirection, minusHp
        ));
    }
    rollbackHistory(toModelTime){
        for(let i = this.vectors.length - 1 ; i >= 0 ; i--){
            if(this.vectors[i].cat >= toModelTime){
                this.vectors.splice(i, 1);
            }
        }
        if(this.destroyedAtTime !== null && this.destroyedAtTime >= toModelTime){
            this.destroyedAtTime = null;
        }
        return (this.vectors.length > 0);
    }
    destroyAt(modelTime){
        if(this.destroyedAtTime !== null && this.destroyedAtTime <= modelTime){
            throw new Error('Trying to destroy already destroyed clew');
        }
        this.destroyedAtTime = modelTime;
    }
    getX(atModelTime){
        if(this.vectors.length){
            let appropVector;
            for(let i = this.vectors.length - 1 ; i >= 0 ; i--){
                if(this.vectors[i].cat <= atModelTime){
                    appropVector = this.vectors[i];
                    break;
                }
            }

            if(!appropVector){
                return null;
            }

            let _passedDistance = utils.accuracyLossMultiply(this.theModel()._passedTimeConsideringPauses(appropVector.cat, atModelTime) / EACH_STEP_PER_MS, DEFAULT_CLEW_SPEED_PER_STEP),
                _passedX = utils.accuracyLossMultiply(_passedDistance, appropVector.vectorX_unit);

            return Math.floor(utils.accuracyLossAdd(appropVector.x, _passedX));
        } else {
            return this.initialX;
        }
    }
    getY(atModelTime){
        if(this.vectors.length){
            let appropVector;
            for(let i = this.vectors.length - 1 ; i >= 0 ; i--){
                let _v = this.vectors[i];
                if(_v.cat <= atModelTime){
                    appropVector = _v;
                    break;
                }
            }

            if(!appropVector){
                return null;
            }

            let _passedDistance = utils.accuracyLossMultiply(this.theModel()._passedTimeConsideringPauses(appropVector.cat, atModelTime) / EACH_STEP_PER_MS, DEFAULT_CLEW_SPEED_PER_STEP),
                _passedY = utils.accuracyLossMultiply(_passedDistance, appropVector.vectorY_unit);

            return Math.floor(utils.accuracyLossAdd(appropVector.y, _passedY));
        } else {
            return this.initialY;
        }
    }
    getCurrentDirection(atModelTime){
        for(let i = this.vectors.length - 1; i >= 0 ; i--){
            if(this.vectors[i].cat <= atModelTime){
                return this.vectors[i].direction;
            }
        }
        return null;
    }
    getHP(atModelTime){
        return DEFAULT_CLEW_HP - this.vectors
            .filter(e => e.cat <= atModelTime)
            .map(e => e.minusHp)
            .reduce((a, b) => a + b, 0);
    }
    getDestroyed(atModelTime){
        if(this.destroyedAtTime == null){
            return false;
        } else {
            return (this.destroyedAtTime <= atModelTime);
        }
    }
}
class _TheClewVector{
    constructor(cat, x, y, direction, minusHp){
        this.cat = cat;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.minusHp = +!!minusHp;
        [this.vectorX_unit, this.vectorY_unit] = utils.accuracyLossVectorXY(direction);
    }
}
class _ClewPair{
    constructor(clew1, clew2, theModel){
        this.clew1 = clew1;
        this.clew2 = clew2;
        this.theModel = () => theModel;

        this.collisions = [];
    }
    rollback(toModelTime){
        for(let i = this.collisions.length - 1 ; i >= 0 ; i--){
            if(this.collisions[i] >= toModelTime){
                this.collisions.splice(i, 1);
            }
        }
    }
    tryToCollide(atModelTime){
        if(this.collisions.length === 0){
            this.collisions.push(atModelTime);
            return true;
        } else {
            let _lcol = this.collisions[this.collisions.length - 1];
            if(_lcol > atModelTime){
                throw new Error('Colliding at inappropriate time');
            } else if(this.theModel()._passedTimeConsideringPauses(_lcol, atModelTime) >= DEFAULT_CLEW_COLLISION_COOLDOWN_STEPS * EACH_STEP_PER_MS){
                this.collisions.push(atModelTime);
                return true;
            } else {
                return false;
            }
        }
    }
}
class _ClewPussyPair{
    constructor(clew, isPussyA, theModel){
        this.clew = clew;
        this.isPussyA = isPussyA;
        this.theModel = () => theModel;

        this.collisions = [];
        this.loopholes = [];
    }
    rollback(toModelTime){
        for(let i = this.collisions.length - 1 ; i >= 0 ; i--){
            if(this.collisions[i] >= toModelTime){
                this.collisions.splice(i, 1);
            }
        }
        for(let i = this.loopholes.length - 1 ; i >= 0 ; i--){
            if(this.loopholes[i] >= toModelTime){
                this.loopholes.splice(i, 1);
            }
        }
    }
    checkPosbToCollide(atModelTime){
        if(this.collisions.length === 0){
            return true;
        } else {
            let _lcol = this.collisions[this.collisions.length - 1];
            if(_lcol > atModelTime){
                throw new Error('Colliding at inappropriate time');
            } else if(this.theModel()._passedTimeConsideringPauses(_lcol, atModelTime) >= DEFAULT_PUSSY_COLLISION_COOLDOWN_STEPS * EACH_STEP_PER_MS){
                return true;
            } else if(this.loopholes.length){
                let _lh = this.loopholes[this.loopholes.length - 1];
                return (_lh >= _lcol) && this.theModel()._passedTimeConsideringPauses(_lh, atModelTime) <= EACH_STEP_PER_MS * LOOPHOLE_STEPS;
            } else {
                return false;
            }
        }
    }
    doCollide(atModelTime){
        this.collisions.push(atModelTime);
    }
    imposeLoophole(atModelTime){
        this.loopholes.push(atModelTime);
    }
}
class _ThePussyPositionData{
    constructor(atModelTime, x, y){
        this.atModelTime = atModelTime;
        this.x = x;
        this.y = y;
    }
}
class _ErrorControlLog{
    constructor(atModelTime, clewId){
        this.atModelTime = atModelTime;
        this.clewId = clewId;
    }
    approximate(atModelTime, clewId, inSteps){
        if(clewId !== this.clewId){
            return false;
        }
        return (atModelTime >= this.atModelTime - EACH_STEP_PER_MS * inSteps / 2
            && atModelTime <= this.atModelTime + EACH_STEP_PER_MS * inSteps / 2);
    }
}
class _TheClewVectorDirectionFix{
    constructor(atModelTime, clewId, theDirection){
        this.atModelTime = atModelTime;
        this.clewId = clewId;
        this.theDirection = theDirection;
    }
}

module.exports = {
    DeterministicPong,

    SIZE_W,
    SIZE_H,
    DEFAULT_CLEW_RADIUS,
    DEFAULT_PUSSY_RADIUS,
    DEFAULT_PUSSY_PROTRUSION_PERC
};
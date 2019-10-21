// #############################
require('babel-polyfill'); // ##
// #############################

'use strict';

const TIME_DIFF_PROBES = 10,
    TIME_SECONDS_TO_MATCHMAKE = 15;

var EventEmitter = require('phaser').Events.EventEmitter;

var faker = require('faker'),
    GbaseApi = require('gbase-html5-sdk').Gbase.GbaseApi,
    GbaseRangePicker = require('gbase-html5-sdk').Gbase.GbaseRangePicker;

var utils = require('./utils/utils.js');

var proj, env, hmac,
    targetVersion, targetPlatform,
    overrideAddress;

var singletonController;

function configure(_proj, _env, _hmac, _targetVersion, _targetPlatform, _overrideAddress){
    proj = _proj;
    env = _env;
    hmac = _hmac;
    targetVersion = _targetVersion;
    targetPlatform = _targetPlatform;
    overrideAddress = _overrideAddress;
}
function getOrCreate(){
    if(!singletonController){
        singletonController = new ControllerHowardResponsibleForNetworking(
            proj, env, hmac, targetVersion, targetPlatform, overrideAddress
        );
    }
    return singletonController;
}

class ControllerHowardResponsibleForNetworking{
    constructor(proj, env, hmac, targetVersion, targetPlatform, overrideAddress){
        if(overrideAddress){
            this.gbaseApi = new GbaseApi(null, null, hmac, targetVersion, targetPlatform, overrideAddress);
        } else {
            this.gbaseApi = new GbaseApi(proj, env, hmac, targetVersion, targetPlatform);
        }
        this.gbaseApi.on('logout', () => console.log('You\'re AFK'));
        this._currentPvp = null;

        this._myName = null;
        this._tdiff = 0;
    }
    inputBeenDone(){
        if(this.gbaseApi){
            this.gbaseApi.userInputBeenDone();
        }
    }
    get currentPvp(){
        return this._currentPvp;
    }
    get myName(){
        return this._myName;
    }
    get timeDiff(){
        return this._tdiff;
    }
    async enter(){
        if(!this.gbaseApi.currentAccount){
            try{
                await this.gbaseApi.account.signinGbase();
            } catch(__){
                await this.gbaseApi.account.signupGbaseAnon();
            }
            if(!this.gbaseApi.currentAccount.haveProfile){
                await this.gbaseApi.profile.create();
            } else {
                await this.gbaseApi.profile.getp();
            }
            if(!this.gbaseApi.currentProfile.publicProfileData || !this.gbaseApi.currentProfile.publicProfileData.myNameIs){
                await this.gbaseApi.profile.update(
                    null,
                    { myNameIs: Math.round(Math.random()) ? `${faker.name.firstName()} ${faker.name.lastName()}` : faker.internet.userName() },
                    null, null, null, null
                );
            }
            this._myName = this.gbaseApi.currentProfile.publicProfileData.myNameIs;
            await this._measureTimeDiff();
        }
    }
    async _measureTimeDiff(){
        if(this.gbaseApi.currentAccount){
            let _tdprobes = [];

            for(let i = 0 ; i < TIME_DIFF_PROBES ; i++){
                let _ts1 = Date.now(),
                    _stime = await this.gbaseApi.utils.getServerTime(),
                    _halfPing = Math.round((Date.now() - _ts1) / 2);
                if(!_stime.ok){
                    throw new Error('Unsuccessful');
                }
                _tdprobes.push((_ts1 + _halfPing) - _stime.details.originalResponse);
            }

            this._tdiff = utils.getTheMedian(_tdprobes);
        }
    }
    async beginGameplay(){
        if(this.currentPvp){
            throw new Error('Already playing');
        }
        try{
            await this.gbaseApi.pvp.dropMatchmaking();
            let pvpResp;
            try{
                pvpResp = await this.gbaseApi.pvp.withOpponent(
                    undefined, GbaseApi.MATCHMAKING_STRATEGIES.BY_RATING,
                    new GbaseRangePicker('any').range(GbaseRangePicker.POSITIVE_INFINITY, GbaseRangePicker.NEGATIVE_INFINITY),
                    TIME_SECONDS_TO_MATCHMAKE
                );
            } catch(err){
                if(err.code === 3){
                    await this.gbaseApi.leaderboards.postRecord(0);
                    return await this.beginGameplay();
                }
            }
            if(pvpResp.ok){
                this._currentPvp = new PvpWrapper(pvpResp.details.pvp, this.myName);
                this._currentPvp.once('finish', () => this._currentPvp = null);
            } else {
                console.log(pvpResp.details.originalResponse);
            }
        } catch(err){
            if(err.code === 143 || err.code === 23 || (err.details && err.details.originalStatus === 401)){
                await this.gbaseApi.account.reAuth();
                await this.gbaseApi.profile.getp();
                return await this.beginGameplay();
            }
        }
    }
    async getWorldRankAndScore(gainedScore){
        try{
            let rankResp = await this.gbaseApi.leaderboards.getSelfRecord();
            if(gainedScore && rankResp.ok && rankResp.details.originalResponse){
                await this.gbaseApi.leaderboards.postRecord(rankResp.details.originalResponse.rec + gainedScore);
            }
            return rankResp.details.originalStatus === 404
                ? [0, gainedScore]
                : [rankResp.details.originalResponse.rank, rankResp.details.originalResponse.rec + gainedScore];
        } catch(err){
            if(err.code === 68 || (err.details && err.details.originalStatus === 401)){
                await this.gbaseApi.account.reAuth();
                await this.gbaseApi.profile.getp();
                return await this.getWorldRankAndScore(gainedScore);
            }
        }
    }
    fire(){
        console.log('Howard: ;-(');
    }
}

class PvpWrapper extends EventEmitter{
    constructor(pvpInstance, myName){
        super();
        this.pvpInstance = pvpInstance;

        this.gameIsOverRem = false;

        this.pvpInstance.on('begin', () => this.emit(
            'begin',
            this.pvpInstance.startTimestamp, this.pvpInstance.randomSeed,
            this.pvpInstance.meIsPlayerA, this.pvpInstance.opponentPayload.aPayload.myName
        ));
        this.pvpInstance.on('turn-message', msg => this.emit('message', msg, false));
        this.pvpInstance.on('direct-message', msg => this.emit('message', msg, true));
        this.pvpInstance.on('finish', () => this.emit('finish'));

        this.pvpInstance.on('paused', (__, fromTs) =>
            this.emit('paused', fromTs || (Date.now() - singletonController.timeDiff + Math.round(this.pvpInstance.myPing / 2))));
        this.pvpInstance.on('unpaused', (__, fromTs, toTs) => {
            this.emit('unpaused', fromTs, toTs);
            if(this.gameIsOverRem){
                this.gameIsOverRem = false;
                this.pvpInstance.sendTurn({ gov: 1 });
            }
        });

        this.pvpInstance.doConnect({ myName });
    }
    hertzMessage(theMessage){
        if(!this.pvpInstance.isPaused){
            this.pvpInstance.sendDirect(theMessage);
        }
    }
    sendGameover(){
        if(!this.pvpInstance.isPaused){
            this.pvpInstance.sendTurn({ gov: 1 });
        } else {
            this.gameIsOverRem = true;
        }
    }
    pause(){
        this.pvpInstance.forceDisconnect();
    }
    resume(){
        this.pvpInstance.reconnect();
    }
    get isPaused(){
        return this.pvpInstance.isPaused;
    }
}

module.exports = {
    configure,
    getOrCreate
};
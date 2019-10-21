'use strict';

module.exports = {
    accuracyLossDivide,
    accuracyLossMultiply,
    accuracyLossDegreesToRads,
    accuracyLossVectorXY,
    accuracyLossAdd,
    accuracyLossDistance,
    accuracyLossNewDirectionsFromCollision,
    MTR_Between
};

const UINT_32_MAX_VALUE = 4294967295;

var Decimal = require('decimal.js'),
    MersenneTwister = require('mersennetwister');

function accuracyLossDivide(x, y){
    return toFixedAccuracyLoss(Decimal.div(x, y));
}
function accuracyLossMultiply(x, y){
    return toFixedAccuracyLoss(Decimal.mul(x, y));
}
function accuracyLossDegreesToRads(dg){
    return toFixedAccuracyLoss(Decimal.div(accuracyLossPI(), 180).mul(dg));
}
function accuracyLossVectorXY(directionRad){
    var vectorX = toFixedAccuracyLoss(Decimal.cos(directionRad)),
        vectorY = toFixedAccuracyLoss(Decimal.sin(directionRad));

    return [vectorX, vectorY];
}
function accuracyLossAdd(x, y){
    return toFixedAccuracyLoss(Decimal.add(x, y));
}
function accuracyLossDistance(x1, y1, x2, y2){
    var x = Decimal.sub(x2, x1),
        y = Decimal.sub(y2, y1),
        hypoSqr = Decimal.add(Decimal.pow(x, 2), Decimal.pow(y, 2));

    return toFixedAccuracyLoss(Decimal.sqrt(hypoSqr));
}
function accuracyLossNewDirectionsFromCollision(x1, y1, x2, y2){
    var direction2_Rad = Decimal.atan2(y2 - y1, x2 - x1),
        direction1_Rad = Decimal.add(direction2_Rad, accuracyLossPI());
    var direction1_Deg = Decimal.div(180, accuracyLossPI()).mul(direction1_Rad),
        direction2_Deg = Decimal.div(180, accuracyLossPI()).mul(direction2_Rad);

    function interProcessDeg(deg){
        deg = deg.round().toNumber();

        if(Math.abs(deg) === 90){
            deg += 2;
        }

        if(deg > 180){
            return (180 - (deg - 180)) * -1
        } else if(deg < -180){
            return (180 + (deg + 180))
        } else {
            return deg;
        }
    }

    return [
        accuracyLossDegreesToRads(interProcessDeg(direction1_Deg)),
        accuracyLossDegreesToRads(interProcessDeg(direction2_Deg))
    ];
}
function accuracyLossPI(){
    return 3.141593;
}
function toFixedAccuracyLoss(x){
    if(x instanceof Decimal){
        return +x.toFixed(3, Decimal.ROUND_DOWN);
    } else {
        return +x.toFixed(3);
    }
}
function RandomNextUInt(initSeed, counter){
    var mt = new MersenneTwister(initSeed);

    for(let i = 0 ; i < counter ; i++){
        mt.int();
    }

    return mt.int();
}
function MTR_Between(initSeed, counter, from, to=UINT_32_MAX_VALUE){
    var theUint = RandomNextUInt(initSeed, counter),
        ratio = toFixedAccuracyLoss(Decimal.div(theUint, UINT_32_MAX_VALUE)),
        bar = toFixedAccuracyLoss(Decimal.mul(ratio, to - from));

    return from + Decimal.round(bar).toNumber();
}
'use strict';

module.exports = {
    getTheDistance
};

function getTheDistance(fromX, fromY, toX, toY){
    return Math.sqrt((fromX - toX) * (fromX - toX) + (fromY - toY) * (fromY - toY));
}
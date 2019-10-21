'use strict';

module.exports = {
    getTheMedian
};

function getTheMedian(values){
    if(!values.length){
        return 0;
    }

    values.sort((a, b) => a - b);

    var half = Math.floor(values.length / 2);

    return (values.length % 2)
        ? values[half]
        : Math.round((values[half - 1] + values[half]) / 2.0);
}
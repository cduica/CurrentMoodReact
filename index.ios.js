import React from 'react';
import { AppRegistry } from 'react-native';

import CurrentMood from './CurrentMood';

AppRegistry.registerComponent('CurrentMood', () => CurrentMood);


if (typeof process === 'undefined') process = {};
process.nextTick = setImmediate;

module.exports = process;

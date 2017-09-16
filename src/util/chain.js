import {makeGenesisBlock, isBlockValid, isDataValid} from './block';
import fs from 'fs';

export function loadChain () {
    if (! fs.existsSync('chain.json')) {
        return [makeGenesisBlock()];
    }

    return JSON.parse(fs.readFileSync('chain.json'));
}

export function saveChain (chain) {
    fs.writeFileSync('chain.json', JSON.stringify(chain));
}

export function isChainValid (chain, difficulty) {
    for (let i = 1; i < chain.length; i++) {
        if (! isBlockValid(chain[i - 1], chain[i], difficulty)) {
            return false;
        }
    }

    return true;
}

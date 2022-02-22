
import { _decorator, Component, Node, math } from 'cc';
const { ccclass, property } = _decorator;

export class Random {
    private static _seed:number;

    public static seed(s:number) {
        this._seed = s;
    }

    public static rands() {
        var r = math.pseudoRandom(this._seed);
        this._seed = r * 0x7fffffffffffffff;
        return r;
    }

    public static randomRangeInt(min:number, max:number) {
        return Math.floor(min + this.rands() * (max - min));
    }
}


import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

export class BagItemData {
    public Id:number;
    public GenTime:number;
    public Durability:number;
}

export class BagData {
    public Items:Array<BagItemData>;
}

export class HeroData {
    public Rank:Number;
    public Level:Number;
    public Class:Number;
    public MaxBagItem:number;
    public Bag:BagData;
}

export class PlayerData {
    public Heros:Array<HeroData>;
}

export class Player {
    private _data : PlayerData;
}


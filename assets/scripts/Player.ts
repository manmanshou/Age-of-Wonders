
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

    public static New() {
        var playerData = new PlayerData();
        playerData.Heros = new Array<HeroData>();
        var heroData =  new HeroData();
        heroData.Rank = 0;
        heroData.Level = 1;
        heroData.MaxBagItem = 20;
        playerData.Heros.push(heroData);
        return playerData;
    }
}

export class Player {
    private _data : PlayerData;
}


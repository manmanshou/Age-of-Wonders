
import { _decorator, Component, Node, Vec2 } from 'cc';
import { MapHero } from './MapHero';
const { ccclass, property } = _decorator;

export enum ClassDefine
{
    Human,          //人类
    Elf,            //精灵
    Dewarf,         //矮人
}

export enum SexDefine
{
    Male,
    Famale,
}

export enum CareerDefine
{
    Barbarian,      //野蛮人 0
    Bard,           //吟游诗人 1
    Cleric,         //牧师 2 
    Druid,          //德鲁伊 3
    Fighter,        //战士 4
    Paladin,        //圣骑士 5
    Monk,           //僧侣 6
    Ranger,         //游侠 7
    Rouge,          //盗贼 8
    Mage,           //法师 9
    Warlock,        //术士 10
}

export class BagItemData {
    public Id:number;
    public GenTime:number;
    public Durability:number;
}

export class BagData {
    public Items:Array<BagItemData>;
}

export class HeroData {
    public Rank:number;
    public Level:number;
    public Class:number;
    public MaxBagItem:number;
    public Bag:BagData;
    public Name:string;
}

export class PlayerData {
    public Heros:Array<HeroData>;

    public static New() {
        var playerData = new PlayerData();
        playerData.Heros = new Array<HeroData>();
        var heroData =  new HeroData();
        heroData.Rank = 0;
        heroData.Level = 1;
        heroData.Class = 0;
        heroData.MaxBagItem = 20;
        heroData.Name = "NewHero";
        playerData.Heros.push(heroData);
        return playerData;
    }
}

export class Player {
    private _data : PlayerData;

    private _heros : Array<MapHero> = new Array<MapHero>();

    constructor(data:PlayerData) {
        this._data = data;

        this._data.Heros.forEach(heroData => {
            var hero = new MapHero(heroData);
            this._heros.push(hero);
        });
    }

    public enterScene(posGrid:Vec2, parentNode:Node) {
        this._heros.forEach(hero => {
            hero.enterScene(posGrid, parentNode);
        })
    }
}


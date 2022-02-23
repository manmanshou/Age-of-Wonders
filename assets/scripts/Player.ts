
import { _decorator, Component, Node, Vec2, Vec3 } from 'cc';
import { GameMap } from './GameMap';
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
    public ID:number;
    public Rank:number;
    public Level:number;
    public Class:number;
    public MaxBagItem:number;
    public Bag:BagData;
    public Name:string;
    public ViewRange:number;
}

export class PlayerData {
    public Heros:Array<HeroData>;

    public static New() {
        var playerData = new PlayerData();
        playerData.Heros = new Array<HeroData>();
        var heroData =  new HeroData();
        heroData.ID = 0;
        heroData.Rank = 0;
        heroData.Level = 1;
        heroData.Class = 0;
        heroData.MaxBagItem = 20;
        heroData.Name = "NewHero";
        heroData.ViewRange = 2;
        playerData.Heros.push(heroData);
        return playerData;
    }
}

export class Player {
    private _data : PlayerData;

    private _heros : Map<number, MapHero>;

    public CurHero : MapHero;

    constructor(data:PlayerData) {
        this._data = data;
        this._heros = new Map<number, MapHero>();
        this._data.Heros.forEach(heroData => {
            var hero = new MapHero(heroData);
            this._heros.set(heroData.ID, hero);
        });
        this.CurHero = this._heros.get(0);
    }

    public enterScene(posGrid:Vec2, parentNode:Node) {
        this._heros.forEach(hero => {
            hero.enterScene(posGrid, parentNode);
        })
        this.setCameraToCurHero();
    }

    public setCameraToCurHero() {
        var hero = this.CurHero;
        var pos = new Vec2(hero.Node.position.x, hero.Node.position.y);
        GameMap.Instance.setCameraPos(pos);
        GameMap.Instance.exploreRange(this.CurHero.PosGrid, this.CurHero.getViewRange());
    }
}


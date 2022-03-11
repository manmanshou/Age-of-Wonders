
import { _decorator, Component, Node, SpriteFrame, resources, loader, assetManager } from 'cc';
const { ccclass, property } = _decorator;

export class ResManager {

    public WorldAssets:SpriteFrame[];

    public HeroClassAssets:Map<string, SpriteFrame> = new Map<string, SpriteFrame>();

    public MapObjectAssets:Map<string, SpriteFrame> = new Map<string, SpriteFrame>();

    private static _instance:ResManager;
    public static get Instance() {
        if (ResManager._instance == null) {
            ResManager._instance = new ResManager();
        }
        return ResManager._instance;
    }

    private static assetSortFunction(a:SpriteFrame, b:SpriteFrame) {
        var aN = Number(a.name);
        var bN = Number(b.name);
        return aN - bN;
    }

    public loadWorldAssets(style:string, callback:Function) {
        var resManager = this;
        resources.loadDir("scene/spriteFrame/world/" + style, SpriteFrame, function (err, assets) {
            resManager.WorldAssets = assets;
            resManager.WorldAssets.sort(ResManager.assetSortFunction);
            callback();
        });
    }

    public loadHeroAssets(callback:Function) {
        var resManager = this;
        resources.loadDir("scene/spriteFrame/hero", SpriteFrame, function(err, assets) {
            assets.forEach(sprFrame => {
                resManager.HeroClassAssets[sprFrame.name] = sprFrame;
            });
            callback();
        });
    }

    public loadMapObjectAssets(callback:Function) {
        var resManager = this;
        resources.loadDir("scene/spriteFrame/dynamicObj", SpriteFrame, function(err, assets) {
            assets.forEach(sprFrame => {
                resManager.MapObjectAssets[sprFrame.name] = sprFrame;
            });
            callback();
        });
    }

    public getHeroSpr(heroClass:number, heroSex:number, heroRank:number) {
        var key = Number(heroClass) + "_" + Number(heroSex) + "_" + Number(heroRank);
        return this.HeroClassAssets[key];
    }

    public getMapObjectSpr(type:number, state:number) {
        var key = Number(type) + "_" + Number(state);
        return this.MapObjectAssets[key];
    }
}



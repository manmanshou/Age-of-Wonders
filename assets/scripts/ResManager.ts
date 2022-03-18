
import { _decorator, Component, Node, SpriteFrame, resources, loader, assetManager } from 'cc';
const { ccclass, property } = _decorator;


export class ResManager {

    public WorldAssets:SpriteFrame[];

    private _assetBin:Map<string, Map<string, SpriteFrame>>;
    private _baseLoadIdx:number;
    private _baseLoadList:Array<string>;
    private _baseLoadCallback:Function;

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

    private continueLoadBaseAsset() {
        var resMan = this;
        var set = new Map<string, SpriteFrame>();
        resources.loadDir(this._baseLoadList[this._baseLoadIdx * 2 + 1], SpriteFrame, function(err, assets) {
            assets.forEach(sprFrame => {
                set[sprFrame.name] = sprFrame;
            });
            resMan._assetBin[resMan._baseLoadList[resMan._baseLoadIdx * 2]] = set;
            resMan._baseLoadIdx++;
            if (resMan._baseLoadIdx == resMan._baseLoadList.length / 2) {
                resMan._baseLoadCallback();
            }else{
                resMan.continueLoadBaseAsset();
            }
        });
    }

    public loadBaseAssets(callback:Function) {
        this._baseLoadList = [
            "hero", "scene/spriteFrame/hero",
            "ui", "ui", 
            "mapObj", "scene/spriteFrame/dynamicObj",
            "npc", "scene/spriteFrame/npc"
        ];
        this._assetBin = new Map<string, Map<string, SpriteFrame>>();
        this._baseLoadIdx = 0;
        this._baseLoadCallback = callback;
        this.continueLoadBaseAsset();
    }

    public loadWorldAssets(style:string, callback:Function) {
        var resManager = this;
        resources.loadDir("scene/spriteFrame/world/" + style, SpriteFrame, function (err, assets) {
            resManager.WorldAssets = assets;
            resManager.WorldAssets.sort(ResManager.assetSortFunction);
            callback();
        });
    }

    public getHeroSpr(heroClass:number, heroSex:number, heroRank:number) {
        var key = Number(heroClass) + "_" + Number(heroSex) + "_" + Number(heroRank);
        return this._assetBin["hero"][key];
    }

    public getMapObjectSpr(type:number, state:number) {
        var key = Number(type) + "_" + Number(state);
        return this._assetBin["mapObj"][key];
    }

    public getUISpr(name:string) {
        return this._assetBin["ui"][name];
    }

    public getNPCSpr(name:string) {
        return this._assetBin["npc"][name];
    }
}



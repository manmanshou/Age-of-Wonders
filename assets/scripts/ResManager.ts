
import { _decorator, Component, Node, SpriteFrame, resources } from 'cc';
const { ccclass, property } = _decorator;

export class ResManager {

    public WorldAssets:SpriteFrame[];

    public HeroClassAssets:SpriteFrame[];

    private static _instance:ResManager;
    public static get Instance() {
        if (ResManager._instance == null) {
            ResManager._instance = new ResManager();
        }
        return ResManager._instance;
    }

    public loadWorldAssets(style:string, callback:Function) {
        var resManager = this;
        resources.loadDir("scene/spriteFrame/world/" + style, SpriteFrame, function (err, assets) {
            resManager.WorldAssets = assets;
            resManager.WorldAssets.sort(function(a:SpriteFrame, b:SpriteFrame) {
                var aN = Number(a.name);
                var bN = Number(b.name);
                return aN - bN;
            });
            callback();
        });
    }

    public loadHeroAssets() {

    }
}



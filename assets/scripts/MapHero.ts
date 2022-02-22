
import { _decorator, Component, Node, Vec2, Vec3, Sprite, UITransform } from 'cc';
import { GRID_SIZE } from './MapGenerator';
import { HeroData } from './Player';
import { ResManager } from './ResManager';

export class MapHero {
    private _data:HeroData;
    private _pos:Vec2;
    private _node:Node; //英雄节点

    constructor(data:HeroData) {
        this._data = data;
    }

    public enterScene(posGrid:Vec2, parentNode:Node) {
        if (this._node != null)
            return;
        var node = new Node(this._data.Name);
        node.parent = parentNode;
        node.position = new Vec3(posGrid.x * GRID_SIZE, posGrid.y * GRID_SIZE, 0);
        var spr = node.addComponent(Sprite);
        spr.spriteFrame = ResManager.Instance.getHeroSpr(this._data.Class, 0, this._data.Rank);
        var trans = node.addComponent(UITransform);
        trans.setAnchorPoint(0, 0);
        trans.setContentSize(GRID_SIZE, GRID_SIZE);
    }
}



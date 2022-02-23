
import { _decorator, Component, Node, Vec2, Vec3, Sprite, UITransform } from 'cc';
import { GameMap } from './GameMap';
import { GRID_SIZE } from './MapGenerator';
import { HeroData } from './Player';
import { ResManager } from './ResManager';

export class MapHero {
    private _data:HeroData;
    public PosGrid:Vec2;
    public Node:Node; //英雄节点

    constructor(data:HeroData) {
        this._data = data;
    }

    public enterScene(posGrid:Vec2, parentNode:Node) {
        if (this.Node == null) {
            var node = new Node(this._data.Name);
            node.parent = parentNode;
            this.Node = node;
            node.addComponent(Sprite);
        }
        this.moveTo(posGrid);
    }

    public moveTo(posGrid:Vec2) {
        this.PosGrid = posGrid;
        this.Node.position = new Vec3(posGrid.x * GRID_SIZE, posGrid.y * GRID_SIZE, 0);
        var spr = this.Node.getComponent(Sprite)
        spr.spriteFrame = ResManager.Instance.getHeroSpr(this._data.Class, 0, this._data.Rank);
        var trans = this.Node.addComponent(UITransform);
        trans.setAnchorPoint(0, 0);
        trans.setContentSize(GRID_SIZE, GRID_SIZE);
    }

    public getViewRange() {
        return this._data.ViewRange;
    }
}



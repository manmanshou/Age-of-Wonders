
import { _decorator, Component, Node, Vec2, Sprite, UITransform, Vec3 } from 'cc';
import { GRID_SIZE, HALF_GRID_SIZE } from './MapGenerator';
import { ResManager } from './ResManager';
const { ccclass, property } = _decorator;

class NPCData {
    Name:string;
    IsFriendly:boolean;
    Health:number = 1;
    Scale:number = 1;
}

export class MapNPC {
    _data:NPCData;
    Node:Node;
    PosGrid:Vec2;

    constructor(data:NPCData) {
        this._data = data;
    }

    public enterScene(posGrid:Vec2, parentNode:Node) {
        if (this.Node == null) {
            var node = new Node(this._data.Name);
            node.parent = parentNode;
            this.Node = node;
            var spr = node.addComponent(Sprite);
            spr.spriteFrame = ResManager.Instance.getNPCSpr(this._data.Name);
            var trans = this.Node.getComponent(UITransform);
            trans.setContentSize(GRID_SIZE * this._data.Scale, GRID_SIZE * this._data.Scale);
        }
        var targetPos = new Vec3(posGrid.x * GRID_SIZE + HALF_GRID_SIZE, posGrid.y * GRID_SIZE + HALF_GRID_SIZE, 0);
        this.PosGrid = posGrid;
        this.Node.position = targetPos;
    }
}



import { _decorator, Component, Node, Sprite, UITransform, Vec2, Vec3, math } from 'cc';
import { GameMap } from './GameMap';
import { GRID_SIZE, HALF_GRID_SIZE } from './MapGenerator';
import { JPSNode } from './PathFind/JPS';
import { ResManager } from './ResManager';
const { ccclass, property } = _decorator;

//显示地图上的行走路径
export class MapPath {

    nodeArray:Array<Node>;

    way:Array<JPSNode<any>>;

    rootNode:Node;

    constructor(path:Array<JPSNode<any>>) {
        if (path.length == 0) {
            return;
        }
        this.way = path;
        this.rootNode = new Node("PathRoot");
        this.rootNode.parent = GameMap.Instance.SceneMidRoot;
        this.nodeArray = new Array<Node>();
        for (var i = 0; i < path.length; i++) {
            var node = new Node("wayPoint" + i);
            node.parent = this.rootNode;
            var pathNode = path[i];
            var spr = node.addComponent(Sprite);
            var trans = node.getComponent(UITransform);
            if (i == path.length - 1) {
                spr.spriteFrame = ResManager.Instance.getUISpr("moveTarget");
                trans.setContentSize(GRID_SIZE / 1.5, GRID_SIZE / 1.5);
            }else{
                spr.spriteFrame = ResManager.Instance.getUISpr("arrow");
                var nextPathNode = path[i + 1];
                var dir = new Vec2(nextPathNode.corde.x - pathNode.corde.x, nextPathNode.corde.y - pathNode.corde.y);
                if (dir.x > 0 && dir.y > 0) {
                    math.Quat.fromEuler(node.rotation, 0, 0, 45);
                }else if (dir.x > 0 && dir.y < 0) {
                    math.Quat.fromEuler(node.rotation, 0, 0, -45);
                }else if (dir.x > 0 && dir.y == 0) {
                    math.Quat.fromEuler(node.rotation, 0, 0, 0);
                }else if (dir.x < 0 && dir.y == 0) {
                    math.Quat.fromEuler(node.rotation, 0, 0, 180);
                }else if (dir.x < 0 && dir.y > 0) {
                    math.Quat.fromEuler(node.rotation, 0, 0, 135);
                }else if (dir.x < 0 && dir.y < 0) {
                    math.Quat.fromEuler(node.rotation, 0, 0, -135);
                }else if (dir.x == 0 && dir.y > 0) {
                    math.Quat.fromEuler(node.rotation, 0, 0, 90);
                }else if (dir.x == 0 && dir.y < 0) {
                    math.Quat.fromEuler(node.rotation, 0, 0, -90);
                }
                trans.setContentSize(GRID_SIZE / 1.2, GRID_SIZE / 1.2);
            }
            node.position = new Vec3(pathNode.corde.x * GRID_SIZE + HALF_GRID_SIZE, pathNode.corde.y * GRID_SIZE + HALF_GRID_SIZE, 0);
            this.nodeArray.push(node);
        }
        this.hideNode(0);
    }

    public destory() {
        this.rootNode.destroy();
    }

    public hideNode(idx:number) {
        this.nodeArray[idx].active = false;
    }
}



import { _decorator, Component, Node, Vec2, Vec3, Sprite, UITransform, tween } from 'cc';
import { GameMap } from './GameMap';
import { GRID_SIZE, HALF_GRID_SIZE } from './MapGenerator';
import { MapPath } from './MapPath';
import { JPSNode } from './PathFind/JPS';
import { HeroData } from './Player';
import { ResManager } from './ResManager';

const HERO_MOVE_SPEED = GRID_SIZE * 2;

export class MapHero {
    private _data:HeroData;
    public PosGrid:Vec2;
    public Node:Node; //英雄节点
    private _rangeOfGrids:Array<Vec2>;
    private _pathIdx:number;
    private _way:Array<JPSNode<any>>;
    private _movePathCallback:Function;

    constructor(data:HeroData) {
        this._data = data;
        this._rangeOfGrids = new Array<Vec2>();
    }

    public enterScene(posGrid:Vec2, parentNode:Node) {
        if (this.Node == null) {
            var node = new Node(this._data.Name);
            node.parent = parentNode;
            this.Node = node;
            var spr = node.addComponent(Sprite);
            spr.spriteFrame = ResManager.Instance.getHeroSpr(this._data.Class, 0, this._data.Rank);
            var trans = this.Node.addComponent(UITransform);
            trans.setAnchorPoint(0.5, 0.5);
            trans.setContentSize(GRID_SIZE, GRID_SIZE);
        }
        this.moveTo(posGrid, null);
    }

    public moveTo(posGrid:Vec2, onMoveDone:Function) {
        var isFirstMove = false;
        var diffX = 0;
        if (this.PosGrid) {
            diffX = posGrid.x - this.PosGrid.x;
        }else {
            isFirstMove = true;
        }
        var targetPos = new Vec3(posGrid.x * GRID_SIZE + HALF_GRID_SIZE, posGrid.y * GRID_SIZE + HALF_GRID_SIZE, 0);
        if (isFirstMove) {
            this.leaveRange();
            this.PosGrid = posGrid;
            this.Node.position = targetPos;
            this.enterRange();
        }else {
            var hero = this;
            tween(this.Node)
            .to(GRID_SIZE / HERO_MOVE_SPEED, { position: targetPos})
            .call(() => {
                hero.leaveRange();
                hero.PosGrid = posGrid;
                hero.Node.position = targetPos;    
                hero.enterRange(); 
                if (onMoveDone) {
                    onMoveDone();
                }
            })
            .start();
        }
        //根据移动方向调整人物方向
        if (diffX > 0) {
            this.Node.setScale(-1, 1, 1);
        }else if (diffX < 0) {
            this.Node.setScale(1, 1, 1);
        }
    }

    public movePath(path:MapPath, callback:Function) {
        this._pathIdx = 1; //第一个目标点是起始点的下一个所以是路径的第二个元素
        this._way = path.way;
        this._movePathCallback = callback;
        this.continueMove();
    }

    private continueMove() {
        var hero = this;
        this.moveTo(this._way[this._pathIdx].corde, function() {
            hero._pathIdx++;
            if (hero._pathIdx == hero._way.length) {
                hero._movePathCallback();
            }else{
                hero.continueMove();
            }
        });
    }

    private leaveRange() {
        this._rangeOfGrids.forEach(gridPos => {
            GameMap.Instance.gridLeaveRange(gridPos);
        })
        this._rangeOfGrids.length = 0;
    }

    private enterRange() {
        var posGrid = this.PosGrid;
        var range = this._data.ViewRange;
        var range2 = range * range;
        for (var y = posGrid.y - range; y <= posGrid.y + range; y++) {
            for (var x = posGrid.x - range; x <= posGrid.x + range; x++) {
                var distX = x - posGrid.x; var distY = y - posGrid.y;
                var dist = distX * distX + distY * distY;
                var endPos = new Vec2(x, y);
                if (dist <= range2 && GameMap.Instance.canSee(posGrid, endPos)) {
                    GameMap.Instance.gridEnterRange(endPos);
                    this._rangeOfGrids.push(endPos);
                }
            }
        }
    }

    public getViewRange() {
        return this._data.ViewRange;
    }
}




import { _decorator, Component, Node, Button, Vec2 } from 'cc';
import { GameMap } from '../GameMap';
const { ccclass, property } = _decorator;
 
@ccclass('MovePanel')
export class MovePanel extends Component {
    
    @property({type:Button})
    BtnUp:Button;

    @property({type:Button})
    BtnDown:Button;

    @property({type:Button})
    BtnLeft:Button;

    @property({type:Button})
    BtnRight:Button;

    start () {
        this.BtnUp.node.on(Button.EventType.CLICK, this.onMoveUp, this);
        this.BtnDown.node.on(Button.EventType.CLICK, this.onMoveDown, this);
        this.BtnLeft.node.on(Button.EventType.CLICK, this.onMoveLeft, this);
        this.BtnRight.node.on(Button.EventType.CLICK, this.onMoveRight, this);
    }

    onMove(x:number, y:number) {
        if (GameMap.Instance.Data.isStaticBlock(x, y)) {
            return;
        }

        var gridPos = new Vec2(x, y);
        GameMap.Instance.Player.CurHero.moveTo(gridPos); 
    }

    onMoveUp() {
        var x = GameMap.Instance.Player.CurHero.PosGrid.x;
        var y = GameMap.Instance.Player.CurHero.PosGrid.y;
        this.onMove(x, y + 1);
    }

    onMoveDown() {
        var x = GameMap.Instance.Player.CurHero.PosGrid.x;
        var y = GameMap.Instance.Player.CurHero.PosGrid.y;
        this.onMove(x, y - 1);
    }

    onMoveLeft() {
        var x = GameMap.Instance.Player.CurHero.PosGrid.x;
        var y = GameMap.Instance.Player.CurHero.PosGrid.y;
        this.onMove(x - 1, y);
    }

    onMoveRight() {
        var x = GameMap.Instance.Player.CurHero.PosGrid.x;
        var y = GameMap.Instance.Player.CurHero.PosGrid.y;
        this.onMove(x + 1, y);
    }
}


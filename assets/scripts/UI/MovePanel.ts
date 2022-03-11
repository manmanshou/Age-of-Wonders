
import { _decorator, Component, Node, Button, Vec2, Sprite } from 'cc';
import { GameMap } from '../GameMap';
const { ccclass, property } = _decorator;
 
@ccclass('MovePanel')
export class MovePanel extends Component {
    
    @property({type:Button})
    BtnUp:Button;

    @property({type:Button})
    BtnUpPick:Button;

    @property({type:Button})
    BtnDown:Button;

    @property({type:Button})
    BtnDownPick:Button;

    @property({type:Button})
    BtnLeft:Button;

    @property({type:Button})
    BtnLeftPick:Button;

    @property({type:Button})
    BtnRight:Button;

    @property({type:Button})
    BtnRightPick:Button;

    public static Instance:MovePanel;

    start () {
        this.BtnUp.node.on(Button.EventType.CLICK, this.onMoveUp, this);
        this.BtnDown.node.on(Button.EventType.CLICK, this.onMoveDown, this);
        this.BtnLeft.node.on(Button.EventType.CLICK, this.onMoveLeft, this);
        this.BtnRight.node.on(Button.EventType.CLICK, this.onMoveRight, this);

        this.BtnUpPick.node.on(Button.EventType.CLICK, this.onPickUp, this);
        MovePanel.Instance = this;
    }

    private onMove(gridPos:Vec2) {
        if (GameMap.Instance.hasBlock(gridPos)) {
            return;
        }
        this.disableAllButton();
        var panel = this;
        GameMap.Instance.Player.CurHero.moveTo(gridPos, function() {
            panel.updateButtonState();
        }); 
    }

    private disableAllButton() {
        this.BtnUp.interactable = false;
        this.BtnDown.interactable = false;
        this.BtnRight.interactable = false;
        this.BtnLeft.interactable = false;
        this.updateButtonGray();
    }

    private updateButtonGray() {
        this.BtnUp.node.getComponentInChildren(Sprite).grayscale = !this.BtnUp.interactable;
        this.BtnDown.node.getComponentInChildren(Sprite).grayscale = !this.BtnDown.interactable;
        this.BtnRight.node.getComponentInChildren(Sprite).grayscale = !this.BtnRight.interactable;
        this.BtnLeft.node.getComponentInChildren(Sprite).grayscale = !this.BtnLeft.interactable;
    }

    //根据各方向阻挡情况设置移动按钮的状态
    public updateButtonState() {
        var pos = GameMap.Instance.Player.CurHero.PosGrid;
        var downPos = new Vec2(pos.x, pos.y - 1);
        var upPos = new Vec2(pos.x, pos.y + 1);
        var leftPos = new Vec2(pos.x - 1, pos.y);
        var rightPos = new Vec2(pos.x + 1, pos.y);
        this.BtnUp.interactable = !GameMap.Instance.hasBlock(upPos);
        this.BtnDown.interactable = !GameMap.Instance.hasBlock(downPos);
        this.BtnRight.interactable = !GameMap.Instance.hasBlock(rightPos);
        this.BtnLeft.interactable = !GameMap.Instance.hasBlock(leftPos);
        
        this.BtnUpPick.node.active = GameMap.Instance.getMapObject(upPos) != null;
        this.BtnDownPick.node.active = GameMap.Instance.getMapObject(downPos) != null;
        this.BtnLeftPick.node.active = GameMap.Instance.getMapObject(leftPos) != null;
        this.BtnRightPick.node.active = GameMap.Instance.getMapObject(rightPos) != null;
        this.updateButtonGray();
    }

    private onMoveUp() {
        var x = GameMap.Instance.Player.CurHero.PosGrid.x;
        var y = GameMap.Instance.Player.CurHero.PosGrid.y;
        this.onMove(new Vec2(x, y + 1));
    }

    private onMoveDown() {
        var x = GameMap.Instance.Player.CurHero.PosGrid.x;
        var y = GameMap.Instance.Player.CurHero.PosGrid.y;
        this.onMove(new Vec2(x, y - 1));
    }

    private onMoveLeft() {
        var x = GameMap.Instance.Player.CurHero.PosGrid.x;
        var y = GameMap.Instance.Player.CurHero.PosGrid.y;
        this.onMove(new Vec2(x - 1, y));
    }

    private onMoveRight() {
        var x = GameMap.Instance.Player.CurHero.PosGrid.x;
        var y = GameMap.Instance.Player.CurHero.PosGrid.y;
        this.onMove(new Vec2(x + 1, y));
    }

    private onPick(gridPos:Vec2) {
        var obj = GameMap.Instance.getMapObject(gridPos);
        if (obj == null) {
            return;
        }
        obj.onPick();
    }

    private onPickUp() {
        var x = GameMap.Instance.Player.CurHero.PosGrid.x;
        var y = GameMap.Instance.Player.CurHero.PosGrid.y;
        this.onPick(new Vec2(x, y + 1));
    }
}


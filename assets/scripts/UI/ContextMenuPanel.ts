
import { _decorator, Component, Node, Button, Vec2, Sprite, Vec3 } from 'cc';
import { GameMap } from '../GameMap';
const { ccclass, property } = _decorator;
 
@ccclass('ContextMenuPanel')
export class ContextMenuPanel extends Component {
    
    @property({type:Button})
    BtnMoveTo:Button;

    @property({type:Button})
    BtnPick:Button;

    public static Instance:ContextMenuPanel;

    start () {
        ContextMenuPanel.Instance = this;
        this.BtnMoveTo.node.on(Button.EventType.CLICK, this.onMoveTo, this);
        this.BtnPick.node.on(Button.EventType.CLICK, this.onPick, this);
        this.BtnMoveTo.node.active = false;
        this.BtnPick.node.active = false;
    }

    public show(pos:Vec2, move:boolean, pick:boolean) {
        var uiWorldPos = GameMap.Instance.gridPosToUIWorldPos(pos);        
        this.BtnMoveTo.node.active = false;
        this.BtnPick.node.active = false;
        this.node.setWorldPosition(uiWorldPos);
        if (move) {
            this.BtnMoveTo.node.active = true;
        }
        if (pick) {
            this.BtnPick.node.active = true;
        }
    }

    public hide() {
        this.BtnMoveTo.node.active = false;
        this.BtnPick.node.active = false;
    }

    private onMoveTo() {
        GameMap.Instance.startMove();
        this.hide();
    }

    private onPick() {
        GameMap.Instance
        this.hide();
    }
}


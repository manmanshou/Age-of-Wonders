
import { _decorator, Component, Node, Camera } from 'cc';
import { DataManager } from './DataManager';
import { GameMap } from './GameMap';
const { ccclass, property } = _decorator;
 
@ccclass('GameStart')
export class GameStart extends Component {

    @property({type:Node})
    sceneRoot:Node = null;

    @property({type:Node})
    spriteRoot:Node = null;

    @property({type:Camera})
    camera:Camera = null;

    start () {
        DataManager.loadMap();

        GameMap.init(this.sceneRoot,this.spriteRoot, this.camera);
    }
}



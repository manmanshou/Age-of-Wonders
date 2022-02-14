
import { _decorator, Node, Vec2 } from 'cc';
import { MapData, MapGenerator } from './MapGenerator';
import { PlayerData } from './Player';

export class DataManager {
    public static MapData: MapData;

    public static PlayerData: PlayerData;

    public static loadMap() {
        console.log("start map loading...");
        DataManager.MapData = MapGenerator.genMap(new Vec2(3,3), 12, 811);
    }

    public static loadPlayer() {
        this.PlayerData = PlayerData.New();
    }
}

import { Mesh } from "../mesh/Mesh";
import { Camera } from "../camera/Camera";
import { Material } from "../material/Material";
import { Model } from "../model/Model";

export class Scene 
{
    name : string;
    cameras: Array<Camera> = []
    activeCamera: number = 0;

    models: Array<Model> = [];
    meshes: Array<Mesh> = [];
    materials: Array<Material> = [];
}
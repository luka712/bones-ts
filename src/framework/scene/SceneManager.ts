import { FreeCamera } from "../camera/FreeCamera";
import { Framework } from "../Framework";
import { BasicMaterial } from "../material/BasicMaterial";
import { MaterialManager } from "../material/manager/MaterialManager";
import { Mesh } from "../mesh/Mesh";
import { Scene } from "./Scene";

export class SceneManager 
{
    private m_activeScene?: Scene;


    constructor(private m_framework: Framework)
    {
        
    }
    public initialize(): void 
    {
        const testScene = new Scene();
        testScene.cameras = [ new FreeCamera(this.m_framework)];
        testScene.activeCamera = 0; 

        testScene.materials = [
            new BasicMaterial()
        ]

        testScene.meshes = [
            new Mesh(this.m_framework, this.m_framework.geometryBuilder.buildCubeGeometry())
        ];

        testScene.meshes.forEach(x => x.initialize());

        testScene.models = [
            {
                meshes: [0]
            }
        ]

        this.m_activeScene = testScene;
    }

    public update(deltaTime: number) 
    {
        if(!this.m_activeScene) return;
        

        this.m_activeScene.cameras[this.m_activeScene.activeCamera].update(deltaTime);
    }

    public draw() 
    {
        if(!this.m_activeScene) return;

        const camera = this.m_activeScene.cameras[this.m_activeScene.activeCamera];

        for(const model of this.m_activeScene.models)
        {
            // for all meshes of a model
            for(const meshIndex of model.meshes)
            {
                const mesh = this.m_activeScene.meshes[meshIndex];
                const material = this.m_activeScene.materials[mesh.material];

                // wrapper around WebGLShaderProgram or GPURenderPipeline
                const backendRenderWrapper = this.m_framework.materialManager.provide(material);

                backendRenderWrapper.render(camera, mesh, material);
            }
        }
    }
}
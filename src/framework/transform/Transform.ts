import { Mat4x4, Vec3 } from "../bones_math";

export class Transform 
{
    public position = Vec3.zero();
    public rotation = Vec3.zero();
    public scale = Vec3.one();
    public transform = Mat4x4.identity();

    private o_matrix = Mat4x4.identity();

    public update (): void 
    {
        this.transform.setToIdentity();

        // translate
        Mat4x4.translationMatrixFromVector(this.position, this.o_matrix);
        this.transform.multiply(this.o_matrix);

        // rotate
        Mat4x4.rotationX(this.rotation[0], this.o_matrix);
        this.transform.multiply(this.o_matrix);
        Mat4x4.rotationY(this.rotation[1], this.o_matrix);
        this.transform.multiply(this.o_matrix);
        Mat4x4.rotationZ(this.rotation[2], this.o_matrix);
        this.transform.multiply(this.o_matrix);

        // scale 
        Mat4x4.scaleMatrixFromVector(this.scale, this.o_matrix);
        this.transform.multiply(this.o_matrix);
    }


}

/*
TransformComponent& TransformComponent::SetPosition(const vec3& pos)
{
    m_position = pos; 

    return *this;
}

TransformComponent& TransformComponent::SetPosition(float x, float y, float z)
{
    m_position.x = x;
    m_position.y = y;
    m_position.z = z;

    return *this;
}

TransformComponent& TransformComponent::SetScale(const vec3& scale)
{
    m_scale = scale;

    return *this;
}

TransformComponent& TransformComponent::SetScale(float x, float y, float z)
{
    m_scale.x = x;
    m_scale.y = y;
    m_scale.z = y;

    return *this;
}


void TransformComponent::UseTransform(GLint transformLocation) const
{
    glUniformMatrix4fv(transformLocation, 1, GL_FALSE, value_ptr(this->transform));
}

const float TransformComponent::DistanceFrom(const vec3& otherPos) const 
{
    return length(m_position - otherPos);
}

const float TransformComponent::DistanceFrom(const TransformComponent& other) const
{
    return this->DistanceFrom(other.m_position);
}

#if EMSCRIPTEN_RUNTIME 

using namespace emscripten;

EMSCRIPTEN_BINDINGS(TransformComponent_JS)
{
    class_<BaseComponent>("BaseComponent");

    class_<TransformComponent, base<BaseComponent>>("TransformComponent")
        .constructor()
        .function("GetPosition", &TransformComponent::GetPosition)
        .function("SetPosition", select_overload<TransformComponent& (float, float, float)>(&TransformComponent::SetPosition))
        .function("SetScale", select_overload<TransformComponent& (float, float, float)>(&TransformComponent::SetScale))
        .function("GetScale", &TransformComponent::GetScale);
}

#endif*/
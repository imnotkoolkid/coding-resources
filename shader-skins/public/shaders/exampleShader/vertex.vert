#include <skinning_pars_vertex>

varying vec2 vUv;

void main() {

    // needed in order for SkinnedMesh animation to work, use transformed after this instead of position
    #include <skinbase_vertex>
    #include <begin_vertex>
    #include <skinning_vertex>

    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}

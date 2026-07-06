export const vertexShaderSource = `#version 300 es
precision highp float;

in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uEnergy;
uniform float uDensity;
uniform float uPhase;
uniform float uTension;
uniform int uNodeCount;
uniform vec4 uNodes[8];

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = vUv;
  vec2 center = vec2(0.5);
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 fieldUv = vec2((uv.x - 0.5) * aspect + 0.5, uv.y);
  float field = 0.0;
  float glow = 0.0;

  float compression = mix(0.72, 1.28, uTension);
  vec2 distorted = fieldUv + (noise(fieldUv * (8.0 + uDensity * 18.0) + uTime * 0.035) - 0.5) * 0.018 * (1.0 - uTension * 0.45);

  for (int i = 0; i < 8; i++) {
    if (i >= uNodeCount) {
      break;
    }
    vec4 node = uNodes[i];
    vec2 source = vec2((node.x - 0.5) * aspect + 0.5, node.y);
    float distanceToNode = distance(distorted, source) * compression;
    float frequency = node.w * mix(0.9, 2.2, uDensity);
    float phase = uPhase * 6.2831853 + float(i) * 0.55;
    float wave = cos(distanceToNode * frequency * 18.0 - uTime * (0.48 + uEnergy * 1.2) + phase);
    field += wave * node.z / max(distanceToNode * 9.0, 0.65);
    glow += exp(-distanceToNode * (15.0 - uEnergy * 6.0)) * node.z;
  }

  float radial = cos(distance(fieldUv, center) * (36.0 + uDensity * 50.0) - uTime * 0.45 + uPhase * 6.2831853);
  field += radial * 0.18 * uEnergy;

  float bands = smoothstep(0.25, 1.0, abs(field));
  float softGlow = pow(clamp(glow * 0.32 + bands * 0.38, 0.0, 1.0), 1.8);
  vec3 graphite = vec3(0.018, 0.021, 0.021);
  vec3 silver = vec3(0.58, 0.63, 0.61);
  vec3 spectral = vec3(0.42, 0.55, 0.62);
  vec3 color = graphite + silver * softGlow * (0.18 + uEnergy * 0.34);
  color += spectral * pow(softGlow, 2.4) * 0.12 * (0.25 + uTension);

  float alpha = clamp(softGlow * (0.36 + uEnergy * 0.34), 0.0, 0.82);
  outColor = vec4(color, alpha);
}
`;

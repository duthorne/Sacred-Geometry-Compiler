import type { EnergyUniformSnapshot } from "./types";
import { fragmentShaderSource, vertexShaderSource } from "./shaders";

export class EnergyRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vertexBuffer: WebGLBuffer;
  private readonly uniforms: {
    resolution: WebGLUniformLocation;
    time: WebGLUniformLocation;
    energy: WebGLUniformLocation;
    density: WebGLUniformLocation;
    phase: WebGLUniformLocation;
    tension: WebGLUniformLocation;
    nodeCount: WebGLUniformLocation;
    nodes: WebGLUniformLocation;
  };

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false });
    if (!gl) {
      throw new Error("WebGL2 is not available");
    }
    this.gl = gl;
    this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      throw new Error("Unable to create WebGL vertex buffer");
    }
    this.vertexBuffer = vertexBuffer;
    this.uniforms = this.getUniforms();
    this.initializeGeometry();
  }

  render(snapshot: EnergyUniformSnapshot, width: number, height: number): void {
    const gl = this.gl;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.program);
    gl.uniform2f(this.uniforms.resolution, snapshot.resolution[0], snapshot.resolution[1]);
    gl.uniform1f(this.uniforms.time, snapshot.time);
    gl.uniform1f(this.uniforms.energy, snapshot.energy);
    gl.uniform1f(this.uniforms.density, snapshot.density);
    gl.uniform1f(this.uniforms.phase, snapshot.phase);
    gl.uniform1f(this.uniforms.tension, snapshot.tension);
    gl.uniform1i(this.uniforms.nodeCount, snapshot.nodeCount);
    gl.uniform4fv(this.uniforms.nodes, snapshot.nodeData);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private initializeGeometry(): void {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const position = gl.getAttribLocation(this.program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  }

  private createShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error("Unable to create WebGL shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) ?? "WebGL shader compilation failed");
    }
    return shader;
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const gl = this.gl;
    const program = gl.createProgram();
    if (!program) {
      throw new Error("Unable to create WebGL program");
    }
    gl.attachShader(program, this.createShader(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, this.createShader(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "WebGL program link failed");
    }
    return program;
  }

  private requireUniform(name: string): WebGLUniformLocation {
    const location = this.gl.getUniformLocation(this.program, name);
    if (!location) {
      throw new Error(`Missing WebGL uniform ${name}`);
    }
    return location;
  }

  private getUniforms(): EnergyRenderer["uniforms"] {
    return {
      resolution: this.requireUniform("uResolution"),
      time: this.requireUniform("uTime"),
      energy: this.requireUniform("uEnergy"),
      density: this.requireUniform("uDensity"),
      phase: this.requireUniform("uPhase"),
      tension: this.requireUniform("uTension"),
      nodeCount: this.requireUniform("uNodeCount"),
      nodes: this.requireUniform("uNodes")
    };
  }
}

import React from 'react';
import ShaderBackground from "./shader-background";

const ShaderBackgroundDemo = () => {
  return (
    <div className="relative w-full h-[500px] border rounded-xl overflow-hidden shadow-2xl">
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <h2 className="text-white text-4xl font-bold font-sora drop-shadow-lg">
          Shader Background Demo
        </h2>
      </div>
      <ShaderBackground />
    </div>
  );
};

export { ShaderBackgroundDemo };

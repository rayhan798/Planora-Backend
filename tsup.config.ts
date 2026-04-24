import { defineConfig } from "tsup";
import { tr } from "zod/locales";

export default defineConfig({
  entry: ["src/server.ts"], 
  format: ["cjs", "esm"],  
  target: "esnext",
  outDir: "dist",
  bundle: true,
  dts: true,               
  splitting: false,
  sourcemap: true,        
  clean: true,            
//   minify: true,            
//   shims: true,  
banner: {
    js: `
        import { createRequire } from "module";
        const require = createRequire(import.meta.url);
    
    `,

  },

});
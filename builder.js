//Укажите локальный домен, с которого будет livereload
const youDomain = "tochka2.far";

const entryCss = 'css/app.css';
const entryJS = 'js/app.js';
const outCss = 'dist/build.css';
const outJS = 'dist/build.js';

import { init, reload } from "browser-sync";
import { copyFileSync, readFile, writeFileSync } from 'fs';
import postcssImport from 'postcss-import';
import postcssCsso from 'postcss-csso';
import postcss from 'postcss';
import { build } from 'esbuild';

const type = process.argv[2];

const externalImagesFontPlugin = {
    name: 'Resolve external files',
    setup(buildInstance) {
        buildInstance.onResolve({ filter: /\/img\// }, args => {
            return { path: args.path, external: true }
        })
        buildInstance.onResolve({ filter: /\/fonts\// }, args => {
            return { path: args.path, external: true }
        })
    },
}

const buildJS = async () => {
    try {
        return await build({
            entryPoints: [entryJS],
            bundle: true,
            minify: true,
            sourcemap: true,
            outfile: outJS,
            plugins: [externalImagesFontPlugin],
        });
    } catch {
        console.log("Ошибка в JS");
    }
}
buildJS();

if(type == "--dev"){
    console.log("Development:");
    copyFileSync(entryCss, outCss);
    init({
        proxy: youDomain,
        watch: true,
        ui: false,
        injectChanges: true,
        files: [
            {
                match: ['css/**/*.css'],
                fn: (event, file) => {
                    copyFileSync(entryCss, outCss);
                    reload(outCss);
                }
            },{
                match: ['js/**/*.js'],
                fn: async () => {
                    await buildJS();
                    reload(outJS);
                }
            },{
                match: ['./index.php'],
                fn: (event, file) => {
                    reload(file);
                }
            }
        ]
    });
} else {
    console.log("Building");
    readFile(entryCss, (err, css) => {
        if(!css) { console.log('CSS file ' + entryCss + ' not found'); return; }
        postcss([postcssImport, postcssCsso])
            .process(css, { from: entryCss, to: outCss })
            .then(result => {
            writeFileSync(outCss, result.css);
            })
    });
}
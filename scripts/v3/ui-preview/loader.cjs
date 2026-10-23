// Test preview only: reuse the installed Next CSS loader, not product configuration.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Webpack loads this CommonJS loader synchronously.
const ts = require("typescript");
module.exports = function (source) {
  if (!this.resourcePath.endsWith(".css"))
    return ts.transpileModule(source, {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
  const getOptions = () => ({
    ...this.getOptions(),
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Installed PostCSS instance supplied to the Next loader API.
    postcss: async () => ({ postcss: require("postcss") }),
  });
  const context = Object.create(this, {
    getOptions: { value: getOptions },
    currentTraceSpan: {
      value: {
        traceChild() {
          return this;
        },
        traceAsyncFn(fn) {
          return fn();
        },
        traceFn(fn) {
          return fn();
        },
      },
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Reuse the installed CommonJS CSS loader without a new dependency.
  return require("next/dist/build/webpack/loaders/css-loader/src").default.call(
    context,
    source,
  );
};

// Inject compiled CSS only inside the isolated synthetic preview.
module.exports = function (source) {
  return (
    source.replace(
      "export default ___CSS_LOADER_EXPORT___;",
      "export default ___CSS_LOADER_EXPORT___.locals;",
    ) +
    '\nconst previewStyle=document.createElement("style");previewStyle.textContent=___CSS_LOADER_EXPORT___.toString();document.head.appendChild(previewStyle);'
  );
};

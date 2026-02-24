import path from "path";

export const getPublicIndexHtmlPath = (publicDir) => {
  return path.join(publicDir, "index.html");
};

export const getPublicLabHtmlPath = (publicDir, labRelativePath) => {
  return path.join(publicDir, "lab", labRelativePath);
};

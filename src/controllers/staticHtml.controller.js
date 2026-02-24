import * as StaticHtmlService from "../services/staticHtml.service.js";

export const getIndexPage = async (req, res) => {
  const publicDir = req.app.locals.publicDir;
  return res.sendFile(StaticHtmlService.getPublicIndexHtmlPath(publicDir));
};

export const getLabPage = (labRelativeHtmlPath) => {
  return async (req, res) => {
    const publicDir = req.app.locals.publicDir;
    return res.sendFile(
      StaticHtmlService.getPublicLabHtmlPath(publicDir, labRelativeHtmlPath),
    );
  };
};

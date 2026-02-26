import * as SessionService from "../services/session.service.js";
import * as UserModel from "../models/user.model.js";

export const sessionMiddleware = async (req, _res, next) => {
  try {
    const cookieName = SessionService.getSessionCookieName();
    const sid = req.cookies?.[cookieName];

    if (!sid) return next();

    const session = await SessionService.getValidSession(sid);
    if (!session) return next();

    const user = await UserModel.findById(session.user_id);
    if (!user) return next();

    req.session = session;
    req.user = user;

    SessionService.touchSession(sid).catch(() => {});

    return next();
  } catch (_error) {
    return next();
  }
};

export const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  return next();
};

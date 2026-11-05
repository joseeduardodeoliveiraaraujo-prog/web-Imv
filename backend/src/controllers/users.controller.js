import * as usersService from "../services/users.service.js";

export async function syncUser(req, res) {
  const user = await usersService.syncUser({
    name: req.validated.body.name,
    email: req.user.email,
    uid: req.user.uid,
    emailVerified: req.user.email_verified === true,
  });

  res.json(user);
}

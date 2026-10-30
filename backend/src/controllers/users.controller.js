import { validate } from "../../middleware/validate.js";
import { createUserSchema } from "../schemas/users.schema.js";
import * as usersService from "../services/users.service.js";

export async function syncUser(req, res) {
  try {
    const validation = validate(createUserSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.errors.join(", ") });
    }

    const { name } = validation.data;
    const user = await usersService.syncUser({
      name,
      email: req.user.email,
      uid: req.user.uid,
    });

    return res.json(user);
  } catch (error) {
    console.error("[ERROR] POST /users:", error.message);
    return res.status(500).json({ error: "Erro ao salvar usuário" });
  }
}

import { randomUUID } from "node:crypto";

const VALID_REQUEST_ID = /^[\w-]{1,64}$/;

/**
 * Identifica cada requisição para correlacionar logs com respostas.
 * Reaproveita um X-Request-Id válido vindo do cliente/proxy; senão gera um UUID.
 */
export default function requestId(req, res, next) {
  const incoming = req.get("x-request-id");

  req.id =
    incoming && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  res.set("X-Request-Id", req.id);

  next();
}

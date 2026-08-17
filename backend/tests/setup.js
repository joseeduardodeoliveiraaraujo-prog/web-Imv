import { vi } from "vitest";

vi.mock("../db.js", () => ({
  default: {
    query: vi.fn(),
  },
}));

vi.mock("../firebaseAdmin.js", () => ({
  default: {
    auth: () => ({
      verifyIdToken: vi.fn(),
    }),
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({
          data: { path: "test" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://test.com/file.jpg" },
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  }),
}));

vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from("test")),
  })),
}));

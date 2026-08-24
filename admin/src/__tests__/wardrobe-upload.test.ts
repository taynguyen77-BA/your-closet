import { NextRequest } from "next/server";
import { POST } from "@/app/api/wardrobe/upload/route";
import { authenticate } from "@/lib/server/authorize";
import { adminStorage } from "@/lib/server/firebase-admin";

jest.mock("@/lib/server/authorize", () => ({ authenticate: jest.fn() }));
jest.mock("@/lib/server/firebase-admin", () => ({ adminStorage: { bucket: jest.fn() } }));

const auth = authenticate as jest.Mock;
const bucket = adminStorage.bucket as jest.Mock;
const save = jest.fn();

function requestWithFile(file?: File, headers: Record<string, string> = {}) {
  const form = new FormData();
  if (file) form.append("image", file);
  return new NextRequest("http://localhost/api/wardrobe/upload", {
    method: "POST",
    headers: { "x-request-id": "upload-test", ...headers },
    body: form,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  auth.mockResolvedValue({ uid: "user-1", isAdmin: false });
  save.mockResolvedValue(undefined);
  bucket.mockReturnValue({ name: "wardro-test.appspot.com", file: jest.fn(() => ({ save })) });
});

describe("wardrobe upload boundary", () => {
  test("rejects unauthenticated upload before Storage access", async () => {
    auth.mockResolvedValue(null);
    const response = await POST(requestWithFile(new File([new Uint8Array([0xff, 0xd8, 0xff])], "x.jpg", { type: "image/jpeg" })));
    expect(response.status).toBe(401);
    expect(bucket).not.toHaveBeenCalled();
  });

  test("rejects unsupported MIME type", async () => {
    const response = await POST(requestWithFile(new File(["not-image"], "x.gif", { type: "image/gif" })));
    expect(response.status).toBe(415);
    expect(save).not.toHaveBeenCalled();
  });

  test("rejects a content-type spoof with invalid image signature", async () => {
    const response = await POST(requestWithFile(new File(["not-image"], "x.png", { type: "image/png" })));
    expect(response.status).toBe(415);
    expect(save).not.toHaveBeenCalled();
  });

  test("validates and stores an owned image with a safe server-generated path", async () => {
    const response = await POST(requestWithFile(new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "../../x.png", { type: "image/png" })));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data).toMatchObject({ contentType: "image/png", sizeBytes: 8 });
    expect(body.data.path).toMatch(/^users\/user-1\/clothes\/[a-zA-Z0-9_-]{10,80}\.png$/);
    expect(save).toHaveBeenCalledWith(expect.any(Buffer), expect.objectContaining({ metadata: expect.objectContaining({ contentType: "image/png" }) }));
  });
});

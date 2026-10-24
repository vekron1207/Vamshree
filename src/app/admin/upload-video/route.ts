import { connection } from "next/server";
import { getAdminSession } from "@/lib/session";
import { saveVideoUpload } from "@/lib/uploads";

// Video uploads go through a plain route (not a server action) because they are
// much bigger than the image limit. Admins only.
export async function POST(request: Request) {
  await connection();
  if (!(await getAdminSession())) {
    return Response.json({ ok: false, error: "Please sign in again." }, { status: 401 });
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ ok: false, error: "Choose a video file." }, { status: 400 });
    const url = await saveVideoUpload(file);
    return Response.json({ ok: true, url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "The upload failed.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

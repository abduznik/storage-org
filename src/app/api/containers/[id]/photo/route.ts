import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { requireUser } from "@/lib/api-helpers";
import {
  getContainerById,
  updateContainer,
  userCanAccessContainer,
} from "@/lib/containers";
import { uploadsDir } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const container = getContainerById(id);
  if (!container) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!userCanAccessContainer(auth.user.id, id)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("photo");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No photo provided." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const filename = `${id}-${randomBytes(6).toString("hex")}.webp`;
  const outputPath = path.join(uploadsDir, filename);

  try {
    await sharp(inputBuffer)
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outputPath);
  } catch {
    return NextResponse.json(
      { error: "That file doesn't look like a valid image." },
      { status: 400 }
    );
  }

  // Clean up the old photo file if one existed.
  if (container.photo_path) {
    const oldPath = path.join(uploadsDir, container.photo_path);
    fs.unlink(oldPath).catch(() => {});
  }

  updateContainer(id, { photo_path: filename });
  return NextResponse.json({ photo_path: filename });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const container = getContainerById(id);
  if (!container) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!userCanAccessContainer(auth.user.id, id)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (container.photo_path) {
    const oldPath = path.join(uploadsDir, container.photo_path);
    fs.unlink(oldPath).catch(() => {});
  }
  updateContainer(id, { photo_path: null });
  return NextResponse.json({ ok: true });
}

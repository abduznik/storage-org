import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { requireUser } from "@/lib/api-helpers";
import { getItemById, updateItem, userCanAccessContainer } from "@/lib/containers";
import { uploadsDir } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id, itemId } = await params;

  if (!userCanAccessContainer(auth.user.id, id)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const item = getItemById(Number(itemId));
  if (!item || item.container_id !== id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("photo");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No photo provided." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const filename = `item-${itemId}-${randomBytes(6).toString("hex")}.webp`;
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

  if (item.photo_path) {
    const oldPath = path.join(uploadsDir, item.photo_path);
    fs.unlink(oldPath).catch(() => {});
  }

  updateItem(Number(itemId), { photo_path: filename });
  return NextResponse.json({ photo_path: filename });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id, itemId } = await params;

  if (!userCanAccessContainer(auth.user.id, id)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const item = getItemById(Number(itemId));
  if (!item || item.container_id !== id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (item.photo_path) {
    const oldPath = path.join(uploadsDir, item.photo_path);
    fs.unlink(oldPath).catch(() => {});
  }
  updateItem(Number(itemId), { photo_path: null });
  return NextResponse.json({ ok: true });
}

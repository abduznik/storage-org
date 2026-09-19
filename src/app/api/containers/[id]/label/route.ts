import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import sharp from "sharp";
import { requireUser } from "@/lib/api-helpers";
import { getContainerById, userCanAccessContainer } from "@/lib/containers";
import { getBaseUrl } from "@/lib/url";

// Renders a printable label: QR code with the container's short ID printed
// underneath, as a single flattened PNG suitable for Niimbot or paper.
export async function GET(
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

  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/c/${id}`;

  const qrSize = 500;
  const qrBuffer = await QRCode.toBuffer(url, {
    type: "png",
    width: qrSize,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const labelHeight = 90;
  const canvasWidth = qrSize;
  const canvasHeight = qrSize + labelHeight;

  const idText = container.id;
  const svgLabel = `
    <svg width="${canvasWidth}" height="${labelHeight}">
      <rect width="100%" height="100%" fill="white" />
      <text x="50%" y="65%" text-anchor="middle" font-family="'DejaVu Sans Mono', monospace, 'Courier New'"
            font-size="56" font-weight="bold" fill="black" letter-spacing="6">${idText}</text>
    </svg>
  `;

  const composed = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: qrBuffer, top: 0, left: 0 },
      { input: Buffer.from(svgLabel), top: qrSize, left: 0 },
    ])
    .png()
    .toBuffer();

  return new NextResponse(new Uint8Array(composed), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="container-${id}-label.png"`,
    },
  });
}

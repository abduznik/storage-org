import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireUser } from "@/lib/api-helpers";
import { getContainerById, userCanAccessContainer } from "@/lib/containers";
import { getBaseUrl } from "@/lib/url";

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

  const pngBuffer = await QRCode.toBuffer(url, {
    type: "png",
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  return new NextResponse(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}

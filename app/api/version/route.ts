export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_BUILD_VERSION ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    "dev";

  return Response.json(
    {
      version,
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      timestamp: Date.now(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}
